# UX Analysis

## Test Setup

- **Platform Used:** Maze | User Research and Testing Platform
- **Prototype Link:** [https://t.maze.co/542525865]
- **Prototype Scope:** Main onboarding, product scanning, QR checkout, and rewards redemption flow
- **Number of Participants:** 5

### Defined Tasks

| # | Task Description | Success Criteria |
|---|-----------------|-----------------|
| 1 | [Follow the normal flow of the application] | [Scan and complete list and reach the rewards screen] |

---

## Test Results

### Task 1 — [Follow the normal flow of the application]

| Participant | Outcome | Duration |
|-------------|---------|----------|
| [542985010]        | Success | [00:02:13] |
| [542830539]        | Success | [00:05:20] |
| [542990056]        | Success | [00:02:57] |
| [542985511]        | Fail | [00:01:52] |

---

## Heatmaps


| Screen | Heatmap |
|--------|----------------|
|Lobby (empty) | ![MazeLobby](media/mazeLobby.jpg) |
|Camera Scanning | ![MazeScanning](media/mazeScanning.jpg) |
|Pending Items / QR Generation | ![MazePendingItems](media/mazePendingItems.jpg) |
|QR Validation | ![MazeQRValidation](media/mazeQRValidation.jpg) |
| Rewards | ![MazeRewards](media/mazeRewards.jpg) |

---

## Key Findings & Applied Corrections

| # | Finding / Problem Detected | Usability Dimension Affected | Correction Applied | Design Decision Justification |
|---|---------------------------|-----------------------------|--------------------|-------------------------------|
| 1 | Some screens give greater visual prominence to secondary actions over the intended primary action (P542990056). Correlates with P542985511's failure — this participant completed the flow in the shortest time but did not reach the goal, suggesting flow confusion rather than a readability issue. | Learnability / Visual Hierarchy | Increase the visual weight (size and color contrast) of the primary CTA on each screen; reduce the prominence of secondary controls so they do not compete with the priority action. | A clearly differentiated primary CTA reduces action ambiguity and guides the user toward the correct step in the Discover → Scan → Validate → Earn → Redeem loop without requiring exploration. |
| 2 | Users lack context about which step of the flow they are on and what action is expected from them at each screen (P542985010). | Learnability / Feedback | Add a lightweight progress indicator (e.g., "Step 2 of 3 — Scan your product") and contextual micro-copy on the key screens of the main flow. | Progress feedback aligns user expectations with the app flow, reduces navigation anxiety, and lowers the likelihood of drop-off at intermediate steps. |
| 3 | The interface presents too many visual elements simultaneously, creating a sense of overwhelm (P542830539). This participant had the highest completion time in the group (00:05:20 vs. avg ~00:02:47), directly supporting the efficiency impact. | Efficiency / Cognitive Load | Apply progressive disclosure: hide advanced or infrequent options until the user requests them; reduce the number of elements visible by default on high-density screens (lobby and product list). | Lowering information density per screen reduces cognitive load, speeds up decision-making, and improves the overall perception of product simplicity. |
| 4 | Positive finding: text legibility was rated as clear by participants (P542985511). This participant's task failure is attributed to visual hierarchy (finding #1), not typography. | N/A (positive validation) | No correction needed — retain the current typographic system. | Confirmed text clarity indicates that the font, size, and contrast decisions are appropriate for the use context. No adjustment required. |

# Frontend Design

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

| Screen | Prototype | Purpose |
|--------|----------------|---------|
| 1 — Lobby (empty) | ![1](media/wireframes/1.png) | Overview of points, sponsored products, primary scan CTA, location pill. |
| 2 — Camera Scanning | ![2](media/wireframes/2.png) | Capture barcode via camera with manual-entry fallback and in-store confirmation. |
| 3 — Lobby (1 product) | ![3](media/wireframes/3.png) | First scanned product with toast, pending-points subsection, delete option. |
| 4 — Lobby (multiple) | ![4](media/wireframes/4.png) | Full pending list with dual CTAs (scan more / generate QR). |
| 5 — QR Validation | ![5](media/wireframes/5.png) | Full-green QR + alphanumeric fallback, 10-min validity, polling status. |
| 6 — Confirmation | ![6](media/wireframes/6.png) | Points-credited hero, validated products, new total, paths to home or rewards. |
| 7 — My Rewards | ![7](media/wireframes/7.png) | Available rewards + redeemed coupons tabs; locked rewards show point deficit. |

### UX Test Results

- **Platform Used:** Maze (unmoderated remote) + in-person sessions with external design students.
- **Key Findings (expected focus areas):** discoverability of the manual-entry fallback on the scan screen; clarity of the "pending vs credited" points distinction; one-tap QR generation satisfaction.
- **Corrections Integrated:** track each finding in the Phase 1 "Key Findings & Applied Corrections" table and reflect the applied fix in the final NativeWind component styles.

---

## 1.3. Component Design Strategy

#### Atoms — `/components/atoms/`

| Component | File | How to build it |
|-----------|------|-----------------|
| `Button` | [`/components/atoms/Button.tsx`](/frontend/src/components/atoms/Button.tsx) | Stateless `Pressable`; props `variant` (`'primary' \| 'secondary' \| 'ghost'`), `label`, `icon?`, `onPress`, `disabled?`. Maps `variant` → NativeWind token classes — the single source for the primary-vs-secondary CTA hierarchy (usability Finding #1). Sets `accessibilityRole="button"` + `accessibilityLabel`. |
| `Input` | [`/components/atoms/Input.tsx`](/frontend/src/components/atoms/Input.tsx) | Controlled wrapper over RN `TextInput`; props `value`, `onChangeText`, `error?`, `keyboardType?`. Driven by React Hook Form `Controller`; renders the Zod error message; `accessibilityLabel` required. Used by the manual-barcode fallback and auth forms. |
| `Icon` | [`/components/atoms/Icon.tsx`](/frontend/src/components/atoms/Icon.tsx) | Thin wrapper over `lucide-react-native`; props `name`, `size`, `color` (from tokens). Decorative icons set `accessibilityElementsHidden`; meaningful icons pair with text. |
| `Badge` | [`/components/atoms/Badge.tsx`](/frontend/src/components/atoms/Badge.tsx) | Small label pill; props `text`, `tone` (`'neutral' \| 'new'`). Renders the "Nuevo" tag on the latest scanned item. |
| `PointsTag` | [`/components/atoms/PointsTag.tsx`](/frontend/src/components/atoms/PointsTag.tsx) | Points pill; props `points`, `state` (`'pending' \| 'credited'`). Color **and** icon by state (accent for pending, success for credited) — never color alone (a11y). |
| `LocationPill` | [`/components/atoms/LocationPill.tsx`](/frontend/src/components/atoms/LocationPill.tsx) | Props `storeName`, `verified`. Dot + text; the visual gate that signals point accrual is enabled (user inside affiliated store). |
| `Toast` | [`/components/atoms/Toast.tsx`](/frontend/src/components/atoms/Toast.tsx) | Transient banner; props `message`, `tone` (`success \| warning \| error`), `visible`. Subscribes to the global notification slice (Observer), auto-dismisses, and sets `accessibilityLiveRegion="polite"`. |

#### Molecules — `/components/molecules/`

| Component | File | How to build it |
|-----------|------|-----------------|
| `ProductCard` | [`/components/molecules/ProductCard.tsx`](/frontend/src/components/molecules/ProductCard.tsx) | Composes `Icon` + `PointsTag` + delete `Button`; props `product: ProductDTO`, `isNew?`, `onDelete`. Wrapped in `React.memo`. Delete dispatches `RemoveProductCommand` (supports undo). |
| `PointsCard` | [`/components/molecules/PointsCard.tsx`](/frontend/src/components/molecules/PointsCard.tsx) | Points total + progress bar + pending subsection; props `total`, `pending`, `nextRewardAt`. Reads from the session store via a selective Zustand selector. |
| `ScanConfirmationModal` | [`/components/molecules/ScanConfirmationModal.tsx`](/frontend/src/components/molecules/ScanConfirmationModal.tsx) | Props `product`, `onConfirm`, `onCancel`. Focus is trapped; confirm is the primary CTA. Enforces error prevention — explicit confirmation before accrual. |
| `RewardCard` | [`/components/molecules/RewardCard.tsx`](/frontend/src/components/molecules/RewardCard.tsx) | Props `reward: RewardDTO`, `balance`, `onRedeem`. Locked state shows the point deficit; redeem `Button` is disabled when `balance < reward.cost`. |
| `QRCodeView` | [`/components/molecules/QRCodeView.tsx`](/frontend/src/components/molecules/QRCodeView.tsx) | Wraps `react-native-qrcode-svg`; props `token`, `expiresAt`. Renders the alphanumeric fallback code and a countdown to the 10-minute expiry. |

#### Organisms — `/components/organisms/`

| Component | File | How to build it |
|-----------|------|-----------------|
| `BottomNav` | [`/components/organisms/BottomNav.tsx`](/frontend/src/components/organisms/BottomNav.tsx) | Tab bar (Home/Scan/Rewards/Profile); props `active`. Each tab sets `accessibilityRole="tab"`; navigation via Expo Router. |
| `PendingItemsList` | [`/components/organisms/PendingItemsList.tsx`](/frontend/src/components/organisms/PendingItemsList.tsx) | `FlashList` of `ProductCard`; props `items`, `onDelete`. Empty list renders the dashed empty-state card. |
| `SponsoredCarousel` | [`/components/organisms/SponsoredCarousel.tsx`](/frontend/src/components/organisms/SponsoredCarousel.tsx) | Horizontal list of sponsored cards; props `products`, `onSeeAll`. Implements the "Ver todos" progressive-disclosure affordance (usability Finding #3). |
| `RewardsCatalog` | [`/components/organisms/RewardsCatalog.tsx`](/frontend/src/components/organisms/RewardsCatalog.tsx) | Tabs ("Disponibles" / "Mis cupones") wrapping a list of `RewardCard` and `CouponsList`; props `rewards`, `coupons`, `balance`. |
| `CouponsList` | [`/components/organisms/CouponsList.tsx`](/frontend/src/components/organisms/CouponsList.tsx) | `FlashList` of redeemed coupons ready to use; props `coupons`. |

#### Product decorators — `/components/product/decorators/`

`SponsoredProductDecorator`, `NewlyScannedDecorator`, `ValidatedProductDecorator`, `LockedRewardDecorator` wrap a base card to add a visual state (badge / green highlight / check / lock) **without** modifying it (Decorator pattern). They are stacked per screen context — e.g. a sponsored + newly-scanned item composes two decorators.

#### Templates / Screens — `/app/`

| Screen component | Route file | How to build it |
|------------------|-----------|-----------------|
| `LobbyScreen` | [`/app/index.tsx`](/frontend/app/index.tsx) | Container: calls `useSession`, composes `PointsCard` + `SponsoredCarousel` + `PendingItemsList` + `BottomNav`. |
| `ScanScreen` | [`/app/scan.tsx`](/frontend/app/scan.tsx) | Container: calls `useScan` (Strategy: camera/manual), mounts the camera, renders `ScanConfirmationModal`. |
| `QRValidationScreen` | [`/app/checkout.tsx`](/frontend/app/checkout.tsx) | Container: calls the checkout hook (socket/poll), renders `QRCodeView` + waiting status. |
| `ConfirmationScreen` | [`/app/confirmation.tsx`](/frontend/app/confirmation.tsx) | Container: renders the credited-points hero, validated list, and home/rewards CTAs. |
| `RewardsScreen` | [`/app/rewards.tsx`](/frontend/app/rewards.tsx) | Container: calls `useRewards`, composes `RewardsCatalog`. |

Screens are **containers**: they own data/state (hooks + stores), compose organisms, and pass plain props down. Presentational children hold no business logic (Container/Presentational split).

---

## 1.4. Security

The authentication, session, and authorization classes are modeled below; the
`Authentication`, `Session Management`, and `Authorization (RBAC)` subsections
each reference it.

```mermaid
classDiagram
    class AuthService {
        -api: ApiClient
        -tokens: ITokenStore
        -session: AuthSessionStore
        +login(email: string, pwd: string) AuthUser
        +logout() void
        +refresh() string
    }

    class ITokenStore {
        <<interface>>
        +getAccess() string
        +getRefresh() string
        +setTokens(access: string, refresh: string) void
        +clear() void
    }

    class SecureTokenStore {
        -store: SecureStore
        +getAccess() string
        +getRefresh() string
        +setTokens(access: string, refresh: string) void
        +clear() void
    }

    class ApiClient {
        -instance: AxiosInstance
        -refreshQueue: RefreshQueue
        +request(config) Response
        -attachBearer(config) config
        -onUnauthorized(error) Response
    }

    class RefreshQueue {
        -inFlight: Promise~string~
        -waiters: Request[]
        +enqueue(req: Request) Response
        +runRefresh() string
    }

    class AuthSessionStore {
        +user: AuthUser
        +role: Role
        +status: SessionStatus
        +setSession(user: AuthUser) void
        +reset() void
    }

    class AuthUser {
        +id: string
        +email: string
        +role: Role
    }

    class Role {
        <<enumeration>>
        USER
        BACKOFFICE_OPERATOR
        CATALOG_MANAGER
        STORE_ADMIN
        SUPER_ADMIN
    }

    class SessionStatus {
        <<enumeration>>
        ANONYMOUS
        AUTHENTICATED
        REFRESHING
        EXPIRED
    }

    SecureTokenStore ..|> ITokenStore
    AuthService --> ITokenStore : reads/writes tokens
    AuthService --> ApiClient : sends requests
    AuthService --> AuthSessionStore : updates session
    ApiClient --> RefreshQueue : single-flight refresh
    ApiClient --> ITokenStore : attaches Bearer
    AuthSessionStore --> AuthUser
    AuthSessionStore --> SessionStatus
    AuthUser --> Role
```

### Authentication

- **Provider / Method:** JWT (access + refresh) issued by the SmartCart backend.
- **Flow:**
  1. User submits email + password (validated client-side with Zod).
  2. Backend validates credentials and returns an access token (short-lived) and a refresh token.
  3. Frontend stores both tokens in **expo-secure-store** (Keychain/Keystore) — never in `AsyncStorage`.
  4. The Axios request interceptor attaches `Authorization: Bearer <access>` to every protected request.
  5. On a `401`, the response interceptor uses the refresh token to obtain a new access token once, then retries the original request; concurrent requests queue behind a single refresh.

### Authorization (RBAC)

This **consumer mobile app only ever authenticates `USER`-scoped accounts** — it never issues a privileged token. The back office is a **separate web tool** and, importantly, is **not staffed only by admins**: it has several distinct non-admin operational roles. All roles are documented here because RBAC is a shared, server-enforced concern.

| Role | Surface | Key permissions |
|------|---------|-----------------|
| `USER` | **This mobile app** | Scan products, manage pending session, generate checkout QR, browse/redeem rewards, view own points history |
| `BACKOFFICE_OPERATOR` | Back-office fraud dashboard | Review the HITL queue: approve/reject high-risk `ReviewItem`s coming from the `FraudDetectionAgent`. **Cannot** review a session they are party to (segregation of duties). No catalog or user-management rights. |
| `CATALOG_MANAGER` | Back-office | Manage the product catalog & sponsored list, edit daily promotions, trigger `ProductCacheService.invalidateAllPromotions()`. No fraud-review or user-management rights. |
| `STORE_ADMIN` | Back-office | Per-store analytics, rewards-catalog configuration, monitor validations for their store(s). No global user management. |
| `SUPER_ADMIN` | Back-office | User & role management, cross-store administration, configure fraud-risk thresholds. Full back-office authority. |

### Session Management

- **Token Expiry:** Access token **15 min** / Refresh token **7 days**. On access-token expiry the `ApiClient` response interceptor transitions `AuthSessionStore.status` to `REFRESHING`.
- **Refresh Strategy:** Silent refresh handled by `ApiClient.onUnauthorized()` on `401`. `RefreshQueue` guarantees a **single in-flight refresh** (`runRefresh()`): concurrent requests are queued behind one promise and replayed once a new access token arrives. If the **refresh request itself returns `401`** (refresh token expired/revoked), the queue rejects all waiters and triggers a **hard logout** (`status → EXPIRED`).
- **Storage Decision:** `SecureTokenStore` wraps `expo-secure-store` (hardware-backed Keychain/Keystore) instead of `AsyncStorage`/`localStorage`, because tokens are sensitive and `AsyncStorage` is unencrypted on device. `ITokenStore` is the injected interface, so the store is mockable in tests.
- **Logout Behavior:** `SecureTokenStore.clear()` wipes both tokens; the refresh token is revoked **server-side**; `AuthSessionStore.reset()` returns status to `ANONYMOUS`; the React Query cache is cleared to drop any user-scoped data.

### Secure Configuration

- **Environment Variables:** Managed per environment via `app.config.ts` `extra` + EAS environment variables; only non-secret, public config (API base URL) is bundled. No secrets committed to VCS.
- **Secret Management Platform:** EAS Secrets for build-time values; the mobile client holds **no** server secrets (POS/B2B API keys live exclusively in the backend).

### OWASP Compliance

| MASVS control group | Risk it addresses | What we will do (how) | Validation criterion |
|---------------------|-------------------|-----------------------|----------------------|
| **MASVS-STORAGE** (data storage) | A lost/stolen phone could leak session tokens and personal data. | Persist access/refresh tokens **only** in the hardware-backed Keychain/Keystore via `SecureTokenStore`; never `AsyncStorage`; strip PII from logs/analytics. | Device-dump test recovers no token/PII; unit test asserts writes go only to secure-store. |
| **MASVS-CRYPTO** (cryptography) | Home-grown or misused cryptography can be broken, exposing secrets. | Rely **only** on platform crypto (`expo-secure-store`, TLS); no hand-rolled crypto; no secrets in the bundle (EAS Secrets only). | Secret/SCA scan finds no bundled secrets or custom crypto primitives; build config shows EAS Secrets injection only. |
| **MASVS-NETWORK** (network comms) | Traffic over untrusted networks can be intercepted (man-in-the-middle). | HTTPS-only with TLS 1.2+; iOS ATS enabled / Android cleartext **disabled**; optional certificate pinning on the API host. | MITM-proxy test cannot read traffic; a cleartext request is blocked; ATS/cleartext config asserted in native config. |
| **MASVS-AUTH** (authentication) | Stolen tokens or weak auth let attackers hijack accounts or escalate roles. | Short-lived JWT (15 min) + server-side refresh revocation; server-enforced **RBAC** (see Authorization above); biometric re-auth as a future option. | Expired/revoked refresh token forces hard logout; a `USER`-scoped token is rejected on back-office endpoints. |
| **MASVS-PLATFORM** (platform interaction) | Unvalidated input or over-broad permissions enable injection and data leakage. | Validate **all** input with Zod (manual barcode + auth forms); request **least-privilege** native permissions (camera/location) only when needed; keep sensitive data out of screenshots/`pasteboard`. | Malformed barcode/form input rejected by Zod schema tests; permission prompts fire only on use; sensitive screens flagged no-screenshot. |
| **MASVS-CODE** (code quality) | Vulnerable dependencies or trusting client-supplied IDs (IDOR) expose data. | Pin dependencies + run `npm audit` / SCA gate in CI; Zod runtime guards on every API DTO; server-side per-token authorization so the client never trusts raw IDs. | CI fails on high-severity advisories; DTO contract tests reject malformed payloads; a cross-user ID request returns 403 from the server. |
| **MASVS-RESILIENCE** (anti-tampering) | A tampered or reverse-engineered build could be repackaged or abused. | Strip `console.*` in production; ship **Hermes bytecode**; Sentry monitors anomalies; optional jailbreak/root detection signal. | Release bundle contains no `console.*` and uses Hermes bytecode; Sentry receives anomaly events; a root/jailbreak flag is emitted on a compromised device. |

---

## 1.5. Layered Architecture

- **Layer Responsibilities:**

| Layer | Responsibility | Examples |
|-------|---------------|----------|
| Presentation | Render UI, handle gestures/events | Screens, atoms/molecules/organisms |
| Application / Use Cases | Orchestrate use cases: drive the session flow, apply Domain rules, reach Infrastructure through interfaces | Custom hooks, Zustand session store (**Singleton**), **Command** objects (Add/Remove/GenerateQR/Redeem), session **State** machine + states, scan-validation **Chain of Responsibility** |
| Domain | Pure business entities & rules — no React, no Infrastructure | `Product`/`ProductDTO`, `Reward`/`RewardDTO`, points rules, barcode-format & scan-validation rules, reward-type definitions (**Factory** products) |
| Infrastructure | External communication & device APIs | Axios client (**Facade**), socket.io client, React Query cache (**Cache-Aside**), secure-store, camera/BLE adapters (**Strategy**) |

- **Layer Access Rules:** Presentation may call only the Application layer (hooks/stores). Application drives the session **State** machine, dispatches **Command** objects, and runs the scan-validation **chain** — applying Domain rules and reaching Infrastructure only through interfaces. **Domain stays pure** — entities and rules with no imports of Infrastructure or React, so it remains unit-testable in isolation.

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
        VAL[Scan Validation Chain · CoR]
    end

    subgraph Domain
        ENT[Entities · Product, Reward]
        RULES[Points Rules]
        VRULES[Validation Rules]
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

### Asynchronous Operations

| # | Operation | Trigger | Mechanism | Loading state | Retry policy | Error handling |
|---|-----------|---------|-----------|---------------|--------------|----------------|
| 1 | **Product catalog lookup** | Barcode scanned | TanStack Query over the backend **Cache-Aside** (`async/await` + Axios) | Inline skeleton on the scan-confirm modal | **Auto** retry on network/5xx, exponential backoff (max 3) — *idempotent read* | Fallback message "Servicio temporalmente no disponible"; user can retry |
| 2 | **Scan validation (CoR)** | After a successful lookup | Chain of Responsibility (format → location → sponsored → duplicate) | Spinner on the confirm action | **No** retry — re-scan instead | Inline reason: out-of-store / invalid / duplicate |
| 3 | **QR generation** | Tap "Generar QR de salida" | `POST` via `GenerateQRCommand` — **non-idempotent** | Spinner on the primary button | **No** auto-retry; manual retry only (avoids duplicate codes) | Toast error; session left unchanged |
| 4 | **POS validation status** | QR shown (`ValidatingState`) | socket.io room `session:{id}`, **fallback polling** `GET /sessions/:id` every 3 s | "Esperando validación de la cajera…" | Reconnect / keep polling until the 10-min expiry | Expiry/timeout → QR expired, prompt to regenerate |
| 5 | **Fraud review (HITL)** | During POS validation | Backend human-in-the-loop, asynchronous, ≤ 2 min | "Verificando…" | n/a — resolves on push/socket or timeout | Never blocks indefinitely; timeout auto-resolves the session |
| 6 | **Reward redemption** | Tap "Canjear" | `POST` via `RedeemCouponCommand` — **non-idempotent** | Spinner on the redeem button | **No** auto-retry | Toast error; points balance stays intact |
| 7 | **Login / token refresh** | `401` on a protected request | `RefreshQueue` **single-flight** refresh (see §1.4) | Silent (no UI) | One in-flight refresh; concurrent requests queue behind it | Refresh `401` → hard logout (`status → EXPIRED`) |

**Cross-cutting (apply to all of the above):**

- **Loading States:** Skeleton placeholders for the sponsored carousel and rewards catalog; an animated scan line signals active barcode processing (operations 1–2).
- **Error Boundaries:** A React Error Boundary per feature (`scan`, `checkout`, `rewards`) prevents a single failure from crashing the app.

### Error Handling & Observability

Errors are handled by a single pipeline: every API error is caught by the Axios response interceptor (`ApiClient`, the **Facade** from §1.4), normalized into a typed `AppError` by `ApiErrorMapper`, and then either retried, refreshed, or surfaced to the user through the global `NotificationSlice` (which `Toast` observes — **Observer**, §1.3). Render-time crashes are caught by per-feature Error Boundaries. The design below makes the components, the error taxonomy, and the flow explicit.

#### Components

```mermaid
classDiagram
    class ApiClient {
        -instance: AxiosInstance
        +request(config) Response
        -onError(error) AppError
    }

    class ApiErrorMapper {
        +toAppError(error: AxiosError) AppError
        -mapStatus(status: number) ErrorCode
        -resolveMessage(code: ErrorCode) string
    }

    class AppError {
        +code: ErrorCode
        +userMessage: string
        +severity: Severity
        +retryable: boolean
        +context: Record~string, any~
    }

    class ErrorCode {
        <<enumeration>>
        NETWORK_ERROR
        SERVER_ERROR
        SESSION_EXPIRED
        SCAN_OUT_OF_STORE
        SCAN_REJECTED
        QR_EXPIRED
        VALIDATION_REJECTED
        UNKNOWN
    }

    class Severity {
        <<enumeration>>
        INFO
        WARNING
        ERROR
    }

    class NotificationSlice {
        +current: AppError
        +notify(error: AppError) void
        +dismiss() void
    }

    class Toast {
        +message: string
        +tone: Tone
        +onShow(error: AppError) void
    }

    class FeatureErrorBoundary {
        +feature: string
        +componentDidCatch(error, info) void
        +renderFallback() ReactNode
    }

    class Monitoring {
        +captureException(error: AppError) void
        +captureRenderError(error, info) void
    }

    ApiClient --> ApiErrorMapper : normalizes
    ApiErrorMapper --> AppError : produces
    AppError --> ErrorCode
    AppError --> Severity
    ApiClient --> NotificationSlice : dispatches non-retryable
    NotificationSlice --> Toast : observed by
    ApiClient --> Monitoring : reports ERROR severity
    FeatureErrorBoundary --> Monitoring : reports render crashes
```

#### Error taxonomy

| Category | Origin / Trigger | `AppError` code | User message (es) | Retryable | Sentry |
|----------|------------------|-----------------|-------------------|-----------|--------|
| Network / offline | No connectivity | `NETWORK_ERROR` | "Sin conexión. Reintentando…" | Yes (auto, op. 1) | Breadcrumb |
| Server unavailable | Backend 5xx / `ProductLookupException` | `SERVER_ERROR` | "Servicio temporalmente no disponible" | Yes (idempotent reads only) | Yes |
| Session expired | Refresh `401` (hard logout) | `SESSION_EXPIRED` | "Tu sesión expiró, inicia de nuevo" | No | Yes |
| Out-of-store scan | `LocationHandler` rejects (CoR) | `SCAN_OUT_OF_STORE` | "Acércate a una tienda afiliada para sumar puntos" | No (user action) | No |
| Invalid / duplicate scan | Format or `DuplicateScanHandler` rejects | `SCAN_REJECTED` | "Producto no válido o ya está en tu lista" | No (re-scan) | No |
| Expired QR | QR > 10 min at POS | `QR_EXPIRED` | "El código expiró, genéralo de nuevo" | Regenerate | No |
| Validation rejected | POS / fraud review rejects | `VALIDATION_REJECTED` | "No pudimos verificar tu compra" | No | Yes |
| Render crash | Component throws | (caught by `FeatureErrorBoundary`) | "Algo salió mal. Vuelve a intentarlo." | Reload feature | Yes |

#### Flow

```mermaid
flowchart TD
    ERR[Error origin] --> INT[ApiClient response interceptor]
    INT --> MAP[ApiErrorMapper - toAppError]
    MAP --> DEC{AppError type}
    DEC -->|retryable| RQ[React Query retry - backoff]
    DEC -->|auth 401| REFRESH[RefreshQueue single-flight]
    DEC -->|otherwise| NS[NotificationSlice.notify]
    NS --> TOAST[Toast - Observer]
    REFRESH -->|refresh 401| LOGOUT[Hard logout - EXPIRED]
    RENDER[Render crash] --> EB[FeatureErrorBoundary]
    EB --> FB[Fallback UI]
    NS --> SENTRY[Sentry]
    EB --> SENTRY
    INT --> SENTRY
```

- **Frontend Monitoring:** Sentry captures uncaught exceptions and performance traces, tagged with screen and session state.
- **Logging:** `console.*` stripped from production via Babel plugin; errors are forwarded to Sentry only.

---

## 1.7. Performance

| Strategy | Where (file / config) | How |
|----------|-----------------------|-----|
| **Lazy Loading** | `/app/*.tsx` (Expo Router routes), `/app/scan.tsx` | Expo Router code-loads each route on demand by default. Mount the camera only while the Scan route is focused — gate `<CameraView>` behind `useIsFocused()` so it unmounts on blur. |
| **Code Splitting** | `metro.config.js`, `/features/*` | Enable `transformer.inlineRequires` in Metro. Import heavy modules (`expo-camera`, `react-native-qrcode-svg`) **inside** their feature module, never from a root barrel, so Metro splits them out. |
| **Bundle Optimization** | `app.json` (`jsEngine: "hermes"`), `eas.json` (`production` profile) | Ship the Hermes engine (bytecode precompile); the production EAS profile enables minify + tree-shaking + dead-code elimination. Verify bundle output with `npx expo export`. |
| **Image Optimization** | `/components/molecules/ProductCard.tsx`, `/components/organisms/SponsoredCarousel.tsx` | Use `expo-image`'s `<Image>` with `cachePolicy="memory-disk"` and `contentFit="cover"`; serve sponsored images as WebP at device-appropriate resolution. |
| **Memoization** | `/components/molecules/ProductCard.tsx`, `RewardCard.tsx`, `/store/sessionStore.ts`, `/hooks/` | Wrap list items in `React.memo`; compute pending-points totals with `useMemo` and pass stable callbacks via `useCallback`; read state with selective Zustand selectors (`useSessionStore(s => s.pending)`) to avoid whole-store re-renders. |
| **Virtualization** | `/components/organisms/PendingItemsList.tsx`, `RewardsCatalog.tsx`, `CouponsList.tsx` | Render long lists with `FlashList` (1.7.x) instead of `FlatList`; set `estimatedItemSize` and a stable `keyExtractor`. |
| **Caching** | `/api/`, `QueryClient` in `/app/_layout.tsx`, `eas.json` | Configure per-query `staleTime`/`gcTime` on the TanStack Query client (Cache-Aside for product/rewards lookups); ship JS-only fixes via `eas update` (OTA) without a store release. |

---

## 1.8. Testing Strategy

| Level | Tool | Where (location / naming) | How | Min. Coverage |
|-------|------|---------------------------|-----|---------------|
| **Unit** | Jest 29.7.0 (jest-expo 52) | `__tests__/*.test.ts` co-located beside source: `/features/session/commands/`, `/features/scan/validation/`, `/store/`, `/lib/`; config in `jest.config.js` + `jest.setup.ts` | Pure-logic tests with mocked dependencies: command objects incl. `undo`, each CoR validation handler in isolation, points rules. No rendering. | 80% |
| **Integration** | React Native Testing Library 12.8.0 | `/components/**/__tests__/*.test.tsx` | `render()` the component, drive it with `fireEvent`/`userEvent`, assert via accessibility queries (`getByRole`/`getByLabelText`); mock the API layer (jest mocks / MSW). Covers scan-confirm modal, delete-with-undo, QR generation, manual-entry fallback, redemption. | 70% |
| **UI / E2E** | Maestro 1.39.x | `.maestro/*.yaml` flow files | One YAML flow per critical journey (register → scan → generate QR → confirm → redeem); run with `maestro test .maestro/` locally and in CI. | Key flows 100% |
| **Accessibility** | `@axe-core/react` + manual VoiceOver/TalkBack passes | Component `__tests__` (automated) + manual device passes | Wire `@axe-core/react` in dev and assert no violations in component tests; complete manual VoiceOver (iOS) / TalkBack (Android) passes on each interactive screen. | 0 critical violations |

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

The pipeline is defined in **`.github/workflows/ci.yml`**; each step runs an `npm` script from `package.json` or an EAS command driven by `eas.json`. The `EXPO_TOKEN` secret lives in the GitHub repo settings (Settings → Secrets).

| Step | Where (file / config) | How |
|------|-----------------------|-----|
| 1. Install & cache | `ci.yml`, `package.json` | `actions/setup-node` with `cache: npm`, then `npm ci` |
| 2. Lint | `ci.yml` → `npm run lint` | ESLint 9 flat config (`eslint.config.js`) |
| 3. Format check | `ci.yml` → `npm run format:check` | `prettier --check .` |
| 4. Type check | `ci.yml` → `npm run typecheck` | `tsc --noEmit` |
| 5. Unit & integration | `ci.yml` → `npm test -- --coverage` | Jest + RTL; fails below the §1.8 coverage thresholds |
| 6. EAS Build | `ci.yml`, `eas.json` (`production` profile) | `eas build --platform all --profile production --non-interactive` via `expo/expo-github-action` (auth with `EXPO_TOKEN`) |
| 7. E2E | `ci.yml`, `.maestro/` | `maestro test .maestro/` against the build artifact |
| 8. Deploy | `ci.yml`, `eas.json` | `eas update --branch staging` on merge → `eas submit` to store tracks after QA |

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

# Project root — config & tooling
├── app.json               # Expo config (jsEngine: hermes) — §1.7 Bundle Optimization
├── eas.json               # EAS Build/Update/Submit profiles — §1.7, §1.9
├── metro.config.js        # Metro bundler (inlineRequires) — §1.7 Code Splitting
├── package.json           # Scripts: lint, format:check, typecheck, test — §1.9
├── eslint.config.js       # ESLint 9 flat config — §1.9
├── jest.config.js         # Jest (jest-expo preset) — §1.8
├── jest.setup.ts          # Test setup (RTL, @axe-core/react) — §1.8
├── /.maestro/             # Maestro E2E flow files (*.yaml) — §1.8, §1.9
└── /.github/workflows/    # ci.yml — lint → test → EAS build → E2E → deploy — §1.9
```

> **Test placement:** unit and integration tests are **co-located** with the code they cover, in
> `__tests__/` folders or `*.test.ts(x)` files (e.g. `/features/session/commands/__tests__/`,
> `/components/molecules/__tests__/`). E2E flows live separately in `/.maestro/`. See §1.8.



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

### El siguiente stack es la evolución hacia un despliegue completo:

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

## 2.2. Architecture

- **Pattern:** Modular Monolith with Independent Worker Process — SmartCart is built as a single NestJS application with strictly separated modules per functional domain, plus a physically independent BullMQ worker process for the consumer profiling pipeline. This architectural decision is grounded in five concrete technical justifications:

- **Single deployable artifact with logical boundaries:** The entire API runs as one Node.js process, deployed as one Docker container. Module boundaries are enforced at build time via TypeScript path aliases and ESLint import rules (no-restricted-imports), not at runtime via network calls. This means zero serialization/deserialization overhead between modules while maintaining strict separation of concerns. See eslint.config.mjs:

```
// eslint.config.mjs — Enforces module boundaries at lint level
export default [
  {
    rules: {
      'no-restricted-imports': ['error', {
        patterns: [
          { group: ['../checkout/domain/*'], message: 'Use ICheckoutService interface instead' },
          { group: ['../catalog/infrastructure/*'], message: 'Infrastructure must be accessed through interfaces' },
        ],
      }],
    },
  },
];
---

**Type-safe contract sharing with the frontend:** The monorepo structure (packages/shared-types/) exports TypeScript interfaces and Zod schemas consumed by both apps/api and the React Native frontend. Changing a DTO breaks both sides at compile time, eliminating contract drift. See packages/shared-types/src/checkout.types.ts:
---
// packages/shared-types/src/checkout.types.ts
// This file is imported by BOTH NestJS and React Native
export interface AddItemRequest {
  barcode: string;
  sessionId: string;
}

export interface AddItemResponse {
  item: ProductDTO;
  session: SessionDTO;
}

// Zod schema for runtime validation — used by NestJS ValidationPipe
export const AddItemRequestSchema = z.object({
  barcode: z.string().min(8).max(14),
  sessionId: z.string().uuid(),
});
```

- **ACID transactions without distributed complexity:** The checkout validation flow requires atomicity across multiple aggregate roots (session status update, points balance mutation, transaction audit entry). Prisma executes this in a single PostgreSQL transaction. The service method at apps/api/src/modules/checkout/application/services/checkout.service.ts demonstrates this:

```
// apps/api/src/modules/checkout/application/services/checkout.service.ts
@Injectable()
export class CheckoutService {
  constructor(
    private readonly prisma: PrismaService, // Transaction host
    private readonly sessionRepo: ISessionRepository,
    private readonly pointsService: IPointsService,
    private readonly eventPublisher: IEventPublisher,
  ) {}

  async validateSession(
    qrToken: string,
    scannedItems: ScannedItemDTO[],
  ): Promise<ValidationResult> {
    // Single ACID transaction across session + points aggregates
    return this.prisma.$transaction(async (tx) => {
      const session = await this.sessionRepo.findById(qrPayload.sessionId, tx);
      session.validateItems(scannedItems); // Domain method — throws on mismatch
      const points = this.pointsService.calculatePoints(session.items);
      await this.sessionRepo.markCompleted(session.id, tx);
      await this.pointsService.creditPoints(session.userId, points, session.id, tx);
      return { success: true, sessionId: session.id, pointsAwarded: points };
    });
    // After commit — non-blocking side effect
    await this.eventPublisher.publish(new CheckoutCompletedEvent(/*...*/));
  }
}
```

- **Physical separation where the requirement demands it:** The consumer profiling pipeline (aggregation → feature extraction → AI classification → B2B export) is a long-running process triggered by checkout completion. It must not block the POS validation response. By extracting it to a BullMQ worker in apps/analytics-worker/src/processors/profile-update.processor.ts, we satisfy the "long-running processes" and "asynchronous communication" requirements without fragmenting the transactional domain:

```
// apps/analytics-worker/src/processors/profile-update.processor.ts
@Processor('analytics-profile-update')
export class ProfileUpdateProcessor {
  constructor(
    private readonly aggregator: ProfileAggregatorService,
    private readonly aiClient: AiInferenceClient,
    private readonly segmentRepo: SegmentRepository,
  ) {}

  @Process('profile-update')
  async handleProfileUpdate(job: Job<CheckoutCompletedEvent>): Promise<void> {
    // Step 1: Aggregate 90-day window (heavy query, runs async)
    const features = await this.aggregator.aggregateFeatures(job.data.userId);
    // Step 2: Call external AI (network call, could be slow)
    const segment = await this.aiClient.classify(features);
    // Step 3: Persist result
    await this.segmentRepo.upsert(job.data.userId, segment);
  }
}
```

- **Evolutionary path to Serverless without rewrites:** Each module exposes its functionality through a TypeScript interface in the application/ layer. NestJS DI binds the interface to its implementation in *.module.ts. To migrate a module to AWS Lambda, only the binding changes — the domain logic remains untouched:

```
// apps/api/src/modules/catalog/catalog.module.ts — Current: in-process
@Module({
  providers: [
    { provide: 'ICatalogService', useClass: PrismaCatalogService }, // ← Local
  ],
})
export class CatalogModule {}

// Evolution — Future: remote Lambda via HTTP
@Module({
  providers: [
    { provide: 'ICatalogService', useClass: HttpCatalogServiceClient }, // ← Remote
    { provide: 'CATALOG_SERVICE_URL', useValue: process.env.CATALOG_SERVICE_URL },
  ],
})
export class CatalogModule {}
```

- **Layered Design:** The architecture employs a strict four-layer structure within each NestJS module, enforced by folder conventions and TypeScript compilation checks.

| Layer | Responsibility | Path Convention | Example |
|---|---|---|---|
| Presentation | Receive HTTP requests and WebSocket connections. Validate input DTOs using Zod schemas and ValidationPipe. Transform application-layer results into HTTP responses or WS events. Must not contain business logic. | src/modules/{domain}/presentation/ | apps/api/src/modules/checkout/presentation/controllers/session.controller.ts |
| Application | Orchestrate business logic across domain entities and infrastructure services. Publish domain events after transaction commits. Must not access databases or external APIs directly — only through injected interfaces. | src/modules/{domain}/application/ | apps/api/src/modules/checkout/application/services/checkout.service.ts |
| Domain | Pure TypeScript entities, value objects, domain events, business rules, and strategy interfaces. Must not import from NestJS, Prisma, or any infrastructure package. | src/modules/{domain}/domain/ | apps/api/src/modules/checkout/domain/entities/shopping-session.entity.ts |
| Infrastructure | Concrete implementations of interfaces defined in the application/domain layers: Prisma repositories, BullMQ publishers, S3 storage clients, JWT signers. | src/modules/{domain}/infrastructure/ | apps/api/src/modules/checkout/infrastructure/repositories/prisma-session.repository.ts |



**Layer Rules:** The dependency direction is strictly inward. These rules are verified at build time and enforced by the NestJS DI container at runtime.
- **Domain → Nothing (Pure TypeScript):** The domain layer has zero external dependencies. It cannot import from @nestjs/common, @prisma/client, or any infrastructure/ folder. This is verified by the tsconfig.json paths configuration that blocks certain imports. See apps/api/src/modules/checkout/domain/entities/shopping-session.entity.ts:

```
// apps/api/src/modules/checkout/domain/entities/shopping-session.entity.ts
// ZERO imports from NestJS, Prisma, or infrastructure

import { SessionItem } from './session-item.entity';
import { SessionStatus } from '../value-objects/session-status.enum';
import { ValidationFailedError } from '../errors/validation-failed.error';

export class ShoppingSession {
  private _status: SessionStatus;
  private readonly _items: SessionItem[] = [];

  constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly storeId: string,
    public readonly createdAt: Date,
  ) {
    this._status = SessionStatus.ACTIVE;
  }

  // Business rule: Only ACTIVE sessions can accept items
  addItem(item: SessionItem): void {
    if (this._status !== SessionStatus.ACTIVE) {
      throw new SessionNotActiveError(this.id, this._status);
    }
    this._items.push(item);
  }

  // Business rule: Transition to PENDING_CHECKOUT requires at least 1 item
  requestCheckout(): void {
    if (this._items.length === 0) {
      throw new EmptySessionError(this.id);
    }
    this._status = SessionStatus.PENDING_CHECKOUT;
  }

  // Business rule: Validation compares item hashes
  validateItems(scannedItems: ScannedItem[]): boolean {
    const sessionHash = this.computeItemHash();
    const scannedHash = this.computeScannedHash(scannedItems);
    if (sessionHash !== scannedHash) {
      throw new ValidationFailedError(this.id, sessionHash, scannedHash);
    }
    this._status = SessionStatus.COMPLETED;
    return true;
  }

  // Pure domain logic — no side effects, no I/O
  private computeItemHash(): string {
    const data = this._items
      .sort((a, b) => a.barcode.localeCompare(b.barcode))
      .map(i => `${i.barcode}:${i.quantity}`)
      .join('|');
    return createHash('sha256').update(data).digest('hex');
  }

  get status(): SessionStatus { return this._status; }
  get items(): ReadonlyArray<SessionItem> { return this._items; }
}
```

- **Application → Domain Entities + Infrastructure Interfaces (not implementations):** Application services import domain entities and infrastructure interfaces (ISessionRepository, IEventPublisher). They never import concrete classes from infrastructure/. NestJS DI injects the concrete implementations at runtime. See apps/api/src/modules/checkout/application/services/checkout.service.ts (constructor shown above).

- **Infrastructure → Domain Entities + Implements Application Interfaces:** Infrastructure classes import domain entities (to map to/from database rows) and implement interfaces from the application layer. See apps/api/src/modules/checkout/infrastructure/repositories/prisma-session.repository.ts:

```
// apps/api/src/modules/checkout/infrastructure/repositories/prisma-session.repository.ts
import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { ISessionRepository } from '../../application/interfaces/session-repository.interface';
import { ShoppingSession } from '../../domain/entities/shopping-session.entity';
import { SessionItem } from '../../domain/entities/session-item.entity';
import { SessionMapper } from '../mappers/session.mapper';

@Injectable()
export class PrismaSessionRepository implements ISessionRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(
    id: string,
    tx?: Prisma.TransactionClient,
  ): Promise<ShoppingSession | null> {
    const client = tx ?? this.prisma;
    const row = await client.shoppingSession.findUnique({
      where: { id },
      include: { items: true },
    });
    return row ? SessionMapper.toDomain(row) : null; // Row → Domain Entity
  }

  async save(session: ShoppingSession, tx?: Prisma.TransactionClient): Promise<void> {
    const client = tx ?? this.prisma;
    const data = SessionMapper.toPersistence(session); // Domain Entity → Row
    await client.shoppingSession.upsert({
      where: { id: session.id },
      create: data,
      update: data,
    });
  }
}
```

- **Presentation → Application Services Only:** Controllers inject application services and call their methods. They never access repositories, domain entities, or Prisma directly. They receive raw HTTP data and return DTOs. See apps/api/src/modules/checkout/presentation/controllers/session.controller.ts:

```
// apps/api/src/modules/checkout/presentation/controllers/session.controller.ts
import { Controller, Post, Body, Param, UseGuards } from '@nestjs/common';
import { CheckoutService } from '../../application/services/checkout.service';
import { AddItemRequestSchema, AddItemRequest } from '@smartcart/shared-types';
import { ZodValidationPipe } from '../../../../common/pipes/zod-validation.pipe';
import { CurrentUser } from '../../../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../../../common/guards/jwt-auth.guard';

@Controller('sessions')
@UseGuards(JwtAuthGuard)
export class SessionController {
  constructor(
    private readonly checkoutService: CheckoutService, // ← Application service only
  ) {}

  @Post(':id/items')
  async addItem(
    @Param('id') sessionId: string,
    @Body(new ZodValidationPipe(AddItemRequestSchema)) body: AddItemRequest,
    @CurrentUser() user: JwtPayload,
  ) {
    // Presentation: validate input, extract auth context, delegate
    const result = await this.checkoutService.addItem(sessionId, body.barcode);
    // Presentation: map to HTTP response
    return { item: result.item, session: result.session };
  }
}
```

- **Dependency Injection as the sole coupling mechanism:** NestJS acts as the inversion-of-control container. Module files bind interfaces to implementations. See apps/api/src/modules/checkout/checkout.module.ts:

```
// apps/api/src/modules/checkout/checkout.module.ts
import { Module } from '@nestjs/common';
import { PrismaModule } from '../../common/prisma/prisma.module';
import { SessionController } from './presentation/controllers/session.controller';
import { ValidationController } from './presentation/controllers/validation.controller';
import { CheckoutService } from './application/services/checkout.service';
import { PrismaSessionRepository } from './infrastructure/repositories/prisma-session.repository';
import { BullMqEventPublisher } from './infrastructure/events/bullmq-event.publisher';
import { JwtQrSigner } from './infrastructure/crypto/jwt-qr.signer';
import { PointsService } from './application/services/points.service';

@Module({
  imports: [PrismaModule],
  controllers: [SessionController, ValidationController],
  providers: [
    CheckoutService,
    PointsService,
    // Interface bindings — swap implementations here to evolve to Serverless
    { provide: 'ISessionRepository', useClass: PrismaSessionRepository },
    { provide: 'IEventPublisher', useClass: BullMqEventPublisher },
    { provide: 'IQrSigner', useClass: JwtQrSigner },
  ],
  exports: ['ISessionRepository'], // Available to other modules if needed
})
export class CheckoutModule {}
```

#### Cross-Layer Dependency Flow (Visual)
```mermaid
flowchart TD
    %% Core Nodes
    P["Presentation<br/>(controllers, gateways)"]
    A["Application<br/>(services)"]
    D["Domain<br/>(entities, value objects, events, interfaces)"]
    I["Infrastructure<br/>(Prisma repos, BullMQ, S3, JWT)"]

    %% Standard Relationships
    P -- "imports" --> A
    A -- "imports domain entities" --> D
    I -- "implements" --> D

    %% Negative Constraints
    P -. "❌ NEVER imports domain directly" .-> D

    %% Key Rule Node
    KR["**KEY RULE:**<br/>All arrows point inward toward Domain.<br/>Domain has NO outgoing arrows to external packages."]

    %% Layout positioning
    D ~~~ KR
    I ~~~ KR

    %% Styles
    classDef default fill:#f8f9fa,stroke:#ced4da,stroke-width:2px,color:#212529;
    classDef domain fill:#e8f5e9,stroke:#2e7d32,stroke-width:2px,color:#1b5e20;
    classDef rule fill:#fff3cd,stroke:#856404,stroke-width:2px,stroke-dasharray: 5 5;

    class D domain;
    class KR rule;
```

#### Nest JS dependency injection container
```mermaid
flowchart TD
    subgraph DI ["NestJS DI Container at Runtime"]
        direction TD
        
        SC["SessionController<br/><i>constructor(CheckoutService)</i>"]
        CS["CheckoutService<br/><i>constructor(ISessionRepository, IEventPublisher, IQrSigner)</i>"]
        
        %% Concrete Implementations
        PSR["PrismaSessionRepository"]
        BEP["BullMqEventPublisher"]
        JQS["JwtQrSigner"]
        PTS["PointsService"]
        
        %% Deep Dependencies
        Prisma["PrismaService<br/>(connection pool to PostgreSQL)"]
        
        %% Dependency Tree
        SC --> CS
        
        CS -- "resolves ISessionRepository" --> PSR
        CS -- "resolves IEventPublisher" --> BEP
        CS -- "resolves IQrSigner" --> JQS
        CS --> PTS
        
        PSR --> Prisma
    end

    %% Module Resolution Note
    Bindings["<b>Bindings resolved from checkout.module.ts providers:</b><br/>'ISessionRepository' → PrismaSessionRepository<br/>'IEventPublisher' → BullMqEventPublisher<br/>'IQrSigner' → JwtQrSigner"]

    %% Invisible link to place the note below the container
    DI ~~~ Bindings

    %% Styles
    classDef default fill:#f8f9fa,stroke:#ced4da,stroke-width:2px,color:#212529;
    classDef controller fill:#e3f2fd,stroke:#1565c0,stroke-width:2px,color:#0d47a1;
    classDef service fill:#fff3e0,stroke:#e65100,stroke-width:2px,color:#e65100;
    classDef infra fill:#e8f5e9,stroke:#2e7d32,stroke-width:2px,color:#1b5e20;
    classDef note fill:#fff9c4,stroke:#fbc02d,stroke-width:2px,stroke-dasharray: 5 5,color:#212529;

    class SC controller;
    class CS,PTS service;
    class PSR,BEP,JQS,Prisma infra;
    class Bindings note;
  ```



### Architecture Diagrams

#### Level 1 — System Context Diagram
```mermaid
graph LR
    %% Central System wrapped in a subgraph to represent the context boundary
    subgraph Context["SmartCart System Context"]
        SmartCart(SmartCart System)
    end

    %% Actors defined as round-edged nodes
    Shopper(Shopper Mobile)
    Cashier(Cashier POS)
    Admin(Admin / B2B Partner)
    CSR(Customer Service Rep)

    %% Relationships and Interactions with labels
    Shopper -- "Scans products, generates QR, redeems rewards" --> SmartCart
    Cashier -- "Validates QR, confirms checkout" --> SmartCart
    Admin -- "Downloads consumer reports, segments" --> SmartCart
    CSR -- "Deducts points from user account" --> SmartCart

    %% Styling to make it look cleaner
    style SmartCart fill:#f9f,stroke:#333,stroke-width:2px,font-weight:bold
    style Context fill:#fff,stroke:#333,stroke-width:1px,stroke-dasharray: 5 5
```

#### Level 2 — Container Diagram
```mermaid
flowchart TD
    %% Styling Classes
    classDef mobile fill:#e3f2fd,stroke:#1565c0,stroke-width:2px,color:#0d47a1;
    classDef gateway fill:#e0f7fa,stroke:#006064,stroke-width:2px,color:#004d40;
    classDef module fill:#fff3e0,stroke:#e65100,stroke-width:2px,color:#e65100;
    classDef layer fill:#fafafa,stroke:#e65100,stroke-width:2px,stroke-dasharray: 5 5,color:#212529;
    classDef db fill:#e8f5e9,stroke:#2e7d32,stroke-width:2px,color:#1b5e20;
    classDef worker fill:#f3e5f5,stroke:#6a1b9a,stroke-width:2px,color:#4a148c;
    classDef external fill:#ffebee,stroke:#c62828,stroke-width:2px,stroke-dasharray: 5 5,color:#b71c1c;

    %% 1. Mobile App Container
    subgraph MobileApp ["📱 Mobile App (React Native / Expo)"]
        direction LR
        Lobby[Lobby<br/>Screen]:::mobile
        Scan[Scan<br/>Screen]:::mobile
        Cart[Cart<br/>Screen]:::mobile
        QR[QR Code<br/>Screen]:::mobile
        Rewards[Rewards<br/>Screen]:::mobile
    end

    %% 2. API Gateway
    Gateway["<b>API Gateway (Nginx / Cloud Load Balancer)</b><br/>Routes: /api/* → NestJS API | /ws → NestJS WebSocket | /health → Health"]:::gateway

    %% Connection: Mobile to Gateway
    MobileApp -- "HTTPS (REST) + WSS (WebSocket)" --> Gateway

    %% 3. NestJS Monolith Container
    subgraph NestJS ["⚙️ NestJS Modular Monolith (API Container)"]
        direction TB
        
        subgraph Modules [" "]
            direction LR
            Auth["<b>AuthModule</b><br/>- Login<br/>- Register<br/>- JWT Issue"]:::module
            Catalog["<b>CatalogModule</b><br/>- Search<br/>- Barcode Lookup"]:::module
            Checkout["<b>CheckoutModule</b><br/>- Session CRUD<br/>- QR Gen<br/>- Validate<br/>- Points Calc"]:::module
            Rew["<b>RewardsModule</b><br/>- List<br/>- Redeem<br/>- Deduct"]:::module
        end
        
        Domain["<b>Domain Layer (Pure TS)</b><br/>Entities, Value Objects, Events"]:::layer
        Infrastructure["<b>Infrastructure Layer</b><br/>PrismaRepos, BullMqPublisher, S3Store"]:::layer

        Modules --> Domain
        Domain --> Infrastructure
    end

    %% Connection: Gateway to Monolith
    Gateway --> NestJS

    %% 4. Data Stores
    subgraph DataStores ["🗄️ Data Stores & Infrastructure"]
        direction LR
        DB[("<b>PostgreSQL</b><br/>(Primary DB)")]:::db
        Cache[("<b>Redis</b><br/>(Cache + Sessions)")]:::db
        Queue[["<b>BullMQ</b><br/>(Job Queue)"]]:::db
        Storage[("<b>S3 / R2</b><br/>(Images + Reports)")]:::db
    end

    %% Connections: Monolith to Data Stores
    Infrastructure --> DB
    Infrastructure --> Cache
    Infrastructure --> Queue
    Infrastructure --> Storage

    %% 5. Analytics Worker Container
    subgraph Worker ["🔄 Analytics Worker (BullMQ Consumer)"]
        direction LR
        PA["<b>ProfileAggregator</b><br/>(90-day window)"]:::worker
        FE["<b>FeatureExtractor</b><br/>(Category freq,<br/>avg ticket, hour)"]:::worker
        SS["<b>SegmentationService</b><br/>(Calls AI inference,<br/>upserts segments)"]:::worker
        
        PA --> FE --> SS
    end

    %% Connection: Queue to Worker
    Queue --> Worker

    %% 6. External AI Service
    AIService["<b>AI Inference Service (External)</b><br/>POST /classify → { segment: 'premium_lover', confidence: 0.87 }"]:::external

    %% Connection: Worker to AI
    SS --> AIService
```

#### Level 3 — Component Diagram (per service/module)
```mermaid
classDiagram
    %% ==========================================
    %% PRESENTATION LAYER
    %% ==========================================
    class SessionController {
        <<REST>>
        +POST /sessions
        +POST /sessions/:id/items
    }
    class QrController {
        <<REST>>
        +POST /sessions/:id/qr
    }
    class ValidationController {
        <<REST>>
        +POST /sessions/validate
    }
    class SessionGateway {
        <<WebSocket>>
        +emit(sessionStatusChanged)
    }

    %% ==========================================
    %% APPLICATION LAYER
    %% ==========================================
    class CheckoutService {
        +createSession(userId, storeId) Session
        +addItem(sessionId, barcode) AddItemResult
        +generateQr(sessionId) QrTicket
        +validateSession(qrToken, scannedItems) ValidationResult
    }
    class PointsService {
        +calculate(items, userId) Points[]
        +credit(points) void
    }
    class AppQrSigner {
        +sign(session, items) string
        +verify(token) QrPayload
    }
    class SessionStateMachine {
        <<StateMachine>>
        +transition(session, event) Session
    }

    %% INJECTED INTERFACES (Ports)
    class ISessionRepository {
        <<Interface>>
    }
    class ICatalogService {
        <<Interface>>
    }
    class IPointsService {
        <<Interface>>
    }
    class IEventPublisher {
        <<Interface>>
    }
    class IQrSigner {
        <<Interface>>
    }

    %% ==========================================
    %% DOMAIN LAYER
    %% ==========================================
    class ShoppingSession {
        +String id
        +String userId
        +String storeId
        +String status
        +Array items
        +Int totalPoints
    }
    class SessionItem {
        +String productId
        +String barcode
        +Int quantity
        +Int pointsValue
    }
    class QrTicket {
        +String token
        +Date expiresAt
        +String sessionId
        +String itemHash
    }
    class CheckoutCompletedEvent {
        <<Event>>
        +String sessionId
        +String userId
        +Int pointsAwarded
        +Array items
        +Date timestamp
    }
    class PointsCalculationStrategy {
        <<Interface>>
        +calculate() PointsAwarded
    }
    class FixedPointsStrategy {
        +rate: 50 pts/unit
    }
    class MultiplierStrategy {
        +multiplier: 2x spend
    }

    %% ==========================================
    %% INFRASTRUCTURE LAYER (Adapters)
    %% ==========================================
    class PrismaSessionRepository {
        <<Adapter>>
        -PrismaService prisma
        -Redis cache
    }
    class BullMqEventPublisher {
        <<Adapter>>
        -Queue analyticsQueue
    }
    class JwtQrSigner {
        <<Adapter>>
        -String secret
    }

    %% ==========================================
    %% RELATIONSHIPS
    %% ==========================================
    
    %% Presentation -> Application
    SessionController --> CheckoutService
    QrController --> CheckoutService
    ValidationController --> CheckoutService
    SessionGateway --> CheckoutService

    %% Application internal helper usage
    CheckoutService --> PointsService
    CheckoutService --> AppQrSigner
    CheckoutService --> SessionStateMachine

    %% Dependency Inversion (Application depends on Interfaces)
    CheckoutService ..> ISessionRepository : injects
    CheckoutService ..> ICatalogService : injects
    CheckoutService ..> IPointsService : injects
    CheckoutService ..> IEventPublisher : injects
    CheckoutService ..> IQrSigner : injects

    %% Infrastructure fulfills Interfaces
    PrismaSessionRepository ..|> ISessionRepository : implements
    BullMqEventPublisher ..|> IEventPublisher : implements
    JwtQrSigner ..|> IQrSigner : implements

    %% Domain Patterns & Aggregates
    PointsCalculationStrategy <|-- FixedPointsStrategy : implements
    PointsCalculationStrategy <|-- MultiplierStrategy : implements
    PointsService ..> PointsCalculationStrategy : uses
    
    ShoppingSession "1" *-- "*" SessionItem : composition
    CheckoutService ..> ShoppingSession : mutates
    CheckoutCompletedEvent ..> BullMqEventPublisher : sent via
```

## 2.3. Business Logic & Design Patterns
This section documents every design pattern employed in the SmartCart backend, following the Gang of Four classification where applicable. Each pattern includes its technical implementation, participating classes, activation mechanism, and the specific business problem it solves. All code paths reference the monorepo structure established in Section 2.2.

### Pattern Catalog
1. **Repository Pattern**
| Aspect              | Detail                                                                                                                                                                                                 |
|---------------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| Classification      | Structural (Domain-Driven Design)                                                                                                                                                                      |
| Responsibility      | Abstract database access behind an interface so the domain and application layers never depend on an ORM or raw SQL                                                                                     |
| Classes Participating | `ISessionRepository` (interface), `PrismaSessionRepository` (concrete), `ShoppingSession` (domain entity), `SessionMapper` (row ↔ entity translator)                                                           |
| Activation          | NestJS DI container injects `PrismaSessionRepository` wherever `ISessionRepository` is requested, as configured in `checkout.module.ts`                                                                       |
| Interaction         | `CheckoutService` → `ISessionRepository.findById()` → `PrismaSessionRepository` → `PrismaService` → PostgreSQL. The service never sees Prisma types.                                                            |
| Advantages          | Swap PostgreSQL for DynamoDB by writing a new implementation of the interface. Mock the interface in unit tests without a database. Centralize query logic (e.g., .`findById()` always includes items relation). |

**Implementation**:
```
// 📁 apps/api/src/modules/checkout/application/interfaces/session-repository.interface.ts
// PORT: defines what the application layer needs

import { ShoppingSession } from '../../domain/entities/shopping-session.entity';
import { Prisma } from '@prisma/client';

export interface ISessionRepository {
  findById(id: string, tx?: Prisma.TransactionClient): Promise<ShoppingSession | null>;
  findActiveByUserId(userId: string): Promise<ShoppingSession | null>;
  save(session: ShoppingSession, tx?: Prisma.TransactionClient): Promise<void>;
  markCompleted(id: string, tx?: Prisma.TransactionClient): Promise<void>;
  markExpired(id: string): Promise<void>;
}
```
```
// 📁 apps/api/src/modules/checkout/infrastructure/repositories/prisma-session.repository.ts
// ADAPTER: concrete Prisma implementation

@Injectable()
export class PrismaSessionRepository implements ISessionRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string, tx?: Prisma.TransactionClient): Promise<ShoppingSession | null> {
    const client = tx ?? this.prisma;
    const row = await client.shoppingSession.findUnique({
      where: { id },
      include: { items: { include: { product: true } } },
    });
    if (!row) return null;

