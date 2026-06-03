# SmartCart — Frontend Design

**Authors:** SmartCart Team
**Version:** 1.0.0
**Date:** 01/06/2026
**Repository:** [Link to repository]

> This document fills **Section 1 (Frontend Design)** of `DesignTemplate.md` for the SmartCart application.
> All choices are derived from `appContext.md` (screens & flows) and `designPatterns.md` (GoF pattern applications).
> Every technology lists a recent stable version, and version compatibility is stated explicitly.

---

## 1.1. Technology Stack

SmartCart is a **consumer-facing mobile app** whose core features — barcode scanning via the device camera, in-store presence detection (GPS/BLE beacons), QR generation at checkout, and push notifications on point credit — all require **native device APIs**. A native cross-platform stack is therefore the correct application type.

| Concern | Choice | Version | Justification |
|---------|--------|---------|---------------|
| **Application Type** | Native Mobile App (managed via Expo) | — | The Discover → Scan → Validate → Accumulate → Redeem loop depends on camera, BLE/GPS, QR rendering, and push — all native capabilities. A native app delivers the in-store performance and hardware access a PWA cannot reliably provide. |
| **Framework** | React Native (Expo SDK 52) | RN **0.76.6** / Expo SDK **52** | A single codebase targets both iOS and Android, halving cost for a consumer app aimed at supermarket shoppers. Expo SDK 52 bundles native modules (camera, secure storage, notifications) with guaranteed inter-compatibility and provides EAS Build/OTA updates. New Architecture (Fabric/TurboModules) is enabled by default for smooth camera/scan UI. |
| **UI Runtime** | React | **18.3.1** | The exact React version shipped and validated by Expo SDK 52 / RN 0.76.6. |
| **Language** | TypeScript | **5.3.3** | Static typing makes the session state machine, command objects, and DTOs (`ProductDTO`) safe to refactor. Version 5.3.3 is the version pinned by `jest-expo` 52 and RN 0.76.6 templates. |
| **State Management** | Zustand | **4.5.5** | Lightweight global store with no boilerplate — ideal for the single active shopping session (points total, pending items, session status). Its subscription model is the natural substrate for the **Observer** and **Singleton** patterns. Compatible with React 18.3.1. |
| **Server State / Data Fetching** | TanStack Query (React Query) | **5.59.16** | Implements the client side of the **Cache-Aside** product lookup (cached barcode → product), automatic retries, and request de-duplication. Decouples server cache from UI state. Works with React 18.3.1 and Axios. |
| **HTTP Client** | Axios | **1.7.7** | Request/response interceptors automate JWT attachment and silent token refresh, and centralize error mapping (the **Facade** over the backend API). |
| **Navigation** | Expo Router (on React Navigation 7) | **4.0.x** | File-based routing over RN screens (Lobby, Scan, QR, Confirmation, Rewards). Bundled with and compatible with Expo SDK 52. |
| **Barcode / Camera Scanning** | expo-camera | **16.0.x** | Provides the live camera feed and barcode recognition for `CameraStrategy`. Shipped with Expo SDK 52, so native compatibility is guaranteed. |
| **In-Store Presence** | expo-location + react-native-ble-plx | location **18.0.x** / ble-plx **3.2.1** | GPS + BLE beacon detection gates point accrual to "user inside affiliated store" (required by the location pill on Screens 1 & 2). ble-plx 3.2.1 supports RN 0.76 New Architecture. |
| **QR Rendering** | react-native-qrcode-svg + react-native-svg | qrcode-svg **6.3.2** / svg **15.8.0** | Renders the large checkout QR on Screen 5. `react-native-svg` 15.8.0 is the version vendored by Expo SDK 52. |
| **Real-time Validation Status** | socket.io-client | **4.8.0** | Pushes POS validation status to the `ValidatingState` screen so "Esperando validación…" flips to the Confirmation screen without manual polling. Falls back to interval polling. |
| **Push Notifications** | expo-notifications (FCM/APNs) | **0.29.x** | Fires the "Puntos acreditados" notification when the backend credits points. Shipped with Expo SDK 52. |
| **Forms & Validation** | React Hook Form + Zod | RHF **7.53.0** / Zod **3.23.8** | Validates the manual-barcode-entry fallback and auth forms. Zod schemas double as the runtime guard for API DTOs. Both compatible with React 18.3.1 / TS 5.3.3. |
| **Styling / Design Tokens** | NativeWind (Tailwind CSS) | NativeWind **4.1.x** / Tailwind **3.4.x** | Utility-first styling enforces the design tokens (color/spacing/typography) consistently across all 7 screens. NativeWind 4 requires RN ≥ 0.76 — aligned with our framework. |
| **Secure Storage** | expo-secure-store | **14.0.x** | Stores JWT access/refresh tokens in the iOS Keychain / Android Keystore (never `AsyncStorage`). Shipped with Expo SDK 52. |
| **Linting** | ESLint | **9.12.0** | Enforces code quality via flat config with the Expo/React Native preset. |
| **Formatting** | Prettier | **3.3.3** | Deterministic formatting; integrated with ESLint to avoid rule conflicts. |
| **Unit Testing** | Jest (jest-expo) | Jest **29.7.0** / jest-expo **52.0.x** | jest-expo 52 is the preset matched to Expo SDK 52 / RN 0.76.6. Covers utils, stores, commands, and validation handlers. |
| **Integration / UI Testing** | React Native Testing Library | **12.8.0** | Tests component interactions (scan confirmation modal, delete-with-undo, QR generation) on RN 0.76.6. |
| **E2E Testing** | Maestro | **1.39.x** | Flow-based E2E across real devices/simulators for the critical scan → checkout → redeem journey. Simpler than Detox for Expo-managed apps. |
| **Monitoring** | Sentry (sentry-expo) | **9.x** | Captures uncaught exceptions, performance traces, and crash reports in production. |
| **CI/CD** | GitHub Actions + EAS Build | — | GitHub Actions runs lint/test/build; EAS Build produces signed iOS/Android binaries and EAS Submit ships to the stores. |
| **Distribution / Hosting** | Expo EAS → Apple App Store + Google Play | — | Native app distribution channel; EAS Update delivers OTA JS patches between store releases. |

