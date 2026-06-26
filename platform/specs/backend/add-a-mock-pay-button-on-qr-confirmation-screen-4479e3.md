<!-- feature-id: add-a-mock-pay-button-on-qr-confirmation-screen-4479e3 | domain: backend -->
# Backend Specification — Add a mock pay button on QR confirmation screen

- **Feature ID:** `add-a-mock-pay-button-on-qr-confirmation-screen-4479e3`
- **Domain:** Backend (NestJS API)
- **Date:** 2026-06-26
- **Binding:** README.md §2 Backend Design

## 1. Summary
The QR confirmation screen currently ends the shopper's happy path at QR generation
(`POST /sessions/:id/qr`), after which a physical POS terminal calls
`POST /sessions/:id/validate` (POS API key) to complete the sale and credit points
(README §2.8 Workflow 1). For demo/dev environments there is no real POS, so the
frontend wants a **"Pay" button** on that screen that simulates the checkout
completion end-to-end.

This spec adds a single, owner-scoped, **mock payment** endpoint that drives a
`PENDING_CHECKOUT` session to `COMPLETED`, credits the points the cart already
froze, and appends the immutable ledger row — reusing the exact atomic transaction
boundary and state machine of the real validation flow. It is a **mock**: it skips
the POS API-key + QR-signature + item-hash checks (the shopper already owns the
session and proved possession via JWT) and is **disabled in production** behind a
config flag so it can never become a points-minting bypass of the real POS path
(README §2.5 A04 Insecure Design).

No new module, no Prisma schema change, no new queue — this is an additive endpoint
on the existing **Checkout** module that composes the orchestration already in
`CheckoutService.validateSession()`.

## 2. Module & layering
Target module: **`apps/api/src/modules/checkout/`** (existing). Strict four-layer
structure preserved (README §2.2):

| Layer | File | Change |
|---|---|---|
| Presentation | `presentation/controllers/qr.controller.ts` | Add `@Post(':id/qr/pay')` handler (mock pay) on the existing `@Controller('sessions')` JWT/USER/ownership guard stack. Thin: delegates to the service. |
| Application | `application/services/checkout.service.ts` | Add `mockPay(sessionId, userId): Promise<MockPayResult>`. Reuses `IUnitOfWork`, `IPointsRepository`, `ISessionRepository`, `PointsService`, `BusinessMetricsService`, `IEventPublisher`, `ISessionNotifier` already injected. |
| Application (config) | `config/env.validation.ts` | Add `MOCK_PAY_ENABLED: z.coerce.boolean().default(false)` (Zod-validated at boot, README §2.5 A02/A05). |
| Domain | `domain/entities/shopping-session.entity.ts` | **No change** — reuses existing `completeValidation()` (PENDING_CHECKOUT → COMPLETED) guard. |
| Shared types | `packages/shared-types/src/validation/session.schemas.ts` + `dto/session.dto.ts` | Add `MockPayResponseSchema` + inferred `MockPayResponse` DTO (README §2.4 contract sharing). |
| DI / wiring | `checkout.module.ts` | No new providers — the controller and service already live here. |

Layer rules honored: the controller delegates only (Rule 4); the service depends on
infrastructure **interfaces** only (Rule 2); the domain stays framework-free (Rule 1).

## 3. Endpoints
| Method | Path (`/api/v1/...`) | Auth / Roles | Description |
|---|---|---|---|
| POST | `/sessions/:id/qr/pay` | JWT (`USER`) + `ResourceOwnershipGuard` | **Mock checkout.** Completes a `PENDING_CHECKOUT` session the caller owns, credits the frozen points, appends the ledger row, and returns the new balance. Available only when `MOCK_PAY_ENABLED=true` (returns `404 NOT_FOUND` otherwise). |

Notes:
- Path nested under `qr` to read as "pay for the QR I just generated"; `:id` is a
  UUID validated by `ParseUUIDPipe` (path-traversal guard, README §2.5 A03).
- No request body — the session id + JWT `sub` fully determine the operation.
- This endpoint is **not** the POS endpoint and does **not** accept `X-API-Key`;
  `POST /sessions/:id/validate` remains the real, API-key-gated revenue path.

## 4. DTOs & validation
**Request:** none (empty body). The only input is the `:id` path param
(`ParseUUIDPipe`) and the authenticated `user.sub`.

**Response — `MockPayResponse`** (mirrors `ValidateSessionResult`, defined in
`@smartcart/shared-types` so the RN client and API share one contract):

```ts
export const MockPayResponseSchema = z.object({
  sessionId: z.string().uuid(),
  status: SessionStatusSchema,        // 'COMPLETED' on success
  pointsAwarded: z.number().int().nonnegative(),
  newBalance: z.number().int(),
  mock: z.literal(true),              // explicit marker: this was a simulated payment
});
export type MockPayResponse = z.infer<typeof MockPayResponseSchema>;
```

Validation/OWASP (README §2.5 A03): UUID-validated path param, no free-form input to
inject, strict typed response. No new regex (no ReDoS surface).

## 5. Business logic & patterns (§2.3)
`CheckoutService.mockPay(sessionId, userId)`:

1. **Feature gate.** If `config.MOCK_PAY_ENABLED !== true`, throw `NotFoundException`
   (endpoint is invisible in production — README §2.5 A05 Security Misconfiguration).
2. **Load + ownership.** `loadOwned(sessionId, userId)` (existing helper) →
   `404 SESSION_NOT_FOUND` if missing, `403` if `session.userId !== userId`
   (README §2.5 A01, README §2.8 W4 ownership rule).
