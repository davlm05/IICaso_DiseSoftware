# UX Analysis

## Test Setup

- **Platform Used:** Maze | User Research and Testing Platform
- **Prototype Link:** [https://t.maze.co/542525865]
- **Prototype Scope:** Main onboarding, product scanning, QR checkout, and rewards redemption flow
- **Number of Participants:** 4

### Defined Tasks

| # | Task Description | Success Criteria |
|---|-----------------|-----------------|
| 1 | Normal flow of the buyer | Scan and complete list and reach the rewards screen |

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

## Usability Attributes

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

---

## Branding & Style Guidelines

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

### Typography

| Role | Font Family | Weight | Size | Usage |
|------|-------------|--------|------|-------|
| Display / Heading | Poppins | 700 | 24px | Screen titles, points total |
| Subheading | Poppins | 600 | 18px | Section headers ("Productos con puntos hoy") |
| Body | Inter | 400 | 16px | General text, product names |
| Caption | Inter | 400 | 12px | Labels, hints, expiry dates, alphanumeric QR fallback |
| Button | Poppins | 600 | 14px | CTA text |

### Spacing & Layout

| Token | Value | Usage |
|-------|-------|-------|
| `--spacing-xs` | 4px | Tight spacing (tag padding) |
| `--spacing-sm` | 8px | Internal component padding |
| `--spacing-md` | 16px | Default padding, card gaps |
| `--spacing-lg` | 24px | Section spacing |
| `--spacing-xl` | 32px | Screen-level padding |

- **Grid System:** Single-column, mobile-first stacked layout (one primary action per screen); 4pt spacing scale.
- **Breakpoints:** `sm: 375px` (baseline phone), `md: 768px` (large phones/tablet), `lg: 1024px` (tablet landscape).
- **Iconography:** Lucide React Native (`lucide-react-native` 0.468.0) — consistent outline set for nav, scan, flash, delete, rewards.
- **Logo Usage Rules:** Minimum 24px height; maintain clear space equal to the cart glyph height; never recolor outside the primary/secondary green or white-on-green.

---

## Core Business Process

### Onboarding & Home (Lobby)
1. The user opens the app upon arriving at a store.
2. The system detects the user's presence in an affiliated store and enables point accumulation for the session.
3. The user reviews their current point balance, progress toward the next reward, and the day's sponsored products.
4. The user chooses to begin scanning or to review pending items from a prior moment in the session.

### Product Scanning & Pending List
1. The user initiates scanning.
2. The system activates barcode capture (camera by default).
3. Alternatively, the user provides the barcode manually when the printed code is damaged.
4. Once a code is captured, the system retrieves the product details and asks the user to confirm the detected product.
5. Upon confirmation, the system validates that the user is in-store, the format is valid, the product is sponsored, and it is not already in the session, then adds it with its pending points.
6. The user may continue scanning or move toward checkout.

### Checkout & Points Validation
1. With shopping complete, the user requests a checkout validation code.
2. The system issues a unique, time-limited (10-minute) code representing the pending items.
3. The user presents the code to the cashier.
4. The system waits for the store's confirmation of the purchase.
5. Upon confirmation, the system credits the corresponding points and informs the user that the purchase was verified.

### Rewards Redemption
1. The user opens the rewards section.
2. The system shows the available point balance and the redeemable rewards, marking those still out of reach with the missing amount.
3. The user selects a reward and confirms spending the points.
4. The system deducts the points and issues a coupon ready to use.

---

## Wireframes

| Screen | Prototype | Purpose |
|--------|----------------|---------|
| 1 — Lobby (empty) | ![1](media/wireframes/1.png) | Overview of points, sponsored products, primary scan CTA, location pill. |
| 2 — Camera Scanning | ![2](media/wireframes/2.png) | Capture barcode via camera with manual-entry fallback and in-store confirmation. |
| 3 — Lobby (1 product) | ![3](media/wireframes/3.png) | First scanned product with toast, pending-points subsection, delete option. |
| 4 — Lobby (multiple) | ![4](media/wireframes/4.png) | Full pending list with dual CTAs (scan more / generate QR). |
| 5 — QR Validation | ![5](media/wireframes/5.png) | Full-green QR + alphanumeric fallback, 10-min validity, polling status. |
| 6 — Confirmation | ![6](media/wireframes/6.png) | Points-credited hero, validated products, new total, paths to home or rewards. |
| 7 — My Rewards | ![7](media/wireframes/7.png) | Available rewards + redeemed coupons tabs; locked rewards show point deficit. |

---

## UX Test Results

- **Platform Used:** Maze (unmoderated remote) + in-person sessions with external design students.
- **Key Findings (expected focus areas):** discoverability of the manual-entry fallback on the scan screen; clarity of the "pending vs credited" points distinction; one-tap QR generation satisfaction.
- **Corrections Integrated:** track each finding in the Phase 1 "Key Findings & Applied Corrections" table and reflect the applied fix in the final NativeWind component styles.

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
| **List Virtualization** | @shopify/flash-list | **1.7.x** | High-performance virtualized lists for `PendingItemsList`, `RewardsCatalog`, and `CouponsList` — faster and lower-memory than `FlatList`. Compatible with RN 0.76 New Architecture. |
| **Image Loading** | expo-image | **2.0.x** | Cached, performant images for the sponsored carousel (`cachePolicy="memory-disk"`, WebP). Shipped with Expo SDK 52. |
| **Iconography** | lucide-react-native | **0.468.0** | Consistent outline icon set (nav, scan, flash, delete, rewards) wrapped by the `Icon` atom. |
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

## 1.2. Component Design Strategy

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

## 1.3. Security

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

## 1.4. Layered Architecture

- **Layer Responsibilities:**

| Layer | Responsibility | Examples |
|-------|---------------|----------|
| Presentation | Render UI, handle gestures/events | Screens, atoms/molecules/organisms |
| Application / Use Cases | Orchestrate use cases: drive the session flow, apply Domain rules, reach Infrastructure through interfaces | Custom hooks, Zustand session store (**Singleton**), **Command** objects (Add/Remove/GenerateQR/Redeem), session **State** machine + states, scan-validation **Chain of Responsibility** |
| Domain | Pure business entities & rules — no React, no Infrastructure | `Product`/`ProductDTO`, `Reward`/`RewardDTO`, `Session/SessionDTO`, points rules, barcode-format & scan-validation rules, reward-type definitions (**Factory** products) |
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

## 1.5. Design Patterns
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

Errors are handled by a single pipeline: every API error is caught by the Axios response interceptor. A `401` is intercepted first by `onUnauthorized()`; every other error is normalized into a typed `AppError` by `ApiErrorMapper` via `onError()`, and then either retried or surfaced to the user through the global `NotificationSlice`. Render-time crashes are caught by per-feature Error Boundaries. The design below makes the components, the error taxonomy, and the flow explicit.

#### Components

```mermaid
classDiagram
    class ApiClient {
        -instance: AxiosInstance
        +request(config) Response
        -onUnauthorized(error) Response
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

> **Canonical codes:** The backend wire error codes (§2.8) are the source of truth, defined
> once in `@smartcart/shared-types`. `ApiErrorMapper` maps them to the client-side `AppError.code`
> above: `QR_TOKEN_EXPIRED → QR_EXPIRED`, `QR_ITEM_MISMATCH → VALIDATION_REJECTED`,
> `SESSION_NOT_FOUND → VALIDATION_REJECTED`, `UNAUTHORIZED`/`INVALID_QR_TOKEN → SESSION_EXPIRED`
> (or a security alert). Client-only conditions (`NETWORK_ERROR`, `SERVER_ERROR`, `UNKNOWN`)
> have no backend code.

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

## 1.6. Performance

| Strategy | Where (file / config) | How |
|----------|-----------------------|-----|
| **Lazy Loading** | `/app/*.tsx` (Expo Router routes), `/app/scan.tsx` | Expo Router code-loads each route on demand by default. Mount the camera only while the Scan route is focused — gate `<CameraView>` behind `useIsFocused()` so it unmounts on blur. |
| **Code Splitting** | `metro.config.js`, `/features/*` | Enable `transformer.inlineRequires` in Metro. Import heavy modules (`expo-camera`, `react-native-qrcode-svg`) **inside** their feature module, never from a root barrel, so Metro splits them out. |
| **Bundle Optimization** | `metro.config.js` (tree-shaking: `experimentalImportSupport`), `expo-build-properties` in `app.json` (`enableProguardInReleaseBuilds`, `enableShrinkResourcesInReleaseBuilds`), `eas.json` (`production`, Android `buildType: app-bundle`), `app.json` (`jsEngine: "hermes"`) | Shrink shipped size with distinct levers: Metro tree-shaking strips unused ESM imports from the JS bundle (opt-in via `EXPO_UNSTABLE_METRO_OPTIMIZE_GRAPH=1`); R8 code shrinking + resource shrinking remove unused native code and unreferenced assets; the AAB lets Play serve per-ABI/density/language splits so each user downloads only their slice; assets are pre-compressed. Hermes is kept for **startup** (AOT bytecode), with only a minor secondary size gain — not the main size lever. Measure JS composition with `EXPO_UNSTABLE_ATLAS=true npx expo export` + `npx expo-atlas`, and the shipped AAB with the Play Console app-size report. |
| **Image Optimization** | `/components/molecules/ProductCard.tsx`, `/components/organisms/SponsoredCarousel.tsx` | Use `expo-image`'s `<Image>` with `cachePolicy="memory-disk"` and `contentFit="cover"`; serve sponsored images as WebP at device-appropriate resolution. |
| **Memoization** | `/components/molecules/ProductCard.tsx`, `RewardCard.tsx`, `/store/sessionStore.ts`, `/hooks/` | Wrap list items in `React.memo`; compute pending-points totals with `useMemo` and pass stable callbacks via `useCallback`; read state with selective Zustand selectors (`useSessionStore(s => s.pending)`) to avoid whole-store re-renders. |
| **Virtualization** | `/components/organisms/PendingItemsList.tsx`, `RewardsCatalog.tsx`, `CouponsList.tsx` | Render long lists with `FlashList` (1.7.x) instead of `FlatList`; set `estimatedItemSize` and a stable `keyExtractor`. |
| **Caching** | `/api/`, `QueryClient` in `/app/_layout.tsx`, `eas.json` | Configure per-query `staleTime`/`gcTime` on the TanStack Query client (Cache-Aside for product/rewards lookups); ship JS-only fixes via `eas update` (OTA) without a store release. |

---

## 1.7. Testing Strategy

| Level | Tool | Where (location / naming) | How | Min. Coverage |
|-------|------|---------------------------|-----|---------------|
| **Unit** | Jest 29.7.0 (jest-expo 52) | `__tests__/*.test.ts` co-located beside source: `/features/session/commands/`, `/features/scan/validation/`, `/store/`, `/lib/`; config in `jest.config.js` + `jest.setup.ts`. Template: [`addItemCommand.test.ts`](/frontend/src/features/session/commands/__tests__/addItemCommand.test.ts) | Pure-logic tests with mocked dependencies: command objects incl. `undo`, each CoR validation handler in isolation, points rules. No rendering. | 80% |
| **Integration** | React Native Testing Library 12.8.0 | `/components/**/__tests__/*.test.tsx`. Template: [`ScanConfirmationModal.test.tsx`](/frontend/src/components/molecules/__tests__/ScanConfirmationModal.test.tsx) | `render()` the component, drive it with `fireEvent`/`userEvent`, assert via accessibility queries (`getByRole`/`getByLabelText`); mock the API layer (jest mocks / MSW). Covers scan-confirm modal, delete-with-undo, QR generation, manual-entry fallback, redemption. | 70% |
| **UI / E2E** | Maestro 1.39.x | `.maestro/*.yaml` flow files. Template: [`scan-to-redeem.yaml`](/.maestro/scan-to-redeem.yaml) | One YAML flow per critical journey (login → scan → generate QR → confirm → redeem); run with `maestro test .maestro/` locally and in CI. | Key flows 100% |
| **Accessibility** | `@axe-core/react` + manual VoiceOver/TalkBack passes | Component `__tests__` (automated) + manual device passes. Template: [`Button.a11y.test.tsx`](/frontend/src/components/atoms/__tests__/Button.a11y.test.tsx) | Wire `@axe-core/react` in dev and assert no violations in component tests; complete manual VoiceOver (iOS) / TalkBack (Android) passes on each interactive screen. | 0 critical violations |

---

## 1.8. CI/CD Pipeline (Frontend)

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

The pipeline is defined in **[`.github/workflows/ci.yml`](/.github/workflows/ci.yml)**; each step runs an `npm` script from `package.json` or an EAS command driven by `eas.json`. The `EXPO_TOKEN` secret lives in the GitHub repo settings (Settings → Secrets).

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

## 1.9. Project Scaffold

- **Root:** [`/frontend/scr`](/frontend/src/) 

```
/frontend/src
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

---

# 2. Backend Design

## 2.1. Technology Stack

| Concern | Choice | Version | Justification |
|---|---|---|---|
| API Style | REST + OpenAPI | — | Frontend `apiClient` already REST; Swagger auto-gen in Nest |
| Language | TypeScript / Node.js | 5.5 / 20 LTS | Shared DTOs + Zod schemas live in **`@smartcart/shared-types`**, imported 1:1 by both `frontend/` and `backend/apps/api` → zero contract drift |
| Framework | NestJS | 10.4 | DI + modules map to template's layered design + Repository/Service/DTO patterns out-of-box |
| ORM/DB | Prisma 5.20 / PostgreSQL | 17 | Template schema is relational; Prisma migrations + type-safety |
| Async | BullMQ | 5.x | Analytics profiling + push notif queues (template 2.4) |
| Cache | Redis | 7.2 | Session read-through cache (keeps the API stateless; PostgreSQL is authoritative), profile cache invalidation |
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
    subgraph Presentation["Presentation Layer"]
        direction LR
        SessionCtrl["<b>SessionController</b><br/><i>REST</i><br/>POST /sessions<br/>POST /sessions/:id/items"]
        QrCtrl["<b>QrController</b><br/><i>REST</i><br/>POST /sessions/:id/qr"]
        ValidationCtrl["<b>ValidationController</b><br/><i>REST</i><br/>POST /sessions/:id/validate"]
        SessionGW["<b>SessionGateway</b><br/><i>WebSocket · JWT handshake auth</i><br/>emit: sessionStatusChanged<br/>on: subscribe:session (ownership-checked)"]
    end

    %% ==========================================
    %% APPLICATION LAYER
    %% ==========================================
    subgraph Application["Application Layer"]
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
    subgraph Domain["Domain Layer"]
        direction TB
        
        Session["<b>ShoppingSession</b><br/><i>Aggregate Root</i><br/>+id: string<br/>+userId: string<br/>+storeId: string<br/>+status: SessionStatus<br/>+items: SessionItem[]<br/>+addItem()<br/>+requestCheckout()<br/>+validateItems()"]
        
        SessionItem["<b>SessionItem</b><br/><i>Entity</i><br/>+productId: string<br/>+barcode: string<br/>+quantity: number<br/>+pointsValue: number"]
        
        QrTicket["<b>QrTicket</b><br/><i>Value Object</i><br/>+token: string<br/>+expiresAt: Date<br/>+sessionId: string<br/>+itemHash: string<br/>+isExpired()<br/>+verifyHash()"]
        
        CheckoutEvent["<b>CheckoutCompletedEvent</b><br/><i>Domain Event</i><br/>+sessionId: string<br/>+userId: string<br/>+pointsAwarded: number<br/>+items: Array<br/>+timestamp: Date"]
        
        SessionStatus["<b>SessionStatus</b><br/><i>Enum</i><br/>ACTIVE<br/>PENDING_CHECKOUT<br/>COMPLETED<br/>VALIDATION_FAILED<br/>EXPIRED"]

        FixedStrat["<b>FixedPointsStrategy</b><br/>FIXED_PER_UNIT"]
        MultiplierStrat["<b>SpendMultiplierStrategy</b><br/>SPEND_MULTIPLIER"]
        VolumeStrat["<b>VolumeTierStrategy</b><br/>VOLUME_TIER"]
        WeekendStrat["<b>WeekendBonusStrategy</b><br/>WEEKEND_BONUS"]

        Session --> SessionItem
        Session --> SessionStatus
        IPointsCalc -.-> FixedStrat
        IPointsCalc -.-> MultiplierStrat
        IPointsCalc -.-> VolumeStrat
        IPointsCalc -.-> WeekendStrat
    end

    %% ==========================================
    %% INFRASTRUCTURE LAYER
    %% ==========================================
    subgraph Infrastructure["Infrastructure Layer"]
        direction TB
        
        PrismaSessionRepo["<b>PrismaSessionRepository</b><br/><i>implements ISessionRepository</i><br/>- prisma: PrismaService<br/>- redis: RedisService"]
        
        BullMqPublisher["<b>BullMqEventPublisher</b><br/><i>implements IEventPublisher</i><br/>- analyticsQueue: Queue"]
        
        JwtQrSignerImpl["<b>JwtQrSigner</b><br/><i>implements IQrSigner</i><br/>- secret: string"]
        
        SessionMapper["<b>SessionMapper</b><br/>toDomain()<br/>toPersistence()"]
    end

    subgraph ExternalDep["External Dependencies"]
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
    class Session,SessionItem,QrTicket,CheckoutEvent,SessionStatus,FixedStrat,MultiplierStrat,VolumeStrat,WeekendStrat domain
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
- `PointsCalculationStrategy` interface with `FixedPointsStrategy`, `SpendMultiplierStrategy`, `VolumeTierStrategy`, and `WeekendBonusStrategy` implementations

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
| Generation | Called by `CheckoutService.generateQr()`. Domain validation: session must be ACTIVE with ≥ 1 item. Compute deterministic item hash (sort barcodes alphabetically, concatenate with `|`, SHA-256). Sign JWT with HS256, 10-minute expiry. |
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

- QR tokens expire after 10 minutes — the JWT `exp` claim is the single source of truth (factory reads it, never sets its own)  
- 10-second clock skew tolerance for validation  
- `QR_SIGNING_SECRET` must be at least 32 characters  
- Tampered tokens fail signature verification; modified items fail hash comparison  

**What you need to implement:**

- [`backend/apps/api/src/modules/checkout/infrastructure/crypto/jwt-qr.signer.ts`](backend/apps/api/src/modules/checkout/infrastructure/crypto/jwt-qr.signer.ts) — Implement `sign(payload)` using `jsonwebtoken`: `jwt.sign(payload, secret, { algorithm: 'HS256', expiresIn: '10m' })`. Implement `verify(token)`: call `jwt.verify(token, secret)` — catch `TokenExpiredError` and re-throw as a typed `QrTokenExpiredError`, catch `JsonWebTokenError` as `InvalidQrTokenError`.
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
| 1    | Presentation | DTO               | `ZodValidationPipe` validates `ValidateSessionRequestSchema` against request body |
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

### Data Model

The relational model below is the single source of truth for the Prisma schema. The canonical
schema lives at `backend/apps/api/prisma/schema.prisma` (to be generated from this table);
domain entities are mapped to/from these rows by the infrastructure-layer mappers (§2.2 Rule 3).

```mermaid
erDiagram
    User ||--o{ ShoppingSession : owns
    User ||--o{ PointsTransaction : has
    User ||--o{ Redemption : makes
    User ||--o| ConsumerSegment : classified_as
    Store ||--o{ ShoppingSession : hosts
    Store ||--o{ ApiKey : scopes
    ShoppingSession ||--o{ SessionItem : contains
    ShoppingSession ||--o{ PointsTransaction : credits
    Product ||--o{ SessionItem : referenced_by
    Reward ||--o{ Redemption : redeemed_as
```

| Entity | Key fields | Notes |
|--------|-----------|-------|
| `User` | `id` (uuid, pk), `email` (unique), `fullName`, `passwordHash`, `phone?`, `pushToken?`, `role` (enum), `createdAt` | `role` ∈ `USER, BACKOFFICE_OPERATOR, CATALOG_MANAGER, STORE_ADMIN, SUPER_ADMIN` (§2.5). PII fields encrypted at rest. |
| `Store` | `id` (uuid, pk), `name`, `createdAt` | Referenced by `storeId` throughout sessions and analytics. |
| `Product` | `id` (uuid, pk), `barcode` (unique, EAN-8/13), `name`, `brand`, `imageUrl?`, `pointsConfig` (jsonb), `sponsored` (bool) | `pointsConfig` shape drives the strategy resolver (§2.3 Points). |
| `ShoppingSession` | `id` (uuid, pk), `userId` (fk→User), `storeId` (fk→Store), `status` (enum), `itemHash?`, `createdAt`, `updatedAt` | `status` ∈ `ACTIVE, PENDING_CHECKOUT, COMPLETED, VALIDATION_FAILED, EXPIRED` (§2.3 state machine). `itemHash` set at QR generation. |
| `SessionItem` | `id` (uuid, pk), `sessionId` (fk→Session, cascade), `productId` (fk→Product), `barcode`, `quantity` (int), `pointsValue` (int) | Composed under the `ShoppingSession` aggregate. |
| `PointsTransaction` | `id` (uuid, pk), `userId` (fk→User), `delta` (int, signed), `reason` (enum), `sessionId?` (fk→Session), `createdAt` | **Append-only ledger** — never updated/deleted. Balance = `SUM(delta)`. `reason` ∈ `PURCHASE, REDEMPTION, ADJUSTMENT`. Indexed on `(userId, createdAt)` for the 90-day analytics window. |
| `Reward` | `id` (uuid, pk), `name`, `description`, `cost` (int, points), `imageUrl?`, `active` (bool) | Catalog of redeemable rewards. |
| `Redemption` | `id` (uuid, pk), `userId` (fk→User), `rewardId` (fk→Reward), `couponCode` (unique), `status` (enum), `redeemedAt` | The issued coupon. `status` ∈ `ISSUED, USED, EXPIRED`. |
| `ConsumerSegment` | `userId` (fk→User, unique, pk), `segmentName`, `features` (jsonb), `updatedAt` | Upsert target of the analytics worker (§2.3 step 5). One row per user. |
| `ApiKey` | `id` (uuid, pk), `hashedKey` (SHA-256, unique), `type` (enum), `storeId?` (fk→Store), `label`, `createdAt` | Non-JWT auth for POS/B2B surfaces. `type` ∈ `POS, B2B`. |

**Integrity rules:** the points balance is *derived* (never stored) from `PointsTransaction`,
making it tamper-evident (§2.5 Audit Logging). `SessionItem` deletes cascade with the session;
`PointsTransaction` rows are immutable and never cascade. `ConsumerSegment` holds aggregated
features only — no raw transaction rows — supporting the B2B anonymization guarantee (§2.5 PII).

---

### Key Endpoints

| Method | Path                        | Description                                                                 | Auth Required        |
|--------|-----------------------------|-----------------------------------------------------------------------------|----------------------|
| POST   | `/auth/register`            | Register a new shopper account. Receives access token and refresh token in the response body. | No                   |
| POST   | `/auth/login`               | Authenticate with email/password. Receives access token and refresh token in the response body. | No                   |
| POST   | `/auth/refresh`             | Exchange the refresh token (sent in the request body) for a new access token (token rotation). | Refresh token (body) |
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

> **Module coverage:** `auth`, `checkout`, and `analytics` are scaffolded (§2.10). The
> `users` (`/users/me*`), `catalog` (`/products/*`), `rewards` (`/rewards/*`), and
> `notifications` modules are in MVP scope but **not yet scaffolded** — each follows the same
> four-layer structure (§2.2) and needs a controller, an application service, and (where
> stateful) a Prisma repository added before the endpoints above go live.

---

### Data Contracts (DTOs)

All DTOs are defined as TypeScript interfaces with accompanying Zod validation schemas in the shared package. Controllers use a global `ZodValidationPipe` for enforcement.  
**Source:** [`packages/shared-types/src/`](packages/shared-types/src/)

---

## 2.5. Security

| Concern              | Strategy                                                                                                                                                                                                                                                                                                                                 |
|----------------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| Transport            | HTTPS enforced via Nginx reverse proxy; all HTTP requests 301-redirected to HTTPS. TLS 1.3 minimum (TLS 1.2 accepted for legacy Android API < 26). HSTS header set to `max-age=31536000; includeSubDomains; preload` via Helmet middleware. Let's Encrypt certificates auto-renewed via Certbot. Config: [`backend/infra/docker/nginx/default.conf`](backend/infra/docker/nginx/default.conf). |
| Authentication       | JWT `accessToken` (HS256, 15-min expiry) sent in `Authorization: Bearer` header. `refreshToken` (7-day expiry) returned in the response body; the React Native client stores it in **expo-secure-store** (hardware-backed Keychain/Keystore), never `AsyncStorage`. Passwords hashed with `bcrypt` (cost factor 12). Account lockout after 5 failed attempts within 15 minutes (30-min lockout) via Redis. Token rotation on refresh; old tokens invalidated. JWT service: [`backend/apps/api/src/modules/auth/infrastructure/crypto/jwt.service.ts`](backend/apps/api/src/modules/auth/infrastructure/crypto/jwt.service.ts). Password service: [`backend/apps/api/src/modules/auth/infrastructure/crypto/password.service.ts`](backend/apps/api/src/modules/auth/infrastructure/crypto/password.service.ts). Auth service: [`backend/apps/api/src/modules/auth/application/services/auth.service.ts`](backend/apps/api/src/modules/auth/application/services/auth.service.ts). |
| Authorization        | Role-Based Access Control (RBAC) with five JWT roles defined once in `@smartcart/shared-types` (single source of truth shared with the frontend): `USER` (consumer mobile app), `BACKOFFICE_OPERATOR`, `CATALOG_MANAGER`, `STORE_ADMIN`, `SUPER_ADMIN` (back-office web tool). The mobile app only ever issues `USER`-scoped tokens; the Customer Service Rep's point-adjustment and reward-fulfillment actions run under `STORE_ADMIN`. Endpoints decorated with `@Roles()` and enforced by `RolesGuard`. Resource ownership verified by `ResourceOwnershipGuard` (compares JWT `sub` with resource IDs). The POS and B2B surfaces are **not** JWT roles — they authenticate with separate API Key authentication (`X-API-Key` header), hashed with SHA-256 and stored in DB. Roles guard: [`backend/apps/api/src/common/guards/roles.guard.ts`](backend/apps/api/src/common/guards/roles.guard.ts). Resource ownership guard: [`backend/apps/api/src/common/guards/resource-ownership.guard.ts`](backend/apps/api/src/common/guards/resource-ownership.guard.ts). API key guard: [`backend/apps/api/src/common/guards/api-key.guard.ts`](backend/apps/api/src/common/guards/api-key.guard.ts). |
| Database Encryption  | Encryption at rest: AES-256 provider-managed (Railway/Render/GCP Cloud SQL). Encryption in transit: TLS 1.3 enforced for all connections; Prisma client configured with `sslmode=require`. Connection strings never hardcoded; sourced from `DATABASE_URL` environment variable. |
| Secrets Management   | All secrets stored in environment variables (Railway Shared Variables / Render Environment Groups in production). Never committed to Git (`.env` in `.gitignore`). JWT secrets rotated quarterly using a `kid` (key-ID) header with a dual-key overlap window — the previous key stays valid for verification until all live tokens expire, so rotation never forces a mass logout; database credentials rotated every 90 days. Application validates all required secrets at startup using a Zod schema and fails fast if any are missing or invalid. Validation: [`backend/apps/api/src/config/env.validation.ts`](backend/apps/api/src/config/env.validation.ts). |
| Rate Limiting        | Redis-based rate limiter middleware applied globally (`100 req/min` per authenticated user or IP, configurable via `RATE_LIMIT_MAX`). Stricter limits on auth endpoints (`10 req/min` for login/register) to prevent brute-force. `X-RateLimit-Limit` and `X-RateLimit-Remaining` headers included in responses. Middleware: [`backend/apps/api/src/common/middleware/rate-limiter.middleware.ts`](backend/apps/api/src/common/middleware/rate-limiter.middleware.ts). |
| Input Validation     | All inputs validated at the controller boundary using Zod schemas via a global `ZodValidationPipe`. Schemas enforce strict types (UUIDs, numeric-only barcodes, length caps) preventing SQL injection, XSS, path traversal, and ReDoS. Validation pipe: [`backend/apps/api/src/common/pipes/zod-validation.pipe.ts`](backend/apps/api/src/common/pipes/zod-validation.pipe.ts). Shared schemas: [`packages/shared-types/src/`](packages/shared-types/src/). |
| OWASP Compliance     | SQL Injection: 100% parameterized queries via Prisma ORM. XSS: Helmet CSP headers block inline scripts; all user input validated by Zod schemas. CSRF: not applicable — no cookie-based sessions; the access token is sent in the `Authorization` header and the refresh token in the request body, so there are no ambient credentials for a cross-site request to abuse. Path Traversal: UUID validation on all path parameters. ReDoS: Zod regex patterns tested for catastrophic backtracking; input lengths capped. Security headers configured via Helmet: [`backend/apps/api/src/main.ts`](backend/apps/api/src/main.ts). |
| Audit Logging        | All sensitive operations (`login`, `register`, `logout`, `refresh`, `redeemReward`, `validateSession`, `updateProfile`, `deleteAccount`) logged as structured JSON with `userId`, `action`, `IP address`, and `correlationId`. Points transactions are append-only — immutable ledger where balance is derived via `SUM(delta)`, making it tamper-evident. Audit interceptor: [`backend/apps/api/src/common/interceptors/audit.interceptor.ts`](backend/apps/api/src/common/interceptors/audit.interceptor.ts). Points ledger: [`backend/apps/api/src/modules/checkout/infrastructure/repositories/prisma-points.repository.ts`](backend/apps/api/src/modules/checkout/infrastructure/repositories/prisma-points.repository.ts). |

---

### OWASP Compliance

| OWASP Security | Risk it addresses | How we comply | Validation criterion |
|---------------------|-------------------|---------------|----------------------|
| **A01 — Broken Access Control** | An authenticated user reads or modifies another user's sessions, points balance, or profile (IDOR). A low-privilege role reaches an admin or B2B endpoint. | `RolesGuard` + `@Roles()` decorator enforces role-based access on every endpoint. `ResourceOwnershipGuard` compares the JWT `sub` claim against the resource's `userId` on every session/points request. POS and B2B surfaces are separated behind API Key auth (`X-API-Key`), not JWT. | A `USER` JWT on `GET /sessions/:otherId` returns 403. A missing/invalid `X-API-Key` on `POST /sessions/:id/validate` returns 401. Guard unit tests cover both cases. |
| **A02 — Cryptographic Failures** | Leaked password hashes can be cracked. Weak or short JWT/QR secrets can be brute-forced. Unencrypted DB connections expose data in transit. | Passwords hashed with `bcrypt` cost 12. `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, and `QR_SIGNING_SECRET` validated as `z.string().min(32)` at startup. `DATABASE_URL` enforces `sslmode=require`. Password fields redacted from all logs via Pino's `redact` config. | App fails to start if any secret is under 32 chars. A grep for `password` in log output returns zero results. DB connection without SSL is refused. |
| **A03 — Injection (SQL & XSS)** | User-supplied input concatenated into SQL queries allows data extraction or destruction. Stored malicious strings served to the mobile client could trigger XSS. | 100% Prisma ORM parameterized queries for all DB access. `Prisma.sql` tagged templates required for any `$queryRaw`. Zod schemas enforce strict types and length caps at every controller boundary. Helmet CSP headers block inline script execution. | Grep for `$queryRaw` with string interpolation returns zero results. A barcode of `'; DROP TABLE--` is rejected by Zod with 400. Response includes `Content-Security-Policy` header. |
| **A05 — Security Misconfiguration** | Missing security headers, verbose error messages exposing stack traces, debug endpoints exposed in production, or an app that starts with missing secrets. | Helmet middleware sets CSP, HSTS, `X-Frame-Options`, `X-Content-Type-Options`. `GlobalExceptionFilter` strips stack traces from 500 responses in production. Swagger UI disabled when `NODE_ENV=production`. Startup fails fast via Zod env schema if any required secret is absent. | `curl -I` on any endpoint shows all Helmet headers. A triggered 500 in production returns `{ errorCode, message }` only — no stack trace. App does not start without `JWT_ACCESS_SECRET`. |
| **A06 — Vulnerable and Outdated Components** | A known CVE in an npm dependency can be directly exploited (e.g., prototype pollution, RCE). | `pnpm audit --audit-level=critical` runs as a CI quality gate and blocks merges on critical/high severity findings. Dependencies reviewed and updated regularly. | CI pipeline fails on any new critical or high CVE. `pnpm audit` in a clean install returns zero critical/high findings. |
| **A07 — Authentication Failures** | Brute-forced passwords, stolen refresh tokens reused after logout, or expired tokens still accepted allow account takeover. | bcrypt cost 12 for passwords. Account lockout after 5 failed login attempts within 15 minutes (30-min lockout stored in Redis). Access token expires in 15 minutes. Refresh token rotation: old token is invalidated on each use; reuse returns 401. Refresh token stored client-side in **expo-secure-store** (hardware-backed Keychain/Keystore), never `AsyncStorage`; the server stores only its hash in Redis for revocation. | The 6th login attempt within 15 min returns 429. A refresh token used twice returns 401 on the second call. An access token accepted 16 minutes after issue returns 401. |
| **A08 — Software & Data Integrity / ReDoS** | A crafted input triggers catastrophic regex backtracking, blocking the Node.js event loop. A tampered QR token passes validation if signing is weak. | All Zod regex patterns avoid nested quantifiers and have hard `maxLength` caps. QR tokens signed with HS256; `JwtQrSigner.verify()` rejects any tampered or expired token before it reaches domain logic. | A 10 000-character barcode field is rejected in <1 ms. A QR token with a modified payload (but valid signature format) returns `INVALID_QR_TOKEN`. |
| **A09 — Security Logging & Monitoring Failures** | Undetected breaches or no audit trail for sensitive operations make incident response impossible. | Structured JSON logs via Pino with `correlationId`, `userId`, `action`, and `IP` on every request. `AuditInterceptor` logs all sensitive operations. Sentry captures every unhandled 500 with context. Points ledger is append-only (immutable audit trail). PII fields auto-redacted by Pino's `redact` config. | `validateSession` appears in audit log with correct fields after each call. A triggered 500 creates a Sentry event within 30 seconds. `email` never appears in plain text in any log line. |
| **A10 — Server-Side Request Forgery (SSRF)** | The analytics worker makes outbound HTTP calls to the AI inference service. If the target URL is attacker-controllable, internal services could be probed. | `AI_INFERENCE_URL` is set only via environment variable, validated as `z.string().url()` (must be HTTPS) at worker startup. No user-supplied URLs are ever passed to HTTP clients. The analytics worker has no public API surface — it only consumes BullMQ jobs from an internal queue. | Worker fails to start if `AI_INFERENCE_URL` is not a valid HTTPS URL. Grep for any `fetch`/`axios` call that uses a runtime-variable URL other than `AI_INFERENCE_URL` returns zero results. |

---

#### A01 — Broken Access Control

**Guards implementation:** Open [`backend/apps/api/src/common/guards/roles.guard.ts`](backend/apps/api/src/common/guards/roles.guard.ts) and implement `canActivate()`: read the `@Roles()` metadata from the handler using `Reflector`, extract the `role` claim from the JWT payload attached to `request.user`, and return `false` if the role is not in the allowed list.

Open [`backend/apps/api/src/common/guards/resource-ownership.guard.ts`](backend/apps/api/src/common/guards/resource-ownership.guard.ts): extract the resource's `userId` from the database (via a repository call), compare it to `request.user.sub`. If they don't match, throw `ForbiddenException`. This guard only applies to user-owned resources (sessions, points history) — not to POS or B2B endpoints.

Apply both guards at the controller level so they cannot be accidentally skipped on new endpoint additions:
```typescript
@Controller('sessions')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('USER')
export class SessionController { ... }
```

---

#### A02 — Cryptographic Failures

In [`backend/apps/api/src/config/env.validation.ts`](backend/apps/api/src/config/env.validation.ts), add minimum length checks for all secrets:
```typescript
JWT_ACCESS_SECRET: z.string().min(32),
JWT_REFRESH_SECRET: z.string().min(32),
QR_SIGNING_SECRET: z.string().min(32),
DATABASE_URL: z.string().url(),
```
If the app starts without these values meeting the constraints, it throws at boot — never silently falls back to a weak default.

In [`backend/apps/api/src/config/pino.config.ts`](backend/apps/api/src/config/pino.config.ts), the `redact` array must include every sensitive field name: `['password', 'password_hash', 'refreshToken', 'accessToken', 'email', 'phone', 'pushToken']`. Pino replaces these with `[Redacted]` before writing to stdout.

In [`backend/apps/api/src/modules/auth/infrastructure/crypto/password.service.ts`](backend/apps/api/src/modules/auth/infrastructure/crypto/password.service.ts):
```typescript
hash(plain: string): Promise<string> { return bcrypt.hash(plain, 12); }
verify(plain: string, hash: string): Promise<boolean> { return bcrypt.compare(plain, hash); }
```
Never compare passwords with `===`. Never store a plain or base64-encoded password anywhere.

---

#### A03 — Injection

**SQL Injection — the rule and the exception:**

Prisma's typed query API is safe by construction. Every call to `prisma.user.findUnique()`, `prisma.shoppingSession.create()`, etc. sends parameters as bind values at the PostgreSQL wire protocol level. User input never touches SQL text.

The one dangerous pattern is `$queryRaw` with a plain string or template literal:
```typescript
// DANGEROUS — string interpolation goes directly into SQL
await prisma.$queryRaw(`SELECT * FROM products WHERE barcode = '${barcode}'`);

// SAFE — Prisma.sql converts each value to a bind parameter
await prisma.$queryRaw(Prisma.sql`SELECT * FROM products WHERE barcode = ${barcode}`);
```
Add a CI lint rule or pre-commit hook that greps for `$queryRaw\`` (the dangerous form) and fails the build if found. All repository files live under [`backend/apps/api/src/modules/`](backend/apps/api/src/modules/) and [`backend/apps/analytics-worker/src/infrastructure/repositories/`](backend/apps/analytics-worker/src/infrastructure/repositories/).

**XSS — Helmet configuration in [`backend/apps/api/src/main.ts`](backend/apps/api/src/main.ts):**
```typescript
import helmet from 'helmet';
app.use(helmet({
  contentSecurityPolicy: { directives: { defaultSrc: ["'self'"] } },
  hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
}));
```
This is the single place all HTTP security headers are configured. Do not split them across middleware files.

---

#### A05 — Security Misconfiguration

In [`backend/apps/api/src/main.ts`](backend/apps/api/src/main.ts), disable Swagger in production:
```typescript
if (process.env.NODE_ENV !== 'production') {
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document);
}
```

In [`backend/apps/api/src/common/filters/global-exception.filter.ts`](backend/apps/api/src/common/filters/global-exception.filter.ts), strip stack traces from 500 responses:
```typescript
const message = isProduction ? 'Internal server error' : exception.message;
const stack = isProduction ? undefined : exception.stack;
```
The `correlationId` should always be included so the error can be traced in Sentry without revealing implementation details to the caller.

---

#### A07 — Authentication Failures

Account lockout is stored in Redis. In [`backend/apps/api/src/modules/auth/application/services/auth.service.ts`](backend/apps/api/src/modules/auth/application/services/auth.service.ts):
- On each failed login, increment `auth:lockout:{email}` with a 15-minute TTL. If the counter reaches 5, throw `TooManyRequestsException` for all subsequent attempts until the key expires.
- On successful login, delete the lockout key.

Refresh token rotation: when `/auth/refresh` is called, delete the old token hash from Redis before issuing the new one. If the same old token is submitted again (replay attack), it will not be found in Redis and returns 401 immediately. This limits the window of a stolen refresh token to a single use.

---

#### A08 — ReDoS

When writing Zod schemas in [`packages/shared-types/src/validation/`](packages/shared-types/src/validation/), follow these rules for any `.regex()` call:
- No nested quantifiers: `(a+)+` or `(\w+\s)+` are dangerous.
- Always pair a `.regex()` with `.max(N)` — caps the worst-case input length and bounds backtracking time.
- Prefer explicit character classes (`[a-z0-9]`) over shorthand (`\w`) inside repeated groups.

The barcode regex `z.string().regex(/^\d{8,14}$/).max(14)` is safe — anchored, no alternation, fixed character class.

---

#### A09 — Security Logging & Monitoring

In [`backend/apps/api/src/common/interceptors/audit.interceptor.ts`](backend/apps/api/src/common/interceptors/audit.interceptor.ts), implement an `NestInterceptor` that intercepts the response stream. For the sensitive operations listed in the security table, log a structured JSON entry:
```typescript
this.logger.log({
  event: 'AUDIT',
  action: 'validateSession',
  userId: request.user?.sub,
  ip: request.ip,
  correlationId: request.headers['x-correlation-id'],
  sessionId: params.id,
});
```
Apply this interceptor globally in `main.ts` via `app.useGlobalInterceptors(new AuditInterceptor(logger))` — this ensures no new sensitive endpoint is accidentally excluded.

---

#### A10 — SSRF

In [`backend/apps/analytics-worker/src/infrastructure/ai/ai-inference.client.ts`](backend/apps/analytics-worker/src/infrastructure/ai/ai-inference.client.ts), the HTTP client is initialized once at startup using a URL read from `process.env.AI_INFERENCE_URL`. It is never modified at runtime and never derived from job data or user input:
```typescript
constructor(private readonly config: ConfigService) {
  this.baseUrl = config.get<string>('AI_INFERENCE_URL'); // validated at startup
}

async classify(features: FeatureVector): Promise<string> {
  // this.baseUrl is a fixed value — never interpolate job data into it
  return this.httpClient.post(`${this.baseUrl}/classify`, features);
}
```
The `AI_INFERENCE_URL` environment variable is validated in the worker's startup config as `z.string().url().startsWith('https://')`. Any attempt to set it to a local or `http://` URL will fail validation before the worker accepts any jobs.

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
  - **API service:** Configure Railway/Render to scale horizontally. A CPU threshold of ~70% is a reasonable trigger. Because the API is fully stateless (no session state is held in-process — PostgreSQL is the source of truth and Redis is a shared read-through cache), adding more instances requires zero code changes.
  - **Analytics worker:** The worker is CPU-bound during AI classification. Scale its instance count based on BullMQ queue depth — if `analytics-profile-update` consistently has >100 waiting jobs, add worker instances.

- **Stateless Services:**
  - **What to implement:** All session state externalized to Redis, not stored in-process.
  - **How to implement:** In service logic (e.g., `CheckoutService` at [`backend/apps/api/src/modules/checkout/application/services/checkout.service.ts`](backend/apps/api/src/modules/checkout/application/services/checkout.service.ts)), load session data via `sessionRepo.findById()`. Repository (e.g., `PrismaSessionRepository` at [`backend/apps/api/src/modules/checkout/infrastructure/repositories/prisma-session.repository.ts`](backend/apps/api/src/modules/checkout/infrastructure/repositories/prisma-session.repository.ts)) implements a **Read-Through cache with cache-after-commit writes**:
    1. **On `findById`:** Check Redis (`redis.get`). On miss, query PostgreSQL, hydrate Redis with TTL (e.g., 7200s), return data.
    2. **On `save`:** Persist to PostgreSQL first — inside the active `$transaction` when a `tx` client is passed. Update or invalidate the Redis entry **only after the transaction commits** (via a post-commit hook), never inside the callback. This prevents a rolled-back transaction from leaving a stale `COMPLETED` session in cache while the database still shows `PENDING_CHECKOUT`.

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

> **Note:** Store-presence ("inside an affiliated store") is gated **client-side** by the
> mobile app (LocationPill, §1.2); the server does not re-verify geolocation. Point accrual is
> implicitly bound to the physical POS that scans the QR, not to a server-side location check.

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
   - Real-time notification via `SessionGateway` ([`backend/apps/api/src/modules/checkout/presentation/gateways/session.gateway.ts`](backend/apps/api/src/modules/checkout/presentation/gateways/session.gateway.ts)). *What to code:* Implement a `@WebSocketGateway` class with a **JWT handshake guard** — authenticate the token on `handleConnection` and reject unauthenticated sockets. On `subscribe:session`, verify the JWT `sub` owns the session **before** joining room `session:{id}` (reject otherwise, so no client can observe another user's checkout). On the `sessionStatusChanged` event, emit to the per-session room — `this.server.to('session:' + sessionId).emit('sessionStatusChanged', { status, pointsAwarded })`.
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

> These wire error codes are the canonical set, defined in `@smartcart/shared-types`; the
> frontend `ApiErrorMapper` maps them to its client-side `AppError.code` (§1.5 Error taxonomy).

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
   - Return both `accessToken` and `refreshToken` in the response body. The React Native client persists the `refreshToken` in expo-secure-store; the server keeps only its hash in Redis for revocation.

4. **Token Refresh:** `POST /api/v1/auth/refresh` — reads the `refreshToken` from the request body.
   - *What to code:* In `auth.service.ts`, implement `refresh(refreshToken)`. Verify the token with `jwtService.verifyRefreshToken()`. Look up the token hash in Redis — if missing, it was revoked, throw `UnauthorizedException`. Delete the old token from Redis, issue a new `accessToken` and a new `refreshToken` (rotation), and return both in the response body.

5. **Logout:** `POST /api/v1/auth/logout`.
   - *What to code:* Delete the refresh token entry from Redis (server-side revocation). The client deletes its stored token from expo-secure-store.

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
│   │   ├── prisma/
│   │   │   └── schema.prisma
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