> **Compatibility statement:** The entire stack is anchored on **Expo SDK 52**, which pins React 18.3.1, React Native 0.76.6, react-native-svg 15.8.0, expo-camera 16, expo-notifications 0.29, and TypeScript 5.3.3 as a validated, mutually compatible set. Third-party libraries (Zustand 4.5.5, TanStack Query 5.59, Axios 1.7.7, NativeWind 4.1, RHF 7.53, Zod 3.23.8, ble-plx 3.2.1, socket.io-client 4.8) all declare support for React 18.3.1 and RN 0.76 New Architecture.

### Environments

| Environment | URL / Endpoint | Purpose |
|-------------|----------------|---------|
| Development | `http://localhost:8081` (Metro) → API `http://localhost:3000/api/v1` | Local development on simulator/Expo Go (dev client) |
| Staging | `https://api-staging.smartcart.app/api/v1` | QA and pre-release validation; internal EAS distribution build |
| Production | `https://api.smartcart.app/api/v1` | Live users; App Store / Play Store release |

---

## 1.2. UX / UI Analysis

### Usability Attributes

| Attribute | Target |
|-----------|--------|
| **Learnability** | A first-time shopper completes the scan → validate → redeem loop with no instructions, guided by one primary CTA per screen ("Escanear producto" → "Generar QR de salida" → "Ver mis recompensas"). |
| **Efficiency** | Scanning a product and adding it to the pending list takes ≤ 3 interactions: tap CTA → align barcode → confirm. |
| **Error Prevention** | After a scan, the app requires explicit confirmation of the detected product before adding it (prevents wrong-product accrual). Point accrual is blocked unless the location pill confirms the user is inside an affiliated store. |
| **Visibility of Status** | Current points, pending points (yellow tags), and the live QR validation state ("Esperando validación…") are always visible. The points card progress bar shows the deficit to the next reward. |
| **Confidence Feedback** | Green success toast on each scan ("+15 pts pendientes"), full-green confirmation hero with checkmark, and explicit warning/error messages for failed scans or expired QR. |
| **Consistency** | Uniform design tokens (color, spacing, typography) applied via NativeWind across all 7 screens; the green brand color signals "valid / earn points" everywhere. |
| **Error Recovery** | A failed camera scan offers retry or manual barcode entry without leaving the flow (**Strategy** pattern). A wrongly scanned item can be deleted before validation via the red X (**Command** pattern with undo). |
| **Accessibility** | WCAG 2.1 AA: contrast ≥ 4.5:1 (verified against the green palette), screen-reader labels on camera/QR/CTAs, scalable text, and non-color-only status cues (icons + text alongside green/yellow/red). |

