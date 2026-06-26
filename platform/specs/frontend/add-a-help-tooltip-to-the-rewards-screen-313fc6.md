<!-- feature-id: add-a-help-tooltip-to-the-rewards-screen-313fc6 | domain: frontend | generated offline -->
# Frontend Specification — Add a help tooltip to the rewards screen

- **Feature ID:** `add-a-help-tooltip-to-the-rewards-screen-313fc6`
- **Domain:** Frontend (React Native + Expo)
- **Date:** 2026-06-26
- **Binding:** README.md §1 Frontend Design

## 1. Summary
Add a contextual **help tooltip** to the Rewards screen (`/app/rewards.tsx`, "Mis recompensas")
that explains how the points-to-rewards mechanic works (how points are earned, what the balance
means, and how redemption / "Canjear" works). The tooltip is opened from a small help-icon button
placed in the screen header, next to the "Mis recompensas" title, and is dismissed by tapping
outside, the close affordance, or the system back gesture. This is a **presentation-only** feature:
it adds an atom + a molecule and wires a trigger into the existing `RewardsScreen` container — no
new network calls, no domain rules, no store mutations.

## 2. User flows & screens
_Screens/routes affected (Expo Router), entry points, and navigation changes._

- **Route affected:** `/app/rewards.tsx` (`RewardsScreen`). No new routes; no navigation/router
  changes — the tooltip is an in-screen overlay, not a pushed screen.
- **Entry point:** A new ghost icon-button (`HelpCircle` lucide icon) is rendered in the existing
  header row (the `flex-row` containing the back button + "Mis recompensas" `Text`), aligned to the
  trailing edge of the header.
