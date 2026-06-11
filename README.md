# 2. Backend Design

## 2.1. Technology Stack

| Concern | Choice | Version | Justification |
|---|---|---|---|
| API Style | REST + OpenAPI | — | Frontend `apiClient` already REST; Swagger auto-gen in Nest |
| Language | TypeScript / Node.js | 5.5 / 20 LTS | **Reuse frontend `types.ts` 1:1** (`Product`, `QrTicket`, `ValidationResult`) → zero contract drift |
| Framework | NestJS | 10.4 | DI + modules map to template's layered design + Repository/Service/DTO patterns out-of-box |
| ORM/DB | Prisma 5.20 / PostgreSQL | 16 | Template schema is relational; Prisma migrations + type-safety |
| Async | BullMQ | 5.x | Analytics profiling + push notif queues (template 2.4) |
| Cache | Redis | 7.4 | Session state (stateless API), profile cache invalidation |
| File storage | Cloudflare R2 / AWS S3 | — | Product images |
| AI segment | External inference (OpenAI / local sklearn microservice) | — | Consumer profiling classifier |
| Hosting | Railway / Render / AWS ECS | — | Docker; cheap demo, scalable |
| Architecture | **Modular monolith + separate analytics worker** | — | Matches DesignAssistantPrompt's container diagram exactly |

### This next technology stack is the final evolution for a production deployment:

| Concern | Choice | Version | Justification |
|---------|--------|---------|---------------|
| **API Style** | REST API | — | Standart comunication method between Client and Server with well defined contracts via Open AI |
| **Language** | Typescript | 6.0.3 | Static typing, less execution errors, great maintanability for big projects, excelent support for the AWS CDK ecosystem |
| **Framework** | AWS Lambda + API gateway | — | AWS native serverless framework, and API gateway to expose REST endpoints and WebSockets |
| **Database** | Amazon Aurora Postgre SQL | 17.0 + | Compatible database with PostgreSQL, scalable, high availability and completely manageable. Ideal for transactionable data such as sessions, products, user profiles |
| **Hosting** | AWS | — | Allows for a serverless architecture with automatic scalability. Complete integration with the services: Lambda, API Gateway, DynamoDB, SQS, SNS, S3, SageMaker. |
| **Async Processing** | AWS SQS + SNS | — | SQS for message queues and SNS for push notifications|
| **Caching** | Amazon Elasticache for Redis | 7.0 + | Low latency cache for active data sessions, user profiles and constant analytical queries |
| **File Storage** | Amazon S3 | — | Object storage, B2B reports and CI/CD artifacts |

## 2.2. Architecture — Implementation Guide

**Pattern**: Modular Monolith with Independent Worker Process

### Architectural Decision

| Aspect               | Decision                                                                 |
|-----------------------|--------------------------------------------------------------------------|
| Pattern               | Modular Monolith with Independent Worker Process                        |
| API Framework         | Single NestJS application (`apps/api`)                                   |
| Worker Process        | Standalone BullMQ consumer (`apps/analytics-worker`)                     |
| Module Separation     | Enforced at build time via ESLint import rules                           |
| Type Sharing          | Monorepo package `@smartcart/shared-types` consumed by both frontend and backend |
| Transaction Strategy  | Prisma `$transaction` with interactive callback for ACID operations      |
| Async Processing      | BullMQ queues for long-running analytics pipeline                        |
| Serverless Evolution  | Interface-based DI bindings — swap implementations, not domain logic     |


#### Implementation directives by concern

| Concern                       | What to Build                                                                 | How to Build It                                                                                                                                                | Key Principle                                           | Source Location                                                                                                                                                                                                 |
|-------------------------------|-------------------------------------------------------------------------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------|---------------------------------------------------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| Module Boundary Enforcement   | ESLint `no-restricted-imports` rules blocking cross-module domain and infrastructure imports | Configure flat config in `eslint.config.mjs` with forbidden patterns. Run in CI as quality gate — builds fail on boundary violations.                           | Boundaries are compile-time, not runtime                | [Link to `/apps/api/eslint.config.mjs`] — ESLint rules with restricted import patterns                                                                                                                          |
| Type-Safe Contract Sharing    | Shared TypeScript interfaces and Zod schemas in a workspace package           | Create `packages/shared-types/` exporting DTO interfaces and Zod validation schemas. Both `apps/api` and `apps/mobile` import from `@smartcart/shared-types`. NestJS uses `ZodValidationPipe` for runtime validation. | Change a DTO → both sides break at compile time. No contract drift. | [Link to `/packages/shared-types/src/`] — Shared interfaces and Zod schemas by domain<br>[Link to `/apps/api/src/common/pipes/zod-validation.pipe.ts`] — Generic validation pipe                                |
| ACID Transactions             | Atomic updates across session status, points balance, and audit trail         | Use Prisma `$transaction` with interactive callback. Pass `tx` client to all repository methods within the boundary. Repositories accept optional `Prisma.TransactionClient`. Publish events only after commit resolves. | Everything inside the transaction succeeds or fails together. No I/O inside the callback. | [Link to `/apps/api/src/modules/checkout/application/services/checkout.service.ts`] — `validateSession()` method<br>[Link to `/apps/api/src/modules/checkout/application/interfaces/session-repository.interface.ts`] — Repository interface with `tx` parameter |
| Long-Running Process Separation | Independent BullMQ worker for consumer profiling pipeline                   | Create `apps/analytics-worker/` with `@Processor` decorator. Main API publishes `CheckoutCompletedEvent` to queue after transaction commit. Worker handles aggregation queries, feature extraction, AI inference, and segment upsert. Deploy as separate Docker container. | Non-blocking side effects. Worker scales independently | [Link to `/apps/analytics-worker/src/processors/profile-update.processor.ts`] — Job processor<br>[Link to `/apps/analytics-worker/src/services/profile-aggregator.service.ts`] — Aggregation logic<br>[Link to `/apps/api/src/infrastructure/messaging/analytics-queue.producer.ts`] — Queue producer |
| Serverless Evolution Path     | Interface-based module design allowing implementation swaps                   | Define TypeScript interfaces in `application/interfaces/`. Bind to implementations via NestJS DI in `*.module.ts` providers array. To migrate: create new implementation class (e.g., `HttpCatalogServiceClient`), swap binding — domain logic untouched. | The interface is the contract. The implementation is configuration. | [Link to `/apps/api/src/modules/catalog/catalog.module.ts`] — In-process binding example<br>[Link to `/apps/api/src/modules/catalog/application/interfaces/catalog-service.interface.ts`] — Interface definition |

### Layered design

#### Overview

Each NestJS module follows a strict four-layer structure. Layers are enforced by folder conventions and TypeScript compilation checks — never by runtime guards.

#### Layer definitions

| Layer          | Location                                | Responsibility                                                                 | Allowed Imports                                                                 | Forbidden Imports                     |
|----------------|-----------------------------------------|---------------------------------------------------------------------------------|---------------------------------------------------------------------------------|---------------------------------------|
| Presentation   | `src/modules/{domain}/presentation/`    | Receive HTTP/WS requests, validate input DTOs, transform to HTTP responses      | Application services, shared DTOs, NestJS decorators                            | Domain entities, repositories, Prisma |
| Application    | `src/modules/{domain}/application/`     | Orchestrate business logic, publish domain events after commits                 | Domain entities, infrastructure interfaces (not implementations)                 | Concrete repository classes, PrismaClient, HTTP clients |
| Domain         | `src/modules/{domain}/domain/`          | Pure business rules, entities, value objects, domain events, strategy interfaces | Standard TypeScript libraries only                                              | NestJS, Prisma, any infrastructure package |
| Infrastructure | `src/modules/{domain}/infrastructure/`  | Implement interfaces: Prisma repositories, queue publishers, storage clients, JWT signers | Domain entities, application interfaces, PrismaClient, external SDKs | Other modules' internals              |

#### Layer Rules — Implementation Guide

##### Rule 1: Domain Layer — Zero External Dependencies

**What**: Domain entities and value objects must be pure TypeScript with no framework imports.

**How to implement**:

- Create entity classes in `domain/entities/` using plain TypeScript
- Encapsulate state with private fields and public getters
- Implement business rules as methods that throw domain-specific errors on violations
- Use Value Objects for concepts with validation (e.g., `QrToken`, `CouponCode`)
- Never import from `@nestjs/common`, `@prisma/client`, or any `infrastructure/` folder

**Example entity structure (what to build)**:

- Private mutable state with public readonly accessors
- Constructor that establishes invariants
- Methods that enforce state transitions (e.g., `addItem()` only when status is ACTIVE)
- Pure computation methods (e.g., `computeItemHash()`) with zero side effects
- Domain errors thrown for business rule violations

**Source location**: `[Link to /apps/api/src/modules/checkout/domain/entities/shopping-session.entity.ts]` — Reference implementation of a pure domain entity.

##### Rule 2: Application Layer — Interfaces Only, Never Implementations

**What**: Application services orchestrate business logic using domain entities and infrastructure interfaces, never concrete classes.

**How to implement**:

