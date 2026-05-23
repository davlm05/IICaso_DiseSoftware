# DUA Streamliner

**Authors:** Jose Isaac Corrales Cascante - David Lopez Murillo

**Problem Statement:**
Preparing the Documento Único Aduanero (DUA) in Costa Rica is still a manual, time-consuming, and error-prone process for importers and exporters. The required information is distributed across heterogeneous source files such as Excel, Word, PDF, and scanned images, usually with different structures per supplier or company. Because of this variability, customs specialists must spend significant effort consolidating, interpreting, validating, and transcribing data into the official DUA format, increasing the risk of inconsistencies, omissions, delays, penalties, or rejection by customs authorities.

**Proposed Solution:**
DUA Streamliner proposes an automated workflow where the user provides only a folder path containing source documents (.xlsx, .docx, .pdf, and scanned images). The system performs multi-format reading, OCR, and AI-driven semantic extraction adapted to customs terminology, then maps detected data to the official DUA template defined by the Ministerio de Hacienda. It applies basic consistency checks (for example, totals, currency coherence, and date consistency), assigns confidence levels, and flags ambiguous fields for mandatory expert review. The output is a pre-filled DUA Word document with visual confidence indicators, designed to reduce repetitive manual work while keeping the customs specialist as the final decision-maker for validation and compliance.

# 1. Frontend Design

## 1.1 Technology stack:
### Frontend technology, security, third-party libraries, frameworks, and hosting; all with their respective versions.

- Aplication Type: Web App
- Web Framework: Angular v21.0.0
- Web Server: IIS 10 (Azure App Service Windows)
- TypeScript v5.9.3
- NodeJS v22
- ESLint v9.5.0
- Prettier v3.3.3
- SonarCloud v5.0.1
- Azure Application Insights SDK v3.3.1
- Unit Testing: Jest 30.2.0
- Data Validation Framework: Angular Reactive Forms Validators + Zod v3.23.8
- Integration Testing: Playwright v1.58.2
- Cloud Service: Azure Cloud Service
- Hosted By: Microsoft Azure - Azure App Service
- Code Repositories: Azure DevOps
- Code Automation Task Tool: npm scripts (NodeJS v22)
- CI/CD Pipelines Technology: Azure DevOps Pipelines (YAML)
- Environments: dev, staging, production
- Environment Deployments Tools: Azure DevOps Pipelines - Azure App Service Deploy task

## 1.2 UX UI analysis:

### Usability attributes

| Attribute | Target |
|-----------|--------|
| Learnability | First-time task completion without training — linear 4-screen workflow with one primary action per screen |
| Efficiency | DUA generation initiated in ≤ 3 interactions: folder path → template select → confirm |
| Error prevention | Inline validation before batch submission: path existence and template integrity verified before processing starts |
| Visibility of system status | Live per-stage and per-document progress visible during the entire batch |
| Confidence feedback | Green / Yellow / Red indicators on every DUA field communicate extraction certainty |
| Consistency | Uniform design tokens (color, spacing, typography) across all 4 feature modules via [`tailwind.config.js`](frontend/tailwind.config.js) |
| Error recovery | Per-document retry without restarting the full batch; error log shows cause per document |
| Accessibility | WCAG 2.1 AA — sufficient contrast, full keyboard navigation, ARIA labels on all interactive elements |

### Core business process
Describe step by step what happens on each screen in terms of actions (do not mention buttons, lists, or any visual components; only user actions and the result of each action).

#### Login
1. The user enters their account identifier and password.
2. The system validates that the data has the correct format and that required fields are not missing.
3. The user enters the one-time token to complete two-factor authentication.
4. If the credentials or the token are invalid, the system rejects the attempt and shows an invalid authentication message.
5. If the authentication is valid, the system creates the user session and applies permissions according to the assigned role.
6. The user is redirected to the generator configuration screen to begin the loading process.

#### Configure the generator
1. The user specifies the path to the folder that contains the source documents for the case.
2. The system verifies that the path exists and that it is accessible for reading.
3. The system identifies and lists compatible files found in the folder (Excel, Word, PDF, and scanned images).
4. If no valid files are detected, the system notifies the situation and asks the user to correct the path or add documents.
5. The user selects the official DUA template that will be used for the pre-filling process.
6. The system validates that the selected template corresponds to a supported format and that it is intact.
7. The user confirms the process configuration with the input folder and the destination template.
8. The system saves the configuration, prepares the document batch, and enables the start of the automated generation.

#### Monitoring progress
1. The user starts the automated generation and accesses the process monitoring screen.
2. The system records the start of the batch and changes its status to in progress.
3. The system continuously updates the progress by stage (reading, OCR, semantic extraction, mapping, and basic validations).
4. The user checks the overall batch progress and the individual status of each processed document.
5. If inconsistencies or low confidence are detected, the system marks observations for review without stopping the overall processing.
6. If an error occurs in a document, the system records the cause and maintains traceability to allow correction and retry.
7. When the process finishes, the system changes the status to completed or completed with observations and enables the final review stage.

#### Result retrieval / export
1. The user accesses the batch results once the process finishes.
2. The system presents the pre-filled DUA together with the fields marked by confidence level.
3. The user reviews and corrects the observed fields before approving the final document.
4. The system performs a final basic coherence validation on the consolidated data.
5. If the final validation is successful, the user exports the DUA in Word format (.docx).
6. The system records the export and preserves the process history for auditing and traceability.

#### Logout
1. The user decides to close the session after finishing the review or export.
2. The system invalidates the active session and removes temporary authentication tokens.
3. The system records the logout event in the audit log.
4. The user is redirected to the authentication flow for a new access.

### Wireframes
#### Screen 1 - Login
**Purpose:** Allow the user to securely authenticate with credentials and a one-time token to enable access to the system.

**Prompt:**
```text
Design a low-fidelity wireframe of a desktop web screen (1440x900) for DUA Streamliner. Monochromatic style, clean, without final branding. Show authentication flow with account identifier input, password, and OTP token, including validation of required fields, error state for invalid authentication, and successful state that redirects to Configure the generator. Wireframe only, not a realistic mockup.
```
**Image:**
![Wireframe 1](media/wireframe1.png)

#### Screen 2 - Configure the generator
**Purpose:** Allow the user to define the input folder and the official DUA template before starting the processing.

**Prompt:**
```text
Create a low-fidelity desktop wireframe (1440x900) for the Configure the generator screen of DUA Streamliner. Show flow to enter folder path, validate access, detect and list compatible files (Excel, Word, PDF, and images), handle case with no valid files, select official DUA template, validate template integrity, and confirm configuration to start automated generation. Grayscale style, clear UX, wireframe only.
```
**Image:**
![Wireframe 2](media/wireframe2.png)

#### Screen 3 - Progress monitoring
**Purpose:** Allow real-time tracking of the document batch, with visibility of progress, errors, and observations.

**Prompt:**
```text
Generate a low-fidelity desktop wireframe (1440x900) for the Progress monitoring screen of DUA Streamliner. Include overall batch status, progress by stages (reading, OCR, semantic extraction, mapping, and validations), status per document, error log with causes, and observations due to low confidence, showing final states completed or completed with observations. Focus on traceability and process control. Wireframe only.
```
**Image:**
![Wireframe 3](media/wireframe3.png)

#### Screen 4 - Getting the result / export
**Purpose:** Allow final review of the pre-filled DUA, validation of flagged fields, and document export.

**Prompt:**
```text
Design a low-fidelity desktop wireframe (1440x900) for the Getting the result / export screen of DUA Streamliner. Show the pre-filled DUA, fields marked by confidence level, review and correction flow for observations, final coherence validation, and action to export to Word (.docx), including export logging for auditing. Monochromatic style, clear, and task-oriented. Wireframe only.
```
**Image:**
![Wireframe 4](media/wireframe4.png)

#### Screen 5 - Logout
**Purpose:** Securely close the session, leave an audit trail, and redirect to the authentication flow.

**Prompt:**
```text
Create a low-fidelity desktop wireframe (1440x900) for the Logout flow of DUA Streamliner. Show logout confirmation, invalidation of active session, clearing of temporary tokens, audit log registry, and redirection to the authentication flow. Must communicate security and correct closure of the process. Wireframe only.
```
**Image:**
![Wireframe 5](media/wireframe5.png)