- **Flow:**
  1. User is on the Rewards screen viewing their points balance and catalog.
  2. User taps the help (`?`) button in the header.
  3. A lightweight popover/sheet (`HelpTooltip`) appears with a short title ("¿Cómo funcionan las
     recompensas?") and 2–3 bullet lines explaining earn → accumulate → redeem.
  4. User dismisses via the close button, a tap on the scrim/backdrop, or the Android back gesture.
  5. Focus returns to the help button; the screen state is otherwise unchanged.
- **Local UI state only:** an `open: boolean` `useState` inside `RewardsScreen` controls visibility.
  No persistence across sessions (no secure-store / AsyncStorage needed).

## 3. Components (atomic design)
| Layer | Component | New/Reused | Notes |
|---|---|---|---|
| atom | `Icon` | Reused | `lucide-react-native` wrapper; renders `HelpCircle` (trigger) and `X` (close). `decorative={false}` + paired label for the meaningful trigger icon. |
| atom | `Button` | Reused | Optional "Entendido" dismiss CTA inside the tooltip, `variant="ghost"`. |
| atom | `IconButton` (a11y trigger) | New (thin) | `Pressable` wrapping `Icon name="HelpCircle"` with `accessibilityRole="button"`, `accessibilityLabel="Ayuda sobre recompensas"`, `accessibilityHint`. Mirrors the existing back-button `Pressable` pattern already in `rewards.tsx` (rounded, `h-9 w-9`, token bg). May be inlined in the header rather than extracted if kept minimal. |
| molecule | `HelpTooltip` | New | `/components/molecules/HelpTooltip.tsx`. Presentational popover built on RN `Modal` (`transparent`, `animationType="fade"`, `onRequestClose`) following the `ScanConfirmationModal` pattern. Props: `visible: boolean`, `title: string`, `items: string[]` (or `body`), `onClose: () => void`. Renders a backdrop `Pressable` (tap-to-dismiss), a `bg-surface rounded-lg p-lg gap-md` card, a header row (title + `X` close), and bulleted help lines. No business logic. |
| organism | `RewardsCatalog` | Reused (unchanged) | Existing catalog organism; not modified. |
| screen | `RewardsScreen` (`/app/rewards.tsx`) | Modified (container) | Owns `open` state, renders the header help trigger, and mounts `HelpTooltip`. Stays a container per the Container/Presentational split (§1.2). |

## 4. State & data access
_Zustand store slices, TanStack Query keys/endpoints consumed, optimistic updates._

- **Zustand:** None added. `RewardsScreen` continues to read `creditedPoints` via the existing
  selective selector `useSessionStore((s) => s.creditedPoints)` (§1.6 memoization). The tooltip does
  not read or mutate the session store.
- **TanStack Query:** None. No endpoint is consumed; the help copy is **static client-side content**
  (a local constant array of strings). No new `queryKey`, no Axios call, no `src/api/**` change.
- **Optimistic updates:** N/A — nothing is written.
- **Local component state:** `const [open, setOpen] = useState(false)` in `RewardsScreen` (Presentation
  layer only). No Command objects, no Domain rules, no Infrastructure access (consistent with the
  layered access rules in §1.4 — Presentation handling a pure UI toggle).

## 5. Forms & validation
_react-hook-form usage and Zod schemas; client-side validation rules._

- **Not applicable.** This feature has no user input, no form fields, and no submitted data, so no
  `react-hook-form` `Controller` and no Zod schema are required. (Zod/RHF remain reserved for the
  manual-barcode and auth forms per §1.2 / §1.3 MASVS-PLATFORM.) The help copy is static and typed as
  a `readonly string[]` constant.

## 6. Security (§1.3)
_Token handling (expo-secure-store), RBAC-gated UI, no secrets in the bundle._

- **Tokens:** No change to auth/session. No `expo-secure-store` access; no JWT handling touched.
- **RBAC:** This is the consumer mobile app (`USER` scope only, §1.3). The tooltip is visible to all
  authenticated `USER` accounts; no role-gated UI and no privileged action is exposed.
- **Secrets / config:** Help copy is non-sensitive static UI text — no secrets, no environment values,
  nothing bundled that violates MASVS-CRYPTO/STORAGE. No PII is rendered or logged.
- **MASVS-RESILIENCE:** No `console.*` left in source (stripped in prod via Babel per §1.3); any
  unexpected render error is contained by the existing per-feature Error Boundary wrapping rewards.

## 7. Accessibility & UX
_a11y roles/labels, loading/empty/error states, perceived performance._

- **Trigger a11y:** Help button uses `accessibilityRole="button"`,
  `accessibilityLabel="Ayuda sobre recompensas"`, and `accessibilityHint="Abre una explicación de
  cómo ganar y canjear puntos"`. The `HelpCircle` icon is meaningful → `decorative={false}` and paired
  with the label (never icon/color alone, §1.2).
- **Tooltip a11y:** Built on RN `Modal` so focus is trapped while open (matching `ScanConfirmationModal`);
  `onRequestClose` handles the Android back gesture. The dialog container sets
  `accessibilityViewIsModal` and `accessibilityRole` appropriate for a dialog; the title is the first
  focusable element for screen readers. Close button has `accessibilityLabel="Cerrar ayuda"`.
- **Dismissal:** Three redundant paths — backdrop tap (`Pressable` scrim), explicit `X` / "Entendido"
  button, and system back — satisfying error-prevention/usability expectations.
- **Tone/visuals:** Tooltip card uses NativeWind tokens (`bg-surface rounded-lg p-lg gap-md`, body text
  `text-text-secondary text-sm`, title `font-display text-text-primary`); meets contrast on the
  `bg-background` screen. Backdrop `bg-black/40` matches the existing modal convention.
- **Loading/empty/error states:** No async work → no loading/empty states. Help content is always
  present (static), so no empty state. Render-time failures fall back to the feature Error Boundary
  ("Algo salió mal…", §1.5) without crashing the rewards screen.
- **Perceived performance:** `animationType="fade"` for an instant, lightweight feel; the `Modal`
  mounts only when `open` is true (gated render), so it adds no cost to the default screen render and
  no impact on `FlashList` virtualization in `RewardsCatalog` (§1.6).

## 8. Acceptance criteria
- [ ] A help (`?` / `HelpCircle`) icon-button is visible in the Rewards screen header, aligned to the
      trailing edge next to "Mis recompensas".
- [ ] Tapping the help button opens the `HelpTooltip` overlay with a title and 2–3 lines explaining how
      points are earned, accumulated, and redeemed.
- [ ] The tooltip can be dismissed via the close (`X`/"Entendido") button, a tap on the backdrop, and
      the Android system back gesture; on dismiss focus returns to the trigger.
- [ ] The new `HelpTooltip` molecule is presentational only (props `visible`, `title`, `items`/`body`,
      `onClose`) with no store, network, or domain dependencies.
- [ ] `RewardsScreen` remains a container: it owns the `open` boolean state and composes the trigger +
      tooltip; no business logic moves into presentational components.
- [ ] No new TanStack Query keys, Axios endpoints, Zustand slices, or secure-store usage are introduced.
- [ ] Trigger and close controls expose correct `accessibilityRole`/`accessibilityLabel`; the dialog
      traps focus and passes the component a11y test (0 critical violations, §1.7).
- [ ] Styling uses existing NativeWind design tokens; the overlay matches the existing modal/backdrop
      convention (`bg-black/40`, `bg-surface rounded-lg`).
- [ ] An RTL integration test (`render` + `fireEvent`, accessibility queries) covers open → assert
      content visible → dismiss → assert hidden; an `@axe-core/react` assertion covers a11y (§1.7).