- Define interfaces in application/interfaces/ for every infrastructure dependency
- Inject interfaces via constructor (NestJS DI resolves them)
- Use @Injectable() decorator on service classes
- Accept Prisma.TransactionClient as optional parameter for transaction support
- Publish domain events AFTER transaction commits, never inside them
- Never import from infrastructure/ folders directly
- Interface naming convention: Prefix with I — e.g., ISessionRepository, IEventPublisher, IQrSigner

**Source locations**:

- `[Link to /apps/api/src/modules/checkout/application/services/checkout.service.ts]` — Application service with transaction boundary
- `[Link to /apps/api/src/modules/checkout/application/interfaces/session-repository.interface.ts]` — Repository interface example

##### Rule 3: Infrastructure Layer — Implement Interfaces, Map to Domain

**What**: Infrastructure classes implement application-layer interfaces, mapping between domain entities and database rows.

**How to implement**:

- Create classes that `implements` the corresponding application interface
- Use dedicated Mapper classes to convert between Prisma rows and domain entities
- Accept optional `Prisma.TransactionClient` to participate in transactions
- Use `@Injectable()` decorator for DI registration
- Never expose Prisma types outside the infrastructure layer — return domain entities

**Mapper pattern**:

- `toDomain(row: PrismaModel): DomainEntity` — converts DB row to domain entity
- `toPersistence(entity: DomainEntity): PrismaCreateInput` — converts domain entity to DB shape

**Source locations**:

- `[Link to /apps/api/src/modules/checkout/infrastructure/repositories/prisma-session.repository.ts]` — Repository implementation
- `[Link to /apps/api/src/modules/checkout/infrastructure/mappers/session.mapper.ts]` — Entity-row mapping

##### Rule 4: Presentation Layer — Delegate, Don't Implement

**What**: Controllers receive HTTP requests, delegate to application services, and return HTTP responses.

**How to implement**:

- Use NestJS decorators (`@Controller`, `@Post`, `@Get`, `@Body`, `@Param`)
- Apply `ZodValidationPipe` with the corresponding Zod schema from `@smartcart/shared-types`
- Extract authenticated user from request via `@CurrentUser()` custom decorator
- Call application service methods — never access repositories or Prisma directly
- Transform service results to response DTOs before returning
- Keep controller methods thin — all logic in application services

**Source location**: `[Link to /apps/api/src/modules/checkout/presentation/controllers/session.controller.ts]` — Reference controller implementation.

#### Dependency Injection Configuration

**What**: NestJS modules bind interfaces to implementations. This is the single point where concrete classes are wired together.

**How to implement**:

- In each `*.module.ts file`, configure the `providers` array
- Use `{ provide: 'INTERFACE_TOKEN', useClass: ConcreteImplementation }` for interface bindings
- Use string tokens for interfaces (e.g., `'ISessionRepository'`) or `@Inject()` decorators
- Export providers that other modules need via the exports array
- To swap implementations (e.g., for testing or Serverless migration), change only this file

**Source location**: `[Link to /apps/api/src/modules/checkout/checkout.module.ts]`— Module definition with DI bindings.

#### Cross-Layer Dependency Flow

**Visual reference**: The dependency direction is strictly inward. Domain is the core with zero outgoing dependencies.

```mermaid
flowchart TD
    subgraph Presentation
        P[Presentation Layer]
    end

    subgraph Application
        A[Application Layer]
    end

    subgraph Domain
        D[Domain Layer]
    end

    subgraph Infrastructure
        I[Infrastructure Layer]
    end

    %% Dependency arrows
    P -->|imports| A
    A -->|imports| D
    P -->|imports interfaces| I
    I -->|implements| D[Domain Interfaces]

```

**Enforcement mechanisms**:

1. ESLint rules — Block restricted imports at lint time
2. TypeScript path aliases — Configure tsconfig.json to make incorrect paths hard to import
3. Code review checklist — Reviewers verify layer violations before merge
4. CI pipeline — eslint runs on every PR; build fails on violations

#### Architecture Diagrams

##### Level 1 — System Context Diagram

```mermaid
graph TB
    %% Actors
    Shopper["👤 Shopper<br/><i>Mobile App User</i>"]
    Cashier["👤 Cashier<br/><i>POS Operator</i>"]
    Admin["👤 Admin / B2B Partner<br/><i>Report Consumer</i>"]
    CSR["👤 Customer Service Rep<br/><i>Points Manager</i>"]

    %% System
    SmartCart["🛒 SmartCart System<br/><i>Mobile POS + Consumer Analytics Platform</i>"]

    %% Relationships
    Shopper -->|"Scans products<br/>Generates QR codes<br/>Redeems rewards"| SmartCart
    Cashier -->|"Validates QR codes<br/>Confirms checkout<br/>Authorizes payment"| SmartCart
    Admin -->|"Downloads consumer segments<br/>Views product insights<br/>Exports B2B reports"| SmartCart
    CSR -->|"Deducts points<br/>Manages reward fulfillment"| SmartCart

    %% Styling
    classDef actor fill:#e3f2fd,stroke:#1565c0,stroke-width:2px,color:#0d47a1,rx:8,ry:8
    classDef system fill:#e8f5e9,stroke:#2e7d32,stroke-width:3px,color:#1b5e20,rx:12,ry:12

    class Shopper,Cashier,Admin,CSR actor
    class SmartCart system
```

The system context diagram shows SmartCart as a single system with four external actors:

- Shopper (Mobile) — Scans products, generates checkout QR codes, redeems rewards
- Cashier (POS) — Validates QR codes against physical cart contents, confirms checkout
- Admin / B2B Partner — Downloads aggregated consumer segment reports and product insights
- Customer Service Rep — Manually deducts points from user accounts for reward fulfillment

##### Level 2 — Container Diagram

```mermaid
graph TB
    %% ==========================================
    %% ACTORS
    %% ==========================================
    Shopper["👤 Shopper"]
    Cashier["👤 Cashier"]
    Admin["👤 Admin / B2B Partner"]

    %% ==========================================
    %% CONTAINERS
    %% ==========================================
    subgraph MobileApp["📱 Mobile App Container"]
        direction LR
        RN["React Native / Expo<br/><i>iOS & Android</i>"]
        Scanner["Camera Scanner<br/><i>expo-camera</i>"]
        QRRender["QR Renderer<br/><i>react-native-qrcode-svg</i>"]
        PushNotif["Push Notifications<br/><i>expo-notifications</i>"]
    end

    Gateway["🔄 API Gateway<br/><i>Nginx / Cloud Load Balancer</i><br/>Routes: /api/* → NestJS<br/>/ws → WebSocket"]

    subgraph NestJSApp["⚙️ NestJS Modular Monolith"]
        direction TB
        
        subgraph Modules["Domain Modules"]
            direction LR
            AuthMod["Auth<br/>Module"]
            CatalogMod["Catalog<br/>Module"]
            CheckoutMod["Checkout<br/>Module"]
            RewardsMod["Rewards<br/>Module"]
            AnalyticsMod["Analytics<br/>Module"]
            NotifMod["Notifications<br/>Module"]
        end

        subgraph Layers["Internal Layers"]
            direction LR
            AppLayer["Application<br/>Services"]
            DomainLayer["Domain<br/>Entities & Rules"]
        end

        Modules --> Layers
    end

    subgraph WorkerApp["🔄 Analytics Worker"]
        direction TB
        BullConsumer["BullMQ Consumer<br/><i>@Processor</i>"]
        Aggregator["Profile<br/>Aggregator"]
        FeatureExt["Feature<br/>Extractor"]
        SegmentSvc["Segmentation<br/>Service"]

        BullConsumer --> Aggregator --> FeatureExt --> SegmentSvc
    end

    subgraph DataStores["🗄️ Data Stores"]
        direction LR
        PG[("PostgreSQL<br/><i>Primary DB</i>")]
        Redis[("Redis<br/><i>Cache & Sessions</i>")]
        BullMQ[("BullMQ<br/><i>Job Queue</i>")]
        S3[("S3 / R2<br/><i>Images & Reports</i>")]
    end

    subgraph ExternalSvc["☁️ External Services"]
        AISvc["AI Inference<br/>Service<br/><i>POST /classify</i>"]
        PushSvc["Expo Push<br/>API<br/><i>Notifications</i>"]
    end

    %% ==========================================
    %% CONNECTIONS
    %% ==========================================
    Shopper -->|"HTTPS REST"| Gateway
    Shopper -->|"WSS Real-time"| Gateway
    Cashier -->|"HTTPS REST"| Gateway
    Admin -->|"HTTPS REST + API Key"| Gateway

    Gateway -->|"Routes requests"| NestJSApp

    Layers -->|"Read/Write"| PG
    Layers -->|"Cache/Sessions"| Redis
    Layers -->|"Enqueue jobs"| BullMQ
    Layers -->|"Store files"| S3

    BullMQ -->|"Consume jobs"| WorkerApp

    WorkerApp -->|"Query 90-day window"| PG
    WorkerApp -->|"Classify user"| AISvc
    WorkerApp -->|"Upsert segments"| PG
    WorkerApp -->|"Invalidate cache"| Redis

    NotifMod -->|"Send push"| PushSvc
    PushSvc -->|"FCM/APNs"| MobileApp

    %% ==========================================
    %% STYLING
    %% ==========================================
    classDef actor fill:#e3f2fd,stroke:#1565c0,stroke-width:2px,color:#0d47a1,rx:8,ry:8
    classDef mobile fill:#e8eaf6,stroke:#283593,stroke-width:2px,color:#1a237e
    classDef gateway fill:#fff3e0,stroke:#e65100,stroke-width:2px,color:#bf360c
    classDef nestjs fill:#e8f5e9,stroke:#2e7d32,stroke-width:2px,color:#1b5e20
    classDef worker fill:#f3e5f5,stroke:#6a1b9a,stroke-width:2px,color:#4a148c
    classDef datastore fill:#eceff1,stroke:#37474f,stroke-width:2px,color:#263238,rx:6,ry:6
    classDef external fill:#ffebee,stroke:#c62828,stroke-width:2px,stroke-dasharray: 5 5,color:#b71c1c

    class Shopper,Cashier,Admin actor
    class RN,Scanner,QRRender,PushNotif mobile
    class Gateway gateway
    class AuthMod,CatalogMod,CheckoutMod,RewardsMod,AnalyticsMod,NotifMod,AppLayer,DomainLayer nestjs
    class BullConsumer,Aggregator,FeatureExt,SegmentSvc worker
    class PG,Redis,BullMQ,S3 datastore
    class AISvc,PushSvc external
```

