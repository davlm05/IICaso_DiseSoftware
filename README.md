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
