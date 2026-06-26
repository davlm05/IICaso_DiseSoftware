<!-- feature-id: add-a-mock-pay-button-on-qr-confirmation-screen-4479e3 | domain: testing | generated 2026-06-26 -->
# Testing Specification — Add a mock pay button on QR confirmation screen

- **Feature ID:** `add-a-mock-pay-button-on-qr-confirmation-screen-4479e3`
- **Domain:** Testing (Jest / RTL)
- **Date:** 2026-06-26
- **Binding:** README.md §1.7 (frontend) & §2 (backend) testing strategy

## 1. Summary

Author comprehensive tests for the mock pay button feature on the QR Confirmation screen (`/app/checkout.tsx`).
The feature adds a "Realizar Pago" (Process Payment) button below the QR code that simulates a payment flow
with a loading state and optional success/error toast feedback. Tests cover button rendering, loading state
transitions, payment simulation, toast notifications, accessibility conformance, and edge cases (rapid clicks,
screen unmount during payment). **No backend changes**: all tests are frontend-only, targeting React Native
Testing Library and Jest patterns. The button is a mock UI component that does not call a real payment API.

---

## 2. Unit tests
_Pure logic, services, reducers, validators._

### 2.1 Payment Mock Service (Pure Logic)

**File:** `frontend/src/features/checkout/services/__tests__/payment-mock.service.test.ts`

**Scope:** Test the payment simulation logic in isolation—no React, no store mutations, no component rendering.

**Test cases:**

1. **`simulate()` resolves successfully after a delay**
   - Setup: `const service = new PaymentMockService()`
   - Act: `const result = await service.simulate(); // no params`
   - Assert:
     - Promise resolves (does not reject)
     - Result is an object with `{ success: true, transactionId: string, amount: number }`
     - Transaction ID is a UUID v4 (matches pattern `[0-9a-f]{8}-...`)
     - Delay is ~2–4 seconds (configurable via constructor, default 3s)
   - Coverage: happy path, async resolution

2. **`simulate()` can be configured with custom delay**
   - Setup: `const service = new PaymentMockService({ delay: 1000 })`
   - Act: Measure time before/after `await service.simulate()`
   - Assert: Actual elapsed time ≈ 1000ms ± 50ms
   - Coverage: config injection, delay accuracy

3. **`simulate()` rejects if `abortSignal` is triggered**
   - Setup: `const controller = new AbortController(); const service = new PaymentMockService()`
   - Act: Call `service.simulate(controller.signal)`, then immediately call `controller.abort()`
   - Assert: Promise rejects with an `AbortError`
   - Coverage: cancellation handling, abort signal

4. **`simulate()` with `shouldFail=true` rejects**
   - Setup: `const service = new PaymentMockService({ shouldFail: true })`
   - Act: `await service.simulate()`
   - Assert: Promise rejects with `{ code: 'PAYMENT_FAILED', message: 'Simulated payment failure' }`
   - Coverage: error path, failure simulation

5. **`getTransactionHistory()` returns array of completed transactions**
   - Setup: `const service = new PaymentMockService()`
   - Act: Simulate 3 successful payments, call `service.getTransactionHistory()`
   - Assert: Returns array with 3 entries, each has `{ success, transactionId, amount, timestamp }`
   - Coverage: state accumulation, history tracking

6. **`reset()` clears transaction history**
   - Setup: Simulate 2 payments, call `service.reset()`
   - Act: Call `getTransactionHistory()`
   - Assert: Returns empty array `[]`
   - Coverage: reset logic, state cleanup

---

## 3. Integration tests
_API endpoints (supertest), store + data-access, component interactions._

### 3.1 Pay Button Component (Isolated)

**File:** `frontend/src/components/molecules/__tests__/PayButton.test.tsx`

**Mocks:**
- `PaymentMockService`: Jest mock with `simulate()` and `getTransactionHistory()`
- Toast notifications: Mock via jest.fn()

**Test cases:**

1. **Renders correctly in default state (enabled, not loading)**
   - Setup: `<PayButton onPaymentStart={jest.fn()} onPaymentComplete={jest.fn()} />`
   - Assert:
     - Button is visible with label "Realizar Pago"
     - Button has `accessibilityRole="button"`
     - Button is not disabled
     - No loading spinner is visible
   - Coverage: default render, button state

