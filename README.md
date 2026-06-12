# 2. Backend Design

## 2.1. Technology Stack

| Concern | Choice | Version | Justification |
|---|---|---|---|
| API Style | REST + OpenAPI | — | Frontend `apiClient` already REST; Swagger auto-gen in Nest |
| Language | TypeScript / Node.js | 5.5 / 20 LTS | **Reuse frontend `types.ts` 1:1** (`Product`, `QrTicket`, `ValidationResult`) → zero contract drift |
| Framework | NestJS | 10.4 | DI + modules map to template's layered design + Repository/Service/DTO patterns out-of-box |
| ORM/DB | Prisma 5.20 / PostgreSQL | 17 | Template schema is relational; Prisma migrations + type-safety |
| Async | BullMQ | 5.x | Analytics profiling + push notif queues (template 2.4) |
| Cache | Redis | 7.2 | Session state (stateless API), profile cache invalidation |
| File storage | Cloudflare R2 | — | Product images |
| AI segment | External inference (OpenAI / local sklearn microservice) | — | Consumer profiling classifier |
| Hosting | Railway / Render | — | Docker; cheap demo, scalable |
| Architecture | **Modular monolith + separate analytics worker** | — | Matches DesignAssistantPrompt's container diagram exactly |

## 2.2. Architecture — Implementation Guide

**Pattern**: Modular Monolith with Independent Worker Process

### Architectural Decision

| Aspect               | Decision                                                                 |
|-----------------------|--------------------------------------------------------------------------|
| Pattern               | Modular Monolith with Independent Worker Process                        |
| API Framework         | Single NestJS application (`apps/api`)                                   |
| Worker Process        | Standalone BullMQ consumer (`apps/analytics-worker`)                     |
| Module Separation     | Enforced at build time via ESLint import rules                           |
| Type Sharing          | Monorepo package `@smartcart/shared-types` at repo root, consumed by both `frontend/` and `backend/apps/api` |
| Transaction Strategy  | Prisma `$transaction` with interactive callback for ACID operations      |
| Async Processing      | BullMQ queues for long-running analytics pipeline                        |


#### Implementation directives by concern

| Concern                       | What to Build                                                                 | How to Build It                                                                                                                                                | Key Principle                                           | Source Location                                                                                                                                                                                                 |
|-------------------------------|-------------------------------------------------------------------------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------|---------------------------------------------------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| Module Boundary Enforcement   | ESLint `no-restricted-imports` rules blocking cross-module domain and infrastructure imports | Configure flat config in `eslint.config.mjs` with forbidden patterns. Run in CI as quality gate — builds fail on boundary violations.                           | Boundaries are compile-time, not runtime                | [`backend/apps/api/eslint.config.mjs`](backend/apps/api/eslint.config.mjs) — ESLint rules with restricted import patterns                                                                                                                          |
| Type-Safe Contract Sharing    | Shared TypeScript interfaces and Zod schemas in a workspace package           | Create `packages/shared-types/` at the **repo root** exporting DTO interfaces and Zod validation schemas. Both `backend/apps/api` and `frontend/` import from `@smartcart/shared-types`. NestJS uses `ZodValidationPipe` for runtime validation. | Change a DTO → both sides break at compile time. No contract drift. | [`packages/shared-types/src/`](packages/shared-types/src/) — Shared interfaces and Zod schemas by domain<br>[`backend/apps/api/src/common/pipes/zod-validation.pipe.ts`](backend/apps/api/src/common/pipes/zod-validation.pipe.ts) — Generic validation pipe                                |
| ACID Transactions             | Atomic updates across session status, points balance, and audit trail         | Use Prisma `$transaction` with interactive callback. Pass `tx` client to all repository methods within the boundary. Repositories accept optional `Prisma.TransactionClient`. Publish events only after commit resolves. | Everything inside the transaction succeeds or fails together. No I/O inside the callback. | [`backend/apps/api/src/modules/checkout/application/services/checkout.service.ts`](backend/apps/api/src/modules/checkout/application/services/checkout.service.ts) — `validateSession()` method<br>[`backend/apps/api/src/modules/checkout/application/interfaces/session-repository.interface.ts`](backend/apps/api/src/modules/checkout/application/interfaces/session-repository.interface.ts) — Repository interface with `tx` parameter |
| Long-Running Process Separation | Independent BullMQ worker for consumer profiling pipeline                   | Create `apps/analytics-worker/` with `@Processor` decorator. Main API publishes `CheckoutCompletedEvent` to queue after transaction commit. Worker handles aggregation queries, feature extraction, AI inference, and segment upsert. Deploy as separate Docker container. | Non-blocking side effects. Worker scales independently | [`backend/apps/analytics-worker/src/processors/profile-update.processor.ts`](backend/apps/analytics-worker/src/processors/profile-update.processor.ts) — Job processor<br>[`backend/apps/analytics-worker/src/services/profile-aggregator.service.ts`](backend/apps/analytics-worker/src/services/profile-aggregator.service.ts) — Aggregation logic<br>[`backend/apps/api/src/infrastructure/messaging/analytics-queue.producer.ts`](backend/apps/api/src/infrastructure/messaging/analytics-queue.producer.ts) — Queue producer |

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

Open [`backend/apps/api/src/modules/checkout/domain/entities/shopping-session.entity.ts`](backend/apps/api/src/modules/checkout/domain/entities/shopping-session.entity.ts) — it is already scaffolded and empty. Implement a TypeScript class with the following structure:

- Private mutable state with public readonly accessors
- Constructor that establishes invariants (e.g., `status` starts as `ACTIVE`, `items` starts empty)
- Methods that enforce state transitions (e.g., `addItem()` only when status is `ACTIVE`)
- Pure computation methods (e.g., `computeItemHash()`) with zero side effects
- Domain errors thrown for business rule violations (e.g., throw a typed `DomainError` subclass, not a generic `Error`)

This is the most important domain file in the project — the rules you encode here are the rules of the checkout flow.

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

- [`backend/apps/api/src/modules/checkout/application/services/checkout.service.ts`](backend/apps/api/src/modules/checkout/application/services/checkout.service.ts) — Application service with transaction boundary
- [`backend/apps/api/src/modules/checkout/application/interfaces/session-repository.interface.ts`](backend/apps/api/src/modules/checkout/application/interfaces/session-repository.interface.ts) — Repository interface example

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

- [`backend/apps/api/src/modules/checkout/infrastructure/repositories/prisma-session.repository.ts`](backend/apps/api/src/modules/checkout/infrastructure/repositories/prisma-session.repository.ts) — Repository implementation
- [`backend/apps/api/src/modules/checkout/infrastructure/mappers/session.mapper.ts`](backend/apps/api/src/modules/checkout/infrastructure/mappers/session.mapper.ts) — Entity-row mapping

##### Rule 4: Presentation Layer — Delegate, Don't Implement

**What**: Controllers receive HTTP requests, delegate to application services, and return HTTP responses.

**How to implement**:

- Use NestJS decorators (`@Controller`, `@Post`, `@Get`, `@Body`, `@Param`)
- Apply `ZodValidationPipe` with the corresponding Zod schema from `@smartcart/shared-types`
- Extract authenticated user from request via `@CurrentUser()` custom decorator
- Call application service methods — never access repositories or Prisma directly
- Transform service results to response DTOs before returning
- Keep controller methods thin — all logic in application services

**Source location**: [`backend/apps/api/src/modules/checkout/presentation/controllers/session.controller.ts`](backend/apps/api/src/modules/checkout/presentation/controllers/session.controller.ts) — Reference controller implementation.

#### Dependency Injection Configuration

**What**: NestJS modules bind interfaces to implementations. This is the single point where concrete classes are wired together.

**How to implement**:

- In each `*.module.ts file`, configure the `providers` array
- Use `{ provide: 'INTERFACE_TOKEN', useClass: ConcreteImplementation }` for interface bindings
- Use string tokens for interfaces (e.g., `'ISessionRepository'`) or `@Inject()` decorators
- Export providers that other modules need via the exports array
- To swap implementations (e.g., for testing or a different provider), change only this file