### UX test results:

**Platform Used:** Maze | User Research and Testing Platform

**Results:**
| Participant | Outcome | Duration | Responded at          |
|-------------|---------|----------|-----------------------|
| 510669335   | Success | 16.04s   | 12 Mar 2026, 11:53 am |
| 510665402   | Success | 60.32s   | 12 Mar 2026, 11:46 am |
| 510665363   | Success | 108.55s  | 12 Mar 2026, 11:43 am |

**Heatmaps:**

![MazeLogIn](media/mazeLogIn.jpg)
![MazeConfigurator](media/mazeConfigurator.jpg)

## 1.3 Component design strategy:

### Strategy Name: Tailwind CSS (Utility-First Component Design Strategy)

### Reutilisation by
- **Utility-first CSS classes** that enable building reusable UI elements through composition of small, single-purpose classes (e.g., `flex`, `grid`, `p-4`, `text-sm`).
- **Angular component abstraction**, where reusable UI components such as buttons, cards, form fields, and layouts encapsulate Tailwind class combinations.
- **Shared component libraries** organised within a shared Angular module or folder structure (e.g., `/shared/components`) to promote reuse across the application.
- **Design tokens defined in [`tailwind.config.js`](frontend/tailwind.config.js)**, allowing centralised configuration of colours, typography, spacing, and breakpoints that can be reused consistently across components.
- **`@apply` directive** in CSS to group commonly used Tailwind utility classes into reusable custom classes when needed.
- **Feature modules with Smart/Dumb component pattern** to structure reusable UI components: Smart components manage data and state, Dumb components handle only presentation via `@Input()`/`@Output()`, promoting testability and reuse across features.

### Internationalisation by
- **Angular built-in internationalisation (i18n)** framework to manage translations and localisation.
- **Translation files** (e.g., XLIFF or JSON) that store language resources for multiple locales.
- **Angular pipes** such as `date`, `currency`, and `number` to handle locale-specific formatting.
- **Language switching mechanisms** implemented through Angular services to dynamically change the application language.
- Tailwind CSS does not provide native internationalisation features but integrates seamlessly with Angular’s i18n system.

### Responsiveness by
- **Mobile-first responsive design approach**, where base styles target mobile devices and progressively adapt to larger screens.
- **Responsive utility modifiers** (`sm`, `md`, `lg`, `xl`, `2xl`) to apply styles at different viewport sizes.
- **Flexible layout utilities** such as `flex`, `grid`, `gap`, and `container` to create adaptable layouts.
- **Custom breakpoints defined in [`tailwind.config.js`](frontend/tailwind.config.js)** to align with project-specific responsive requirements.
- **Responsive spacing and typography utilities** to ensure visual consistency across multiple device types and screen sizes.

## 1.4 Security:

**Authentication**:
- Provider: Azure Entra ID (formerly Azure Active Directory)
- Authentication Type: Multi-Factor Authentication (MFA)
- MFA Method: Mobile Authenticator Application only
- Single Sign-On: Enabled through Azure Entra ID

**Flow integration with frontend:**
- During login, the user is redirected to Azure Entra ID.
- Azure validates credentials and enforces MFA via mobile authenticator.
- Upon successful authentication, a secure token (JWT) is issued.
- The frontend consumes this token and establishes the user session.

**Authorisation (Role-Based Access Control - RBAC)**
Authorisation is managed through roles assigned via Azure Entra ID and interpreted within the application.

**Roles:**
- Manager
- Customs Agent

**Permissions by Role:**

**Manager**
- MANAGE_USERS → Manage user CRUD operations
- VIEW_REPORTS → Access operational and performance reports
- EDIT_TEMPLATES → Modify available DUA templates

**Customs Agent**
- LOAD_FILES → Upload and configure source document folders
- GENERATE_DUA → Trigger AI-based DUA generation process
- DOWNLOAD_DUA → Download generated DUA documents

**Session Management**

- Session is based on Azure-issued JWT tokens.
- Tokens are securely stored in memory or browser storage (depending on implementation strategy).
- Automatic session expiration is enforced based on token lifetime
- Logout invalidates local session and triggers Azure logout.

**Secure Configuration & Secrets Management**

**Service Used:** Azure Key Vault

**Purpose:**
- Store environment variables
- Store API keys
- Store sensitive configuration data

Secrets are never hardcoded in the application. The backend retrieves them securely from Azure Key Vault at runtime.

**Backend Identity Server**

**Server Name**: 'customsidentityserver'

This server acts as the secure bridge between Azure Entra ID and the application services, handling:

- Token validation
- Identity propagation
- Secure communication with backend services

**Additional Security Measures**

- HTTPS enforced across all environments
- Secure headers configured via Azure App Service
- Input validation using Angular Reactive Forms + Zod
- Audit logging for:
  - Login attempts
  - Logout events
  - DUA generation and export actions

### Classes and project locations

| Class | Path | Responsibility |
|-------|------|----------------|
| `AuthGuard` | [`src/app/core/auth/auth.guard.ts`](frontend/src/app/core/auth/auth.guard.ts) | Validates active JWT; redirects to login if expired |
| `RoleGuard` | [`src/app/core/auth/role.guard.ts`](frontend/src/app/core/auth/role.guard.ts) | Validates user role permission per route |
| `AuthService` | [`src/app/core/auth/auth.service.ts`](frontend/src/app/core/auth/auth.service.ts) | MSAL flow, token retrieval, session lifecycle |
| `AuthState` | [`src/app/core/state/auth.state.ts`](frontend/src/app/core/state/auth.state.ts) | Stores token, role, and expiration via Angular Signals |
| `AuthFacade` | [`src/app/application/facades/auth.facade.ts`](frontend/src/app/application/facades/auth.facade.ts) | Exposes `login()`, `logout()`, `getSession()` to components |
| `JwtInterceptor` | [`src/app/core/interceptors/jwt.interceptor.ts`](frontend/src/app/core/interceptors/jwt.interceptor.ts) | Attaches Bearer token to every outgoing HTTP request |
| `ErrorInterceptor` | [`src/app/core/interceptors/error.interceptor.ts`](frontend/src/app/core/interceptors/error.interceptor.ts) | 401 → session invalidation; 403 → access denied; 5xx → alert |
| `AuthApiClient` | [`src/app/infrastructure/api-clients/auth-api.client.ts`](frontend/src/app/infrastructure/api-clients/auth-api.client.ts) | Azure Entra ID token refresh endpoint |

## 1.5 Layered design:
### Design and explanation of the different layers of the frontend application.

The frontend is a **Single Page Application (SPA)** built with Angular 21, deployed on Azure App Service.

**Why SPA over SSR or SSG:**
- The application is entirely private, accessible only after authentication through Azure Entra ID with MFA. There is no public content that requires search engine indexing or SEO optimisation, which eliminates the primary advantage of Server-Side Rendering.
- The core user workflows (real-time batch monitoring, DUA field editing with confidence indicators, inline corrections) demand continuous client-side interactivity. SPA handles this natively without requiring server round-trips for each UI update.
- The application maintains complex client-side state (user session, batch progress by stage, DUA field values, confidence levels, user corrections). SPA manages this state naturally in memory, avoiding the hydration complexity that SSR introduces.
- All users must complete the authentication flow before accessing any screen, so there is no benefit from SSR's faster first contentful paint for anonymous visitors.
- SSR would add infrastructure complexity (a Node.js server process, hydration handling, workarounds for browser-only APIs like `localStorage`) without delivering measurable benefits for this use case.

If there is no authenticated session, the **Authentication Layer** is invoked. This layer redirects the user to Azure Entra ID, handles the MFA flow via mobile authenticator, receives the JWT token upon success, and establishes the session. If authentication fails, the user remains on the login screen with an error notification. The Authentication Layer reads client IDs and tenant configuration from the **Settings Layer**.