### Branding & Style Guidelines

SmartCart's visual identity is **green-forward** — green communicates "valid scan / points earned" and dominates the checkout and confirmation screens for cashier visibility.

#### Color Palette

| Token | Hex | Usage |
|-------|-----|-------|
| `--color-primary` | `#16A34A` | Primary actions, CTAs ("Escanear", "Generar QR"), confirmation hero |
| `--color-secondary` | `#15803D` | Secondary green elements, pressed states, gradient base for featured reward |
| `--color-accent` | `#FACC15` | Pending-points tags, "Nuevo" highlights, badges |
| `--color-background` | `#F9FAFB` | App background |
| `--color-surface` | `#FFFFFF` | Cards, modals, product list rows |
| `--color-error` | `#DC2626` | Error states, delete (red X), expired QR |
| `--color-success` | `#22C55E` | Success toast, validated-product checkmarks |
| `--color-text-primary` | `#111827` | Main text |
| `--color-text-secondary` | `#6B7280` | Subtitles, captions, motivational subtitle |

#### Typography

| Role | Font Family | Weight | Size | Usage |
|------|-------------|--------|------|-------|
| Display / Heading | Poppins | 700 | 24px | Screen titles, points total |
| Subheading | Poppins | 600 | 18px | Section headers ("Productos con puntos hoy") |
| Body | Inter | 400 | 16px | General text, product names |
| Caption | Inter | 400 | 12px | Labels, hints, expiry dates, alphanumeric QR fallback |
| Button | Poppins | 600 | 14px | CTA text |

#### Spacing & Layout

| Token | Value | Usage |
|-------|-------|-------|
| `--spacing-xs` | 4px | Tight spacing (tag padding) |
| `--spacing-sm` | 8px | Internal component padding |
| `--spacing-md` | 16px | Default padding, card gaps |
| `--spacing-lg` | 24px | Section spacing |
| `--spacing-xl` | 32px | Screen-level padding |

- **Grid System:** Single-column, mobile-first stacked layout (one primary action per screen); 4pt spacing scale.
- **Breakpoints:** `sm: 375px` (baseline phone), `md: 768px` (large phones/tablet), `lg: 1024px` (tablet landscape).
- **Iconography:** Lucide React Native (`lucide-react-native` 0.4xx) — consistent outline set for nav, scan, flash, delete, rewards.
- **Logo Usage Rules:** Minimum 24px height; maintain clear space equal to the cart glyph height; never recolor outside the primary/secondary green or white-on-green.

### Core Business Process

Described as user **actions** and their results (no visual components), per the four core flows of `appContext.md`.

#### Onboarding & Home (Lobby)
1. The user opens the app upon arriving at a store.
2. The system detects the user's presence in an affiliated store and enables point accumulation for the session.
3. The user reviews their current point balance, progress toward the next reward, and the day's sponsored products.
4. The user chooses to begin scanning or to review pending items from a prior moment in the session.

#### Product Scanning & Pending List
1. The user initiates scanning.
2. The system activates barcode capture (camera by default).
3. Alternatively, the user provides the barcode manually when the printed code is damaged.
4. Once a code is captured, the system retrieves the product details and asks the user to confirm the detected product.
5. Upon confirmation, the system validates that the user is in-store, the format is valid, the product is sponsored, and it is not already in the session, then adds it with its pending points.
6. The user may continue scanning or move toward checkout.

#### Checkout & Points Validation
1. With shopping complete, the user requests a checkout validation code.
2. The system issues a unique, time-limited (10-minute) code representing the pending items.
3. The user presents the code to the cashier.
4. The system waits for the store's confirmation of the purchase.
5. Upon confirmation, the system credits the corresponding points and informs the user that the purchase was verified.

#### Rewards Redemption
1. The user opens the rewards section.
2. The system shows the available point balance and the redeemable rewards, marking those still out of reach with the missing amount.
3. The user selects a reward and confirms spending the points.
4. The system deducts the points and issues a coupon ready to use.

### Wireframes

The interactive HTML prototypes referenced in `appContext.md` map to these screens:

| Screen | Prototype file | Purpose |
|--------|----------------|---------|
| 1 — Lobby (empty) | `pantalla-1-main-vacio.html` | Overview of points, sponsored products, primary scan CTA, location pill. |
| 2 — Camera Scanning | `pantalla-2-escanear.html` | Capture barcode via camera with manual-entry fallback and in-store confirmation. |
| 3 — Lobby (1 product) | `pantalla-3-main-1producto.html` | First scanned product with toast, pending-points subsection, delete option. |
| 4 — Lobby (multiple) | `pantalla-4-main-3productos.html` | Full pending list with dual CTAs (scan more / generate QR). |
| 5 — QR Validation | `pantalla-5-qr-validacion.html` | Full-green QR + alphanumeric fallback, 10-min validity, polling status. |
| 6 — Confirmation | `pantalla-6-confirmacion.html` | Points-credited hero, validated products, new total, paths to home or rewards. |
| 7 — My Rewards | `pantalla-7-recompensas.html` | Available rewards + redeemed coupons tabs; locked rewards show point deficit. |

### UX Test Results

- **Platform Used:** Maze (unmoderated remote) + in-person sessions with external design students.
- **Results Summary:** See the Phase 1 metrics table in `DesignTemplate.md` (≥ 4 participants × 4 tasks: register, scan, generate QR, redeem).
- **Key Findings (expected focus areas):** discoverability of the manual-entry fallback on the scan screen; clarity of the "pending vs credited" points distinction; one-tap QR generation satisfaction.
- **Corrections Integrated:** track each finding in the Phase 1 "Key Findings & Applied Corrections" table and reflect the applied fix in the final NativeWind component styles.

---

## 1.3. Component Design Strategy

- **Strategy Name:** **Atomic Design** layered on top of a **Feature-Sliced** folder structure (atoms/molecules/organisms for shared UI; feature folders for screen logic).
- **Component Hierarchy:**
  - **Atoms:** `Button`, `Input`, `Icon`, `Badge`, `PointsTag`, `LocationPill`, `Toast`.
  - **Molecules:** `ProductCard`, `PointsCard`, `ScanConfirmationModal`, `RewardCard`, `QRCodeView`.
  - **Organisms:** `BottomNav`, `PendingItemsList`, `SponsoredCarousel`, `RewardsCatalog`, `CouponsList`.
  - **Templates / Screens:** `LobbyScreen`, `ScanScreen`, `QRValidationScreen`, `ConfirmationScreen`, `RewardsScreen`.
- **Reusability:** Shared, stateless UI lives in `/components` and receives data via props (Container/Presentational split). Feature-specific logic and state live in `/features/<feature>`. Naming: `PascalCase` components, `camelCase` hooks prefixed `use`, one component per file.
- **Internationalization (i18n):** `i18next` 23.x + `react-i18next` 15.x with `expo-localization` for locale detection. Strings live in `/lib/i18n/<locale>.json`; default `es-CR` (primary market is Costa Rican supermarkets), with `en` fallback.
- **Responsiveness:** Mobile-first single-column layouts; NativeWind responsive prefixes adapt spacing at the `md`/`lg` breakpoints for large phones and tablets. Safe-area insets handled via `react-native-safe-area-context`.
- **Accessibility:** Every interactive element sets `accessibilityRole` and `accessibilityLabel`; status is conveyed by icon + text (not color alone); focus order follows visual order; dynamic type respected.

---

## 1.4. Security

### Authentication

- **Provider / Method:** JWT (access + refresh) issued by the SmartCart backend.
- **Flow:**
  1. User submits email + password (validated client-side with Zod).
  2. Backend validates credentials and returns an access token (short-lived) and a refresh token.
  3. Frontend stores both tokens in **expo-secure-store** (Keychain/Keystore) — never in `AsyncStorage`.
  4. The Axios request interceptor attaches `Authorization: Bearer <access>` to every protected request.
  5. On a `401`, the response interceptor uses the refresh token to obtain a new access token once, then retries the original request; concurrent requests queue behind a single refresh.

### Authorization (RBAC)

| Role | Description | Permissions |
|------|-------------|-------------|
| `user` | Registered shopper | Scan products, manage pending session, generate checkout QR, browse/redeem rewards, view own points history |
| `admin` | Store administrator | All `user` permissions + manage product catalog & sponsored list, manage rewards, view store analytics |

> The high-stakes **AI Fraud Detection** human-review flow (`designPatterns.md`) is operated by a separate `BACKOFFICE_OPERATOR` role in a back-office tool, **not** in this consumer app.

### Session Management