The container diagram shows five runtime containers:

- **Mobile App (React Native/Expo)** — Consumer-facing native app with camera, GPS, and push notifications
- **API Gateway (Nginx/Cloud LB)** — Routes REST to NestJS API, WebSocket connections for real-time status
- **NestJS Modular Monolith** — Single Node.js process containing Auth, Catalog, Checkout, Rewards, and Analytics modules with strict layer separation
- **Analytics Worker** — Independent BullMQ consumer for long-running consumer profiling pipeline
- **Data Stores** — PostgreSQL (primary), Redis (cache/sessions), BullMQ (job queue), S3/R2 (file storage)
- **AI Inference Service (External)** — HTTP endpoint that classifies consumer behavior into segments

##### Level 3 — Component Diagram (Checkout Module)

```mermaid
graph TB
    %% ==========================================
    %% PRESENTATION LAYER
    %% ==========================================
    subgraph Presentation["🎯 Presentation Layer"]
        direction LR
        SessionCtrl["<b>SessionController</b><br/><i>REST</i><br/>POST /sessions<br/>POST /sessions/:id/items"]
        QrCtrl["<b>QrController</b><br/><i>REST</i><br/>POST /sessions/:id/qr"]
        ValidationCtrl["<b>ValidationController</b><br/><i>REST</i><br/>POST /sessions/validate"]
        SessionGW["<b>SessionGateway</b><br/><i>WebSocket</i><br/>emit: sessionStatusChanged<br/>on: subscribe:session"]
    end

    %% ==========================================
    %% APPLICATION LAYER
    %% ==========================================
    subgraph Application["⚙️ Application Layer"]
        direction TB
        
        CheckoutSvc["<b>CheckoutService</b><br/>createSession()<br/>addItem()<br/>generateQr()<br/>validateSession()"]
        PointsSvc["<b>PointsService</b><br/>calculatePoints()<br/>creditPoints()"]
        QrSigner["<b>AppQrSigner</b><br/>sign()<br/>verify()"]
        StateMachine["<b>SessionStateMachine</b><br/>transition()<br/>guardTransition()"]
        
        CheckoutSvc --> PointsSvc
        CheckoutSvc --> QrSigner
        CheckoutSvc --> StateMachine
    end

    %% ==========================================
    %% APPLICATION INTERFACES (Ports)
    %% ==========================================
    subgraph Interfaces["🔌 Application Interfaces"]
        direction LR
        ISessionRepo["<b>ISessionRepository</b><br/><i>Interface</i><br/>findById()<br/>save()<br/>markCompleted()"]
        IEventPub["<b>IEventPublisher</b><br/><i>Interface</i><br/>publish()"]
        IQrSignerInt["<b>IQrSigner</b><br/><i>Interface</i><br/>sign()<br/>verify()"]
        IPointsCalc["<b>IPointsCalculationStrategy</b><br/><i>Interface</i><br/>calculate()"]
    end

    %% ==========================================
    %% DOMAIN LAYER
    %% ==========================================
    subgraph Domain["🧠 Domain Layer"]
        direction TB
        
        Session["<b>ShoppingSession</b><br/><i>Aggregate Root</i><br/>+id: string<br/>+userId: string<br/>+storeId: string<br/>+status: SessionStatus<br/>+items: SessionItem[]<br/>+addItem()<br/>+requestCheckout()<br/>+validateItems()"]
        
        SessionItem["<b>SessionItem</b><br/><i>Entity</i><br/>+productId: string<br/>+barcode: string<br/>+quantity: number<br/>+pointsValue: number"]
        
        QrTicket["<b>QrTicket</b><br/><i>Value Object</i><br/>+token: string<br/>+expiresAt: Date<br/>+sessionId: string<br/>+itemHash: string<br/>+isExpired()<br/>+verifyHash()"]
        
        CheckoutEvent["<b>CheckoutCompletedEvent</b><br/><i>Domain Event</i><br/>+sessionId: string<br/>+userId: string<br/>+pointsAwarded: number<br/>+items: Array<br/>+timestamp: Date"]
        
        SessionStatus["<b>SessionStatus</b><br/><i>Enum</i><br/>ACTIVE<br/>PENDING_CHECKOUT<br/>COMPLETED<br/>VALIDATION_FAILED<br/>EXPIRED"]

        FixedStrat["<b>FixedPointsStrategy</b><br/>rate: 50 pts/unit"]
        MultiplierStrat["<b>MultiplierStrategy</b><br/>multiplier: 2x spend"]

        Session --> SessionItem
        Session --> SessionStatus
        IPointsCalc -.-> FixedStrat
        IPointsCalc -.-> MultiplierStrat
    end

    %% ==========================================
    %% INFRASTRUCTURE LAYER
    %% ==========================================
    subgraph Infrastructure["🏗️ Infrastructure Layer"]
        direction TB
        
        PrismaSessionRepo["<b>PrismaSessionRepository</b><br/><i>implements ISessionRepository</i><br/>- prisma: PrismaService<br/>- redis: RedisService"]
        
        BullMqPublisher["<b>BullMqEventPublisher</b><br/><i>implements IEventPublisher</i><br/>- analyticsQueue: Queue"]
        
        JwtQrSignerImpl["<b>JwtQrSigner</b><br/><i>implements IQrSigner</i><br/>- secret: string"]
        
        SessionMapper["<b>SessionMapper</b><br/>toDomain()<br/>toPersistence()"]
    end

    subgraph ExternalDep["🔗 External Dependencies"]
        direction LR
        PG[("PostgreSQL")]
        RedisCache[("Redis")]
        BullMQQueue[("BullMQ Queue")]
    end

    %% ==========================================
    %% CONNECTIONS
    %% ==========================================

    %% Presentation → Application
    SessionCtrl -->|"calls"| CheckoutSvc
    QrCtrl -->|"calls"| CheckoutSvc
    ValidationCtrl -->|"calls"| CheckoutSvc
    SessionGW -->|"calls"| CheckoutSvc

    %% Application → Interfaces (Dependency Inversion)
    CheckoutSvc -.->|"depends on"| ISessionRepo
    CheckoutSvc -.->|"depends on"| IEventPub
    CheckoutSvc -.->|"depends on"| IQrSignerInt

    %% Application → Domain
    CheckoutSvc -->|"uses"| Session
    CheckoutSvc -->|"uses"| QrTicket
    CheckoutSvc -->|"publishes"| CheckoutEvent

    %% Infrastructure → Implements Interfaces
    PrismaSessionRepo -->|"implements"| ISessionRepo
    BullMqPublisher -->|"implements"| IEventPub
    JwtQrSignerImpl -->|"implements"| IQrSignerInt

    %% Infrastructure → Domain
    PrismaSessionRepo -->|"maps to/from"| Session
    PrismaSessionRepo -->|"uses"| SessionMapper
    SessionMapper -->|"produces"| Session
    SessionMapper -->|"reads"| SessionItem

    %% Infrastructure → External
    PrismaSessionRepo -->|"queries"| PG
    PrismaSessionRepo -->|"caches"| RedisCache
    BullMqPublisher -->|"publishes to"| BullMQQueue
    CheckoutEvent -->|"consumed by"| BullMqPublisher

    %% ==========================================
    %% STYLING
    %% ==========================================
    classDef presentation fill:#e3f2fd,stroke:#1565c0,stroke-width:2px,color:#0d47a1
    classDef application fill:#fff3e0,stroke:#e65100,stroke-width:2px,color:#bf360c
    classDef interfaces fill:#fff9c4,stroke:#f9a825,stroke-width:2px,stroke-dasharray: 5 5,color:#f57f17
    classDef domain fill:#e8f5e9,stroke:#2e7d32,stroke-width:2px,color:#1b5e20
    classDef infrastructure fill:#f3e5f5,stroke:#6a1b9a,stroke-width:2px,color:#4a148c
    classDef external fill:#eceff1,stroke:#37474f,stroke-width:2px,color:#263238,rx:6,ry:6

    class SessionCtrl,QrCtrl,ValidationCtrl,SessionGW presentation
    class CheckoutSvc,PointsSvc,QrSigner,StateMachine application
    class ISessionRepo,IEventPub,IQrSignerInt,IPointsCalc interfaces
    class Session,SessionItem,QrTicket,CheckoutEvent,SessionStatus,FixedStrat,MultiplierStrat domain
    class PrismaSessionRepo,BullMqPublisher,JwtQrSignerImpl,SessionMapper infrastructure
    class PG,RedisCache,BullMQQueue external
```