    // Map persistence row → domain entity (pure transformation)
    return new ShoppingSession(
      row.id,
      row.userId,
      row.storeId,
      row.createdAt,
      row.items.map(item => new SessionItem(
        item.id,
        item.product.barcode,
        1, // quantity defaulted; extend schema for multi-quantity
        item.product.pointsConfig as PointsConfig,
        item.product.isSponsored,
      )),
      row.status as SessionStatus,
    );
  }

  async findActiveByUserId(userId: string): Promise<ShoppingSession | null> {
    const row = await this.prisma.shoppingSession.findFirst({
      where: { userId, status: { in: ['ACTIVE', 'PENDING_CHECKOUT'] } },
      include: { items: { include: { product: true } } },
      orderBy: { createdAt: 'desc' },
    });
    if (!row) return null;
    return this.toDomain(row);
  }

  async save(session: ShoppingSession, tx?: Prisma.TransactionClient): Promise<void> {
    const client = tx ?? this.prisma;
    await client.shoppingSession.upsert({
      where: { id: session.id },
      create: {
        id: session.id,
        userId: session.userId,
        storeId: session.storeId,
        status: session.status,
        items: {
          create: session.items.map(item => ({
            productId: item.productId,
            pointsAwarded: item.pointsValue,
          })),
        },
      },
      update: {
        status: session.status,
        items: {
          deleteMany: {},
          create: session.items.map(item => ({
            productId: item.productId,
            pointsAwarded: item.pointsValue,
          })),
        },
      },
    });
  }

  async markCompleted(id: string, tx?: Prisma.TransactionClient): Promise<void> {
    const client = tx ?? this.prisma;
    await client.shoppingSession.update({
      where: { id },
      data: { status: 'COMPLETED', completedAt: new Date() },
    });
  }

  async markExpired(id: string): Promise<void> {
    await this.prisma.shoppingSession.update({
      where: { id },
      data: { status: 'EXPIRED' },
    });
  }

  private toDomain(row: any): ShoppingSession {
    return new ShoppingSession(
      row.id, row.userId, row.storeId, row.createdAt,
      row.items.map((i: any) => new SessionItem(
        i.id, i.product.barcode, 1,
        i.product.pointsConfig as PointsConfig,
        i.product.isSponsored,
      )),
      row.status as SessionStatus,
    );
  }
}
```
**Unit test example**:
```
// 📁 apps/api/src/modules/checkout/application/services/checkout.service.spec.ts
// Repository is mocked — no database needed for business logic tests