2. **Shows loading spinner when `isLoading=true`**
   - Setup: `<PayButton isLoading={true} ... />`
   - Assert:
     - Activity indicator is visible
     - Button label is hidden or dimmed
     - Button is disabled (cannot be pressed)
   - Coverage: loading state UI, disabled button

3. **Calls `onPress` callback when button is pressed**
   - Setup: `const onPress = jest.fn(); <PayButton onPress={onPress} />`
   - Act: `fireEvent.press(screen.getByRole('button', { name: /realizar pago/i }))`
   - Assert: `expect(onPress).toHaveBeenCalledTimes(1)`
   - Coverage: button interaction, event propagation

4. **Disables button while payment is in progress**
   - Setup: `<PayButton isLoading={true} />`
   - Act: Attempt to press the button
   - Assert: `onPress` is NOT called (button is disabled)
   - Coverage: state-driven disable, prevents double-click

5. **Shows success feedback when payment completes**
   - Setup: Render with `isLoading=true`
   - Act: Re-render with `isLoading=false` and `paymentResult={ success: true, transactionId: '...' }`
   - Assert:
     - Loading spinner is gone
     - Button shows success icon (green checkmark) or "Pago realizado" text
     - Button remains disabled temporarily (e.g., 2 seconds)
   - Coverage: success state transition

6. **Shows error feedback on payment failure**
   - Setup: Render with `isLoading=true`
   - Act: Re-render with `isLoading=false` and `paymentResult={ success: false, error: 'PAYMENT_FAILED' }`
   - Assert:
     - Loading spinner is gone
     - Button shows error icon (red X) or "Pago fallido" text
     - Button is re-enabled after 2 seconds (retry available)
   - Coverage: error state transition, retry affordance

7. **Accepts optional `variant` prop for styling**
   - Setup: `<PayButton variant="primary" ... />`
   - Assert: Button has correct color/style classes (e.g., `bg-primary text-white`)
   - Coverage: style variants

8. **Accepts optional `disabled` prop to disable independently of loading**
   - Setup: `<PayButton disabled={true} ... />`
   - Assert: Button is disabled even if `isLoading=false`
   - Coverage: external disable control

---

### 3.2 CheckoutScreen Integration with Pay Button

**File:** `frontend/app/__tests__/checkout.integration.test.tsx`

**Mocks:**
- `useSessionStore`: Mock with `generateQr()`, `confirmValidation()`, `pendingItems`, `creditedPoints`
- `PaymentMockService`: Mock `simulate()` to resolve/reject after delay
- `useRouter`: Mock navigation methods
- Socket.io or polling: Mock timeout-based validation
- Toast: Mock notifications

**Test cases:**

1. **Pay button appears on the QR validation screen**
   - Setup: Render `<CheckoutScreen />` with a pending session
   - Assert:
     - QRCodeView is rendered
     - Pay button with label "Realizar Pago" is visible below the QR
     - Button is enabled and not loading
   - Coverage: component presence, layout

2. **Pay button press initiates payment simulation**
   - Setup: Render, mock `PaymentMockService.simulate()` to resolve after 500ms
   - Act: `fireEvent.press(screen.getByRole('button', { name: /realizar pago/i }))`
   - Assert:
     - Button immediately enters loading state (spinner visible)
     - `onPaymentStart` callback fires (if wired)
   - Coverage: loading transition, callback invocation

3. **Button recovers after successful payment**
   - Setup: Render, mock `simulate()` to resolve with `{ success: true }`
   - Act: Press pay button, wait for promise to resolve (wait ~500ms)
   - Assert:
     - Loading spinner disappears
     - Button shows success state (green checkmark or confirmation text)
     - Button remains disabled for ~2 seconds, then re-enables
   - Coverage: async flow, state recovery

4. **Button recovers after failed payment (allows retry)**
   - Setup: Render, mock `simulate()` to reject with `PAYMENT_FAILED`
   - Act: Press pay button, wait for error
   - Assert:
     - Loading spinner disappears
     - Button shows error state (red X or "Pago fallido")
     - Button re-enables after ~2 seconds
     - User can press again to retry
   - Coverage: error recovery, retry flow