Once authenticated, the user accesses the visual interface rendered by the **Components Layer**. Components are organised by **feature modules with a Smart/Dumb component pattern**. Each feature module (`login`, `configure-generator`, `progress-monitoring`, `result-export`) encapsulates its own components, routes, and dependencies. Within each feature, **Smart components** (also called containers) manage data flow, call facades, and hold state subscriptions, while **Dumb components** (also called presentational) receive data exclusively via `@Input()` and emit user actions via `@Output()`, containing no logic beyond rendering. Shared presentational components (buttons, confidence indicators, form fields, progress bars) styled with Tailwind CSS reside in a common shared module and are reused across features.

Within components, a **Facades Layer** exists to connect visual component actions with the **Services Layer**. Facades expose simplified methods that components call (e.g., `startGeneration()`, `exportDua()`), hiding the orchestration of multiple services behind a single entry point. Components never call services directly.

The **Services Layer** contains the application's business operations: batch configuration, DUA generation orchestration, progress monitoring, coherence validation (totals, currency, dates), confidence level evaluation, and document export preparation. To perform their tasks, services may require access to the **Utils**, **ApiClients**, and **Settings** layers.

The **ApiClients Layer** contains all classes that communicate with external APIs: the backend processing API for DUA generation, the file validation API, and the Azure Entra ID token refresh endpoint. ApiClients reads API base URLs and keys from the **Settings Layer**. The Settings Layer accesses environment variables configured in Azure Key Vault during application initialization.

All ApiClient calls and returns use classes defined in the **Models Layer**, which represent DUA domain entities (`DuaDocument`, `DuaField`, `BatchJob`, `SourceFile`, `UserSession`) with their associated enumerations (`ConfidenceLevel`, `BatchStatus`, `ProcessingStage`, `FileType`, `UserRole`). All data entering and leaving ApiClients is validated by the **DataValidation Layer**, which uses Angular Reactive Forms Validators for user input and Zod schemas for API response validation, ensuring type safety at system boundaries.

All layers can access the **Models**, **Utils**, and **State Management** layers. The State Management Layer (implemented with Angular Signals) maintains the global application state: current user session, active batch status, stage-by-stage progress, DUA field values with confidence levels, and user corrections. Any layer can read state, but only Services and Facades may write to it.

The **NotificationService Layer** enables real-time communication between layers through an event-driven mechanism. Services subscribe to events such as `batchStageCompleted`, `lowConfidenceDetected`, `documentProcessingFailed`, and `exportReady`. The Progress Monitoring screen subscribes to batch progress events to update the UI in real time. Asynchronous API calls that involve long-running backend operations (DUA generation, OCR processing) are handled via polling with server-sent progress updates consumed through the NotificationService Layer.

The **Logs Layer** provides classes to register system events: login attempts, logout events, DUA generation triggers, export actions, and validation failures. Log entries are structured with timestamp, user ID, action type, and result status, then sent to Azure Application Insights via ApiClients for auditing and traceability as defined in section 1.4.

The **ExceptionHandling Layer** is a shared cross-cutting layer accessible by all other layers. It captures unhandled errors, HTTP failures (via Angular interceptors: `401` triggers session invalidation, `403` emits access denied, `5xx` triggers user alert), and domain validation errors. All caught exceptions are routed to the Logs Layer for registration and, when user-facing, to the NotificationService Layer to display error messages.

The **Interceptors Layer** is a shared cross-cutting layer that processes all outgoing HTTP requests and incoming responses. `JwtInterceptor` attaches the Azure-issued Bearer token to every API call. `ErrorInterceptor` catches HTTP error responses and delegates them to the ExceptionHandling Layer. Interceptors operate transparently to all other layers.

### Layer Access Rules

| Layer | Can access |
|-------|-----------|
| Components | Facades |
| Facades | Services, State Management |
| Services | ApiClients, Utils, Settings, Models, State Management, NotificationService |
| ApiClients | Settings, Models, DataValidation, Logs |
| DataValidation | Models |
| NotificationService | Models |
| Logs | ApiClients |
| ExceptionHandling | Logs, NotificationService |
| Interceptors | ExceptionHandling, Settings |
| Models, Utils, State Management | *(accessible by all layers)* |

### Layered Architecture Diagram

```
        +------------------------+
        |     User Browser       |
        +-----------+------------+
                    |
                    v
        +------------------------+
        |   Azure App Service    |
        |   Angular 21 SPA       |
        +-----------+------------+
                    |
          Authentication Layer
          (Azure Entra ID + MFA)
                    |
    +---------------+----------------+
    |        Components Layer        |
    |  Feature Modules               |
    |  Smart (Container) Components  |
    |  Dumb (Presentational) Comp.   |
    +---------------+----------------+
                    |
              Facades Layer
                    |
              Services Layer
                    |
    +---------------+----------------+
    |               |                |
  Utils        ApiClients        Settings
                    |                |
                    |         Azure Key Vault
                    |                |
                    +----+-----------+
                         |
                   External APIs
                  (Backend, Azure AD)

  +-------------------------------------------------+
  |          Cross-Cutting Layers                    |
  |                                                 |
  |  Models ---- DataValidation (Zod + Validators)  |
  |                                                 |
  |  State Management (Angular Signals)             |
  |                                                 |
  |  NotificationService (Event-Driven)             |
  |                                                 |
  |  Interceptors (JWT + Error Handling)            |
  |                                                 |
  |  ExceptionHandling ---- Logs (App Insights)     |
  +-------------------------------------------------+
```

## 1.6  Design patterns:
### Class design and their respective locations in the project structure where object-oriented design patterns are applied, such as: security, UI refresh, notification handling, state storage, API calls, asynchronous operations, session invalidation, event-driven programming, and object creation.

**Object Creation — Factory Pattern:** `DocumentProcessorFactory` ([`src/app/core/services/document-processor.factory.ts`](frontend/src/app/core/services/document-processor.factory.ts)) receives a `FileType` enum (`XLSX`, `DOCX`, `PDF`, `IMAGE`) and returns the corresponding processor: `ExcelProcessor`, `WordProcessor`, `PdfProcessor`, `ImageOcrProcessor` (same folder). Centralises object creation and eliminates scattered conditional logic across services.

**Object Creation — Builder Pattern:** `DuaExportBuilder` ([`src/app/core/services/dua-export.builder.ts`](frontend/src/app/core/services/dua-export.builder.ts)) constructs the final DUA export step by step: apply user corrections → coherence validation (totals, currency, dates) → attach confidence metadata → generate audit entry → produce `.docx` payload. Chainable steps adapt to clean or observation-flagged batches.

**API Calls — Adapter Pattern:** `DuaDocumentAdapter` ([`src/app/infrastructure/adapters/dua-document.adapter.ts`](frontend/src/app/infrastructure/adapters/dua-document.adapter.ts)) maps raw backend responses into `DuaDocument` with `DuaField[]` and `ConfidenceLevel` enums. `BatchJobAdapter` ([`src/app/infrastructure/adapters/batch-job.adapter.ts`](frontend/src/app/infrastructure/adapters/batch-job.adapter.ts)) converts progress polling responses into `BatchJob` with stage-by-stage breakdown. ApiClients never expose raw JSON to upper layers.

**Notification Handling / Event-Driven — Observer Pattern:** `NotificationService` ([`src/app/core/notifications/notification.service.ts`](frontend/src/app/core/notifications/notification.service.ts)) uses RxJS `Subject` and `BehaviorSubject` to publish events (`batchStageCompleted`, `lowConfidenceDetected`, `documentProcessingFailed`, `exportReady`). Any layer subscribes to receive them. Progress Monitoring smart component subscribes to `batchProgress$` for real-time UI updates.

**UI Refresh — Observer Pattern:** Smart components subscribe to `Observable` and `Signal` streams exposed by Facades. State changes propagate to Dumb components exclusively via `@Input()` bindings. Angular's change detection updates only affected components — no manual DOM manipulation.

**Asynchronous Operations — Observer Pattern with RxJS Operators:** All HTTP calls return `Observable` streams managed with `switchMap`, `catchError`, `retry`, and `takeUntil`. DUA generation uses `interval` + `switchMap` to poll batch progress. `takeUntil` automatically unsubscribes on navigation to prevent memory leaks.

**State Storage — Singleton Pattern with Signals:** `StateManagementService` ([`src/app/core/state/`](frontend/src/app/core/state)) registered `providedIn: 'root'` uses Angular Signals to hold `AuthState` ([`auth.state.ts`](frontend/src/app/core/state/auth.state.ts)), `BatchState` ([`batch.state.ts`](frontend/src/app/core/state/batch.state.ts)), and `DuaResultState` ([`dua-result.state.ts`](frontend/src/app/core/state/dua-result.state.ts)). Only Services and Facades write; components read reactively.