The Checkout module component diagram illustrates:

**Presentation components**:

- `SessionController` — REST endpoints for session creation and item management
- `QrController` — QR generation endpoint
- `ValidationController` — POS validation endpoint
- `SessionGateway` — WebSocket gateway for real-time validation status

**Application components**:

- `CheckoutService` — Orchestrates session lifecycle and validation
- `PointsService` — Calculates and credits points using strategy pattern
- `AppQrSigner` — Signs and verifies QR tokens
- `SessionStateMachine` — Enforces valid session state transitions

**Domain components**:

- `ShoppingSession` aggregate root with composed SessionItem entities
- `QrTicket` value object
- `CheckoutCompletedEvent` domain event
- `PointsCalculationStrategy` interface with `FixedPointsStrategy` and `MultiplierStrategy` implementations

**Infrastructure components**:

- `PrismaSessionRepository` — Implements `ISessionRepository` with Prisma and Redis caching
- `BullMqEventPublisher` — Implements `IEventPublisher` for async event publishing
- `JwtQrSigner` — Implements `IQrSigner` for QR token cryptography

**Key design pattern to implement**: The Dependency Inversion Principle is visible throughout — application services depend on interfaces, infrastructure classes implement them. This is wired at runtime by the NestJS DI container configured in `checkout.module.ts`.

---

## 2.3. Business Logic & Design Patterns

### 1. Consumer Profiling Pipeline

| Aspect | Implementation Directive |
|--------|---------------------------|
| What   | After each validated checkout, update a rolling 90-day behavioral profile, extract features, classify the user into a consumer segment via AI, and make aggregated anonymized data available to B2B partners. |
| Trigger | `CheckoutCompletedEvent` published by `CheckoutService.validateSession()` after transaction commit |
| Queue   | `analytics-profile-update` (BullMQ) — event routed by `BullMqEventPublisher` |
| Worker  | `ProfileUpdateProcessor` in `apps/analytics-worker/` |
| Algorithm Steps | See detailed breakdown below |

#### Algorithm Breakdown

| Step | Location | Action |
|------|----------|--------|
| 1. Event Emission | [Link to `/apps/api/src/modules/checkout/application/services/checkout.service.ts`] | After `$transaction` commits, publish `CheckoutCompletedEvent` with `userId`, `storeId`, `items[]`, `pointsAwarded`, `timestamp` |
| 2. Job Consumption | [Link to `/apps/analytics-worker/src/processors/profile-update.processor.ts`] | BullMQ delivers job; processor delegates to `ProfileAggregatorService` |
| 3. Rolling Window Aggregation | [Link to `/apps/analytics-worker/src/services/profile-aggregator.service.ts`] | Query `points_transactions` for last 90 days where reason = 'PURCHASE'. Compute features: `category_frequency`, `avg_ticket`, `avg_purchase_hour`, `weekly_frequency`, `sponsored_ratio`, `organic_preference_score`. Require minimum 5 transactions for valid classification. |
| 4. AI Classification | [Link to `/apps/analytics-worker/src/infrastructure/ai/ai-inference.client.ts`] | Check Redis cache (`segment:{userId}`, TTL 24h). On miss, POST features to AI service. Cache result on success. |
| 5. Segment Persistence | [Link to `/apps/analytics-worker/src/infrastructure/repositories/segment.repository.ts`] | UPSERT into `consumer_segments` table. Invalidate B2B aggregated cache keys: `analytics:store:{storeId}:segments`, `analytics:global:segment-distribution`. |
| 6. B2B Data Availability | [Link to `/apps/api/src/modules/analytics/application/services/analytics.service.ts`] | B2B partners query `GET /analytics/segments?storeId=X`. Response includes segment distribution with counts and percentages. All data is anonymized and aggregated — no individual user data exposed. |

**Key Rules:**

- Guard: Minimum 5 transactions required for statistically meaningful classification  
- Cache: AI results cached for 24 hours to avoid redundant API calls  
- Data Privacy: B2B endpoints return only aggregated, anonymized data  
- Resilience: Worker retries via BullMQ if AI service is unavailable  

---

### 2. QR Generation and Validation

| Aspect | Implementation Directive |
|--------|---------------------------|
| What   | Generate a signed, time-sensitive JWT token embedding a deterministic hash of session items. At checkout, validate the token signature, expiration, and item hash against physical cart contents. |
| Generation | Called by `CheckoutService.generateQr()`. Domain validation: session must be ACTIVE with ≥ 1 item. Compute deterministic item hash (sort barcodes alphabetically, concatenate with `|`, SHA-256). Sign JWT with HS256, 5-minute expiry. |
| Validation | Called by `CheckoutService.validateSession()`. Verify JWT signature. Check expiration. Compute hash of POS-scanned items using same algorithm. Compare hashes — mismatch throws `QrItemMismatchError`. |
| Participants | `CheckoutService`, `JwtQrSigner` (infrastructure), `ShoppingSession.computeItemHash()` (domain), `ShoppingSession.validateItems()` (domain) |

**Deterministic Hash Algorithm:**

1. Sort session items alphabetically by barcode  
2. Concatenate as `"barcode1|barcode2|barcode3"`  
3. Compute SHA-256 hash of the concatenated string  

**Key Rules:**

- QR tokens expire after 5 minutes (JWT `exp` claim + factory enforcement)  
- 10-second clock skew tolerance for validation  
- `QR_SIGNING_SECRET` must be at least 32 characters  
- Tampered tokens fail signature verification; modified items fail hash comparison  

**Source Files:**

- Signer: [Link to `/apps/api/src/modules/checkout/infrastructure/crypto/jwt-qr.signer.ts`]  
- Domain hash logic: [Link to `/apps/api/src/modules/checkout/domain/entities/shopping-session.entity.ts`]  
- Factory: [Link to `/apps/api/src/modules/checkout/domain/factories/qr-ticket.factory.ts`]  

---

### 3. Points Calculation

| Aspect | Implementation Directive |
|--------|---------------------------|
| What   | Award points based on product's `pointsConfig`. Three strategies at launch: fixed per unit, spend multiplier, volume tiers. Extensible for future schemes without modifying checkout flow. |
| How    | `PointsService.calculatePoints()` filters sponsored items, then delegates each item to `PointsStrategyResolver.resolve(config.type)` which returns the correct strategy. Strategy `calculate()` returns a `PointsAwarded` value object. |
| Participants | `PointsService`, `PointsStrategyResolver`, `IPointsCalculationStrategy` implementations |

**Strategy Types:**

| Strategy        | strategyType       | Config Shape | Calculation |
|-----------------|-------------------|--------------|-------------|
| Fixed Points    | `FIXED_PER_UNIT`  | `{ type: "FIXED_PER_UNIT", value: 50 }` | `50 * quantity` |
| Spend Multiplier| `SPEND_MULTIPLIER`| `{ type: "SPEND_MULTIPLIER", value: 2.0 }` | `round(itemPrice * quantity * 2.0)` |
| Volume Tier     | `VOLUME_TIER`     | `{ type: "VOLUME_TIER", tiers: [{minQty, maxQty, pointsPerUnit}] }` | `quantity * tier.pointsPerUnit` |
| Weekend Bonus   | `WEEKEND_BONUS`   | `{ type: "WEEKEND_BONUS", basePoints, weekendMultiplier }` | `basePoints * quantity * (isWeekend ? multiplier : 1)` |

**Adding a New Strategy (Open/Closed Principle):**

- Create new class in `domain/strategies/` implementing `IPointsCalculationStrategy`  
- Register in `PointsStrategyResolver` constructor: `this.register(new NewStrategy())`  
- No existing code changes required  

**Source Files:**

- Interface: [Link to `/apps/api/src/modules/checkout/domain/strategies/points-calculation-strategy.interface.ts`]  
- Strategies: [Link to `/apps/api/src/modules/checkout/domain/strategies/`]  
- Resolver: [Link to `/apps/api/src/modules/checkout/application/services/points-strategy-resolver.ts`]  
- Service: [Link to `/apps/api/src/modules/checkout/application/services/points.service.ts`]  

---

### 4. Session State Machine

| Aspect | Implementation Directive |
|--------|---------------------------|
| What   | Shopping sessions follow a finite state machine lifecycle. Transitions are guarded by business rules. Expired sessions are cleaned up automatically via cron. |
| States | `ACTIVE → PENDING_CHECKOUT → COMPLETED or VALIDATION_FAILED`. Any non-COMPLETED state can transition to `EXPIRED`. |
| Guards | `addItem()` only in ACTIVE. `requestCheckout()` requires ACTIVE + items > 0. `completeValidation()` and `markValidationFailed()` only from PENDING_CHECKOUT. `expire()` idempotent for COMPLETED. |
| Cron Cleanup | `SessionExpirationService` runs every 5 minutes (`@Cron('*/5 * * * *')`). Queries for ACTIVE sessions older than 2 hours and marks them EXPIRED. |