describe('CheckoutService', () => {
  let service: CheckoutService;
  let mockSessionRepo: jest.Mocked<ISessionRepository>;

  beforeEach(async () => {
    mockSessionRepo = {
      findById: jest.fn(),
      findActiveByUserId: jest.fn(),
      save: jest.fn(),
      markCompleted: jest.fn(),
      markExpired: jest.fn(),
    };

    const module = await Test.createTestingModule({
      providers: [
        CheckoutService,
        { provide: 'ISessionRepository', useValue: mockSessionRepo },
        { provide: 'IEventPublisher', useValue: { publish: jest.fn() } },
        { provide: 'IQrSigner', useValue: { sign: jest.fn(), verify: jest.fn() } },
        { provide: 'IPointsService', useValue: { calculatePoints: jest.fn(), creditPoints: jest.fn() } },
      ],
    }).compile();

    service = module.get(CheckoutService);
  });

  it('should throw SessionNotActiveError when adding item to completed session', async () => {
    const completedSession = new ShoppingSession(
      's1', 'u1', 'st1', new Date(), [], SessionStatus.COMPLETED,
    );
    mockSessionRepo.findById.mockResolvedValue(completedSession);

    await expect(
      service.addItem('s1', '7861234567890'),
    ).rejects.toThrow(SessionNotActiveError);
  });
});
```

2. **Service layer pattern**
| Aspect               | Detail                                                                                                                                                                                                 |
|----------------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| Classification       | Behavioral (Domain-Driven Design)                                                                                                                                                                      |
| Responsibility       | Orchestrate use cases by coordinating domain entities, repositories, and infrastructure services. Each public method represents a single business operation.                                             |
| Classes Participating| CheckoutService, PointsService, QrSigner (injected), ISessionRepository (injected), IEventPublisher (injected)                                                                                          |
| Activation           | Called directly by Presentation layer (controllers) or scheduled jobs (@Cron)                                                                                                                          |
| Interaction          | Controller → CheckoutService.addItem() → ISessionRepository.findById() → ShoppingSession.addItem() (domain method) → ISessionRepository.save()                                                          |
| Advantages           | Business logic is testable without HTTP. Transaction boundaries are explicit. Multiple controllers can reuse the same service method.                                                                   |

**Implementation**:
```
// 📁 apps/api/src/modules/checkout/application/services/checkout.service.ts

