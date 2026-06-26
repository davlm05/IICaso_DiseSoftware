<!-- feature-id: add-a-help-tooltip-to-the-rewards-screen-313fc6 | domain: cicd | generated 2026-06-26 -->
# CI/CD Specification — Add a help tooltip to the rewards screen

- **Feature ID:** `add-a-help-tooltip-to-the-rewards-screen-313fc6`
- **Domain:** CI/CD (GitHub Actions)
- **Date:** 2026-06-26
- **Binding:** README.md §2.9 Infrastructure & DevOps / CI-CD Pipeline

## 1. Summary

Add a help tooltip UI component to the Rewards screen in the React Native mobile app. This feature extends the existing frontend CI/CD pipeline with new unit and integration test coverage for a presentational component (`HelpTooltip`) and screen container modification (`RewardsScreen`). No backend API changes, no new endpoints, no data migrations — purely a frontend feature, so the pipeline runs quality gates in the `frontend/` working directory only.

---

## 2. Pipeline stages

**Affected workflows:** [`.github/workflows/ci.yml`](.github/workflows/ci.yml) (frontend branch)

| Stage | Job | Scripts / Actions | Trigger Condition |
|-------|-----|-------------------|-------------------|
| 1. Install & Cache | `quality` · setup | `actions/setup-node@v4` with `cache: npm` | Every push to feature branch + PR to `main` |
| 2. Lint | `quality` · lint | `npm run lint` (ESLint 9 flat config) | Must pass; zero warnings |
| 3. Format Check | `quality` · format:check | `npm run format:check` (Prettier 3) | Must pass; all files formatted |
| 4. Type Check | `quality` · typecheck | `npm run typecheck` (tsc --noEmit) | Must pass; no type errors |
| 5. Unit & Integration Tests | `quality` · test | `npm test -- --coverage` (Jest + RTL, coverage gates) | Must pass; statements ≥ 80%, branches ≥ 75% |
| 6. Build (EAS) | `build` · eas-build | `eas build --platform all --profile production` | Only on `main` after quality passes; requires `EXPO_TOKEN` |
| 7. E2E Tests | `e2e` · maestro | `maestro test .maestro/` | After EAS Build succeeds |
| 8. Deploy | `deploy` · eas-update | `eas update --branch staging` (auto), manual gate for production | After E2E passes |

**Frontend-specific:** All jobs run with `defaults.run.working-directory: frontend`, isolating frontend deps and build artifacts from backend.

---

## 3. Quality gates

All gates must pass before a PR can be merged to `main`. Enforcement is via **branch protection rules** at [`.github/settings.yml`](.github/settings.yml).

| Gate | Tool | Threshold | Block Merge? | Notes |
|------|------|-----------|--------------|-------|
| **Lint (ESLint 9)** | ESLint with flat config | 0 warnings, 0 errors | ✅ Yes | Configured in `frontend/eslint.config.js`. A lint warning fails the workflow. |
| **Format (Prettier 3)** | Prettier | All files match format | ✅ Yes | Run `npm run format` locally to fix. Prettier formatting is non-negotiable. |
| **Type Check (tsc)** | TypeScript 5.3.3 | No type errors | ✅ Yes | `--noEmit` flag compiles without emitting JS, catching type issues early. |
| **Unit Test Coverage (Jest)** | Jest 29.7.0 + React Testing Library | Statements ≥ 80%, Branches ≥ 75% | ✅ Yes | Coverage report uploaded as artifact; SonarQube (if integrated) gates on the report. New components (`HelpTooltip`) must include unit tests. Modified components (`RewardsScreen`) must include integration tests. |
| **Integration Test Pass Rate** | Jest + RTL (`@testing-library/react-native`) | 100% tests pass | ✅ Yes | Required integration tests: (1) `HelpTooltip.test.tsx` — render, open/close behavior, dismiss paths. (2) `RewardsScreen.integration.test.tsx` — help trigger visibility, tooltip overlay interaction. |
| **Security Audit (npm audit)** | `npm audit` | 0 critical, 0 high vulnerabilities | ✅ Yes | Checked as a separate step in the quality job. Any new high/critical CVE blocks the build. |
| **Accessibility (a11y)** | Jest + `@testing-library/react-native` assertions | `accessibilityRole`, `accessibilityLabel` present on all interactive elements | ⚠️ Advisory | ESLint a11y plugin enforces at lint time. RTL tests assert a11y attributes. No blocking gate, but high-severity a11y failures trigger PR review comments. |
| **Bundle Size** | N/A (Expo handles build) | No regression vs. `main` | ⚠️ Advisory | EAS Build logs include platform-specific binary sizes. A significant regression (>5% APK/IPA size) triggers a review comment but doesn't block merge. |

---

## 4. New/changed workflow steps

### 4.1 New Jest test files (frontend)

**Purpose:** Validate the new `HelpTooltip` component and the modified `RewardsScreen` in isolation.

**Files to add:**