**State Transition Rules:**

| From State | Event                  | To State           | Guard Condition |
|------------|------------------------|--------------------|-----------------|
| ACTIVE     | addItem()              | ACTIVE             | Status must be ACTIVE |
| ACTIVE     | requestCheckout()      | PENDING_CHECKOUT   | Items.length > 0 |
| ACTIVE     | expire()               | EXPIRED            | Age > 2 hours (cron) |
| PENDING_CHECKOUT | completeValidation() | COMPLETED       | Hash match successful |
| PENDING_CHECKOUT | markValidationFailed() | VALIDATION_FAILED | Hash mismatch |
| PENDING_CHECKOUT | expire()         | EXPIRED            | Age > 2 hours (cron) |
| COMPLETED  | expire()               | COMPLETED          | Idempotent — no transition |

**Source Files:**

- Entity FSM: [Link to `/apps/api/src/modules/checkout/domain/entities/shopping-session.entity.ts`]  
- State machine: [Link to `/apps/api/src/modules/checkout/domain/state-machine/session-state-machine.ts`]  
- Cron service: [Link to `/apps/api/src/modules/checkout/application/services/session-expiration.service.ts`]  

---

#### Pattern Interaction — Checkout Validation Flow

| Step | Layer        | Pattern(s) Active | Action |
|------|--------------|-------------------|--------|
| 1    | Presentation | DTO               | `ZodValidationPipe` validates `ValidationRequestSchema` against request body |
| 2    | Application → Domain | Service Layer, Repository | `CheckoutService` calls `ISessionRepository.findById()` |
| 3    | Infrastructure → Domain | Repository, Factory | `PrismaSessionRepository` maps row to entity via `SessionFactory.reconstitute()` |
| 4    | Application → Infrastructure | Service Layer | `CheckoutService

---

## 2.4. API Design

**Style:** REST with OpenAPI 3.1 specification — aligns with the React Native Axios client, TanStack Query caching semantics, predictable HTTP status codes for error mapping, and straightforward debugging for the critical POS validation endpoint.

**Versioning Strategy:** URL prefix versioning (`/api/v1/`). Breaking changes increment the major version to `/api/v2/`. Non-breaking additions are added to the current version. Deprecated fields are marked with the `x-deprecated` OpenAPI extension and the `Sunset` HTTP header, giving clients 90 days to migrate.

**Base URL:** `https://api.smartcart.app/api/v1`

**OpenAPI / Swagger Link:** Spec located at [Link to `/docs/api/openapi.yaml`]; served interactively at `https://api.smartcart.app/api/docs` in dev/staging (NestJS Swagger), and as a static Redoc page in production.

---

### Key Endpoints

| Method | Path                        | Description                                                                 | Auth Required        |
|--------|-----------------------------|-----------------------------------------------------------------------------|----------------------|
| POST   | `/auth/register`            | Register a new shopper account. Receives access token in body and refresh token via HTTP-only cookie. | No                   |
| POST   | `/auth/login`               | Authenticate with email/password. Receives access token in body and refresh token via HTTP-only cookie. | No                   |
| POST   | `/auth/refresh`             | Exchange the refresh token cookie for a new access token (token rotation).  | Refresh token (cookie) |
| POST   | `/auth/logout`              | Revoke the current refresh token.                                           | Yes (JWT)            |
| GET    | `/users/me`                 | Get current user profile with points balance.                               | Yes (JWT)            |
| PATCH  | `/users/me`                 | Update profile (name, phone).                                               | Yes (JWT)            |
| GET    | `/users/me/points/history`  | Paginated points transaction history.                                       | Yes (JWT)            |
| GET    | `/products/:barcode`        | Lookup product by EAN-13 barcode. Cache-Aside with Redis (TTL 1h).          | Yes (JWT)            |
| GET    | `/products/search`          | Search products by name or brand (`?q=`, `?limit=`). Redis TTL 5 min.       | Yes (JWT)            |
| POST   | `/sessions`                 | Create a new shopping session for a store.                                  | Yes (JWT)            |
| GET    | `/sessions/active`          | Get the user's currently active session.                                    | Yes (JWT)            |
| POST   | `/sessions/:id/items`       | Add a scanned item to the session.                                          | Yes (JWT)            |
| DELETE | `/sessions/:id/items/:itemId` | Remove an item from the session.                                           | Yes (JWT)            |
| POST   | `/sessions/:id/qr`          | Finalize session and generate a checkout QR token.                          | Yes (JWT)            |
| POST   | `/sessions/:id/validate`    | POS endpoint: validate QR token and credit points.                          | POS API Key          |
| GET    | `/sessions/:id`             | Get session details (for receipt/history).                                  | Yes (JWT)            |
| GET    | `/rewards`                  | List all active rewards.                                                    | Yes (JWT)            |
| GET    | `/rewards/:id`              | Get reward details.                                                         | Yes (JWT)            |
| POST   | `/rewards/:id/redeem`       | Redeem points for a reward; returns a coupon code.                          | Yes (JWT)            |
| GET    | `/analytics/segments`       | Get consumer segment distribution (filterable by `?storeId=`).              | B2B API Key          |
| GET    | `/analytics/products/:id/insights` | Get demand predictions and performance metrics for a product.           | B2B API Key          |
| GET    | `/analytics/stores/:id/overview` | Get store-level metrics (avg ticket, peak hours, segment mix).           | B2B API Key          |
| GET    | `/health`                   | Service health check (database, redis, uptime).                             | No                   |

---

### Data Contracts (DTOs)

All DTOs are defined as TypeScript interfaces with accompanying Zod validation schemas in the shared package. Controllers use a global `ZodValidationPipe` for enforcement.  
**Source:** [Link to `/packages/shared-types/src/`]

---

### Error Response Format

All errors follow a consistent structure:

```json
{
  "errorCode": "VALIDATION_FAILED",
  "message": "Request validation failed",
  "details": [{ "field": "barcode", "message": "Barcode must be numeric" }],
  "timestamp": "2026-06-09T14:30:00Z",
  "correlationId": "abc-123-def-456"
}
```

---

## 2.5. Security

| Concern              | Strategy                                                                                                                                                                                                                                                                                                                                 |
|----------------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| Transport            | HTTPS enforced via Nginx reverse proxy; all HTTP requests 301-redirected to HTTPS. TLS 1.3 minimum (TLS 1.2 accepted for legacy Android API < 26). HSTS header set to `max-age=31536000; includeSubDomains; preload` via Helmet middleware. Let's Encrypt certificates auto-renewed via Certbot. Config: [Link to `/docker/nginx/default.conf`]. |
| Authentication       | JWT `accessToken` (HS256, 15-min expiry) sent in `Authorization: Bearer` header. `refreshToken` (7-day expiry) stored in HTTP-only, Secure, SameSite=Strict cookie. Passwords hashed with `bcrypt` (cost factor 12). Account lockout after 5 failed attempts within 15 minutes (30-min lockout) via Redis. Token rotation on refresh; old tokens invalidated. JWT service: [Link to `/apps/api/src/modules/auth/infrastructure/crypto/jwt.service.ts`]. Password service: [Link to `/apps/api/src/modules/auth/infrastructure/crypto/password.service.ts`]. Auth service: [Link to `/apps/api/src/modules/auth/application/services/auth.service.ts`]. |
| Authorization        | Role-Based Access Control (RBAC) with five roles: `shopper`, `pos_operator`, `customer_service`, `b2b_partner`, `admin`. Endpoints decorated with `@Roles()` and enforced by `RolesGuard`. Resource ownership verified by `ResourceOwnershipGuard` (compares JWT `sub` with resource IDs). POS and B2B endpoints secured with separate API Key authentication (`X-API-Key` header), hashed with SHA-256 and stored in DB. Roles guard: [Link to `/apps/api/src/common/guards/roles.guard.ts`]. Resource ownership guard: [Link to `/apps/api/src/common/guards/resource-ownership.guard.ts`]. API key guard: [Link to `/apps/api/src/common/guards/api-key.guard.ts`]. |
| Database Encryption  | Encryption at rest: AES-256 provider-managed (Railway/Render/GCP Cloud SQL). Encryption in transit: TLS 1.3 enforced for all connections; Prisma client configured with `sslmode=require`. Connection strings never hardcoded; sourced from `DATABASE_URL` environment variable. |
| Secrets Management   | All secrets stored in environment variables (Railway Shared Variables / Render Environment Groups in production). Never committed to Git (`.env` in `.gitignore`). JWT secrets rotated quarterly; database credentials rotated every 90 days. Application validates all required secrets at startup using a Zod schema and fails fast if any are missing or invalid. Validation: [Link to `/apps/api/src/config/env.validation.ts`]. |
| Rate Limiting        | Redis-based rate limiter middleware applied globally (`100 req/min` per authenticated user or IP, configurable via `RATE_LIMIT_MAX`). Stricter limits on auth endpoints (`10 req/min` for login/register) to prevent brute-force. `X-RateLimit-Limit` and `X-RateLimit-Remaining` headers included in responses. Middleware: [Link to `/apps/api/src/common/middleware/rate-limiter.middleware.ts`]. |
| Input Validation     | All inputs validated at the controller boundary using Zod schemas via a global `ZodValidationPipe`. Schemas enforce strict types (UUIDs, numeric-only barcodes, length caps) preventing SQL injection, XSS, path traversal, and ReDoS. Validation pipe: [Link to `/apps/api/src/common/pipes/zod-validation.pipe.ts`]. Shared schemas: [Link to `/packages/shared-types/src/`]. |
| OWASP Compliance     | SQL Injection: 100% parameterized queries via Prisma ORM. XSS: Helmet CSP headers block inline scripts; all user input validated by Zod schemas. CSRF: SameSite=Strict cookies; API auth uses `Authorization` header. Path Traversal: UUID validation on all path parameters. ReDoS: Zod regex patterns tested for catastrophic backtracking; input lengths capped. Security headers configured via Helmet: [Link to `/apps/api/src/main.ts`]. |
| Audit Logging        | All sensitive operations (`login`, `register`, `logout`, `refresh`, `redeemReward`, `validateSession`, `updateProfile`, `deleteAccount`) logged as structured JSON with `userId`, `action`, `IP address`, and `correlationId`. Points transactions are append-only — immutable ledger where balance is derived via `SUM(delta)`, making it tamper-evident. Audit interceptor: [Link to `/apps/api/src/common/interceptors/audit.interceptor.ts`]. Points ledger: [Link to `/apps/api/src/modules/checkout/infrastructure/repositories/prisma-points.repository.ts`]. |

