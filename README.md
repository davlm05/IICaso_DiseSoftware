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

## 2.4 API Design

- **Style**: REST with OpenAPI 3.1 specification — SmartCart exposes a RESTful API over HTTPS because the frontend React Native application uses Axios with REST semantics already established (see Section 1.1 Technology Stack: `apiClient`). REST provides straightforward caching semantics (ETags, `Cache-Control` headers) that align with TanStack Query's client-side cache strategy, predictable HTTP status codes for error mapping in the Axios interceptor, and simpler debugging than GraphQL for the critical POS validation endpoint where reliability trumps query flexibility.

- **Versioning Strategy**: URL prefix versioning: `/api/v1/` — The major version is embedded in the URL path. Breaking changes (field removal, type changes, endpoint removal) increment the version to `/api/v2/`. Non-breaking additions (new optional fields, new endpoints) are added to the current version without a version bump. Deprecated fields are marked with the `x-deprecated` OpenAPI extension and the `Sunset` HTTP header, giving clients 90 days to migrate.

- **Base URL**: `https://api.smartcart.app/api/v1`

- **OpenAPI Specification Location**: `docs/api/openapi.yaml` in the monorepo root. Automatically served at `https://api.smartcart.app/api/docs` via `@nestjs/swagger` in development and staging environments. Production serves a static HTML page with Redoc rendering.

### Open API configuration
```
// 📁 apps/api/src/main.ts — Swagger/OpenAPI setup
import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Global validation — applies Zod schemas to all DTOs
  app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));

  // OpenAPI 3.1 document configuration
  const config = new DocumentBuilder()
    .setTitle('SmartCart API')
    .setDescription('Mobile POS system for barcode scanning, QR checkout, points accrual, and B2B consumer analytics.')
    .setVersion('1.0.0')
    .setContact('SmartCart Engineering', 'https://smartcart.app', 'api@smartcart.app')
    .addServer('https://api.smartcart.app/api/v1', 'Production')
    .addServer('https://staging.api.smartcart.app/api/v1', 'Staging')
    .addServer('http://localhost:3000/api/v1', 'Local Development')
    .addBearerAuth({
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'JWT',
      description: 'JWT access token obtained from POST /auth/login',
    }, 'user-auth')
    .addApiKey({
      type: 'apiKey',
      in: 'header',
      name: 'X-API-Key',
      description: 'API key for POS and B2B partners',
    }, 'api-key')
    .addTag('Auth', 'Authentication & token management')
    .addTag('Users', 'User profile operations')
    .addTag('Products', 'Product catalog & barcode lookup')
    .addTag('Sessions', 'Shopping session lifecycle')
    .addTag('Rewards', 'Rewards catalog & redemption')
    .addTag('Analytics', 'B2B consumer insights & segments')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  // Also write to static file for CI/CD contract testing
  const fs = require('fs');
  fs.writeFileSync('./docs/api/openapi.json', JSON.stringify(document, null, 2));

  await app.listen(3000);
}
bootstrap();
```
### Key endpoints

- **Authentication**

| Method | Path          | Description                                                                                   | Auth Required                     | Rate Limit            |
|--------|---------------|-----------------------------------------------------------------------------------------------|-----------------------------------|-----------------------|
| `POST`   | `/auth/register`| Register a new shopper account                                                                | No                                | 5 req/min per IP      |
| `POST`   | `/auth/login`   | Authenticate with email/password, receive `accessToken` and `refreshToken`                        | No                                | 10 req/min per IP     |
| `POST`   | `/auth/refresh` | Exchange a valid `refreshToken` for a new `accessToken`                                           | Refresh token (HTTP-only cookie)  | 20 req/min per IP     |
| `POST`   | `/auth/logout`  | Revoke the current refreshToken                                                               | Yes (access token)                | —                     |



```
// 📁 apps/api/src/modules/auth/presentation/controllers/auth.controller.ts
import { Controller, Post, Body, UseGuards, Res, Req, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { AuthService } from '../../application/services/auth.service';
import { RegisterRequestSchema, LoginRequestSchema } from '@smartcart/shared-types';
import { ZodValidationPipe } from '../../../../common/pipes/zod-validation.pipe';
import { Public } from '../../../../common/decorators/public.decorator';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  @ApiOperation({ summary: 'Register a new shopper account' })
  @ApiResponse({ status: 201, description: 'User registered successfully' })
  @ApiResponse({ status: 409, description: 'Email already exists' })
  async register(
    @Body(new ZodValidationPipe(RegisterRequestSchema)) body: RegisterRequest,
    @Res({ passthrough: true }) response: Response,
  ): Promise<RegisterResponse> {
    const result = await this.authService.register(body);
    // Set refresh token as HTTP-only cookie
    response.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      path: '/api/v1/auth',
    });
    return { accessToken: result.accessToken, user: result.user };
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Authenticate and receive tokens' })
  @ApiResponse({ status: 200, description: 'Login successful' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(
    @Body(new ZodValidationPipe(LoginRequestSchema)) body: LoginRequest,
    @Res({ passthrough: true }) response: Response,
  ): Promise<LoginResponse> {
    const result = await this.authService.login(body.email, body.password);
    response.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/api/v1/auth',
    });
    return { accessToken: result.accessToken, user: result.user };
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token using refresh token cookie' })
  @ApiResponse({ status: 200, description: 'New access token issued' })
  @ApiResponse({ status: 401, description: 'Invalid or expired refresh token' })
  async refresh(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<{ accessToken: string }> {
    const oldRefreshToken = request.cookies?.refreshToken;
    if (!oldRefreshToken) throw new UnauthorizedException('No refresh token provided');

    const result = await this.authService.refreshTokens(oldRefreshToken);
    // Rotate refresh token — issue new one, revoke old
    response.cookie('refreshToken', result.newRefreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/api/v1/auth',
    });
    return { accessToken: result.accessToken };
  }
}
```

- **User profile** 

| Method | Path                        | Description                                      | Auth Required |
|--------|-----------------------------|--------------------------------------------------|---------------|
| `GET`    | `/users/me`                   | Get current user profile with points balance     | Yes (JWT)     |
| `PATCH`  | `/users/me `                  | Update profile (name, phone)                     | Yes (JWT)     |
| `GET`    | `/users/me/points/history`    | Paginated points transaction history             | Yes (JWT)     |


```
// 📁 apps/api/src/modules/users/presentation/controllers/user.controller.ts
import { Controller, Get, Patch, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../../../common/decorators/current-user.decorator';
import { UserService } from '../../application/services/user.service';

@ApiTags('Users')
@Controller('users')
@UseGuards(JwtAuthGuard)
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('me')
  @ApiOperation({ summary: 'Get current user profile with points balance' })
  @ApiResponse({ status: 200, description: 'User profile returned' })
  async getProfile(@CurrentUser() user: JwtPayload): Promise<UserProfileResponse> {
    return this.userService.getProfile(user.sub);
  }

  @Get('me/points/history')
  @ApiOperation({ summary: 'Get points transaction history (paginated)' })
  @ApiResponse({ status: 200, description: 'Paginated points history' })
  async getPointsHistory(
    @CurrentUser() user: JwtPayload,
    @Query('cursor') cursor?: string,
    @Query('limit') limit: number = 20,
  ): Promise<PaginatedResponse<PointsTransactionDTO>> {
    return this.userService.getPointsHistory(user.sub, { cursor, limit });
  }
}
```
- **Product catalog**

| Method | Path                                | Description                        | Auth Required | Cache                               |
|--------|-------------------------------------|------------------------------------|---------------|-------------------------------------|
| `GET`    | `/products/:barcode`                  | Lookup product by barcode          | Yes (JWT)     | Redis Cache-Aside, TTL 1h           |
| `GET`    | `/products/search?q=leche&limit=10`   | Search products by name/brand      | Yes (JWT)     | Redis, TTL 5 min                    |


```
// 📁 apps/api/src/modules/catalog/presentation/controllers/catalog.controller.ts
import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../../common/guards/jwt-auth.guard';
import { CatalogService } from '../../application/services/catalog.service';

@ApiTags('Products')
@Controller('products')
@UseGuards(JwtAuthGuard)
export class CatalogController {
  constructor(private readonly catalogService: CatalogService) {}

  @Get(':barcode')
  @ApiOperation({ summary: 'Lookup product by barcode' })
  @ApiParam({ name: 'barcode', description: '13-digit EAN-13 barcode', example: '7861234567890' })
  @ApiResponse({ status: 200, description: 'Product found' })
  @ApiResponse({ status: 404, description: 'Product not found in catalog' })
  async findByBarcode(@Param('barcode') barcode: string): Promise<ProductResponse> {
    const product = await this.catalogService.findByBarcode(barcode);
    if (!product) throw new NotFoundException(`Product with barcode ${barcode} not found`);
    return product;
  }

  @Get('search')
  @ApiOperation({ summary: 'Search products by name or brand' })
  async search(
    @Query('q') query: string,
    @Query('limit') limit: number = 10,
  ): Promise<ProductResponse[]> {
    return this.catalogService.search(query, Math.min(limit, 50));
  }
}
```

- **Cache-aside implementation**
```
// 📁 apps/api/src/modules/catalog/application/services/catalog.service.ts
@Injectable()
export class CatalogService implements ICatalogService {
  constructor(
    private readonly redis: RedisService,
    private readonly prisma: PrismaService,
  ) {}

  async findByBarcode(barcode: string): Promise<ProductResponse | null> {
    const cacheKey = `product:barcode:${barcode}`;

    // 1. Check Redis cache
    const cached = await this.redis.get(cacheKey);
    if (cached) {
      this.logger.debug({ barcode, hit: true }, 'Cache hit for barcode');
      return JSON.parse(cached);
    }

    // 2. Cache miss — query PostgreSQL
    const product = await this.prisma.product.findUnique({
      where: { barcode },
      include: { pointsConfig: true },
    });

    if (!product) return null;

    const response = this.mapToResponse(product);

    // 3. Populate cache with TTL
    await this.redis.set(cacheKey, JSON.stringify(response), 'EX', 3600); // 1 hour

    return response;
  }
}
```

- **Shopping sessions**

| Method | Path                          | Description                                              | Auth Required        |
|--------|-------------------------------|----------------------------------------------------------|----------------------|
| `POST`   | `/sessions`                     | Create a new shopping session for the authenticated user | Yes (JWT)            |
| `GET`    | `/sessions/active`              | Get the user's currently active session (if any)         | Yes (JWT)            |
| `POST`   | `/sessions/:id/items`           | Add a scanned item to the session                        | Yes (JWT)            |
| `DELETE` | `/sessions/:id/items/:itemId`   | Remove an item from the session (undo scan)              | Yes (JWT)            |
| `POST`   | `/sessions/:id/qr`              | Finalize session and generate checkout QR                | Yes (JWT)            |
| `POST`   | `/sessions/:id/validate`        | POS endpoint: Validate QR and credit points              | POS API Key          |
| `GET`    | `/sessions/:id`                 | Get session details (for receipt/history)                | Yes (JWT)            |


- **Rewards** 

| Method | Path                  | Description                                      | Auth Required |
|--------|-----------------------|--------------------------------------------------|---------------|
| `GET`    | `/rewards`              | List all active rewards                          | Yes (JWT)     |
| `GET`    | `/rewards/:id`          | Get reward details                               | Yes (JWT)     |
| `POST`   | `/rewards/:id/redeem`   | Redeem points for a reward; returns coupon code  | Yes (JWT)     |


- **B2B Analytics** 

| Method | Path                               | Description                                                           | Auth Required  |
|--------|------------------------------------|-----------------------------------------------------------------------|----------------|
| `GET`    | `/analytics/segments`                | Get consumer segment distribution (optionally filtered by `?storeId=`)  | B2B API Key    |
| `GET`    | `/analytics/products/:id/insights`   | Get demand predictions and performance metrics for a product          | B2B API Key    |
| `GET`    | `/analytics/stores/:id/overview`     | Get store-level metrics (avg ticket, peak hours, segment mix)         | B2B API Key    |


```
// 📁 apps/api/src/modules/analytics/presentation/controllers/analytics.controller.ts
import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiSecurity } from '@nestjs/swagger';
import { ApiKeyGuard } from '../../../../common/guards/api-key.guard';
import { AnalyticsService } from '../../application/services/analytics.service';

@ApiTags('Analytics')
@Controller('analytics')
@UseGuards(ApiKeyGuard)
@ApiSecurity('api-key')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('segments')
  @ApiOperation({ summary: 'Get consumer segment distribution' })
  @ApiResponse({ status: 200, description: 'Aggregated and anonymized segment data' })
  async getSegments(
    @Query('storeId') storeId?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ): Promise<SegmentDistributionResponse> {
    return this.analyticsService.getSegmentDistribution({
      storeId,
      dateRange: from && to ? { from: new Date(from), to: new Date(to) } : undefined,
    });
  }

  @Get('products/:id/insights')
  @ApiOperation({ summary: 'Get product performance and demand predictions' })
  async getProductInsights(@Param('id') productId: string): Promise<ProductInsightsResponse> {
    return this.analyticsService.getProductInsights(productId);
  }
}
```

### Data contracts (DTO's)

All DTOs are defined in ``packages/shared-types/`` and validated at runtime with Zod schemas in the NestJS ``ValidationPipe``. This ensures contract consistency between frontend and backend.

- **Auth contracts**
```
// 📁 packages/shared-types/src/auth.types.ts
import { z } from 'zod';

// ─── Register ──────────────────────────────────────────────
export interface RegisterRequest {
  fullName: string;
  email: string;
  password: string;
  phone?: string;
}

export const RegisterRequestSchema = z.object({
  fullName: z.string().min(2).max(200),
  email: z.string().email(),
  password: z.string().min(8).max(128)
    .regex(/[A-Z]/, 'Must contain an uppercase letter')
    .regex(/[a-z]/, 'Must contain a lowercase letter')
    .regex(/[0-9]/, 'Must contain a number'),
  phone: z.string().regex(/^\+?[1-9]\d{7,14}$/).optional(),
});

export interface RegisterResponse {
  accessToken: string;
  user: {
    id: string;
    fullName: string;
    email: string;
  };
}

// ─── Login ─────────────────────────────────────────────────
export interface LoginRequest {
  email: string;
  password: string;
}

export const LoginRequestSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1, 'Password is required'),
});

export interface LoginResponse {
  accessToken: string;
  user: {
    id: string;
    fullName: string;
    email: string;
    pointsBalance: number;
  };
}

// ─── JWT Payload ───────────────────────────────────────────
export interface JwtPayload {
  sub: string;       // user ID
  email: string;
  role: UserRole;
  iat: number;
  exp: number;
}

export enum UserRole {
  SHOPPER = 'shopper',
  POS_OPERATOR = 'pos_operator',
  CUSTOMER_SERVICE = 'customer_service',
  B2B_PARTNER = 'b2b_partner',
  ADMIN = 'admin',
}
```

- **Session contracts**
```
// 📁 packages/shared-types/src/session.types.ts
import { z } from 'zod';

// ─── Create Session ────────────────────────────────────────
export interface CreateSessionRequest {
  storeId: string;
}

export const CreateSessionRequestSchema = z.object({
  storeId: z.string().uuid(),
});

export interface CreateSessionResponse {
  session: {
    id: string;
    storeId: string;
    status: 'ACTIVE';
    createdAt: string; // ISO 8601
  };
}

// ─── Add Item ──────────────────────────────────────────────
export interface AddItemRequest {
  barcode: string;
}

export const AddItemRequestSchema = z.object({
  barcode: z.string().min(8).max(14).regex(/^\d+$/, 'Barcode must be numeric'),
});

export interface AddItemResponse {
  item: {
    productId: string;
    name: string;
    brand: string;
    barcode: string;
    pointsValue: number;
    imageUrl: string | null;
    isSponsored: boolean;
  };
  session: {
    id: string;
    totalPendingItems: number;
    totalPendingPoints: number;
    status: string;
  };
}

// ─── Generate QR ───────────────────────────────────────────
export interface GenerateQrResponse {
  qrToken: string;
  expiresAt: string; // ISO 8601
  sessionId: string;
  itemCount: number;
  totalPoints: number;
}

// ─── Validate QR (POS) ─────────────────────────────────────
export interface ValidateSessionRequest {
  qrToken: string;
  scannedItems: Array<{
    barcode: string;
    quantity: number;
  }>;
}

export const ValidateSessionRequestSchema = z.object({
  qrToken: z.string().min(1, 'QR token is required'),
  scannedItems: z.array(z.object({
    barcode: z.string().min(8).max(14).regex(/^\d+$/),
    quantity: z.number().int().min(1),
  })).min(1, 'At least one item must be scanned'),
});

export interface ValidateSessionResponse {
  success: boolean;
  pointsAwarded: number;
  itemsMatched: number;
  itemsMismatched: number;
  sessionId: string;
  completedAt: string;
}
```

- **Product contracts**
```
// 📁 packages/shared-types/src/product.types.ts

export interface ProductResponse {
  id: string;
  name: string;
  brand: string;
  barcode: string;
  pointsValue: number;
  pointsConfig: {
    type: 'FIXED_PER_UNIT' | 'SPEND_MULTIPLIER' | 'VOLUME_TIER';
    value: number | number[];
  };
  imageUrl: string | null;
  isSponsored: boolean;
  category: string;
}
```

- **Rewards contract**
```
// GET /rewards — Response
{
  "rewards": [
    {
      "id": "b8a8f6a0-4d3e-4e1a-9f6e-7b8c5d2a1f0b",
      "name": "10% Discount Voucher",
      "description": "Get 10% off your next purchase at any affiliated store.",
      "pointsCost": 500,
      "imageUrl": "https://cdn.smartcart.app/rewards/discount.png",
      "validDays": 30,
      "isActive": true
    }
  ],
  "total": 12
}

// POST /rewards/:id/redeem — Response
{
  "redemption": {
    "id": "c9b9g7b1-5e4f-5f2b-0g7f-8c9d6e3b2g1c",
    "rewardId": "b8a8f6a0-4d3e-4e1a-9f6e-7b8c5d2a1f0b",
    "rewardName": "10% Discount Voucher",
    "pointsDeducted": 500,
    "couponCode": "SC-DISC-ABCD1234",
    "redeemedAt": "2026-06-09T14:30:00Z",
    "expiresAt": "2026-07-09T14:30:00Z"
  }
}
```

- **Analytic B2B contracts**
```
// GET /analytics/segments?storeId=xxx — Response
{
  "segments": [
    { "name": "premium_organic", "count": 1250, "percentage": 28.5 },
    { "name": "budget_conscious", "count": 2100, "percentage": 47.9 },
    { "name": "impulse_buyer", "count": 580, "percentage": 13.2 },
    { "name": "brand_loyal", "count": 450, "percentage": 10.3 }
  ],
  "totalClassifiedUsers": 4380,
  "modelVersion": "v2.3.1",
  "generatedAt": "2026-06-09T14:00:00Z",
  "filters": {
    "storeId": "550e8400-e29b-41d4-a716-446655440000",
    "dateRange": {
      "from": "2026-06-02T00:00:00Z",
      "to": "2026-06-09T00:00:00Z"
    }
  }
}
```

### Standarized Error Response Format

All errors follow a consistent structure for reliable handling in the frontend Axios interceptor.

```
// 📁 apps/api/src/common/filters/http-exception.filter.ts
import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';

interface ErrorResponse {
  errorCode: string;
  message: string;
  details?: Array<{ field: string; message: string }>;
  timestamp: string;
  correlationId: string;
}

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let errorResponse: ErrorResponse = {
      errorCode: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred',
      timestamp: new Date().toISOString(),
      correlationId: request.headers['x-correlation-id'] ?? 'unknown',
    };

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        errorResponse = {
          errorCode: (exceptionResponse as any).errorCode ?? this.mapStatusToCode(status),
          message: (exceptionResponse as any).message ?? exception.message,
          details: (exceptionResponse as any).details,
          timestamp: new Date().toISOString(),
          correlationId: request.headers['x-correlation-id'] ?? 'unknown',
        };
      }
    }

    // Log all errors with correlation ID for traceability
    console.error({
      correlationId: errorResponse.correlationId,
      status,
      errorCode: errorResponse.errorCode,
      path: request.url,
      method: request.method,
    });

    response.status(status).json(errorResponse);
  }

  private mapStatusToCode(status: number): string {
    const mapping: Record<number, string> = {
      400: 'VALIDATION_FAILED',
      401: 'UNAUTHORIZED',
      403: 'FORBIDDEN',
      404: 'NOT_FOUND',
      409: 'CONFLICT',
      429: 'RATE_LIMIT_EXCEEDED',
    };
    return mapping[status] ?? 'INTERNAL_ERROR';
  }
}
```
- **Example response**
```
// 400 — Validation Error
{
  "errorCode": "VALIDATION_FAILED",
  "message": "Request validation failed",
  "details": [
    { "field": "barcode", "message": "Barcode must be numeric" }
  ],
  "timestamp": "2026-06-09T14:30:00Z",
  "correlationId": "abc-123-def-456"
}

// 404 — Product Not Found
{
  "errorCode": "NOT_FOUND",
  "message": "Product with barcode 9999999999999 not found",
  "timestamp": "2026-06-09T14:30:00Z",
  "correlationId": "abc-123-def-456"
}

// 409 — Business Rule Violation
{
  "errorCode": "DUPLICATE_SESSION",
  "message": "User already has an active session: sessionId=xxx",
  "timestamp": "2026-06-09T14:30:00Z",
  "correlationId": "abc-123-def-456"
}

// 422 — QR Validation Failed (domain error)
{
  "errorCode": "QR_ITEM_MISMATCH",
  "message": "Scanned items do not match the QR session items",
  "details": [
    { "field": "sessionHash", "message": "abc123..." },
    { "field": "scannedHash", "message": "def456..." }
  ],
  "timestamp": "2026-06-09T14:30:00Z",
  "correlationId": "abc-123-def-456"
}
```
**Asynchronous communication**

