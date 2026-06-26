<!-- feature-id: add-a-mock-pay-button-on-qr-confirmation-screen-4479e3 | domain: frontend | generated offline -->
# Frontend Specification — Add a mock pay button on QR confirmation screen

- **Feature ID:** `add-a-mock-pay-button-on-qr-confirmation-screen-4479e3`
- **Domain:** Frontend (React Native + Expo)
- **Date:** 2026-06-26
- **Binding:** README.md §1 Frontend Design

## 1. Summary
Add a **mock "pay" button** to the QR validation screen (`/app/checkout.tsx`, README §1.2 `QRValidationScreen`,
Figma screen 5). Today the screen displays the checkout QR and waits for the POS to confirm; the
confirmation is faked by a 4-second `setTimeout` that calls `store.confirmValidation()` and routes to
`/confirmation` (the stand-in for the socket/poll hook of README §1.5 operation 4). This feature replaces
that implicit timer with an **explicit, user-driven** "Simular pago en caja" CTA, so demos and tests can
deterministically advance `ValidatingState → ConfirmationScreen` without waiting. The button mocks the
cashier/POS validation locally — **no new backend call** — and reuses the existing `confirmValidation()`
session-store mutation that credits pending points. This is a presentation-only / mock affordance; the real
checkout still flows through the socket/poll `useCheckoutStatus` hook in production.

## 2. User flows & screens
_Screens/routes affected (Expo Router), entry points, and navigation changes._

- **Affected route:** `/app/checkout.tsx` (`QRValidationScreen`). No new routes.
- **Entry point:** User reaches checkout from the Lobby/Scan flow via `GenerateQRCommand` → `store.generateQr()`
  (status `ACTIVE → PENDING_CHECKOUT`), then lands on the QR screen showing `QRCodeView` + "Esperando
  validación de la cajera…".
- **New affordance:** Below the waiting indicator, a primary `Button` labelled **"Simular pago en caja"**
  (mock). On press it:
  1. Sets a local `processing` state (button shows spinner + disabled, label → "Validando…").
  2. Calls `store.confirmValidation()` (status `PENDING_CHECKOUT → COMPLETED`, credits `pendingPoints()`).
  3. `router.replace("/confirmation")` → `ConfirmationScreen` ("Puntos acreditados", Figma screen 6).
- **Navigation change:** The existing auto-advance `setTimeout` (lines 37–44 of `checkout.tsx`) is **removed**
  so the transition is driven solely by the button (deterministic for E2E). `router.replace` (not `push`) keeps
  the checkout screen off the back stack, matching current behaviour.
- **Guard:** The button is hidden/disabled until `qrToken` exists (QR generated) and while `processing`, to
  prevent a double `confirmValidation()` (non-idempotent credit).

## 3. Components (atomic design)
| Layer | Component | New/Reused | Notes |
|---|---|---|---|
| atom | `Button` (`/components/atoms/Button.tsx`) | Reused | `variant="primary"`, `label="Simular pago en caja"`, `icon={<Icon name="CreditCard" />}`, `onPress`, `disabled` while `processing`/no QR. Already sets `accessibilityRole="button"` + `accessibilityLabel`. |
| atom | `Icon` (`/components/atoms/Icon.tsx`) | Reused | `lucide-react-native` `CreditCard` (or `Wallet`) glyph for the pay CTA; decorative, paired with the button label. |
| atom | `ActivityIndicator` (RN) / inline spinner | Reused | Loading state on the button while `processing` (README §1.5 op. 4 "Verificando…"). |
| molecule | `QRCodeView` (`/components/molecules/QRCodeView.tsx`) | Reused | Unchanged; still renders QR + fallback code + countdown. |
| organism | — | — | No new organism; the button is composed directly in the `QRValidationScreen` container next to the waiting status. |

## 4. State & data access
_Zustand store slices, TanStack Query keys/endpoints consumed, optimistic updates._

- **Zustand (`useSessionStore`, Singleton — README §1.4):** reuses existing `confirmValidation()` which sets
  `status: "COMPLETED"` and `creditedPoints += pendingPoints()`. Read via selective selectors
  (`useSessionStore((s) => s.qrToken)`, `s.status`) to avoid whole-store re-renders (README §1.6 Memoization).
- **Command pattern (README §1.4 / §1.5):** the mock pay action conceptually parallels op. 4 (POS validation
  status). Since it is a **mock**, it dispatches the already-present `store.confirmValidation()` directly; no
  new `Command` class is required. (If a command is preferred for symmetry, a thin `MockPayCommand`
  wrapping `confirmValidation()` may live in `/features/session/commands/sessionCommands.ts`.)