**Singleton Pattern:** All services requiring a single shared instance are registered with `providedIn: 'root'`: `ExceptionHandlingService` ([`src/app/core/exception-handling/exception-handling.service.ts`](frontend/src/app/core/exception-handling/exception-handling.service.ts)), `NotificationService` ([`src/app/core/notifications/notification.service.ts`](frontend/src/app/core/notifications/notification.service.ts)), `LogService` ([`src/app/core/logging/log.service.ts`](frontend/src/app/core/logging/log.service.ts)), `DuaApiClient` ([`src/app/infrastructure/api-clients/dua-api.client.ts`](frontend/src/app/infrastructure/api-clients/dua-api.client.ts)), `FileApiClient` ([`src/app/infrastructure/api-clients/file-api.client.ts`](frontend/src/app/infrastructure/api-clients/file-api.client.ts)), `AuthApiClient` ([`src/app/infrastructure/api-clients/auth-api.client.ts`](frontend/src/app/infrastructure/api-clients/auth-api.client.ts)), `SettingsService` ([`src/app/core/settings/settings.service.ts`](frontend/src/app/core/settings/settings.service.ts)), `StateManagementService`.

**Security / Session Invalidation — Chain of Responsibility Pattern:** `JwtInterceptor` ([`src/app/core/interceptors/jwt.interceptor.ts`](frontend/src/app/core/interceptors/jwt.interceptor.ts)) runs first to attach the Azure Entra ID Bearer token. `ErrorInterceptor` ([`src/app/core/interceptors/error.interceptor.ts`](frontend/src/app/core/interceptors/error.interceptor.ts)) handles responses: `401` → session invalidation + redirect to login; `403` → access-denied event via `NotificationService`; `5xx` → log + user alert. Each interceptor passes unhandled cases down the chain.

**Security — Guard Pattern (Template Method):** `AuthGuard` ([`src/app/core/auth/auth.guard.ts`](frontend/src/app/core/auth/auth.guard.ts)) validates the active session token and redirects to login if expired. `RoleGuard` ([`src/app/core/auth/role.guard.ts`](frontend/src/app/core/auth/role.guard.ts)) extends the check to verify the user's role holds the required permission for the target route (e.g., `GENERATE_DUA` for `/generate`). Template: validate precondition → allow or deny → redirect if denied.

**Structural — Facade Pattern:** `DuaGenerationFacade` ([`src/app/application/facades/dua-generation.facade.ts`](frontend/src/app/application/facades/dua-generation.facade.ts)) exposes `startGeneration()`, which orchestrates file validation, batch submission, progress subscription setup, and state initialisation. `AuthFacade` ([`src/app/application/facades/auth.facade.ts`](frontend/src/app/application/facades/auth.facade.ts)) and `BatchMonitoringFacade` ([`src/app/application/facades/batch-monitoring.facade.ts`](frontend/src/app/application/facades/batch-monitoring.facade.ts)) follow the same principle. Smart components call one facade method instead of coordinating multiple services.

## 1.7 Project scaffold

Scaffold location: [`/frontend/src`](frontend/src)

```
frontend/src/
├── main.ts
├── index.html
├── styles.css
├── environments/
│   ├── environment.ts
│   ├── environment.staging.ts
│   └── environment.prod.ts
├── assets/
│   └── i18n/
│       ├── en.json
│       └── es.json
└── app/
    ├── app.component.ts
    ├── app.config.ts
    ├── app.routes.ts
    ├── core/
    │   ├── auth/
    │   │   ├── auth.guard.ts
    │   │   ├── auth.service.ts
    │   │   └── role.guard.ts
    │   ├── data-validation/
    │   │   ├── batch.schema.ts
    │   │   └── dua.schema.ts
    │   ├── exception-handling/
    │   │   └── exception-handling.service.ts
    │   ├── interceptors/
    │   │   ├── error.interceptor.ts
    │   │   └── jwt.interceptor.ts
    │   ├── logging/
    │   │   └── log.service.ts
    │   ├── models/
    │   │   ├── batch-job.model.ts
    │   │   ├── batch-status.enum.ts
    │   │   ├── confidence-level.enum.ts
    │   │   ├── dua-document.model.ts
    │   │   ├── dua-field.model.ts
    │   │   ├── file-type.enum.ts
    │   │   ├── processing-stage.enum.ts
    │   │   ├── source-file.model.ts
    │   │   ├── user-role.enum.ts
    │   │   └── user-session.model.ts
    │   ├── notifications/
    │   │   └── notification.service.ts
    │   ├── services/
    │   │   ├── batch.service.ts
    │   │   ├── coherence-validation.service.ts
    │   │   ├── confidence-level.service.ts
    │   │   ├── document-processor.factory.ts
    │   │   ├── dua-export.builder.ts
    │   │   ├── excel.processor.ts
    │   │   ├── image-ocr.processor.ts
    │   │   ├── pdf.processor.ts
    │   │   └── word.processor.ts
    │   ├── settings/
    │   │   └── settings.service.ts
    │   ├── state/
    │   │   ├── auth.state.ts
    │   │   ├── batch.state.ts
    │   │   └── dua-result.state.ts
    │   └── utils/
    │       ├── currency.util.ts
    │       └── date.util.ts
    ├── application/
    │   └── facades/
    │       ├── auth.facade.ts
    │       ├── batch-monitoring.facade.ts
    │       └── dua-generation.facade.ts
    ├── infrastructure/
    │   ├── adapters/
    │   │   ├── batch-job.adapter.ts
    │   │   └── dua-document.adapter.ts
    │   └── api-clients/
    │       ├── auth-api.client.ts
    │       ├── dua-api.client.ts
    │       └── file-api.client.ts
    ├── features/
    │   ├── login/
    │   │   └── components/
    │   │       ├── login.component.ts
    │   │       └── login-form.component.ts
    │   ├── configure-generator/
    │   │   └── components/
    │   │       ├── configure-generator.component.ts
    │   │       ├── file-list.component.ts
    │   │       ├── folder-path-input.component.ts
    │   │       └── template-selector.component.ts
    │   ├── progress-monitoring/
    │   │   └── components/
    │   │       ├── document-status.component.ts
    │   │       ├── error-log.component.ts
    │   │       ├── progress-monitoring.component.ts
    │   │       └── stage-progress.component.ts
    │   └── result-export/
    │       └── components/
    │           ├── dua-preview.component.ts
    │           ├── export-actions.component.ts
    │           ├── field-editor.component.ts
    │           └── result-export.component.ts
    └── shared/
        └── components/
            ├── button/
            │   └── button.component.ts
            ├── confidence-indicator/
            │   └── confidence-indicator.component.ts
            ├── form-field/
            │   └── form-field.component.ts
            └── progress-bar/
                └── progress-bar.component.ts
```

Frontend config files: [`angular.json`](frontend/angular.json), [`tailwind.config.js`](frontend/tailwind.config.js), [`tsconfig.json`](frontend/tsconfig.json), [`package.json`](frontend/package.json)

# 2. Backend Design

## 2.1 Technology Stack

| Concern | Choice |
|---|---|
| API Style | REST over HTTPS |
| API Standard | OpenAPI 3.1 (Swagger) |
| Runtime | .NET 8 / ASP.NET Core |
| Gateway | Azure API Management (APIM) |
| Hosting | Azure App Service (B3 plan, Linux containers) |
| Async & Push Notifications | Azure Notification Hubs |
| Document Processing (OCR) | Azure AI Document Intelligence (Form Recognizer) |
| AI / Semantic Extraction | Azure OpenAI Service (GPT-4o) |
| File Storage | Azure Blob Storage (per-job containers) |
| Background Jobs | Azure Service Bus + .NET Worker Service (hosted in App Service) |
| Load Balancing | Not required — single App Service instance |
| Repo Layout | Monorepo — frontend code in [`/frontend`](frontend/), backend code in [`/duabusiness`](duabusiness/) |
| Service Granularity | Services (not microservices) — single deployable ASP.NET Core app with internal service classes |

