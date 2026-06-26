<!-- feature-id: add-a-mock-pay-button-on-qr-confirmation-screen-4479e3 | domain: data | generated offline -->
# Data Specification — Add a mock pay button on QR confirmation screen

- **Feature ID:** `add-a-mock-pay-button-on-qr-confirmation-screen-4479e3`
- **Domain:** Data model (Prisma + PostgreSQL)
- **Date:** 2026-06-26
- **Binding:** README.md §2.4 (data model), §2.3, §2.5 (PII)

## 1. Summary
Add a mock pay button on the QR confirmation screen. After a shopper finalizes a
session and a checkout QR token is generated (`POST /sessions/:id/qr`,
`ShoppingSession.status = PENDING_CHECKOUT`, README §2.8 Workflow 4 step 5), the
confirmation screen renders a **mock "Pay" button** that simulates the POS settling
the cart — i.e. it exercises the same logical outcome as a cashier calling
`POST /sessions/:id/validate` (README §2.8 Workflow 1) without any real payment
integration. The button is a *mock*: it lets a demo flow complete the happy path
(`PENDING_CHECKOUT → COMPLETED`, points credited) end-to-end from the mobile app.

**Data-model conclusion (smallest change):** **No Prisma schema change is required.**
The existing data model already represents every fact this feature produces:

- The session lifecycle state (`ShoppingSession.status` enum, §2.4 / §2.3 state machine)
  already captures `PENDING_CHECKOUT → COMPLETED`.
- The points awarded by a (mock) settlement are recorded in the existing **append-only**
  `PointsTransaction` ledger (`reason = PURCHASE`), and the balance stays *derived*
  (`SUM(delta)`) per §2.4 integrity rules — no new balance column.
- There is **no payment/charge entity** in the README §2.4 model, and this is a *mock*
  button with no real money movement, so introducing a `Payment` table would (a) exceed
  the bound data model, (b) add un-grounded PII/financial surface, and (c) violate the
  "smallest additive change" guardrail. The mock settlement reuses the existing
  validate-session transaction (session save + points credit + ledger insert).

This spec therefore records a deliberate **no-op for the persistence layer** and pins the
contract the application/frontend agents must honour so no schema drift is introduced.

## 2. Models (new / changed)
| Model | Field | Type | Constraints / Index | Notes |
|---|---|---|---|---|
| _(none)_ | — | — | — | No new or changed models. Feature reuses existing `ShoppingSession`, `SessionItem`, `PointsTransaction`. |

Reused (unchanged) models and the fields this feature relies on:

| Model | Field(s) relied on | Why |
|---|---|---|
| `ShoppingSession` | `id`, `userId`, `storeId`, `status`, `itemHash`, `updatedAt` | Mock pay drives `PENDING_CHECKOUT → COMPLETED`; `itemHash` already frozen at QR generation. Existing `@@index([userId, status])` covers active/pending lookups. |
| `SessionItem` | `barcode`, `quantity`, `pointsValue` | Source for the points total credited on (mock) settlement. |
| `PointsTransaction` | `userId`, `delta`, `reason` (`PURCHASE`), `sessionId`, `createdAt` | Append-only ledger row written inside the settlement `$transaction`; `@@index([userId, createdAt])` already supports the 90-day analytics window. |

## 3. Relations
_No new foreign keys, cardinality, or cascade changes._ The feature operates entirely
within existing relations:

- `User (1)──< ShoppingSession`, `ShoppingSession (1)──< SessionItem` (cascade on delete, unchanged).
- `User (1)──< PointsTransaction` and optional `ShoppingSession (1)──< PointsTransaction`
  (immutable, never cascade — §2.4 integrity rules, unchanged).

## 4. Enums
_No new enums and no new enum values._ The existing `SessionStatus`
(`ACTIVE, PENDING_CHECKOUT, COMPLETED, VALIDATION_FAILED, EXPIRED`) and `PointsReason`
(`PURCHASE, REDEMPTION, ADJUSTMENT`) fully cover the mock settlement outcome. The mock
pay path reuses `PointsReason.PURCHASE`; it does **not** introduce a `MOCK`/`SIMULATED`
reason, keeping the ledger semantics identical to a real POS validation.

## 5. Migration plan
- **Change class:** None — **no migration**. The schema at
  `backend/apps/api/prisma/schema.prisma` is unchanged, so there is nothing to generate.
- **Backfill:** Not applicable.
- **Command:** `pnpm prisma:migrate` is **not** run for this feature (it would produce an
  empty diff). If a future revision elevates the mock button to a real payment record,
  that becomes a separate, additive, backward-compatible migration (new table only) and
  must be re-specced.
- **Backward compatibility:** Fully compatible — existing rows, indexes, and constraints
  are untouched; no constraints are weakened (§ guardrails).

## 6. PII & retention (§2.5)
- **No new personal data is stored.** The feature persists only what the existing
  validate-session flow already does: a `ShoppingSession.status` transition and an
  immutable `PointsTransaction` ledger row (`userId`, signed `delta`, `reason`,
  `sessionId`, `createdAt`). None of these are new PII fields.
- **No payment instrument data** (card numbers, tokens, billing identifiers) is captured —
  the button is a mock with no real charge, so PCI-scoped data never enters the system.
- Existing protections continue to apply unchanged: `User.email`/`fullName`/`phone`/
  `pushToken` remain encrypted at rest and redacted in logs (§2.5 PII Handling); the
  points ledger remains append-only and tamper-evident (balance derived via `SUM(delta)`).
- **Retention:** Governed by the existing ledger/session retention; this feature adds no
  new retention window and no new anonymization requirement (the B2B 50-user k-anonymity
  guarantee is untouched because `ConsumerSegment` holds aggregated features only).

## 7. Acceptance criteria
- [ ] `schema.prisma` is **unchanged** — no new model, field, enum, index, or relation is added for this feature.
- [ ] No Prisma migration is generated; `pnpm prisma migrate status` reports no pending diff attributable to this feature.
- [ ] The mock pay action reuses the existing settlement contract: `ShoppingSession.status` moves `PENDING_CHECKOUT → COMPLETED` and exactly one `PointsTransaction` row (`reason = PURCHASE`, `sessionId` set) is appended.
- [ ] The points balance remains **derived** (`SUM(delta)`) — no balance column is introduced and no existing row is mutated or deleted (append-only invariant, §2.4 / §2.5 A04/A08).
- [ ] No new PII or payment-instrument columns are added; existing encryption/redaction guarantees remain in force (§2.5).
- [ ] No existing constraint, unique index, or cascade rule is weakened.
- [ ] Settlement remains idempotent/replay-safe via the existing state machine — a mock pay on an already-`COMPLETED` session does not write a second ledger row (§2.8 Workflow 1 business rules).