- **TanStack Query / Axios:** **none** — this is a client-only mock; it does **not** hit
  `src/api/endpoints/sessions.ts`. The real validation path remains the socket/poll `useCheckoutStatus` hook.
- **Optimistic updates:** none. Points are credited only on the (mock) success of `confirmValidation()`,
  consistent with README §1.5 op. 6's "no optimistic update" rule — nothing to roll back.
- **Local component state:** `const [processing, setProcessing] = useState(false)` to gate the button and show
  the spinner; guarantees a single `confirmValidation()` dispatch.

## 5. Forms & validation
_react-hook-form usage and Zod schemas; client-side validation rules._

- **Not applicable** — this feature is a single action button with no text input, so no `react-hook-form` /
  Zod form is introduced.
- The only validation is a **state guard** (UI-level): the button is enabled only when `qrToken != null` and
  `status === "PENDING_CHECKOUT"` and `!processing`, preventing duplicate, non-idempotent credit dispatches.

## 6. Security (§1.3)
_Token handling (expo-secure-store), RBAC-gated UI, no secrets in the bundle._

- **Tokens:** no change to auth; JWTs remain in `SecureTokenStore` (`expo-secure-store`). This screen renders
  for an authenticated `USER` session only; no token is read or written here.
- **RBAC:** consumer app is `USER`-scoped only (README §1.3); the mock pay button is purely client-side and
  grants no privilege — it does not call any privileged endpoint.
- **No secrets:** the button hard-codes nothing sensitive; the existing mock QR token/fallback values stay in
  the store. No payment credentials, no real money movement — the label and an inline caption make the
  **mock/simulación** nature explicit so it cannot be mistaken for a real charge.
- **Resilience:** because it dispatches no network call, it adds no new attack surface; `console.*` is stripped
  in production (README §1.3 MASVS-RESILIENCE).

## 7. Accessibility & UX
_a11y roles/labels, loading/empty/error states, perceived performance._

- **a11y:** reuses `Button`'s `accessibilityRole="button"` + `accessibilityLabel="Simular pago en caja"` and
  `accessibilityState={{ disabled }}`. The `CreditCard` icon is decorative (`accessibilityElementsHidden`) and
  paired with the visible text label — never icon/colour alone (README §1.2 a11y rule).
- **Loading state:** while `processing`, the button is disabled (`opacity-50`), shows an `ActivityIndicator`,
  and label flips to "Validando…"; the existing "Esperando validación…" dot row remains until navigation.
  Optionally announce via `accessibilityLiveRegion="polite"`.
- **Empty/disabled state:** before the QR is generated (`!qrToken`), the button is hidden or disabled so the
  user can only pay after a valid checkout code exists.
- **Error state:** the mock always succeeds; should a future real call be wired in, errors route through the
  Axios interceptor → `ApiErrorMapper` → `NotificationSlice` → `Toast` (`QR_EXPIRED` / `VALIDATION_REJECTED`,
  README §1.5 Error taxonomy), with the session left unchanged (no rollback needed).
- **Perceived performance:** `router.replace` transition is immediate; the spinner gives instant feedback;
  styling uses NativeWind tokens (`bg-primary`, `px-md py-4`, `rounded-2xl`) to match the screen's CTA
  hierarchy (usability Finding #1).

## 8. Acceptance criteria
- [ ] A primary "Simular pago en caja" `Button` (with `CreditCard`/`Wallet` icon) renders on `/app/checkout.tsx`,
      below the QR + waiting status, styled with NativeWind tokens.
- [ ] The button is disabled/hidden until `qrToken` exists and `status === "PENDING_CHECKOUT"`.
- [ ] Pressing it sets `processing`, shows a spinner + "Validando…", and dispatches `store.confirmValidation()`
      exactly once (no double credit).
- [ ] After `confirmValidation()`, `creditedPoints` increases by `pendingPoints()` and the app
      `router.replace("/confirmation")` to `ConfirmationScreen`, which shows "Puntos acreditados" with the
      credited total.
- [ ] The previous auto-advance `setTimeout` is removed; the transition is driven only by the button
      (deterministic for Maestro/RTL).
- [ ] No new network/API call is introduced; the action is a client-side mock and does not touch
      `src/api/endpoints/sessions.ts`.
- [ ] `Button` exposes `accessibilityRole="button"` + a meaningful `accessibilityLabel`; the icon is decorative
      and paired with text (0 critical a11y violations).
- [ ] Existing `ScanConfirmationModal`/checkout tests still pass; an RTL test asserts pressing the button
      credits points and navigates to confirmation.
