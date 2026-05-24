# SmartCart - Design Document

**Authors:** [Your Name(s)]
**Version:** [e.g., 1.0.0]
**Date:** [DD/MM/YYYY]
**Repository:** [Link to repository]

---

**Problem Statement:**
Shoppers in supermarkets often have an inefficient and disconnected experience. They struggle to find items, miss out on relevant promotions, and find loyalty programs cumbersome. The process of creating a shopping list, navigating the store to find the items, discovering promotions, and earning rewards is fragmented and lacks a central, intelligent tool to optimize the journey.

**Proposed Solution:**
SmartCart is a mobile application that acts as an intelligent shopping assistant. It integrates a points-based loyalty program with real-time, in-store navigation and a voice-activated assistant. Users can create shopping lists, and the app will generate the most efficient route through the store to collect them. While shopping, users scan sponsored products to add them to a pending list for rewards. At checkout, a single QR code validation credits the points earned. The voice assistant provides hands-free guidance, making the shopping trip faster, more efficient, and more rewarding.

---

# Phase 1: UX Prototyping & Refinement

## Prototype

- **Tool Used:** [e.g., Figma, Adobe XD, Maze]
- **Prototype Link:** [URL to interactive prototype]
- **Scope:** [Describe which flow or window was prototyped — e.g., "Main onboarding and product scanning flow"]

## Usability Testing

### Test Setup

- **Number of Participants:** [Min. 4 — external design students]
- **Platform Used:** [e.g., Maze, UserTesting.com, in-person session]
- **Defined Tasks:**
  | # | Task Description | Success Criteria |
  |---|-----------------|-----------------|
  | 1 | [e.g., "Complete the registration process"] | [e.g., User reaches home screen] |
  | 2 | [e.g., "Find and scan a product"] | [e.g., Product added to pending list] |
  | 3 | [e.g., "Generate a QR code at checkout"] | [e.g., QR code displayed on screen] |
  | 4 | [e.g., "Redeem points for a reward"] | [e.g., Digital coupon generated] |

### Test Evidence

- **Recordings/Screenshots:** `[Insert links or embed images]`
- **Heatmaps:** `[Insert Heatmap Images]`

### Metrics

| Participant | Task 1 Success | Task 1 Time | Task 2 Success | Task 2 Time | Task 3 Success | Task 3 Time | Task 4 Success | Task 4 Time |
|-------------|---------------|-------------|---------------|-------------|---------------|-------------|---------------|-------------|
| P1          |               |             |               |             |               |             |               |             |
| P2          |               |             |               |             |               |             |               |             |
| P3          |               |             |               |             |               |             |               |             |
| P4          |               |             |               |             |               |             |               |             |
| **Avg.**    |               |             |               |             |               |             |               |             |

### Key Findings & Applied Corrections

| # | Finding / Problem Detected | Usability Dimension Affected | Correction Applied | Design Decision Justification |
|---|---------------------------|-----------------------------|--------------------|-------------------------------|
| 1 | [e.g., "Users could not find the manual barcode entry button"] | [e.g., Learnability] | [e.g., "Moved button to a more prominent position below the camera view"] | [e.g., "Reduces cognitive load by placing secondary action near primary action"] |
| 2 |  |  |  |  |
| 3 |  |  |  |  |

---

# 1. Frontend Design

## 1.1. Technology Stack

| Concern | Choice | Version | Justification |
|---------|--------|---------|---------------|
| **Application Type** | [e.g., Mobile App / PWA] | — | [Why this type] |
| **Framework** | [e.g., React Native, Flutter, Vue.js] | [x.x] | [Why this framework] |
| **State Management** | [e.g., Redux, Zustand, Context API] | [x.x] | [Why this library] |
| **HTTP Client** | [e.g., Axios, Fetch API] | [x.x] | [Why] |
| **Web Server / Hosting** | [e.g., Vercel, AWS Amplify] | — | [Why] |
| **Linting** | [e.g., ESLint] | [x.x] | [Why] |
| **Formatting** | [e.g., Prettier] | [x.x] | [Why] |
| **Unit Testing** | [e.g., Jest] | [x.x] | [Why] |
| **Integration / UI Testing** | [e.g., React Testing Library, Playwright] | [x.x] | [Why] |
| **CI/CD** | [e.g., GitHub Actions, GitLab CI] | — | [Why] |

### Environments

| Environment | URL / Endpoint | Purpose |
|-------------|----------------|---------|
| Development | [e.g., localhost:3000] | Local development |
| Staging | [e.g., staging.smartcart.app] | QA and pre-release validation |
| Production | [e.g., app.smartcart.app] | Live users |

