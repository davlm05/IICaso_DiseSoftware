<!-- feature-id: add-a-mock-pay-button-on-qr-confirmation-screen-4479e3 | domain: cicd | generated 2026-06-26 -->
# CI/CD Specification — Add a mock pay button on QR confirmation screen

- **Feature ID:** `add-a-mock-pay-button-on-qr-confirmation-screen-4479e3`
- **Domain:** CI/CD (GitHub Actions)
- **Date:** 2026-06-26
- **Binding:** README.md §2.9 Infrastructure & DevOps / CI-CD Pipeline

## 1. Summary

This feature spans **both frontend and backend**:

- **Backend:** adds a new mock payment endpoint (`POST /sessions/:id/qr/pay`) to the Checkout module that completes a `PENDING_CHECKOUT` session and credits points atomically. The endpoint is feature-gated with `MOCK_PAY_ENABLED` and disabled in production (README §2.5 A04/A05). It reuses the existing checkout transaction boundary, points calculation strategy, and event publishing pipeline.

- **Frontend:** adds a "Simular pago en caja" (mock pay) button on the QR confirmation screen that calls the local store's `confirmValidation()` mock without hitting the backend. No new API endpoint consumption; purely a UI affordance for demos and testing.

**CI/CD impact:**
- **Backend pipeline** runs full quality gates: lint, type-check, unit + contract tests, integration tests (Postgres + Redis), build, OpenAPI validation. New tests cover the mock pay endpoint handler, state machine guards, and transaction atomicity.
- **Frontend pipeline** runs quality gates: lint, format, type-check, unit + integration tests (Jest + RTL). New test covers the mock pay button rendering, state management, and navigation.
- **Both pipelines must pass** before merge to `main`; deployment is conditional on successful E2E tests.

---

## 2. Pipeline stages

### 2.1 Backend Pipeline (`.github/workflows/` → `backend/.github/workflows/ci.yml`)

| Stage | Job | Scripts / Actions | Trigger Condition |
|-------|-----|-------------------|-------------------|
| 1. Install & Cache | `quality` · setup | `pnpm install --frozen-lockfile` + `cache: pnpm` keyed on `pnpm-lock.yaml` | Every push to feature branch + PR to `main` |
| 2. Lint | `quality` · lint | `pnpm lint` (ESLint 9 flat config, module boundaries) | Must pass; zero warnings, zero boundary violations |
| 3. Type Check | `quality` · typecheck | `pnpm type-check` (tsc --noEmit) | Must pass; no type errors |
| 4. Generate Prisma Client | `quality` · prisma-generate | `pnpm prisma:generate` | Before all tests to ensure `@prisma/client` is up-to-date |
| 5. Unit & Contract Tests | `quality` · unit + contract | `pnpm test:unit --passWithNoTests`, `pnpm test:contract --passWithNoTests` | Must pass; coverage gates apply to new/modified files |
| 6. Integration Tests | `integration` | `pnpm test:integration --passWithNoTests` (vs. live Postgres + Redis) | Runs after `quality` passes; validates state machine + transaction atomicity |
| 7. Build & OpenAPI | `build` | `pnpm build` + `pnpm openapi:validate` | Validates TypeScript compilation + OpenAPI spec consistency with NestJS decorators |
| 8. Security Audit | `quality` · audit | `pnpm audit --audit-level=critical` (NEW) | Fails on any new critical/high CVE |

**Diagram:**
```
quality (lint, types, unit, contract) ──┬──> integration (postgres+redis)
                                          └──> build (TypeScript + OpenAPI)
                                              (both must pass before deploy)
```

### 2.2 Frontend Pipeline (`.github/workflows/ci.yml`)