**Internal service modules (within the monolith):**

```
duabusiness/
├── DUA.Api/                  # Controllers, middleware, program.cs
├── DUA.Application/          # Use cases, service interfaces
├── DUA.Domain/               # Entities, value objects, domain events
├── DUA.Infrastructure/       # Azure SDK adapters, EF Core, repositories
└── DUA.Workers/              # Background worker (Service Bus consumer)
```

**OpenAPI contract:** Auto-generated via `Swashbuckle.AspNetCore`. The `/swagger/v1/swagger.json` endpoint is published to APIM on every deployment.

---

## 2.2 Security

### Transport
- **HTTPS enforced** at APIM level. HTTP requests are rejected with `301 → HTTPS`.
- TLS 1.2 minimum; TLS 1.3 preferred. Enforced via APIM policy `<choose-backend-scheme>`.

### Authentication & Authorization
- **OAuth 2.0 + OIDC** via **Azure Entra ID (Azure AD B2C)** for end users.
- JWT Bearer tokens validated in ASP.NET Core middleware (`AddJwtBearer`).
- Token expiry: **60 minutes** access token / **7 days** refresh token.
- Role claims: `agent` (standard user), `admin`.

### Database Encryption
- **Azure SQL Database** with **Transparent Data Encryption (TDE)** using customer-managed keys (CMK) stored in **Azure Key Vault**.
- Column-level encryption for PII fields (`importerTaxId`, `exporterTaxId`) using **Always Encrypted** with `AES-256`.
- Secrets (connection strings, API keys) stored exclusively in **Azure Key Vault**; accessed via **Managed Identity** — no secrets in code or config files.

### Payload Size Limits
| Endpoint Group | Max Payload |
|---|---|
| `POST /jobs` (folder upload trigger) | 50 MB |
| `POST /jobs/{id}/files` (individual file upload) | 20 MB per file |
| All other endpoints | 1 MB |

Enforced via `IFormFile` size filters in ASP.NET Core + APIM `<quota-by-key>` policy.

### Rate Limiting
| Scope | Limit |
|---|---|
| Per authenticated user | 60 requests / minute |
| Per IP (unauthenticated) | 10 requests / minute |
| Concurrent connections (App Service) | 200 max (App Service B3 ceiling) |
| File upload endpoint (`POST /jobs/{id}/files`) | 10 requests / minute / user |

Implemented via APIM rate-limit policies + ASP.NET Core `RateLimiter` middleware (token bucket algorithm) as a secondary layer.

### Data Retention
| Tier | Duration | Action |
|---|---|---|
| **Production (hot)** | 90 days | Active in Azure SQL + Blob Storage |
| **Archive (cool)** | 12 months | Moved to Azure Blob Storage (Cool tier) + Azure SQL Archive |
| **Deletion** | After 15 months | Hard-deleted; audit log entry written |

Retention job runs nightly via a Worker Service triggered by an Azure Service Bus scheduled message.

---

## 2.3 Observability

### Instrumentation Platform
- **Azure Application Insights** — primary telemetry sink (traces, exceptions, dependencies, custom events).
- **OpenTelemetry SDK** (`OpenTelemetry.Extensions.Hosting`) used in-process; OTLP exporter targets Application Insights.
- Structured logging via **Serilog** → Application Insights sink + Azure Log Analytics Workspace.

### Dashboard & Alerting
- **Azure Monitor Workbooks** for operational dashboards.
- **Grafana (Azure Managed Grafana)** for developer-facing analysis dashboards, sourcing data from Log Analytics.
- Alerts configured in Azure Monitor for all `P1`/`P2` events (PagerDuty integration via webhook).

### Registered Events

| Event Name | Trigger | Level |
|---|---|---|
| `job.created` | New DUA job submitted | INFO |
| `job.file_uploaded` | File added to a job | INFO |
| `job.processing_started` | Worker picks up job | INFO |
| `job.ocr_completed` | Document Intelligence step done | INFO |
| `job.extraction_completed` | AI semantic extraction done | INFO |
| `job.mapping_completed` | DUA fields mapped | INFO |
| `job.dua_generated` | Final .docx produced | INFO |
| `job.failed` | Any unrecoverable error in pipeline | ERROR |
| `job.field_low_confidence` | Field confidence < 0.6 | WARN |
| `auth.login_success` | User authenticated | INFO |
| `auth.login_failure` | Invalid credentials / token | WARN |
| `auth.token_refresh` | Token refreshed | DEBUG |
| `security.rate_limit_hit` | Rate limit exceeded | WARN |
| `security.oversized_payload` | Payload rejected | WARN |
| `data.retention_archive` | Records moved to archive | INFO |
| `data.retention_deletion` | Records hard-deleted | INFO |
| `api.unhandled_exception` | 500-level error | ERROR |
| `api.validation_error` | 400 from input validation | WARN |

All events carry: `correlationId`, `userId`, `jobId` (when applicable), `timestamp`, `durationMs`.

---

## 2.4 Infrastructure & DevOps

### Source Control
- GitHub (monorepo). Branch strategy: **GitHub Flow** (`main` → protected, feature branches via PR).

### CI/CD Tooling
- **GitHub Actions** — all pipeline automation lives in `.github/workflows/`.

```
.github/workflows/
├── ci.yml          # Build, lint, unit tests — triggers on every PR
├── cd-dev.yml      # Deploy to Dev on merge to main
├── cd-stage.yml    # Deploy to Stage on manual approval
└── cd-prod.yml     # Deploy to Prod on manual approval + tag
```

### Environment Deployment Matrix

| Environment | Hosting | IaC Tool | Trigger |
|---|---|---|---|
| **Dev** | Azure App Service (shared) | **Bicep** (ARM templates) | Auto on merge to `main` |
| **Stage** | Azure App Service (dedicated slot) | **Bicep** | Manual approval in GitHub Actions |
| **Prod** | Azure App Service (dedicated) | **Terraform** (state in Azure Storage) | Manual approval + semantic version tag (`v*.*.*`) |

### IaC Layout
```
infrastructure/
├── bicep/
│   ├── dev/
│   └── stage/
└── terraform/
    └── prod/
```

### Pipeline Steps (CI)
1. `dotnet restore`
2. `dotnet build --no-restore`
3. `dotnet test` (unit + integration, with coverage gate ≥ 80%)
4. `dotnet publish` → Docker image build
5. Push image to **Azure Container Registry (ACR)**
6. OpenAPI contract diff check (breaks PR if breaking changes detected)

### Pipeline Steps (CD)
1. Pull image from ACR
2. Apply Bicep/Terraform plan
3. Deploy to App Service slot (`--slot staging`)
4. Run smoke tests against slot
5. Swap slot to production (zero-downtime)
6. Post-deploy notification to Slack channel

---

## 2.5 Availability

| Metric | Target |
|---|---|
| **Annual uptime SLA** | **99.5%** |
| Max downtime (annual) | **≈ 43.8 hours/year** |
| Planned maintenance window | Sundays 02:00–04:00 UTC (excluded from SLA calc) |
| RTO (Recovery Time Objective) | 2 hours |
| RPO (Recovery Point Objective) | 1 hour |

**Mechanisms supporting this target:**
- Azure App Service built-in health checks with auto-restart on unhealthy instances.
- Azure SQL Database geo-redundant backup (automated, every 12 h full / 5 min transaction log).
- Blob Storage with **ZRS (Zone-Redundant Storage)** replication.
- APIM with built-in retry policies for transient backend failures.
- Worker Service dead-letter queue on Service Bus (messages retried up to 3× before DLQ).

> Note: 99.5% is deliberately chosen over 99.9% to avoid over-engineering a single-instance App Service setup. Upgrade path to 99.9% requires moving to Azure App Service **Premium** with auto-scale + **Azure Front Door**.

---

## 2.6 Scalability

The following architectural elements scale horizontally or vertically in response to increased requests per minute (RPM):