---

## 1.2. UX / UI Analysis

### Usability Attributes

| Attribute | Target |
|-----------|--------|
| **Learnability** | First-time user can complete the scan-validate-redeem loop without instructions. |
| **Efficiency** | Scanning a product and adding it to the pending list takes ≤ 3 interactions. |
| **Error Prevention** | The app requires user confirmation after a scan to ensure the correct product was detected. |
| **Visibility of Status** | User can see their current points, pending points, and checkout validation status in real-time. |
| **Confidence Feedback** | Clear success, warning, and error messages for scanning, validation, and point redemption. |
| **Consistency** | Uniform design tokens (color, spacing, typography) are used across all screens. |
| **Error Recovery** | If a product scan fails, the user can retry or enter the barcode manually without losing context. |
| **Accessibility** | WCAG 2.1 AA compliance: sufficient contrast, keyboard/screen reader navigation, ARIA labels. |

### Branding & Style Guidelines

#### Color Palette

| Token | Hex | Usage |
|-------|-----|-------|
| `--color-primary` | [#______] | Primary actions, CTAs |
| `--color-secondary` | [#______] | Secondary elements |
| `--color-accent` | [#______] | Highlights, badges |
| `--color-background` | [#______] | App background |
| `--color-surface` | [#______] | Cards, modals |
| `--color-error` | [#______] | Error states |
| `--color-success` | [#______] | Success states |
| `--color-text-primary` | [#______] | Main text |
| `--color-text-secondary` | [#______] | Subtitles, captions |

#### Typography

| Role | Font Family | Weight | Size | Usage |
|------|-------------|--------|------|-------|
| Display / Heading | [e.g., Poppins] | 700 | [e.g., 24px] | Screen titles |
| Body | [e.g., Inter] | 400 | [e.g., 16px] | General text |
| Caption | [e.g., Inter] | 400 | [e.g., 12px] | Labels, hints |
| Button | [e.g., Poppins] | 600 | [e.g., 14px] | CTA text |

#### Spacing & Layout

| Token | Value | Usage |
|-------|-------|-------|
| `--spacing-xs` | [e.g., 4px] | Tight spacing |
| `--spacing-sm` | [e.g., 8px] | Internal component padding |
| `--spacing-md` | [e.g., 16px] | Default padding |
| `--spacing-lg` | [e.g., 24px] | Section spacing |
| `--spacing-xl` | [e.g., 32px] | Screen-level padding |

- **Grid System:** [e.g., 4-column grid on mobile, 8-column on tablet]
- **Breakpoints:** [e.g., sm: 375px, md: 768px, lg: 1024px]
- **Iconography:** [e.g., Lucide Icons, Material Icons — link to set]
- **Logo Usage Rules:** [e.g., Minimum size, clear space, forbidden uses]

### Core Business Process

#### Onboarding & Home (Lobby)
1. The user opens the app and is presented with the main lobby.
2. The system identifies the user's location to show store-specific promotions.
3. The user can view their current points balance, pending points, and a list of sponsored products.
4. The user can view or manage their shopping list.

#### Product Scanning & Pending List
1. The user initiates the product scanning flow.
2. The system activates the device's camera for barcode scanning.
3. Alternatively, the user can choose to input the barcode number manually.
4. After the code is captured, the system retrieves the product's details and asks the user for confirmation.
5. Upon confirmation, the product and its associated points are added to a "pending" list for the current shopping session.
6. The user can continue scanning other products or proceed to view their pending list.

#### Voice-Guided Navigation
1. The user activates the voice assistant.
2. The user requests a route based on their shopping list.
3. The system calculates the most efficient path through the store and provides turn-by-turn voice instructions.
4. The assistant notifies the user when they are near an item on their list and can remind them to scan sponsored products.
5. The user can verbally add items to the list or mark them as found.

#### Checkout & Points Validation
1. Once shopping is complete, the user navigates to their pending items list.
2. The user generates a validation QR code.
3. The system displays a unique, time-sensitive QR code containing the session's pending items.
4. The cashier scans the user's QR code at the point of sale.
5. The system waits for confirmation from the store's POS system.
6. Upon receiving confirmation of purchased items, the system credits the corresponding points to the user's account.

#### Rewards Redemption
1. The user navigates to the rewards section.
2. The system displays the user's total available points and a catalog of redeemable rewards.
3. The user selects a reward and confirms they want to spend their points.
4. The system deducts the points and generates a digital coupon for the user to redeem.

### Wireframes

#### Screen 1 — Lobby
**Purpose:** Provide an overview of points, promotions, and primary actions.
**Image:** `[Insert Wireframe Image for Lobby]`

#### Screen 2 — Scanning Flow (Camera & Manual)
**Purpose:** Allow the user to capture a product's barcode via camera or manual input.
**Image:** `[Insert Wireframe Images for Scanning]`

#### Screen 3 — Pending Items & QR Generation
**Purpose:** Let the user review scanned items and generate the validation QR code for checkout.
**Image:** `[Insert Wireframe Image for Pending Items]`

#### Screen 4 — QR Validation
**Purpose:** Display the QR code for the cashier to scan and show the validation status.
**Image:** `[Insert Wireframe Image for QR Validation]`

#### Screen 5 — Rewards Catalog
**Purpose:** Allow the user to browse and redeem their points for rewards.
**Image:** `[Insert Wireframe Image for Rewards]`

### UX Test Results
- **Platform Used:** [e.g., Maze, UserTesting.com]
- **Results Summary:** [Table with participant data, success rates, task times — see Phase 1 above]
- **Key Findings:** [e.g., "Users struggled to find the manual entry button.", "Participants expressed satisfaction with the one-click QR generation."]
- **Heatmaps:** `[Insert Heatmap Images]`
- **Corrections Integrated into Final Design:** [Reference the corrections table from Phase 1 and describe how they were incorporated]

---

## 1.3. Component Design Strategy

- **Strategy Name:** [e.g., Atomic Design, Utility-First with Tailwind CSS, Feature-Sliced Design]
- **Component Hierarchy:**
  - **Atoms:** [e.g., Button, Input, Icon, Badge]
  - **Molecules:** [e.g., ProductCard, PointsBadge, ScanConfirmationModal]
  - **Organisms:** [e.g., NavigationBar, PendingItemsList, RewardsCatalog]
  - **Templates / Screens:** [e.g., LobbyScreen, ScanScreen, CheckoutScreen]
- **Reusability:** [Explain how shared components are structured, where they live, and naming conventions]
- **Internationalization (i18n):** [e.g., Library used (i18next), structure of translation files, locale detection strategy]
- **Responsiveness:** [e.g., Mobile-first approach, breakpoints used, how components adapt]
- **Accessibility:** [e.g., ARIA labels convention, focus management, color contrast policy]

---

## 1.4. Security

### Authentication

- **Provider / Method:** [e.g., JWT with custom backend, OAuth 2.0 with Google, Auth0]
- **Flow:**
  1. [Step 1 — e.g., User submits credentials]
  2. [Step 2 — e.g., Backend validates and returns access + refresh token]
  3. [Step 3 — e.g., Frontend stores tokens]
  4. [Step 4 — e.g., Access token attached to each request header]
  5. [Step 5 — e.g., Refresh token used when access token expires]

### Authorization (RBAC)

| Role | Description | Permissions |
|------|-------------|-------------|
| `user` | Registered shopper | [e.g., Scan products, view rewards, generate QR] |
| `admin` | Store administrator | [e.g., All user permissions + manage products, view analytics] |

### Session Management

- **Token Expiry:** [e.g., Access token: 15 min / Refresh token: 7 days]
- **Refresh Strategy:** [e.g., Silent refresh via interceptor before expiry]
- **Storage Decision:** [e.g., `sessionStorage` vs `localStorage` — which is used and why]
- **Logout Behavior:** [e.g., Tokens cleared on logout, server-side token invalidation]

### Secure Configuration

- **Environment Variables:** [e.g., Managed via `.env` files per environment, never committed to VCS]
- **Secret Management Platform:** [e.g., Vercel environment secrets, AWS Secrets Manager]
- **OWASP Standards Applied:**
  | Threat | Mitigation |
  |--------|-----------|
  | XSS (Cross-Site Scripting) | [e.g., Input sanitization, Content Security Policy headers] |
  | CSRF | [e.g., SameSite cookies, CSRF tokens] |
  | Sensitive Data Exposure | [e.g., No PII stored in localStorage, HTTPS enforced] |
  | Insecure Direct Object Reference | [e.g., Authorization checks on every resource request] |

---

## 1.5. Layered Architecture

- **Architectural Pattern:** [e.g., Clean Architecture, Feature-Sliced Design, Standard MVC/MVVM]
- **Layer Responsibilities:**

| Layer | Responsibility | Examples |
|-------|---------------|----------|
| Presentation | Render UI, handle user events | Screens, Components |
| Application / Use Cases | Orchestrate business logic | Custom hooks, state managers |
| Domain | Core business rules and entities | Models, validation logic |
| Infrastructure | External communication | API clients, storage adapters |

- **Layer Access Rules:** [e.g., "Presentation can only call Application layer. Application can call Domain and Infrastructure. Domain must not depend on Infrastructure."]
- **Diagram:**
  `[Insert Layered Architecture Diagram Here]`

---

## 1.6. Design Patterns

| Pattern | Application in SmartCart | Location in Codebase |
|---------|--------------------------|----------------------|
| **Observer** | [e.g., State updates via Redux/Zustand subscriptions] | [e.g., `/store/`] |
| **Facade** | [e.g., Single API module abstracts all HTTP calls from components] | [e.g., `/api/`] |
| **Container / Presentational** | [e.g., Logic containers pass data as props to dumb UI components] | [e.g., `/features/`] |
| **Factory** | [e.g., Used to create notification objects (success, error, warning)] | [e.g., `/lib/notifications`] |
| **Singleton** | [e.g., Global axios instance with interceptors] | [e.g., `/api/client.ts`] |
| **Strategy** | [e.g., Different barcode scanning strategies: camera vs manual input] | [e.g., `/features/scan/`] |

### Asynchronous Operations

- **Approach:** [e.g., async/await with Axios, RxJS Observables, React Query]
- **Loading States:** [e.g., Skeleton screens shown during data fetching]
- **Error Boundaries:** [e.g., React Error Boundary components per feature]
- **Retry Logic:** [e.g., Automatic retry on 5xx errors, max 3 attempts with exponential backoff]
- **WebSocket Usage:** [e.g., Used for real-time QR validation status updates — describe connection lifecycle]
- **Long-Running Processes:** [e.g., Route calculation shows a progress indicator; result is polled or pushed via WS]

### Error Handling & Observability

- **Global Error Handler:** [e.g., Axios interceptor catches all API errors and dispatches to error store]
- **User-Facing Error Messages:** [e.g., Friendly messages mapped from HTTP error codes]
- **Frontend Monitoring:** [e.g., Sentry for uncaught exceptions and performance traces]
- **Logging:** [e.g., Console logs stripped in production; errors sent to monitoring platform]

---

## 1.7. Performance

| Strategy | Implementation |
|----------|---------------|
| **Lazy Loading** | [e.g., Route-level code splitting with React.lazy + Suspense] |
| **Code Splitting** | [e.g., Webpack / Vite dynamic imports per feature] |
| **Bundle Optimization** | [e.g., Tree-shaking, dead code elimination, minification in production build] |
| **Image Optimization** | [e.g., WebP format, lazy-loaded images, responsive srcset] |
| **Memoization** | [e.g., React.memo on expensive list components, useMemo for computed values] |
| **Virtualization** | [e.g., Virtualized list for product catalog and rewards using react-window] |
| **Caching** | [e.g., React Query / SWR cache for API responses; service worker for offline support] |

---

## 1.8. Testing Strategy

| Level | Tool | Scope | Min. Coverage |
|-------|------|-------|---------------|
| **Unit** | [e.g., Jest] | Utility functions, state reducers, hooks | [e.g., 80%] |
| **Integration** | [e.g., React Testing Library] | Component interactions, form flows | [e.g., 70%] |
| **UI / E2E** | [e.g., Playwright, Cypress] | Critical user flows (scan, checkout, redeem) | [e.g., Key flows 100%] |
| **Accessibility** | [e.g., axe-core, Lighthouse] | WCAG 2.1 AA compliance | [e.g., 0 critical violations] |

---

## 1.9. CI/CD Pipeline (Frontend)

```
[Trigger: Push to PR / main branch]
        │
        ▼
┌─────────────────────────┐
│  1. Install & Cache Deps │
└────────────┬────────────┘
             │
             ▼
┌─────────────────────────┐
│  2. Lint (ESLint)        │
└────────────┬────────────┘
             │
             ▼
┌─────────────────────────┐
│  3. Format Check         │
│     (Prettier)           │
└────────────┬────────────┘
             │
             ▼
┌─────────────────────────┐
│  4. Unit & Integration   │
│     Tests (Jest / RTL)   │
└────────────┬────────────┘
             │
             ▼
┌─────────────────────────┐
│  5. Build                │
└────────────┬────────────┘
             │
             ▼
┌─────────────────────────┐
│  6. E2E Tests            │
│     (Playwright)         │
└────────────┬────────────┘
             │
             ▼
┌─────────────────────────┐
│  7. Deploy to Staging /  │
│     Production           │
└─────────────────────────┘
```

- **Tooling:** [e.g., GitHub Actions — link to workflow file]
- **Branch Strategy:** [e.g., GitHub Flow — feature branches → PR → main]
- **Quality Gates:** [e.g., PR cannot merge if lint, tests, or build fail]
- **Deployment Strategy:** [e.g., Automatic deploy to staging on merge to `develop`; manual promotion to `production`]

---

## 1.10. Project Scaffold

- **Root:** [e.g., `/src`]

```
/src
├── /api/               # API call definitions and Axios client
│   ├── client.ts       # Base Axios instance with interceptors
│   └── /endpoints/     # Per-feature API modules
├── /assets/            # Static assets (images, fonts, icons)
├── /components/        # Reusable UI components (Atomic Design)
│   ├── /atoms/         # Buttons, inputs, badges, icons
│   ├── /molecules/     # ProductCard, PointsBadge, etc.
│   └── /organisms/     # NavigationBar, PendingItemsList, etc.
├── /features/          # Feature-specific screens, logic, and local state
│   ├── /scan/
│   ├── /checkout/
│   ├── /rewards/
│   └── /navigation/
├── /hooks/             # Custom React hooks
├── /lib/               # Helper functions, utils, constants
├── /navigation/        # Routing / navigation configuration
├── /screens/           # Top-level screen components
├── /store/             # Global state management (Redux / Zustand)
│   ├── /slices/
│   └── index.ts
├── /styles/            # Global styles, design tokens, theme
└── /types/             # Shared TypeScript type definitions
```

---

# 2. Backend Design

## 2.1. Technology Stack

| Concern | Choice | Version | Justification |
|---------|--------|---------|---------------|
| **API Style** | [e.g., REST, GraphQL, gRPC] | — | [Why] |
| **Language** | [e.g., TypeScript / Node.js, Python, Java] | [x.x] | [Why] |
| **Framework** | [e.g., Express, NestJS, Django, .NET Core] | [x.x] | [Why] |
| **Database** | [e.g., PostgreSQL, MongoDB] | [x.x] | [Why] |
| **Hosting** | [e.g., AWS EC2, GCP Cloud Run, Azure App Service] | — | [Why] |
| **Async Processing** | [e.g., RabbitMQ, AWS SQS, BullMQ] | [x.x] | [Why] |
| **Caching** | [e.g., Redis] | [x.x] | [Why] |
| **File Storage** | [e.g., AWS S3, Azure Blob Storage] | — | [Why] |

---

## 2.2. Architecture

- **Pattern:** [e.g., Monolith, Microservices, Modular Monolith, Serverless — justify the choice]
- **Layered Design:**

| Layer | Responsibility |
|-------|---------------|
| Presentation (Controller) | Receive HTTP requests, validate input, return responses |
| Application (Use Cases / Services) | Orchestrate business logic, coordinate domain and infrastructure |
| Domain | Core entities, business rules, domain events |
| Infrastructure | Database access, external APIs, message queues, file storage |

- **Layer Rules:** [e.g., "Domain layer must not depend on Infrastructure. Application layer depends on Domain and Infrastructure interfaces only via Dependency Injection."]

### Architecture Diagrams

#### Level 1 — System Context Diagram
`[Insert System Context Diagram Here]`

#### Level 2 — Container Diagram
`[Insert Container Diagram Here]`

#### Level 3 — Component Diagram (per service/module)
`[Insert Component Diagram Here]`

---

## 2.3. Business Logic & Design Patterns

| Pattern | Description | Where Applied |
|---------|-------------|---------------|
| **Repository** | [e.g., Abstracts DB access; domain layer depends on interface, not ORM] | [e.g., `/repositories/`] |
| **Service Layer** | [e.g., Encapsulates use cases and orchestrates entities] | [e.g., `/services/`] |
| **Factory** | [e.g., Creates complex domain objects like sessions or QR codes] | [e.g., `/domain/factories/`] |
| **Strategy** | [e.g., Pluggable route-calculation algorithms (TSP variants)] | [e.g., `/domain/routing/`] |
| **Observer / Event** | [e.g., Domain events for points credited, triggering push notification] | [e.g., `/events/`] |
| **DTO (Data Transfer Object)** | [e.g., Separate request/response models from domain entities] | [e.g., `/dto/`] |

### Complex Logic

| Logic | Description |
|-------|-------------|
| **Route Calculation** | [e.g., TSP-based algorithm using store map waypoints — describe inputs, outputs, algorithm choice] |
| **QR Generation & Validation** | [e.g., Signed, time-sensitive token embedding session items — describe encoding, expiry, validation steps] |
| **Points Calculation** | [e.g., Rules for awarding points per product, bonuses, multipliers] |
| **Session Management** | [e.g., Shopping session lifecycle — creation, item accumulation, expiry, checkout finalization] |

---

## 2.4. API Design

- **Style:** [e.g., REST — document with OpenAPI/Swagger; or GraphQL — document with schema]
- **Versioning Strategy:** [e.g., URL versioning: `/api/v1/`]
- **Base URL:** [e.g., `https://api.smartcart.app/v1`]
- **OpenAPI / Swagger Link:** [URL to hosted docs or file path in repo]

### Key Endpoints

| Method | Path | Description | Auth Required |
|--------|------|-------------|---------------|
| POST | `/auth/register` | Register new user | No |
| POST | `/auth/login` | Authenticate and receive tokens | No |
| POST | `/auth/refresh` | Refresh access token | Refresh token |
| GET | `/users/me` | Get current user profile | Yes |
| GET | `/products/:barcode` | Get product details by barcode | Yes |
| POST | `/sessions` | Create new shopping session | Yes |
| POST | `/sessions/:id/items` | Add scanned item to session | Yes |
| POST | `/sessions/:id/qr` | Generate checkout QR code | Yes |
| POST | `/sessions/:id/validate` | Validate QR and credit points (called by POS) | POS API Key |
| GET | `/rewards` | List available rewards | Yes |
| POST | `/rewards/:id/redeem` | Redeem a reward | Yes |
| GET | `/stores/:id/map` | Get store map for navigation | Yes |
| POST | `/navigation/route` | Calculate optimal shopping route | Yes |

### Data Contracts (DTOs)

> Define request and response shapes for each endpoint. Example:

```json
// POST /sessions/:id/items — Request Body
{
  "barcode": "string",
  "confirmed": true
}

// POST /sessions/:id/items — Response
{
  "item": {
    "productId": "string",
    "name": "string",
    "brand": "string",
    "pointsValue": 0,
    "imageUrl": "string"
  },
  "session": {
    "totalPendingItems": 0,
    "totalPendingPoints": 0
  }
}
```

### Asynchronous Communication

| Mechanism | Use Case | Queue / Topic Name |
|-----------|----------|--------------------|
| [e.g., RabbitMQ / SQS] | [e.g., Push notification after points credited] | [e.g., `notifications.points-credited`] |
| [e.g., RabbitMQ / SQS] | [e.g., Route calculation job offloaded to worker] | [e.g., `routing.calculate`] |
| [e.g., WebSocket] | [e.g., Real-time QR validation status push to mobile client] | [e.g., WS room: `session:{id}`] |

---

## 2.5. Security

| Concern | Strategy |
|---------|---------|
| **Transport** | [e.g., HTTPS enforced, TLS 1.2 minimum, HSTS headers] |
| **Authentication** | [e.g., JWT validation on every protected route via middleware] |
| **Authorization** | [e.g., Role-based middleware; resource ownership checks] |
| **Database Encryption** | [e.g., Encryption at rest (provider-managed), TLS in transit] |
| **Secrets Management** | [e.g., AWS Secrets Manager / HashiCorp Vault — never in source code] |
| **Rate Limiting** | [e.g., Express-rate-limit: 100 req/min per IP on public routes] |
| **Input Validation** | [e.g., Zod / Joi schemas on all incoming requests] |
| **OWASP Compliance** | [e.g., Injection prevention via parameterized queries; security headers via Helmet.js] |
| **Audit Logging** | [e.g., All authentication events and points transactions are logged with user ID and timestamp] |

---

## 2.6. Observability

| Concern | Tool / Approach |
|---------|----------------|
| **Structured Logging** | [e.g., Winston / Pino — JSON format with request ID, user ID, severity] |
| **Monitoring** | [e.g., Prometheus metrics exposed at `/metrics`; Grafana dashboards] |
| **Distributed Tracing** | [e.g., OpenTelemetry + Jaeger] |
| **Alerting** | [e.g., Grafana Alerts; PagerDuty for P1 incidents] |
| **Health Checks** | [e.g., `GET /health` returns service status and DB connectivity] |
| **Error Tracking** | [e.g., Sentry for unhandled exceptions] |

---

## 2.7. Availability & Scalability

### Availability

| Metric | Target |
|--------|--------|
| **Annual Uptime SLA** | [e.g., 99.9%] |
| **RTO (Recovery Time Objective)** | [e.g., < 1 hour] |
| **RPO (Recovery Point Objective)** | [e.g., < 15 minutes] |

- **Mechanisms:** [e.g., Multi-AZ deployment, read replicas, load balancer health checks, auto-restart on crash]

### Scalability

- **Strategy:** [e.g., Horizontal scaling — multiple stateless service instances behind a load balancer]
- **Trigger Metrics:** [e.g., CPU > 75% for 5 min, memory > 80%, queue depth > 1000 messages]
- **Stateless Services:** [e.g., All session state stored in Redis or DB, not in-process memory]

---

## 2.8. Backend Key Workflows

### User QR Validation Flow (POS Integration)
1. The backend receives a request from the store's POS system to validate a QR code.
2. It decodes the QR data to identify the user and the list of pending products.
3. The backend cross-references this with the list of items actually purchased, sent from the POS.
4. For each matching product, it calculates the points to be awarded.
5. The total points are added to the user's account in the database.
6. A success message is sent back to the POS and a push notification is triggered to the user's device confirming the points have been credited.

### Route Calculation Flow (Voice Assistant)
1. The backend receives a request with the user's shopping list and current location (e.g., store entrance).
2. It loads the digital map for the specified supermarket, which contains the coordinates/locations of all product categories and aisles.
3. Using an algorithm (e.g., a solution to the Traveling Salesperson Problem), it calculates the most efficient route to visit all required locations.
4. It returns an ordered list of waypoints/instructions for the frontend to consume and relay via voice.

---

## 2.9. Infrastructure & DevOps

- **Source Control:** [e.g., Git — GitHub Flow / Trunk-Based Development]
- **CI/CD Tooling:** [e.g., GitHub Actions — link to pipeline file]
- **Infrastructure as Code (IaC):** [e.g., Terraform, AWS CDK, Bicep]
- **Deployment Strategy:** [e.g., Blue-Green, Canary, Rolling updates — justify choice]

### CI/CD Pipeline (Backend)

```
[Trigger: Push to PR / main branch]
        │
        ▼
┌────────────────────────────┐
│  1. Install & Cache Deps    │
└─────────────┬──────────────┘
              │
              ▼
┌────────────────────────────┐
│  2. Lint & Static Analysis  │
│     (ESLint / SonarQube)    │
└─────────────┬──────────────┘
              │
              ▼
┌────────────────────────────┐
│  3. Unit Tests              │
└─────────────┬──────────────┘
              │
              ▼
┌────────────────────────────┐
│  4. Integration Tests       │
│     (Test DB / containers)  │
└─────────────┬──────────────┘
              │
              ▼
┌────────────────────────────┐
│  5. API Contract Tests      │
└─────────────┬──────────────┘
              │
              ▼
┌────────────────────────────┐
│  6. Build & Containerize    │
│     (Docker image)          │
└─────────────┬──────────────┘
              │
              ▼
┌────────────────────────────┐
│  7. Quality Gate Check      │
│     (Coverage, Sonar)       │
└─────────────┬──────────────┘
              │
              ▼
┌────────────────────────────┐
│  8. Deploy                  │
└────────────────────────────┘
```

---

# 3. Database Design

## 3.1. Database Choice

| Property | Decision |
|----------|---------|
| **Type** | [e.g., Relational (SQL), Document (NoSQL), Graph] |
| **Engine** | [e.g., PostgreSQL 15, MongoDB 7.0, Firebase Firestore] |
| **Hosting** | [e.g., AWS RDS, GCP Cloud SQL, MongoDB Atlas] |
| **Justification** | [Why this DB over alternatives for SmartCart's specific needs] |

---

## 3.2. Schema Design

### DBML Definition

```dbml
// SmartCart — Database Schema
// Engine: [e.g., PostgreSQL]

Table users {
  id          uuid        [primary key, default: `gen_random_uuid()`]
  full_name   varchar(120)
  email       varchar(255) [unique, not null]
  password_hash varchar(255) [not null]
  phone       varchar(20)
  created_at  timestamp   [default: `now()`]
  updated_at  timestamp
}

Table points_accounts {
  id          uuid        [primary key, default: `gen_random_uuid()`]
  user_id     uuid        [ref: - users.id, not null]
  balance     integer     [default: 0]
  last_updated timestamp  [default: `now()`]
}

Table products {
  id          uuid        [primary key, default: `gen_random_uuid()`]
  name        varchar(255) [not null]
  brand       varchar(120)
  barcode     varchar(50) [unique, not null]
  points_value integer    [default: 0]
  image_url   varchar(500)
  is_sponsored boolean    [default: false]
}

Table stores {
  id          uuid        [primary key, default: `gen_random_uuid()`]
  name        varchar(255) [not null]
  address     varchar(500)
  map_data    jsonb
}

Table shopping_sessions {
  id          uuid        [primary key, default: `gen_random_uuid()`]
  user_id     uuid        [ref: > users.id, not null]
  store_id    uuid        [ref: > stores.id]
  status      varchar(20) [note: 'active | pending_checkout | completed | expired']
  qr_token    varchar(500)
  qr_expires_at timestamp
  created_at  timestamp   [default: `now()`]
  completed_at timestamp
}

Table session_items {
  id          uuid        [primary key, default: `gen_random_uuid()`]
  session_id  uuid        [ref: > shopping_sessions.id, not null]
  product_id  uuid        [ref: > products.id, not null]
  scanned_at  timestamp   [default: `now()`]
  confirmed   boolean     [default: false]
  points_awarded integer  [default: 0]
}

Table rewards {
  id          uuid        [primary key, default: `gen_random_uuid()`]
  name        varchar(255) [not null]
  description text
  points_cost integer     [not null]
  image_url   varchar(500)
  is_active   boolean     [default: true]
}

Table redemptions {
  id          uuid        [primary key, default: `gen_random_uuid()`]
  user_id     uuid        [ref: > users.id, not null]
  reward_id   uuid        [ref: > rewards.id, not null]
  coupon_code varchar(100) [unique]
  redeemed_at timestamp   [default: `now()`]
  used_at     timestamp
}

Table points_transactions {
  id          uuid        [primary key, default: `gen_random_uuid()`]
  user_id     uuid        [ref: > users.id, not null]
  session_id  uuid        [ref: > shopping_sessions.id]
  redemption_id uuid      [ref: > redemptions.id]
  delta       integer     [not null, note: 'positive = earned, negative = spent']
  reason      varchar(50) [note: 'purchase | redemption | adjustment | expiry']
  created_at  timestamp   [default: `now()`]
}
```

### Entity-Relationship Diagram (ERD)

`[Insert ERD Image Here]`

---

## 3.3. Indexes & Query Optimization

| Table | Index | Type | Justification |
|-------|-------|------|---------------|
| `users` | `email` | Unique B-tree | Frequent lookup at login |
| `products` | `barcode` | Unique B-tree | Barcode scan lookup is the hottest query |
| `shopping_sessions` | `user_id, status` | Composite B-tree | List active sessions per user |
| `session_items` | `session_id` | B-tree | Retrieve all items in a session |
| `points_transactions` | `user_id, created_at` | Composite B-tree | Points history per user |

---

## 3.4. Database Management

### Migrations

- **Tool:** [e.g., Flyway, TypeORM Migrations, Liquibase]
- **Naming Convention:** [e.g., `V{version}__{description}.sql` — e.g., `V001__create_users_table.sql`]
- **Versioning Strategy:** [e.g., Sequential integers; each PR includes exactly one migration file]
- **Rollback Strategy:** [e.g., Each migration has a corresponding `undo` script; tested in staging before production deploy]

### Seeding

- **Purpose:** [e.g., Populate initial product catalog, store maps, and test users in dev/staging]
- **Tooling:** [e.g., Custom seed scripts in `/db/seeds/`, runnable via `npm run db:seed`]
- **Environments:** [e.g., Seeding runs automatically on dev/staging; never on production]

### Backup & Recovery

| Property | Value |
|----------|-------|
| **Backup Frequency** | [e.g., Daily full backup + continuous WAL archiving] |
| **Backup Retention** | [e.g., 30 days] |
| **Storage Location** | [e.g., AWS S3 with cross-region replication] |
| **Recovery Test Frequency** | [e.g., Monthly restore drill] |
| **RTO Alignment** | [e.g., Restore from backup < 1 hour — aligned with availability target] |
| **RPO Alignment** | [e.g., Point-in-time recovery to within 15 minutes] |

### Auditing & Trazability

- **Audit Table:** [e.g., Append-only `points_transactions` table serves as financial audit trail]
- **Sensitive Changes:** [e.g., Any change to `points_accounts.balance` requires an entry in `points_transactions`]
- **Soft Deletes:** [e.g., Critical records (users, sessions) are soft-deleted with a `deleted_at` timestamp]
- **Change Tracking:** [e.g., `updated_at` timestamps on all mutable tables; DB triggers or ORM hooks]

### Data Security

| Concern | Measure |
|---------|---------|
| **Encryption at Rest** | [e.g., Provider-managed AES-256 encryption (AWS RDS)] |
| **Encryption in Transit** | [e.g., TLS 1.2+ enforced for all DB connections] |
| **PII Handling** | [e.g., Email is the only PII stored; no payment data stored in SmartCart DB] |
| **Password Storage** | [e.g., bcrypt with minimum cost factor 12] |
| **Access Control** | [e.g., Application uses a least-privilege DB user; no direct admin access from app] |

---

*End of SmartCart Design Document*