| Stage | Job | Scripts / Actions | Trigger Condition |
|-------|-----|-------------------|-------------------|
| 1. Install & Cache | `quality` · setup | `npm ci` + `cache: npm` | Every push to feature branch + PR to `main` |
| 2. Lint | `quality` · lint | `npm run lint` (ESLint 9) | Must pass; zero warnings |
| 3. Format Check | `quality` · format:check | `npm run format:check` (Prettier 3) | Must pass; all files formatted |
| 4. Type Check | `quality` · typecheck | `npm run typecheck` (tsc --noEmit) | Must pass; no type errors |
| 5. Unit & Integration Tests | `quality` · test | `npm test -- --coverage` (Jest + RTL) | Must pass; coverage ≥ 80% statements, ≥ 75% branches |
| 6. Build (EAS) | `build` | `eas build --platform all --profile production` | Only on `main` after quality passes; requires `EXPO_TOKEN` |
| 7. E2E (Maestro) | `e2e` | `maestro test .maestro/` | After EAS Build succeeds |
| 8. Deploy | `deploy` | `eas update --branch staging` (auto), manual gate for production | After E2E passes |

---

## 3. Quality gates

All gates must pass before a PR can be merged to `main`. Enforcement via **branch protection rules** at [`.github/settings.yml`](.github/settings.yml).

### 3.1 Backend Quality Gates

| Gate | Tool | Threshold | Block Merge? | Notes |
|------|------|-----------|--------------|-------|
| **Lint (ESLint 9)** | ESLint + flat config | 0 warnings, 0 errors; module boundaries enforced | ✅ Yes | New code in `checkout.module.ts`, `qr.controller.ts`, `checkout.service.ts` must not import across layer boundaries (README §2.2). ESLint rule checks enforced at lint time. |
| **Type Check (tsc)** | TypeScript 5.5+ | No type errors on new/modified files | ✅ Yes | New DTO (`MockPayResponse`) must be strict-typed; service method signature validated against interface contracts. |
| **Prisma Schema** | Prisma | No schema migrations required | ⚠️ Advisory | This feature uses existing tables (`sessions`, `points_transactions`). If any schema changes are needed, `pnpm prisma migrate dev` generates a new migration that must be committed. |
| **Unit Tests** | Jest 29.7+ | New test files for `MockPayController`, `CheckoutService.mockPay()` with coverage ≥ 80% statements, ≥ 75% branches | ✅ Yes | Required tests: (1) controller handler — authorization, input validation, success/error paths. (2) service method — state machine guards, points calculation, transaction atomicity. (3) no unit tests cross process boundaries (mock repo/logger). |
| **Contract Tests** | Jest + Zod | `MockPayResponse` validates against `MockPayResponseSchema` in `@smartcart/shared-types` | ✅ Yes | Contract test file: `backend/apps/api/src/modules/checkout/__tests__/mock-pay.contract.test.ts`. Validates request/response shapes are JSON-serializable and match shared-types schema. |
| **Integration Tests** | Jest + Prisma + Docker (Postgres + Redis) | State machine transitions, transaction rollback, side-effect ordering | ✅ Yes | Required integration tests: (1) happy path — session transitions `PENDING_CHECKOUT → COMPLETED`, points credited, ledger appended. (2) replayed request — second `POST` on `COMPLETED` session returns 409, no double-credit. (3) unauthorized access — `USER` JWT on another user's session returns 403. (4) feature gate off — endpoint returns 404 when `MOCK_PAY_ENABLED !== true`. |
| **Security Audit (npm/pnpm audit)** | `pnpm audit --audit-level=critical` | 0 critical, 0 high vulnerabilities in new dependencies (if any) | ✅ Yes | No new deps expected, but run the check as a gate. Fails the build if a known CVE exists. |
| **OpenAPI Validation** | NestJS Swagger + vacuum | Generated OpenAPI spec is valid 3.1, includes `MockPayResponse` schema, endpoint is documented with `@ApiOperation`, `@ApiResponses` | ✅ Yes | `pnpm openapi:validate` ensures Swagger decorators on the controller are correct and spec is parseable. A missing/malformed response type blocks the build. |
| **Permission & Authorization** | Code review | `@Roles('USER')` + `ResourceOwnershipGuard` applied to the endpoint; feature gate checked in service | ⚠️ Advisory | Code reviewer verifies guard decorators are present and `MOCK_PAY_ENABLED` config is gated at the service entry point. Automated ESLint cannot check this; manual review required. |

### 3.2 Frontend Quality Gates