@Injectable()
export class CheckoutService {
  constructor(
    @Inject('ISessionRepository') private readonly sessionRepo: ISessionRepository,
    @Inject('IEventPublisher') private readonly eventPublisher: IEventPublisher,
    @Inject('IQrSigner') private readonly qrSigner: IQrSigner,
    @Inject('IPointsService') private readonly pointsService: IPointsService,
    @Inject('ICatalogService') private readonly catalogService: ICatalogService,
    private readonly prisma: PrismaService, // For $transaction host
  ) {}

  /**
   * Creates a new shopping session for a user in a store.
   * Business rule: Only one ACTIVE session per user at a time.
   */
  async createSession(userId: string, storeId: string): Promise<ShoppingSession> {
    // Check for existing active session
    const existing = await this.sessionRepo.findActiveByUserId(userId);
    if (existing) {
      throw new DuplicateSessionError(userId, existing.id);
    }

    const session = new ShoppingSession(
      crypto.randomUUID(),
      userId,
      storeId,
      new Date(),
      [],
      SessionStatus.ACTIVE,
    );

    await this.sessionRepo.save(session);
    return session;
  }

  /**
   * Adds a scanned product to an active session.
   * Business rule: Product must exist in catalog. Session must be ACTIVE.
   */
  async addItem(sessionId: string, barcode: string): Promise<AddItemResult> {
    const session = await this.sessionRepo.findById(sessionId);
    if (!session) throw new SessionNotFoundError(sessionId);

    const product = await this.catalogService.findByBarcode(barcode);
    if (!product) throw new ProductNotFoundError(barcode);

    const item = new SessionItem(
      crypto.randomUUID(),
      barcode,
      1,
      product.pointsConfig,
      product.isSponsored,
    );

    session.addItem(item); // Domain method — throws if session not ACTIVE
    await this.sessionRepo.save(session);

    return {
      item: { productId: item.productId, barcode: item.barcode, pointsValue: item.pointsValue },
      session: { totalPendingItems: session.itemCount, totalPendingPoints: session.totalPoints },
    };
  }