- **Token Expiry:** Access token 15 min / Refresh token 7 days.
- **Refresh Strategy:** Silent refresh via the Axios interceptor on `401`, with a single in-flight refresh and a request queue.
- **Storage Decision:** `expo-secure-store` (hardware-backed) instead of `AsyncStorage`/`localStorage`, because tokens are sensitive and `AsyncStorage` is unencrypted on device.
- **Logout Behavior:** Tokens cleared from secure store; refresh token revoked server-side; Zustand session store reset; React Query cache cleared.

### Secure Configuration

- **Environment Variables:** Managed per environment via `app.config.ts` `extra` + EAS environment variables; only non-secret, public config (API base URL) is bundled. No secrets committed to VCS.
- **Secret Management Platform:** EAS Secrets for build-time values; the mobile client holds **no** server secrets (POS/B2B API keys live exclusively in the backend).
- **OWASP Mobile (MASVS) Applied:**
  | Threat | Mitigation |
  |--------|-----------|
  | Insecure data storage | Tokens in Keychain/Keystore via secure-store; no PII in plain storage |
  | Insecure communication | HTTPS/TLS 1.2+ enforced; optional certificate pinning for the API host |
  | Injection (manual barcode/form input) | Zod schema validation + sanitization before any request |
  | Insecure Direct Object Reference | All resource access is authorized server-side per token; client never trusts IDs alone |
  | Reverse engineering / tampering | Production builds strip console logs; release builds use Hermes bytecode; Sentry monitors anomalies |

---

## 1.5. Layered Architecture

- **Architectural Pattern:** **Clean Architecture adapted to React Native** with a Feature-Sliced layout — the UI depends inward on use-cases, which depend on the domain; infrastructure is injected behind interfaces.
- **Layer Responsibilities:**

| Layer | Responsibility | Examples |
|-------|---------------|----------|
| Presentation | Render UI, handle gestures/events | Screens, atoms/molecules/organisms |
| Application / Use Cases | Orchestrate business logic | Custom hooks, Zustand stores, **Command** objects, session **State** machine |
| Domain | Core business rules & entities | `Product`/`ProductDTO`, session states, scan-validation handlers, points rules |
| Infrastructure | External communication & device APIs | Axios client (**Facade**), socket.io client, secure-store, camera/BLE adapters |

- **Layer Access Rules:** Presentation may call only the Application layer (hooks/stores). Application may call Domain and Infrastructure (the latter only through interfaces). **Domain must not import Infrastructure or React** — it stays pure and unit-testable.

- **Diagram:**

```mermaid
flowchart TD
    subgraph Presentation
        S1[LobbyScreen]
        S2[ScanScreen]
        S3[QRValidationScreen]
        S4[ConfirmationScreen]
        S5[RewardsScreen]
    end

    subgraph Application["Application / Use Cases"]
        H[Custom Hooks]
        ST[Zustand Session Store · Singleton]
        CMD[Command Objects · Add/Remove/GenerateQR/Redeem]
        SM[Session State Machine]
    end

    subgraph Domain
        ENT[Entities · Product, Reward]
        VAL[Scan Validation Chain]
        RULES[Points Rules]
    end

    subgraph Infrastructure
        API[Axios API Facade]
        WS[socket.io Client]
        CAM[Camera / BLE Adapters · Strategy]
        SEC[Secure Store]
        RQ[React Query Cache · Cache-Aside]
    end

    Presentation --> Application
    Application --> Domain
    Application --> Infrastructure
    Domain -.no dependency.-> Infrastructure
    API --> Backend[(SmartCart Backend API)]
    WS --> Backend
```

---

## 1.6. Design Patterns

Mapped directly from `designPatterns.md` to their frontend implementation locations.