---

### PII Handling

- **email** and **fullName**: stored encrypted at rest, masked in logs (e.g., `j***@example.com`)  
- **password_hash**: bcrypt hashed; never logged or returned in API responses  
- **phone** and **pushToken**: stored encrypted at rest  
- **B2B analytics data**: strictly aggregated and anonymized; minimum 50 users per segment before data is exposed  

---

## 2.6. Observability

| Concern               | Tool / Approach |
|-----------------------|-----------------|
| **Structured Logging** | Pino via `nestjs-pino` — JSON format with correlation ID, user ID, role, and severity. PII fields (`email`, `password`, `phone`, `pushToken`) automatically redacted via Pino's `redact` configuration. Logs stream to stdout; shipped to Loki via Promtail in production. Config: [Link to `/apps/api/src/config/pino.config.ts`]. Application-level logging example: [Link to `/apps/api/src/modules/checkout/application/services/checkout.service.ts`]. |
| **Monitoring**        | Prometheus metrics exposed at `/metrics` via `@willsoto/nestjs-prometheus`. Default metrics (CPU, memory, event loop lag, GC pauses) plus custom business metrics: checkout completions, points awarded, QR generations, active sessions, BullMQ queue depth, and AI classification latency. Business metrics service: [Link to `/apps/api/src/common/metrics/business-metrics.service.ts`]. Queue depth reporter: [Link to `/apps/api/src/common/queues/queue-metrics.service.ts`]. |
| **Distributed Tracing** | OpenTelemetry SDK with automatic instrumentation for HTTP, Express, `ioredis`, BullMQ, and Prisma. Traces exported via OTLP gRPC to Jaeger. W3C Trace Context propagated across HTTP calls and injected into BullMQ job metadata. Manual spans for critical business operations (checkout validation). Tracing initialization: [Link to `/apps/api/src/tracing.ts`]. |
| **Alerting**          | Prometheus alerting rules evaluated by Alertmanager. P1 (critical) alerts routed to PagerDuty with 5-minute on-call escalation. P2/P3 warnings sent to Slack `#smartcart-alerts`. Alerts defined for: service down, high error rate (>1% 5xx over 5 min), queue backpressure (>1000 waiting jobs), high checkout latency (P95 > 2s), database connection pool exhaustion (>80% utilized), and AI service degradation (P95 > 10s). Alert rules: [Link to `/infra/prometheus/rules/smartcart-alerts.yml`]. |
| **Health Checks**     | Three-tier health probes via `@nestjs/terminus`. `/api/v1/health/liveness` — lightweight process check for Kubernetes restart decisions. `/api/v1/health/readiness` — validates DB and Redis connectivity for traffic routing. `GET /health` — full dependency check for load balancers. Health controller: [Link to `/apps/api/src/common/health/health.controller.ts`]. |
| **Error Tracking**    | Sentry via `@ntegral/nestjs-sentry` and `@sentry/node`. Captures unhandled exceptions (500 errors), Prisma errors, and BullMQ job failures. Expected business errors (4xx: 404, 409, 422) are intentionally excluded. Every Sentry event enriched with `userId`, `correlationId`, `sessionId`, and release version. Sentry configuration: [Link to `/apps/api/src/config/sentry.config.ts`]. Global exception filter with Sentry integration: [Link to `/apps/api/src/common/filters/global-exception.filter.ts`]. |

---

### **Production Readiness Checklist**
- **Logs:** Every log line is valid JSON with a `correlationId`; PII is redacted.  
- **Metrics:** `/metrics` endpoint returns 200 OK with valid Prometheus format; scrape interval configured.  
- **Tracing:** Jaeger shows full traces from HTTP → Service → Prisma → Redis for checkout validation.  
- **Alerts:** `ServiceDown` fires within 1 minute of `/health` failure; on-call escalation policy tested.  
- **Error Tracking:** Zero unhandled exceptions in Sentry; 5xx error rate < 0.1%.  
- **Dashboard:** On-call engineer can identify root cause within 5 minutes using the Grafana Operations Dashboard (provisioned at [Link to `/infra/grafana/dashboards/smartcart-overview.json`]).  

---

## 2.7. Availability & Scalability

### Availability

| Metric | Target |
|--------|--------|
| **Annual Uptime SLA** | 99.9% ("three nines"). Permits 8.76 hours of downtime per year. SmartCart is a POS-adjacent system; if QR validation fails, shoppers cannot complete purchases. |
| **RTO (Recovery Time Objective)** | < 15 minutes from P1 alert to full service restoration. Infrastructure is defined as code (Terraform for production). Database failover to a read replica is automated and completes in under 5 minutes. |
| **RPO (Recovery Point Objective)** | < 5 minutes. Achieved via PostgreSQL continuous WAL archiving to S3/R2 every 5 minutes. Points transactions are committed synchronously before the API responds, ensuring zero financial record loss. |

- **Mechanisms:**
  - **Multi-AZ Deployment:** NestJS containers deployed across 3 availability zones behind an Nginx/ALB load balancer. If one AZ fails, traffic routes to the remaining zones.
  - **Load Balancer Health Checks:** Nginx/ALB probes `GET /api/v1/health/readiness` every 10 seconds. Unhealthy containers are removed after 2 consecutive failures.
  - **Auto-Restart on Crash:** Kubernetes `restartPolicy: Always` ensures the container restarts within seconds of a process crash. The Node.js process inside the container uses PM2 or similar for instant restarts.
  - **Database Replication:** PostgreSQL streaming replication to a read replica in a different AZ. WAL files archived every 5 minutes. On primary failure, the replica is promoted automatically.
  - **Redis Sentinel:** A 3-node Sentinel quorum monitors the Redis primary. Automatic failover occurs if the primary is unreachable for 30 seconds, ensuring session cache and BullMQ queues remain operational.
  - **Graceful Shutdown:** The application handles `SIGTERM` to drain connections cleanly during deployments. Kubernetes sends this signal 30 seconds before `SIGKILL`.

**Graceful Shutdown Implementation Guide**

To implement the graceful shutdown handler, modify the application's entry point at [Link to `/apps/api/src/main.ts`].

- **What to implement:** A `gracefulShutdown` async function that sequentially closes core resources.
- **How to implement it:**
  1. After initializing the NestJS app and calling `app.listen()`, define the shutdown function.
  2. Inside the function, first call **`app.close()`** to stop the HTTP listener, rejecting new requests while allowing existing ones to complete.
  3. Retrieve the `PrismaService` via `app.get(PrismaService)` and call **`prismaService.$disconnect()`**.
  4. Retrieve the `RedisService` and call **`redisService.quit()`**.
  5. For BullMQ, retrieve each registered queue (e.g., `BullQueue_analytics-profile-update`) and call **`queue.close()`** in parallel using `Promise.all()`.
  6. Register this function to listen for `SIGTERM` and `SIGINT` signals using `process.on()`.

---

### Scalability

- **Strategy:** Horizontal scaling. Multiple stateless NestJS API containers run behind a load balancer. The analytics worker (`analytics-worker`) is a separate deployment that scales independently. The primary bottleneck is the database, mitigated by read replicas, Redis Cache-Aside for product lookups, and PgBouncer connection pooling.