**Source location**: [`backend/apps/api/src/modules/checkout/checkout.module.ts`](backend/apps/api/src/modules/checkout/checkout.module.ts)— Module definition with DI bindings.

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
    CSR["👤 Customer Service Rep"]

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
    CSR -->|"HTTPS REST"| Gateway

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

    class Shopper,Cashier,Admin,CSR actor
    class RN,Scanner,QRRender,PushNotif mobile
    class Gateway gateway
    class AuthMod,CatalogMod,CheckoutMod,RewardsMod,AnalyticsMod,NotifMod,AppLayer,DomainLayer nestjs
    class BullConsumer,Aggregator,FeatureExt,SegmentSvc worker
    class PG,Redis,BullMQ,S3 datastore
    class AISvc,PushSvc external
```

The container diagram shows five runtime containers and four actors:

- **Shopper (Mobile)** — Scans products, generates QR codes, redeems rewards
- **Cashier (POS)** — Validates QR codes at the checkout terminal
- **Admin / B2B Partner** — Downloads analytics reports and segment data
- **Customer Service Rep** — Adjusts points balances and manages reward fulfillment via REST API
- **Mobile App (React Native/Expo)** — Consumer-facing native app with camera, GPS, and push notifications
- **API Gateway (Nginx/Cloud LB)** — Routes REST to NestJS API, WebSocket connections for real-time status
- **NestJS Modular Monolith** — Single Node.js process containing Auth, Catalog, Checkout, Rewards, and Analytics modules with strict layer separation
- **Analytics Worker** — Independent BullMQ consumer for long-running consumer profiling pipeline
- **Data Stores** — PostgreSQL (primary), Redis (cache/sessions), BullMQ (job queue), Cloudflare R2 (file storage)
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
| Purpose | After each validated checkout, update a rolling 90-day behavioral profile, extract features, classify the user into a consumer segment via AI, and make aggregated anonymized data available to B2B partners. |
| Trigger | `CheckoutCompletedEvent` published by `CheckoutService.validateSession()` after transaction commit |
| Queue   | `analytics-profile-update` (BullMQ) — event routed by `BullMqEventPublisher` |
| Worker  | `ProfileUpdateProcessor` in `apps/analytics-worker/` |
| Algorithm Steps | See detailed breakdown below |

#### Algorithm Breakdown

| Step | Location | Action |
|------|----------|--------|
| 1. Event Emission | [`backend/apps/api/src/modules/checkout/application/services/checkout.service.ts`](backend/apps/api/src/modules/checkout/application/services/checkout.service.ts) | After `$transaction` commits, publish `CheckoutCompletedEvent` with `userId`, `storeId`, `items[]`, `pointsAwarded`, `timestamp` |
| 2. Job Consumption | [`backend/apps/analytics-worker/src/processors/profile-update.processor.ts`](backend/apps/analytics-worker/src/processors/profile-update.processor.ts) | BullMQ delivers job; processor delegates to `ProfileAggregatorService` |
| 3. Rolling Window Aggregation | [`backend/apps/analytics-worker/src/services/profile-aggregator.service.ts`](backend/apps/analytics-worker/src/services/profile-aggregator.service.ts) | Query `points_transactions` for last 90 days where reason = 'PURCHASE'. Compute features: `category_frequency`, `avg_ticket`, `avg_purchase_hour`, `weekly_frequency`, `sponsored_ratio`, `organic_preference_score`. Require minimum 5 transactions for valid classification. |
| 4. AI Classification | [`backend/apps/analytics-worker/src/infrastructure/ai/ai-inference.client.ts`](backend/apps/analytics-worker/src/infrastructure/ai/ai-inference.client.ts) | Check Redis cache (`segment:{userId}`, TTL 24h). On miss, POST features to AI service. Cache result on success. |
| 5. Segment Persistence | [`backend/apps/analytics-worker/src/infrastructure/repositories/segment.repository.ts`](backend/apps/analytics-worker/src/infrastructure/repositories/segment.repository.ts) | UPSERT into `consumer_segments` table. Invalidate B2B aggregated cache keys: `analytics:store:{storeId}:segments`, `analytics:global:segment-distribution`. |
| 6. B2B Data Availability | [`backend/apps/api/src/modules/analytics/application/services/analytics.service.ts`](backend/apps/api/src/modules/analytics/application/services/analytics.service.ts) | B2B partners query `GET /analytics/segments?storeId=X`. Response includes segment distribution with counts and percentages. All data is anonymized and aggregated — no individual user data exposed. |

**Key Rules:**

- Guard: Minimum 5 transactions required for statistically meaningful classification  
- Cache: AI results cached for 24 hours to avoid redundant API calls  
- Data Privacy: B2B endpoints return only aggregated, anonymized data  
- Resilience: Worker retries via BullMQ if AI service is unavailable  

**What you need to implement:**

All files in the "Location" column are empty stubs. Open each one and implement the corresponding step:

- **Step 1** — In [`backend/apps/api/src/modules/checkout/application/services/checkout.service.ts`](backend/apps/api/src/modules/checkout/application/services/checkout.service.ts): after the Prisma `$transaction` resolves in `validateSession()`, call `this.eventPublisher.publish(new CheckoutCompletedEvent(...))` with the session's `userId`, `storeId`, `items`, `pointsAwarded`, and current timestamp.
- **Step 2** — In [`backend/apps/analytics-worker/src/processors/profile-update.processor.ts`](backend/apps/analytics-worker/src/processors/profile-update.processor.ts): decorate the class with `@Processor('analytics-profile-update')`. Implement `@Process() async handle(job: Job)`. Pull the `CheckoutCompletedEvent` from `job.data` and delegate to `ProfileAggregatorService`.
- **Step 3** — In [`backend/apps/analytics-worker/src/services/profile-aggregator.service.ts`](backend/apps/analytics-worker/src/services/profile-aggregator.service.ts): query `points_transactions` for the last 90 days for this user. Compute the six features listed above. Return them as a plain object. Guard: if fewer than 5 transactions exist, return `null` — the processor should skip classification.
- **Step 4** — In [`backend/apps/analytics-worker/src/infrastructure/ai/ai-inference.client.ts`](backend/apps/analytics-worker/src/infrastructure/ai/ai-inference.client.ts): check Redis for `segment:{userId}` (TTL 24h). On cache miss, `POST` the feature object to the AI inference endpoint. Store the response in Redis on success.
- **Step 5** — In [`backend/apps/analytics-worker/src/infrastructure/repositories/segment.repository.ts`](backend/apps/analytics-worker/src/infrastructure/repositories/segment.repository.ts): run a Prisma `upsert` on the `consumer_segments` table. Immediately delete the two Redis keys: `analytics:store:{storeId}:segments` and `analytics:global:segment-distribution`.
- **Step 6** — In [`backend/apps/api/src/modules/analytics/application/services/analytics.service.ts`](backend/apps/api/src/modules/analytics/application/services/analytics.service.ts): implement `getSegmentDistribution(storeId)`. Check Redis first. On miss, query the DB and group by `segment_name`. Merge any segment with fewer than 50 users into `"other"`. Cache the result for 1 hour before returning.

---

### 2. QR Generation and Validation

| Aspect | Implementation Directive |
|--------|---------------------------|
| Purpose | Generate a signed, time-sensitive JWT token embedding a deterministic hash of session items. At checkout, validate the token signature, expiration, and item hash against physical cart contents. |
| Generation | Called by `CheckoutService.generateQr()`. Domain validation: session must be ACTIVE with ≥ 1 item. Compute deterministic item hash (sort barcodes alphabetically, concatenate with `|`, SHA-256). Sign JWT with HS256, 5-minute expiry. |
| Validation | Called by `CheckoutService.validateSession()`. Verify JWT signature. Check expiration. Compute hash of POS-scanned items using same algorithm. Compare hashes — mismatch throws `QrItemMismatchError`. |
| Participants | `CheckoutService`, `JwtQrSigner` (infrastructure), `ShoppingSession.computeItemHash()` (domain), `ShoppingSession.validateItems()` (domain) |

**Deterministic Hash Algorithm:**

This algorithm is the anti-tamper mechanism for QR checkout. When the shopper generates a QR code, the system hashes their scanned cart items and embeds that hash in the JWT. At the POS, the cashier's scanned items are hashed using the same algorithm. If a single item was added, removed, or swapped between QR generation and the physical checkout, the hashes won't match and `QrItemMismatchError` is thrown — the sale cannot proceed.

You implement this as `computeItemHash()` inside [`backend/apps/api/src/modules/checkout/domain/entities/shopping-session.entity.ts`](backend/apps/api/src/modules/checkout/domain/entities/shopping-session.entity.ts). It is a pure method — no database access, no injected dependencies, just the session's `items` array in, a SHA-256 hex string out. The POS side calls the same algorithm on its scanned items and compares. Both sides must use the exact same sort order and separator or hashes will never match.

Steps:

1. Sort session items alphabetically by barcode  
2. Concatenate as `"barcode1|barcode2|barcode3"`  
3. Compute SHA-256 hash of the concatenated string  

**Key Rules:**

- QR tokens expire after 5 minutes (JWT `exp` claim + factory enforcement)  
- 10-second clock skew tolerance for validation  
- `QR_SIGNING_SECRET` must be at least 32 characters  
- Tampered tokens fail signature verification; modified items fail hash comparison  

**What you need to implement:**

- [`backend/apps/api/src/modules/checkout/infrastructure/crypto/jwt-qr.signer.ts`](backend/apps/api/src/modules/checkout/infrastructure/crypto/jwt-qr.signer.ts) — Implement `sign(payload)` using `jsonwebtoken`: `jwt.sign(payload, secret, { algorithm: 'HS256', expiresIn: '5m' })`. Implement `verify(token)`: call `jwt.verify(token, secret)` — catch `TokenExpiredError` and re-throw as a typed `QrTokenExpiredError`, catch `JsonWebTokenError` as `InvalidQrTokenError`.
- [`backend/apps/api/src/modules/checkout/domain/entities/shopping-session.entity.ts`](backend/apps/api/src/modules/checkout/domain/entities/shopping-session.entity.ts) — Add `computeItemHash()` following the three steps above using Node's built-in `crypto.createHash('sha256')`. Add `validateItems(scannedBarcodes: string[])`: compute the hash of the scanned barcodes and compare against the stored hash — throw `QrItemMismatchError` on mismatch.
- [`backend/apps/api/src/modules/checkout/domain/factories/qr-ticket.factory.ts`](backend/apps/api/src/modules/checkout/domain/factories/qr-ticket.factory.ts) — Implement `create(session, signer)`: call `session.requestCheckout()` to transition state, compute the item hash, call `signer.sign({ sessionId, itemHash, userId })`, and return a `QrTicket` value object wrapping the resulting token.  

---

### 3. Points Calculation

| Aspect | Implementation Directive |
|--------|---------------------------|
| Purpose | Award points based on product's `pointsConfig`. Three strategies at launch: fixed per unit, spend multiplier, volume tiers. Extensible for future schemes without modifying checkout flow. |
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

- Create new class in [`backend/apps/api/src/modules/checkout/domain/strategies/`](backend/apps/api/src/modules/checkout/domain/strategies/) implementing `IPointsCalculationStrategy`  
- Register in `PointsStrategyResolver` constructor: `this.register(new NewStrategy())`  
- No existing code changes required  

**What you need to implement:**

All four strategy files and both service files are empty stubs:

- [`backend/apps/api/src/modules/checkout/domain/strategies/points-calculation-strategy.interface.ts`](backend/apps/api/src/modules/checkout/domain/strategies/points-calculation-strategy.interface.ts) — Define the `IPointsCalculationStrategy` interface. It needs a `strategyType: string` property and a `calculate(item: SessionItem, config: PointsConfig): number` method.
- Each strategy file (e.g., [`backend/apps/api/src/modules/checkout/domain/strategies/fixed-points.strategy.ts`](backend/apps/api/src/modules/checkout/domain/strategies/fixed-points.strategy.ts)) — Implement the calculation from the Strategy Types table above. No dependencies — pure TypeScript math.
- [`backend/apps/api/src/modules/checkout/application/services/points-strategy-resolver.ts`](backend/apps/api/src/modules/checkout/application/services/points-strategy-resolver.ts) — Register all four strategies in the constructor via a `Map<string, IPointsCalculationStrategy>`. Implement `resolve(type: string)` — throw `UnknownStrategyError` if not found.
- [`backend/apps/api/src/modules/checkout/application/services/points.service.ts`](backend/apps/api/src/modules/checkout/application/services/points.service.ts) — Implement `calculatePoints(session: ShoppingSession): number`. Skip items where `pointsConfig.sponsored === true`. For each remaining item, call `resolver.resolve(config.type).calculate(item, config)`. Sum and return total.  

---

### 4. Session State Machine

| Aspect | Implementation Directive |
|--------|---------------------------|
| Purpose | Shopping sessions follow a finite state machine lifecycle. Transitions are guarded by business rules. Expired sessions are cleaned up automatically via cron. |
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

**What you need to implement:**

- [`backend/apps/api/src/modules/checkout/domain/state-machine/session-state-machine.ts`](backend/apps/api/src/modules/checkout/domain/state-machine/session-state-machine.ts) — Implement `transition(session: ShoppingSession, event: SessionEvent)`. Use the State Transition Rules table above as your spec: check the current status, apply the guard, and either mutate state or throw `InvalidTransitionError`. No external dependencies — pure TypeScript.
- [`backend/apps/api/src/modules/checkout/domain/entities/shopping-session.entity.ts`](backend/apps/api/src/modules/checkout/domain/entities/shopping-session.entity.ts) — Add the public transition methods (`requestCheckout`, `completeValidation`, `markValidationFailed`, `expire`) and the `addItem` method. Each calls through to the state machine internally and enforces the guards.
- [`backend/apps/api/src/modules/checkout/application/services/session-expiration.service.ts`](backend/apps/api/src/modules/checkout/application/services/session-expiration.service.ts) — Inject `ISessionRepository`. Decorate with `@Injectable()` and `@Cron('*/5 * * * *')`. In the cron handler, query for sessions with `status = ACTIVE` and `createdAt < (now - 2 hours)`. Call `session.expire()` on each and save via the repository.

---

#### Pattern Interaction — Checkout Validation Flow

| Step | Layer        | Pattern(s) Active | Action |
|------|--------------|-------------------|--------|
| 1    | Presentation | DTO               | `ZodValidationPipe` validates `ValidationRequestSchema` against request body |
| 2    | Application → Domain | Service Layer, Repository | `CheckoutService` calls `ISessionRepository.findById()` |
| 3    | Infrastructure → Domain | Repository, Factory | `PrismaSessionRepository` maps row to entity via `SessionFactory.reconstitute()` |
| 4    | Application → Infrastructure | Service Layer, Transaction | `CheckoutService` opens Prisma `$transaction`; calls `ISessionRepository.save()` with COMPLETED status, credits points via `IPointsRepository`, inserts immutable ledger record |
| 5    | Domain | State Machine | `ShoppingSession.completeValidation()` transitions status `PENDING_CHECKOUT → COMPLETED` |
| 6    | Application | Event Publisher | After `$transaction` commits, `IEventPublisher.publish(CheckoutCompletedEvent)` enqueues analytics job |
| 7    | Presentation | WebSocket Gateway | `SessionGateway` emits `sessionStatusChanged` to subscribed client |

---

## 2.4. API Design

**Style:** REST with OpenAPI 3.1 specification — aligns with the React Native Axios client, TanStack Query caching semantics, predictable HTTP status codes for error mapping, and straightforward debugging for the critical POS validation endpoint.

**Versioning Strategy:** URL prefix versioning (`/api/v1/`). Breaking changes increment the major version to `/api/v2/`. Non-breaking additions are added to the current version. Deprecated fields are marked with the `x-deprecated` OpenAPI extension and the `Sunset` HTTP header, giving clients 90 days to migrate.

**Base URL:** `https://api.smartcart.app/api/v1`

