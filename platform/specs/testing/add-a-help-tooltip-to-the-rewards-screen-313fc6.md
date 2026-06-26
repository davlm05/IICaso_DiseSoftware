<!-- feature-id: add-a-help-tooltip-to-the-rewards-screen-313fc6 | domain: testing | generated offline -->
# Testing Specification — Add a help tooltip to the rewards screen

- **Feature ID:** `add-a-help-tooltip-to-the-rewards-screen-313fc6`
- **Domain:** Testing (Jest / RTL / contract)
- **Date:** 2026-06-26
- **Binding:** README.md §1.7 (frontend) & §2 (backend) testing strategy

## 1. Summary

Author comprehensive tests for the Help Tooltip feature on the Rewards screen (`/app/rewards.tsx`).
The feature adds a presentational `HelpTooltip` molecule and an icon button trigger in the header.
Tests cover component rendering, state transitions (open/close), dismissal paths (backdrop, close button,
system back gesture), accessibility conformance (@axe-core/react), and edge cases (rapid toggle, modal
stacking). **No backend changes**: all tests are frontend-only, targeting React Native Testing Library
and Jest patterns.

---

## 2. Unit tests
_Pure logic, services, reducers, validators._

**Scope:** None. This feature is presentation-only with no domain logic, commands, validation rules,
or business services. The tooltip has no reducers, validators, or CoR handlers. Skip unit tests.

---

## 3. Integration tests
_API endpoints (supertest), store + data-access, component interactions._

### 3.1 HelpTooltip Component (Isolated)

**File:** `frontend/src/components/molecules/__tests__/HelpTooltip.test.tsx`

**Test cases:**

1. **Render when `visible=true`**
   - Setup: `<HelpTooltip visible={true} title="¿Cómo funcionan las recompensas?" items={["Gana puntos...", "Acumula...", "Canjea..."]} onClose={jest.fn()} />`
   - Assert:
     - Title text is on screen via `getByText("¿Cómo funcionan las recompensas?")`
     - All help items are visible via `getByText()` for each item
     - The close button (`X`) is rendered with `accessibilityLabel="Cerrar ayuda"`
     - Modal is present: `getByTestId("help-tooltip-modal")` or similar
   - Coverage: visible state, text rendering, button presence

2. **Hide when `visible=false`**
   - Setup: `<HelpTooltip visible={false} ... />`
   - Assert: Modal is not on screen via `queryByTestId("help-tooltip-modal")` returns null or has `display: none`
   - Coverage: hidden state, conditional rendering

3. **Call `onClose` when close button is pressed**
   - Setup: `const onClose = jest.fn()` passed to component
   - Act: `fireEvent.press(screen.getByRole('button', { name: 'Cerrar ayuda' }))`
   - Assert: `expect(onClose).toHaveBeenCalledTimes(1)`
   - Coverage: close button callback, event propagation

4. **Call `onClose` when backdrop is pressed**
   - Setup: Render with `visible={true}`, get backdrop `Pressable` by testID
   - Act: `fireEvent.press(screen.getByTestId("help-tooltip-backdrop"))`
   - Assert: `expect(onClose).toHaveBeenCalledTimes(1)`
   - Coverage: backdrop dismiss logic, scrim interaction

5. **Call `onClose` on `onRequestClose` (Android back gesture)**
   - Setup: Render the component, trigger the Modal's `onRequestClose` callback
   - Act: Simulate system back: `fireEvent(modal, 'requestClose')`
   - Assert: `expect(onClose).toHaveBeenCalledTimes(1)`
   - Coverage: system gesture handling, Modal lifecycle

6. **Render optional "Entendido" CTA if provided**
   - Setup: `<HelpTooltip ... actionLabel="Entendido" onAction={jest.fn()} />`
   - Assert: Button is on screen, pressing it calls both `onAction` and `onClose`
   - Coverage: optional CTA, dual callbacks

7. **Display fade animation on mount**
   - Setup: Render with `visible={true}`
   - Assert: Modal has `animationType="fade"` prop
   - Coverage: animation config, perceived performance

8. **Does not crash if items array is empty**
   - Setup: `<HelpTooltip ... items={[]} />`
   - Assert: Renders without error, title and close button still present
   - Coverage: edge case, resilience

### 3.2 RewardsScreen Integration

**File:** `frontend/app/__tests__/rewards.integration.test.tsx`

**Mocks:**
- `useRouter` from `expo-router`: mock `push`, `back`, `replace`
- `useSessionStore`: mock `creditedPoints`, `balance`
- `REWARDS` mock data: one highlighted, two regular rewards
- MSW/jest mocks for API calls (if any RewardsCatalog fetches during test)

**Test cases:**