| Gate | Tool | Threshold | Block Merge? | Notes |
|------|------|-----------|--------------|-------|
| **Lint (ESLint 9)** | ESLint | 0 warnings, 0 errors | ✅ Yes | New component code (button state, navigation calls) must follow eslint-plugin-react-native rules. |
| **Format (Prettier 3)** | Prettier | All files formatted | ✅ Yes | Run `npm run format` locally. |
| **Type Check (tsc)** | TypeScript 5.3.3 | No type errors | ✅ Yes | Button `onPress`, store hook selectors, router navigation must be strictly typed. |
| **Unit & Integration Tests (Jest)** | Jest 29.7 + RTL | Statements ≥ 80%, Branches ≥ 75% on new/modified files | ✅ Yes | Required tests: (1) button renders when `qrToken` exists and `status === "PENDING_CHECKOUT"`. (2) button calls `store.confirmValidation()` on press. (3) button disabled while `processing`. (4) integration with checkout screen — confirms points are credited and navigation to `/confirmation` occurs. |
| **Security Audit (npm audit)** | `npm audit` | 0 critical, 0 high vulnerabilities | ✅ Yes | Checked before merge. |

---

## 4. New/changed workflow steps

### 4.1 Backend: New test files

**File structure:**
```
backend/apps/api/src/modules/checkout/
├── __tests__/
│   ├── mock-pay.controller.test.ts        (NEW)
│   ├── checkout.service.mockPay.test.ts   (NEW)
│   └── mock-pay.contract.test.ts          (NEW)
└── presentation/controllers/
    ├── qr.controller.ts                   (MODIFIED — add @Post(':id/qr/pay'))
```

#### 4.1.1 `mock-pay.controller.test.ts` (NEW)

**Purpose:** Unit test the HTTP handler for `POST /sessions/:id/qr/pay`.

**What to test:**
- Successful case: `status === "COMPLETED"`, response includes `pointsAwarded`, `newBalance`, `mock: true`.
- Authorization: `@Roles('USER')` guard — a `STORE_ADMIN` JWT returns 403.
- Ownership: `ResourceOwnershipGuard` — a `USER` JWT on another user's session returns 403.
- Feature gate off: when `MOCK_PAY_ENABLED !== true`, endpoint returns 404.
- Invalid session ID (UUID validation): malformed UUID returns 400 (caught by `ParseUUIDPipe`).
- Session not found: valid UUID, no such session → 404.
- Invalid state: session is `ACTIVE` or `COMPLETED` → `InvalidTransitionError` → 409/422.

**Test structure (example):**
```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { QrController } from '../qr.controller';
import { CheckoutService } from '../../application/services/checkout.service';
import { ForbiddenException, NotFoundException } from '@nestjs/common';

describe('QrController — mockPay', () => {
  let controller: QrController;
  let checkoutService: CheckoutService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [QrController],
      providers: [
        {
          provide: CheckoutService,
          useValue: { mockPay: jest.fn() },
        },
      ],
    }).compile();
    controller = module.get<QrController>(QrController);
    checkoutService = module.get<CheckoutService>(CheckoutService);
  });

  it('returns 200 with { status: COMPLETED, pointsAwarded, newBalance, mock: true }', async () => {
    const sessionId = 'uuid-here';
    const userId = 'user-uuid';
    jest.spyOn(checkoutService, 'mockPay').mockResolvedValue({
      sessionId,
      status: 'COMPLETED',
      pointsAwarded: 100,
      newBalance: 500,
      mock: true,
    });
    const result = await controller.mockPay(sessionId, { sub: userId });
    expect(result.status).toBe('COMPLETED');
    expect(result.mock).toBe(true);
  });

  it('throws ForbiddenException when session owner does not match JWT sub', async () => {
    jest.spyOn(checkoutService, 'mockPay').mockRejectedValue(new ForbiddenException());
    expect(
      controller.mockPay('session-id', { sub: 'different-user-id' })
    ).rejects.toThrow(ForbiddenException);
  });

  it('throws NotFoundException when MOCK_PAY_ENABLED is false', async () => {
    jest.spyOn(checkoutService, 'mockPay').mockRejectedValue(new NotFoundException());
    expect(
      controller.mockPay('session-id', { sub: 'user-id' })
    ).rejects.toThrow(NotFoundException);
  });
});
```