**OpenAPI / Swagger Link:** Spec located at [`backend/docs/api/openapi.yaml`](backend/docs/api/openapi.yaml); served interactively at `https://api.smartcart.app/api/docs` in dev/staging (NestJS Swagger), and as a static Redoc page in production.

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
**Source:** [`packages/shared-types/src/`](packages/shared-types/src/)

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
| Transport            | HTTPS enforced via Nginx reverse proxy; all HTTP requests 301-redirected to HTTPS. TLS 1.3 minimum (TLS 1.2 accepted for legacy Android API < 26). HSTS header set to `max-age=31536000; includeSubDomains; preload` via Helmet middleware. Let's Encrypt certificates auto-renewed via Certbot. Config: [`backend/infra/docker/nginx/default.conf`](backend/infra/docker/nginx/default.conf). |
| Authentication       | JWT `accessToken` (HS256, 15-min expiry) sent in `Authorization: Bearer` header. `refreshToken` (7-day expiry) stored in HTTP-only, Secure, SameSite=Strict cookie. Passwords hashed with `bcrypt` (cost factor 12). Account lockout after 5 failed attempts within 15 minutes (30-min lockout) via Redis. Token rotation on refresh; old tokens invalidated. JWT service: [`backend/apps/api/src/modules/auth/infrastructure/crypto/jwt.service.ts`](backend/apps/api/src/modules/auth/infrastructure/crypto/jwt.service.ts). Password service: [`backend/apps/api/src/modules/auth/infrastructure/crypto/password.service.ts`](backend/apps/api/src/modules/auth/infrastructure/crypto/password.service.ts). Auth service: [`backend/apps/api/src/modules/auth/application/services/auth.service.ts`](backend/apps/api/src/modules/auth/application/services/auth.service.ts). |
| Authorization        | Role-Based Access Control (RBAC) with five roles: `shopper`, `pos_operator`, `customer_service`, `b2b_partner`, `admin`. Endpoints decorated with `@Roles()` and enforced by `RolesGuard`. Resource ownership verified by `ResourceOwnershipGuard` (compares JWT `sub` with resource IDs). POS and B2B endpoints secured with separate API Key authentication (`X-API-Key` header), hashed with SHA-256 and stored in DB. Roles guard: [`backend/apps/api/src/common/guards/roles.guard.ts`](backend/apps/api/src/common/guards/roles.guard.ts). Resource ownership guard: [`backend/apps/api/src/common/guards/resource-ownership.guard.ts`](backend/apps/api/src/common/guards/resource-ownership.guard.ts). API key guard: [`backend/apps/api/src/common/guards/api-key.guard.ts`](backend/apps/api/src/common/guards/api-key.guard.ts). |
| Database Encryption  | Encryption at rest: AES-256 provider-managed (Railway/Render/GCP Cloud SQL). Encryption in transit: TLS 1.3 enforced for all connections; Prisma client configured with `sslmode=require`. Connection strings never hardcoded; sourced from `DATABASE_URL` environment variable. |
| Secrets Management   | All secrets stored in environment variables (Railway Shared Variables / Render Environment Groups in production). Never committed to Git (`.env` in `.gitignore`). JWT secrets rotated quarterly; database credentials rotated every 90 days. Application validates all required secrets at startup using a Zod schema and fails fast if any are missing or invalid. Validation: [`backend/apps/api/src/config/env.validation.ts`](backend/apps/api/src/config/env.validation.ts). |
| Rate Limiting        | Redis-based rate limiter middleware applied globally (`100 req/min` per authenticated user or IP, configurable via `RATE_LIMIT_MAX`). Stricter limits on auth endpoints (`10 req/min` for login/register) to prevent brute-force. `X-RateLimit-Limit` and `X-RateLimit-Remaining` headers included in responses. Middleware: [`backend/apps/api/src/common/middleware/rate-limiter.middleware.ts`](backend/apps/api/src/common/middleware/rate-limiter.middleware.ts). |
| Input Validation     | All inputs validated at the controller boundary using Zod schemas via a global `ZodValidationPipe`. Schemas enforce strict types (UUIDs, numeric-only barcodes, length caps) preventing SQL injection, XSS, path traversal, and ReDoS. Validation pipe: [`backend/apps/api/src/common/pipes/zod-validation.pipe.ts`](backend/apps/api/src/common/pipes/zod-validation.pipe.ts). Shared schemas: [`packages/shared-types/src/`](packages/shared-types/src/). |
| OWASP Compliance     | SQL Injection: 100% parameterized queries via Prisma ORM. XSS: Helmet CSP headers block inline scripts; all user input validated by Zod schemas. CSRF: SameSite=Strict cookies; API auth uses `Authorization` header. Path Traversal: UUID validation on all path parameters. ReDoS: Zod regex patterns tested for catastrophic backtracking; input lengths capped. Security headers configured via Helmet: [`backend/apps/api/src/main.ts`](backend/apps/api/src/main.ts). |
| Audit Logging        | All sensitive operations (`login`, `register`, `logout`, `refresh`, `redeemReward`, `validateSession`, `updateProfile`, `deleteAccount`) logged as structured JSON with `userId`, `action`, `IP address`, and `correlationId`. Points transactions are append-only — immutable ledger where balance is derived via `SUM(delta)`, making it tamper-evident. Audit interceptor: [`backend/apps/api/src/common/interceptors/audit.interceptor.ts`](backend/apps/api/src/common/interceptors/audit.interceptor.ts). Points ledger: [`backend/apps/api/src/modules/checkout/infrastructure/repositories/prisma-points.repository.ts`](backend/apps/api/src/modules/checkout/infrastructure/repositories/prisma-points.repository.ts). |

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
| **Structured Logging** | Pino via `nestjs-pino` — JSON format with correlation ID, user ID, role, and severity. PII fields (`email`, `password`, `phone`, `pushToken`) automatically redacted via Pino's `redact` configuration. Logs stream to stdout; shipped to Loki via Promtail in production. Config: [`backend/apps/api/src/config/pino.config.ts`](backend/apps/api/src/config/pino.config.ts). Application-level logging example: [`backend/apps/api/src/modules/checkout/application/services/checkout.service.ts`](backend/apps/api/src/modules/checkout/application/services/checkout.service.ts). |
| **Monitoring**        | Prometheus metrics exposed at `/metrics` via `@willsoto/nestjs-prometheus`. Default metrics (CPU, memory, event loop lag, GC pauses) plus custom business metrics: checkout completions, points awarded, QR generations, active sessions, BullMQ queue depth, and AI classification latency. Business metrics service: [`backend/apps/api/src/common/metrics/business-metrics.service.ts`](backend/apps/api/src/common/metrics/business-metrics.service.ts). Queue depth reporter: [`backend/apps/api/src/common/queues/queue-metrics.service.ts`](backend/apps/api/src/common/queues/queue-metrics.service.ts). |
| **Distributed Tracing** | OpenTelemetry SDK with automatic instrumentation for HTTP, Express, `ioredis`, BullMQ, and Prisma. Traces exported via OTLP gRPC to Jaeger. W3C Trace Context propagated across HTTP calls and injected into BullMQ job metadata. Manual spans for critical business operations (checkout validation). Tracing initialization: [`backend/apps/api/src/tracing.ts`](backend/apps/api/src/tracing.ts). |
| **Alerting**          | Prometheus alerting rules evaluated by Alertmanager. P1 (critical) alerts routed to PagerDuty with 5-minute on-call escalation. P2/P3 warnings sent to Slack `#smartcart-alerts`. Alerts defined for: service down, high error rate (>1% 5xx over 5 min), queue backpressure (>1000 waiting jobs), high checkout latency (P95 > 2s), database connection pool exhaustion (>80% utilized), and AI service degradation (P95 > 10s). Alert rules: [`backend/infra/prometheus/rules/smartcart-alerts.yml`](backend/infra/prometheus/rules/smartcart-alerts.yml). |
| **Health Checks**     | Three-tier health probes via `@nestjs/terminus`. `/api/v1/health/liveness` — lightweight process check for Kubernetes restart decisions. `/api/v1/health/readiness` — validates DB and Redis connectivity for traffic routing. `GET /health` — full dependency check for load balancers. Health controller: [`backend/apps/api/src/common/health/health.controller.ts`](backend/apps/api/src/common/health/health.controller.ts). |
| **Error Tracking**    | Sentry via `@ntegral/nestjs-sentry` and `@sentry/node`. Captures unhandled exceptions (500 errors), Prisma errors, and BullMQ job failures. Expected business errors (4xx: 404, 409, 422) are intentionally excluded. Every Sentry event enriched with `userId`, `correlationId`, `sessionId`, and release version. Sentry configuration: [`backend/apps/api/src/config/sentry.config.ts`](backend/apps/api/src/config/sentry.config.ts). Global exception filter with Sentry integration: [`backend/apps/api/src/common/filters/global-exception.filter.ts`](backend/apps/api/src/common/filters/global-exception.filter.ts). |