1. **Help button appears in header**
   - Setup: Render `<RewardsScreen />`
   - Assert:
     - Button with `accessibilityLabel="Ayuda sobre recompensas"` is on screen
     - Icon is `HelpCircle` (via `testID` or role)
     - Button is positioned in the header flex-row

2. **Help button opens tooltip on press**
   - Setup: Render `<RewardsScreen />`, tooltip starts hidden
   - Act: `fireEvent.press(screen.getByRole('button', { name: /ayuda/i }))`
   - Assert: `screen.getByText("¿Cómo funcionan las recompensas?")` is now visible
   - Coverage: open state transition

3. **Tooltip closes when backdrop is tapped**
   - Setup: Render, open tooltip
   - Act: `fireEvent.press(screen.getByTestId("help-tooltip-backdrop"))`
   - Assert: Tooltip is no longer on screen (queryByText returns null)
   - Coverage: close state transition, backdrop interaction

4. **Tooltip closes when close button is pressed**
   - Setup: Render, open tooltip
   - Act: `fireEvent.press(screen.getByRole('button', { name: /cerrar ayuda/i }))`
   - Assert: Tooltip hidden, focus returns to help trigger button
   - Coverage: close button workflow, focus management

5. **Tooltip closes on system back gesture**
   - Setup: Render, open tooltip, mock `onRequestClose`
   - Act: Trigger the back gesture simulation
   - Assert: Tooltip hidden
   - Coverage: system gesture handling

6. **Help button state is independent of points balance**
   - Setup: Render with `creditedPoints=0`, open tooltip
   - Act: Update store to `creditedPoints=1000`
   - Assert: Tooltip remains open, content unchanged
   - Coverage: isolation from app state, re-render resilience

7. **Multiple rapid open/close cycles**
   - Setup: Render
   - Act: Open tooltip, close, open, close (4 cycles)
   - Assert: No crashes, tooltip final state is closed
   - Coverage: state management, repeated transitions

8. **Tooltip does not block scroll of RewardsCatalog**
   - Setup: Render, open tooltip
   - Act: Attempt to scroll the underlying ScrollView (use `fireEvent.scroll`)
   - Assert: Scroll events are blocked (Modal acts as scrim), tooltip remains open
   - Coverage: modal behavior, layering

9. **Rewards catalog still visible behind tooltip**
   - Setup: Render, open tooltip
   - Assert: RewardsCatalog text is accessible via `queryByText` (not on screen, but in the tree behind modal)
   - Coverage: layering, non-destructive overlay

### 3.3 Navigation & Router Integration

**File:** `frontend/app/__tests__/rewards.routing.test.tsx`

**Test cases:**

1. **Back button still works when tooltip is closed**
   - Setup: Render, tooltip closed
   - Act: `fireEvent.press(screen.getByRole('button', { name: /volver/i }))`
   - Assert: `useRouter.back()` was called
   - Coverage: back navigation, header button

2. **Back button is not affected by tooltip open state**
   - Setup: Render, open tooltip
   - Act: `fireEvent.press(screen.getByRole('button', { name: /volver/i }))`
   - Assert: `useRouter.back()` is called, tooltip does not intercept
   - Coverage: event propagation, layering

3. **BottomNav still navigates when tooltip is open**
   - Setup: Render, open tooltip
   - Act: `fireEvent.press(screen.getByRole('button', { name: /home/i }))`
   - Assert: Navigation is triggered (tooltip does not block it)
   - Coverage: BottomNav accessibility, layering

---

## 4. Contract tests
_API ↔ client contract, DTO/schema conformance._

**Scope:** None. This feature has no API changes, no new endpoints, no DTOs, no Zod schemas.
The help copy is static client-side content. No contract tests required.

---

## 5. Edge cases & error paths
_Invalid input, authz failures, empty/error states._

### 5.1 Component-Level Edge Cases

**File:** `frontend/src/components/molecules/__tests__/HelpTooltip.edge.test.tsx`

1. **Very long title text**
   - Setup: `title="This is an extremely long help title that might wrap to multiple lines or be cut off depending on the layout constraints and text measurement"`
   - Assert: Title is wrapped or truncated gracefully, no overflow, readable
   - Coverage: text layout, edge case handling

2. **Very long help items**
   - Setup: `items={["A very long explanation that spans multiple lines...", "Another long item..."]}`
   - Assert: Items wrap within the card without overflow
   - Coverage: list item layout

3. **Many help items (5+)**
   - Setup: `items={[...10 items...]}`
   - Assert: Card scrolls internally or truncates gracefully, no layout break
   - Coverage: content overflow handling

4. **Special characters in copy (accents, emoji)**
   - Setup: `title="¿Cómo funcionan? 🎉", items={["Gana puntos ⭐"]}`
   - Assert: Renders correctly without encoding issues
   - Coverage: internationalization, special chars