| Pattern | Application in SmartCart | Location in Codebase |
|---------|--------------------------|----------------------|
| **Singleton** | Exactly one active `ShoppingSession` per authenticated user (pending items, pending points, status) — backed by a single Zustand store, the single source of truth. | `/store/sessionStore.ts` |
| **Observer** | A successful scan notifies the points card, product list, toast, and session state independently via store subscriptions — the scanner never knows its consumers. | `/store/sessionStore.ts`, `/features/scan/scannerService.ts` |
| **State** | The session moves through `Empty → Scanning → WithProducts → Validating → Confirmed`; each state defines its valid actions and which CTAs/UI render. | `/features/session/states/` |
| **Command** | User actions (`AddProductCommand`, `RemoveProductCommand`, `GenerateQRCommand`, `RedeemCouponCommand`) are encapsulated objects; remove supports **undo** for the red-X delete. | `/features/session/commands/` |
| **Strategy** | Barcode capture has interchangeable strategies: `CameraStrategy` (expo-camera) and `ManualEntryStrategy`, both returning the same result shape. | `/features/scan/strategies/` |
| **Chain of Responsibility** | Client-side pre-validation pipeline before adding a scan: `LocationHandler → BarcodeFormatHandler → SponsoredProductHandler → DuplicateScanHandler → SessionAddHandler`. | `/features/scan/validation/` |
| **Decorator** | Composable product visual states: `SponsoredProductDecorator`, `NewlyScannedDecorator`, `ValidatedProductDecorator`, `LockedRewardDecorator` — stacked per screen context. | `/components/product/decorators/` |
| **Factory Method** | `RewardFactory` creates reward types (`DiscountCoupon`, `TwoForOneCoupon`, `CategoryCoupon`) so the catalog grows without touching render/validation code. | `/features/rewards/factories/` |
| **Facade** | A single API module hides all HTTP details (base URL, interceptors, error mapping) from components. | `/api/client.ts`, `/api/endpoints/` |
| **Cache-Aside** | Barcode → product lookups check the React Query cache first; on a miss, fetch from the API and cache (mirrors the backend `ProductCacheService` contract on the client). | `/api/endpoints/products.ts` |
| **Container / Presentational** | Feature containers own logic/state and pass plain props to stateless UI components. | `/features/` vs `/components/` |

### Asynchronous Operations

- **Approach:** `async/await` with Axios, wrapped by TanStack Query for caching/retries/de-duplication.
- **Loading States:** Skeleton placeholders for the sponsored carousel and rewards catalog; an animated scan line signals active barcode processing.
- **Error Boundaries:** A React Error Boundary per feature (`scan`, `checkout`, `rewards`) prevents a single failure from crashing the app.
- **Retry Logic:** Automatic retry on network/5xx with exponential backoff (max 3 attempts) for idempotent reads; **non-idempotent** actions (QR generation, redemption) are **not** auto-retried.
- **WebSocket Usage:** While in `ValidatingState`, the client joins socket.io room `session:{id}` to receive the POS validation result and auto-transition to the Confirmation screen; if the socket drops, it falls back to polling `GET /sessions/:id` every 3 s until the 10-minute QR expiry.
- **Long-Running Processes:** Checkout validation may pause for AI fraud review (human-in-the-loop, ≤ 2 min). The screen shows a "Verificando…" status and never blocks indefinitely — it resolves on push/socket or on the expiry/timeout signal.

### Error Handling & Observability

- **Global Error Handler:** The Axios response interceptor catches all API errors and dispatches user-friendly messages to a global notification slice.
- **User-Facing Error Messages:** HTTP codes are mapped to friendly Spanish copy (e.g., expired QR → "El código expiró, genéralo de nuevo"; out-of-store scan → "Acércate a una tienda afiliada para sumar puntos").
- **Frontend Monitoring:** Sentry captures uncaught exceptions and performance traces, tagged with screen and session state.
- **Logging:** `console.*` stripped from production via Babel plugin; errors are forwarded to Sentry only.

---

## 1.7. Performance

| Strategy | Implementation |
|----------|---------------|
| **Lazy Loading** | Expo Router lazy-loads route screens; the camera module mounts only on the Scan screen to keep startup fast. |
| **Code Splitting** | Metro inline requires + route-level splitting; heavy modules (camera, QR/SVG) load on demand. |
| **Bundle Optimization** | Hermes engine with bytecode precompilation, tree-shaking, and dead-code elimination in production EAS builds. |
| **Image Optimization** | `expo-image` with disk/memory caching and `contentFit`; sponsored-product images served as WebP at device-appropriate resolution. |
| **Memoization** | `React.memo` on `ProductCard`/`RewardCard`; `useMemo`/`useCallback` for pending-points totals and list renderers; selective Zustand selectors to avoid over-rendering. |
| **Virtualization** | `FlashList` (Shopify, 1.7.x) for the rewards catalog and pending list, keeping scroll smooth as item counts grow. |
| **Caching** | TanStack Query caches product lookups and rewards (Cache-Aside); EAS Update delivers OTA JS without a full store release. |

---

## 1.8. Testing Strategy