#### 4.1.2 `checkout.service.mockPay.test.ts` (NEW)

**Purpose:** Unit test the business logic in `CheckoutService.mockPay()` — state machine guards, points calculation, atomicity.

**What to test:**
- Feature gate: service constructor checks `MOCK_PAY_ENABLED` from config; if false, mockPay throws `NotFoundException`.
- Ownership: `loadOwned(sessionId, userId)` returns 403 if owner mismatch.
- Points calculation: calls `pointsService.calculatePoints(session)` — sponsored items skipped, returns integer points.
- State machine idempotency: session is `PENDING_CHECKOUT` before call. After success, status is `COMPLETED`. A second call on the same session throws `InvalidTransitionError` (no double-credit).
- Transaction isolation: inside a `$transaction` callback, all writes (session status, points credit, ledger) happen together. A forced DB error inside the callback leaves the session `PENDING_CHECKOUT` unchanged (rollback).
- Side effects (post-commit): after transaction resolves, `eventPublisher.publish()` and `sessionNotifier.emit()` are called exactly once each. A failure in either does **not** re-throw (best-effort, README §2.8 W1.5).

**Test structure (example):**
```typescript
describe('CheckoutService.mockPay', () => {
  let service: CheckoutService;
  let sessionRepo: ISessionRepository;
  let pointsService: PointsService;
  let eventPublisher: IEventPublisher;

  beforeEach(async () => {
    // Mocks configured with MOCK_PAY_ENABLED = true
  });

  it('transitions session PENDING_CHECKOUT → COMPLETED and credits points atomically', async () => {
    const session = createMockSession({ status: 'PENDING_CHECKOUT', items: [...] });
    jest.spyOn(sessionRepo, 'findById').mockResolvedValue(session);
    jest.spyOn(pointsService, 'calculatePoints').mockReturnValue(100);

    const result = await service.mockPay(session.id, session.userId);

    expect(result.status).toBe('COMPLETED');
    expect(result.pointsAwarded).toBe(100);
    expect(sessionRepo.save).toHaveBeenCalledWith(expect.objectContaining({ status: 'COMPLETED' }), expect.any(Object));
  });

  it('rejects second pay on COMPLETED session (no double-credit)', async () => {
    const session = createMockSession({ status: 'COMPLETED' });
    jest.spyOn(sessionRepo, 'findById').mockResolvedValue(session);

    await expect(service.mockPay(session.id, session.userId)).rejects.toThrow(InvalidTransitionError);
  });

  it('rolls back all writes on DB error inside $transaction', async () => {
    const session = createMockSession({ status: 'PENDING_CHECKOUT' });
    jest.spyOn(sessionRepo, 'findById').mockResolvedValue(session);
    jest.spyOn(sessionRepo, 'save').mockRejectedValue(new Error('DB error'));

    await expect(service.mockPay(session.id, session.userId)).rejects.toThrow('DB error');
    // Session is never persisted; status stays PENDING_CHECKOUT in memory (no real DB call happened).
  });

  it('publishes event and emits notification after commit', async () => {
    const session = createMockSession({ status: 'PENDING_CHECKOUT' });
    // ... setup
    await service.mockPay(session.id, session.userId);

    expect(eventPublisher.publish).toHaveBeenCalled();
    expect(sessionNotifier.emit).toHaveBeenCalledWith('sessionStatusChanged', expect.objectContaining({ status: 'COMPLETED' }));
  });

  it('does not re-throw if event publish fails', async () => {
    const session = createMockSession({ status: 'PENDING_CHECKOUT' });
    jest.spyOn(eventPublisher, 'publish').mockRejectedValue(new Error('Queue full'));

    // mockPay should still resolve (best-effort side effect)
    const result = await service.mockPay(session.id, session.userId);
    expect(result.status).toBe('COMPLETED');
  });
});
```

#### 4.1.3 `mock-pay.contract.test.ts` (NEW)

**Purpose:** Validate that the request/response schemas are JSON-serializable and match the shared-types contract.