5. **Rapid button clicks do not trigger multiple payments**
   - Setup: Render with `simulate()` that delays 2 seconds
   - Act: Rapidly press the pay button 5 times within 100ms
   - Assert:
     - Only ONE payment simulation is initiated
     - Button is disabled immediately and stays disabled
     - `onPaymentStart` fires exactly once
   - Coverage: debouncing, prevents duplicate submissions

6. **Toast notification appears on success**
   - Setup: Render, mock `useNotification()`
   - Act: Pay button succeeds
   - Assert:
     - Toast is visible with message like "Pago realizado exitosamente"
     - Toast auto-dismisses after 3–4 seconds
   - Coverage: user feedback, toast integration

7. **Toast notification appears on failure**
   - Setup: Render, mock error scenario
   - Act: Pay button fails
   - Assert:
     - Toast is visible with error message like "El pago no pudo procesarse. Intenta de nuevo."
     - Toast auto-dismisses or has a dismiss button
   - Coverage: error feedback, toast integration

8. **Pay button does not block QR validation (socket/poll)**
   - Setup: Render, queue a socket message to validate the session in 1 second
   - Act:
     1. Press pay button (loading starts)
     2. Wait for socket validation (checkout completes, navigates to confirmation screen)
   - Assert:
     - Navigation to `/confirmation` happens regardless of pay button state
     - Pay button loading state is irrelevant to validation flow
   - Coverage: independent flows, non-blocking UI

9. **Abort payment if user navigates away**
   - Setup: Render, mock `simulate()` with a 5-second delay
   - Act:
     1. Press pay button
     2. Within 1 second, navigate away (e.g., press back button or receive socket validation)
   - Assert:
     - Payment simulation is cancelled (aborted)
     - No errors in console
     - New screen renders cleanly
   - Coverage: lifecycle cleanup, abort handling

10. **Pay button keyboard accessibility**
    - Setup: Render with a screen reader active (via `accessibilityRole="button"`)
    - Act: Focus the button via keyboard/accessibility tree, press Enter/Space
    - Assert: Button activates, payment flow starts
    - Coverage: keyboard navigation, screen reader

---

### 3.3 Checkout Screen End-to-End Flow

**File:** `frontend/app/__tests__/checkout.e2e.test.tsx`

**Mocks:**
- Store: Real Zustand store (not mocked), with pre-loaded session
- PaymentMockService: Real service (delay 300ms for speed)
- Router: Jest mock
- Socket/Poll: Timer-based mock that resolves after 4 seconds

**Test cases:**

1. **Complete flow: QR generation → pay button → payment success → confirmation**
   - Setup:
     - Session has 2 pending items worth 100 points total
     - Mock socket to validate after 4 seconds
   - Act:
     1. Render `<CheckoutScreen />`
     2. Verify QR is generated (store method called)
     3. Press "Realizar Pago" button
     4. Wait for payment success
     5. Wait for socket validation (auto-navigates to confirmation)
   - Assert:
     - All three steps complete without error
     - `router.replace("/confirmation")` is called
     - Store shows `status: "COMPLETED"` and updated `creditedPoints`
   - Coverage: happy path, full integration

2. **Flow with payment failure (retry → success)**
   - Setup:
     - Mock first payment call to reject, second to succeed
     - Session ready with QR
   - Act:
     1. Press pay button
     2. First attempt fails (error state shown)
     3. Press pay button again (retry)
     4. Second attempt succeeds
     5. Socket validation completes
   - Assert:
     - Both payment attempts are tracked
     - Navigation occurs after success
   - Coverage: retry flow, state transitions

3. **Flow interrupted by socket validation before payment**
   - Setup:
     - Mock socket to validate immediately (0-delay)
     - Session ready
   - Act:
     1. Render screen (socket validation fires immediately)
     2. Navigation to confirmation happens
     3. (Pay button may not even render if screen navigates too fast)
   - Assert:
     - No error, clean navigation
     - Pay button never interacted with
   - Coverage: race condition, early validation

---

## 4. Contract tests
_API ↔ client contract, DTO/schema conformance._

