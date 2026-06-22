# Skill: add a React Native (Expo) component

Target: `frontend/src/components/{atoms|molecules|organisms}/` or a feature under `frontend/src/features/`.

## Atomic design
- **atoms** — primitives (Button, Input, Badge). No business logic.
- **molecules** — small compositions of atoms (ProductCard, ScanConfirmationModal).
- **organisms** — larger sections (BottomNav, RewardsCatalog).

## Conventions
- TypeScript strict; type all props with an explicit `Props` interface.
- Style with NativeWind classes (`className=...`); use design tokens, not hard-coded colors.
- Forms: `react-hook-form` + `zod` resolver. Server state: TanStack Query. Global UI state: Zustand store
  (`src/store`).
- Handle loading, empty, and error states. Add a11y props (`accessibilityRole`, `accessibilityLabel`).
- Co-locate tests in a sibling `__tests__/` folder using `@testing-library/react-native`.

## Checklist
- [ ] Placed in the correct atomic layer
- [ ] Typed props; NativeWind tokens
- [ ] Loading/empty/error + a11y handled
- [ ] Reuses existing atoms/molecules where possible
- [ ] Test added in `__tests__/`