| Component | Scaling Mechanism | Trigger Metric |
|---|---|---|
| **Azure API Management** | Built-in horizontal scale (unit-based) | Sustained throughput > 80% of current unit capacity |
| **Azure App Service** | **Scale-out** (add instances) via App Service autoscale rules | CPU > 70% for 5 min OR HTTP queue length > 50 |
| **Azure Service Bus** (job queue) | Partitioned topics (16 partitions); Premium tier for higher throughput | Queue depth > 500 messages |
| **DUA.Workers** (background processor) | Scale out App Service worker instances independently (separate App Service Plan) | Service Bus queue depth |
| **Azure Blob Storage** | Inherently elastic — no action required | N/A |
| **Azure SQL Database** | **Scale up** DTUs/vCores; read replicas for reporting queries | DTU% > 80% sustained |
| **Azure OpenAI** (GPT-4o) | Increase TPM quota via Azure portal; implement request queuing | Token rate limit errors (429) |
| **Azure AI Document Intelligence** | Increase transactions-per-second quota | Throttling errors (429) |
| **Azure Application Insights** | Elastic SaaS — no action required | N/A |

**Scaling Boundary (current design):**
- Designed for **≤ 500 RPM** on a single App Service B3 instance.
- At **500–2,000 RPM**: enable App Service autoscale (2–5 instances) + APIM Standard tier.
- Above **2,000 RPM**: re-evaluate service decomposition (split document processing into a dedicated service) and introduce Azure Front Door for global load distribution.

## 2.7 Backend key workflows:

### Upload files to generate DUA
1. The frontend sends a `POST /jobs` request with metadata (job name, user ID, selected template ID). The API validates the JWT token and creates a new `Job` entity in Azure SQL with status `Created`. A unique `jobId` is returned.
2. The frontend uploads each file individually via `POST /jobs/{jobId}/files` using multipart/form-data streaming. The API validates file type (`.xlsx`, `.docx`, `.pdf`, `.jpg`, `.png`) and enforces the 20 MB per-file size limit.
3. Each uploaded file is stored in Azure Blob Storage under a per-job container (`jobs/{jobId}/{originalFileName}`). A `SourceFile` record is created in Azure SQL mapping the blob URI, file type, original name, and upload timestamp.
4. Once all files are uploaded, the frontend sends `POST /jobs/{jobId}/start`. The API changes the job status to `Queued` and publishes a `JobReadyForProcessing` message to Azure Service Bus.
5. The Worker Service picks up the message from the queue and changes the job status to `Processing`. It iterates through each `SourceFile` in the job.
6. For each file, the worker downloads the blob content and sends it to **Azure AI Document Intelligence** (Form Recognizer) for OCR and structured text extraction. Results are stored as `ExtractedContent` in Azure SQL.
7. The extracted text from all files is aggregated and sent to **Azure OpenAI Service (GPT-4o)** with a customs-specific system prompt for semantic extraction. The AI identifies DUA-relevant fields (importer, exporter, tariff codes, quantities, values, currencies, dates).
8. The mapped fields are validated for basic coherence: totals must sum correctly, currencies must be consistent across line items, and dates must follow chronological order. Each field receives a confidence score (`High ≥ 0.8`, `Medium 0.6–0.79`, `Low < 0.6`).
9. Fields with confidence below `0.6` are flagged with `LowConfidence` observations. The job status changes to `MappingCompleted`.
10. The system generates the pre-filled DUA `.docx` document using the selected template, embedding field values and confidence indicators. The generated document is stored in Azure Blob Storage at `jobs/{jobId}/output/dua-result.docx`.
11. The job status changes to `Completed` (or `CompletedWithObservations` if low-confidence fields exist). A `JobCompleted` event is published to Service Bus for notification delivery.
12. The frontend polls `GET /jobs/{jobId}/status` and receives the final status with a download URL for the generated DUA document.

### Setup DUA template
1. An authenticated user with the `EDIT_TEMPLATES` permission sends a `POST /templates` request with the DUA template file (`.docx`) and metadata (template name, version, description).
2. The API validates the template file structure: it must contain the expected DUA field placeholders (e.g., `{{importerName}}`, `{{tariffCode}}`, `{{totalValue}}`) matching the `DuaFieldMapping` schema.
3. The template file is stored in Azure Blob Storage under `templates/{templateId}/{version}/template.docx`. A `DuaTemplate` record is created in Azure SQL with the blob URI, field mapping definitions, version number, and creation timestamp.
4. The API returns the `templateId` and confirms the template is available for use in future DUA generation jobs.
5. When a user selects a template during job configuration (`GET /templates`), the API returns all active templates with their metadata. The selected `templateId` is associated with the job at creation time.

### Export DUA document
1. The frontend sends `GET /jobs/{jobId}/result` to retrieve the pre-filled DUA with all field values and confidence levels as structured JSON.
2. The user reviews and corrects flagged fields via `PATCH /jobs/{jobId}/fields` with an array of field corrections (`fieldId`, `correctedValue`, `reviewerNote`).
3. The API applies corrections, recalculates coherence validations (totals, currency, dates), and updates the DUA document in Blob Storage.
4. The frontend requests the final export via `POST /jobs/{jobId}/export`. The API performs a final coherence validation pass, generates the definitive `.docx`, and stores it in Blob Storage.
5. An audit log entry is written with the export timestamp, user ID, job ID, number of corrections applied, and final validation result.
6. The API returns a signed download URL (SAS token, 1-hour expiry) for the exported `.docx` file.

## 2.8 Architecture diagrams in layers:

### Level 1 — System Context Diagram

Shows DUA Streamliner as a single system and its relationships with users and external systems.

```
                                    +---------------------+
                                    |   Azure Entra ID    |
                                    |  (Identity Provider)|
                                    +----------+----------+
                                               |
                                       authenticates via
                                        OAuth 2.0 / OIDC
                                               |
    +----------------+              +----------+----------+              +------------------------+
    |                |   uses via   |                     |  calls API   |                        |
    | Customs Agent  +------------->+   DUA Streamliner   +------------->+  Azure OpenAI Service  |
    | / Manager      |   browser    |      [System]       |              |      (GPT-4o)          |
    |  [Person]      |              |                     |              +------------------------+
    +----------------+              +----------+----------+
                                               |
                                    +----------+----------+
                                    |                     |
                              +-----+-----+         +----+----+
                              |  Azure AI  |         |  Azure  |
                              | Document   |         |  Blob   |
                              | Intelligence|        | Storage |
                              +------------+         +---------+
```

**Description:**
- **Customs Agent / Manager** — End users who interact with DUA Streamliner through a web browser. Customs Agents upload documents and generate DUAs. Managers administer users, reports, and templates.
- **DUA Streamliner** — The system under design. Receives source documents, processes them through OCR and AI extraction, maps data to the official DUA format, and produces a pre-filled Word document with confidence indicators.
- **Azure Entra ID** — External identity provider. Handles authentication with MFA and issues JWT tokens. DUA Streamliner delegates all authentication to this service.
- **Azure OpenAI Service (GPT-4o)** — External AI service used for semantic extraction. Receives extracted text and returns structured DUA field mappings with confidence scores.
- **Azure AI Document Intelligence** — External OCR service. Receives uploaded documents (PDF, images, scanned files) and returns structured text extraction results.
- **Azure Blob Storage** — External file storage. Stores uploaded source files, DUA templates, and generated output documents.

---

### Level 2 — Container Diagram

Zooms into DUA Streamliner and shows its internal containers (deployable units) and how they interact.