**Scope:** None. The mock pay button has no backend changes or API endpoints. All logic is client-side simulation.
No contract tests required.

---

## 5. Edge cases & error paths
_Invalid input, authz failures, empty/error states._

### 5.1 Component-Level Edge Cases

**File:** `frontend/src/components/molecules/__tests__/PayButton.edge.test.tsx`

1. **Very long label text (custom label prop)**
   - Setup: `<PayButton label="Este es un botón de pago muy largo que podría ocupar múltiples líneas" />`
   - Assert: Text wraps or truncates gracefully, no layout break
   - Coverage: text layout, edge case handling

2. **Button with no `onPress` callback provided**
   - Setup: `<PayButton onPress={undefined} ... />`
   - Assert: Component renders without error, button is clickable but does nothing
   - Coverage: defensive programming

3. **Multiple rapid success/failure state cycles**
   - Setup: Render pay button
   - Act: Cycle through: loading → success → enabled → loading → error → enabled (repeat 3x)
   - Assert: No crashes, state machine is consistent
   - Coverage: state resilience

4. **Unmount while button is loading**
   - Setup: Render, press button, immediately unmount component during loading
   - Assert: No memory leaks, no console warnings about state updates on unmounted component
   - Coverage: lifecycle cleanup, pending promise cleanup

5. **Payment result received after unmount**
   - Setup: Render, press button, unmount, then mock payment resolves
   - Assert: Callback is NOT called (or called with cleanup check), no warnings
   - Coverage: async cleanup, cancelled callbacks

### 5.2 Integration-Level Edge Cases

**File:** `frontend/app/__tests__/checkout.edge.test.tsx`