1. **`frontend/src/components/molecules/__tests__/HelpTooltip.test.tsx`**
   - **What to test:**
     - Render with props (`visible`, `title`, `items`, `onClose`).
     - Visible when `visible={true}`, hidden when `visible={false}`.
     - Close button press calls `onClose()`.
     - Backdrop press calls `onClose()`.
     - `accessibilityRole="dialog"`, title and close button have `accessibilityLabel`.
     - Snapshot for visual regression.
   - **Dependencies:** Jest, React Testing Library (`@testing-library/react-native`), React Native mock.
   - **Example structure:**
     ```typescript
     import { render, fireEvent, screen } from '@testing-library/react-native';
     import { HelpTooltip } from '../HelpTooltip';

     describe('HelpTooltip', () => {
       it('renders when visible=true', () => {
         const { getByText } = render(
           <HelpTooltip visible title="Test" items={['Item 1']} onClose={jest.fn()} />
         );
         expect(getByText('Test')).toBeOnTheScreen();
       });

       it('calls onClose when close button is pressed', () => {
         const onClose = jest.fn();
         const { getByLabelText } = render(
           <HelpTooltip visible title="Test" items={['Item 1']} onClose={onClose} />
         );
         fireEvent.press(getByLabelText('Cerrar ayuda'));
         expect(onClose).toHaveBeenCalled();
       });

       it('matches snapshot', () => {
         const tree = render(
           <HelpTooltip visible title="Test" items={['Item 1']} onClose={jest.fn()} />
         ).toJSON();
         expect(tree).toMatchSnapshot();
       });
     });
     ```

2. **`frontend/src/screens/__tests__/RewardsScreen.integration.test.tsx`**
   - **What to test:**
     - Help button is visible in the header with correct `accessibilityLabel`.
     - Tapping help button opens the `HelpTooltip`.
     - Tapping close/backdrop dismisses the tooltip.
     - Tooltip content displays correctly (title + help items).
     - Screen state (points balance, catalog) is unchanged after tooltip dismiss.
   - **Dependencies:** Jest, RTL, mock `TanStack Query`, mock Zustand store (via `jest.mock`).
   - **Example structure:**
     ```typescript
     import { render, fireEvent, screen, waitFor } from '@testing-library/react-native';
     import { RewardsScreen } from '../RewardsScreen';

     describe('RewardsScreen — Help Tooltip', () => {
       it('renders help button in header', () => {
         render(<RewardsScreen />);
         expect(screen.getByLabelText('Ayuda sobre recompensas')).toBeOnTheScreen();
       });

       it('opens tooltip when help button is tapped', async () => {
         render(<RewardsScreen />);
         fireEvent.press(screen.getByLabelText('Ayuda sobre recompensas'));
         await waitFor(() => {
           expect(screen.getByText('¿Cómo funcionan las recompensas?')).toBeOnTheScreen();
         });
       });

       it('closes tooltip when close button is tapped', async () => {
         render(<RewardsScreen />);
         fireEvent.press(screen.getByLabelText('Ayuda sobre recompensas'));
         await waitFor(() => expect(screen.getByText('¿Cómo funcionan las recompensas?')).toBeOnTheScreen());
         fireEvent.press(screen.getByLabelText('Cerrar ayuda'));
         await waitFor(() => expect(screen.queryByText('¿Cómo funcionan las recompensas?')).not.toBeOnTheScreen());
       });
     });
     ```

### 4.2 No changes to `.github/workflows/ci.yml` required

The existing **`ci.yml` frontend pipeline already covers all stages for this feature**:
- Lint, format, type-check, unit/integration tests run in the `quality` job.
- EAS Build, E2E (Maestro), and deploy jobs run on `main` after quality passes.

**Why no workflow changes?**
- This feature is purely a React Native component — no new frameworks, no new test runners, no new secret dependencies.
- The test scripts in `frontend/package.json` (`npm test`, `npm run typecheck`, `npm run lint`) remain unchanged.
- The new test files are auto-discovered by Jest (glob pattern: `**/__tests__/**/*.test.tsx` or `**/*.test.tsx`).

---

### 4.3 Maestro E2E flows (optional, frontend/.maestro/)

If manual Maestro E2E tests are already defined for the Rewards screen, **no changes needed**. If not, a new flow can be added:

**File:** `frontend/.maestro/rewards-help-tooltip.yaml` (optional)
```yaml
appId: expo.smartcart
---
- label: Navigate to Rewards screen
  tapOn:
    id: tab-rewards

- label: Verify help button is visible
  assertVisible:
    text: "Ayuda sobre recompensas"

- label: Open help tooltip
  tapOn:
    text: "Ayuda sobre recompensas"

- label: Verify tooltip content is visible
  assertVisible:
    text: "¿Cómo funcionan las recompensas?"

- label: Close tooltip via close button
  tapOn:
    text: "Cerrar ayuda"

- label: Verify tooltip is dismissed
  assertNotVisible:
    text: "¿Cómo funcionan las recompensas?"
```

**Note:** This is added for confidence but is **not blocking** — the unit + integration tests provide sufficient coverage. If Maestro infrastructure is not available in CI, the `e2e` job in ci.yml will skip or report a warning rather than fail.

---

## 5. Secrets & environments

### 5.1 Required secrets (GitHub repository settings)