  /**
   * Generates a signed QR token for checkout.
   * Business rule: Session must be ACTIVE with at least one item.
   */
  async generateQr(sessionId: string): Promise<QrTicket> {
    const session = await this.sessionRepo.findById(sessionId);
    if (!session) throw new SessionNotFoundError(sessionId);

    session.requestCheckout(); // Domain method — validates state, transitions to PENDING_CHECKOUT
    await this.sessionRepo.save(session);

    const token = await this.qrSigner.sign({
      sessionId: session.id,
      userId: session.userId,
      itemHash: session.computeItemHash(),
      expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5-minute validity
    });

    return new QrTicket(token, new Date(Date.now() + 5 * 60 * 1000));
  }
}
```
3. **Factory pattern**
| Aspect               | Detail                                                                                                                                                                                                 |
|----------------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| Classification       | Creational (GoF)                                                                                                                                                                                       |
| Responsibility       | Encapsulate complex object creation that involves multiple steps, default values, or validation                                                                                                         |
| Classes Participating| SessionFactory (factory), ShoppingSession (product), QrTicketFactory (factory), QrTicket (product)                                                                                                      |
| Activation           | Called by CheckoutService.createSession() or CheckoutService.generateQr()                                                                                                                              |
| Interaction          | Service → Factory.create() → returns fully-constructed entity with all invariants satisfied                                                                                                             |
| Advantages           | Domain entities have no public constructors with 7+ parameters. Creation logic is testable in isolation. Default values (e.g., initial status, timestamps) are centralized.                             |

**Implementation**
```
// 📁 apps/api/src/modules/checkout/domain/factories/session.factory.ts

export class SessionFactory {
  /**
   * Creates a new ShoppingSession with guaranteed invariants:
   * - Always starts in ACTIVE status
   * - Always has a creation timestamp
   * - ID is generated, not passed by caller
   */
  static create(userId: string, storeId: string): ShoppingSession {
    return new ShoppingSession(
      crypto.randomUUID(),  // id
      userId,                // userId
      storeId,               // storeId
      new Date(),            // createdAt — factory controls timestamp
      [],                    // items — always empty
      SessionStatus.ACTIVE,  // status — factory enforces initial state
    );
  }

  /**
   * Reconstitutes a session from persistence.
   * Used only by the repository mapper — not by application code.
   */
  static reconstitute(
    id: string,
    userId: string,
    storeId: string,
    createdAt: Date,
    items: SessionItem[],
    status: SessionStatus,
  ): ShoppingSession {
    return new ShoppingSession(id, userId, storeId, createdAt, items, status);
  }
}
```
```
// 📁 apps/api/src/modules/checkout/domain/factories/qr-ticket.factory.ts

export class QrTicketFactory {
  /**
   * Creates a QrTicket with embedded expiration logic.
   * The factory enforces that tokens are never valid for more than 5 minutes.
   */
  static create(
    sessionId: string,
    userId: string,
    itemHash: string,
    validityMinutes: number = 5,
  ): { payload: QrPayload; expiresAt: Date } {
    if (validityMinutes > 5) {
      throw new QrValidityExceededError(validityMinutes);
    }

    const expiresAt = new Date(Date.now() + validityMinutes * 60 * 1000);

    return {
      payload: {
        sessionId,
        userId,
        itemHash,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(expiresAt.getTime() / 1000),
      },
      expiresAt,
    };
  }
}
```

**Usage in service**:
```
// 📁 apps/api/src/modules/checkout/application/services/checkout.service.ts (extract)

async createSession(userId: string, storeId: string): Promise<ShoppingSession> {
  // Factory encapsulates creation rules — service doesn't set defaults manually
  const session = SessionFactory.create(userId, storeId);
  await this.sessionRepo.save(session);
  return session;
}
```

4. **Strategy Pattern**
| Aspect               | Detail                                                                                                                                                                                                 |
|----------------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| Classification       | Behavioral (GoF)                                                                                                                                                                                       |
| Responsibility       | Allow the points calculation algorithm to vary independently from the checkout flow that uses it                                                                                                       |
| Classes Participating| IPointsCalculationStrategy (interface), FixedPointsStrategy, SpendMultiplierStrategy, VolumeTierStrategy, PointsStrategyResolver (context)                                                              |
| Activation           | PointsService.calculatePoints() calls PointsStrategyResolver.resolve(product.pointsConfig.type) which returns the correct strategy instance                                                             |
| Interaction          | CheckoutService → PointsService.calculatePoints() → PointsStrategyResolver.resolve(type) → Strategy.calculate(item)                                                                                      |
| Advantages           | New point schemes (e.g., "double points on weekends", "bonus for premium segment") can be added without modifying CheckoutService or PointsService. Strategies are unit-testable in isolation.          |

**Implementation**:
```
// 📁 apps/api/src/modules/checkout/domain/strategies/points-calculation-strategy.interface.ts