---

## 2.7. Availability & Scalability

### Availability

| Metric | Target |
|--------|--------|
| **Annual Uptime SLA** | 99.9% ("three nines"). Permits 8.76 hours of downtime per year. SmartCart is a POS-adjacent system; if QR validation fails, shoppers cannot complete purchases. |
| **RTO (Recovery Time Objective)** | < 15 minutes from P1 alert to full service restoration. Infrastructure is defined as code (Terraform for production). Database failover to a read replica is automated and completes in under 5 minutes. |
| **RPO (Recovery Point Objective)** | < 5 minutes. Achieved via PostgreSQL continuous WAL archiving to S3/R2 every 5 minutes. Points transactions are committed synchronously before the API responds, ensuring zero financial record loss. |

- **Mechanisms:**
  - **Load Balancer Health Checks:** Railway/Render's load balancer probes `GET /api/v1/health/readiness` on each container. Unhealthy containers are removed from rotation automatically.
  - **Auto-Restart on Crash:** Railway and Render both restart crashed containers automatically. Inside the container, the Node.js process starts with graceful shutdown enabled — see below.
  - **Database Replication:** Railway PostgreSQL includes automatic daily backups. For production resilience, configure continuous WAL archiving. On failure, restore from the latest backup.
  - **Redis Persistence:** Redis is configured with AOF (append-only file) persistence so BullMQ queued jobs survive a Redis restart without loss.
  - **Graceful Shutdown:** The application handles `SIGTERM` to drain in-flight requests cleanly before the container stops during a deploy.

