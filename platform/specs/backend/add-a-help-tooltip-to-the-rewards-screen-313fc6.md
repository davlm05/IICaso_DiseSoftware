<!-- feature-id: add-a-help-tooltip-to-the-rewards-screen-313fc6 | domain: backend | generated offline -->
# Backend Specification — Add a help tooltip to the rewards screen

- **Feature ID:** `add-a-help-tooltip-to-the-rewards-screen-313fc6`
- **Domain:** Backend (NestJS API)
- **Date:** 2026-06-26
- **Binding:** README.md §2 Backend Design

## 1. Summary
Add a help tooltip to the rewards screen. The tooltip itself is a mobile UI element, but its
copy must not be hard-coded in the React Native bundle (so it can be reworded without an app
store release). The backend therefore exposes a **single read-only endpoint** that serves the
static help content the tooltip renders: a short title, a body paragraph explaining how loyalty
points and reward redemption work, and an optional learn-more link.

This is a deliberately minimal, additive change. No new domain model, no writes, no PII, no new
tables, no queue work — it extends the existing **Rewards** module with one cacheable GET.

## 2. Module & layering
Target module: **`apps/api/src/modules/rewards/`** (reuse the existing module; do not create a
new one). Follows the four-layer structure (README §2.2). The content is a static, in-process
constant — there is no infrastructure/repository layer for this endpoint.

| Layer | File | Responsibility |
|---|---|---|
| Presentation | `rewards/presentation/controllers/rewards.controller.ts` (existing) | Add `@Get('help')` handler **declared before `@Get(':id')`** so `help` is not captured as a reward UUID param. Delegates to the service. |
| Application | `rewards/application/services/rewards.service.ts` (existing) | Add `getHelpContent(): RewardsHelpContent` — returns the static content object. Pure, stateless, no DB call. |
| Domain | `rewards/domain/rewards-help.content.ts` (new) | Holds the frozen `REWARDS_HELP_CONTENT` constant (title/body/link). Plain TypeScript, no framework imports. |
| Shared contract | `packages/shared-types/src/rewards/` | `RewardsHelpContent` interface + `RewardsHelpContentSchema` Zod schema, imported 1:1 by the mobile app (README §2.1, §2.4). |

No change to `rewards.module.ts` providers is required (no new injectable dependency).

## 3. Endpoints
| Method | Path (`/api/v1/...`) | Auth / Roles | Description |
|---|---|---|---|
| GET | `/rewards/help` | JWT (Bearer), `@Roles('USER')` | Returns the static help/tooltip content for the rewards screen. Cache-friendly (see §5). |

Mirrors the existing rewards endpoints which sit under `@Controller({ path: 'rewards', version: '1' })`
guarded by `JwtAuthGuard`. Route ordering: `GET /rewards/help` **must** be registered above
`GET /rewards/:id` (which uses `ParseUUIDPipe`) to avoid the literal `help` being parsed as a UUID
(would otherwise 400). Same pattern as `products/search` vs `products/:barcode`.

## 4. DTOs & validation
No request body and no query/path parameters → no untrusted input to validate (OWASP A03 surface
is nil for this endpoint). The **response** DTO is shared via `@smartcart/shared-types`:

```ts
// packages/shared-types/src/rewards/rewards-help.dto.ts
export interface RewardsHelpContent {
  title: string;        // e.g. "How rewards work"
  body: string;         // 1–2 short paragraphs, plain text (no HTML)
  learnMoreUrl?: string;// optional absolute https URL
}

// packages/shared-types/src/rewards/rewards-help.schema.ts
export const RewardsHelpContentSchema = z.object({
  title: z.string().min(1).max(80),
  body: z.string().min(1).max(600),
  learnMoreUrl: z.string().url().startsWith('https://').optional(),
});
```

The schema is used as the contract test for the response (CI §2.9 API Contract stage) and as the
parse target on the mobile side; it guarantees the served copy stays within tooltip-renderable
bounds. Content is plain text only — never HTML/markup — so there is no injection surface for the
client to render.

## 5. Business logic & patterns (§2.3)
- **No state machine, no transaction, no BullMQ job** — this is a static read.
- **Source of truth:** a single frozen constant `REWARDS_HELP_CONTENT` (`Object.freeze`) in the
  domain layer; the service returns it directly. Editing the copy is a one-line domain change,
  no migration.
- **Caching (README §2.7 stateless / cache-aside is overkill here):** content is process-static,
  so set HTTP cache headers instead of Redis — `Cache-Control: public, max-age=3600`. TanStack
  Query on the client (README §2.4) caches it for the session. No Redis key is introduced.
- **Idempotent & side-effect free:** safe to call repeatedly; identical response every time.

## 6. Security (§2.5)
- **AuthN/AuthZ:** reuses the controller-level `JwtAuthGuard` + `RolesGuard` with `@Roles('USER')`
  — consistent with the rest of the rewards surface. No new role. A missing/invalid JWT → 401.
- **No ownership check needed:** the content is global, not user-scoped (no `ResourceOwnershipGuard`).
- **Rate limiting:** covered by the existing global Redis limiter (100 req/min/user, README §2.5);
  no stricter override required.
- **Secrets/PII:** none read, none returned, none logged — the response is static marketing copy.
- **OWASP:** A01 satisfied via the existing guards; A03 nil (no input, plain-text output);
  A05 — no stack traces leak (handled by `GlobalExceptionFilter`).
- **Error semantics:** the only realistic failure is 401 (unauthenticated). Returns 200 with the
  content object otherwise. No 404/409/422 paths.

## 7. Observability hooks (§2.6)
- **Logging:** standard `nestjs-pino` structured request log with `correlationId`, `userId`, `role`
  — no extra audit entry (not a sensitive operation per §2.5 audit list). No PII to redact.
- **Tracing:** auto-instrumented HTTP span from the OpenTelemetry SDK (README §2.6); no manual span
  warranted for a static read.
- **Metrics:** no new business metric. The endpoint is covered by the default Prometheus HTTP
  request/duration metrics at `/metrics`; if desired, label under the existing `rewards` route group.

## 8. Acceptance criteria
- [ ] `GET /api/v1/rewards/help` returns `200` with `{ title, body, learnMoreUrl? }` matching `RewardsHelpContentSchema`.
- [ ] The handler is declared **before** `GET /rewards/:id`, so `help` is not parsed as a UUID (no 400).
- [ ] The endpoint requires a valid `USER` JWT; an unauthenticated request returns `401`.
- [ ] `RewardsHelpContent` interface + Zod schema live in `@smartcart/shared-types` and are imported by both API and mobile app (no contract drift).
- [ ] Response carries `Cache-Control: public, max-age=3600`; the response is identical on repeat calls (idempotent, side-effect free).
- [ ] No new Prisma model/migration, no BullMQ job, no Redis key, and no PII in the response or logs.
- [ ] `body` is plain text (no HTML), length-capped per schema; API contract test validates the response shape in CI.