- **Trigger Metrics (Auto-Scaling Configuration):**
  - **What to implement:** Kubernetes HorizontalPodAutoscaler (HPA) resources for the API and the analytics worker.
  - **How to implement:**
    - **API deployment** ([Link to `/infra/kubernetes/api-hpa.yaml`]): Configure HPA with `minReplicas: 3`, `maxReplicas: 20`. Target CPU utilization **70%**, memory **75%**, and custom metric for HTTP request rate (>100 req/s per pod). Define `scaleUp` policy (double pods or +4 max) and `scaleDown` policy (remove pods slowly, 10% at a time, after 5-min stabilization).
    - **Analytics worker** ([Link to `/infra/kubernetes/analytics-worker-hpa.yaml`]): Configure HPA with `minReplicas: 2`, `maxReplicas: 10`. Use custom metric `smartcart_bullmq_queue_depth` filtered for `analytics-profile-update` queue. Target average of **100 waiting jobs** to trigger scaling.

- **Stateless Services:**
  - **What to implement:** All session state externalized to Redis, not stored in-process.
  - **How to implement:** In service logic (e.g., `CheckoutService` at [Link to `/apps/api/src/modules/checkout/application/services/checkout.service.ts`]), load session data via `sessionRepo.findById()`. Repository (e.g., `PrismaSessionRepository` at [Link to `/apps/api/src/modules/checkout/infrastructure/repositories/prisma-session.repository.ts`]) implements **Read-Through/Write-Through cache**:
    1. **On `findById`:** Check Redis (`redis.get`). On miss, query PostgreSQL, hydrate Redis with TTL (e.g., 7200s), return data.
    2. **On `save`:** Update Redis immediately, then persist to PostgreSQL. Guarantees consistency across containers.

- **Connection Pooling & PgBouncer:**
  - **What to implement:** PgBouncer in **Transaction Pooling** mode between API containers and PostgreSQL.
  - **How to implement:**
    1. Set Prisma connection limit per API container via `PRISMA_CONNECTION_LIMIT=10`. Point `DATABASE_URL` to PgBouncer host (e.g., `postgresql://app_user:pass@pgbouncer:6432/smartcart?connection_limit=10`).
    2. In PgBouncer config ([Link to `/infra/pgbouncer/pgbouncer.ini`]), define `smartcart` DB pointing to primary PostgreSQL host. Set `pool_mode = transaction`. Set `default_pool_size = 25`. This multiplexes connections efficiently, preventing exhaustion.

---

## 2.8. Backend Key Workflows

This section details the two most critical workflows beyond basic CRUD: the **QR Validation Flow** (the revenue path) and the **Consumer Data Pipeline** (the B2B analytics path). Each workflow traces the operation through every architectural layer, with explicit timing constraints and failure modes.

---

### Workflow 1: User QR Validation Flow (POS Integration)

**Business Criticality:** Revenue path — must be **atomic**, **fast** (<500ms P95), and **cryptographically verifiable**.

**Prerequisites:** Shopper has created a session, scanned items, and requested a QR code. QR contains a signed JWT embedding a deterministic SHA-256 hash of session items.

**Steps:**

1. **POS Terminal Request:** `POST /api/v1/sessions/{id}/validate` with `qrToken` and `scannedItems[]`. Requires valid POS API Key in `X-API-Key`.
2. **Security Verification (Infrastructure Layer):**
   - API Key validated by `ApiKeyGuard` ([Link to `/apps/api/src/common/guards/api-key.guard.ts`]).
   - DTO validated via `ZodValidationPipe` against `ValidateSessionRequestSchema` ([Link to `/packages/shared-types/src/session.types.ts`]).
   - QR token verified by `JwtQrSigner.verify()` ([Link to `/apps/api/src/modules/checkout/infrastructure/crypto/jwt-qr.signer.ts`]).
3. **Session Retrieval & Domain Validation:**
   - Session loaded via `ISessionRepository.findById()` ([Link to `/apps/api/src/modules/checkout/infrastructure/repositories/prisma-session.repository.ts`]).
   - Items validated by `ShoppingSession.validateItems()` ([Link to `/apps/api/src/modules/checkout/domain/entities/shopping-session.entity.ts`]).
4. **Points Calculation & Atomic Transaction:**
   - Points computed via `PointsService.calculatePoints()` ([Link to `/apps/api/src/modules/checkout/application/services/points.service.ts`]) and `PointsStrategyResolver`.
   - Prisma `$transaction`: mark session `COMPLETED`, credit points, insert immutable ledger record.
5. **Post-Commit Side Effects:**
   - Event publishing via `BullMqEventPublisher` ([Link to `/apps/api/src/modules/checkout/infrastructure/events/bullmq-event.publisher.ts`]).
   - Real-time notification via `SessionGateway` ([Link to `/apps/api/src/modules/checkout/presentation/gateways/session.gateway.ts`]).
   - Metrics via `BusinessMetricsService` ([Link to `/apps/api/src/common/metrics/business-metrics.service.ts`]).

**Error Handling Matrix:**

| Failure Mode | Error Code | HTTP Status | POS Behavior | Rollback Strategy |
|--------------|------------|-------------|--------------|-------------------|
| Invalid/missing API Key | `UNAUTHORIZED` | 401 | Show "Invalid credentials" | N/A |
| Invalid request body | `VALIDATION_FAILED` | 400 | Retry with corrected data | N/A |
| QR token expired | `QR_TOKEN_EXPIRED` | 422 | Ask shopper to regenerate QR | N/A |
| QR signature invalid | `INVALID_QR_TOKEN` | 401 | Security alert | N/A |
| Session not found | `SESSION_NOT_FOUND` | 404 | Ask shopper to create new session | N/A |
| Items mismatch | `QR_ITEM_MISMATCH` | 422 | Display mismatch | Session → `VALIDATION_FAILED` |
| DB connection lost | `INTERNAL_ERROR` | 500 | "System error. Retry." | Full `$transaction` rollback |

---

### Workflow 2: Consumer Data Pipeline (B2B Analytics)

**Business Criticality:** B2B revenue path — must be **asynchronous**, **resilient**, and **anonymized**.

**Steps:**

1. **Event Trigger:** `CheckoutService` publishes `CheckoutCompletedEvent` to `analytics-profile-update` queue. Config: [Link to `/apps/api/src/common/queues/queue.config.ts`].
2. **Profile Aggregation (Worker):**
   - `ProfileUpdateProcessor` ([Link to `/apps/analytics-worker/src/processors/profile-update.processor.ts`]) consumes job.
   - `ProfileAggregatorService` ([Link to `/apps/analytics-worker/src/services/profile-aggregator.service.ts`]) computes 90-day rolling profile. Guard: ≥5 transactions required.
3. **AI Classification:**
   - `AiInferenceClient` ([Link to `/apps/analytics-worker/src/infrastructure/ai/ai-inference.client.ts`]) applies Circuit Breaker, Redis cache (`segment:{userId}` TTL 24h), and fallback rule-based classification.
4. **Persist & Invalidate Cache:**
   - `SegmentRepository` ([Link to `/apps/analytics-worker/src/infrastructure/repositories/segment.repository.ts`]) UPSERTs into `consumer_segments`. Invalidates cache keys: `analytics:store:{storeId}:segments`, `analytics:global:segment-distribution`.

**B2B Data Consumption:**

- Endpoint: `GET /analytics/segments?storeId=` in `AnalyticsController` ([Link to `/apps/api/src/modules/analytics/presentation/controllers/analytics.controller.ts`]).
- Service: `AnalyticsService.getSegmentDistribution()` ([Link to `/apps/api/src/modules/analytics/application/services/analytics.service.ts`]).
  - Redis cache check → DB query → group by `segment_name`.
  - Guard: segments <50 users merged into `"other"`.
  - Cache result for 1h, return anonymized distribution.

---

## 2.9. Infrastructure & DevOps

- **Source Control:** Git with GitHub, following Trunk-Based Development. All developers commit to short-lived feature branches (max 24 hours) and merge to `main` via squash-merge pull requests. `main` is always deployable. Branch protection rules at [Link to `/.github/settings.yml`] require 1 approving review, all status checks passing, and up-to-date branches.
- **CI/CD Tooling:** GitHub Actions. The PR validation pipeline is defined in [Link to `/.github/workflows/ci.yml`]. The deployment pipeline is defined in [Link to `/.github/workflows/deploy.yml`]. Docker images are pushed to GitHub Container Registry (GHCR).
- **Infrastructure as Code (IaC):** Terraform (v1.9+) with state stored in Terraform Cloud. Primary providers: `railway`, `cloudflare`, and `github`. The production environment is defined in [Link to `/infra/terraform/environments/production/main.tf`], which manages the API service, analytics worker, PostgreSQL, and Redis instances as code.
- **Deployment Strategy:** Rolling updates with zero downtime (`maxSurge: 1, maxUnavailable: 0`). Database migrations run automatically via Prisma Migrate before new containers receive traffic. Instant rollback is available.

---

### CI/CD Pipeline (Backend)

**Full Pipeline Flow Diagram:**