**Graceful Shutdown Implementation Guide**

To implement the graceful shutdown handler, modify the application's entry point at [`backend/apps/api/src/main.ts`](backend/apps/api/src/main.ts).

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

- **Strategy:** Horizontal scaling. Multiple stateless NestJS API containers run behind a load balancer. The analytics worker (`analytics-worker`) is a separate Railway/Render service that scales independently. The primary bottleneck is the database, mitigated by Redis Cache-Aside for product lookups, and PgBouncer connection pooling.

- **Scaling Configuration:**
  - **API service:** Configure Railway/Render to scale horizontally. A CPU threshold of ~70% is a reasonable trigger. Because the API is fully stateless (all session data lives in Redis), adding more instances requires zero code changes.
  - **Analytics worker:** The worker is CPU-bound during AI classification. Scale its instance count based on BullMQ queue depth — if `analytics-profile-update` consistently has >100 waiting jobs, add worker instances.

- **Stateless Services:**
  - **What to implement:** All session state externalized to Redis, not stored in-process.
  - **How to implement:** In service logic (e.g., `CheckoutService` at [`backend/apps/api/src/modules/checkout/application/services/checkout.service.ts`](backend/apps/api/src/modules/checkout/application/services/checkout.service.ts)), load session data via `sessionRepo.findById()`. Repository (e.g., `PrismaSessionRepository` at [`backend/apps/api/src/modules/checkout/infrastructure/repositories/prisma-session.repository.ts`](backend/apps/api/src/modules/checkout/infrastructure/repositories/prisma-session.repository.ts)) implements **Read-Through/Write-Through cache**:
    1. **On `findById`:** Check Redis (`redis.get`). On miss, query PostgreSQL, hydrate Redis with TTL (e.g., 7200s), return data.
    2. **On `save`:** Update Redis immediately, then persist to PostgreSQL. Guarantees consistency across containers.

- **Connection Pooling & PgBouncer:**
  - **What to implement:** PgBouncer in **Transaction Pooling** mode between API containers and PostgreSQL.
  - **How to implement:**
    1. Set Prisma connection limit per API container via `PRISMA_CONNECTION_LIMIT=10`. Point `DATABASE_URL` to PgBouncer host (e.g., `postgresql://app_user:pass@pgbouncer:6432/smartcart?connection_limit=10`).
    2. In PgBouncer config ([`backend/infra/pgbouncer/pgbouncer.ini`](backend/infra/pgbouncer/pgbouncer.ini)), define `smartcart` DB pointing to primary PostgreSQL host. Set `pool_mode = transaction`. Set `default_pool_size = 25`. This multiplexes connections efficiently, preventing exhaustion.

---

## 2.8. Backend Key Workflows

This section traces the four main workflows through every architectural layer. For each step, the linked file is an empty stub — the "What to code" notes tell you what to write inside it.

---

### Workflow 1: User QR Validation Flow (POS Integration)

**Business Criticality:** Revenue path — must be **atomic**, **fast** (<500ms P95), and **cryptographically verifiable**.

**Prerequisites:** Shopper has created a session, scanned items, and requested a QR code. QR contains a signed JWT embedding a deterministic SHA-256 hash of session items.

**Steps:**

1. **POS Terminal Request:** `POST /api/v1/sessions/{id}/validate` with `qrToken` and `scannedItems[]`. Requires valid POS API Key in `X-API-Key`.
   - *What to code:* In [`backend/apps/api/src/modules/checkout/presentation/controllers/validation.controller.ts`](backend/apps/api/src/modules/checkout/presentation/controllers/validation.controller.ts), implement the `@Post(':id/validate')` handler. Annotate it with `@UseGuards(ApiKeyGuard)` and `@UsePipes(ZodValidationPipe)`. Call `checkoutService.validateSession(id, dto)` and return the result.

2. **Security Verification:**
   - API Key validated by `ApiKeyGuard` ([`backend/apps/api/src/common/guards/api-key.guard.ts`](backend/apps/api/src/common/guards/api-key.guard.ts)). *What to code:* Implement `canActivate()` — read the `X-API-Key` header, SHA-256 hash it, and call `apiKeyRepository.findByHash(hash)`. Return `false` (throws 401) if not found.
   - DTO validated via `ZodValidationPipe` against `ValidateSessionRequestSchema` ([`packages/shared-types/src/validation/session.schemas.ts`](packages/shared-types/src/validation/session.schemas.ts)). *What to code:* Define the schema here — require `qrToken: z.string()` and `scannedItems: z.array(z.string())`.
   - QR token verified by `JwtQrSigner.verify()` ([`backend/apps/api/src/modules/checkout/infrastructure/crypto/jwt-qr.signer.ts`](backend/apps/api/src/modules/checkout/infrastructure/crypto/jwt-qr.signer.ts)). *What to code:* See §2.3 QR section above — `jwt.verify()` wrapped with typed error handling.

3. **Session Retrieval & Domain Validation:**
   - Session loaded via `ISessionRepository.findById()` ([`backend/apps/api/src/modules/checkout/infrastructure/repositories/prisma-session.repository.ts`](backend/apps/api/src/modules/checkout/infrastructure/repositories/prisma-session.repository.ts)). *What to code:* Check Redis first (`redis.get('session:{id}')`). On miss, run `prisma.shoppingSession.findUnique()`, convert via `SessionMapper.toDomain()`, write to Redis with a 2-hour TTL.
   - Items validated by `ShoppingSession.validateItems()` ([`backend/apps/api/src/modules/checkout/domain/entities/shopping-session.entity.ts`](backend/apps/api/src/modules/checkout/domain/entities/shopping-session.entity.ts)). *What to code:* Sort the incoming barcode array the same way as `computeItemHash()`, hash it, and compare to the hash stored on the session. Throw `QrItemMismatchError` on mismatch.