**What to test:**
- `MockPayResponse` object serializes to valid JSON (no circular refs, no `undefined` values).
- Response validates against `MockPayResponseSchema` from `@smartcart/shared-types`.
- All required fields are present: `sessionId`, `status`, `pointsAwarded`, `newBalance`, `mock`.
- `status` is one of the `SessionStatus` enum values.
- `pointsAwarded` and `newBalance` are non-negative integers.
- `mock` is strictly `true`.

**Test structure (example):**
```typescript
import { MockPayResponseSchema } from '@smartcart/shared-types';

describe('MockPayResponse Contract', () => {
  it('validates against MockPayResponseSchema', () => {
    const response = {
      sessionId: '550e8400-e29b-41d4-a716-446655440000',
      status: 'COMPLETED',
      pointsAwarded: 150,
      newBalance: 700,
      mock: true,
    };
    expect(() => MockPayResponseSchema.parse(response)).not.toThrow();
  });

  it('serializes to JSON', () => {
    const response = { /* ... */ };
    const json = JSON.stringify(response);
    const parsed = JSON.parse(json);
    expect(() => MockPayResponseSchema.parse(parsed)).not.toThrow();
  });

  it('rejects if mock !== true', () => {
    const response = { /* ... */, mock: false };
    expect(() => MockPayResponseSchema.parse(response)).toThrow();
  });

  it('rejects if required field is missing', () => {
    const response = { sessionId, status, pointsAwarded, newBalance };
    expect(() => MockPayResponseSchema.parse(response)).toThrow();
  });
});
```

#### 4.1.4 Backend `.github/workflows/ci.yml` — No workflow changes

**Why:** The existing backend CI pipeline already covers all required stages. No new test runners, no new secrets, no new frameworks.

The three new test files (`mock-pay.*.test.ts`) are auto-discovered by Jest using the glob patterns in `jest.config.ts` (e.g., `**/__tests__/**/*.test.ts`). When `pnpm test:unit` and `pnpm test:integration` run, these files are included automatically.

**Verification:**
- `pnpm test:unit` discovers and runs all `__tests__/**/*.test.ts` files.
- `pnpm test:integration` discovers files in the integration test glob and runs against live Postgres + Redis.
- Coverage report includes the new files; statements and branch coverage thresholds are re-evaluated.

If the new test count is large, consider adding a separate `pnpm test:checkout` script in `backend/package.json` that runs only checkout-related tests, but this is optional.

---

### 4.2 Frontend: New test file

**File structure:**
```
frontend/src/
├── components/atoms/Button.tsx        (UNCHANGED — already supports disabled, onPress)
├── screens/checkout.tsx               (MODIFIED — add mock pay button + processing state)
├── __tests__/
│   └── checkout.mockPay.test.tsx      (NEW — integration test)
└── store/sessionStore.ts              (UNCHANGED — reuse existing confirmValidation)
```

#### 4.2.1 `checkout.mockPay.test.tsx` (NEW)

**Purpose:** Integration test for the mock pay button on the checkout screen.

**What to test:**
- Button renders below the QR when `qrToken` exists and `status === "PENDING_CHECKOUT"`.
- Button has `accessibilityLabel="Simular pago en caja"` and `accessibilityRole="button"`.
- Button is disabled before QR is generated (`!qrToken`).
- Button is disabled while `processing`.
- Pressing the button (1) sets `processing`, (2) calls `store.confirmValidation()`, (3) waits for success, (4) navigates to `/confirmation`.
- No double call: if the button is pressed while `processing`, a second dispatch is prevented (handled by `disabled` state).
- Store integration: after `confirmValidation()`, `useSessionStore.select(s => s.creditedPoints)` increases by `pendingPoints()`.
- Existing checkout screen tests still pass (QR generation, session list, etc.).