```mermaid
flowchart TD
    push(["git push feature/xxx"]) 
    pr(["Create PR"])
    merge(["Merge PR to main"])

    subgraph CI_Stage ["CI Pipeline (Feature Branch / PR)"]
        s1["1. Install Deps<br/>• npm ci<br/>• Cache: node_modules"]
        s2["2. Static Analysis<br/>• ESLint<br/>• Prettier check<br/>• TypeScript check (tsc --noEmit)"]
        
        s3a["3a. Unit Tests<br/>(Jest)"]
        s3b["3b. Integ Tests<br/>(Jest + Docker)"]
        s3c["3c. API Contract Tests<br/>(Jest)"]
        
        s4["4. Quality Gate<br/>• Coverage ≥ 80%<br/>• SonarQube pass<br/>• No critical vulns"]
    end

    subgraph CD_Stage ["CD Pipeline (Main Branch)"]
        s5["5. Build & Push<br/>• Docker image<br/>• Tag: main-{sha}<br/>• Push to GHCR"]
        s6["6. Deploy Staging<br/>• Railway / Render<br/>• Auto-deploy"]
        s7["7. Smoke Tests<br/>• (Staging)<br/>• Health check<br/>• Critical flows"]
        
        approval{"Manual Approval?<br/>(Required for prod)"}
        
        s8["8. Deploy Production<br/>• Rolling update<br/>• (zero downtime)"]
        s9["9. Post-Deploy<br/>• Health check<br/>• Sentry watch<br/>• (10 min monitor)"]
    end

    prod_env["Production Environment<br/>(Railway / ECS)"]

    push --> s1
    s1 --> s2
    s2 --> s3a
    s2 --> s3b
    s2 --> s3c
    pr -.-> s3a
    s3a --> s4
    s3b --> s4
    s3c --> s4
    s4 --> merge
    merge --> s5
    s5 --> s6
    s6 --> s7
    s7 --> approval
    approval -- "Approved" --> s8
    s8 --> s9
    s8 --> prod_env
```

### How to Implement the Pipeline

The pipeline is triggered on every push to a pull request targeting `main`. It enforces a series of quality gates. All workflow files are located in [Link to `/.github/workflows/`].

#### Install & Cache Dependencies
- **What to do:** Use `pnpm install --frozen-lockfile` to ensure consistent dependency versions.  
- **Cache:** Global pnpm store and local `node_modules` cached via `actions/cache@v4` keyed on `pnpm-lock.yaml`.  
- **Implementation:** Configure workflow with `NODE_VERSION: '20'` and `PNPM_VERSION: '9'`. Use `concurrency: cancel-in-progress: true`.

#### Lint & Static Analysis
- **Linting:** Run `pnpm lint` (ESLint) with `--max-warnings=0`.  
- **Formatting:** Run `pnpm format:check` (Prettier).  
- **Type Checking:** Run `pnpm type-check` (`tsc --noEmit`).  
- **SonarQube:** Run `sonarsource/sonarqube-scan-action` with `SONAR_TOKEN` and `SONAR_HOST_URL`.

#### Unit Tests
- **What to do:** Run `pnpm test:unit --coverage` (Jest config: [Link to `/apps/api/jest.unit.config.ts`]).  
- **Artifacts:** Upload coverage report (`apps/api/coverage/lcov.info`).

#### Integration Tests
- **What to do:** Spin up `postgres:16-alpine` and `redis:7-alpine` via GitHub Actions `services`.  
- **Database Setup:** Run `pnpm prisma migrate deploy`.  
- **Execution:** Run `pnpm test:integration` (config: [Link to `/apps/api/jest.integration.config.ts`]).  
- **Health Checks:** Use `pg_isready` and `redis-cli ping`.

#### API Contract Tests
- **What to do:** Generate OpenAPI spec with `pnpm openapi:generate`.  
- **Validation:** Run `pnpm openapi:validate` (e.g., `vacuum`).  
- **Execution:** Run `pnpm test:contract` against schemas in [Link to `/packages/shared-types/src/`].

#### Quality Gate Check
- **Coverage Threshold:** Fail if coverage < 80%.  
- **Security Audit:** Run `pnpm audit --audit-level=critical`. Fail on critical/high vulnerabilities.  
- **SonarQube Quality Gate:** Must pass; merge blocked otherwise.

---

#### Quality Gates Summary

| Gate                  | Tool       | Threshold                          | Blocks Merge? |
|-----------------------|------------|------------------------------------|---------------|
| ESLint                | ESLint v9  | 0 warnings, 0 errors               | Yes           |
| Prettier              | Prettier v3| All files formatted                | Yes           |
| TypeScript            | tsc v5     | No type errors                     | Yes           |
| Unit Test Coverage    | Jest       | Statements ≥ 80%, Branches ≥ 75%   | Yes           |
| Integration Tests     | Jest+Docker| All tests pass                     | Yes           |
| API Contract          | OpenAPI Diff | No breaking changes              | Yes           |
| Security Vulnerabilities | pnpm audit | 0 critical, 0 high              | Yes           |
| SonarQube Quality Gate| SonarQube  | Reliability A, Security A, Coverage ≥ 80% | Yes |
| PR Approvals          | GitHub     | 1 approving review                 | Yes           |

---

### Deployment Strategy & Execution

Deployment is triggered automatically by a push to `main` and defined in [Link to `/.github/workflows/deploy.yml`].

#### Build & Push Docker Image

- **Action:** `docker/build-push-action@v5` using multi-stage `Dockerfile` ([Link to `/docker/Dockerfile.api`]).  
- **Tagging:** `docker/metadata-action` generates tags (`main-{sha}`).  
- **Registry:** Push to `ghcr.io`.

#### Deploy to Staging (Automatic)

- **Action:** `railwayapp/railway-deploy@v1` with `RAILWAY_STAGING_TOKEN`.  
- **Migrations:** Run `prisma migrate deploy`.  
- **Smoke Tests:** Poll `https://staging.api.smartcart.app/api/v1/health`. Validate critical flows (register/login).

#### Deploy to Production (Manual Gate)

- **Approval:** GitHub Environment "production" with manual approval.  
- **Execution:** Deploy via `railwayapp/railway-deploy@v1` with `RAILWAY_PRODUCTION_TOKEN`.

#### Post-Deploy Monitoring

- **Stabilization:** Wait 30s, curl `/api/v1/health`.  
- **Error Tracking:** Query Sentry API for unresolved issues (last 5 min).  
- **Notification:** Slack `#deployments` with image tag, commit SHA, author.

---

### Environment Configuration & Local Development

- Copy [Link to `/.env.example`] → `.env`.  
- Run `pnpm docker:up` (Compose file: [Link to `/docker/docker-compose.yml`]).  
- Run `pnpm prisma:migrate`.  
- Run `pnpm dev`.

#### Docker Multi-Stage Build Implementation

- **Stage 1 (Builder):** Install deps, generate Prisma client, compile TS → JS.  
- **Stage 2 (Runner):** Base `node:20-alpine`. Non-root `nestjs` user. Copy production artifacts. `HEALTHCHECK` → `/api/v1/health/liveness`. Start with `node --require ./dist/tracing.js dist/main.js`.

Analytics worker uses [Link to `/docker/Dockerfile.worker`] with same pattern.

---

#### Bundle Size Optimizations

| Technique              | How to Implement | Impact                          |
|------------------------|------------------|---------------------------------|
| Multi-stage Docker Build | `node:20-alpine AS builder` + runner | Final image ~180 MB vs ~600 MB |
| pnpm Prune             | `pnpm prune --prod` | Saves ~150 MB                  |
| Alpine Base Image       | `node:20-alpine` (~50 MB) vs `node:20` (~350 MB) | Saves ~300 MB |
| Prisma Binary Targets   | Only `linux-musl-openssl-3.0.x` | Reduces Prisma engine ~40 MB |
| Tree-shaking            | `tsconfig.json` with `"module": "ESNext"` | Reduces bundle ~15% |

---

#### Available Scripts (root `package.json` [Link to `/package.json`])

- `pnpm dev` — Start API in dev mode  
- `pnpm build` — Build all packages/apps  
- `pnpm lint` — Run ESLint  
- `pnpm format:check` — Verify formatting  
- `pnpm type-check` — Run TypeScript checks  
- `pnpm test:unit` — Unit tests with coverage  
- `pnpm test:integration` — Integration tests  
- `pnpm test:contract` — API contract tests  
- `pnpm docker:up` / `pnpm docker:down` — Start/stop local Docker Compose  
- `pnpm openapi:generate` / `pnpm openapi:validate` — OpenAPI spec tasks  

---

## 2.10 Project scaffold

- **Root:** [`/backend/apps`](/backend/apps/)

```
# Scaffold: backend/

backend/
├── apps/
│   ├── api/
│   │   ├── docker/
│   │   ├── src/
│   │   │   ├── common/
│   │   │   │   ├── decorators/
│   │   │   │   └── pipes/
│   │   │   └── modules/
│   │   │       ├── analytics/
│   │   │       ├── auth/
│   │   │       ├── catalog/
│   │   │       ├── checkout/
│   │   │       │   ├── application/
│   │   │       │   ├── domain/
│   │   │       │   ├── infrastructure/
│   │   │       │   └── presentation/
│   │   │       ├── rewards/
│   │   │       └── (otros módulos)
│   │   └── test/
│   └── analytics-worker/
│       ├── src/
│       │   ├── infrastructure/
│       │   ├── processors/
│       │   └── services/
│       └── test/
├── packages/
│   └── shared-types/
│       ├── src/
│       │   ├── dto/
│       │   └── validation/
│       └── test/
├── infra/
│   ├── docker/
│   └── terraform/
└── .github/
    └── workflows/
```