import { PointsConfig } from '../value-objects/points-config.vo';
import { PointsAwarded } from '../value-objects/points-awarded.vo';

export interface IPointsCalculationStrategy {
  readonly strategyType: string;
  calculate(
    itemPrice: number,
    quantity: number,
    config: PointsConfig,
    context?: PointsCalculationContext,
  ): PointsAwarded;
}

export interface PointsCalculationContext {
  userId?: string;
  sessionTotal?: number;
  timestamp?: Date;
  userSegment?: string;
}
```
```
// 📁 apps/api/src/modules/checkout/domain/strategies/fixed-points.strategy.ts

export class FixedPointsStrategy implements IPointsCalculationStrategy {
  readonly strategyType = 'FIXED_PER_UNIT';

  calculate(
    _itemPrice: number,
    quantity: number,
    config: PointsConfig,
  ): PointsAwarded {
    // config.value is points per unit (e.g., 50 points per item)
    const totalPoints = (config.value as number) * quantity;

    return new PointsAwarded(totalPoints, this.strategyType, config.value as number);
  }
}
```
```
// 📁 apps/api/src/modules/checkout/domain/strategies/spend-multiplier.strategy.ts

export class SpendMultiplierStrategy implements IPointsCalculationStrategy {
  readonly strategyType = 'SPEND_MULTIPLIER';

  calculate(
    itemPrice: number,
    quantity: number,
    config: PointsConfig,
  ): PointsAwarded {
    // config.value is the multiplier (e.g., 2.0 = 2 points per dollar spent)
    const subtotal = itemPrice * quantity;
    const multiplier = config.value as number;
    const totalPoints = Math.round(subtotal * multiplier);

    return new PointsAwarded(totalPoints, this.strategyType, multiplier);
  }
}
```
```
// 📁 apps/api/src/modules/checkout/domain/strategies/volume-tier.strategy.ts

export class VolumeTierStrategy implements IPointsCalculationStrategy {
  readonly strategyType = 'VOLUME_TIER';

  calculate(
    _itemPrice: number,
    quantity: number,
    config: PointsConfig,
  ): PointsAwarded {
    // config.tiers: [{ minQty: 1, maxQty: 5, pointsPerUnit: 10 }, { minQty: 6, pointsPerUnit: 20 }]
    const tiers = config.tiers as VolumeTier[];
    const tier = tiers
      .sort((a, b) => b.minQty - a.minQty)
      .find(t => quantity >= t.minQty);

    if (!tier) throw new NoMatchingTierError(quantity, tiers);
    const totalPoints = quantity * tier.pointsPerUnit;

    return new PointsAwarded(totalPoints, this.strategyType, tier.pointsPerUnit);
  }
}
```
```
// 📁 apps/api/src/modules/checkout/application/services/points-strategy-resolver.ts
// CONTEXT: selects the correct strategy based on product configuration

@Injectable()
export class PointsStrategyResolver {
  private readonly strategies: Map<string, IPointsCalculationStrategy>;

  constructor() {
    this.strategies = new Map();
    // Register all available strategies
    this.register(new FixedPointsStrategy());
    this.register(new SpendMultiplierStrategy());
    this.register(new VolumeTierStrategy());
  }

  register(strategy: IPointsCalculationStrategy): void {
    this.strategies.set(strategy.strategyType, strategy);
  }

  resolve(strategyType: string): IPointsCalculationStrategy {
    const strategy = this.strategies.get(strategyType);
    if (!strategy) throw new UnknownStrategyError(strategyType);
    return strategy;
  }
}
```
```
// 📁 apps/api/src/modules/checkout/application/services/points.service.ts
// Orchestrates strategy execution with per-item context

@Injectable()
export class PointsService implements IPointsService {
  constructor(private readonly strategyResolver: PointsStrategyResolver) {}

  calculatePoints(
    items: SessionItem[],
    context?: PointsCalculationContext,
  ): PointsAwarded[] {
    return items
      .filter(item => item.isSponsored) // Only sponsored products earn points
      .map(item => {
        const strategy = this.strategyResolver.resolve(item.pointsConfig.type);
        return strategy.calculate(
          item.price ?? 0,
          item.quantity,
          item.pointsConfig,
          context,
        );
      });
  }

  async creditPoints(
    userId: string,
    points: PointsAwarded[],
    sessionId: string,
    tx?: Prisma.TransactionClient,
  ): Promise<void> {
    const total = points.reduce((sum, p) => sum + p.totalPoints, 0);
    const client = tx ?? this.prisma;

    await client.pointsAccount.upsert({
      where: { userId },
      create: { userId, balance: total },
      update: { balance: { increment: total }, lastUpdated: new Date() },
    });

    await client.pointsTransaction.create({
      data: {
        userId,
        sessionId,
        delta: total,
        reason: 'PURCHASE',
      },
    });
  }
}
```
**Adding a new straategy (extension without modification)**:
```
// 📁 apps/api/src/modules/checkout/domain/strategies/weekend-bonus.strategy.ts
// New strategy added post-launch — no existing code modified

export class WeekendBonusStrategy implements IPointsCalculationStrategy {
  readonly strategyType = 'WEEKEND_BONUS';

  calculate(
    itemPrice: number,
    quantity: number,
    config: PointsConfig,
    context?: PointsCalculationContext,
  ): PointsAwarded {
    const basePoints = (config.basePoints as number) * quantity;
    const isWeekend = context?.timestamp
      ? [0, 6].includes(context.timestamp.getDay())
      : false;
    const multiplier = isWeekend ? (config.weekendMultiplier as number) : 1;
    const totalPoints = Math.round(basePoints * multiplier);

    return new PointsAwarded(totalPoints, this.strategyType, multiplier);
  }
}
```
```
// Register in PointsStrategyResolver constructor:
this.register(new WeekendBonusStrategy());
```

5. **Observer pattern**
| Aspect               | Detail                                                                                                                                                                                                 |
|----------------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| Classification       | Behavioral (GoF)                                                                                                                                                                                       |
| Responsibility       | Decouple side effects (push notifications, analytics enqueueing) from the core transaction                                                                                                             |
| Classes Participating| IEventPublisher (interface), BullMqEventPublisher (concrete), CheckoutCompletedEvent (domain event), PushNotificationHandler (subscriber), ProfileUpdateHandler (subscriber)                             |
| Activation           | CheckoutService.validateSession() publishes CheckoutCompletedEvent AFTER the Prisma $transaction commits successfully                                                                                   |
| Interaction          | CheckoutService → IEventPublisher.publish(event) → BullMqEventPublisher → BullMQ Queue → Worker picks up → PushNotificationHandler / ProfileUpdateHandler                                                |
| Advantages           | The POS validation response is not delayed by notification sending or analytics aggregation. New side effects can be added by writing a new handler without modifying CheckoutService.                   |

**Implementation**:
```
// 📁 apps/api/src/modules/checkout/domain/events/checkout-completed.event.ts

export class CheckoutCompletedEvent {
  readonly eventName = 'checkout.completed';
  readonly occurredAt: Date;

  constructor(
    public readonly sessionId: string,
    public readonly userId: string,
    public readonly storeId: string,
    public readonly pointsAwarded: number,
    public readonly items: Array<{ barcode: string; isSponsored: boolean; pointsValue: number }>,
  ) {
    this.occurredAt = new Date();
  }
}
```
```
// 📁 apps/api/src/modules/checkout/application/interfaces/event-publisher.interface.ts

export interface IEventPublisher {
  publish<T>(event: T): Promise<void>;
}
```
```
// 📁 apps/api/src/modules/checkout/infrastructure/events/bullmq-event.publisher.ts

@Injectable()
export class BullMqEventPublisher implements IEventPublisher {
  constructor(
    @InjectQueue('analytics-profile-update') private readonly analyticsQueue: Queue,
    @InjectQueue('push-notifications') private readonly notificationQueue: Queue,
  ) {}

  async publish<T extends { eventName: string }>(event: T): Promise<void> {
    // Route event to appropriate queue based on event name
    switch (event.eventName) {
      case 'checkout.completed': {
        const e = event as unknown as CheckoutCompletedEvent;
        // Fire-and-forget to analytics pipeline
        await this.analyticsQueue.add('profile-update', {
          sessionId: e.sessionId,
          userId: e.userId,
          storeId: e.storeId,
          items: e.items,
          timestamp: e.occurredAt.toISOString(),
        });
        // Fire-and-forget to push notification worker
        await this.notificationQueue.add('points-credited', {
          userId: e.userId,
          pointsAwarded: e.pointsAwarded,
          sessionId: e.sessionId,
        });
        break;
      }
      default:
        // Log unknown event; don't throw — publishing is best-effort after commit
        console.warn(`No queue configured for event: ${event.eventName}`);
    }
  }
}
```
```
// 📁 apps/analytics-worker/src/processors/profile-update.processor.ts
// SUBSCRIBER: reacts to CheckoutCompletedEvent asynchronously

@Processor('analytics-profile-update')
export class ProfileUpdateProcessor {
  constructor(
    private readonly aggregator: ProfileAggregatorService,
    private readonly aiClient: AiInferenceClient,
    private readonly segmentRepo: SegmentRepository,
  ) {}

  @Process('profile-update')
  async handle(job: Job<ProfileUpdateJobData>): Promise<void> {
    // This runs in a separate process — zero impact on checkout latency
    const features = await this.aggregator.aggregateFeatures(job.data.userId);
    const segment = await this.aiClient.classify(features);
    await this.segmentRepo.upsert(job.data.userId, segment);
  }
}
```
```
// 📁 apps/api/src/modules/notifications/handlers/points-credited.handler.ts
// SUBSCRIBER: sends push notification when points are earned

@Processor('push-notifications')
export class PointsCreditedHandler {
  constructor(private readonly pushGateway: ExpoPushNotificationGateway) {}

  @Process('points-credited')
  async handle(job: Job<{ userId: string; pointsAwarded: number; sessionId: string }>): Promise<void> {
    const pushToken = await this.getUserPushToken(job.data.userId);
    if (!pushToken) return;

    await this.pushGateway.send({
      to: pushToken,
      title: '¡Puntos acreditados! 🎉',
      body: `Has ganado ${job.data.pointsAwarded} puntos en tu última compra.`,
      data: { sessionId: job.data.sessionId, type: 'POINTS_CREDITED' },
    });
  }

  private async getUserPushToken(userId: string): Promise<string | null> {
    // Lookup from users table or cache
    const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { pushToken: true } });
    return user?.pushToken ?? null;
  }
}
```
**Critical timing rule**: Events are published AFTER the transaction commits, not inside it. This prevents sending a notification for a transaction that was rolled back.
```
// 📁 apps/api/src/modules/checkout/application/services/checkout.service.ts
async validateSession(qrToken: string, scannedItems: ScannedItemDTO[]): Promise<ValidationResult> {
  // Step 1: Transaction (atomic, synchronous)
  const result = await this.prisma.$transaction(async (tx) => {
    // ... validation, points calculation, persisting ...
    return { success: true, session: s, points: totalPoints };
  });

  // Step 2: Side effects (non-blocking, after commit)
  // If this fails, the transaction is already committed — we use BullMQ retry for resilience
  await this.eventPublisher.publish(new CheckoutCompletedEvent(
    result.session.id, result.session.userId, result.session.storeId,
    result.points, result.session.items,
  ));

  return result;
}
```
6. **Data transfer object pattern (DTO)**:
| Aspect               | Detail                                                                                                                                                                                                 |
|----------------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| Classification       | Structural (Enterprise)                                                                                                                                                                                |
| Responsibility       | Define the exact shape of data crossing process boundaries (HTTP request/response, queue messages). Keep domain entities decoupled from serialization concerns.                                          |
| Classes Participating| AddItemRequest (input DTO), AddItemResponse (output DTO), AddItemRequestSchema (Zod validation), ZodValidationPipe (NestJS pipe)                                                                        |
| Activation           | ZodValidationPipe validates incoming HTTP bodies against Zod schemas before they reach the controller method                                                                                            |
| Interaction          | HTTP Request Body → ZodValidationPipe.transform(AddItemRequestSchema) → validated AddItemRequest → Controller → Service → Response DTO → HTTP Response                                                  |
| Advantages           | Frontend and backend share DTO definitions from packages/shared-types. Validation is runtime-safe. Domain entities are never leaked to API consumers.                                                   |

**Implementation**:
```
// 📁 packages/shared-types/src/checkout.types.ts
// SHARED: imported by both apps/api and React Native frontend

import { z } from 'zod';

// ─── Input DTOs (what the client sends) ───────────────────────────

export interface CreateSessionRequest {
  storeId: string;
}

export const CreateSessionRequestSchema = z.object({
  storeId: z.string().uuid(),
});

export interface AddItemRequest {
  barcode: string;
  sessionId: string;
}

export const AddItemRequestSchema = z.object({
  barcode: z.string().min(8).max(14).regex(/^\d+$/, 'Barcode must be numeric'),
  sessionId: z.string().uuid(),
});

// ─── Output DTOs (what the server returns) ────────────────────────

export interface AddItemResponse {
  item: {
    productId: string;
    name: string;
    brand: string;
    pointsValue: number;
    imageUrl: string;
  };
  session: {
    id: string;
    totalPendingItems: number;
    totalPendingPoints: number;
    status: string;
  };
}

// ─── Validation DTOs ─────────────────────────────────────────────

export interface ValidationRequest {
  qrToken: string;
  scannedItems: Array<{ barcode: string; quantity: number }>;
}

export const ValidationRequestSchema = z.object({
  qrToken: z.string().min(1),
  scannedItems: z.array(z.object({
    barcode: z.string().min(8).max(14),
    quantity: z.number().int().min(1),
  })).min(1, 'At least one scanned item is required'),
});

export interface ValidationResponse {
  success: boolean;
  pointsAwarded: number;
  itemsMatched: number;
  itemsMismatched: number;
  errorCode?: string;
}
```
```
// 📁 apps/api/src/common/pipes/zod-validation.pipe.ts
// REUSABLE: validates any request against a Zod schema

@Injectable()
export class ZodValidationPipe implements PipeTransform {
  constructor(private readonly schema: z.ZodSchema) {}

  transform(value: unknown): unknown {
    const result = this.schema.safeParse(value);
    if (result.success) return result.data;

    throw new BadRequestException({
      errorCode: 'VALIDATION_FAILED',
      message: 'Request validation failed',
      details: result.error.issues.map(issue => ({
        field: issue.path.join('.'),
        message: issue.message,
      })),
    });
  }
}
```
```
// 📁 apps/api/src/modules/checkout/presentation/controllers/session.controller.ts
// CONTROLLER: uses DTOs with validation pipe