4. **Points Calculation & Atomic Transaction:**
   - Points computed via `PointsService.calculatePoints()` ([`backend/apps/api/src/modules/checkout/application/services/points.service.ts`](backend/apps/api/src/modules/checkout/application/services/points.service.ts)). *What to code:* See §2.3 Points section — iterate items, resolve strategy, sum totals.
   - *What to code for the transaction:* In `CheckoutService.validateSession()`, call `prisma.$transaction(async (tx) => { await sessionRepo.save(session, tx); await pointsRepo.creditPoints(userId, total, tx); await pointsRepo.insertLedger(userId, total, 'PURCHASE', tx); })`. Only call `eventPublisher.publish()` after the transaction resolves.

5. **Post-Commit Side Effects:**
   - Event publishing via `BullMqEventPublisher` ([`backend/apps/api/src/modules/checkout/infrastructure/events/bullmq-event.publisher.ts`](backend/apps/api/src/modules/checkout/infrastructure/events/bullmq-event.publisher.ts)). *What to code:* Implement `publish(event)` — call `this.analyticsQueue.add('profile-update', event)`. This enqueues the job for the analytics worker.
   - Real-time notification via `SessionGateway` ([`backend/apps/api/src/modules/checkout/presentation/gateways/session.gateway.ts`](backend/apps/api/src/modules/checkout/presentation/gateways/session.gateway.ts)). *What to code:* Implement a `@WebSocketGateway` class. On the `sessionStatusChanged` event, call `this.server.to(sessionId).emit('sessionStatusChanged', { status, pointsAwarded })`.
   - Metrics via `BusinessMetricsService` ([`backend/apps/api/src/common/metrics/business-metrics.service.ts`](backend/apps/api/src/common/metrics/business-metrics.service.ts)). *What to code:* Call `this.checkoutCounter.inc()` and `this.pointsHistogram.observe(total)` after the transaction.

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

1. **Event Trigger:** `CheckoutService` publishes `CheckoutCompletedEvent` to `analytics-profile-update` queue. Config: [`backend/apps/api/src/common/queues/queue.config.ts`](backend/apps/api/src/common/queues/queue.config.ts). *What to code:* Export the queue name as a constant (`ANALYTICS_QUEUE = 'analytics-profile-update'`) and register the BullMQ module in `CheckoutModule` using this constant.

2. **Profile Aggregation (Worker):**
   - `ProfileUpdateProcessor` ([`backend/apps/analytics-worker/src/processors/profile-update.processor.ts`](backend/apps/analytics-worker/src/processors/profile-update.processor.ts)) consumes job. *What to code:* Decorate with `@Processor(ANALYTICS_QUEUE)`. Add `@Process() async handle(job: Job<CheckoutCompletedEvent>)`. Delegate to `profileAggregatorService.aggregate(job.data)`.
   - `ProfileAggregatorService` ([`backend/apps/analytics-worker/src/services/profile-aggregator.service.ts`](backend/apps/analytics-worker/src/services/profile-aggregator.service.ts)) computes 90-day rolling profile. *What to code:* See §2.3 Consumer Profiling steps 2–3. Return `null` if fewer than 5 transactions — the processor should skip AI classification in that case.

3. **AI Classification:**
   - `AiInferenceClient` ([`backend/apps/analytics-worker/src/infrastructure/ai/ai-inference.client.ts`](backend/apps/analytics-worker/src/infrastructure/ai/ai-inference.client.ts)) applies Redis cache and HTTP call. *What to code:* Check Redis for `segment:{userId}` first. On miss, `POST` the feature object to the AI endpoint. If the HTTP call fails, throw the error — BullMQ will automatically retry the job according to its retry config. Cache the result on success.

4. **Persist & Invalidate Cache:**
   - `SegmentRepository` ([`backend/apps/analytics-worker/src/infrastructure/repositories/segment.repository.ts`](backend/apps/analytics-worker/src/infrastructure/repositories/segment.repository.ts)) UPSERTs `consumer_segments`. *What to code:* Use `prisma.consumerSegment.upsert({ where: { userId }, create: {...}, update: {...} })`. After the upsert, call `redis.del('analytics:store:{storeId}:segments')` and `redis.del('analytics:global:segment-distribution')`.

**B2B Data Consumption:**

- Endpoint: `GET /analytics/segments?storeId=` in `AnalyticsController` ([`backend/apps/api/src/modules/analytics/presentation/controllers/analytics.controller.ts`](backend/apps/api/src/modules/analytics/presentation/controllers/analytics.controller.ts)). *What to code:* Add `@UseGuards(ApiKeyGuard)` — B2B partners authenticate with an API key, not a JWT.
- Service: `AnalyticsService.getSegmentDistribution()` ([`backend/apps/api/src/modules/analytics/application/services/analytics.service.ts`](backend/apps/api/src/modules/analytics/application/services/analytics.service.ts)). *What to code:* Check Redis for the cached result. On miss, query `consumer_segments` grouped by `segment_name`, merge any segment with fewer than 50 users into `"other"`, cache for 1 hour, return.

---

### Workflow 3: User Authentication Flow

**Business Criticality:** All other workflows depend on this — no JWT means no session, no checkout.

**Steps:**

1. **Register:** `POST /api/v1/auth/register` with `email`, `password`, `fullName`.
   - *What to code:* In [`backend/apps/api/src/modules/auth/application/services/auth.service.ts`](backend/apps/api/src/modules/auth/application/services/auth.service.ts), implement `register(dto)`. Check if email already exists — throw `ConflictException` if so. Hash the password with `bcrypt` (cost 12) using [`backend/apps/api/src/modules/auth/infrastructure/crypto/password.service.ts`](backend/apps/api/src/modules/auth/infrastructure/crypto/password.service.ts). Save the user. Issue tokens (see step 3).

2. **Login:** `POST /api/v1/auth/login` with `email` and `password`.
   - *What to code:* In `auth.service.ts`, implement `login(dto)`. Look up the user by email — throw `UnauthorizedException` if not found (do not reveal whether the email exists). Compare the provided password against the stored hash using `passwordService.verify()`. On match, issue tokens.

3. **Token Issuance:**
   - *What to code:* In [`backend/apps/api/src/modules/auth/infrastructure/crypto/jwt.service.ts`](backend/apps/api/src/modules/auth/infrastructure/crypto/jwt.service.ts), implement `signAccessToken(userId, role): string` — call `jwt.sign({ sub: userId, role }, accessSecret, { expiresIn: '15m' })`. Implement `signRefreshToken(userId): string` — sign with a separate `refreshSecret`, `expiresIn: '7d'`. Store the refresh token hash in Redis (`refresh:{userId}:{tokenId}`) so it can be revoked.
   - Return `accessToken` in the response body. Set `refreshToken` as an HTTP-only, `Secure`, `SameSite=Strict` cookie via `response.cookie()`.

4. **Token Refresh:** `POST /api/v1/auth/refresh` — reads the `refreshToken` cookie.
   - *What to code:* In `auth.service.ts`, implement `refresh(refreshToken)`. Verify the token with `jwtService.verifyRefreshToken()`. Look up the token hash in Redis — if missing, it was revoked, throw `UnauthorizedException`. Delete the old token from Redis, issue a new `accessToken` and a new `refreshToken` (rotation), set the new cookie.

5. **Logout:** `POST /api/v1/auth/logout`.
   - *What to code:* Delete the refresh token entry from Redis. Clear the cookie by calling `response.clearCookie('refreshToken')`.

---

### Workflow 4: Session Creation & Item Scanning

**Business Criticality:** The user-facing happy path — everything before QR generation.