```
+--------------------------------------------------+
|              DUA Streamliner [System]             |
|                                                   |
|  +---------------------------------------------+ |
|  |         Angular 21 SPA [Container]           | |
|  |  Single Page Application                     | |
|  |  Delivers UI, handles auth flow,             | |
|  |  calls backend REST API                      | |
|  |  Tech: Angular 21, TypeScript, Tailwind CSS  | |
|  +----------------------+-----------------------+ |
|                         | HTTPS / REST            |
|                         v                         |
|  +---------------------------------------------+ |
|  |    Azure API Management (APIM) [Container]   | |
|  |  API Gateway                                 | |
|  |  Rate limiting, JWT validation,              | |
|  |  TLS termination, request routing            | |
|  +----------------------+-----------------------+ |
|                         | HTTPS / REST            |
|                         v                         |
|  +---------------------------------------------+ |
|  |      DUA.Api [Container]                     | |
|  |  ASP.NET Core 8 Web API                      | |
|  |  REST controllers, middleware,               | |
|  |  request validation, Swagger                 | |
|  |  Tech: .NET 8, ASP.NET Core                  | |
|  +-----+-------------------+-------------------+ |
|        |                   |                      |
|        v                   v                      |
|  +-----------+   +--------------------+           |
|  | DUA.App   |   | DUA.Infrastructure |           |
|  | [Container]|  | [Container]        |           |
|  | Use cases, |  | Azure SDK adapters,|           |
|  | service    |  | EF Core repos,     |           |
|  | interfaces |  | Blob client,       |           |
|  +-----+------+ | OpenAI client      |           |
|        |         +--------+-----------+           |
|        v                  |                       |
|  +-----------+            |                       |
|  |DUA.Domain |            |                       |
|  |[Container]|            |                       |
|  | Entities, |            |                       |
|  | value obj |            |                       |
|  +-----------+            |                       |
|                           v                       |
|  +---------------------------------------------+ |
|  |      DUA.Workers [Container]                 | |
|  |  .NET Worker Service                         | |
|  |  Consumes Service Bus messages,              | |
|  |  orchestrates OCR + AI pipeline,             | |
|  |  generates DUA documents                     | |
|  |  Tech: .NET 8, BackgroundService             | |
|  +---------------------------------------------+ |
+--------------------------------------------------+

External:
  +----------------+   +-------------------+   +-------------+
  | Azure SQL DB   |   | Azure Blob Storage|   | Azure       |
  | [Database]     |   | [File Store]      |   | Service Bus |
  | Jobs, fields,  |   | Source files,     |   | [Message    |
  | templates,     |   | templates,        |   |  Broker]    |
  | audit logs     |   | generated DUAs    |   | Job queue   |
  +----------------+   +-------------------+   +-------------+
```

**Interactions:**
- The **Angular SPA** communicates exclusively with **APIM**, which routes requests to the **DUA.Api** container.
- **DUA.Api** uses **DUA.Application** for business logic orchestration and **DUA.Infrastructure** for data persistence (Azure SQL via EF Core) and external service calls (Blob Storage, OpenAI, Document Intelligence).
- **DUA.Domain** contains pure domain entities and value objects with no external dependencies.
- When a job is started, **DUA.Api** publishes a message to **Azure Service Bus**. The **DUA.Workers** container consumes the message and runs the OCR → AI extraction → mapping → DUA generation pipeline.
- **Azure SQL Database** stores all relational data. **Azure Blob Storage** stores all file content. **Azure Service Bus** decouples the API from long-running processing.

---

### Level 3 — Code Diagram (DUA.Api + DUA.Application)

Shows the key classes and their relationships within the API and Application layers.

```
DUA.Api/Controllers/
+-------------------------+     +---------------------------+
| JobsController          |     | TemplatesController       |
| - POST /jobs            |     | - POST /templates         |
| - POST /jobs/{id}/files |     | - GET /templates          |
| - POST /jobs/{id}/start |     | - GET /templates/{id}     |
| - GET /jobs/{id}/status |     +-------------+-------------+
| - GET /jobs/{id}/result |                   |
| - PATCH /jobs/{id}/fields|                  | uses
| - POST /jobs/{id}/export|                   |
+------------+------------+     +-------------v-------------+
             |                  | TemplateService           |
             | uses             | + CreateTemplate()        |
             v                  | + GetAllTemplates()       |
+-------------------------+     | + ValidateTemplate()      |
| JobService              |     +---------------------------+
| + CreateJob()           |
| + UploadFile()          |         DUA.Infrastructure/
| + StartProcessing()     |     +---------------------------+
| + GetStatus()           |     | IJobRepository            |
| + GetResult()           |     | IBlobStorageService       |
| + ApplyCorrections()    |     | IOcrService               |
| + ExportDua()           |     | ISemanticExtractionService|
+------------+------------+     | IAuditLogRepository       |
             |                  +---------------------------+
             | uses                        ^
             v                             | implements
+-------------------------+     +---------------------------+
| DuaProcessingPipeline   |     | BlobStorageService        |
| + RunOcr()              |     | OcrService                |
| + RunExtraction()       |     | (→ Azure AI Doc Intel)    |
| + MapFields()           |     | SemanticExtractionService |
| + ValidateCoherence()   |     | (→ Azure OpenAI GPT-4o)  |
| + GenerateDocument()    |     | JobRepository (EF Core)   |
+-------------------------+     | AuditLogRepository        |
             |                  +---------------------------+
             | uses
             v
+-------------------------+       DUA.Domain/
| DuaDocumentGenerator    |     +---------------------------+
| + BuildFromTemplate()   |     | Job (Entity)              |
| + ApplyFieldValues()    |     | SourceFile (Entity)       |
| + EmbedConfidence()     |     | DuaField (Value Object)   |
| + ProduceDocx()         |     | DuaTemplate (Entity)      |
+-------------------------+     | ConfidenceLevel (Enum)    |
                                | JobStatus (Enum)          |
                                | ProcessingStage (Enum)    |
                                +---------------------------+
```

**Description:**
- **JobsController** and **TemplatesController** are the REST entry points. They validate requests, delegate to application services, and return HTTP responses.
- **JobService** orchestrates the full job lifecycle: creation, file upload, processing trigger, status retrieval, corrections, and export.
- **TemplateService** manages DUA template CRUD and validation of field placeholders.
- **DuaProcessingPipeline** is invoked by the Worker Service. It coordinates the sequential steps: OCR → semantic extraction → field mapping → coherence validation → document generation.
- **DuaDocumentGenerator** handles the final `.docx` creation using the selected template and mapped field values.
- **Infrastructure services** implement interfaces defined in `DUA.Application` (Dependency Inversion). Each external Azure service has a dedicated adapter class.
- **Domain entities** are persistence-ignorant. `Job` is the aggregate root that owns `SourceFile` and `DuaField` collections.

## 2.9 Design Considerations:

### System Configurations and Policies

| Configuration | Value | Location |
|---|---|---|
| JWT token lifetime | 60 minutes (access) / 7 days (refresh) | Azure Entra ID + `appsettings.json` |
| Max file upload size | 20 MB per file, 50 MB per job | `Program.cs` (Kestrel limits) + APIM policy |
| Supported file types | `.xlsx`, `.docx`, `.pdf`, `.jpg`, `.png` | `FileValidationPolicy.cs` |
| Confidence threshold (low) | < 0.6 | `ConfidenceSettings.cs` |
| Confidence threshold (medium) | 0.6 – 0.79 | `ConfidenceSettings.cs` |
| Confidence threshold (high) | ≥ 0.8 | `ConfidenceSettings.cs` |
| Rate limit (authenticated) | 60 req/min per user | APIM policy + `RateLimiterOptions` |
| Rate limit (file upload) | 10 req/min per user | APIM policy |
| Data retention (hot) | 90 days | Worker Service scheduled job |
| Data retention (archive) | 12 months | Worker Service scheduled job |
| Data retention (deletion) | After 15 months | Worker Service scheduled job |
| SAS token expiry (export URLs) | 1 hour | `BlobStorageService.cs` |
| Service Bus max retries | 3 attempts before dead-letter | `ServiceBusOptions` in `appsettings.json` |

All configuration values are stored in `appsettings.json` with environment overrides in Azure App Service Configuration. Secrets (connection strings, API keys, Azure OpenAI endpoint keys) are stored exclusively in **Azure Key Vault** and accessed via Managed Identity at runtime.

### Resource Allocations

| Resource | Specification |
|---|---|
| App Service Plan (API) | B3 — 4 vCPU, 7 GB RAM, 10 GB storage |
| App Service Plan (Workers) | B3 — separate plan for independent scaling |
| Azure SQL Database | Standard S2 — 50 DTUs, 250 GB max |
| Azure Blob Storage | Standard — ZRS replication, Hot tier (output) + Cool tier (archive) |
| Azure Service Bus | Standard tier — 16 partitioned queues |
| Azure OpenAI (GPT-4o) | 80K TPM (tokens per minute) quota |
| Azure AI Document Intelligence | 15 TPS (transactions per second) |
| Azure API Management | Developer tier (dev/stage), Standard tier (prod) |

### Algorithms and Parameters