**Test structure (example):**
```typescript
import { render, fireEvent, screen, waitFor } from '@testing-library/react-native';
import { CheckoutScreen } from '../checkout';
import * as Router from 'expo-router';

jest.mock('expo-router', () => ({
  useRouter: () => ({ replace: jest.fn() }),
}));

describe('CheckoutScreen — Mock Pay Button', () => {
  it('renders button when qrToken exists and status === PENDING_CHECKOUT', () => {
    const { getByLabelText } = render(
      <CheckoutScreen initialSession={{ qrToken: 'abc...', status: 'PENDING_CHECKOUT', items: [...] }} />
    );
    expect(getByLabelText('Simular pago en caja')).toBeOnTheScreen();
  });

  it('hides button when qrToken is null', () => {
    const { queryByLabelText } = render(
      <CheckoutScreen initialSession={{ qrToken: null, status: 'ACTIVE' }} />
    );
    expect(queryByLabelText('Simular pago en caja')).not.toBeOnTheScreen();
  });

  it('disables button while processing', () => {
    const { getByLabelText } = render(<CheckoutScreen initialSession={...} />);
    const button = getByLabelText('Simular pago en caja');
    fireEvent.press(button);
    expect(button).toHaveAccessibilityState({ disabled: true });
  });

  it('calls store.confirmValidation() and navigates to /confirmation', async () => {
    const store = useSessionStore.getState();
    jest.spyOn(store, 'confirmValidation');
    const router = Router.useRouter();
    jest.spyOn(router, 'replace');

    const { getByLabelText } = render(<CheckoutScreen initialSession={...} />);
    fireEvent.press(getByLabelText('Simular pago en caja'));

    await waitFor(() => {
      expect(store.confirmValidation).toHaveBeenCalled();
      expect(router.replace).toHaveBeenCalledWith('/confirmation');
    });
  });
});
```

#### 4.2.2 Frontend `.github/workflows/ci.yml` — No workflow changes

**Why:** Same as backend. The existing frontend CI pipeline covers all stages. The new test file is auto-discovered by Jest.

---

### 4.3 Shared types: New DTO

**File to modify:**
```
packages/shared-types/src/
├── validation/
│   └── session.schemas.ts          (ADD MockPayResponseSchema)
└── dto/
    └── session.dto.ts              (ADD MockPayResponse type)
```

**What to add:**
```typescript
// packages/shared-types/src/validation/session.schemas.ts
export const MockPayResponseSchema = z.object({
  sessionId: z.string().uuid(),
  status: SessionStatusSchema,  // 'COMPLETED'
  pointsAwarded: z.number().int().nonnegative(),
  newBalance: z.number().int(),
  mock: z.literal(true),
});

// packages/shared-types/src/dto/session.dto.ts
export type MockPayResponse = z.infer<typeof MockPayResponseSchema>;
```

This shared type is imported by:
- Backend: `backend/apps/api/src/modules/checkout/presentation/controllers/qr.controller.ts` (response DTO)
- Backend tests: contract tests validate against the schema
- Frontend: (not directly consumed, but available if the frontend ever switches from mock to real API)

---

## 5. Secrets & environments

### 5.1 Backend secrets

No **new** secrets required. The feature gate is configured via the existing `MOCK_PAY_ENABLED` environment variable.

| Variable | Usage | Scope | Notes |
|----------|-------|-------|-------|
| `MOCK_PAY_ENABLED` | Gated entry point in `CheckoutService.mockPay()` | All environments | Set to `false` (default) in production. Set to `true` in dev/staging/test. Validated via Zod env schema at boot — app fails fast if unset or malformed. |

**Configuration in `backend/apps/api/src/config/env.validation.ts`:**
```typescript
MOCK_PAY_ENABLED: z.coerce.boolean().default(false),
```

**Environment files:**
- `.env` (dev local): `MOCK_PAY_ENABLED=true`
- `.env.test` (CI): `MOCK_PAY_ENABLED=true`
- Production Railway env vars: `MOCK_PAY_ENABLED=false` (or omitted, defaults to false)

### 5.2 Frontend secrets

No new secrets. Existing `EXPO_TOKEN` is used for EAS Build/Submit.

### 5.3 Target environments

| Environment | Backend MOCK_PAY_ENABLED | Frontend Deploy Profile | Notes |
|---|---|---|---|
| **Local Dev** | `true` | `development` | Full feature enabled; mock pay button works; backend endpoint returns valid responses. |
| **Staging** | `true` | `preview` | Feature available for QA testing; EAS Update channel = `staging`. |
| **Production** | `false` | `production` | Feature gate disabled; endpoint returns 404. Real POS path (`POST /sessions/:id/validate`) is the only revenue path. |