**Steps:**

1. **Create Session:** `POST /api/v1/sessions` with `storeId`.
   - *What to code:* In [`backend/apps/api/src/modules/checkout/application/services/checkout.service.ts`](backend/apps/api/src/modules/checkout/application/services/checkout.service.ts), implement `createSession(userId, storeId)`. Check that the user has no existing `ACTIVE` session — throw `ConflictException` if so. Create a new `ShoppingSession` entity with status `ACTIVE`. Persist via `sessionRepo.save()`. Return the session ID.

2. **Scan & Look Up Product:** `GET /api/v1/products/:barcode`.
   - *What to code:* In the Catalog module's service, implement `getByBarcode(barcode)`. Check Redis (`product:{barcode}`, TTL 1h). On miss, query the database. Return the product including its `pointsConfig`. Cache the result. If not found, throw `NotFoundException`.

3. **Add Item to Session:** `POST /api/v1/sessions/:id/items` with `barcode` and `quantity`.
   - *What to code:* In `checkout.service.ts`, implement `addItem(sessionId, userId, dto)`. Load the session via `sessionRepo.findById()`. Verify `session.userId === userId` — throw `ForbiddenException` otherwise. Load the product by barcode. Call `session.addItem(product, dto.quantity)` — the entity enforces the `ACTIVE` status guard and throws if violated. Persist via `sessionRepo.save()`. Return the updated session.

4. **Remove Item:** `DELETE /api/v1/sessions/:id/items/:itemId`.
   - *What to code:* Load session, verify ownership, call `session.removeItem(itemId)`, persist. The domain entity should throw `ItemNotFoundError` if the item ID doesn't belong to the session.

5. **Generate QR:** `POST /api/v1/sessions/:id/qr`.
   - *What to code:* In `checkout.service.ts`, implement `generateQr(sessionId, userId)`. Load session, verify ownership, verify at least one item exists. Call `QrTicketFactory.create(session, qrSigner)` — this transitions the session to `PENDING_CHECKOUT` and signs the JWT. Persist the session with updated status. Return the QR token string.

---

## 2.9. Infrastructure & DevOps

- **Source Control:** Git with GitHub, following Trunk-Based Development. All developers commit to short-lived feature branches (max 24 hours) and merge to `main` via squash-merge pull requests. `main` is always deployable. Branch protection rules at [`.github/settings.yml`](.github/settings.yml) require 1 approving review, all status checks passing, and up-to-date branches.
- **CI/CD Tooling:** GitHub Actions. The PR validation pipeline is defined in [`.github/workflows/ci.yml`](.github/workflows/ci.yml). The deployment pipeline is defined in [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml). Docker images are pushed to GitHub Container Registry (GHCR).
- **Infrastructure as Code (IaC):** Terraform (v1.9+) with state stored in Terraform Cloud. Primary providers: `railway`, `cloudflare`, and `github`. The production environment is defined in [`backend/infra/terraform/environments/production/main.tf`](backend/infra/terraform/environments/production/main.tf), which manages the API service, analytics worker, PostgreSQL, and Redis instances as code.
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

    prod_env["Production Environment<br/>(Railway)"]

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

The pipeline lives in [`.github/workflows/ci.yml`](.github/workflows/ci.yml). It runs automatically on every push to a branch that has an open PR targeting `main`. Here is what each stage does and what you need to write.

#### Install & Cache Dependencies

Set up two `env` variables at the workflow level — `NODE_VERSION: '20'` and `PNPM_VERSION: '9'` — so all jobs use the same versions without repeating them. Add `concurrency: cancel-in-progress: true` at the workflow level so that a new push cancels the previous run on the same branch (saves CI minutes).

In the install step, use `pnpm install --frozen-lockfile` (not `npm ci`) — this ensures nobody accidentally installs a version not in the lockfile. Cache the global pnpm store using `actions/cache@v4` keyed on the hash of `pnpm-lock.yaml`. Without this cache, every run downloads ~300 MB of packages from scratch.

#### Lint & Static Analysis

Run three checks in sequence — if any fail, stop early:

1. `pnpm lint` — ESLint with `--max-warnings=0`. A warning is a failure; fix it before merging.
2. `pnpm format:check` — Prettier dry-run. If the formatter would change any file, this fails. Run `pnpm format` locally to fix.
3. `pnpm type-check` — `tsc --noEmit`. Compiles TypeScript without emitting files, just to catch type errors. This is faster than a full build.

Also add `sonarsource/sonarqube-scan-action` here. It needs `SONAR_TOKEN` and `SONAR_HOST_URL` as GitHub secrets — add them to your repository settings.

#### Unit Tests

Run `pnpm test:unit --coverage` using the Jest config in [`backend/apps/api/jest.unit.config.ts`](backend/apps/api/jest.unit.config.ts). After the run, upload the coverage report (`apps/api/coverage/lcov.info`) as a workflow artifact using `actions/upload-artifact@v4` — SonarQube will download it for code quality analysis.

Unit tests run against in-memory mocks — no real database or Redis. Keep them fast.

#### Integration Tests

Integration tests need a real database and Redis. GitHub Actions `services` block is the cleanest way to spin them up — add `postgres:17-alpine` and `redis:7.2-alpine` as services in the workflow YAML. Set the standard environment variables (`POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`) so Prisma can connect.

Before running the tests, run `pnpm prisma migrate deploy` to apply all migrations to the fresh database. Add a health check step using `pg_isready` and `redis-cli ping` to wait for the services to be ready before migrations start — without this, the migration sometimes fires before the database is up and fails.

Then run `pnpm test:integration` (config: [`backend/apps/api/jest.integration.config.ts`](backend/apps/api/jest.integration.config.ts)).

#### API Contract Tests

Generate the OpenAPI spec from your NestJS decorators with `pnpm openapi:generate`, then validate it with `pnpm openapi:validate` (the `vacuum` tool works well for this). Finally run `pnpm test:contract` against the Zod schemas in [`packages/shared-types/src/`](packages/shared-types/src/) to verify that the API responses match what the frontend expects.

If you add a breaking change to an endpoint (rename a field, change a type, remove a response property), this step catches it before it reaches the frontend team.

#### Quality Gate Check

After all tests pass, run two final checks:

- `pnpm audit --audit-level=critical` — fails if any installed dependency has a critical or high severity CVE. Fix by updating the package or adding a `pnpm audit --fix`.
- SonarQube Quality Gate evaluation — the `sonarqube-quality-gate-action` waits for SonarQube to finish its analysis and returns the gate result. If the gate fails (e.g., coverage dropped below 80% or a security hotspot appeared), the workflow fails and the merge is blocked.

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

Deployment is triggered automatically by a push to `main` and defined in [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml).

#### Build & Push Docker Image

- **Action:** `docker/build-push-action@v5` using multi-stage `Dockerfile` ([`backend/infra/docker/Dockerfile.api`](backend/infra/docker/Dockerfile.api)).  
- **Tagging:** `docker/metadata-action` generates tags (`main-{sha}`).  
- **Registry:** Push to `ghcr.io`.

#### Deploy to Staging (Automatic)

- **Action:** `railwayapp/railway-deploy@v1` with `RAILWAY_STAGING_TOKEN`.  
- **Migrations:** Run `prisma migrate deploy`.  
- **Smoke Tests:** Poll `https://staging.api.smartcart.app/api/v1/health`. Validate critical flows (register/login).

#### Deploy to Production (Manual Gate)

- **Approval:** Configure a GitHub Environment named `"production"` in your repository settings, with yourself as a required reviewer. The workflow will pause at this step and wait for your approval before proceeding.
- **Execution:** Use `railwayapp/railway-deploy@v1` with `RAILWAY_PRODUCTION_TOKEN`. Railway handles the rolling deploy — the old instance stays live until the new one passes its health check, so there is no downtime window.
- **Migrations:** Run `prisma migrate deploy` against the production PostgreSQL instance before Railway shifts traffic to the new container. Add this as a separate workflow step that runs before the deploy action.

**Deployment targets by environment:**

