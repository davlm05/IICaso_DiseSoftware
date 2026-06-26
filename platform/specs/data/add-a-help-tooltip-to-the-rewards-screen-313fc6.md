<!-- feature-id: add-a-help-tooltip-to-the-rewards-screen-313fc6 | domain: data | generated offline -->
# Data Specification — Add a help tooltip to the rewards screen

- **Feature ID:** `add-a-help-tooltip-to-the-rewards-screen-313fc6`
- **Domain:** Data model (Prisma + PostgreSQL)
- **Date:** 2026-06-26
- **Binding:** README.md §2.4 (data model), §2.3, §2.5 (PII)

## 1. Summary
Add a help tooltip to the rewards screen — a small, static, client-side UI affordance that
explains how to read and redeem rewards (e.g. what the points `cost` means, how redemption
works). This is a **presentation-only** change in the React Native app.

**Data-model impact: NONE.** A help tooltip renders fixed, hard-coded copy in the mobile
client. It creates, reads, updates, or deletes **no** persistent records, requires no new
columns, and issues no new queries against PostgreSQL. The tooltip copy is bundled in the
frontend, not stored in the database. Per the data-agent guardrails (smallest change that
satisfies the task; additive-only; preserve existing models), the canonical Prisma schema at
`backend/apps/api/prisma/schema.prisma` is **left unchanged**.

The existing Rewards data model already fully supports the screen the tooltip annotates:

- `Reward` (`id`, `name`, `description`, `cost`, `imageUrl?`, `active`) — the catalog of
  redeemable rewards listed on the screen (README §2.4).
- `Redemption` (`id`, `userId`, `rewardId`, `couponCode` unique, `status`, `redeemedAt`) —
  the issued coupon produced by `POST /rewards/:id/redeem`.

No field referenced by the tooltip's explanatory text (points balance, reward `cost`,
redemption `status`) is new — each is already derivable from the current schema
(balance = `SUM(PointsTransaction.delta)`, README §2.4 integrity rules).

## 2. Models (new / changed)
None. No models are added or modified.

| Model | Field | Type | Constraints / Index | Notes |
|---|---|---|---|---|
| _(none)_ | — | — | — | Tooltip is static client-side UI; no persistence required. |

## 3. Relations
None. No foreign keys, cardinality, or cascade behavior change. Existing relations
(`User ||--o{ Redemption`, `Reward ||--o{ Redemption`) are untouched.

## 4. Enums
None. No enum values are added or changed (`RedemptionStatus`, `PointsReason`, etc. unchanged).

## 5. Migration plan
**No migration.** Because the schema is unchanged, there is nothing to generate and
`pnpm prisma:migrate` is **not** run for this feature. No additive or breaking change, no
backfill. The change is fully backward-compatible by construction (zero data surface).

If, in a future iteration, tooltip copy must become server-managed/localizable, that would be a
**separate, additive** spec introducing a content/help model — explicitly out of scope here.

## 6. PII & retention (§2.5)
No PII is introduced, read, or stored. The tooltip displays only static, non-personal
explanatory copy rendered in the client; it does not log, transmit, persist, or expose any
user data. Existing PII protections are unaffected: `User.email`/`fullName`/`phone`/`pushToken`
remain encrypted at rest and redacted in logs (README §2.5 PII Handling), and the B2B
anonymization / k-anonymity guarantees on `ConsumerSegment` are not touched. No new retention
window applies because no new data is created.

## 7. Acceptance criteria
- [ ] `backend/apps/api/prisma/schema.prisma` is unchanged by this feature (zero diff).
- [ ] No Prisma migration is created or applied; `pnpm prisma:migrate` is not required.
- [ ] No new model, field, index, relation, or enum value is introduced.
- [ ] The existing `Reward` and `Redemption` models already satisfy the rewards screen's data
      needs; the tooltip reads no additional data.
- [ ] No new PII is stored or logged; existing §2.5 encryption/redaction guarantees remain intact.
- [ ] Implementation of the tooltip is confined to the frontend (per the frontend spec); the
      data layer is explicitly a no-op.