---

## 6. Acceptance criteria

### 6.1 Backend acceptance criteria

- [ ] **Endpoint exists:** `POST /api/v1/sessions/:id/qr/pay` with correct HTTP method, path, and UUID validation.
- [ ] **Authorization:** `@Roles('USER')` and `ResourceOwnershipGuard` applied; a `USER` JWT on another user's session returns 403.
- [ ] **Feature gate:** when `MOCK_PAY_ENABLED !== true`, endpoint returns 404.
- [ ] **Business logic:**
  - [ ] Session transitions from `PENDING_CHECKOUT` to `COMPLETED`.
  - [ ] Points are calculated using `PointsService.calculatePoints()` (sponsored items skipped).
  - [ ] All writes (session status, points credit, ledger) occur in a single `$transaction`; a forced DB error inside the callback leaves the session unchanged (rollback verified by integration test).
  - [ ] No double-credit: a second `POST` to the same session returns 409/422 (state machine guard); balance unchanged.
- [ ] **Response DTO:**
  - [ ] Response is `{ sessionId, status: 'COMPLETED', pointsAwarded, newBalance, mock: true }`.
  - [ ] Validates against `MockPayResponseSchema` from `@smartcart/shared-types`.
- [ ] **Side effects (best-effort):**
  - [ ] After commit, `CheckoutCompletedEvent` is enqueued to the analytics queue (profile update job).
  - [ ] `SessionGateway` emits `sessionStatusChanged` event to subscribed clients.
  - [ ] Failures in either do not re-throw (transaction is already committed).
- [ ] **Observability:**
  - [ ] Audit log emitted with `action: 'mockPay'`, `userId`, `sessionId`, `pointsAwarded` (no PII).
  - [ ] Prometheus `checkout_completions_total` counter incremented (optionally labeled `source="mock"`).
- [ ] **Security:**
  - [ ] No unauthenticated access (JWT required).
  - [ ] No cross-user access (ownership verified).
  - [ ] No production exposure (disabled by default, feature-gated).
  - [ ] Config validated at boot; app fails fast if `MOCK_PAY_ENABLED` is malformed.

### 6.2 Frontend acceptance criteria

- [ ] **Button renders:** On the checkout/QR validation screen, a primary "Simular pago en caja" button appears below the QR + waiting status.
- [ ] **Button state:**
  - [ ] Enabled only when `qrToken != null` and `status === "PENDING_CHECKOUT"`.
  - [ ] Disabled while `processing`.
  - [ ] Disabled before QR is generated.
- [ ] **Button interaction:**
  - [ ] Pressing it calls `store.confirmValidation()` exactly once (no double dispatch).
  - [ ] Button shows a spinner and label changes to "Validando…" while processing.
  - [ ] After success, `router.replace("/confirmation")` navigates to the confirmation screen.
- [ ] **State management:**
  - [ ] `creditedPoints` in store increases by `pendingPoints()` after `confirmValidation()`.
  - [ ] Store state is consistent with backend expectations (no optimistic update that could desync).
- [ ] **Accessibility:**
  - [ ] `accessibilityRole="button"`, `accessibilityLabel="Simular pago en caja"`.
  - [ ] No a11y violations (ESLint + RTL assertions).
- [ ] **Test coverage:**
  - [ ] New test file `checkout.mockPay.test.tsx` exists and all tests pass.
  - [ ] Coverage thresholds met (≥ 80% statements, ≥ 75% branches on new/modified files).
- [ ] **Existing tests:** All existing checkout/scan/session tests still pass (no regressions).

### 6.3 CI/CD acceptance criteria