@Controller('sessions')
@UseGuards(JwtAuthGuard)
export class SessionController {
  constructor(private readonly checkoutService: CheckoutService) {}

  @Post(':id/items')
  async addItem(
    @Param('id') sessionId: string,
    @Body(new ZodValidationPipe(AddItemRequestSchema)) body: AddItemRequest,
    @CurrentUser() user: JwtPayload,
  ): Promise<AddItemResponse> {
    const result = await this.checkoutService.addItem(sessionId, body.barcode);

    // Map domain result → API contract DTO (presentation concern)
    return {
      item: {
        productId: result.item.productId,
        name: result.item.name,
        brand: result.item.brand,
        pointsValue: result.item.pointsValue,
        imageUrl: result.item.imageUrl,
      },
      session: {
        id: result.session.id,
        totalPendingItems: result.session.totalPendingItems,
        totalPendingPoints: result.session.totalPendingPoints,
        status: result.session.status,
      },
    };
  }
}
```

### Complex business layer
1. **Consumer Profiling Pipeline**

**Business Context**: After each validated checkout, the system must update a rolling 90-day behavioral profile for the user, extract features, classify them into a consumer segment via AI, and make aggregated, anonymized segment data available to B2B partners (supermarkets and brands) for campaign planning and demand prediction.

**Participants**: ``CheckoutCompletedEvent`` (trigger), ``BullMqEventPublisher`` (producer), ``analytics-profile-update queue``, ``ProfileUpdateProcessor`` (consumer), ``ProfileAggregatorService`` (business logic), ``AiInferenceClient`` (external API client), ``SegmentRepository`` (persistence).

**Step by step algorithm**:
```
Step 1: EVENT EMISSION (synchronous, post-transaction)
├── File: apps/api/src/modules/checkout/application/services/checkout.service.ts
├── Method: CheckoutService.validateSession()
├── Trigger: After Prisma $transaction commits successfully
├── Action: Publishes CheckoutCompletedEvent with userId, storeId, items[], pointsAwarded, timestamp
└── Queue: analytics-profile-update (BullMQ)

Step 2: JOB CONSUMPTION (asynchronous, separate worker process)
├── File: apps/analytics-worker/src/processors/profile-update.processor.ts
├── Method: ProfileUpdateProcessor.handle()
├── Trigger: BullMQ delivers job from queue
└── Action: Delegates to ProfileAggregatorService

Step 3: ROLLING WINDOW AGGREGATION
├── File: apps/analytics-worker/src/services/profile-aggregator.service.ts
├── Method: ProfileAggregatorService.aggregateFeatures(userId)
├── Algorithm:
│   1. Query PostgreSQL for all transactions in [today - 90 days, today]
│      SELECT * FROM points_transactions
│      WHERE user_id = $1
│        AND reason = 'PURCHASE'
│        AND created_at >= NOW() - INTERVAL '90 days'
│      ORDER BY created_at DESC
│
│   2. Compute behavioral features:
│      a. category_frequency: Map<string, number>
│         → Count purchases per product category (join with products table)
│      b. avg_ticket: number
│         → Sum(total spent per session) / Count(distinct sessions)
│      c. avg_purchase_hour: number (0-23)
│         → Mean of EXTRACT(HOUR FROM created_at) across all transactions
│      d. weekly_frequency: number
│         → Count(distinct DATE_TRUNC('week', created_at)) in window
│         → Divide by 12.85 (weeks in 90 days) for normalized frequency
│      e. sponsored_ratio: number (0-1)
│         → Count(items WHERE is_sponsored = true) / Count(all items)
│      f. organic_preference_score: number (0-1)
│         → Derived from category_frequency of organic-labeled products
│
│   3. Return BehavioralFeatures object
└── Output: BehavioralFeatures DTO

Step 4: AI SEGMENT CLASSIFICATION
├── File: apps/analytics-worker/src/infrastructure/ai/ai-inference.client.ts
├── Method: AiInferenceClient.classify(features)
├── Algorithm:
│   1. Check Redis cache: `segment:{userId}` with TTL of 24 hours
│      → Cache hit: return cached segment, skip AI call
│
│   2. Serialize features to JSON
│      POST /api/v1/classify
│      Authorization: Bearer {AI_SERVICE_API_KEY}
│      {
│        "features": {
│          "category_frequency": {...},
│          "avg_ticket": 45.30,
│          "avg_purchase_hour": 17.5,
│          "weekly_frequency": 0.8,
│          "sponsored_ratio": 0.35,
│          "organic_preference_score": 0.72
│        }
│      }
│
│   3. AI Service (Python/scikit-learn or external) returns:
│      {
│        "segment": "premium_organic",
│        "confidence": 0.87,
│        "model_version": "v2.3.1"
│      }
│
│   4. Cache result in Redis: SET segment:{userId} = "premium_organic" EX 86400
└── Output: { segment: string, confidence: number, modelVersion: string }

Step 5: SEGMENT PERSISTENCE
├── File: apps/analytics-worker/src/infrastructure/repositories/segment.repository.ts
├── Method: SegmentRepository.upsert(userId, segment)
├── Algorithm:
│   1. UPSERT into consumer_segments table:
│      INSERT INTO consumer_segments (user_id, segment_name, model_version, classified_at)
│      VALUES ($1, $2, $3, NOW())
│      ON CONFLICT (user_id) DO UPDATE SET
│        segment_name = EXCLUDED.segment_name,
│        model_version = EXCLUDED.model_version,
│        classified_at = NOW()
│
│   2. Invalidate Redis cache for B2B aggregated queries:
│      DEL analytics:store:{storeId}:segments
│      DEL analytics:global:segment-distribution
└── Side effect: B2B dashboard will see fresh data on next query

Step 6: B2B DATA AVAILABILITY
├── File: apps/api/src/modules/analytics/application/services/analytics.service.ts
├── Method: AnalyticsService.getSegmentDistribution(storeId?)
├── When: B2B partner calls GET /analytics/segments?storeId=X
├── Response:
│   {
│     "segments": [
│       { "name": "premium_organic", "count": 1250, "percentage": 28.5 },
│       { "name": "budget_conscious", "count": 2100, "percentage": 47.9 },
│       { "name": "impulse_buyer", "count": 580, "percentage": 13.2 },
│       { "name": "brand_loyal", "count": 450, "percentage": 10.3 }
│     ],
│     "totalClassifiedUsers": 4380,
│     "modelVersion": "v2.3.1",
│     "generatedAt": "2026-06-06T14:30:00Z"
│   }
└── Data is anonymized and aggregated — no individual user data is exposed
```
```
// 📁 apps/analytics-worker/src/services/profile-aggregator.service.ts

@Injectable()
export class ProfileAggregatorService {
  constructor(private readonly prisma: PrismaService) {}