| Secret Name | Usage | Scope | Notes |
|-------------|-------|-------|-------|
| `EXPO_TOKEN` | EAS Build & EAS Update (stages 6 & 8) | `frontend` | Personal access token from Expo.dev. Stored in repo Settings → Secrets and variables → Actions. Do NOT commit to `.env` or code. |
| `GH_TOKEN` (optional) | Creating a real PR via `gh pr create` in `/release-feature` | Global | Only needed if the release agent creates a PR. Fallback: manual PR creation. |

### 5.2 Target environments

| Environment | Build Profile | Deploy Trigger | Notes |
|-------------|---------------|-----------------|-------|
| **Staging** | `preview` (in `eas.json`) | Automatic on merge to `main` | `eas update --branch staging` pushes a new OTA (over-the-air) update to Expo staging channel. No app store submission. |
| **Production** | `production` (in `eas.json`) | Manual QA sign-off (gated in ci.yml) | `eas submit` → iOS App Store + Google Play Store. Manual approval gate in GitHub required before submit. |

### 5.3 Environment variables (frontend/.env / eas.json)

No new secrets or environment variables are needed for this feature.
- Static help copy is hardcoded in the component (no i18n translation server call).
- Expo config remains unchanged.

---

## 6. Acceptance criteria

- [ ] **Test files created & passing:**
  - [ ] `frontend/src/components/molecules/__tests__/HelpTooltip.test.tsx` exists and all tests pass (`npm test`).
  - [ ] `frontend/src/screens/__tests__/RewardsScreen.integration.test.tsx` exists and all tests pass.
  - [ ] Coverage report shows statements ≥ 80%, branches ≥ 75% for new/modified files.

- [ ] **Quality gates pass:**
  - [ ] `npm run lint` → 0 warnings, 0 errors.
  - [ ] `npm run format:check` → all files formatted.
  - [ ] `npm run typecheck` → no type errors.
  - [ ] `npm test -- --coverage` → all tests pass, coverage thresholds met.
  - [ ] `npm audit` → 0 critical, 0 high vulnerabilities.

- [ ] **Components are correct:**
  - [ ] `HelpTooltip` molecule exists at `frontend/src/components/molecules/HelpTooltip.tsx` and is a presentational component (no store, no network, no side effects beyond props).
  - [ ] `RewardsScreen` container modified to own `open: boolean` state and render the help trigger + `HelpTooltip` without breaking existing functionality.

- [ ] **Accessibility verified:**
  - [ ] Help trigger has `accessibilityRole="button"`, `accessibilityLabel="Ayuda sobre recompensas"`.
  - [ ] Tooltip dialog has `accessibilityRole="dialog"`, `accessibilityViewIsModal`.
  - [ ] Close button has `accessibilityLabel="Cerrar ayuda"`.
  - [ ] No ESLint a11y warnings.

- [ ] **Build & deploy ready:**
  - [ ] EAS Build succeeds on `main` for iOS + Android (if manually triggered).
  - [ ] E2E flows (Maestro, if configured) pass without manual intervention.
  - [ ] `eas update --branch staging` succeeds, distributing the feature to staging users.

- [ ] **Code review approved:**
  - [ ] PR passes all status checks (lint, types, tests).
  - [ ] At least 1 code reviewer approves the changes.
  - [ ] No unresolved conversations.

---

## 7. Rollback & Recovery

If the feature causes regressions post-deploy:

| Scenario | Action | RTO |
|----------|--------|-----|
| **Staging E2E fails** | EAS Update is not pushed. Revert commit and redeploy. | ~5 min |
| **Production OTA breaks app** | Revert the OTA channel in Expo (remove/unpublish the update). Users auto-downgrade to the previous published version on app restart. | ~2 min |
| **App Store rejection** | EAS Submit logs provide the reason. Fix and re-submit (new review cycle ~1–5 days Apple, ~few hours Google). | Depends on store |

No database migrations or backend API changes, so no data rollback needed.

---

## 8. Monitoring & success metrics

Post-deployment observability targets (if integrated with the platform):

| Metric | Target | Tool |
|--------|--------|------|
| **Help button tap rate** | > 5% of Rewards screen sessions (indicates discoverability) | Sentry custom events / analytics provider |
| **Tooltip render errors** | 0 JavaScript errors in Sentry | Sentry |
| **A11y test pass rate** | 100% (no new a11y violations reported by screen readers) | Manual QA + axe reports |
| **App store rating impact** | No regression in average rating post-launch | App Store / Play Store metrics |

---

## 9. References

- **Frontend spec:** `platform/specs/frontend/add-a-help-tooltip-to-the-rewards-screen-313fc6.md`
- **CI/CD workflow (template):** [`.github/workflows/ci.yml`](.github/workflows/ci.yml)
- **Frontend package.json:** `frontend/package.json`
- **Expo config:** `frontend/eas.json`
- **Testing library docs:** [@testing-library/react-native](https://testing-library.com/docs/react-native-testing-library/intro)
- **Jest config:** `frontend/jest.config.js`
- **Maestro docs:** [maestro.mobile.dev](https://maestro.mobile.dev)