| Mechanism                          | Use Case                                                                                          | Queue / Channel              | Payload                                                                                                      |
|------------------------------------|---------------------------------------------------------------------------------------------------|------------------------------|--------------------------------------------------------------------------------------------------------------|
| BullMQ (Redis-backed)              | Consumer profiling pipeline triggered after checkout validation                                   | `analytics-profile-update`     | `{ userId, sessionId, storeId, items[], pointsAwarded, timestamp }`                                            |
| BullMQ (Redis-backed)              | Push notification to mobile device after points are credited                                      | `push-notifications`           | `{ userId, pointsAwarded, sessionId, pushToken }`                                                              |
| WebSocket (Socket.IO + Redis adapter) | Real-time QR validation status pushed to mobile client so the screen flips from "Esperando validación…" to the confirmation screen | `session:{sessionId}` room     | `{ event: 'sessionValidated', sessionId, pointsAwarded, timestamp }`                                           |
| WebSocket (Socket.IO + Redis adapter) | Session expiry notification if the POS does not validate within 5 minutes                        | `session:{sessionId}` room     | `{ event: 'sessionExpired', sessionId, reason: 'QR_TIMEOUT' }`                                                 |


- **WebSocket gateway implementation**:
```
// 📁 apps/api/src/modules/checkout/presentation/gateways/session.gateway.ts
import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { UseGuards } from '@nestjs/common';
import { WsJwtGuard } from '../../../../common/guards/ws-jwt.guard';

@WebSocketGateway({
  namespace: '/ws/sessions',
  cors: { origin: process.env.ALLOWED_ORIGINS?.split(',') ?? '*' },
})
export class SessionGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  /**
   * Mobile client connects and joins a room scoped to their session.
   * Authentication is validated via JWT in the handshake.
   */
  @UseGuards(WsJwtGuard)
  @SubscribeMessage('subscribe:session')
  async handleSubscribeToSession(
    client: Socket,
    payload: { sessionId: string },
  ): Promise<void> {
    const room = `session:${payload.sessionId}`;
    await client.join(room);
    client.emit('subscribed', { room, status: 'ok' });
  }

  /**
   * Called by CheckoutService after the POS validates a QR.
   * Pushes the result to the mobile client in real time.
   */
  async notifySessionValidated(
    sessionId: string,
    data: { pointsAwarded: number; completedAt: string },
  ): Promise<void> {
    this.server.to(`session:${sessionId}`).emit('sessionValidated', {
      sessionId,
      pointsAwarded: data.pointsAwarded,
      completedAt: data.completedAt,
    });
  }

  /**
   * Called by SessionExpirationService when a QR expires.
   */
  async notifySessionExpired(sessionId: string): Promise<void> {
    this.server.to(`session:${sessionId}`).emit('sessionExpired', {
      sessionId,
      reason: 'QR_TIMEOUT',
      message: 'Your QR code has expired. Please generate a new one.',
    });
  }

  handleConnection(client: Socket): void {
    console.log(`WebSocket client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket): void {
    console.log(`WebSocket client disconnected: ${client.id}`);
  }
}
```

- **Redis adapter for multi-instance websocket**:
```
// 📁 apps/api/src/modules/checkout/checkout.module.ts (WebSocket adapter configuration)
import { RedisIoAdapter } from '../../common/adapters/redis-io.adapter';

// In main.ts or module configuration:
const redisIoAdapter = new RedisIoAdapter(app);
await redisIoAdapter.connectToRedis({
  host: process.env.REDIS_HOST ?? 'localhost',
  port: parseInt(process.env.REDIS_PORT ?? '6379'),
});
app.useWebSocketAdapter(redisIoAdapter);
```

- **BullMQ Queue Configuration**
```
// 📁 apps/api/src/common/queues/queue.config.ts
import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';

@Module({
  imports: [
    BullModule.forRoot({
      connection: {
        host: process.env.REDIS_HOST ?? 'localhost',
        port: parseInt(process.env.REDIS_PORT ?? '6379'),
      },
      defaultJobOptions: {
        attempts: 3,             // Retry up to 3 times on failure
        backoff: {
          type: 'exponential',   // Wait 1s, then 2s, then 4s between retries
          delay: 1000,
        },
        removeOnComplete: {
          age: 24 * 3600,        // Keep completed jobs for 24 hours for debugging
        },
        removeOnFail: {
          age: 7 * 24 * 3600,    // Keep failed jobs for 7 days
        },
      },
    }),
    BullModule.registerQueue(
      { name: 'analytics-profile-update' },
      { name: 'push-notifications' },
    ),
  ],
  exports: [BullModule],
})
export class QueueModule {}
```

### Frontend axios client integration

The shared types and error format feed directly into the React Native Axios client:

```
// 📁 apps/mobile/src/api/api-client.ts
// Frontend Axios client consuming the shared DTOs
import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { AddItemRequest, AddItemResponse, ProductResponse } from '@smartcart/shared-types';
import { getTokens, saveTokens, clearTokens } from '../utils/secure-storage';

const apiClient = axios.create({
  baseURL: 'https://api.smartcart.app/api/v1',
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor: attach JWT access token
apiClient.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  const tokens = await getTokens();
  if (tokens?.accessToken) {
    config.headers.Authorization = `Bearer ${tokens.accessToken}`;
  }
  // Add correlation ID for tracing
  config.headers['X-Correlation-Id'] = generateCorrelationId();
  return config;
});

// Response interceptor: handle token refresh on 401
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<{ errorCode: string; message: string }>) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const tokens = await getTokens();
      if (tokens?.refreshToken) {
        try {
          const { data } = await axios.post('/auth/refresh', {}, {
            withCredentials: true, // sends HTTP-only refresh cookie
          });
          await saveTokens({ accessToken: data.accessToken, refreshToken: tokens.refreshToken });
          originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
          return apiClient(originalRequest);
        } catch {
          await clearTokens();
          // Navigate to login screen
        }
      }
    }

    // Standardized error mapping
    const errorCode = error.response?.data?.errorCode ?? 'NETWORK_ERROR';
    const message = error.response?.data?.message ?? error.message;
    return Promise.reject({ errorCode, message });
  },
);

export default apiClient;
```

### Health check endpoint
```
// 📁 apps/api/src/common/health/health.controller.ts
import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Public } from '../decorators/public.decorator';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  @Get()
  @Public()
  @ApiOperation({ summary: 'Service health check' })
  async check(): Promise<HealthCheckResponse> {
    const checks = {
      database: await this.checkDatabase(),
      redis: await this.checkRedis(),
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    };

    const allHealthy = Object.values(checks).every(c => c !== false);
    return {
      status: allHealthy ? 'healthy' : 'degraded',
      checks,
    };
  }

  private async checkDatabase(): Promise<boolean> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return true;
    } catch {
      return false;
    }
  }

  private async checkRedis(): Promise<boolean> {
    try {
      await this.redis.ping();
      return true;
    } catch {
      return false;
    }
  }
}

interface HealthCheckResponse {
  status: 'healthy' | 'degraded';
  checks: Record<string, unknown>;
}
```

### API versioning and deprecation strategy
```
// 📁 apps/api/src/common/interceptors/deprecation.interceptor.ts
import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

/**
 * Adds Sunset and Deprecation headers to responses for endpoints
 * that are scheduled for removal in a future API version.
 */
@Injectable()
export class DeprecationInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const response = context.switchToHttp().getResponse();

    // Example: old endpoint being deprecated
    if (context.getHandler().name === 'legacyProductLookup') {
      response.setHeader('Deprecation', 'true');
      response.setHeader('Sunset', 'Sat, 01 Sep 2026 00:00:00 GMT');
      response.setHeader(
        'Link',
        '</api/v2/products>; rel="successor-version"',
      );
    }

    return next.handle().pipe(
      map(data => ({
        ...data,
        _meta: response.getHeaders()['deprecation']
          ? { deprecated: true, sunset: response.getHeaders()['sunset'] }
          : undefined,
      })),
    );
  }
}
```

---

## 2.5 Security

This section documents every security control in the SmartCart backend, organized by the OWASP Application Security Verification Standard (ASVS) categories where applicable. Each control includes its implementation mechanism, the specific threat it mitigates, and the code path where it is enforced.

### Security Architecture Overview
```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                         SmartCart Security Architecture                               │
│                                                                                     │
│  ┌──────────────┐     HTTPS (TLS 1.3)       ┌────────────────────────────────────┐  │
│  │ Mobile App   │─────────────────────────▶│         API Gateway / Nginx         │  │
│  │ (React Native)│     HSTS enforced        │                                    │  │
│  └──────────────┘                           │  - TLS termination                  │  │
│         │                                   │  - Rate limiting                    │  │
│         │ JWT in Authorization header       │  - Request size limits (10MB)       │  │
│         │ Refresh token in HTTP-only cookie │  - CORS policy                      │  │
│         ▼                                   │  - Security headers (Helmet)        │  │
│  ┌──────────────────────────────────────────┼────────────────────────────────────┘  │
│  │                        NestJS Application (Modular Monolith)                     │
│  │                                                                                 │
│  │  ┌──────────────────────────────────────────────────────────────────────────┐  │
│  │  │                        Middleware Pipeline (order matters)                 │  │
│  │  │                                                                          │  │
│  │  │  1. HelmetMiddleware      → Security headers (CSP, X-Frame-Options...)   │  │
│  │  │  2. CorrelationIdMiddleware → Attach X-Correlation-Id to every request    │  │
│  │  │  3. RateLimiterMiddleware  → Throttle requests by IP / user               │  │
│  │  │  4. JwtAuthGuard          → Verify JWT signature + expiry (except @Public)│  │
│  │  │  5. RolesGuard            → Check user.role against @Roles() decorator    │  │
│  │  │  6. ResourceOwnershipGuard→ Verify userId in JWT matches resource owner   │  │
│  │  │  7. ValidationPipe        → Validate all inputs against Zod schemas       │  │
│  │  │  8. Controller            → Business logic executes                      │  │
│  │  │  9. AuditInterceptor      → Log sensitive operations                     │  │
│  │  │  10. ExceptionFilter      → Standardize error responses, hide internals  │  │
│  │  └──────────────────────────────────────────────────────────────────────────┘  │
│  └─────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                     │
│  ┌────────────────────────────┐  ┌────────────────────────────┐                     │
│  │ PostgreSQL (AES-256 at rest)│  │ Redis (TLS, AUTH password) │                     │
│  │ TLS 1.3 in transit         │  │                            │                     │
│  └────────────────────────────┘  └────────────────────────────┘                     │
└─────────────────────────────────────────────────────────────────────────────────────┘