| Level | Tool | Scope | Min. Coverage |
|-------|------|-------|---------------|
| **Unit** | Jest 29.7.0 (jest-expo 52) | Session store, command objects (incl. undo), scan-validation chain, points rules, utils | 80% |
| **Integration** | React Native Testing Library 12.8.0 | Scan-confirm modal, delete-with-undo, QR generation, manual-entry fallback, reward redemption | 70% |
| **UI / E2E** | Maestro 1.39.x | Critical flows: register → scan → generate QR → confirm → redeem | Key flows 100% |
| **Accessibility** | `@axe-core/react` + manual VoiceOver/TalkBack passes | WCAG 2.1 AA on all interactive screens | 0 critical violations |

---

## 1.9. CI/CD Pipeline (Frontend)

```
[Trigger: Push to PR / main branch]
        │
        ▼
┌─────────────────────────┐
│  1. Install & Cache Deps │
└────────────┬────────────┘
             ▼
┌─────────────────────────┐
│  2. Lint (ESLint 9)      │
└────────────┬────────────┘
             ▼
┌─────────────────────────┐
│  3. Format Check         │
│     (Prettier 3)         │
└────────────┬────────────┘
             ▼
┌─────────────────────────┐
│  4. Type Check (tsc)     │
└────────────┬────────────┘
             ▼
┌─────────────────────────┐
│  5. Unit & Integration   │
│     Tests (Jest / RTL)   │
└────────────┬────────────┘
             ▼
┌─────────────────────────┐
│  6. EAS Build (iOS/And.) │
└────────────┬────────────┘
             ▼
┌─────────────────────────┐
│  7. E2E Tests (Maestro)  │
└────────────┬────────────┘
             ▼
┌─────────────────────────┐
│  8. Deploy: EAS Update   │
│  (staging) → Submit (prod)│
└─────────────────────────┘
```

- **Tooling:** GitHub Actions for lint/type/test; `expo/expo-github-action` + EAS Build/Submit for binaries and store submission.
- **Branch Strategy:** GitHub Flow — feature branches → PR → `main`.
- **Quality Gates:** A PR cannot merge if lint, type check, tests, or build fail; minimum coverage thresholds enforced.
- **Deployment Strategy:** Merge to `main` → automatic **EAS Update** to the staging channel; manual promotion (EAS Submit) to production store tracks after QA sign-off.

---

## 1.10. Project Scaffold

- **Root:** `/src` (Expo Router routes in `/app`)

```
/src
├── /api/                  # API Facade + Cache-Aside
│   ├── client.ts          # Axios instance: interceptors, JWT refresh (Singleton)
│   └── /endpoints/        # products.ts, sessions.ts, rewards.ts, auth.ts, validation.ts
├── /assets/               # Images, fonts (Poppins, Inter), icons
├── /components/           # Reusable UI (Atomic Design)
│   ├── /atoms/            # Button, Input, Badge, PointsTag, LocationPill, Toast
│   ├── /molecules/        # ProductCard, PointsCard, ScanConfirmationModal, RewardCard, QRCodeView
│   ├── /organisms/        # BottomNav, PendingItemsList, SponsoredCarousel, RewardsCatalog
│   └── /product/decorators/  # Sponsored/NewlyScanned/Validated/LockedReward (Decorator)
├── /features/             # Feature logic & local state
│   ├── /scan/             # scannerService.ts, /strategies/ (Camera, Manual), /validation/ (CoR chain)
│   ├── /session/          # /states/ (State machine), /commands/ (Command + undo)
│   ├── /checkout/         # QR generation + validation status (WebSocket/polling)
│   └── /rewards/          # /factories/ (RewardFactory), redemption hooks
├── /hooks/                # useSession, useScan, useRewards, useAuth
├── /lib/                  # utils, constants, /i18n/ (es-CR, en)
├── /store/                # Zustand stores (sessionStore = Singleton), slices
├── /styles/               # NativeWind theme, design tokens
└── /types/                # Shared TS types & DTOs (ProductDTO, RewardDTO, SessionDTO)

/app                       # Expo Router screens
├── _layout.tsx            # Root nav + providers (Query, SafeArea, ErrorBoundary)
├── index.tsx              # Lobby
├── scan.tsx               # Camera scanning
├── checkout.tsx           # QR validation
├── confirmation.tsx       # Points credited
└── rewards.tsx            # Rewards & coupons
```