- [ ] **Backend pipeline:**
  - [ ] `pnpm lint` → 0 warnings, module boundaries enforced.
  - [ ] `pnpm type-check` → no type errors on new/modified files.
  - [ ] `pnpm test:unit` → includes 3 new test files, all pass, coverage ≥ 80% statements/75% branches.
  - [ ] `pnpm test:integration` → state machine + transaction tests pass against live Postgres + Redis.
  - [ ] `pnpm build` → TypeScript compiles, no errors.
  - [ ] `pnpm openapi:validate` → OpenAPI spec is valid, includes `MockPayResponse` schema and endpoint documentation.
  - [ ] `pnpm audit` → 0 critical, 0 high CVEs.
- [ ] **Frontend pipeline:**
  - [ ] `npm run lint` → 0 warnings.
  - [ ] `npm run format:check` → all files formatted.
  - [ ] `npm run typecheck` → no type errors.
  - [ ] `npm test -- --coverage` → includes new test file, coverage ≥ 80% statements/75% branches.
  - [ ] `npm audit` → 0 critical, 0 high CVEs.
- [ ] **E2E:**
  - [ ] Maestro E2E flows pass (if configured for checkout flow).
  - [ ] `eas build` succeeds for all platforms (iOS + Android).
- [ ] **Deploy:**
  - [ ] `eas update --branch staging` succeeds; feature available on staging.
  - [ ] Manual QA approves before `eas submit` to production stores.

---

## 7. Monitoring & rollback

### 7.1 Post-deploy monitoring (Observability, §2.6)

| Signal | Target | Tool | Action if violated |
|--------|--------|------|-------------------|
| **Mock pay endpoint latency (P95)** | < 500 ms | Prometheus + Grafana | Investigate transaction slowness or database lock contention. |
| **Points credit success rate** | 100% | Sentry + audit logs | Revert the deploy; investigate transaction failures. |
| **Checkout completed events (analytics queue)** | 100% enqueued post-commit | BullMQ + Prometheus | Verify queue health; manually replay failed jobs if needed. |
| **Audit log completeness** | All mockPay actions logged | Grafana Loki | Verify Pino sink health. |
| **Frontend button render errors** | 0 unhandled JS exceptions | Sentry | Revert if e.g. store.confirmValidation() is undefined (missing import). |

### 7.2 Rollback procedure

**If backend regression post-deploy (production):**

1. **Immediate:** Disable the feature by setting `MOCK_PAY_ENABLED=false` in the production environment. The endpoint immediately 404s; no data loss.
2. **Investigation:** Review Sentry error logs, audit logs, database transaction logs.
3. **Fix & redeploy:** Merge a fix to `main`, re-run CI, and trigger the deploy workflow.
4. **RTO:** ~5 min (env var change + pod restart).

**If frontend regression post-deploy (staging or production OTA):**

1. **Immediate:** Revert the EAS Update by unpublishing the build on the Expo staging channel.
2. **Client behavior:** Users with the app open will auto-downgrade to the previous update on app restart.
3. **Investigation:** Review Sentry JS exception logs.
4. **Fix & redeploy:** Merge a fix, trigger `eas update --branch staging`, and re-test.
5. **RTO:** ~2 min (unpublish + client restart).

**Data impact:** Zero — this feature uses existing tables and does not introduce data migrations. No database rollback needed.

---

## 8. References

- **Backend spec:** `platform/specs/backend/add-a-mock-pay-button-on-qr-confirmation-screen-4479e3.md`
- **Frontend spec:** `platform/specs/frontend/add-a-mock-pay-button-on-qr-confirmation-screen-4479e3.md`
- **Backend CI workflow:** [`.github/workflows/ci.yml`](.github/workflows/ci.yml) → `backend/.github/workflows/ci.yml`
- **Frontend CI workflow:** [`.github/workflows/ci.yml`](.github/workflows/ci.yml)
- **README design binding:** README.md §2.9 Infrastructure & DevOps (CI/CD Pipeline), §2.5 Security, §2.6 Observability
- **Shared types location:** `packages/shared-types/src/validation/session.schemas.ts`, `packages/shared-types/src/dto/session.dto.ts`
- **NestJS testing guide:** https://docs.nestjs.com/fundamentals/testing
- **Jest + React Testing Library:** https://testing-library.com/docs/react-native-testing-library/intro
- **Expo EAS Build:** https://docs.expo.dev/build/introduction/
- **Maestro E2E:** https://maestro.mobile.dev