1. **Session with no pending items (edge case)**
   - Setup: Session exists but `pendingItems.length === 0`
   - Assert:
     - Pay button still renders
     - Pressing it initiates a mock payment (even though there's nothing to pay for)
     - Completes normally
   - Coverage: empty session handling

2. **Payment simulates success, but store mutation fails**
   - Setup:
     - Mock `simulate()` to resolve
     - Mock store's `confirmValidation()` to throw an error
   - Act: Press pay button, wait for completion
   - Assert:
     - Payment success fires
     - Store error is caught and displayed as a toast
     - No unhandled promise rejection
   - Coverage: error boundary, store interaction

3. **Network error during payment (simulated)**
   - Setup: Mock `simulate()` to reject with `{ code: 'NETWORK_ERROR' }`
   - Act: Press pay button
   - Assert:
     - Error toast appears: "Error de conexión. Intenta de nuevo."
     - Button re-enables for retry
   - Coverage: network error handling

4. **Timeout during payment**
   - Setup:
     - Mock `simulate()` with a 30-second delay
     - Create an abort timeout at 5 seconds
   - Act: Press button, wait for timeout to abort
   - Assert:
     - Promise rejects with `AbortError`
     - Button shows error state: "Pago expirado. Intenta de nuevo."
   - Coverage: timeout handling, abort logic

5. **Concurrent payment + socket validation**
   - Setup:
     - Socket validation set to fire in 2 seconds
     - Payment set to complete in 1 second
   - Act: Press pay button, wait
   - Assert:
     - Payment completes first
     - Socket validation then completes
     - Navigation to confirmation happens
     - No race condition or duplicate state updates
   - Coverage: concurrent async flows

6. **User presses back button during payment**
   - Setup: Render, press pay button (loading)
   - Act: Press back button within 1 second
   - Assert:
     - Navigation handler checks for pending payment
     - Either abort the payment, or show confirmation dialog "Pago en progreso. ¿Descartar?"
     - Cleanup is handled correctly
   - Coverage: interruption handling, back gesture

7. **Pay button in offline mode**
   - Setup: Network is disconnected, session exists
   - Act: Press pay button
   - Assert:
     - Mock service still works (it's client-side)
     - Completes normally with simulated success
   - Coverage: offline resilience

---

## 6. Coverage targets
_Lines/branches thresholds; critical paths that must be covered._

| File | Type | Statements | Branches | Lines | Functions |
|------|------|-----------|----------|-------|-----------|
| `payment-mock.service.ts` | Service | 95% | 90% | 95% | 95% |
| `PayButton.tsx` | Component | 90% | 85% | 90% | 90% |
| `CheckoutScreen` (modified) | Screen | 85% | 80% | 85% | 85% |
| **Overall** | Integration | **85%** | **80%** | **85%** | **85%** |

**Critical paths (must-cover, 100% branch coverage):**
- Pay button render and disabled state when `isLoading=true`
- Button press event triggers `onPress` callback
- Payment simulation `simulate()` happy path (resolve)
- Payment simulation error path (reject)
- Loading → success state transition
- Loading → error state transition
- Abort signal handling (cancellation)
- Toast notification on success and error

**Optional/low-priority (sampling acceptable, ≥70%):**
- Very long text overflow
- Rapid click debouncing (can use jest.useFakeTimers for deterministic testing)
- Store mutation failure handling
- Concurrent payment + socket validation race (complex, lower priority)

---

## 7. Acceptance criteria

- [ ] `payment-mock.service.ts` exists in `frontend/src/features/checkout/services/` with ≥6 unit tests covering: happy path, custom delay, abort signal, failure mode, history tracking, and reset.

- [ ] `PayButton.test.tsx` exists in `frontend/src/components/molecules/__tests__/` with ≥8 test cases covering: default render, loading state, button press, disable during load, success feedback, error feedback, variants, and accessibility.

- [ ] `checkout.integration.test.tsx` exists in `frontend/app/__tests__/` with ≥10 integration test cases covering: pay button presence, payment initiation, success recovery, error recovery, rapid clicks, toast notifications, independent validation flow, abort on navigation, and keyboard accessibility.

- [ ] `checkout.e2e.test.tsx` exists with ≥3 end-to-end test cases covering: full happy path (QR → pay → success → confirmation), payment failure with retry, and validation interruption.

- [ ] Edge case tests exist for: long text, missing callback, state cycles, unmount during loading, result after unmount, empty session, store error, network error, timeout, concurrent flows, back gesture, and offline mode.

- [ ] Pay button has correct a11y properties:
  - `accessibilityRole="button"`
  - `accessibilityLabel="Realizar Pago"` (or "Pagar" if space is tight)
  - `accessibilityHint="Inicia el proceso de pago mock"` (optional but recommended)
  - Loading spinner has `accessible={false}` (decorative)
  - Success/error icons have no duplicate labels (piggyback on button label)

- [ ] Button state transitions are tested:
  - Default → disabled (loading)
  - Loading → success (green check, disabled temporarily)
  - Loading → error (red X, re-enable after 2s)
  - Success → enabled (after timeout)
  - Error → enabled (immediately or after timeout)

- [ ] Abort signal is wired to `PaymentMockService.simulate()` to support cleanup when component unmounts or navigation occurs.

- [ ] Toast notifications are shown:
  - Success: "Pago realizado exitosamente" (or per design)
  - Error/Failure: "El pago no pudo procesarse. Intenta de nuevo."
  - Network: "Error de conexión. Intenta de nuevo."
  - Timeout: "Pago expirado. Intenta de nuevo."
  - Auto-dismiss or manual dismiss both supported.

- [ ] Rapid button clicks are debounced (only one payment initiated per click cycle, not 5).

- [ ] Payment simulation can be configured with:
  - Custom delay (default 3000ms)
  - Failure mode (for testing error paths)
  - Transaction ID generation (mock)
  - History tracking and reset (for test setup/teardown)

- [ ] Test coverage meets thresholds: payment service ≥95% statements, PayButton ≥90% statements, CheckoutScreen ≥85% statements, overall ≥85%.

- [ ] Jest `--testMatch` includes `**/__tests__/**/*.{test,spec}.{ts,tsx}` and picks up all test files automatically.

- [ ] `npm test -- --coverage` in the frontend root includes these new tests in the report and passes all thresholds before a PR can merge (CI gate).

- [ ] No modifications to backend API, Zod schemas, or database required; all tests use client-side state and mocks.

- [ ] CheckoutScreen continues to support socket-based validation in parallel with pay button (pay button is independent, does not block validation flow).

- [ ] Back button / system back gesture does NOT navigate away if payment is in progress without user confirmation (or aborts payment cleanly).