  async aggregateFeatures(userId: string): Promise<BehavioralFeatures> {
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    // Query 1: All purchase transactions in the 90-day window
    const transactions = await this.prisma.pointsTransaction.findMany({
      where: {
        userId,
        reason: 'PURCHASE',
        createdAt: { gte: ninetyDaysAgo },
      },
      include: {
        session: {
          include: {
            items: { include: { product: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Guard: Need minimum 5 transactions for statistically meaningful classification
    if (transactions.length < 5) {
      return BehavioralFeatures.insufficientData();
    }

    // Feature extraction
    const categoryFrequency = this.computeCategoryFrequency(transactions);
    const avgTicket = this.computeAvgTicket(transactions);
    const avgPurchaseHour = this.computeAvgPurchaseHour(transactions);
    const weeklyFrequency = this.computeWeeklyFrequency(transactions, ninetyDaysAgo);
    const sponsoredRatio = this.computeSponsoredRatio(transactions);
    const organicPreferenceScore = this.computeOrganicScore(categoryFrequency);

    return new BehavioralFeatures({
      categoryFrequency,
      avgTicket,
      avgPurchaseHour,
      weeklyFrequency,
      sponsoredRatio,
      organicPreferenceScore,
    });
  }

  private computeCategoryFrequency(
    transactions: PointsTransactionWithSession[],
  ): Map<string, number> {
    const freq = new Map<string, number>();
    for (const tx of transactions) {
      for (const item of tx.session?.items ?? []) {
        const category = item.product?.category ?? 'UNKNOWN';
        freq.set(category, (freq.get(category) ?? 0) + 1);
      }
    }
    return freq;
  }

  private computeAvgTicket(transactions: PointsTransactionWithSession[]): number {
    const tickets = transactions.map(tx => tx.session?.items?.reduce(
      (sum, item) => sum + (item.product?.price ?? 0),
      0,
    ) ?? 0);
    return tickets.reduce((sum, t) => sum + t, 0) / tickets.length;
  }

  // ... additional private methods for remaining features
}
```
2. **QR Generation and Validation**

**Business Context**: Shoppers generate a QR code at checkout containing a signed, time-sensitive token that embeds a hash of their session items. The POS operator scans this QR and validates it against the physical cart contents. Any tampering or item mismatch is detected cryptographically.

**Participants**: ``CheckoutService.generateQr()`` (generation), ``QrSigner`` (JWT signing), ``CheckoutService.validateSession()`` (validation), ``ShoppingSession.validateItems()`` (domain comparison).

**Step by step algorithm**
```
QR GENERATION (mobile client → backend):
├── File: apps/api/src/modules/checkout/application/services/checkout.service.ts
├── Method: CheckoutService.generateQr(sessionId)
├── Algorithm:
│   1. Load session from repository
│   2. Call session.requestCheckout() — domain validation:
│      a. Guard: status must be ACTIVE
│      b. Guard: items.length must be > 0
│      c. Transition status to PENDING_CHECKOUT
│   3. Compute deterministic item hash:
│      a. Sort items alphabetically by barcode
│      b. Concatenate as "barcode:quantity" pairs separated by "|"
│         Example: "123:1|456:2|789:1"
│      c. Compute SHA-256 hash of the concatenated string
│   4. Build JWT payload:
│      {
│        sub: sessionId,
│        uid: userId,
│        hash: itemHash,
│        iat: Math.floor(Date.now() / 1000),
│        exp: Math.floor(Date.now() / 1000) + 300 // 5 minutes
│      }
│   5. Sign with HS256 using secret from environment (QR_SIGNING_SECRET)
│   6. Return QrTicket { token, expiresAt }
└── Client renders token as QR code using react-native-qrcode-svg

QR VALIDATION (POS → backend):
├── File: apps/api/src/modules/checkout/application/services/checkout.service.ts
├── Method: CheckoutService.validateSession(qrToken, scannedItems)
├── Algorithm:
│   1. Decode JWT WITHOUT verification first (extract header)
│   2. Verify signature using QR_SIGNING_SECRET
│      → If invalid: throw InvalidQrTokenError (tampered or forged)
│   3. Check exp claim:
│      → If current time > exp: throw QrTokenExpiredError
│   4. Extract payload: { sub: sessionId, uid: userId, hash: itemHash }
│   5. Load session from repository by sessionId
│   6. Guard: session.status must be PENDING_CHECKOUT
│      → If COMPLETED: throw SessionAlreadyCompletedError
│      → If EXPIRED: throw SessionExpiredError
│   7. Compute hash of scannedItems (from POS):
│      a. Sort by barcode
│      b. Concatenate "barcode:quantity"
│      c. SHA-256 hash
│   8. Compare scannedHash with itemHash from token:
│      → If mismatch: throw QrItemMismatchError { sessionItems, scannedItems, sessionHash, scannedHash }
│   9. If match: proceed to points calculation and transaction commit
│  10. After commit: emit CheckoutCompletedEvent
└── Response: { success: true, pointsAwarded: 250 }
```
```
// 📁 apps/api/src/modules/checkout/infrastructure/crypto/jwt-qr.signer.ts

@Injectable()
export class JwtQrSigner implements IQrSigner {
  private readonly secret: Buffer;

  constructor() {
    this.secret = Buffer.from(process.env.QR_SIGNING_SECRET ?? '', 'utf-8');
    if (this.secret.length < 32) {
      throw new Error('QR_SIGNING_SECRET must be at least 32 characters');
    }
  }

  async sign(payload: QrPayload): Promise<string> {
    return new Promise((resolve, reject) => {
      jwt.sign(
        payload,
        this.secret,
        {
          algorithm: 'HS256',
          expiresIn: '5m',
          issuer: 'smartcart-qr',
          subject: payload.sessionId,
        },
        (err, token) => {
          if (err) reject(new QrSigningFailedError(err.message));
          else resolve(token!);
        },
      );
    });
  }

  async verify(token: string): Promise<QrPayload> {
    return new Promise((resolve, reject) => {
      jwt.verify(
        token,
        this.secret,
        {
          algorithms: ['HS256'],
          issuer: 'smartcart-qr',
          clockTolerance: 10, // 10-second clock skew tolerance
        },
        (err, decoded) => {
          if (err) {
            if (err instanceof jwt.TokenExpiredError) {
              reject(new QrTokenExpiredError(err.expiredAt));
            } else {
              reject(new InvalidQrTokenError(err.message));
            }
          } else {
            resolve(decoded as QrPayload);
          }
        },
      );
    });
  }
}
```
```
// 📁 apps/api/src/modules/checkout/domain/entities/shopping-session.entity.ts (extract)

// Deterministic hash computation — same input always produces same hash
computeItemHash(): string {
  const data = this._items
    .map(item => item.barcode)
    .sort() // Alphabetical sort ensures deterministic output
    .join('|');

  return createHash('sha256').update(data).digest('hex');
}

// Validation method called during checkout
validateItems(scannedItems: ScannedItem[]): boolean {
  const scannedSorted = [...scannedItems]
    .sort((a, b) => a.barcode.localeCompare(b.barcode));

  const scannedHash = createHash('sha256')
    .update(scannedSorted.map(i => i.barcode).join('|'))
    .digest('hex');

  const sessionHash = this.computeItemHash();

  if (scannedHash !== sessionHash) {
    throw new QrItemMismatchError({
      sessionId: this.id,
      expectedHash: sessionHash,
      receivedHash: scannedHash,
      sessionItems: this._items.map(i => i.barcode),
      scannedItems: scannedSorted.map(i => i.barcode),
    });
  }

  return true;
}
```
3. **Points calculation**

**Business Context**: Points are awarded per product based on the product's pointsConfig. Three strategies are supported at launch: fixed points per unit (e.g., 50 points per item regardless of price), spend multiplier (e.g., 2 points per dollar spent), and volume tiers (e.g., 10 points/unit for 1-5 units, 20 points/unit for 6+). The system must be extensible for future schemes (weekend bonuses, segment-based multipliers) without modifying the checkout flow.

**Participants**: ``PointsService``, ``PointsStrategyResolver``, ``IPointsCalculationStrategy`` implementations.

Algorithm covered in Strategy Pattern section above. See ``apps/api/src/modules/checkout/application/services/points.service.ts`` and ``apps/api/src/modules/checkout/domain/strategies/*.strategy.ts``.

4. **Session Manager**

**Business Context**: Shopping sessions have a finite state machine (FSM) lifecycle. Transitions are guarded by business rules. Expired sessions must be cleaned up automatically.

**Participants**: ``ShoppingSession`` (domain entity with FSM methods), ``SessionExpirationCron`` (scheduled job), ``ISessionRepository``.

**State machine**:
```
                    ┌─────────┐
                    │  ACTIVE  │
                    └────┬─────┘
                         │
              ┌──────────┼──────────┐
              │ requestCheckout()    │ expire() (timer or cron)
              │ (requires items > 0) │
              ▼                      ▼
     ┌─────────────────┐    ┌─────────┐
     │ PENDING_CHECKOUT │    │ EXPIRED │
     └────────┬────────┘    └─────────┘
              │
              ├── validateItems(success) ──▶ COMPLETED
              │
              └── validateItems(failure) ──▶ VALIDATION_FAILED

```
```
// 📁 apps/api/src/modules/checkout/domain/entities/shopping-session.entity.ts (FSM)

export class ShoppingSession {
  // State transitions — each method guards its transition

  addItem(item: SessionItem): void {
    if (this._status !== SessionStatus.ACTIVE) {
      throw new SessionNotActiveError(this.id, this._status);
    }
    this._items.push(item);
  }

  requestCheckout(): void {
    if (this._status !== SessionStatus.ACTIVE) {
      throw new InvalidStateTransitionError(this._status, SessionStatus.PENDING_CHECKOUT);
    }
    if (this._items.length === 0) {
      throw new EmptySessionError(this.id);
    }
    this._status = SessionStatus.PENDING_CHECKOUT;
  }

  completeValidation(): void {
    if (this._status !== SessionStatus.PENDING_CHECKOUT) {
      throw new InvalidStateTransitionError(this._status, SessionStatus.COMPLETED);
    }
    this._status = SessionStatus.COMPLETED;
  }

  markValidationFailed(): void {
    if (this._status !== SessionStatus.PENDING_CHECKOUT) {
      throw new InvalidStateTransitionError(this._status, SessionStatus.VALIDATION_FAILED);
    }
    this._status = SessionStatus.VALIDATION_FAILED;
  }

  expire(): void {
    if (this._status === SessionStatus.COMPLETED) {
      return; // Idempotent — completed sessions can't expire
    }
    this._status = SessionStatus.EXPIRED;
  }
}
```

```
// 📁 apps/api/src/modules/checkout/application/services/session-expiration.service.ts

@Injectable()
export class SessionExpirationService {
  constructor(
    @Inject('ISessionRepository') private readonly sessionRepo: ISessionRepository,
  ) {}

  /**
   * Runs every 5 minutes via @Cron.
   * Expires any ACTIVE session older than 2 hours with no activity.
   */
  @Cron('*/5 * * * *')
  async expireStaleSessions(): Promise<void> {
    const cutoff = new Date(Date.now() - 2 * 60 * 60 * 1000); // 2 hours ago

    const staleSessions = await this.prisma.shoppingSession.findMany({
      where: {
        status: 'ACTIVE',
        createdAt: { lt: cutoff },
      },
      select: { id: true },
    });

    for (const { id } of staleSessions) {
      await this.sessionRepo.markExpired(id);
    }

    if (staleSessions.length > 0) {
      this.logger.log(`Expired ${staleSessions.length} stale sessions`);
    }
  }
}
```
**Pattern interaction diagram**
```
┌────────────────────────────────────────────────────────────────────────────────┐
│              PATTERN INTERACTION — Checkout Validation Flow                      │
│                                                                                │
│  [Controller]                [Service Layer]           [Domain]                │
│  POST /validate              CheckoutService           ShoppingSession         │
│       │                           │                         │                  │
│       │──── DTO validation ──────▶│                         │                  │
│       │   (ZodValidationPipe)     │                         │                  │
│       │                           │──── findById() ────────▶│                  │
│       │                           │   (Repository Pattern)  │                  │
│       │                           │◀────────────────────────│                  │
│       │                           │                         │                  │
│       │                           │──── verify() ──────────▶│                  │
│       │                           │   (QrSigner)            │ (Factory         │
│       │                           │                         │  created         │
│       │                           │                         │  QrTicket)       │
│       │                           │                         │                  │
│       │                           │──── validateItems() ───▶│                  │
│       │                           │                         │ (Domain logic    │
│       │                           │                         │  with hash       │
│       │                           │                         │  comparison)     │
│       │                           │◀────────────────────────│                  │
│       │                           │                         │                  │
│       │                           │──── calculatePoints() ─▶│                  │
│       │                           │   (PointsService)       │ (Strategy        │
│       │                           │         │               │  Pattern)        │
│       │                           │         ▼               │                  │
│       │                           │   [StrategyResolver]    │                  │
│       │                           │   → FixedPoints         │                  │
│       │                           │   → SpendMultiplier     │                  │
│       │                           │   → VolumeTier          │                  │
│       │                           │◀────────────────────────│                  │
│       │                           │                         │                  │
│       │                           │── $transaction() ───────│                  │
│       │                           │   (Prisma ACID)         │                  │
│       │                           │   → markCompleted()     │                  │
│       │                           │   → creditPoints()      │                  │
│       │                           │                         │                  │
│       │                           │── publish(event) ───────│                  │
│       │                           │   (Observer Pattern)    │                  │
│       │                           │   → BullMQ Queue        │                  │
│       │                           │                         │                  │
│       │◀──── DTO response ────────│                         │                  │
│       │    (ValidationResponse)   │                         │                  │
└────────────────────────────────────────────────────────────────────────────────┘
```

**Repository reoganization for maintaninability**
```
apps/api/src/modules/checkout/
├── presentation/
│   ├── controllers/
│   │   ├── session.controller.ts          # REST endpoints for session CRUD
│   │   ├── qr.controller.ts               # REST endpoint for QR generation
│   │   └── validation.controller.ts       # REST endpoint for POS validation
│   ├── gateways/
│   │   └── session.gateway.ts             # WebSocket for real-time status push
│   └── dto/
│       ├── create-session.dto.ts           # Request DTOs (re-export from shared-types)
│       ├── add-item.dto.ts
│       └── validation.dto.ts
│
├── application/
│   ├── services/
│   │   ├── checkout.service.ts            # Main orchestrator
│   │   ├── points.service.ts              # Points calculation + crediting
│   │   ├── session-expiration.service.ts  # Cron job for stale sessions
│   │   └── qr-generation.service.ts       # QR token orchestration
│   ├── interfaces/
│   │   ├── session-repository.interface.ts
│   │   ├── event-publisher.interface.ts
│   │   ├── qr-signer.interface.ts
│   │   ├── points-service.interface.ts
│   │   └── catalog-service.interface.ts
│   └── commands/
│       └── validate-session.command.ts     # CQRS command object
│
├── domain/
│   ├── entities/
│   │   ├── shopping-session.entity.ts
│   │   ├── session-item.entity.ts
│   │   └── qr-ticket.entity.ts
│   ├── value-objects/
│   │   ├── session-status.enum.ts
│   │   ├── points-config.vo.ts
│   │   ├── points-awarded.vo.ts
│   │   └── barcode.vo.ts
│   ├── events/
│   │   └── checkout-completed.event.ts
│   ├── strategies/
│   │   ├── points-calculation-strategy.interface.ts
│   │   ├── fixed-points.strategy.ts
│   │   ├── spend-multiplier.strategy.ts
│   │   ├── volume-tier.strategy.ts
│   │   └── weekend-bonus.strategy.ts
│   ├── factories/
│   │   ├── session.factory.ts
│   │   └── qr-ticket.factory.ts
│   ├── errors/
│   │   ├── session-not-active.error.ts
│   │   ├── qr-token-expired.error.ts
│   │   ├── qr-item-mismatch.error.ts
│   │   └── invalid-state-transition.error.ts
│   └── state-machine/
│       ├── session-state-machine.ts
│       └── transitions.ts
│
├── infrastructure/
│   ├── repositories/
│   │   └── prisma-session.repository.ts
│   ├── events/
│   │   └── bullmq-event.publisher.ts
│   └── crypto/
│       └── jwt-qr.signer.ts
│
└── checkout.module.ts                     # NestJS module wiring

```
---

## 2.4 API Design

- **Style**: REST with OpenAPI 3.1 specification — SmartCart exposes a RESTful API over HTTPS because the frontend React Native application uses Axios with REST semantics already established (see Section 1.1 Technology Stack: apiClient). REST provides straightforward caching semantics (ETags, Cache-Control headers) that align with TanStack Query's client-side cache strategy, predictable HTTP status codes for error mapping in the Axios interceptor, and simpler debugging than GraphQL for the critical POS validation endpoint where reliability trumps query flexibility.

- **Versioning Strategy**: URL prefix versioning: /api/v1/ — The major version is embedded in the URL path. Breaking changes (field removal, type changes, endpoint removal) increment the version to /api/v2/. Non-breaking additions (new optional fields, new endpoints) are added to the current version without a version bump. Deprecated fields are marked with the x-deprecated OpenAPI extension and the Sunset HTTP header, giving clients 90 days to migrate.

- **Base URL**: https://api.smartcart.app/api/v1

- **OpenAPI Specification Location**: docs/api/openapi.yaml in the monorepo root. Automatically served at https://api.smartcart.app/api/docs via @nestjs/swagger in development and staging environments. Production serves a static HTML page with Redoc rendering.

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
| POST   | /auth/register| Register a new shopper account                                                                | No                                | 5 req/min per IP      |
| POST   | /auth/login   | Authenticate with email/password, receive accessToken and refreshToken                        | No                                | 10 req/min per IP     |
| POST   | /auth/refresh | Exchange a valid refreshToken for a new accessToken                                           | Refresh token (HTTP-only cookie)  | 20 req/min per IP     |
| POST   | /auth/logout  | Revoke the current refreshToken                                                               | Yes (access token)                | —                     |

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
| GET    | /users/me                   | Get current user profile with points balance     | Yes (JWT)     |
| PATCH  | /users/me                   | Update profile (name, phone)                     | Yes (JWT)     |
| GET    | /users/me/points/history    | Paginated points transaction history             | Yes (JWT)     |

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
| GET    | /products/:barcode                  | Lookup product by barcode          | Yes (JWT)     | Redis Cache-Aside, TTL 1h           |
| GET    | /products/search?q=leche&limit=10   | Search products by name/brand      | Yes (JWT)     | Redis, TTL 5 min                    |

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
| POST   | /sessions                     | Create a new shopping session for the authenticated user | Yes (JWT)            |
| GET    | /sessions/active              | Get the user's currently active session (if any)         | Yes (JWT)            |
| POST   | /sessions/:id/items           | Add a scanned item to the session                        | Yes (JWT)            |
| DELETE | /sessions/:id/items/:itemId   | Remove an item from the session (undo scan)              | Yes (JWT)            |
| POST   | /sessions/:id/qr              | Finalize session and generate checkout QR                | Yes (JWT)            |
| POST   | /sessions/:id/validate        | POS endpoint: Validate QR and credit points              | POS API Key          |
| GET    | /sessions/:id                 | Get session details (for receipt/history)                | Yes (JWT)            |

- **Rewards** 
| Method | Path                  | Description                                      | Auth Required |
|--------|-----------------------|--------------------------------------------------|---------------|
| GET    | /rewards              | List all active rewards                          | Yes (JWT)     |
| GET    | /rewards/:id          | Get reward details                               | Yes (JWT)     |
| POST   | /rewards/:id/redeem   | Redeem points for a reward; returns coupon code  | Yes (JWT)     |

- **B2B Analytics** 
| Method | Path                               | Description                                                           | Auth Required  |
|--------|------------------------------------|-----------------------------------------------------------------------|----------------|
| GET    | /analytics/segments                | Get consumer segment distribution (optionally filtered by ?storeId=)  | B2B API Key    |
| GET    | /analytics/products/:id/insights   | Get demand predictions and performance metrics for a product          | B2B API Key    |
| GET    | /analytics/stores/:id/overview     | Get store-level metrics (avg ticket, peak hours, segment mix)         | B2B API Key    |

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
| BullMQ (Redis-backed)              | Consumer profiling pipeline triggered after checkout validation                                   | analytics-profile-update     | { userId, sessionId, storeId, items[], pointsAwarded, timestamp }                                            |
| BullMQ (Redis-backed)              | Push notification to mobile device after points are credited                                      | push-notifications           | { userId, pointsAwarded, sessionId, pushToken }                                                              |
| WebSocket (Socket.IO + Redis adapter) | Real-time QR validation status pushed to mobile client so the screen flips from "Esperando validación…" to the confirmation screen | session:{sessionId} room     | { event: 'sessionValidated', sessionId, pointsAwarded, timestamp }                                           |
| WebSocket (Socket.IO + Redis adapter) | Session expiry notification if the POS does not validate within 5 minutes                        | session:{sessionId} room     | { event: 'sessionExpired', sessionId, reason: 'QR_TIMEOUT' }                                                 |

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
```
// 📁 apps/api/src/common/interceptors/audit.interceptor.ts
import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { Logger } from '@nestjs/common';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  private readonly auditLogger = new Logger('Audit');

  private readonly SENSITIVE_ACTIONS = [
    'login', 'register', 'logout', 'refresh',
    'redeemReward', 'validateSession',
    'updateProfile', 'deleteAccount',
  ];

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const handlerName = context.getHandler().name;
    const controllerName = context.getClass().name;

    // Only audit sensitive actions
    const isSensitive = this.SENSITIVE_ACTIONS.some(
      action => handlerName.toLowerCase().includes(action.toLowerCase()),
    );

    if (!isSensitive) return next.handle();

    const auditEntry = {
      action: `${controllerName}.${handlerName}`,
      userId: request.user?.sub ?? 'anonymous',
      userRole: request.user?.role ?? 'anonymous',
      ip: request.ip,
      userAgent: request.headers['user-agent'],
      correlationId: request.headers['x-correlation-id'],
      method: request.method,
      path: request.url,
      timestamp: new Date().toISOString(),
    };

    return next.handle().pipe(
      tap({
        next: (response) => {
          this.auditLogger.log({
            ...auditEntry,
            status: 'SUCCESS',
            responseStatus: 200,
          });
        },
        error: (error) => {
          this.auditLogger.warn({
            ...auditEntry,
            status: 'FAILURE',
            responseStatus: error.status ?? 500,
            errorCode: error.response?.errorCode,
          });
        },
      }),
    );
  }
}
```
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