| Environment | Platform | Config |
|---|---|---|
| Local dev | Docker Compose | [`backend/infra/docker/docker-compose.yml`](backend/infra/docker/docker-compose.yml) |
| Staging | Railway (auto-deploy on merge to `main`) | `RAILWAY_STAGING_TOKEN` secret |
| Production | Railway (manual gate) | `RAILWAY_PRODUCTION_TOKEN` secret |

#### Post-Deploy Monitoring

- **Stabilization:** Wait 30s, curl `/api/v1/health`.  
- **Error Tracking:** Query Sentry API for unresolved issues (last 5 min).  
- **Notification:** Slack `#deployments` with image tag, commit SHA, author.

---

### Environment Configuration & Local Development

- Copy [`backend/.env.example`](backend/.env.example) → `.env`.  
- Run `pnpm docker:up` (Compose file: [`backend/infra/docker/docker-compose.yml`](backend/infra/docker/docker-compose.yml)).  
- Run `pnpm prisma:migrate`.  
- Run `pnpm dev`.

#### Docker Multi-Stage Build Implementation

- **Stage 1 (Builder):** Install deps, generate Prisma client, compile TS → JS.  
- **Stage 2 (Runner):** Base `node:20-alpine`. Non-root `nestjs` user. Copy production artifacts. `HEALTHCHECK` → `/api/v1/health/liveness`. Start with `node --require ./dist/tracing.js dist/main.js`.

Analytics worker uses [`backend/infra/docker/Dockerfile.worker`](backend/infra/docker/Dockerfile.worker) with same pattern.

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

#### Available Scripts (root `package.json` [`backend/package.json`](backend/package.json))

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

Shared packages and CI/CD config live at the repository root, outside `backend/`, so both `frontend/` and `backend/apps/api` can consume them as equal workspace members. `.github/` is read by GitHub Actions only from the repo root.

### Repository Root

```
/ (repo root)
├── .github/
│   ├── settings.yml
│   └── workflows/
│       ├── ci.yml
│       └── deploy.yml
├── packages/
│   └── shared-types/
│       ├── test/
│       └── src/
│           ├── dto/
│           │   ├── session.dto.ts
│           │   ├── auth.dto.ts
│           │   └── analytics.dto.ts
│           └── validation/
│               ├── session.schemas.ts
│               ├── auth.schemas.ts
│               └── analytics.schemas.ts
├── frontend/
│   └── (React Native / Expo app — existing)
└── backend/
    └── (see below)
```

### `backend/`

```
backend/
├── .env.example
├── package.json
├── pnpm-lock.yaml
├── apps/
│   ├── api/
│   │   ├── eslint.config.mjs
│   │   ├── jest.unit.config.ts
│   │   ├── jest.integration.config.ts
│   │   ├── docker/
│   │   ├── test/
│   │   └── src/
│   │       ├── main.ts
│   │       ├── tracing.ts
│   │       ├── config/
│   │       │   ├── env.validation.ts
│   │       │   ├── pino.config.ts
│   │       │   └── sentry.config.ts
│   │       ├── common/
│   │       │   ├── decorators/
│   │       │   │   └── current-user.decorator.ts
│   │       │   ├── filters/
│   │       │   │   └── global-exception.filter.ts
│   │       │   ├── guards/
│   │       │   │   ├── api-key.guard.ts
│   │       │   │   ├── resource-ownership.guard.ts
│   │       │   │   └── roles.guard.ts
│   │       │   ├── health/
│   │       │   │   └── health.controller.ts
│   │       │   ├── interceptors/
│   │       │   │   └── audit.interceptor.ts
│   │       │   ├── metrics/
│   │       │   │   └── business-metrics.service.ts
│   │       │   ├── middleware/
│   │       │   │   └── rate-limiter.middleware.ts
│   │       │   ├── pipes/
│   │       │   │   └── zod-validation.pipe.ts
│   │       │   └── queues/
│   │       │       ├── queue.config.ts
│   │       │       └── queue-metrics.service.ts
│   │       ├── infrastructure/
│   │       │   └── messaging/
│   │       │       └── analytics-queue.producer.ts
│   │       └── modules/
│   │           ├── analytics/
│   │           │   ├── application/
│   │           │   │   └── services/
│   │           │   │       └── analytics.service.ts
│   │           │   └── presentation/
│   │           │       └── controllers/
│   │           │           └── analytics.controller.ts
│   │           ├── auth/
│   │           │   ├── application/
│   │           │   │   └── services/
│   │           │   │       └── auth.service.ts
│   │           │   └── infrastructure/
│   │           │       └── crypto/
│   │           │           ├── jwt.service.ts
│   │           │           └── password.service.ts
│   │           ├── catalog/
│   │           │   ├── catalog.module.ts
│   │           │   └── application/
│   │           │       └── interfaces/
│   │           │           └── catalog-service.interface.ts
│   │           ├── checkout/
│   │           │   ├── checkout.module.ts
│   │           │   ├── application/
│   │           │   │   ├── interfaces/
│   │           │   │   │   ├── event-publisher.interface.ts
│   │           │   │   │   ├── qr-signer.interface.ts
│   │           │   │   │   └── session-repository.interface.ts
│   │           │   │   └── services/
│   │           │   │       ├── checkout.service.ts
│   │           │   │       ├── points-strategy-resolver.ts
│   │           │   │       ├── points.service.ts
│   │           │   │       └── session-expiration.service.ts
│   │           │   ├── domain/
│   │           │   │   ├── entities/
│   │           │   │   │   └── shopping-session.entity.ts
│   │           │   │   ├── factories/
│   │           │   │   │   └── qr-ticket.factory.ts
│   │           │   │   ├── state-machine/
│   │           │   │   │   └── session-state-machine.ts
│   │           │   │   └── strategies/
│   │           │   │       ├── points-calculation-strategy.interface.ts
│   │           │   │       ├── fixed-points.strategy.ts
│   │           │   │       ├── spend-multiplier.strategy.ts
│   │           │   │       ├── volume-tier.strategy.ts
│   │           │   │       └── weekend-bonus.strategy.ts
│   │           │   ├── infrastructure/
│   │           │   │   ├── crypto/
│   │           │   │   │   └── jwt-qr.signer.ts
│   │           │   │   ├── events/
│   │           │   │   │   └── bullmq-event.publisher.ts
│   │           │   │   ├── mappers/
│   │           │   │   │   └── session.mapper.ts
│   │           │   │   └── repositories/
│   │           │   │       ├── prisma-points.repository.ts
│   │           │   │       └── prisma-session.repository.ts
│   │           │   └── presentation/
│   │           │       ├── controllers/
│   │           │       │   ├── qr.controller.ts
│   │           │       │   ├── session.controller.ts
│   │           │       │   └── validation.controller.ts
│   │           │       └── gateways/
│   │           │           └── session.gateway.ts
│   │           ├── notifications/
│   │           └── rewards/
│   │
│   └── analytics-worker/
│       ├── test/
│       └── src/
│           ├── infrastructure/
│           │   ├── ai/
│           │   │   └── ai-inference.client.ts
│           │   └── repositories/
│           │       └── segment.repository.ts
│           ├── processors/
│           │   └── profile-update.processor.ts
│           └── services/
│               └── profile-aggregator.service.ts
│
├── infra/
│   ├── docker/
│   │   ├── Dockerfile.api
│   │   ├── Dockerfile.worker
│   │   ├── docker-compose.yml
│   │   └── nginx/
│   │       └── default.conf
│   ├── grafana/
│   │   └── dashboards/
│   │       └── smartcart-overview.json
│   ├── kubernetes/
│   │   ├── analytics-worker-hpa.yaml
│   │   └── api-hpa.yaml
│   ├── pgbouncer/
│   │   └── pgbouncer.ini
│   ├── prometheus/
│   │   └── rules/
│   │       └── smartcart-alerts.yml
│   └── terraform/
│       └── environments/
│           └── production/
│               └── main.tf
│
└── docs/
    └── api/
        └── openapi.yaml
```

---