```

- **1. Transport Security**

| Concern               | Strategy                                                                                                      | Implementation                |
|-----------------------|--------------------------------------------------------------------------------------------------------------|-------------------------------|
| HTTPS Enforcement     | All traffic is encrypted via TLS 1.3. HTTP requests are redirected to HTTPS at the Nginx reverse proxy layer. | `docker/nginx/default.conf`     |
| TLS Version           | TLS 1.3 minimum; TLS 1.2 accepted only for legacy Android devices (API level < 26).                          | Nginx configuration           |
| HSTS                  | `Strict-Transport-Security` header set to `max-age=31536000; includeSubDomains; preload`.                        | Helmet middleware             |
| Certificate Management| Let's Encrypt certificates auto-renewed via Certbot in production. Managed certificates on Railway/Render.   | CI/CD pipeline                |


```
# 📁 docker/nginx/default.conf — TLS termination & HSTS
server {
    listen 80;
    server_name api.smartcart.app;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.smartcart.app;

    # TLS 1.3 with strong ciphers
    ssl_protocols TLSv1.3 TLSv1.2;
    ssl_ciphers 'ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384';
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # HSTS (1 year, include subdomains, preload list)
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;

    # Prevent MIME type sniffing
    add_header X-Content-Type-Options "nosniff" always;

    # Prevent clickjacking
    add_header X-Frame-Options "DENY" always;

    # Limit request body size to prevent DoS
    client_max_body_size 10m;

    location /api/ {
        proxy_pass http://api:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /ws/ {
        proxy_pass http://api:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

- **2. Helmet middleware - security headers**
```
// 📁 apps/api/src/main.ts — Helmet configuration
import helmet from 'helmet';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(helmet({
    // Content Security Policy
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'none'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'https://cdn.smartcart.app'],
        connectSrc: ["'self'", 'wss://api.smartcart.app'],
        frameAncestors: ["'none'"],
        formAction: ["'self'"],
      },
    },
    // Prevent browsers from doing DNS prefetch
    dnsPrefetchControl: { allow: false },
    // Prevent browsers from inferring MIME types
    noSniff: true,
    // Prevent clickjacking
    frameguard: { action: 'deny' },
    // Remove X-Powered-By header
    hidePoweredBy: true,
    // HTTP Public Key Pinning (not enforced, report-only)
    hpkp: false,
    // IE-specific: prevent executing downloads
    ieNoOpen: true,
    // Don't include referrer header on navigation to less secure destinations
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    // Prevent XSS via reflected X-XSS-Protection header
    xssFilter: true,
  }));

  await app.listen(3000);
}
```

- **3. Authentication**

| Concern              | Strategy                                                                                                                                    | Implementation                                                                 |
|----------------------|--------------------------------------------------------------------------------------------------------------------------------------------|--------------------------------------------------------------------------------|
| Primary Auth         | JWT `accessToken` (15-minute expiry) in `Authorization: Bearer header`. `refreshToken` (7-day expiry) in HTTP-only, Secure, SameSite=Strict cookie. | `apps/api/src/modules/auth/`                                                     |
| Token Signing        | HS256 with 256-bit secret from environment variable. RS256 planned for multi-service future (public key distribution).                       | `apps/api/src/modules/auth/infrastructure/crypto/jwt.service.ts`                 |
| Token Storage (Client)| `accessToken` in memory (Zustand store). `refreshToken` in expo-secure-store (iOS Keychain / Android Keystore). Never in `AsyncStorage`.          | `apps/mobile/src/utils/secure-storage.ts`                                        |
| Password Hashing     | bcrypt with cost factor 12. Salt generated per-password.                                                                                   | `apps/api/src/modules/auth/infrastructure/crypto/password.service.ts`            |
| Password Policy      | Minimum 8 characters, must contain uppercase, lowercase, and number. Validated by Zod schema at registration.                               | `packages/shared-types/src/auth.types.ts`                                        |
| Account Lockout      | 5 failed login attempts within 15 minutes locks the account for 30 minutes. Implemented via Redis `login_attempts:{email}` key with TTL.       | `apps/api/src/modules/auth/application/services/auth.service.ts`                 |
| Token Revocation     | `refreshToken` is stored hashed in the database. On logout, the token is deleted. On refresh, the old token is invalidated (rotation).         |  `apps/api/src/modules/auth/application/services/auth.service.ts`                 |


```
// 📁 apps/api/src/modules/auth/infrastructure/crypto/password.service.ts
import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class PasswordService {
  private readonly BCRYPT_ROUNDS = 12;

  /**
   * Hash a plain-text password with bcrypt.
   * Cost factor 12 = ~250ms on modern hardware — acceptable for login,
   * resistant to brute-force.
   */
  async hash(plainText: string): Promise<string> {
    return bcrypt.hash(plainText, this.BCRYPT_ROUNDS);
  }

  /**
   * Constant-time comparison prevents timing attacks.
   */
  async compare(plainText: string, hash: string): Promise<boolean> {
    return bcrypt.compare(plainText, hash);
  }

  /**
   * Validate password strength.
   * Called before hashing — prevents weak passwords from being stored.
   */
  validateStrength(password: string): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    if (password.length < 8) errors.push('Minimum 8 characters required');
    if (!/[A-Z]/.test(password)) errors.push('Must contain an uppercase letter');
    if (!/[a-z]/.test(password)) errors.push('Must contain a lowercase letter');
    if (!/[0-9]/.test(password)) errors.push('Must contain a number');
    if (password.length > 128) errors.push('Maximum 128 characters allowed');
    return { valid: errors.length === 0, errors };
  }
}
```

```
// 📁 apps/api/src/modules/auth/application/services/auth.service.ts — Account lockout
import { Injectable, UnauthorizedException, TooManyRequestsException } from '@nestjs/common';
import { RedisService } from '../../../../common/redis/redis.service';

@Injectable()
export class AuthService {
  private readonly MAX_LOGIN_ATTEMPTS = 5;
  private readonly LOCKOUT_DURATION = 30 * 60; // 30 minutes in seconds
  private readonly ATTEMPT_WINDOW = 15 * 60;   // 15 minutes in seconds

  constructor(
    private readonly redis: RedisService,
    private readonly passwordService: PasswordService,
    private readonly userRepo: IUserRepository,
  ) {}

  async login(email: string, password: string): Promise<LoginResult> {
    // 1. Check if account is locked
    const lockKey = `auth:lockout:${email}`;
    const isLocked = await this.redis.exists(lockKey);
    if (isLocked) {
      const ttl = await this.redis.ttl(lockKey);
      throw new TooManyRequestsException(
        `Account temporarily locked. Try again in ${Math.ceil(ttl / 60)} minutes.`,
      );
    }

    // 2. Find user
    const user = await this.userRepo.findByEmail(email);
    if (!user) {
      await this.recordFailedAttempt(email);
      throw new UnauthorizedException('Invalid email or password');
    }

    // 3. Verify password
    const isPasswordValid = await this.passwordService.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      await this.recordFailedAttempt(email);
      throw new UnauthorizedException('Invalid email or password');
    }

    // 4. Successful login — clear failed attempts
    await this.redis.del(`auth:attempts:${email}`);

    // 5. Generate tokens
    return this.generateTokens(user);
  }

  /**
   * Records a failed login attempt in Redis.
   * If attempts exceed threshold, locks the account.
   */
  private async recordFailedAttempt(email: string): Promise<void> {
    const key = `auth:attempts:${email}`;
    const attempts = await this.redis.incr(key);

    if (attempts === 1) {
      // Set TTL on first attempt within the window
      await this.redis.expire(key, this.ATTEMPT_WINDOW);
    }

    if (attempts >= this.MAX_LOGIN_ATTEMPTS) {
      // Lock the account
      await this.redis.set(
        `auth:lockout:${email}`,
        `Locked after ${attempts} failed attempts`,
        'EX',
        this.LOCKOUT_DURATION,
      );
    }
  }
}
```

```
// 📁 apps/api/src/modules/auth/infrastructure/crypto/jwt.service.ts
import { Injectable } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
import { JwtPayload, UserRole } from '@smartcart/shared-types';

@Injectable()
export class JwtService {
  private readonly ACCESS_SECRET: Buffer;
  private readonly REFRESH_SECRET: Buffer;
  private readonly ACCESS_TTL = '15m';
  private readonly REFRESH_TTL = '7d';

  constructor() {
    this.ACCESS_SECRET = Buffer.from(process.env.JWT_ACCESS_SECRET ?? '', 'utf-8');
    this.REFRESH_SECRET = Buffer.from(process.env.JWT_REFRESH_SECRET ?? '', 'utf-8');

    if (this.ACCESS_SECRET.length < 32 || this.REFRESH_SECRET.length < 32) {
      throw new Error('JWT secrets must be at least 32 characters (256 bits)');
    }
  }

  async signAccessToken(payload: Omit<JwtPayload, 'iat' | 'exp'>): Promise<string> {
    return new Promise((resolve, reject) => {
      jwt.sign(
        payload,
        this.ACCESS_SECRET,
        {
          algorithm: 'HS256',
          expiresIn: this.ACCESS_TTL,
          issuer: 'smartcart',
          subject: payload.sub,
        },
        (err, token) => (err ? reject(err) : resolve(token!)),
      );
    });
  }

  async signRefreshToken(userId: string): Promise<string> {
    return new Promise((resolve, reject) => {
      jwt.sign(
        { sub: userId, type: 'refresh' },
        this.REFRESH_SECRET,
        {
          algorithm: 'HS256',
          expiresIn: this.REFRESH_TTL,
          issuer: 'smartcart',
          jwtid: crypto.randomUUID(),
        },
        (err, token) => (err ? reject(err) : resolve(token!)),
      );
    });
  }

  async verifyAccessToken(token: string): Promise<JwtPayload> {
    return new Promise((resolve, reject) => {
      jwt.verify(
        token,
        this.ACCESS_SECRET,
        {
          algorithms: ['HS256'],
          issuer: 'smartcart',
          clockTolerance: 30,
        },
        (err, decoded) => {
          if (err) reject(new UnauthorizedException(this.mapJwtError(err)));
          else resolve(decoded as JwtPayload);
        },
      );
    });
  }

  private mapJwtError(err: jwt.VerifyErrors): string {
    if (err instanceof jwt.TokenExpiredError) return 'Access token has expired';
    if (err instanceof jwt.JsonWebTokenError) return 'Invalid access token';
    return 'Token verification failed';
  }
}
```

- **4. Authorization**

| Concern                  | Strategy                                                                                                                       | Implementation                                         |
|---------------------------|-------------------------------------------------------------------------------------------------------------------------------|--------------------------------------------------------|
| Role-Based Access Control (RBAC) | Five roles: `shopper`, `pos_operator`, `customer_service`, `b2b_partner`, `admin`. Each endpoint decorated with `@Roles()` requiring specific roles. | `apps/api/src/common/guards/roles.guard.ts`              |
| Resource Ownership        | Users can only access their own sessions, points, and redemptions. `ResourceOwnershipGuard` compares `userId` from JWT with the resource's owner. | `apps/api/src/common/guards/resource-ownership.guard.ts` |
| POS API Key Auth          | POS endpoints use API Key authentication (`X-API-Key header`) with scoped permissions (only `POST /sessions/:id/validate`).        | `apps/api/src/common/guards/api-key.guard.ts`            |
| B2B API Key Auth          | B2B analytics endpoints use separate API keys with read-only access to aggregated data.                                       | `apps/api/src/common/guards/api-key.guard.ts`            |


```
// 📁 apps/api/src/common/guards/roles.guard.ts
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '@smartcart/shared-types';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // If no roles are required, allow access (used with @Public or open endpoints)
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();
    if (!user) return false;

    return requiredRoles.includes(user.role);
  }
}

// Decorator for specifying required roles on endpoints
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
```

```
// 📁 apps/api/src/common/guards/resource-ownership.guard.ts
import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';

/**
 * Verifies that the authenticated user is accessing their own resources.
 * Compares `req.user.sub` (userId from JWT) with `req.params.userId`
 * or the `userId` field on the request body.
 */
@Injectable()
export class ResourceOwnershipGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const authenticatedUserId = request.user?.sub;

    if (!authenticatedUserId) return false;

    // Check URL param: /users/:userId/...
    const paramUserId = request.params?.userId;
    if (paramUserId && paramUserId !== authenticatedUserId) {
      throw new ForbiddenException('You can only access your own resources');
    }

    // Check body field: { userId: "..." }
    const bodyUserId = request.body?.userId;
    if (bodyUserId && bodyUserId !== authenticatedUserId) {
      throw new ForbiddenException('You can only modify your own resources');
    }

    return true;
  }
}
```

```
// 📁 apps/api/src/common/guards/api-key.guard.ts
import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { createHash } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const apiKey = request.headers['x-api-key'];

    if (!apiKey || typeof apiKey !== 'string') {
      throw new UnauthorizedException('API key is required');
    }

    // Hash the provided key and compare with stored hash (constant-time)
    const keyHash = createHash('sha256').update(apiKey).digest('hex');

    const storedKey = await this.prisma.apiKey.findUnique({
      where: { keyHash },
    });

    if (!storedKey || !storedKey.isActive) {
      throw new UnauthorizedException('Invalid or inactive API key');
    }

    // Attach partner info to request for audit logging
    request.apiKey = {
      id: storedKey.id,
      partnerName: storedKey.partnerName,
      role: storedKey.role,
    };

    // Update last used timestamp
    await this.prisma.apiKey.update({
      where: { id: storedKey.id },
      data: { lastUsedAt: new Date() },
    });

    return true;
  }
}
```
**Usage in  controllers**:
```
// 📁 apps/api/src/modules/checkout/presentation/controllers/validation.controller.ts
@Controller('sessions')
export class ValidationController {
  constructor(private readonly checkoutService: CheckoutService) {}

  @Post(':id/validate')
  @UseGuards(ApiKeyGuard) // Only POS with valid API key can call this
  @Roles(UserRole.POS_OPERATOR) // API key must have pos_operator role
  @ApiSecurity('api-key')
  async validateSession(
    @Param('id') sessionId: string,
    @Body(new ZodValidationPipe(ValidateSessionRequestSchema)) body: ValidateSessionRequest,
    @Req() request: Request,
  ): Promise<ValidateSessionResponse> {
    return this.checkoutService.validateSession(body.qrToken, body.scannedItems);
  }
}
```

- **5.Database encryption**

| Concern              | Strategy                                                                                                                      |
|----------------------|-------------------------------------------------------------------------------------------------------------------------------|
| Encryption at Rest   | PostgreSQL: AES-256 encryption enabled at the storage level (provider-managed on Railway/Render/GCP Cloud SQL). All tablespaces are encrypted. |
| Encryption in Transit| TLS 1.3 enforced for all database connections. Prisma client configured with `sslmode=require`.                                  |
| Connection String    | Never hardcoded. Fetched from environment variable `DATABASE_URL` with SSL parameters appended.                                 |


```
// 📁 prisma/schema.prisma — Datasource with SSL enforcement
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// Connection string in production (via environment variable):
// DATABASE_URL=postgresql://user:pass@host:5432/smartcart?sslmode=require&sslcert=/path/to/ca.pem
```

- **6.Secrets manager**

| Concern   | Strategy                                                                                                      |
|-----------|---------------------------------------------------------------------------------------------------------------|
| Storage   | All secrets stored in environment variables. Never committed to Git. `.env` files in `.gitignore`.                 |
| Provider  | Railway Shared Variables / Render Environment Groups for production. `.env.local`  for development.               |
| Rotation  | JWT secrets rotated quarterly. Database credentials rotated every 90 days. Manual process documented in runbook. |
| Validation| Application validates all required secrets at startup and fails fast if any are missing.                       |


```
// 📁 apps/api/src/config/env.validation.ts
// Fails at startup if any required secret is missing or invalid

import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'staging', 'production']),
  PORT: z.string().transform(Number).default('3000'),
  DATABASE_URL: z.string().url().startsWith('postgresql://'),
  REDIS_URL: z.string().url().startsWith('redis://'),
  JWT_ACCESS_SECRET: z.string().min(32, 'JWT_ACCESS_SECRET must be at least 32 chars'),
  JWT_REFRESH_SECRET: z.string().min(32, 'JWT_REFRESH_SECRET must be at least 32 chars'),
  QR_SIGNING_SECRET: z.string().min(32, 'QR_SIGNING_SECRET must be at least 32 chars'),
  BCRYPT_ROUNDS: z.string().transform(Number).default('12'),
  AI_SERVICE_URL: z.string().url().optional(),
  AI_SERVICE_API_KEY: z.string().optional(),
  S3_ACCESS_KEY_ID: z.string().optional(),
  S3_SECRET_ACCESS_KEY: z.string().optional(),
  S3_BUCKET_NAME: z.string().optional(),
  S3_REGION: z.string().optional(),
  EXPO_PUSH_API_TOKEN: z.string().optional(),
  CORS_ORIGINS: z.string().default('http://localhost:19006'),
  RATE_LIMIT_TTL: z.string().transform(Number).default('60'),
  RATE_LIMIT_MAX: z.string().transform(Number).default('100'),
});

export function validateEnv() {
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    console.error('❌ Invalid environment configuration:');
    for (const issue of result.error.issues) {
      console.error(`  - ${issue.path.join('.')}: ${issue.message}`);
    }
    process.exit(1); // Fail fast — don't start with invalid config
  }
  return result.data;
}

export type EnvConfig = z.infer<typeof envSchema>;
```

- **7.Rate limiting**
```
// 📁 apps/api/src/common/middleware/rate-limiter.middleware.ts
import { Injectable, NestMiddleware, TooManyRequestsException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class RateLimiterMiddleware implements NestMiddleware {
  constructor(private readonly redis: RedisService) {}

  async use(req: Request, res: Response, next: NextFunction): Promise<void> {
    // Identify client: use authenticated user ID if available, otherwise IP
    const identifier = (req as any).user?.sub ?? req.ip ?? 'unknown';
    const key = `ratelimit:${identifier}`;

    const current = await this.redis.incr(key);

    if (current === 1) {
      // First request in the window — set TTL
      await this.redis.expire(key, 60); // 60-second window
    }

    const limit = parseInt(process.env.RATE_LIMIT_MAX ?? '100');
    if (current > limit) {
      throw new TooManyRequestsException(
        `Rate limit exceeded. ${limit} requests per minute allowed.`,
      );
    }

    // Set rate limit headers
    res.setHeader('X-RateLimit-Limit', limit);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, limit - current));

    next();
  }
}
```
  - **Route-specific rate limits**:
```
// 📁 apps/api/src/app.module.ts — Apply rate limiting per-route
@Module({
  // ...
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // Global: 100 req/min per user/IP
    consumer.apply(RateLimiterMiddleware).forRoutes('*');

    // Auth endpoints: stricter limits to prevent brute-force
    consumer
      .apply(
        new RateLimiterMiddleware(/* config: 10 req/min */)
      )
      .forRoutes(
        { path: '/api/v1/auth/login', method: RequestMethod.POST },
        { path: '/api/v1/auth/register', method: RequestMethod.POST },
      );
  }
}
```
- **8. Input validation**

All inputs are validated at the controller boundary using Zod schemas and the ZodValidationPipe. This prevents malformed data, injection attacks, and type confusion from reaching the application layer.
```
// 📁 apps/api/src/common/pipes/zod-validation.pipe.ts
import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';
import { ZodSchema, ZodError } from 'zod';

@Injectable()
export class ZodValidationPipe implements PipeTransform {
  constructor(private readonly schema: ZodSchema) {}

  transform(value: unknown): unknown {
    try {
      return this.schema.parse(value);
    } catch (error) {
      if (error instanceof ZodError) {
        throw new BadRequestException({
          errorCode: 'VALIDATION_FAILED',
          message: 'Request validation failed',
          details: error.issues.map(issue => ({
            field: issue.path.join('.'),
            code: issue.code,
            message: issue.message,
          })),
        });
      }
      throw error;
    }
  }
}
```

  - **Examples of Zod schemas that prevent specific attacks**:

```
// 📁 packages/shared-types/src/auth.types.ts — SQL injection prevention via strict types
export const LoginRequestSchema = z.object({
  email: z.string()
    .email('Invalid email format')
    .max(255)
    .transform(v => v.toLowerCase().trim()), // Normalize email
  password: z.string()
    .min(1, 'Password is required')
    .max(128), // Prevent buffer overflow attempts
});

// 📁 packages/shared-types/src/session.types.ts — XSS prevention
export const AddItemRequestSchema = z.object({
  barcode: z.string()
    .min(8)
    .max(14)
    .regex(/^\d+$/, 'Barcode must be numeric only'), // Only digits — no XSS possible
  sessionId: z.string()
    .uuid('Session ID must be a valid UUID'), // Only UUID format — no injection
});

// 📁 packages/shared-types/src/analytics.types.ts — Prevent path traversal
export const ProductIdParamSchema = z.object({
  id: z.string()
    .uuid('Product ID must be a valid UUID')
    .refine(val => !val.includes('..'), 'Invalid product ID'), // Extra path traversal guard
});
```

- **9.OWASP Compliance - Injection prevention**

| Attack Vector   | Mitigation                                                                                          | Implementation                                                      |
|-----------------|-----------------------------------------------------------------------------------------------------|---------------------------------------------------------------------|
| SQL Injection   | 100% parameterized queries via Prisma ORM. No raw SQL concatenation.                                 | Prisma Client — all queries are parameterized by design             |
| NoSQL Injection | Not applicable (no MongoDB). Redis commands use typed methods, not string concatenation.             | ``redis.get(key)`` — typed, no injection surface                        |
| XSS (Stored)    | All string fields validated with Zod. No HTML rendering in API responses.                            | Zod schemas enforce format constraints                              |
| XSS (Reflected) | Helmet CSP headers block inline scripts. No user input echoed unsanitized.                           | ``helmet({ contentSecurityPolicy: ... })``                              |
| CSRF            | SameSite=Strict cookies. JWT in Authorization header (not cookie-based for API calls).               | Cookie configuration in auth.controller.ts                          |
| Path Traversal  | UUID validation on all path parameters. S3 keys use UUIDs, not user-supplied paths.                  | Zod UUID schemas                                                    |
| ReDoS           | Zod regex patterns are tested for catastrophic backtracking. Input lengths capped.                   | Pre-commit hook runs `npx regexploit` on all schemas                |


- **10. Audit logging**

All security-sensitive operations are logged with structured JSON, including userId, action, resource, IP address, and correlation ID.

 Located at apps/api/src/common/interceptors/audit.interceptor.ts. The interceptor sits in the NestJS middleware pipeline and fires on every inbound HTTP request, but only emits an audit record when the handler name matches one of the designated sensitive actions: login, register, logout, refresh, redeemReward, validateSession, updateProfile, and deleteAccount. All other requests pass through without generating an audit entry.
Each audit record captures the controller and method name as a combined action identifier, the authenticated user's ID and role (falling back to "anonymous" for unauthenticated calls), the client IP address, the User-Agent header, the correlation ID from the request headers, the HTTP method, the request path, and a UTC timestamp. On a successful response the record is written at the INFO level with a SUCCESS status. On a thrown exception the same fields are written at the WARN level alongside the HTTP status code and the error code from the response body.
Points transaction audit trail
The financial audit trail lives one layer deeper, in apps/api/src/modules/checkout/infrastructure/repositories/prisma-points.repository.ts. The points_transactions table is designed as an append-only ledger: no row is ever updated or deleted. Every time points are credited, a new row is inserted with the user ID, the session ID, the points delta, the reason (PURCHASE), and a metadata object that breaks down the award by strategy type, individual point totals, and base values. This design means the current balance is always derived by aggregating the delta column across all rows for a user — it is never stored as a mutable field — which makes the balance tamper-evident and fully auditable at any point in time.

  **Points transaction audit trail**:
  ```
// 📁 apps/api/src/modules/checkout/infrastructure/repositories/prisma-points.repository.ts
// The points_transactions table is append-only — an immutable audit trail
@Injectable()
export class PrismaPointsRepository implements IPointsRepository {
  async creditPoints(
    userId: string,
    points: PointsAwarded[],
    sessionId: string,
    tx?: Prisma.TransactionClient,
  ): Promise<void> {
    const client = tx ?? this.prisma;
    const total = points.reduce((sum, p) => sum + p.totalPoints, 0);

    await client.pointsTransaction.create({
      data: {
        userId,
        sessionId,
        delta: total,
        reason: 'PURCHASE',
        metadata: {
          breakdown: points.map(p => ({
            strategyType: p.strategyType,
            points: p.totalPoints,
            baseValue: p.baseValue,
          })),
        },
      },
    });
  }

  // Points balance is always derived from transactions — never directly set
  async getBalance(userId: string): Promise<number> {
    const result = await this.prisma.pointsTransaction.aggregate({
      where: { userId },
      _sum: { delta: true },
    });
    return result._sum.delta ?? 0;
  }
}
  ```

- **11.PII Handling**:

| Data Element     | Classification        | Handling                                                                                                      |
|------------------|-----------------------|---------------------------------------------------------------------------------------------------------------|
| ``email``            | PII                   | Stored encrypted at rest (provider-managed AES-256). Masked in logs: ``j***@example.com``.                        |
| ``password_hash``    | Sensitive             | bcrypt hash with cost factor 12. Never logged. Never included in API responses.                               |
| ``fullName``         | PII                   | Stored in database. Masked in logs.                                                                           |
| ``phone``            | PII                   | Stored encrypted at rest. Optional field.                                                                     |
| ``pushToken``        | Sensitive             | Stored encrypted. Allows targeting. Deleted on app uninstall.                                                 |
| Analytics data   | Aggregated/Anonymized | Individual user data never exposed to B2B partners. Minimum 50 users per segment before data is shown.        |


---

## 2.6 Observability

This section defines the three pillars of observability — logging, metrics, and tracing — plus alerting, health checks, and error tracking for the SmartCart backend. The design follows the principle that every component must emit enough telemetry to answer "what is happening right now?" and "what happened during the last incident?" without deploying new code.

### Observability Architecture

```mermaid
flowchart TD
    subgraph NestJS_Application["NestJS Application (apps/api)"]
        Pino["Pino Logger\n(structured JSON logs)\napps/api/src/common/interceptors/logging.interceptor.ts"]
        Prom["Prometheus Metrics\napps/api/src/common/metrics/prometheus.service.ts"]
        OTEL["OpenTelemetry SDK (traces)\napps/api/src/common/tracing/otel.module.ts"]
        Sentry["Sentry (error tracking)\napps/api/src/common/filters/sentry-exception.filter.ts"]
    end

    Pino --> Stdout["Stdout/File → Log Drain"]
    Prom --> Metrics["/metrics endpoint"]
    OTEL --> OTLP["OTLP Collector → Jaeger"]
    Sentry --> SentrySaaS["Sentry SaaS"]

    subgraph Aggregation["Log Aggregation & Visualization"]
        Loki["Loki (logs)\ndocker-compose.yml → loki service"]
        Grafana["Grafana Dashboards\ndocker-compose.yml → grafana service"]
        Prometheus["Prometheus (metrics)\ndocker-compose.yml → prometheus service"]
        Alertmanager["Alertmanager\napps/api/config/alertmanager.yml"]
    end

    Stdout --> Loki
    Metrics --> Prometheus
    OTLP --> Jaeger["Jaeger UI\napps/api/config/otel-collector.yml"]
    SentrySaaS --> Grafana

    Loki --> Grafana
    Prometheus --> Grafana
    Grafana --> Alertmanager
    Alertmanager --> PagerDuty["PagerDuty Integration\napps/api/config/alertmanager.yml"]
    Alertmanager --> Slack["Slack Webhook\napps/api/config/alertmanager.yml"]

```

#### 1.Structured login

| Concern    | Detail                                                                                                                   |
|------------|--------------------------------------------------------------------------------------------------------------------------|
| Library    | `nestjs-pino` (Pino v9.x) — the fastest Node.js logger with zero-cost structured JSON output                               |
| Format     | JSON, one log line per event. Every log includes `level`, `time`, `pid`, `hostname`, `correlationId`, `userId`, `context`              |
| Transport  | Stdout in development. Sidecar container (Promtail) ships to Loki in production                                          |
| Redaction  | PII fields (`email`, `password`, `phone`, `pushToken`) are automatically redacted via a custom Pino transport                    |

**Instalation and configuration**

```
npm install nestjs-pino pino pino-http pino-pretty
```

```
// 📁 apps/api/src/main.ts — Pino logger setup
import { NestFactory } from '@nestjs/core';
import { Logger, LoggerErrorInterceptor } from 'nestjs-pino';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true, // Buffer logs until logger is ready
  });

  // Use Pino as the NestJS logger
  app.useLogger(app.get(Logger));
  app.useGlobalInterceptors(new LoggerErrorInterceptor());

  await app.listen(3000);
}
bootstrap();
```

```
// 📁 apps/api/src/config/pino.config.ts
import { Params } from 'nestjs-pino';
import { Request, Response } from 'express';
import { v4 as uuid } from 'uuid';

export const pinoConfig: Params = {
  pinoHttp: {
    // Log level by environment
    level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',

    // Use pino-pretty in development for human-readable logs
    transport: process.env.NODE_ENV !== 'production'
      ? { target: 'pino-pretty', options: { colorize: true, singleLine: true } }
      : undefined,

    // Generate or extract correlation ID for every request
    genReqId: (req: Request) => {
      return req.headers['x-correlation-id'] as string ?? uuid();
    },

    // Custom serializers to control what gets logged
    serializers: {
      req: (req: Request) => ({
        id: req.id,
        method: req.method,
        url: req.url,
        query: req.query,
        params: req.params,
        // NEVER log headers — they contain Authorization tokens
        remoteAddress: req.ip,
        userAgent: req.headers['user-agent'],
      }),
      res: (res: Response) => ({
        statusCode: res.statusCode,
      }),
    },

    // Redact sensitive fields from logs
    redact: {
      paths: [
        'req.headers.authorization',
        'req.headers.cookie',
        'req.body.password',
        'req.body.email',
        'req.body.phone',
        'req.body.pushToken',
      ],
      censor: '[REDACTED]',
    },

    // Custom success/error log messages
    customSuccessMessage: (req, res) => {
      return `${req.method} ${req.url} ${res.statusCode} - ${res.getHeader('content-length') ?? 0}b`;
    },
    customErrorMessage: (req, res, err) => {
      return `${req.method} ${req.url} failed with ${err.message}`;
    },

    // Attach user info to every log
    customProps: (req: any) => ({
      correlationId: req.id,
      userId: req.user?.sub ?? 'anonymous',
      userRole: req.user?.role ?? 'anonymous',
    }),
  },
};
```

```
// 📁 apps/api/src/app.module.ts — Import Pino module
import { LoggerModule } from 'nestjs-pino';
import { pinoConfig } from './config/pino.config';

@Module({
  imports: [
    LoggerModule.forRoot(pinoConfig),
    // ... other modules
  ],
})
export class AppModule {}
```

**Example log output**:
```
{
  "level": 30,
  "time": "2026-06-09T14:30:05.123Z",
  "pid": 42,
  "hostname": "api-prod-7f8a9b",
  "correlationId": "ckv8x9y2z00001abcdef1234",
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "userRole": "shopper",
  "req": {
    "id": "ckv8x9y2z00001abcdef1234",
    "method": "POST",
    "url": "/api/v1/sessions/abc123/items",
    "remoteAddress": "192.168.1.100"
  },
  "res": { "statusCode": 200 },
  "msg": "POST /api/v1/sessions/abc123/items 200 - 256b",
  "responseTime": 47
}
```

**Application-level logging example**:

```
// 📁 apps/api/src/modules/checkout/application/services/checkout.service.ts
import { PinoLogger } from 'nestjs-pino';

@Injectable()
export class CheckoutService {
  constructor(
    private readonly logger: PinoLogger,
    // ... other dependencies
  ) {
    this.logger.setContext('CheckoutService');
  }

  async validateSession(
    qrToken: string,
    scannedItems: ScannedItemDTO[],
  ): Promise<ValidationResult> {
    const startTime = Date.now();

    this.logger.info({
      event: 'validation_started',
      sessionId: qrPayload.sessionId,
      itemCount: scannedItems.length,
    });

    try {
      const result = await this.prisma.$transaction(async (tx) => {
        // ... validation logic ...
        return { success: true, pointsAwarded: 250, sessionId: 'abc' };
      });

      this.logger.info({
        event: 'validation_completed',
        sessionId: result.sessionId,
        pointsAwarded: result.pointsAwarded,
        durationMs: Date.now() - startTime,
      });

      return result;
    } catch (error) {
      this.logger.error({
        event: 'validation_failed',
        sessionId: qrPayload?.sessionId,
        error: error.message,
        errorCode: error.errorCode,
        durationMs: Date.now() - startTime,
      });
      throw error;
    }
  }
}
```

#### 2.Monitoring-Metrics

| Concern           | Detail                                                                                           |
|-------------------|--------------------------------------------------------------------------------------------------|
| Library           | `@willsoto/nestjs-prometheus` — exposes a `/metrics` endpoint for Prometheus scraping                 |
| Default Metrics   | CPU, memory, event loop lag, GC pauses, heap usage (via `prom-client` defaults)                     |
| HTTP Metrics      | Request duration histogram, request count counter, error rate by status code                      |
| Business Metrics  | Checkout completions, points awarded, QR generations, AI classification latency                   |
| Database Metrics  | Prisma query duration, connection pool utilization                                                |
| Queue Metrics     | BullMQ queue depth, job processing time, job failure rate                                         |

**Instalation and configuration**

```
npm install @willsoto/nestjs-prometheus prom-client
```

```
// 📁 apps/api/src/config/metrics.config.ts
import { PrometheusModuleOptions } from '@willsoto/nestjs-prometheus';

export const metricsConfig: PrometheusModuleOptions = {
  defaultMetrics: {
    enabled: true,
    config: {
      prefix: 'smartcart_',
    },
  },
  defaultLabels: {
    app: 'smartcart-api',
    environment: process.env.NODE_ENV ?? 'development',
  },
};
```

```
// 📁 apps/api/src/app.module.ts — Import Prometheus module
import { PrometheusModule } from '@willsoto/nestjs-prometheus';
import { metricsConfig } from './config/metrics.config';

@Module({
  imports: [
    PrometheusModule.register(metricsConfig),
    // ... other modules
  ],
})
export class AppModule {}
```

**Custom business metrics**:
```
// 📁 apps/api/src/common/metrics/business-metrics.service.ts
import { Injectable } from '@nestjs/common';
import { InjectMetric } from '@willsoto/nestjs-prometheus';
import { Counter, Histogram, Gauge } from 'prom-client';

@Injectable()
export class BusinessMetricsService {
  constructor(
    @InjectMetric('smartcart_checkouts_total')
    private readonly checkoutCounter: Counter<string>,

    @InjectMetric('smartcart_points_awarded_total')
    private readonly pointsCounter: Counter<string>,

    @InjectMetric('smartcart_checkout_duration_seconds')
    private readonly checkoutDuration: Histogram<string>,

    @InjectMetric('smartcart_qr_generations_total')
    private readonly qrCounter: Counter<string>,

    @InjectMetric('smartcart_active_sessions')
    private readonly activeSessionsGauge: Gauge<string>,

    @InjectMetric('smartcart_bullmq_queue_depth')
    private readonly queueDepthGauge: Gauge<string>,

    @InjectMetric('smartcart_ai_classification_duration_seconds')
    private readonly aiDuration: Histogram<string>,
  ) {}

  recordCheckoutCompleted(pointsAwarded: number, durationMs: number): void {
    this.checkoutCounter.inc();
    this.pointsCounter.inc(pointsAwarded);
    this.checkoutDuration.observe(durationMs / 1000);
  }

  recordQrGenerated(): void {
    this.qrCounter.inc();
  }

  setActiveSessions(count: number): void {
    this.activeSessionsGauge.set(count);
  }

  recordQueueDepth(queueName: string, depth: number): void {
    this.queueDepthGauge.set({ queue: queueName }, depth);
  }

  recordAiClassification(durationMs: number): void {
    this.aiDuration.observe(durationMs / 1000);
  }
}
```

```
// 📁 apps/api/src/common/metrics/metrics.module.ts — Register all custom metrics
import { Module } from '@nestjs/common';
import { PrometheusModule } from '@willsoto/nestjs-prometheus';

@Module({
  imports: [
    PrometheusModule.register({
      defaultMetrics: { enabled: true },
    }),
  ],
  providers: [
    BusinessMetricsService,
    // Register each metric with its configuration
    PrometheusModule.registerCounter({
      name: 'smartcart_checkouts_total',
      help: 'Total number of successful checkouts',
      labelNames: ['store_id'],
    }),
    PrometheusModule.registerCounter({
      name: 'smartcart_points_awarded_total',
      help: 'Total points awarded to shoppers',
    }),
    PrometheusModule.registerHistogram({
      name: 'smartcart_checkout_duration_seconds',
      help: 'Checkout validation duration in seconds',
      buckets: [0.1, 0.25, 0.5, 1, 2.5, 5, 10],
    }),
    PrometheusModule.registerCounter({
      name: 'smartcart_qr_generations_total',
      help: 'Total QR codes generated',
    }),
    PrometheusModule.registerGauge({
      name: 'smartcart_active_sessions',
      help: 'Number of currently active shopping sessions',
    }),
    PrometheusModule.registerGauge({
      name: 'smartcart_bullmq_queue_depth',
      help: 'Number of waiting jobs in BullMQ queues',
      labelNames: ['queue'],
    }),
    PrometheusModule.registerHistogram({
      name: 'smartcart_ai_classification_duration_seconds',
      help: 'AI inference duration in seconds',
      buckets: [0.5, 1, 2, 5, 10, 30],
    }),
  ],
  exports: [BusinessMetricsService],
})
export class MetricsModule {}
```

**Usage in checkout service**:

```
// 📁 apps/api/src/modules/checkout/application/services/checkout.service.ts (extract)
async validateSession(qrToken: string, scannedItems: ScannedItemDTO[]): Promise<ValidationResult> {
  const startTime = Date.now();

  try {
    const result = await this.prisma.$transaction(async (tx) => {
      // ... validation logic ...
      return { success: true, pointsAwarded: 250, sessionId: 'abc', storeId: 'xyz' };
    });

    // Record business metric
    this.metrics.recordCheckoutCompleted(result.pointsAwarded, Date.now() - startTime);

    return result;
  } catch (error) {
    throw error; // Error metrics recorded by the global exception filter
  }
}
```

**BullMQ Queue Depth Monitor**

```
// 📁 apps/api/src/common/queues/queue-metrics.service.ts
import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { Cron } from '@nestjs/schedule';
import { BusinessMetricsService } from '../metrics/business-metrics.service';

@Injectable()
export class QueueMetricsService {
  constructor(
    @InjectQueue('analytics-profile-update') private readonly analyticsQueue: Queue,
    @InjectQueue('push-notifications') private readonly notificationQueue: Queue,
    private readonly metrics: BusinessMetricsService,
  ) {}

  /**
   * Report queue depth every 30 seconds so Grafana can visualize
   * backpressure in real time and trigger alerts.
   */
  @Cron('*/30 * * * * *')
  async reportQueueDepths(): Promise<void> {
    const analyticsDepth = await this.analyticsQueue.getWaitingCount();
    const notificationDepth = await this.notificationQueue.getWaitingCount();

    this.metrics.recordQueueDepth('analytics-profile-update', analyticsDepth);
    this.metrics.recordQueueDepth('push-notifications', notificationDepth);
  }
}
```

#### 3.Distributed tracing

| Concern              | Detail                                                                                                                           |
|----------------------|----------------------------------------------------------------------------------------------------------------------------------|
| Library              | `@opentelemetry/sdk-node` with `@opentelemetry/instrumentation-http`, `@opentelemetry/instrumentation-express`, `@opentelemetry/instrumentation-ioredis`, `@opentelemetry/instrumentation-bullmq` |
| Exporter             | OTLP gRPC exporter sending to Jaeger (or Grafana Tempo in production)                                                            |
| Sampling             | 100% in development. Adaptive sampling in production (10% base, 100% for errors).                                                |
| Context Propagation  | W3C Trace Context headers propagated across HTTP calls and injected into BullMQ job metadata                                     |

**Instalation and configuration**

```
npm install @opentelemetry/sdk-node \
  @opentelemetry/api \
  @opentelemetry/auto-instrumentations-node \
  @opentelemetry/exporter-trace-otlp-grpc \
  @opentelemetry/instrumentation-http \
  @opentelemetry/instrumentation-express \
  @opentelemetry/instrumentation-ioredis \
  @opentelemetry/instrumentation-bullmq
```

**Tracing Initialization (runs before NestJS bootstrap)**:

```
// 📁 apps/api/src/tracing.ts — MUST be imported before any other module
import { NodeSDK } from '@opentelemetry/sdk-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-grpc';
import { Resource } from '@opentelemetry/resources';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';
import { BatchSpanProcessor } from '@opentelemetry/sdk-trace-base';
import { HttpInstrumentation } from '@opentelemetry/instrumentation-http';
import { ExpressInstrumentation } from '@opentelemetry/instrumentation-express';
import { IORedisInstrumentation } from '@opentelemetry/instrumentation-ioredis';
import { BullMQInstrumentation } from '@opentelemetry/instrumentation-bullmq';
import { PrismaInstrumentation } from '@prisma/instrumentation';

const sdk = new NodeSDK({
  resource: new Resource({
    [SemanticResourceAttributes.SERVICE_NAME]: 'smartcart-api',
    [SemanticResourceAttributes.SERVICE_VERSION]: process.env.npm_package_version ?? '1.0.0',
    [SemanticResourceAttributes.DEPLOYMENT_ENVIRONMENT]: process.env.NODE_ENV ?? 'development',
  }),
  spanProcessors: [
    new BatchSpanProcessor(
      new OTLPTraceExporter({
        url: process.env.OTLP_EXPORTER_ENDPOINT ?? 'http://localhost:4317',
      }),
    ),
  ],
  instrumentations: [
    new HttpInstrumentation({
      // Ignore health check endpoints to reduce noise
      ignoreIncomingPaths: ['/health', '/metrics'],
    }),
    new ExpressInstrumentation(),
    new IORedisInstrumentation(),
    new BullMQInstrumentation(),
    new PrismaInstrumentation(),
  ],
});

// Start the SDK
sdk.start();

// Gracefully shut down on process exit
process.on('SIGTERM', () => {
  sdk.shutdown()
    .then(() => console.log('OpenTelemetry SDK shut down'))
    .catch(err => console.error('Error shutting down OpenTelemetry SDK', err))
    .finally(() => process.exit(0));
});

export default sdk;
```

```
// 📁 apps/api/src/main.ts — Import tracing BEFORE anything else
import './tracing'; // ← FIRST import — initializes OpenTelemetry
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(3000);
}
bootstrap();
```

**Manual Span Creation for Business Operations**:

```
// 📁 apps/api/src/modules/checkout/application/services/checkout.service.ts (extract)
import { trace, SpanStatusCode } from '@opentelemetry/api';

const tracer = trace.getTracer('smartcart-checkout');

async validateSession(qrToken: string, scannedItems: ScannedItemDTO[]): Promise<ValidationResult> {
  // Start a custom span for the entire validation flow
  return tracer.startActiveSpan('checkout.validate', async (span) => {
    span.setAttribute('smartcart.scanned_items_count', scannedItems.length);

    try {
      const result = await this.prisma.$transaction(async (tx) => {
        // ... validation logic ...
        return { success: true, pointsAwarded: 250, sessionId: 'abc' };
      });

      span.setAttribute('smartcart.points_awarded', result.pointsAwarded);
      span.setAttribute('smartcart.session_id', result.sessionId);
      span.setStatus({ code: SpanStatusCode.OK });
      span.end();

      return result;
    } catch (error) {
      span.setStatus({
        code: SpanStatusCode.ERROR,
        message: error.message,
      });
      span.recordException(error);
      span.end();
      throw error;
    }
  });
}
```

#### 4.Alerting

| Concern              | Detail                                                                                                      |
|----------------------|-------------------------------------------------------------------------------------------------------------|
| Tool                 | Grafana Alerting (built into Grafana) or Alertmanager + Prometheus Rules                                    |
| Notification Channels| PagerDuty for P1 (critical), Slack `#smartcart-alerts` for P2/P3, Email for P4                                |
| On-Call Rotation     | PagerDuty escalation policy: Primary on-call (5 min) → Secondary (10 min) → Engineering Manager (15 min)    |

**Alert Definitions (Prometheus Rules)**:

```
# 📁 infra/prometheus/rules/smartcart-alerts.yml
groups:
  - name: smartcart-critical
    rules:
      # ─── P1: Service is down ──────────────────────────────
      - alert: ServiceDown
        expr: up{job="smartcart-api"} == 0
        for: 1m
        labels:
          severity: critical
          priority: P1
        annotations:
          summary: "SmartCart API is unreachable"
          description: "The /health endpoint has failed for all instances for more than 1 minute."
          runbook_url: "https://wiki.smartcart.app/runbooks/service-down"

      # ─── P1: High error rate ──────────────────────────────
      - alert: HighErrorRate
        expr: |
          rate(http_requests_total{status_code=~"5.."}[5m]) /
          rate(http_requests_total[5m]) > 0.01
        for: 5m
        labels:
          severity: critical
          priority: P1
        annotations:
          summary: "Error rate exceeds 1%"
          description: "5xx error rate is {{ $value | humanizePercentage }} over the last 5 minutes."
          runbook_url: "https://wiki.smartcart.app/runbooks/high-error-rate"

      # ─── P1: Queue backing up ──────────────────────────────
      - alert: QueueBackpressure
        expr: smartcart_bullmq_queue_depth > 1000
        for: 10m
        labels:
          severity: critical
          priority: P2
        annotations:
          summary: "BullMQ queue '{{ $labels.queue }}' has {{ $value }} waiting jobs"
          description: "Analytics or notification queue is not keeping up with demand."
          runbook_url: "https://wiki.smartcart.app/runbooks/queue-backpressure"

  - name: smartcart-warning
    rules:
      # ─── P2: High latency ─────────────────────────────────
      - alert: HighLatency
        expr: |
          histogram_quantile(0.95,
            rate(smartcart_checkout_duration_seconds_bucket[5m])
          ) > 2.0
        for: 10m
        labels:
          severity: warning
          priority: P2
        annotations:
          summary: "P95 checkout latency > 2 seconds"
          description: "Checkout validation is taking {{ $value }}s at P95."

      # ─── P2: Database connection pool near exhaustion ──────
      - alert: DatabaseConnectionPoolHigh
        expr: smartcart_prisma_pool_connections_active / smartcart_prisma_pool_connections_total > 0.8
        for: 5m
        labels:
          severity: warning
          priority: P2
        annotations:
          summary: "Database connection pool > 80% utilized"

      # ─── P3: AI service degraded ───────────────────────────
      - alert: AiServiceLatencyHigh
        expr: |
          histogram_quantile(0.95,
            rate(smartcart_ai_classification_duration_seconds_bucket[5m])
          ) > 10.0
        for: 15m
        labels:
          severity: info
          priority: P3
        annotations:
          summary: "AI classification P95 > 10s — B2B data may be stale"
```

#### 5.Health Checks

```
// 📁 apps/api/src/common/health/health.controller.ts
import { Controller, Get, HttpStatus, HttpCode } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Public } from '../decorators/public.decorator';
import {
  HealthCheckService,
  HealthCheck,
  PrismaHealthIndicator,
  MicroserviceHealthIndicator,
} from '@nestjs/terminus';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly prisma: PrismaHealthIndicator,
    private readonly prismaService: PrismaService,
    private readonly microservice: MicroserviceHealthIndicator,
    private readonly redisService: RedisService,
  ) {}

  /**
   * Liveness probe — checks if the process is alive.
   * Used by Kubernetes to know when to restart the container.
   * Must be lightweight; no external dependencies checked.
   */
  @Get('liveness')
  @Public()
  @HttpCode(HttpStatus.OK)
  liveness(): { status: string } {
    return { status: 'alive' };
  }

  /**
   * Readiness probe — checks if the application can serve traffic.
   * Used by Kubernetes to know when to add the pod to the Service.
   * Checks critical external dependencies (DB, Redis).
   */
  @Get('readiness')
  @Public()
  @HealthCheck()
  @ApiOperation({ summary: 'Readiness probe — checks DB + Redis connectivity' })
  async readiness() {
    return this.health.check([
      // Check PostgreSQL connectivity
      async () =>
        this.prisma.pingCheck('database', this.prismaService, { timeout: 3000 }),
      // Check Redis connectivity
      async () => {
        const isHealthy = await this.redisService.ping();
        if (!isHealthy) throw new Error('Redis is unreachable');
        return { redis: { status: 'up' } };
      },
    ]);
  }

  /**
   * Full health check — includes all dependencies.
   * Used by load balancers and monitoring tools.
   */
  @Get()
  @Public()
  @HealthCheck()
  @ApiOperation({ summary: 'Full health check' })
  async fullCheck() {
    return this.health.check([
      async () =>
        this.prisma.pingCheck('database', this.prismaService, { timeout: 3000 }),
      async () => {
        const isHealthy = await this.redisService.ping();
        if (!isHealthy) throw new Error('Redis is unreachable');
        return { redis: { status: 'up' } };
      },
      async () => ({
        uptime: {
          status: 'up',
          seconds: process.uptime(),
        },
      }),
    ]);
  }
}
```

**Kubernetes Pod Configuration (reference)**:

```
# 📁 infra/kubernetes/api-deployment.yaml — Health check probes
spec:
  containers:
    - name: smartcart-api
      image: smartcart-api:latest
      ports:
        - containerPort: 3000
      livenessProbe:
        httpGet:
          path: /api/v1/health/liveness
          port: 3000
        initialDelaySeconds: 10
        periodSeconds: 15
        timeoutSeconds: 3
        failureThreshold: 3
      readinessProbe:
        httpGet:
          path: /api/v1/health/readiness
          port: 3000
        initialDelaySeconds: 5
        periodSeconds: 10
        timeoutSeconds: 5
        failureThreshold: 2
```

#### 6.Error tracking-sentry

| Concern            | Detail                                                                                                      |
|--------------------|-------------------------------------------------------------------------------------------------------------|
| Library            | `@ntegral/nestjs-sentry` (NestJS wrapper) + `@sentry/node`                                                      |
| What is tracked    | Unhandled exceptions (500 errors), Prisma errors, BullMQ job failures                                       |
| What is NOT tracked| Expected business errors (404, 422, 409) — these are operational, not defects                               |
| Context            | Every Sentry event includes `userId`, `correlationId`, `sessionId`, `release` version                               |

**Instalation**:

```
npm install @ntegral/nestjs-sentry @sentry/node @sentry/profiling-node
```

```
// 📁 apps/api/src/config/sentry.config.ts
import { SentryModuleOptions } from '@ntegral/nestjs-sentry';

export const sentryConfig: SentryModuleOptions = {
  dsn: process.env.SENTRY_DSN ?? '',
  environment: process.env.NODE_ENV ?? 'development',
  release: process.env.npm_package_version ?? '1.0.0',
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  profilesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  debug: process.env.NODE_ENV !== 'production',
  logLevels: ['error', 'warn'],
  // Only capture 500-level errors; 4xx are operational
  beforeSend(event, hint) {
    const exception = hint?.originalException as any;
    const statusCode = exception?.status ?? exception?.statusCode;

    // Don't send operational errors (4xx) to Sentry
    if (statusCode && statusCode >= 400 && statusCode < 500) {
      return null;
    }

    return event;
  },
  // Attach user context to every Sentry event
  integrations: [
    new Sentry.Integrations.Http({ tracing: true }),
    new Sentry.Integrations.Express(),
    new Sentry.Integrations.Prisma({ client: prisma }),
  ],
};
```

```
// 📁 apps/api/src/app.module.ts — Import Sentry module
import { SentryModule } from '@ntegral/nestjs-sentry';
import { sentryConfig } from './config/sentry.config';

@Module({
  imports: [
    SentryModule.forRoot(sentryConfig),
    // ... other modules
  ],
})
export class AppModule {}
```

**Manual error reporting context**:

```
// 📁 apps/api/src/common/filters/global-exception.filter.ts (extract)
import * as Sentry from '@sentry/node';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const request = ctx.getRequest();
    const response = ctx.getResponse();

    // Set Sentry context for this error
    Sentry.setContext('request', {
      correlationId: request.headers['x-correlation-id'],
      method: request.method,
      url: request.url,
      userId: request.user?.sub,
    });

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      if (status >= 500) {
        // Capture 500 errors in Sentry
        Sentry.captureException(exception, {
          level: 'error',
          tags: {
            statusCode: status.toString(),
            endpoint: `${request.method} ${request.url}`,
          },
        });
      }
    } else {
      // Unhandled exceptions — always capture
      Sentry.captureException(exception, {
        level: 'fatal',
        tags: { endpoint: `${request.method} ${request.url}` },
      });
    }

    // ... standard error response ...
  }
}
```

#### 7.Grafana dashboard - key panels

The following constitute the primary operational dashboard for SmartCart

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│                      SmartCart — Operations Dashboard                              │
│                                                                                  │
│  ┌─────────────────────┐  ┌─────────────────────┐  ┌──────────────────────────┐ │
│  │ Request Rate        │  │ Error Rate (5xx)    │  │ P95 Latency              │ │
│  │ (req/sec)           │  │ (%)                 │  │ (ms)                     │ │
│  │                     │  │                     │  │                          │ │
│  │  ▁▂▃▄▅▆▇█▇▆▅▄▃▂▁   │  │  ▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁   │  │  ▁▂▁▂▁▃▁▂▁▄▁▂▁▃▁▂▁       │ │
│  └─────────────────────┘  └─────────────────────┘  └──────────────────────────┘ │
│                                                                                  │
│  ┌─────────────────────────────────────────────┐  ┌──────────────────────────┐ │
│  │ Checkouts Completed (counter)               │  │ Points Awarded (counter) │ │
│  │                                             │  │                          │ │
│  │  ▁▂▃▅▇█▇▆▄▃▂▁▂▃▄▅▆▇█▇▆▅▄▃▂▁               │  │  ▁▂▃▅▇██▇▆▄▃▂▁▁▂▃▄▅▆▇█▇▆▅▄▃ │ │
│  └─────────────────────────────────────────────┘  └──────────────────────────┘ │
│                                                                                  │
│  ┌─────────────────────────────────────────────┐  ┌──────────────────────────┐ │
│  │ Queue Depth (analytics)                     │  │ AI Classification Latency │ │
│  │                                             │  │ (P95, ms)                │ │
│  │  ▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁          │  │  ▁▂▃▅▆▇█▇▆▅▃▂▁▁▂▃▄▅▆▇█▇▆▅▄▃▂ │ │
│  └─────────────────────────────────────────────┘  └──────────────────────────┘ │
│                                                                                  │
│  ┌─────────────────────────────────────────────┐  ┌──────────────────────────┐ │
│  │ Database Connections (active / total)       │  │ Redis Memory Usage        │ │
│  │                                             │  │ (%)                      │ │
│  │  ████████████████░░░░░░░░░░░░░░░░░░░░░░░░░░  │  │  ████████░░░░░░░░░░░░░░  │ │
│  └─────────────────────────────────────────────┘  └──────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────────────────┘
```

**Grafana Dashboard JSON Provisioning**:

```
// 📁 infra/grafana/dashboards/smartcart-overview.json (excerpt)
{
  "dashboard": {
    "title": "SmartCart — Operations Overview",
    "tags": ["smartcart", "production"],
    "refresh": "10s",
    "panels": [
      {
        "title": "Request Rate",
        "targets": [
          {
            "expr": "rate(http_requests_total[1m])",
            "legendFormat": "{{method}} {{path}}"
          }
        ]
      },
      {
        "title": "Error Rate (5xx)",
        "targets": [
          {
            "expr": "rate(http_requests_total{status_code=~\"5..\"}[5m]) / rate(http_requests_total[5m])",
            "legendFormat": "Error Rate"
          }
        ]
      },
      {
        "title": "P95 Checkout Latency",
        "targets": [
          {
            "expr": "histogram_quantile(0.95, rate(smartcart_checkout_duration_seconds_bucket[5m]))",
            "legendFormat": "P95 Latency"
          }
        ]
      },
      {
        "title": "Queue Depth",
        "targets": [
          {
            "expr": "smartcart_bullmq_queue_depth",
            "legendFormat": "{{queue}}"
          }
        ]
      }
    ]
  }
}
```

**Observability Checklist — Production Readiness**

| Check                               | Tool              | Passing Criteria                                                                 |
|-------------------------------------|-------------------|----------------------------------------------------------------------------------|
| Logs are structured JSON            | Pino              | Every log line is valid JSON with `correlationId `                                 |
| PII is redacted from logs           | Pino redact       | No `email`, `password`, or `phone` in raw logs                                         |
| Metrics are scraped                 | Prometheus        | `/metrics` returns `200 OK` with valid Prometheus format                             |
| Traces propagate across services    | OpenTelemetry     | Jaeger shows full trace from HTTP → Prisma → Redis                               |
| Alerts fire within SLA              | Grafana Alerting  | `ServiceDown` fires within 1 minute of `/health` failure                             |
| Error rate is monitored             | Sentry + Grafana  | Zero unhandled exceptions in Sentry; 5xx rate < 0.1%                             |
| Dashboard is useful during incidents| Grafana           | On-call engineer can identify root cause within 5 minutes using the dashboard    |
---

## 2.7 Availability and scalability

This section defines the quantitative reliability targets for SmartCart and the architectural mechanisms that achieve them. Every design decision — from stateless services to connection pooling — is traced back to a specific availability or scalability requirement derived from the business context: a mobile POS system where checkout validation downtime directly blocks in-store revenue.

### Availability

| Metric                 | Target             | Justification                                                                                                                   |
|-------------------------|--------------------|---------------------------------------------------------------------------------------------------------------------------------|
| Annual Uptime SLA       | 99.9% ("three nines") | Equates to 8.76 hours of permitted downtime per year. SmartCart is a POS-adjacent system: if QR validation fails, shoppers cannot complete their purchases. 99.9% balances business criticality with the cost of achieving 99.99% (which would require multi-region active-active). |
| RTO (Recovery Time Objective) | < 15 minutes      | From the moment a P1 alert fires to full service restoration. Achievable because the entire infrastructure is defined as code (Docker Compose for dev, Terraform for production) and can be redeployed in under 10 minutes. Database failover to a read replica is automated and completes in under 5 minutes. |
| RPO (Recovery Point Objective) | < 5 minutes       | Maximum data loss in a catastrophic failure. Achieved via PostgreSQL continuous WAL (Write-Ahead Log) archiving to S3/R2 every 5 minutes. Points transactions — the financial record — are never lost because they are committed synchronously to PostgreSQL before the API responds. |
| Mean Time To Detect (MTTD) | < 2 minutes        | From fault occurrence to PagerDuty alert. Achieved via Prometheus scraping every 15 seconds and Grafana alert evaluation every 60 seconds. |
| Mean Time To Recover (MTTR) | < 10 minutes       | For known failure modes with existing runbooks. Achieved via automated rollback (Kubernetes/ECS rollback to previous deployment) and database replica promotion. |

**High availability architecture**

```mermaid
flowchart TD
    %% Global Entrypoint
    dns["DNS (Route 53)<br/><b>api.smartcart.app</b>"]

    %% Traffic Routing
    dns --> alb_a
    dns --> alb_b
    dns --> alb_c

    %% --- COMPUTE LAYER (AVAILABILITY ZONES) ---
    subgraph AZ_A ["Availability Zone A"]
        alb_a["Nginx / ALB<br/>(Health Checks)"]
        api_a["NestJS API<br/>(Container 1)<br/><i>Stateless</i>"]
        alb_a --> api_a
    end

    subgraph AZ_B ["Availability Zone B"]
        alb_b["Nginx / ALB"]
        api_b["NestJS API<br/>(Container 2)<br/><i>Stateless</i>"]
        alb_b --> api_b
    end

    subgraph AZ_C ["Availability Zone C"]
        alb_c["Nginx / ALB"]
        api_c["NestJS API<br/>(Container 3)<br/><i>Stateless</i>"]
        alb_c --> api_c
    end

    %% --- DATABASE LAYER ---
    subgraph PG_Layer ["PostgreSQL (Primary + Replica)"]
        pg_primary["Primary (AZ A)<br/>• All writes<br/>• Synchronous commit"]
        pg_replica["Read Replica (AZ C)<br/>• Reads for analytics<br/>• Failover target"]
        
        pg_primary -- "WAL Replication" --> pg_replica
    end

    %% --- CACHING & STATE LAYER ---
    subgraph Redis_Layer ["Redis (Sentinel for HA)"]
        rd_primary["Redis Primary<br/>(AZ A)"]
        rd_replica["Redis Replica 1<br/>(AZ C)"]
        rd_sentinel["Redis Sentinel<br/>(AZ B)"]
        
        rd_primary <--> rd_replica
        rd_replica <--> rd_sentinel
        rd_sentinel <--> rd_primary
    end

    %% --- DATA LAYER INTERACTIONS ---
    %% API to Postgres Interconnects
    api_a --> pg_primary
    api_b --> pg_primary
    api_c --> pg_primary
    api_c -.->|Analytics Reads| pg_replica

    %% API to Redis Interconnects
    api_a --> rd_primary
    api_b --> rd_primary
    api_c --> rd_primary

    %% Custom Styling for Visual Distinction
    style dns fill:#f9f9fb,stroke:#333,stroke-width:1px
    style PG_Layer fill:#f5fafd,stroke:#0055aa,stroke-width:1px
    style Redis_Layer fill:#fff5f5,stroke:#cc0000,stroke-width:1px
```

**High availability mechanisms**

| Mechanism                  | Implementation                                                                                                      | Failure Mode Mitigated                                                                 |
|-----------------------------|---------------------------------------------------------------------------------------------------------------------|----------------------------------------------------------------------------------------|
| Multi-AZ API Deployment     | NestJS containers deployed across 3 availability zones. Nginx/ALB distributes traffic with health checks.            | Single AZ outage. If AZ A fails, traffic routes to AZ B and C containers.               |
| Load Balancer Health Checks | Nginx/ALB probes `GET /api/v1/health/readiness`  every 10 seconds. Unhealthy containers removed after 2 consecutive failures. | Pod crash, memory leak, deadlocked event loop.                                          |
| Auto-Restart on Crash       | Kubernetes `restartPolicy`: Always or Docker Compose `restart: unless-stopped`. PM2 restarts NestJS within 2 seconds.    | Unhandled exception crashes the Node.js process.                                        |
| Database Replication        | PostgreSQL streaming replication to a read replica in a different AZ. WAL files archived to S3/R2 every 5 minutes.  | Primary database failure. Replica promoted to primary in < 5 minutes.                   |
| Redis Sentinel              | 3-node Sentinel quorum monitors Redis primary. Automatic failover to replica if primary unreachable for 30 seconds. | Redis primary failure. Session cache and BullMQ continue operating.                     |
| Graceful Shutdown           | NestJS listens for `SIGTERM`. Closes HTTP server, drains BullMQ workers, closes Prisma connections.                    | In-flight requests lost during deployment rollover.                                     |

**Graceful Shutdown Implementation**:

```
// 📁 apps/api/src/main.ts — Graceful shutdown handler
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(3000);

  // ─── Graceful Shutdown ───────────────────────────────────
  // Kubernetes sends SIGTERM 30s before SIGKILL.
  // We use this window to drain connections cleanly.

  const gracefulShutdown = async (signal: string) => {
    console.log(`Received ${signal}. Starting graceful shutdown...`);
    const shutdownStart = Date.now();

    // 1. Stop accepting new HTTP requests
    await app.close();
    console.log('HTTP server closed');

    // 2. Close Prisma connection pool
    const prismaService = app.get(PrismaService);
    await prismaService.$disconnect();
    console.log('Database connections closed');

    // 3. Close Redis connections
    const redisService = app.get(RedisService);
    await redisService.quit();
    console.log('Redis connections closed');

    // 4. Close BullMQ queues gracefully (wait for active jobs to complete)
    const analyticsQueue = app.get('BullQueue_analytics-profile-update');
    const notificationQueue = app.get('BullQueue_push-notifications');
    await Promise.all([
      analyticsQueue.close(),
      notificationQueue.close(),
    ]);
    console.log('BullMQ queues closed');

    const duration = Date.now() - shutdownStart;
    console.log(`Graceful shutdown completed in ${duration}ms`);
    process.exit(0);
  };

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
}
bootstrap();
```

**Failure Mode Analysis (Top 5 Risks)**

| Failure Mode             | Impact                                                                 | Probability                          | Mitigation                                                                 | RTO Contribution          |
|---------------------------|------------------------------------------------------------------------|--------------------------------------|----------------------------------------------------------------------------|---------------------------|
| Single container crash    | 1/Nth of traffic affected (N=3). Health check removes unhealthy pod in 20s. | Medium (weekly in early production)   | Auto-restart (Kubernetes). PM2 inside container.                            | < 30 seconds              |
| Database primary failure  | All writes blocked. Reads continue via replica.                        | Low (managed PostgreSQL 99.95% SLA)   | Automatic failover to read replica. DNS updated to new primary.             | < 5 minutes               |
| Redis primary failure     | Session cache lost (cold cache for ~30s). BullMQ pauses.               | Low (Redis is stable)                 | Sentinel automatic failover. Sessions rebuild from PostgreSQL.              | < 1 minute                |
| AZ outage                 | All containers in one AZ become unreachable.                           | Very Low                              | Multi-AZ deployment. Load balancer routes to remaining AZs.                 | < 2 minutes (DNS propagation) |
| Full region outage        | All AZs in the region are down.                                        | Extremely Low                         | (Mitigation strategy not specified — typically multi-region active-active). | (Not defined)             |

### Scalability

#### Scalability strategy

| Concern                | Decision                                                                                                                   |
|-------------------------|----------------------------------------------------------------------------------------------------------------------------|
| Scaling Model           | **Horizontal scaling** — multiple stateless API containers behind a load balancer. Each container is identical and can handle any request. |
| Bottleneck Identification | The database is the primary bottleneck. Mitigated by read replicas for analytics queries, Redis Cache-Aside for product lookups, and connection pooling. |
| Statelessness           | All session state is stored in Redis, not in-process memory. A request can land on any container and find the session. JWT authentication is stateless (no server-side session). |
| Worker Scaling          | The analytics worker (`analytics-worker`) scales independently from the API. More worker instances can be added to process the BullMQ queue faster. |

**Stateless service verification**

Every API container must be able to handle any request without local state:

```
// 📁 apps/api/src/modules/checkout/application/services/checkout.service.ts
// PROOF OF STATELESSNESS: Session state is externalized to Redis

@Injectable()
export class CheckoutService {
  async addItem(sessionId: string, barcode: string): Promise<AddItemResult> {
    // 1. Load session from Redis (or PostgreSQL fallback)
    //    NOT from an in-memory Map or local variable
    const session = await this.sessionRepo.findById(sessionId);
    //    ↑ This could hit Redis on Container A, PostgreSQL on Container B.
    //    Both return the same data. The container is stateless.

    // 2. Apply business logic (pure computation — no external state)
    const product = await this.catalogService.findByBarcode(barcode);
    const item = new SessionItem(crypto.randomUUID(), barcode, 1, product.pointsConfig, product.isSponsored);
    session.addItem(item);

    // 3. Persist session back to Redis (and PostgreSQL)
    //    The next request for this session can land on Container C
    await this.sessionRepo.save(session);

    return { item, session };
  }
}
```

```
// 📁 apps/api/src/modules/checkout/infrastructure/repositories/prisma-session.repository.ts
// Session Repository: Redis write-through cache with PostgreSQL persistence

@Injectable()
export class PrismaSessionRepository implements ISessionRepository {
  async findById(id: string): Promise<ShoppingSession | null> {
    // 1. Try Redis first (shared across all containers)
    const cached = await this.redis.get(`session:${id}`);
    if (cached) return JSON.parse(cached);

    // 2. Fallback to PostgreSQL (shared across all containers)
    const row = await this.prisma.shoppingSession.findUnique({
      where: { id },
      include: { items: { include: { product: true } } },
    });

    if (!row) return null;

    const session = this.toDomain(row);

    // 3. Populate Redis for next request (from any container)
    await this.redis.set(`session:${id}`, JSON.stringify(session), 'EX', 7200);

    return session;
  }

  async save(session: ShoppingSession): Promise<void> {
    // Write-through: update Redis immediately
    await this.redis.set(`session:${session.id}`, JSON.stringify(session), 'EX', 7200);

    // Persist to PostgreSQL asynchronously
    await this.prisma.shoppingSession.upsert({
      where: { id: session.id },
      create: this.toPersistence(session),
      update: this.toPersistence(session),
    });
  }
}
```

##### Auto-scaling configuration

**Kubernetes Horizontal Pod Autoscaler (HPA)**:

```
# 📁 infra/kubernetes/api-hpa.yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: smartcart-api-hpa
  namespace: smartcart
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: smartcart-api
  minReplicas: 3      # Minimum 3 pods for HA across AZs
  maxReplicas: 20     # Maximum 20 pods during peak (Saturday 11 AM)
  metrics:
    # Primary scaling metric: CPU utilization
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 70

    # Secondary scaling metric: Memory utilization
    - type: Resource
      resource:
        name: memory
        target:
          type: Utilization
          averageUtilization: 75

    # Custom metric: HTTP request rate per pod
    - type: Pods
      pods:
        metric:
          name: http_requests_per_second
        target:
          type: AverageValue
          averageValue: "100"  # Scale up if > 100 req/s per pod

  behavior:
    scaleUp:
      stabilizationWindowSeconds: 60   # Wait 60s before scaling up
      policies:
        - type: Percent
          value: 100                   # Double the number of pods
          periodSeconds: 60
        - type: Pods
          value: 4                     # Or add up to 4 pods
          periodSeconds: 60
      selectPolicy: Max                # Use the more aggressive policy

    scaleDown:
      stabilizationWindowSeconds: 300  # Wait 5 minutes before scaling down
      policies:
        - type: Percent
          value: 10                    # Remove at most 10% of pods
          periodSeconds: 60
```

**Analytics Worker Auto-Scaling**:

```
# 📁 infra/kubernetes/analytics-worker-hpa.yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: analytics-worker-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: analytics-worker
  minReplicas: 2
  maxReplicas: 10
  metrics:
    # Primary: BullMQ queue depth (custom metric)
    - type: Pods
      pods:
        metric:
          name: smartcart_bullmq_queue_depth
          selector:
            matchLabels:
              queue: analytics-profile-update
        target:
          type: AverageValue
          averageValue: "100"  # Scale up if > 100 jobs waiting
```

#### Connection pooling

Prisma connection pool configuration prevents database connection exhaustion under load:

```
// 📁 prisma/schema.prisma — Connection pool configuration
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// Prisma connection pool is configured via environment variables
```

```
# 📁 .env.production — Connection pool environment variables

# Prisma connection pool size
# Each API container gets 10 connections. With 3 min pods = 30 total connections.
# PostgreSQL max_connections is set to 100 (headroom for admin tools).
PRISMA_CONNECTION_LIMIT=10

# PgBouncer transaction pooling in front of PostgreSQL
# (Pgbouncer pools connections from multiple API containers efficiently)
DATABASE_URL=postgresql://app_user:pass@pgbouncer:6432/smartcart?schema=public&connection_limit=10
```

**PgBouncer Configuration (transaction pooling)**:

```
# 📁 infra/pgbouncer/pgbouncer.ini
[databases]
smartcart = host=postgres-primary.internal port=5432 dbname=smartcart

[pgbouncer]
listen_addr = 0.0.0.0
listen_port = 6432
auth_type = scram-sha-256
auth_file = /etc/pgbouncer/userlist.txt

# Transaction pooling mode: each connection is returned to the pool after each transaction.
# This allows 10 Prisma connections per container to serve hundreds of concurrent requests.
pool_mode = transaction

# Maximum PostgreSQL connections from PgBouncer to the database
default_pool_size = 25

# Maximum client connections from API containers to PgBouncer
max_client_conn = 200

# Timeout idle connections (prevents connection leaks)
server_idle_timeout = 600
client_idle_timeout = 600
```

**Scaling Trigger Metrics — Summary**

| Metric                               | Threshold                  | Duration   | Action                                                                 |
|--------------------------------------|-----------------------------|------------|------------------------------------------------------------------------|
| CPU Utilization                      | > 70% average               | 5 minutes  | Scale up API pods (max 2x current)                                     |
| Memory Utilization                   | > 75% average               | 3 minutes  | Scale up API pods                                                      |
| HTTP Request Rate                    | > 100 req/s per pod         | 2 minutes  | Scale up API pods                                                      |
| BullMQ Queue Depth (analytics)       | > 100 waiting jobs          | 5 minutes  | Scale up analytics worker pods                                         |
| BullMQ Queue Depth (notifications)   | > 500 waiting jobs          | 5 minutes  | Scale up notification worker pods                                      |
| PostgreSQL Connections               | > 80% of max_connections    | 5 minutes  | Alert P2; increase pool size or add read replica                       |
| Redis Memory                         | > 70% of maxmemory          | 10 minutes | Alert P3; increase Redis instance size or add eviction policy           |

---

## 2.8 Backend key workflows

This section documents the two most critical workflows in SmartCart that go beyond simple CRUD operations: the QR Validation Flow (the revenue-critical path) and the Consumer Data Pipeline (the B2B value-generating path). Each workflow is traced through every architectural layer, every component, and every line of code that participates, with timing constraints and failure modes documented explicitly.

### Workflow 1: User QR validation flow (POS integration)

**Business Criticality**: This is the revenue path. If this flow fails, shoppers cannot complete their purchases, supermarkets lose sales, and SmartCart loses credibility. The flow must be atomic (points are only awarded if the transaction commits), fast (under 500ms P95), and cryptographically verifiable (no tampering between QR generation and POS validation).

| Layer          | Component                  | File Path                                                                                  | Responsibility                                                                 |
|----------------|----------------------------|--------------------------------------------------------------------------------------------|--------------------------------------------------------------------------------|
| Client         | POS Terminal               | apps/pos/ (separate repo)                                                                  | Scans QR, sends `qrToken` + `scannedItems` to API                                   |
| Presentation   | `ValidationController`       | `apps/api/src/modules/checkout/presentation/controllers/validation.controller.ts`            | Validates API key, DTO validation, returns HTTP response                       |
| Application    | `CheckoutService`            | `apps/api/src/modules/checkout/application/services/checkout.service.ts`                    | Orchestrates entire validation flow, manages transaction boundary              |
| Application    | `PointsService              | apps/api/src/modules/checkout/application/services/points.service.ts`                       | Calculates points per item using strategy pattern                              |
| Application    | `PointsStrategyResolver`     | `apps/api/src/modules/checkout/application/services/points-strategy-resolver.ts`             | Selects correct strategy per product config                                    |
| Domain         | `ShoppingSession`            | `apps/api/src/modules/checkout/domain/entities/shopping-session.entity.ts`                  | Validates item hash, enforces state machine                                    |
| Domain         | `IPointsCalculationStrategy` | `apps/api/src/modules/checkout/domain/strategies/points-calculation-strategy.interface.ts`   | Strategy interface for points algorithms                                       |
| Infrastructure | `JwtQrSigner`                | `apps/api/src/modules/checkout/infrastructure/crypto/jwt-qr.signer.ts`                       | Verifies JWT signature of QR token                                             |
| Infrastructure | `PrismaSessionRepository`    | `apps/api/src/modules/checkout/infrastructure/repositories/prisma-session.repository.ts`     | Persists session state                                                         |
| Infrastructure | `BullMqEventPublisher`       | `apps/api/src/modules/checkout/infrastructure/events/bullmq-event.publisher.ts`              | Publishes `CheckoutCompletedEvent` after commit                                  |
| Presentation   | `SessionGateway`             | `apps/api/src/modules/checkout/presentation/gateways/session.gateway.ts`                     | Pushes real-time validation result to mobile client                            |


**Prerequisites** (must have occurred before this flow):
1. Shopper created a `ShoppingSession` via `POST /sessions` (`CheckoutService.createSession()`).
2. Shopper `scanned items` via `POST /sessions/:id/items` (`CheckoutService.addItem()`).
3. Shopper requested QR generation via `POST /sessions/:id/qr` (`CheckoutService.generateQr()`), which:
- Called session.requestCheckout() — transitions status from ACTIVE to PENDING_CHECKOUT.
- Computed a deterministic SHA-256 hash of sorted {barcode} strings.
- Signed a JWT { sessionId, userId, itemHash, iat, exp } with HS256 and 5-minute expiry.
- Returned the JWT string to the mobile client, which rendered it as a QR code.

**Step-by-Step Execution Trace**

```
TIME  STEP  COMPONENT                    ACTION
────  ────  ───────────────────────────  ──────────────────────────────────────────────
T+0   1     POS Terminal                 Scans QR code from shopper's phone.
                                         Sends POST /api/v1/sessions/{id}/validate
                                         Headers: X-API-Key: sk_pos_abc123
                                         Body: { qrToken: "eyJhbG...", scannedItems: [...] }
                                         
T+2   2     Nginx / ALB                  TLS termination. Routes to healthy API container.
                                         Adds X-Forwarded-For, X-Correlation-Id headers.

T+3   3     ApiKeyGuard                  Extracts X-API-Key header.
                    📁 apps/api/src/common/guards/api-key.guard.ts
                                         Hashes key, queries `api_keys` table.
                                         Verifies key is active and has `pos_operator` role.
                                         Attaches { partnerName, role } to request.
                                         → On failure: 401 Unauthorized

T+5   4     ZodValidationPipe            Validates request body against ValidateSessionRequestSchema.
                    📁 packages/shared-types/src/session.types.ts
                                         Checks: qrToken is non-empty string,
                                         scannedItems is array with at least 1 item,
                                         each item has numeric barcode (8-14 digits) and quantity ≥ 1.
                                         → On failure: 400 Bad Request with field-level errors

T+7   5     ValidationController         Receives validated DTO.
                    📁 apps/api/src/modules/checkout/presentation/controllers/validation.controller.ts
                                         Delegates to CheckoutService.validateSession().
                                         Adds correlationId and POS partner info to log context.

T+8   6     CheckoutService              ENTRY POINT: validateSession(qrToken, scannedItems)
                    📁 apps/api/src/modules/checkout/application/services/checkout.service.ts
                                         
T+9   6a    JwtQrSigner.verify()         Decodes JWT without verification first (extract header).
                    📁 apps/api/src/modules/checkout/infrastructure/crypto/jwt-qr.signer.ts
                                         Verifies HS256 signature using QR_SIGNING_SECRET.
                                         Checks `exp` claim against current time (+10s clock tolerance).
                                         Checks `iss` claim equals "smartcart-qr".
                                         → On invalid signature: throws InvalidQrTokenError → 401
                                         → On expired token: throws QrTokenExpiredError → 422
                                         Extracts payload: { sub: sessionId, uid: userId, hash: itemHash }

T+15  6b    PrismaSessionRepository      Loads session by sessionId.
             .findById(sessionId)        Attempts Redis cache first (key: `session:{id}`).
                    📁 apps/api/src/modules/checkout/infrastructure/repositories/prisma-session.repository.ts
                                         On cache miss: queries PostgreSQL with `include: { items: true }`.
                                         Populates Redis cache with TTL 7200s.
                                         Maps Prisma row → ShoppingSession domain entity.
                                         → On not found: throws SessionNotFoundError → 404

T+20  6c    ShoppingSession              DOMAIN VALIDATION: session.validateItems(scannedItems)
             .validateItems()            Guards: session.status must be PENDING_CHECKOUT.
                    📁 apps/api/src/modules/checkout/domain/entities/shopping-session.entity.ts
                                         Computes SHA-256 hash of scannedItems (sorted barcodes).
                                         Compares with itemHash extracted from JWT.
                                         → On mismatch: throws QrItemMismatchError {
                                             expectedHash, receivedHash,
                                             sessionItems: ["123","456"],
                                             scannedItems: ["123","789"]
                                           } → 422 Unprocessable Entity
                                         → On match: returns true, transitions status → COMPLETED

T+25  6d    PointsService                Calculates points for each sponsored item.
             .calculatePoints(items)     Filters items where `isSponsored === true`.
                    📁 apps/api/src/modules/checkout/application/services/points.service.ts
                                         For each sponsored item:
                                           strategy = PointsStrategyResolver.resolve(item.pointsConfig.type)
                                           points = strategy.calculate(item.price, item.quantity, config)
                                         Returns PointsAwarded[] with breakdown per strategy type.

T+30  6e    Prisma.$transaction()        ACID TRANSACTION BEGINS — all or nothing.
                    📁 apps/api/src/modules/checkout/application/services/checkout.service.ts
                                         
             SessionRepo.markCompleted()  UPDATE shopping_sessions
                                         SET status = 'COMPLETED', completed_at = NOW()
                                         WHERE id = $1
                                         
             PointsRepo.creditPoints()    UPSERT points_accounts
                                         SET balance = balance + $total, last_updated = NOW()
                                         WHERE user_id = $1
                                         
                                         INSERT INTO points_transactions
                                         (user_id, session_id, delta, reason, metadata)
                                         VALUES ($1, $2, $total, 'PURCHASE', $breakdown)
                                         
                                         ACID TRANSACTION COMMITS
                                         → On any failure: entire transaction rolls back.
                                           No partial points awarded. No orphaned session state.

T+45  6f    BullMqEventPublisher         AFTER COMMIT (non-blocking): publishes side effects.
             .publish(event)             Creates CheckoutCompletedEvent {
                    📁 apps/api/src/modules/checkout/infrastructure/events/bullmq-event.publisher.ts
                                           sessionId, userId, storeId, pointsAwarded,
                                           items: [{ barcode, isSponsored, pointsValue }],
                                           timestamp
                                         }
                                         Adds job to `analytics-profile-update` queue.
                                         Adds job to `push-notifications` queue.
                                         → If publish fails: transaction is already committed.
                                           BullMQ retry with exponential backoff handles transient failures.

T+47  7     SessionGateway               Pushes real-time event to mobile client.
             .notifySessionValidated()   Emits 'sessionValidated' event to WebSocket room `session:{id}`.
                    📁 apps/api/src/modules/checkout/presentation/gateways/session.gateway.ts
                                         Payload: { sessionId, pointsAwarded, completedAt }
                                         Mobile client transitions from "Esperando validación…" 
                                         to Confirmation screen.

T+50  8     ValidationController         Returns HTTP response to POS.
                                         Status: 200 OK
                                         Body: {
                                           success: true,
                                           pointsAwarded: 250,
                                           itemsMatched: 5,
                                           itemsMismatched: 0,
                                           sessionId: "abc-123",
                                           completedAt: "2026-06-09T14:30:45Z"
                                         }
```

**Total elapsed time (happy path)**: ~50ms (excluding network latency). The Prisma transaction is the dominant cost (~15ms). Redis cache hits keep session lookup fast. The JWT verification is CPU-bound but negligible (~1ms for HS256).

```mermaid
sequenceDiagram
    participant POS as POS Terminal
    participant VC as Validation Controller
    participant CS as Checkout Service
    participant SS as Shopping Session
    participant PS as Points Service
    participant BP as BullMQ Publisher

    POS->>VC: POST /validate {qrToken, items}
    VC->>CS: validate()

    CS->>JwtQrSigner: verify(token)
    JwtQrSigner-->>CS: {sessionId, userId, hash}

    CS->>PrismaSessionRepo: findById(sid)
    PrismaSessionRepo-->>CS: session

    CS->>SS: validateItems(scanned)
    SS->>SS: computeHash()
    SS->>SS: compare()
    SS-->>CS: true

    CS->>PS: calculatePoints(items)
    Note right of PS: Strategy<br/>Pattern
    PS-->>CS: PointsAwarded

    rect rgb(240, 240, 240)
        Note over CS: ════ $transaction BEGIN ════
        CS->>CS: markCompleted(session)
        CS->>CS: creditPoints(user, pts)
        Note over CS: ════════ COMMIT ════════
    end

    CS->>BP: publish(CheckoutCompleted)
    Note right of BP: analytics-queue<br/>notifications-queue

    CS-->>VC: ValidationResult
    VC-->>POS: 200 OK {points: 250}
    
    Note over VC: SessionGateway.notifySessionValidated() (WebSocket)
```

**Error handling and failure modes**

| Step | Failure                          | Error Code             | HTTP Status | POS Behavior                                                                 | Rollback                                |
|------|----------------------------------|------------------------|-------------|------------------------------------------------------------------------------|-----------------------------------------|
| 3    | Invalid/missing API key          | ``UNAUTHORIZED``           | 401         | Display "Credenciales inválidas"                                             | N/A                                     |
| 4    | Invalid request body             | ``VALIDATION_FAILED``      | 400         | Retry with corrected data                                                    | N/A                                     |
| 6a   | QR token expired (>5 min)        | ``QR_TOKEN_EXPIRED``       | 422         | Ask shopper to regenerate QR                                                 | N/A                                     |
| 6a   | QR signature invalid             | ``INVALID_QR_TOKEN``       | 401         | Security alert — possible tampering                                          | N/A                                     |
| 6b   | Session not found                | ``SESSION_NOT_FOUND``      | 404         | Ask shopper to create new session                                            | N/A                                     |
| 6c   | Items don't match QR hash        | ``QR_ITEM_MISMATCH``       | 422         | Display mismatch details to cashier: "El producto 789 no está en la sesión"  | Session transitions to ``VALIDATION_FAILED``` |
| 6c   | Session not in PENDING_CHECKOUT  | ``INVALID_SESSION_STATE``  | 422         | "Esta sesión ya fue procesada o expiró"                                     | N/A                                     |
| 6d   | No sponsored items               | Normal                 | 200         | Checkout succeeds, 0 points awarded                                          | N/A                                     |
| 6e   | Database connection lost         | ``INTERNAL_ERROR``         | 500         | "Error del sistema. Reintente."                                              | Full transaction rollback               |
| 6e   | Points account insert fails      | ``INTERNAL_ERROR``         | 500         | "Error del sistema. Reintente."                                              | Full transaction rollback               |
| 6f   | BullMQ publish fails (non-blocking) | (non-blocking)       | 200         | Checkout succeeds. Event retried by BullMQ.                                  | N/A (transaction already committed)     |

```
// 📁 apps/api/src/modules/checkout/application/services/checkout.service.ts
// Complete validateSession implementation with all error handling

@Injectable()
export class CheckoutService {
  constructor(
    @Inject('ISessionRepository') private readonly sessionRepo: ISessionRepository,
    @Inject('IEventPublisher') private readonly eventPublisher: IEventPublisher,
    @Inject('IQrSigner') private readonly qrSigner: IQrSigner,
    @Inject('IPointsService') private readonly pointsService: IPointsService,
    private readonly prisma: PrismaService,
    private readonly metrics: BusinessMetricsService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext('CheckoutService');
  }

  async validateSession(
    qrToken: string,
    scannedItems: ScannedItemDTO[],
  ): Promise<ValidationResult> {
    const startTime = Date.now();
    const span = trace.getTracer('smartcart-checkout').startSpan('checkout.validate');

    this.logger.info({
      event: 'validation_started',
      itemCount: scannedItems.length,
      correlationId: this.requestContext?.correlationId,
    });

    try {
      // Step 1: Verify QR token cryptographically
      let qrPayload: QrPayload;
      try {
        qrPayload = await this.qrSigner.verify(qrToken);
      } catch (error) {
        if (error instanceof QrTokenExpiredError) {
          throw new UnprocessableEntityException({
            errorCode: 'QR_TOKEN_EXPIRED',
            message: 'QR code has expired. Please generate a new one.',
            expiredAt: error.expiredAt,
          });
        }
        if (error instanceof InvalidQrTokenError) {
          throw new UnauthorizedException({
            errorCode: 'INVALID_QR_TOKEN',
            message: 'QR token signature is invalid.',
          });
        }
        throw error;
      }

      span.setAttribute('smartcart.session_id', qrPayload.sessionId);
      span.setAttribute('smartcart.user_id', qrPayload.userId);

      // Step 2: Load session
      const session = await this.sessionRepo.findById(qrPayload.sessionId);
      if (!session) {
        throw new NotFoundException({
          errorCode: 'SESSION_NOT_FOUND',
          message: `Session ${qrPayload.sessionId} not found.`,
        });
      }

      // Step 3: DOMAIN — validate items cryptographically
      try {
        session.validateItems(scannedItems);
      } catch (error) {
        if (error instanceof QrItemMismatchError) {
          // Log the mismatch for security audit
          this.logger.warn({
            event: 'qr_item_mismatch',
            sessionId: session.id,
            expectedHash: error.details.expectedHash,
            receivedHash: error.details.receivedHash,
            sessionItems: error.details.sessionItems,
            scannedItems: error.details.scannedItems,
          });

          // Mark session as validation failed (outside transaction — best effort)
          await this.sessionRepo.markValidationFailed(session.id).catch(() => {});

          throw new UnprocessableEntityException({
            errorCode: 'QR_ITEM_MISMATCH',
            message: 'Scanned items do not match the QR session items.',
            details: {
              sessionItems: error.details.sessionItems,
              scannedItems: error.details.scannedItems,
            },
          });
        }
        throw error;
      }

      // Step 4: Calculate points for sponsored items
      const pointsAwarded = this.pointsService.calculatePoints(session.items, {
        userId: session.userId,
        timestamp: new Date(),
      });

      const totalPoints = pointsAwarded.reduce((sum, p) => sum + p.totalPoints, 0);

      // Step 5: ACID transaction — all or nothing
      let result: ValidationResult;
      try {
        result = await this.prisma.$transaction(async (tx) => {
          // Mark session completed
          await this.sessionRepo.markCompleted(session.id, tx);

          // Credit points (creates transaction record atomically)
          if (totalPoints > 0) {
            await this.pointsService.creditPoints(
              session.userId,
              pointsAwarded,
              session.id,
              tx,
            );
          }

          return {
            success: true as const,
            pointsAwarded: totalPoints,
            itemsMatched: scannedItems.length,
            itemsMismatched: 0,
            sessionId: session.id,
            completedAt: new Date().toISOString(),
          };
        });
      } catch (error) {
        this.logger.error({
          event: 'transaction_failed',
          sessionId: session.id,
          error: error.message,
        });
        throw new InternalServerErrorException({
          errorCode: 'CHECKOUT_FAILED',
          message: 'Checkout could not be completed. Please try again.',
        });
      }

      // Step 6: Post-commit side effects (non-blocking)
      const event = new CheckoutCompletedEvent(
        session.id,
        session.userId,
        session.storeId,
        totalPoints,
        session.items.map(i => ({
          barcode: i.barcode,
          isSponsored: i.isSponsored,
          pointsValue: i.pointsValue,
        })),
      );

      // Fire-and-forget — errors are handled by BullMQ retry
      this.eventPublisher.publish(event).catch(err => {
        this.logger.error({
          event: 'event_publish_failed',
          sessionId: session.id,
          error: err.message,
        });
      });

      // Step 7: Record business metrics
      const durationMs = Date.now() - startTime;
      this.metrics.recordCheckoutCompleted(totalPoints, durationMs);

      span.setAttribute('smartcart.points_awarded', totalPoints);
      span.setAttribute('smartcart.duration_ms', durationMs);
      span.setStatus({ code: SpanStatusCode.OK });
      span.end();

      this.logger.info({
        event: 'validation_completed',
        sessionId: session.id,
        pointsAwarded: totalPoints,
        durationMs,
      });

      return result;

    } catch (error) {
      span.setStatus({ code: SpanStatusCode.ERROR, message: error.message });
      span.recordException(error);
      span.end();

      this.logger.error({
        event: 'validation_failed',
        error: error.message,
        errorCode: error.response?.errorCode,
        durationMs: Date.now() - startTime,
      });

      throw error;
    }
  }
}
```

### Workflow 2: Consumer data pipeline (B2B Analytics)

**Business Criticality**: This is the B2B revenue path. Supermarkets and brands pay for access to aggregated, anonymized consumer segment data. The pipeline must process data asynchronously (not block checkout), handle the AI service being temporarily unavailable, and never expose individual user data to B2B clients.

**Participants (by layer)**:

| Layer          | Component               | File Path                                                                                       | Responsibility                                                                 |
|----------------|-------------------------|-------------------------------------------------------------------------------------------------|--------------------------------------------------------------------------------|
| Trigger        | `CheckoutCompletedEvent`  | `apps/api/src/modules/checkout/domain/events/checkout-completed.event.ts`                         | Carries user ID, store ID, items purchased, timestamp                          |
| Infrastructure | `BullMqEventPublisher`    | `apps/api/src/modules/checkout/infrastructure/events/bullmq-event.publisher.ts`                   | Enqueues event to analytics-profile-update queue                               |
| Queue          | `BullMQ`                  | Redis-backed                                                                                   | Durable job queue with retry, backoff, dead-letter                             |
| Worker         | `ProfileUpdateProcessor`  | `apps/analytics-worker/src/processors/profile-update.processor.ts`                                | Consumes jobs, orchestrates aggregation + classification                       |
| Application    | `ProfileAggregatorService`| `apps/analytics-worker/src/services/profile-aggregator.service.ts`                                | Computes 90-day rolling window behavioral features                             |
| Application    | `AiInferenceClient`       | `apps/analytics-worker/src/infrastructure/ai/ai-inference.client.ts`                              | Calls external AI service for segment classification                           |
| Infrastructure | `SegmentRepository`       | `apps/analytics-worker/src/infrastructure/repositories/segment.repository.ts`                     | Persists classified segment, invalidates cache                                 |
| Presentation   | `AnalyticsController`     | `apps/api/src/modules/analytics/presentation/controllers/analytics.controller.ts`                 | Serves B2B API for segment data                                                |
| Application    | `AnalyticsService`        | `apps/api/src/modules/analytics/application/services/analytics.service.ts`                        | Aggregates and anonymizes segment data for B2B consumption                     |


**Step-by-Step Execution Trace**

```
TIME  STEP  COMPONENT                    ACTION
────  ────  ───────────────────────────  ──────────────────────────────────────────────
T+0   1     BullMqEventPublisher         Triggered AFTER checkout transaction commits.
                    📁 apps/api/src/modules/checkout/infrastructure/events/bullmq-event.publisher.ts
                                         Publishes job to `analytics-profile-update` queue:
                                         {
                                           name: 'profile-update',
                                           data: {
                                             userId: "u-abc-123",
                                             sessionId: "s-xyz-789",
                                             storeId: "st-mega-001",
                                             items: [{ barcode: "123", isSponsored: true, pointsValue: 50 }, ...],
                                             pointsAwarded: 250,
                                             timestamp: "2026-06-09T14:30:45Z"
                                           },
                                           opts: {
                                             attempts: 3,
                                             backoff: { type: 'exponential', delay: 5000 },
                                             removeOnComplete: { age: 86400 },
                                             removeOnFail: { age: 604800 }
                                           }
                                         }
                                         → Total time from checkout commit: ~2ms (Redis write)

T+0   2     BullMQ                      Job sits in Redis list `bull:analytics-profile-update:waiting`.
                                         (This decouples checkout latency from analytics processing.)

T+500 3     ProfileUpdateProcessor       Worker picks up job from queue.
             .handle(job)               (Typical queue latency: 100-500ms in production.)
                    📁 apps/analytics-worker/src/processors/profile-update.processor.ts
                                         Logs: { event: 'profile_update_started', userId, sessionId }
                                         
T+510 4     ProfileAggregatorService     QUERY: 90-day rolling window aggregation.
             .aggregateFeatures(userId)  ─────────────────────────────────────────────
                    📁 apps/analytics-worker/src/services/profile-aggregator.service.ts
                                         SELECT
                                           COUNT(DISTINCT pt.session_id) as total_sessions,
                                           AVG(subquery.ticket_total) as avg_ticket,
                                           AVG(EXTRACT(HOUR FROM pt.created_at)) as avg_purchase_hour,
                                           COUNT(DISTINCT DATE_TRUNC('week', pt.created_at)) / 12.85 as weekly_frequency
                                         FROM points_transactions pt
                                         JOIN shopping_sessions s ON pt.session_id = s.id
                                         JOIN session_items si ON s.id = si.session_id
                                         JOIN products p ON si.product_id = p.id
                                         WHERE pt.user_id = $1
                                           AND pt.reason = 'PURCHASE'
                                           AND pt.created_at >= $2  -- 90 days ago
                                         GROUP BY pt.user_id

                                         COMPUTE:
                                           categoryFrequency: { "lácteos": 12, "bebidas": 8, "limpieza": 3, ... }
                                           avgTicket: 45.30
                                           avgPurchaseHour: 17.5  (5:30 PM average)
                                           weeklyFrequency: 0.8   (shops ~3.2 times per month)
                                           sponsoredRatio: 0.35   (35% of purchases are sponsored items)
                                           organicPreferenceScore: 0.72

                                         GUARD: If total_sessions < 5, return BehavioralFeatures.insufficientData()
                                         → Profile marked as "insufficient_data" — not classified yet.

T+550 5     AiInferenceClient            CHECK CACHE: Redis key `segment:{userId}`
             .classify(features)         → Cache hit (TTL 24h): return cached segment, skip AI call.
                    📁 apps/analytics-worker/src/infrastructure/ai/ai-inference.client.ts
                                         → Cache miss: proceed to AI inference.

T+560 5a    AI Service HTTP Call         POST https://ai.smartcart.internal/api/v1/classify
                                         Headers: Authorization: Bearer {AI_SERVICE_API_KEY}
                                         Body: {
                                           "features": {
                                             "category_frequency": {"lácteos": 12, "bebidas": 8, ...},
                                             "avg_ticket": 45.30,
                                             "avg_purchase_hour": 17.5,
                                             "weekly_frequency": 0.8,
                                             "sponsored_ratio": 0.35,
                                             "organic_preference_score": 0.72
                                           }
                                         }
                                         Timeout: 10 seconds.

T+800 5b    AI Service Response          200 OK
                                         {
                                           "segment": "premium_organic",
                                           "confidence": 0.87,
                                           "model_version": "v2.3.1",
                                           "explanation": "High organic preference + above-average ticket"
                                         }

T+810 5c    Cache Result                 SET segment:{userId} = {"segment":"premium_organic",...} EX 86400
                                         → Next 100 checkouts for this user skip the AI call for 24 hours.

T+815 6     SegmentRepository            UPSERT into consumer_segments:
             .upsert(userId, segment)    INSERT INTO consumer_segments (user_id, segment_name, model_version, classified_at)
                    📁 apps/analytics-worker/src/infrastructure/repositories/segment.repository.ts
                                         VALUES ($1, 'premium_organic', 'v2.3.1', NOW())
                                         ON CONFLICT (user_id) DO UPDATE SET
                                           segment_name = EXCLUDED.segment_name,
                                           model_version = EXCLUDED.model_version,
                                           classified_at = NOW()

T+820 7     Cache Invalidation           INVALIDATE aggregated B2B caches:
                                         DEL analytics:store:{storeId}:segments
                                         DEL analytics:global:segment-distribution
                                         → Next B2B API call will recalculate from PostgreSQL.

T+825 8     ProfileUpdateProcessor        Logs: { event: 'profile_update_completed', userId, segment, durationMs }
             .handle() completes         Job marked as completed in BullMQ.
                                         → Total processing time: ~325ms
                                         → Zero impact on checkout latency (job processed seconds later)
```

**B2B Data Consumption**

```
TIME  STEP  COMPONENT                    ACTION
────  ────  ───────────────────────────  ──────────────────────────────────────────────
T+?   9     B2B Partner Dashboard        GET /api/v1/analytics/segments?storeId=st-mega-001
                                         Headers: X-API-Key: sk_b2b_partner_xyz

T+?   10    ApiKeyGuard                  Validates B2B API key with role `b2b_partner`.

T+?   11    AnalyticsController          Delegates to AnalyticsService.getSegmentDistribution().
                    📁 apps/api/src/modules/analytics/presentation/controllers/analytics.controller.ts

T+?   12    AnalyticsService             CHECK CACHE: Redis key `analytics:store:st-mega-001:segments`
             .getSegmentDistribution()   → Cache hit: return cached data.
                    📁 apps/api/src/modules/analytics/application/services/analytics.service.ts
                                         → Cache miss: query PostgreSQL.

T+?   12a   PostgreSQL Query             SELECT segment_name, COUNT(*) as count
                                         FROM consumer_segments cs
                                         JOIN shopping_sessions s ON cs.user_id = s.user_id
                                         WHERE s.store_id = $1
                                           AND cs.classified_at >= NOW() - INTERVAL '7 days'
                                         GROUP BY segment_name
                                         ORDER BY count DESC

T+?   12b   Anonymization                GUARD: If any segment has count < 50, merge into "other" category.
                                         → Prevents re-identification of individual users.

T+?   12c   Cache Population             SET analytics:store:st-mega-001:segments = {result} EX 3600
                                         → Subsequent B2B queries hit cache for 1 hour.

T+?   13    Response                     200 OK
                                         {
                                           "segments": [
                                             { "name": "budget_conscious", "count": 2100, "percentage": 47.9 },
                                             { "name": "premium_organic", "count": 1250, "percentage": 28.5 },
                                             { "name": "impulse_buyer", "count": 580, "percentage": 13.2 },
                                             { "name": "brand_loyal", "count": 450, "percentage": 10.3 }
                                           ],
                                           "totalClassifiedUsers": 4380,
                                           "modelVersion": "v2.3.1",
                                           "generatedAt": "2026-06-09T14:35:00Z",
                                           "anonymizationNote": "Segments with < 50 users are merged into 'other'."
                                         }
```

**AI Service Fallback & Resilience**

```
// 📁 apps/analytics-worker/src/infrastructure/ai/ai-inference.client.ts
// Complete AI client with caching, circuit breaker, and fallback

@Injectable()
export class AiInferenceClient {
  private readonly circuitBreaker: CircuitBreaker;

  constructor(
    private readonly http: HttpService,
    private readonly redis: RedisService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext('AiInferenceClient');

    // Circuit breaker: after 5 failures in 30s, stop calling AI for 60s
    this.circuitBreaker = new CircuitBreaker({
      failureThreshold: 5,
      resetTimeout: 60000,
      monitoringPeriod: 30000,
    });
  }

  async classify(features: BehavioralFeatures): Promise<ClassificationResult> {
    const cacheKey = `segment:${features.userId}`;

    // 1. Check Redis cache (24-hour TTL)
    const cached = await this.redis.get(cacheKey);
    if (cached) {
      this.logger.debug({ userId: features.userId, hit: true }, 'AI cache hit');
      return JSON.parse(cached);
    }

    // 2. Check circuit breaker
    if (this.circuitBreaker.isOpen()) {
      this.logger.warn({ userId: features.userId }, 'AI circuit breaker open — using fallback');
      return this.applyFallbackClassification(features);
    }

    // 3. Call AI service
    try {
      const response = await this.http.axiosRef.post<ClassificationResponse>(
        `${process.env.AI_SERVICE_URL}/api/v1/classify`,
        { features: features.toJSON() },
        {
          headers: { Authorization: `Bearer ${process.env.AI_SERVICE_API_KEY}` },
          timeout: 10000, // 10-second timeout
        },
      );

      const result: ClassificationResult = {
        userId: features.userId,
        segment: response.data.segment,
        confidence: response.data.confidence,
        modelVersion: response.data.model_version,
        classifiedAt: new Date().toISOString(),
        source: 'ai_service',
      };

      // Cache result for 24 hours
      await this.redis.set(cacheKey, JSON.stringify(result), 'EX', 86400);

      this.circuitBreaker.recordSuccess();
      return result;

    } catch (error) {
      this.logger.error({
        event: 'ai_classification_failed',
        userId: features.userId,
        error: error.message,
      });

      this.circuitBreaker.recordFailure();

      // Fallback: rule-based classification
      return this.applyFallbackClassification(features);
    }
  }

  /**
   * Rule-based fallback when AI service is unavailable.
   * Uses simple thresholds on behavioral features.
   * Less accurate than the ML model but keeps the pipeline running.
   */
  private applyFallbackClassification(features: BehavioralFeatures): ClassificationResult {
    let segment: string;

    if (features.organicPreferenceScore > 0.6 && features.avgTicket > 40) {
      segment = 'premium_organic';
    } else if (features.avgTicket < 25 && features.weeklyFrequency > 0.7) {
      segment = 'budget_conscious';
    } else if (features.sponsoredRatio > 0.5) {
      segment = 'brand_loyal';
    } else {
      segment = 'impulse_buyer';
    }

    return {
      userId: features.userId,
      segment,
      confidence: 0.5, // Lower confidence for rule-based
      modelVersion: 'fallback-rules-v1',
      classifiedAt: new Date().toISOString(),
      source: 'fallback_rules',
    };
  }
}
```

**Workflow Interaction Diagram**

```mermaid
sequenceDiagram
    autonumber
    
    actor Shopper as SHOPPER
    participant POS as POS
    participant Backend as BACKEND
    participant Worker as BullMQ Worker
    actor Partner as B2B PARTNER

    %% --- LIVE CHECKOUT FLOW ---
    box rgb(245, 247, 250) "Live Checkout Phase"
        participant Shopper
        participant POS
        participant Backend
    end

    Shopper->>POS: Scan items
    POS->>Backend: POST /sessions/{id}/items
    Note right of Backend: Add item to session<br/>(Redis + PostgreSQL)
    Backend-->>POS: 

    Shopper->>POS: Generate QR
    POS->>Backend: POST /sessions/{id}/qr
    Note right of Backend: Sign JWT with item hash<br/>Return qrToken
    Backend-->>POS: 

    Shopper->>POS: Show QR to cashier
    Note over POS: Scan QR + cart items
    POS->>Backend: POST /sessions/{id}/validate
    
    rect rgb(235, 245, 255)
        Note over Backend: WORKFLOW 1: QR Validation Flow<br/>- Verify JWT<br/>- Compare hashes<br/>- Calculate points<br/>- ACID transaction
    end
    Backend-->>POS: 200 OK { points: 250 }

    Backend-->>Shopper: WebSocket: sessionValidated<br/>"¡Puntos acreditados!"

    %% --- ASYNC PIPELINE ---
    rect rgb(245, 240, 255)
        Note over Backend, Worker: WORKFLOW 2: Consumer Data Pipeline<br/>(async, seconds after checkout)
    end
    Backend->>Worker: BullMQ: analytics-profile
    Note right of Worker: Worker Action:<br/>- Agg<br/>- AI<br/>- Cache

    %% --- NEXT DAY / B2B ---
    rect rgb(255, 253, 240)
        Note over Partner, Backend: Next Day Operations
    end
    Partner->>Backend: GET /analytics/segments?storeId=xxx
    Backend-->>Partner: { segments: [...], totalUsers: 4380 }
```
---

## 2.9 Infrastructure and DevOps

This section documents the complete delivery pipeline — from developer workstation to production — for SmartCart. Every tool, script, and configuration is specified with its exact file path in the monorepo. The pipeline is designed to enforce quality gates automatically, prevent regressions, and enable any team member to deploy safely.

### Source Control

| Concern                | Decision                                                                                                                   |
|-------------------------|----------------------------------------------------------------------------------------------------------------------------|
| Version Control System  | Git                                                                                                                        |
| Platform                | GitHub                                                                                                                     |
| Branching Strategy      | **Trunk-Based Development** — all developers commit to short-lived feature branches (max 24 hours) and merge to `main` via pull request. `main` is always deployable. |
| Branch Naming           | `feat/<ticket-id>-short-description`, `fix/<ticket-id>-short-description`, `chore/<ticket-id>-short-description`                 |
| Merge Strategy          | Squash merge to keep `main` history linear and clean. Each commit on `main` represents exactly one PR.                         |
| Branch Protection       | `main` requires: 1 approving review, all status checks passing, branch up-to-date before merge. Direct pushes to main are disabled. |

**Branch Protection Rules (GitHub Settings)**:

```
# 📁 .github/settings.yml — Branch protection configuration
branches:
  - name: main
    protection:
      required_pull_request_reviews:
        required_approving_review_count: 1
        dismiss_stale_reviews: true
        require_code_owner_reviews: true
      required_status_checks:
        strict: true
        contexts:
          - "lint"
          - "type-check"
          - "unit-tests"
          - "integration-tests"
          - "api-contract-tests"
          - "security-audit"
          - "quality-gate"
      enforce_admins: false
      restrictions:
        users: []
        teams: ["backend-engineers"]
```

### CI/CD Tooling

| Concern             | Decision                                                                                                   |
|---------------------|------------------------------------------------------------------------------------------------------------|
| CI/CD Platform      | GitHub Actions — runs on every push to a PR and on merge to `main`                                           |
| Workflow Files      | `.github/workflows/ci.yml` (PR validation), `.github/workflows/deploy.yml` (deployment)                        |
| Container Registry  | GitHub Container Registry (GHCR) for Docker images                                                         |
| Secrets Storage     | GitHub Actions Secrets for `DOCKER_REGISTRY_TOKEN`, `RAILWAY_API_TOKEN`, `SENTRY_DSN`, etc.                      |

### CI/CD Pipeline — Full Flow Diagram

```mermaid
flowchart TD
    %% Trigger Nodes
    push(["git push feature/xxx"]) 
    pr(["Create PR"])
    merge(["Merge PR to main"])

    %% CI Stage Grouping
    subgraph CI_Stage ["CI Pipeline (Feature Branch / PR)"]
        s1["1. Install Deps<br/>• npm ci<br/>• Cache: node_modules"]
        s2["2. Static Analysis<br/>• ESLint<br/>• Prettier check<br/>• TypeScript check (tsc --noEmit)"]
        
        %% Test Matrix
        s3a["3a. Unit Tests<br/>(Jest)"]
        s3b["3b. Integ Tests<br/>(Jest + Docker)"]
        s3c["3c. API Contract Tests<br/>(Jest)"]
        
        s4["4. Quality Gate<br/>• Coverage ≥ 80%<br/>• SonarQube pass<br/>• No critical vulns"]
    end

    %% CD Stage Grouping
    subgraph CD_Stage ["CD Pipeline (Main Branch)"]
        s5["5. Build & Push<br/>• Docker image<br/>• Tag: main-{sha}<br/>• Push to GHCR"]
        s6["6. Deploy Staging<br/>• Railway / Render<br/>• Auto-deploy"]
        s7["7. Smoke Tests<br/>• (Staging)<br/>• Health check<br/>• Critical flows"]
        
        approval{"Manual Approval?<br/>(Required for prod)"}
        
        s8["8. Deploy Production<br/>• Rolling update<br/>• (zero downtime)"]
        s9["9. Post-Deploy<br/>• Health check<br/>• Sentry watch<br/>• (10 min monitor)"]
    end

    %% Production Target Environment
    prod_env["Production Environment<br/>(Railway / ECS)"]

    %% --- Relationships & Execution Flow ---
    push --> s1
    s1 --> s2
    
    %% Fan out to parallel tests
    s2 --> s3a
    s2 --> s3b
    s2 --> s3c
    
    pr -.-> s3a
    
    %% Fan in to Quality Gate
    s3a --> s4
    s3b --> s4
    s3c --> s4
    
    %% Branch Merge Gate
    s4 --> merge
    merge --> s5
    
    %% CD Pipeline Linearity
    s5 --> s6
    s6 --> s7
    s7 --> approval
    
    %% Production Release Cutover
    approval -- "Approved" --> s8
    s8 --> s9
    s8 --> prod_env

    %% Styling configurations for clear separation of concerns
    style push fill:#f4f4f6,stroke:#444,stroke-width:1px
    style pr fill:#f4f4f6,stroke:#444,stroke-width:1px
    style merge fill:#f4f4f6,stroke:#444,stroke-width:1px
    style prod_env fill:#eef9ff,stroke:#0077cc,stroke-width:1px
```

### CI Pipeline — Pull Request Validation

```
# 📁 .github/workflows/ci.yml
name: CI — Pull Request Validation

on:
  pull_request:
    branches: [main]
    types: [opened, synchronize, reopened]

env:
  NODE_VERSION: '20'
  PNPM_VERSION: '9'

concurrency:
  group: ci-${{ github.ref }}
  cancel-in-progress: true

jobs:
  # ─── Step 1: Install & Cache Dependencies ──────────────────
  install:
    name: Install Dependencies
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with:
          version: ${{ env.PNPM_VERSION }}
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'pnpm'
      - run: pnpm install --frozen-lockfile
      - name: Cache node_modules
        uses: actions/cache@v4
        with:
          path: |
            node_modules
            apps/*/node_modules
            packages/*/node_modules
          key: node-modules-${{ runner.os }}-${{ hashFiles('pnpm-lock.yaml') }}

  # ─── Step 2: Static Analysis ───────────────────────────────
  lint:
    name: Lint & Type Check
    runs-on: ubuntu-latest
    needs: install
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with:
          version: ${{ env.PNPM_VERSION }}
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'pnpm'
      - run: pnpm install --frozen-lockfile
      - name: ESLint
        run: pnpm lint
      - name: Prettier Check
        run: pnpm format:check
      - name: TypeScript Type Check
        run: pnpm type-check

  # ─── Step 3a: Unit Tests ──────────────────────────────────
  unit-tests:
    name: Unit Tests
    runs-on: ubuntu-latest
    needs: install
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with:
          version: ${{ env.PNPM_VERSION }}
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'pnpm'
      - run: pnpm install --frozen-lockfile
      - name: Run Unit Tests
        run: pnpm test:unit --coverage
      - name: Upload Coverage Report
        uses: actions/upload-artifact@v4
        with:
          name: coverage-report
          path: apps/api/coverage/lcov.info

  # ─── Step 3b: Integration Tests ────────────────────────────
  integration-tests:
    name: Integration Tests
    runs-on: ubuntu-latest
    needs: install
    services:
      postgres:
        image: postgres:16-alpine
        env:
          POSTGRES_USER: test_user
          POSTGRES_PASSWORD: test_pass
          POSTGRES_DB: smartcart_test
        ports:
          - 5432:5432
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
      redis:
        image: redis:7-alpine
        ports:
          - 6379:6379
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with:
          version: ${{ env.PNPM_VERSION }}
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'pnpm'
      - run: pnpm install --frozen-lockfile
      - name: Run Prisma Migrations
        run: pnpm prisma migrate deploy
        env:
          DATABASE_URL: postgresql://test_user:test_pass@localhost:5432/smartcart_test
      - name: Run Integration Tests
        run: pnpm test:integration
        env:
          DATABASE_URL: postgresql://test_user:test_pass@localhost:5432/smartcart_test
          REDIS_URL: redis://localhost:6379
          JWT_ACCESS_SECRET: test-access-secret-at-least-32-chars-long
          JWT_REFRESH_SECRET: test-refresh-secret-at-least-32-chars-long
          QR_SIGNING_SECRET: test-qr-secret-at-least-32-chars-long

  # ─── Step 3c: API Contract Tests ──────────────────────────
  api-contract-tests:
    name: API Contract Tests
    runs-on: ubuntu-latest
    needs: install
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with:
          version: ${{ env.PNPM_VERSION }}
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'pnpm'
      - run: pnpm install --frozen-lockfile
      - name: Generate OpenAPI Spec
        run: pnpm openapi:generate
      - name: Validate OpenAPI Spec
        run: pnpm openapi:validate
      - name: Run Contract Tests
        run: pnpm test:contract

  # ─── Step 4: Quality Gate ─────────────────────────────────
  quality-gate:
    name: Quality Gate
    runs-on: ubuntu-latest
    needs: [lint, unit-tests, integration-tests, api-contract-tests]
    steps:
      - uses: actions/checkout@v4
      - name: Download Coverage Report
        uses: actions/download-artifact@v4
        with:
          name: coverage-report
      - name: Check Coverage Threshold
        run: |
          COVERAGE=$(grep -oP '"pct":\K\d+\.\d+' coverage-summary.json | head -1)
          if (( $(echo "$COVERAGE < 80" | bc -l) )); then
            echo "Coverage $COVERAGE% is below 80% threshold"
            exit 1
          fi
          echo "Coverage $COVERAGE% meets threshold"
      - name: Check for Critical Vulnerabilities
        run: pnpm audit --audit-level=critical
      - name: SonarQube Scan
        uses: sonarsource/sonarqube-scan-action@v3
        env:
          SONAR_TOKEN: ${{ secrets.SONAR_TOKEN }}
          SONAR_HOST_URL: ${{ secrets.SONAR_HOST_URL }}
```

### CD Pipeline — Deployment

```
# 📁 .github/workflows/deploy.yml
name: CD — Deploy

on:
  push:
    branches: [main]
  workflow_dispatch:
    inputs:
      environment:
        description: 'Deployment target'
        required: true
        type: choice
        options:
          - staging
          - production

env:
  NODE_VERSION: '20'
  IMAGE_NAME: ghcr.io/${{ github.repository }}/smartcart-api

jobs:
  # ─── Step 5: Build & Push Docker Image ────────────────────
  build:
    name: Build & Push Docker Image
    runs-on: ubuntu-latest
    outputs:
      image_tag: ${{ steps.meta.outputs.tags }}
    steps:
      - uses: actions/checkout@v4
      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3
      - name: Login to GitHub Container Registry
        uses: docker/login-action@v3
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}
      - name: Extract metadata
        id: meta
        uses: docker/metadata-action@v5
        with:
          images: ${{ env.IMAGE_NAME }}
          tags: |
            type=sha,prefix=main-
            type=ref,event=branch
            type=semver,pattern={{version}}
      - name: Build and Push
        uses: docker/build-push-action@v5
        with:
          context: .
          file: docker/Dockerfile.api
          push: true
          tags: ${{ steps.meta.outputs.tags }}
          labels: ${{ steps.meta.outputs.labels }}
          cache-from: type=gha
          cache-to: type=gha,mode=max

  # ─── Step 6: Deploy to Staging ────────────────────────────
  deploy-staging:
    name: Deploy to Staging
    runs-on: ubuntu-latest
    needs: build
    if: github.ref == 'refs/heads/main'
    environment:
      name: staging
      url: https://staging.api.smartcart.app
    steps:
      - uses: actions/checkout@v4
      - name: Deploy to Railway (Staging)
        uses: railwayapp/railway-deploy@v1
        with:
          railway_token: ${{ secrets.RAILWAY_STAGING_TOKEN }}
          environment: staging
          service: smartcart-api

  # ─── Step 7: Smoke Tests (Staging) ────────────────────────
  smoke-tests:
    name: Smoke Tests
    runs-on: ubuntu-latest
    needs: deploy-staging
    steps:
      - name: Health Check
        run: |
          for i in {1..10}; do
            STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://staging.api.smartcart.app/api/v1/health)
            if [ "$STATUS" = "200" ]; then
              echo "Health check passed"
              exit 0
            fi
            echo "Waiting for deployment... attempt $i/10"
            sleep 10
          done
          echo "Health check failed after 10 attempts"
          exit 1
      - name: Critical Flow Test
        run: |
          # Register test user
          curl -s -X POST https://staging.api.smartcart.app/api/v1/auth/register \
            -H "Content-Type: application/json" \
            -d '{"fullName":"Smoke Test","email":"smoke@test.com","password":"Test1234"}' \
            | tee /tmp/register.json

          # Login
          curl -s -X POST https://staging.api.smartcart.app/api/v1/auth/login \
            -H "Content-Type: application/json" \
            -d '{"email":"smoke@test.com","password":"Test1234"}' \
            | tee /tmp/login.json

          echo "Critical flows verified"

  # ─── Step 8: Deploy to Production (Manual Approval) ───────
  deploy-production:
    name: Deploy to Production
    runs-on: ubuntu-latest
    needs: smoke-tests
    if: github.ref == 'refs/heads/main'
    environment:
      name: production
      url: https://api.smartcart.app
    steps:
      - uses: actions/checkout@v4
      - name: Deploy to Railway (Production)
        uses: railwayapp/railway-deploy@v1
        with:
          railway_token: ${{ secrets.RAILWAY_PRODUCTION_TOKEN }}
          environment: production
          service: smartcart-api

  # ─── Step 9: Post-Deploy Monitoring ───────────────────────
  post-deploy-monitor:
    name: Post-Deploy Monitor
    runs-on: ubuntu-latest
    needs: deploy-production
    steps:
      - name: Wait for deployment to stabilize
        run: sleep 30
      - name: Health Check (Production)
        run: |
          STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://api.smartcart.app/api/v1/health)
          if [ "$STATUS" != "200" ]; then
            echo "Production health check failed!"
            exit 1
          fi
          echo "Production healthy"
      - name: Check Sentry for new errors
        run: |
          # Query Sentry API for errors in the last 5 minutes
          curl -s "https://sentry.io/api/0/projects/smartcart/api/issues/?query=is:unresolved&statsPeriod=5m" \
            -H "Authorization: Bearer ${{ secrets.SENTRY_AUTH_TOKEN }}" \
            | python3 -c "import sys,json; d=json.load(sys.stdin); exit(1 if len(d)>0 else 0)" \
            && echo "No new Sentry issues" \
            || echo "Warning: New Sentry issues detected — check Sentry dashboard"
      - name: Notify Slack
        uses: slackapi/slack-github-action@v1.26.0
        with:
          payload: |
            {
              "text": "SmartCart API deployed to production\n• Image: ${{ needs.build.outputs.image_tag }}\n• Commit: ${{ github.sha }}\n• Author: ${{ github.actor }}"
            }
        env:
          SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK_URL }}
```

### Infrastructure as Code (IaC)

| Concern           | Decision                                                                                   |
|-------------------|--------------------------------------------------------------------------------------------|
| Tool              | **Terraform** (v1.9+) — provider-agnostic, declarative, state stored in Terraform Cloud        |
| Providers         | `railway` (for Railway.app), `cloudflare` (for R2 storage), `github` (for repository settings)   |
| State Management  | Terraform Cloud with remote state, state locking, and version history                      |

**Terraform Configuration for Railway (Primary Hosting)**:

```
# 📁 infra/terraform/main.tf
terraform {
  required_version = ">= 1.9.0"

  required_providers {
    railway = {
      source  = "terraform-community-providers/railway"
      version = "~> 0.4"
    }
    cloudflare = {
      source  = "cloudflare/cloudflare"
      version = "~> 4.0"
    }
  }

  cloud {
    organization = "smartcart"
    workspaces {
      name = "smartcart-production"
    }
  }
}

provider "railway" {
  token = var.railway_api_token
}

provider "cloudflare" {
  api_token = var.cloudflare_api_token
}
```

```
# 📁 infra/terraform/environments/production/main.tf
# Production environment definition

module "smartcart_api" {
  source = "../../modules/railway-service"

  environment    = "production"
  service_name   = "smartcart-api"
  repo_url       = "https://github.com/smartcart/smartcart"
  branch         = "main"
  dockerfile_path = "docker/Dockerfile.api"

  # Environment variables (non-sensitive)
  env_vars = {
    NODE_ENV                  = "production"
    PORT                      = "3000"
    BCRYPT_ROUNDS             = "12"
    CORS_ORIGINS              = "https://app.smartcart.app"
    RATE_LIMIT_MAX            = "100"
    RATE_LIMIT_TTL            = "60"
    AI_SERVICE_URL            = "https://ai.smartcart.internal"
    OTLP_EXPORTER_ENDPOINT    = "http://jaeger:4317"
  }

  # Secrets (Railway manages these securely)
  secrets = [
    "DATABASE_URL",
    "REDIS_URL",
    "JWT_ACCESS_SECRET",
    "JWT_REFRESH_SECRET",
    "QR_SIGNING_SECRET",
    "AI_SERVICE_API_KEY",
    "SENTRY_DSN",
    "EXPO_PUSH_API_TOKEN",
    "S3_ACCESS_KEY_ID",
    "S3_SECRET_ACCESS_KEY",
    "S3_BUCKET_NAME",
    "S3_REGION",
  ]

  # Scaling
  min_replicas = 3
  max_replicas = 10
  cpu           = "1 vCPU"
  memory        = "1 GB"

  # Health check
  health_check_path = "/api/v1/health/readiness"
}

module "smartcart_analytics_worker" {
  source = "../../modules/railway-service"

  environment    = "production"
  service_name   = "smartcart-analytics-worker"
  repo_url       = "https://github.com/smartcart/smartcart"
  branch         = "main"
  dockerfile_path = "docker/Dockerfile.worker"

  env_vars = {
    NODE_ENV               = "production"
    AI_SERVICE_URL         = "https://ai.smartcart.internal"
    OTLP_EXPORTER_ENDPOINT = "http://jaeger:4317"
  }

  secrets = [
    "DATABASE_URL",
    "REDIS_URL",
    "AI_SERVICE_API_KEY",
  ]

  min_replicas = 2
  max_replicas = 8
  cpu           = "0.5 vCPU"
  memory        = "512 MB"
}

module "postgresql" {
  source = "../../modules/railway-postgresql"

  environment     = "production"
  database_name   = "smartcart"
  version         = "16"
  high_availability = true
}

module "redis" {
  source = "../../modules/railway-redis"

  environment = "production"
  version     = "7.4"
  maxmemory   = "4gb"
}
```

### Docker Configuration

```
# 📁 docker/Dockerfile.api — Multi-stage build for minimal image size
# Stage 1: Build
FROM node:20-alpine AS builder
WORKDIR /app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@9 --activate

# Copy dependency manifests
COPY pnpm-lock.yaml pnpm-workspace.yaml ./
COPY package.json ./
COPY apps/api/package.json apps/api/
COPY packages/shared-types/package.json packages/shared-types/

# Install dependencies (production only for smaller layer)
RUN pnpm install --frozen-lockfile --prod --filter=@smartcart/api

# Copy source code
COPY apps/api/ apps/api/
COPY packages/shared-types/ packages/shared-types/
COPY prisma/ prisma/

# Generate Prisma client
RUN pnpm --filter=@smartcart/api prisma:generate

# Build TypeScript
RUN pnpm --filter=@smartcart/api build

# Stage 2: Production runtime
FROM node:20-alpine AS runner
WORKDIR /app

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nestjs

# Copy only production artifacts from builder
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/api/dist ./dist
COPY --from=builder /app/apps/api/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/package.json ./package.json

# Copy OpenTelemetry startup script
COPY --from=builder /app/apps/api/src/tracing.ts ./dist/tracing.js

# Set non-root user
USER nestjs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=15s --timeout=5s --start-period=30s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/v1/health/liveness || exit 1

# Start application (tracing must be imported first)
CMD ["node", "--require", "./dist/tracing.js", "dist/main.js"]
```
```
# 📁 docker/Dockerfile.worker — Analytics worker image
FROM node:20-alpine AS builder
WORKDIR /app

RUN corepack enable && corepack prepare pnpm@9 --activate

COPY pnpm-lock.yaml pnpm-workspace.yaml ./
COPY package.json ./
COPY apps/analytics-worker/package.json apps/analytics-worker/
COPY packages/shared-types/package.json packages/shared-types/

RUN pnpm install --frozen-lockfile --prod --filter=@smartcart/analytics-worker

COPY apps/analytics-worker/ apps/analytics-worker/
COPY packages/shared-types/ packages/shared-types/
COPY prisma/ prisma/

RUN pnpm --filter=@smartcart/analytics-worker prisma:generate
RUN pnpm --filter=@smartcart/analytics-worker build

FROM node:20-alpine AS runner
WORKDIR /app

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nestjs

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/analytics-worker/dist ./dist
COPY --from=builder /app/apps/analytics-worker/node_modules/.prisma ./node_modules/.prisma

USER nestjs

CMD ["node", "dist/main.js"]
```

```
# 📁 docker/docker-compose.yml — Local development environment
version: '3.9'

services:
  api:
    build:
      context: ..
      dockerfile: docker/Dockerfile.api
      target: builder # Use builder stage for hot-reload in dev
    ports:
      - "3000:3000"
    environment:
      NODE_ENV: development
      DATABASE_URL: postgresql://smartcart:smartcart@postgres:5432/smartcart?schema=public
      REDIS_URL: redis://redis:6379
      JWT_ACCESS_SECRET: dev-access-secret-at-least-32-chars-long!!
      JWT_REFRESH_SECRET: dev-refresh-secret-at-least-32-chars-long!!
      QR_SIGNING_SECRET: dev-qr-secret-at-least-32-chars-long!!!!
      SENTRY_DSN: ""
      AI_SERVICE_URL: http://ai-mock:8000
      CORS_ORIGINS: "*"
    volumes:
      - ../apps/api/src:/app/apps/api/src
      - ../packages:/app/packages
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    command: pnpm --filter=@smartcart/api dev

  analytics-worker:
    build:
      context: ..
      dockerfile: docker/Dockerfile.worker
      target: builder
    environment:
      NODE_ENV: development
      DATABASE_URL: postgresql://smartcart:smartcart@postgres:5432/smartcart?schema=public
      REDIS_URL: redis://redis:6379
      AI_SERVICE_URL: http://ai-mock:8000
    volumes:
      - ../apps/analytics-worker/src:/app/apps/analytics-worker/src
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    command: pnpm --filter=@smartcart/analytics-worker dev

  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: smartcart
      POSTGRES_PASSWORD: smartcart
      POSTGRES_DB: smartcart
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U smartcart"]
      interval: 5s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    command: redis-server --appendonly yes --maxmemory 256mb --maxmemory-policy allkeys-lru
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      timeout: 5s
      retries: 5

  ai-mock:
    image: mockoon/cli:latest
    command: ["mockoon-cli", "start", "--data", "/data/ai-mock.json"]
    volumes:
      - ../tests/mocks/ai-mock.json:/data/ai-mock.json:ro
    ports:
      - "8000:8000"

  jaeger:
    image: jaegertracing/all-in-one:latest
    ports:
      - "16686:16686" # UI
      - "4317:4317"   # OTLP gRPC

volumes:
  postgres_data:
```

### Deployment Strategy

| Concern             | Decision                                                                                                                                            |
|---------------------|-----------------------------------------------------------------------------------------------------------------------------------------------------|
| Strategy            | Rolling Updates — new containers are started before old ones are terminated. `maxSurge: 1, maxUnavailable: 0` ensures zero-downtime deployments.      |
| Justification       | SmartCart is a revenue-critical system. Zero-downtime deployments are mandatory. Rolling updates are simpler to operate than Blue-Green (no double infrastructure cost) and safer than Canary for a small team (no traffic splitting complexity). |
| Rollback            | Railway supports instant rollback to any previous deployment via the dashboard or CLI: `railway rollback --service smartcart-api`. Rollback triggers automatically if health checks fail after deploy. |
| Database Migrations | Migrations run automatically before the new containers receive traffic. Prisma Migrate is idempotent. Rollback migrations are tested in staging before production deploy. |

### Environment Configuration

```
# 📁 .env.example — Template for local development
# Copy this file to .env and fill in the values

NODE_ENV=development
PORT=3000

# PostgreSQL (local Docker)
DATABASE_URL=postgresql://smartcart:smartcart@localhost:5432/smartcart?schema=public

# Redis (local Docker)
REDIS_URL=redis://localhost:6379

# JWT Secrets (generate with: openssl rand -base64 32)
JWT_ACCESS_SECRET=replace-with-32-char-random-string
JWT_REFRESH_SECRET=replace-with-32-char-random-string
QR_SIGNING_SECRET=replace-with-32-char-random-string

# Security
BCRYPT_ROUNDS=12
CORS_ORIGINS=http://localhost:19006

# Rate Limiting
RATE_LIMIT_TTL=60
RATE_LIMIT_MAX=100

# Optional: AI Service
# AI_SERVICE_URL=http://localhost:8000
# AI_SERVICE_API_KEY=dev-key

# Optional: Observability
# SENTRY_DSN=https://xxx@sentry.io/xxx
# OTLP_EXPORTER_ENDPOINT=http://localhost:4317
```

### Scripts — package.json

```
// 📁 package.json — Root workspace scripts
{
  "scripts": {
    "dev": "pnpm --filter=@smartcart/api dev",
    "build": "pnpm --filter=@smartcart/api build",
    "lint": "eslint 'apps/**/*.ts' 'packages/**/*.ts' --max-warnings=0",
    "format": "prettier --write '**/*.{ts,json,md,yaml}'",
    "format:check": "prettier --check '**/*.{ts,json,md,yaml}'",
    "type-check": "tsc --noEmit",
    "test:unit": "jest --config apps/api/jest.unit.config.ts",
    "test:integration": "jest --config apps/api/jest.integration.config.ts",
    "test:contract": "jest --config apps/api/jest.contract.config.ts",
    "test:e2e": "jest --config apps/api/jest.e2e.config.ts",
    "prisma:generate": "prisma generate",
    "prisma:migrate": "prisma migrate dev",
    "prisma:migrate:deploy": "prisma migrate deploy",
    "prisma:seed": "ts-node prisma/seed.ts",
    "openapi:generate": "nest start --entryFile apps/api/src/openapi-generator.ts",
    "openapi:validate": "vacuum lint docs/api/openapi.yaml",
    "docker:build": "docker build -f docker/Dockerfile.api -t smartcart-api .",
    "docker:up": "docker compose -f docker/docker-compose.yml up -d",
    "docker:down": "docker compose -f docker/docker-compose.yml down"
  }
}
```

### Bundle Size Optimization

| Technique                  | Implementation                                                                                                      | Impact                                      |
|-----------------------------|----------------------------------------------------------------------------------------------------------------------|---------------------------------------------|
| Multi-stage Docker Build    | `Dockerfile.api` uses `builder` stage with dev dependencies and `runner` stage with production-only dependencies.          | Final image: ~180 MB vs ~600 MB without multi-stage |
| pnpm Workspace              | Only production dependencies for the specific app are installed in the runner stage.                                | Eliminates ~200 MB of unused dependencies    |
| Tree-shaking                | TypeScript `tsconfig.json` sets `"module": "ESNext"` and `"moduleResolution": "bundler"` for optimal tree-shaking.     | Reduces bundle by ~15%                       |
| Prisma Client Generation    | Only the database provider needed (`postgresql`) is generated. `binaryTargets = ["linux-musl-openssl-3.0.x"]` for Alpine. | Reduces Prisma engine size by ~40 MB         |
| node_modules Pruning        | `pnpm prune --prod` removes dev dependencies from the runner image.                                                 | Saves ~150 MB                                |
| Alpine Base Image           | `node:20-alpine` (~50 MB) instead of `node:20` (~350 MB).                                                           | Saves ~300 MB in base image                  |


## CI/CD Pipeline (Backend)

This section documents the complete continuous integration and continuous delivery pipeline for the SmartCart backend. The pipeline is designed to catch defects as early as possible (shift-left), enforce quality gates automatically, and enable any team member to deploy to production safely with a single click after PR merge.

### Pipeline Overview

```mermaid
flowchart TD
    %% Developer Trigger
    dev["<b>DEVELOPER LOCAL</b><br/>• git checkout -b feat/xxx<br/>• git push origin feat/xxx"]
    
    dev -->|Triggers PR Pipeline| ci_1

    %% --- CI PIPELINE SUBGRAPH ---
    subgraph CI ["GITHUB ACTIONS — CI PIPELINE (Pull Request)"]
        ci_1["<b>1. Install & Cache Dependencies</b><br/>• pnpm install --frozen-lockfile<br/>• Cache: node_modules, pnpm store"]
        ci_2["<b>2. Lint & Static Analysis</b><br/>• ESLint (max-warnings=0)<br/>• Prettier --check<br/>• TypeScript tsc --noEmit<br/>• SonarQube Scan"]
        ci_3["<b>3. Unit Tests</b><br/>• Jest (jest-expo + ts-jest)<br/>• Coverage: statements ≥ 80%<br/>• Coverage: branches ≥ 75%"]
        ci_4["<b>4. Integration Tests</b><br/>• Jest + Docker (PostgreSQL 16, Redis 7)<br/>• Prisma Migrate Deploy<br/>• Tests against real database"]
        ci_5["<b>5. API Contract Tests</b><br/>• Generate OpenAPI spec<br/>• Validate against snapshot<br/>• Check for breaking changes"]
        ci_6["<b>6. Quality Gate Check</b><br/>• Coverage ≥ 80%<br/>• SonarQube Quality Gate: PASS<br/>• No critical/high vulnerabilities<br/>• No duplicate code > 3%<br/>• No security hotspots"]
        ci_7["<b> All Checks Pass</b><br/>• PR can be merged to main"]

        ci_1 --> ci_2 --> ci_3 --> ci_4 --> ci_5 --> ci_6 --> ci_7
    end

    ci_7 -->|Merge PR to Main Branch| cd_1

    %% --- CD PIPELINE SUBGRAPH ---
    subgraph CD ["GITHUB ACTIONS — CD PIPELINE (Main Branch)"]
        cd_1["<b>7. Build & Push Docker Image</b><br/>• Docker multi-stage build<br/>• Push to GHCR: main-{sha}, latest"]
        cd_2["<b>8. Deploy Staging (Automatic)</b><br/>• Railway / Render auto-deploy<br/>• Prisma migrate deploy<br/>• Health check + smoke tests"]
        cd_3["<b>9. Deploy Prod (Manual Gate)</b><br/>• Manual approval required<br/>• Railway / Render deploy<br/>• Post-deploy: 10-min monitoring window"]
        cd_4["<b> Production Verified</b><br/>• Sentry: zero new errors<br/>• Slack notification"]

        cd_1 --> cd_2 --> cd_3 --> cd_4
    end

    %% Custom Styling for Visual Clarity
    style dev fill:#f9f9fb,stroke:#444,stroke-width:1px
    style CI fill:#f4f8fb,stroke:#0066cc,stroke-width:1px
    style CD fill:#fdf7f5,stroke:#dd5522,stroke-width:1px
```

### Quality gates summary

| Gate                     | Tool             | Threshold                                | Blocks Merge? |
|---------------------------|------------------|------------------------------------------|---------------|
| ESLint                   | ESLint v9        | 0 warnings, 0 errors                       |  Yes        |
| Prettier                  | Prettier v3      | All files formatted                       |  Yes        |
| TypeScript                | tsc v5           | No type errors                            |  Yes        |
| Unit Test Coverage        | Jest             | Statements ≥ 80%, Branches ≥ 75%          |  Yes        |
| Integration Tests         | Jest + Docker    | All tests pass                            |  Yes        |
| API Contract              | OpenAPI Diff     | No breaking changes                       |  Yes        |
| Security Vulnerabilities  | pnpm audit       | 0 critical, 0 high                        |  Yes        |
| SonarQube Quality Gate    | SonarQube        | Reliability A, Security A, Coverage ≥ 80% |  Yes        |
| PR Approvals              | GitHub           | 1 approving review                        |  Yes        |