| Algorithm | Purpose | Parameters |
|---|---|---|
| **Token Bucket** (rate limiting) | Controls API request throughput | Bucket size: 60 tokens, refill rate: 1 token/sec |
| **Confidence scoring** | Evaluates extraction certainty per field | Weighted average of: OCR confidence (30%), AI extraction confidence (50%), field format validation (20%) |
| **Coherence validation** | Cross-field consistency checks | Rules: line item totals = declared total (±0.01 tolerance), single currency per declaration, dates in chronological order |
| **Exponential backoff** (Service Bus retry) | Retry transient failures in worker pipeline | Initial delay: 1s, multiplier: 2x, max delay: 30s, max retries: 3 |
| **SAS token generation** | Secure time-limited file download URLs | Algorithm: HMAC-SHA256, expiry: 1 hour, permissions: read-only |

### Agent Prototypes

| Agent | Responsibility | Input | Output |
|---|---|---|---|
| **OCR Agent** | Extracts raw text and structure from uploaded documents | File blob (PDF, image) | Structured text with positional metadata and OCR confidence scores |
| **Semantic Extraction Agent** | Maps extracted text to DUA fields using customs terminology | Aggregated extracted text + DUA field schema | Array of `DuaField` objects with values and confidence scores |
| **Coherence Validation Agent** | Validates cross-field consistency and business rules | Array of `DuaField` objects | Validation result with pass/fail per rule and correction suggestions |
| **Document Generation Agent** | Produces the final `.docx` from template and field values | DUA template + validated fields + confidence metadata | Pre-filled `.docx` file with visual confidence indicators |

Each agent is implemented as a service class within `DUA.Application/Services/` and orchestrated by `DuaProcessingPipeline`.

### Interfaces, Proxies, and Integration Points

| Interface | Implementation | External System | Purpose |
|---|---|---|---|
| `IOcrService` | `AzureDocumentIntelligenceService` | Azure AI Document Intelligence | OCR and structured text extraction from documents |
| `ISemanticExtractionService` | `AzureOpenAiExtractionService` | Azure OpenAI Service (GPT-4o) | AI-driven semantic field extraction with customs context |
| `IBlobStorageService` | `AzureBlobStorageService` | Azure Blob Storage | Upload, download, and manage source files, templates, and output documents |
| `IMessageBroker` | `AzureServiceBusPublisher` | Azure Service Bus | Publish job processing messages and consume them in workers |
| `IIdentityService` | `AzureEntraIdService` | Azure Entra ID | Token validation, user identity resolution, role extraction |
| `IAuditLogSink` | `ApplicationInsightsSink` | Azure Application Insights | Structured audit log and telemetry submission |
| `IKeyVaultClient` | `AzureKeyVaultClient` | Azure Key Vault | Runtime retrieval of secrets and configuration values |

All external integrations follow the **Adapter pattern**: interfaces are defined in `DUA.Application/Interfaces/`, implementations live in `DUA.Infrastructure/Services/`. This ensures the domain and application layers have zero dependency on Azure SDKs.

## Source Code

Backend scaffold location: [`/duabusiness`](duabusiness/)

```
duabusiness/
├── DUA.Api/
│   ├── Program.cs
│   ├── Controllers/
│   │   ├── JobsController.cs
│   │   └── TemplatesController.cs
│   ├── Middleware/
│   │   └── ExceptionHandlingMiddleware.cs
│   └── Configuration/
│       ├── RateLimiterOptions.cs
│       ├── ConfidenceSettings.cs
│       └── FileValidationPolicy.cs
├── DUA.Application/
│   ├── Interfaces/
│   │   ├── IOcrService.cs
│   │   ├── ISemanticExtractionService.cs
│   │   ├── IBlobStorageService.cs
│   │   ├── IMessageBroker.cs
│   │   ├── IIdentityService.cs
│   │   ├── IAuditLogSink.cs
│   │   ├── IKeyVaultClient.cs
│   │   ├── IJobRepository.cs
│   │   ├── ITemplateRepository.cs
│   │   └── IAuditLogRepository.cs
│   └── Services/
│       ├── JobService.cs
│       ├── TemplateService.cs
│       ├── DuaProcessingPipeline.cs
│       └── DuaDocumentGenerator.cs
├── DUA.Domain/
│   ├── Entities/
│   │   ├── Job.cs
│   │   ├── SourceFile.cs
│   │   └── DuaTemplate.cs
│   ├── ValueObjects/
│   │   └── DuaField.cs
│   ├── Enums/
│   │   ├── JobStatus.cs
│   │   ├── ConfidenceLevel.cs
│   │   ├── ProcessingStage.cs
│   │   └── FileType.cs
│   └── Events/
│       ├── JobCompletedEvent.cs
│       └── LowConfidenceDetectedEvent.cs
├── DUA.Infrastructure/
│   ├── Services/
│   │   ├── AzureDocumentIntelligenceService.cs
│   │   ├── AzureOpenAiExtractionService.cs
│   │   ├── AzureBlobStorageService.cs
│   │   ├── AzureServiceBusPublisher.cs
│   │   ├── AzureEntraIdService.cs
│   │   ├── ApplicationInsightsSink.cs
│   │   └── AzureKeyVaultClient.cs
│   └── Persistence/
│       ├── AppDbContext.cs
│       ├── JobRepository.cs
│       ├── TemplateRepository.cs
│       └── AuditLogRepository.cs
└── DUA.Workers/
    ├── Program.cs
    └── JobProcessingWorker.cs
```

### Key classes and their locations

| Class / Interface | Path | Responsibility |
|---|---|---|
| `JobsController` | [`duabusiness/DUA.Api/Controllers/JobsController.cs`](duabusiness/DUA.Api/Controllers/JobsController.cs) | REST endpoints for job lifecycle (create, upload, start, status, result, corrections, export) |
| `TemplatesController` | [`duabusiness/DUA.Api/Controllers/TemplatesController.cs`](duabusiness/DUA.Api/Controllers/TemplatesController.cs) | REST endpoints for DUA template management |
| `JobService` | [`duabusiness/DUA.Application/Services/JobService.cs`](duabusiness/DUA.Application/Services/JobService.cs) | Orchestrates the full job lifecycle use cases |
| `DuaProcessingPipeline` | [`duabusiness/DUA.Application/Services/DuaProcessingPipeline.cs`](duabusiness/DUA.Application/Services/DuaProcessingPipeline.cs) | Coordinates OCR → extraction → mapping → validation → generation pipeline |
| `DuaDocumentGenerator` | [`duabusiness/DUA.Application/Services/DuaDocumentGenerator.cs`](duabusiness/DUA.Application/Services/DuaDocumentGenerator.cs) | Builds the final `.docx` from template and mapped fields |
| `Job` | [`duabusiness/DUA.Domain/Entities/Job.cs`](duabusiness/DUA.Domain/Entities/Job.cs) | Aggregate root — represents a DUA generation job |
| `DuaField` | [`duabusiness/DUA.Domain/ValueObjects/DuaField.cs`](duabusiness/DUA.Domain/ValueObjects/DuaField.cs) | Value object for a single DUA field with confidence metadata |
| `IOcrService` | [`duabusiness/DUA.Application/Interfaces/IOcrService.cs`](duabusiness/DUA.Application/Interfaces/IOcrService.cs) | Interface for OCR document processing |
| `ISemanticExtractionService` | [`duabusiness/DUA.Application/Interfaces/ISemanticExtractionService.cs`](duabusiness/DUA.Application/Interfaces/ISemanticExtractionService.cs) | Interface for AI-driven field extraction |
| `AzureBlobStorageService` | [`duabusiness/DUA.Infrastructure/Services/AzureBlobStorageService.cs`](duabusiness/DUA.Infrastructure/Services/AzureBlobStorageService.cs) | Azure Blob Storage adapter for file operations |
| `AppDbContext` | [`duabusiness/DUA.Infrastructure/Persistence/AppDbContext.cs`](duabusiness/DUA.Infrastructure/Persistence/AppDbContext.cs) | EF Core database context |
| `JobProcessingWorker` | [`duabusiness/DUA.Workers/JobProcessingWorker.cs`](duabusiness/DUA.Workers/JobProcessingWorker.cs) | Background service consuming Service Bus messages for job processing |