3. **Points.** `pointsAwarded = pointsService.calculatePoints(session)` — same
   Strategy-pattern path as real validation; sponsored items skipped (README §2.3).
4. **State machine + ACID transaction (replay-safe).** Inside
   `uow.runInTransaction(async (tx) => { ... })` (README §2.2 ACID, §2.8 W1.4):
   - `session.completeValidation()` — `PENDING_CHECKOUT → COMPLETED`. The domain
     guard throws `InvalidTransitionError` for `ACTIVE`/`COMPLETED`/`EXPIRED`/
     `VALIDATION_FAILED`, so a **double-tap of the pay button never double-credits**
     (idempotency by state, README §2.3 State Machine, A04).
   - `sessions.save(session, tx)`.
   - `points.creditPoints({ userId, delta: pointsAwarded, reason: 'PURCHASE', sessionId }, tx)`
     — append-only ledger insert; balance stays derived (`SUM(delta)`), never
     mutated (README §2.4 integrity, A04/A08).
   - **No external I/O inside the callback** (README §2.2).
5. **Post-commit side effects (best-effort, never roll back).** After commit, reuse
   `publishSideEffects(session, pointsAwarded)`: record metrics, notify the
   `SessionGateway` room (`sessionStatusChanged`), and publish
   `CheckoutCompletedEvent` to the `analytics-profile-update` queue (README §2.8 W1.5,
   Workflow 2). The mock pay therefore also exercises the analytics pipeline.
6. **Return** `{ sessionId, status: 'COMPLETED', pointsAwarded, newBalance, mock: true }`.

Design rationale: the mock path **does not** verify a QR token or item hash because
its purpose is to simulate the POS without a terminal; replay-safety and atomicity
are preserved purely by the state machine + single `$transaction`, identical to the
real flow. The transaction guarantees all-or-nothing — a partial credit is impossible.

## 6. Security (§2.5)
- **AuthN/AuthZ (A01):** class-level `JwtAuthGuard, RolesGuard` + `@Roles('USER')`,
  plus method-level `ResourceOwnershipGuard` (compares JWT `sub` to the session
  owner). A `USER` token on another user's session → `403`.
- **Insecure-design guard (A04):** disabled in production via `MOCK_PAY_ENABLED`
  (default `false`); when off the route 404s, so it can never substitute for the
  API-key-scoped POS validation in a real deployment.
- **Secrets/config (A02/A05):** flag validated by the Zod env schema at boot; app
  fails fast on malformed config. No secrets introduced.
- **Rate limiting:** inherits the global Redis limiter (100 req/min per user,
  README §2.5). No stricter limit needed — the state machine already caps effect to
  one credit per session.
- **PII:** none logged; audit log carries only `userId`, `sessionId`, `pointsAwarded`
  (README §2.5 redact config, A09).
- **Error semantics:** `404` (gate off / session missing), `403` (not owner),
  `409`/`422`-class via `InvalidTransitionError` mapped by the global exception
  filter when the session is not `PENDING_CHECKOUT`, `500` on DB failure → full
  rollback (README §2.8 W1 error matrix).

## 7. Observability hooks (§2.6)
- **Structured log / audit (A09):** emit `{ event: 'AUDIT', action: 'mockPay', userId, sessionId, pointsAwarded, correlationId }`
  via the existing Pino logger / `AuditInterceptor`; `mockPay` added to the
  sensitive-operations set.
- **Metrics (Prometheus):** reuse `BusinessMetricsService.recordCheckout(pointsAwarded)`
  (checkout-completions counter + points histogram); optionally label the increment
  `source="mock"` to distinguish demo traffic.
- **Tracing:** automatic HTTP + Prisma + BullMQ spans via the OTel SDK; the
  `mockPay` transaction is covered by the same manual checkout span as
  `validateSession`. Correlation-id propagated from the request header.

## 8. Acceptance criteria
- [ ] `POST /api/v1/sessions/:id/qr/pay` exists on `QrController`, guarded by
      `JwtAuthGuard`, `RolesGuard('USER')`, and `ResourceOwnershipGuard`.
- [ ] When `MOCK_PAY_ENABLED=true`, paying a `PENDING_CHECKOUT` session the caller
      owns returns `200` with `{ status: 'COMPLETED', pointsAwarded, newBalance, mock: true }`.
- [ ] When `MOCK_PAY_ENABLED` is unset/`false`, the endpoint returns `404`.
- [ ] Completion, points credit, and the append-only ledger insert occur in a single
      `$transaction` — a forced DB error inside the callback leaves the session
      `PENDING_CHECKOUT` and the balance unchanged.
- [ ] A second pay request on an already-`COMPLETED` session is rejected by the state
      machine (no double credit); balance is unchanged.
- [ ] A `USER` JWT paying another user's session returns `403`; an unknown id `404`.
- [ ] Points are computed by `PointsService.calculatePoints()` (sponsored items
      skipped); the credited `delta` equals `pointsAwarded`.
- [ ] After commit, a `CheckoutCompletedEvent` is enqueued and `sessionStatusChanged`
      is emitted; a failure in either does not fail the (committed) payment.
- [ ] `MockPayResponseSchema` is exported from `@smartcart/shared-types` and the
      response validates against it.
- [ ] An `AUDIT` log line with `action: 'mockPay'` (no PII) and the checkout metric
      are emitted on success.
</content>
</invoke>