5. **`onClose` is not provided (undefined)**
   - Setup: `<HelpTooltip ... onClose={undefined} />`
   - Assert: Component renders without error, close button does nothing (safe)
   - Coverage: defensive programming

6. **Rapid visible toggle (visible true → false → true)**
   - Setup: Render with `visible={true}`
   - Act: Re-render with `visible={false}`, then `visible={true}`
   - Assert: No crashes, tooltip shown correctly after toggle
   - Coverage: prop change handling, animation reset

7. **Tooltip mounted but screen loses focus (app backgrounded)**
   - Setup: Render, open tooltip
   - Act: Simulate app pause (useEffect cleanup)
   - Assert: Component unmounts cleanly, no memory leaks
   - Coverage: lifecycle, cleanup

### 5.2 RewardsScreen-Level Edge Cases

**File:** `frontend/app/__tests__/rewards.edge.test.tsx`

1. **User has zero points and zero rewards**
   - Setup: Mock `creditedPoints=0`, `REWARDS=[]`
   - Assert: Help button still renders and works; tooltip can be opened
   - Coverage: empty state, feature independence

2. **Store is loading or erroring**
   - Setup: Mock store as loading or with an error
   - Act: Try to open tooltip
   - Assert: Tooltip works independently of store state
   - Coverage: isolation, error resilience

3. **Screen unmounts while tooltip is open**
   - Setup: Render, open tooltip
   - Act: Unmount the component (navigation away)
   - Assert: No warnings, cleanup runs, no memory leaks
   - Coverage: lifecycle, cleanup

4. **User navigates away from rewards screen while tooltip is open**
   - Setup: Render RewardsScreen, open tooltip
   - Act: Press BottomNav to go to home tab
   - Assert: RewardsScreen unmounts, tooltip state is cleaned up
   - Coverage: navigation cleanup

5. **Tooltip with null/undefined prop values**
   - Setup: `<HelpTooltip visible={null} items={undefined} onClose={undefined} />`
   - Assert: Renders without crashing (TypeScript should catch, but runtime safe too)
   - Coverage: defensive coding, null checks

---

## 6. Coverage targets
_Lines/branches thresholds; critical paths that must be covered._

| File | Type | Statements | Branches | Lines | Functions |
|------|------|-----------|----------|-------|-----------|
| `HelpTooltip.tsx` | Component | 90% | 85% | 90% | 90% |
| `RewardsScreen` (modified) | Screen | 85% | 80% | 85% | 85% |
| **Overall** | Integration | **80%** | **75%** | **80%** | **80%** |

**Critical paths (must-cover, 100% branch coverage):**
- Tooltip `visible` conditional rendering (true → false)
- All three dismiss paths: backdrop, close button, system back
- Help button press event
- `onClose` callback invocation
- Modal animation config

**Optional/low-priority (sampling acceptable, ≥70%):**
- Very long text overflow (edge case)
- Rapid toggle cycles
- Store/router integration (already tested elsewhere)

---

## 7. Acceptance criteria

- [ ] `HelpTooltip.test.tsx` exists in `frontend/src/components/molecules/__tests__/` with ≥8 test cases covering render, dismiss paths (3 ways), state isolation, and edge cases.

- [ ] `RewardsScreen` integration tests exist in `frontend/app/__tests__/rewards.integration.test.tsx` with ≥9 test cases covering: button appears, tooltip opens, closes via backdrop/button/back gesture, state independence, rapid toggle, catalog not blocked, BottomNav still works.

- [ ] Help button trigger has correct a11y properties: `accessibilityRole="button"`, `accessibilityLabel="Ayuda sobre recompensas"`, `accessibilityHint="Abre una explicación..."`.

- [ ] Tooltip modal has correct a11y: `accessibilityViewIsModal`, `accessibilityRole="dialog"`, title is first focusable element, close button has `accessibilityLabel="Cerrar ayuda"`.

- [ ] Edge case tests exist for: empty items, long text, many items, special characters, undefined callbacks, rapid toggle, screen unmount.

- [ ] Accessibility test (`HelpTooltip.a11y.test.tsx`) passes @axe-core/react with zero critical violations; manual VoiceOver (iOS) and TalkBack (Android) passes documented.

- [ ] All three dismiss paths (backdrop press, close button press, system back gesture) are tested and fire `onClose` callback exactly once per interaction.

- [ ] Test coverage meets thresholds: HelpTooltip ≥90% statements, RewardsScreen ≥85% statements, overall ≥80%.

- [ ] Jest `--testMatch` includes `**/__tests__/**/*.{test,spec}.{ts,tsx}` and picks up all test files automatically.

- [ ] `npm test -- --coverage` in the frontend root includes these new tests in the report and passes all thresholds before a PR can merge (CI gate).

- [ ] No MSW mocks or API layer changes required; all tests use in-memory component state and jest.fn() mocks for callbacks.

