# Skill: evolve the Prisma schema safely

Schema: `backend/apps/api/prisma/schema.prisma`. Generate client: `pnpm prisma:generate`. Create a
migration: `pnpm prisma:migrate` (runs `prisma migrate dev`).

## Conventions
- Models: singular PascalCase (`User`, `ShoppingSession`). Enums for fixed sets (status, role, reason).
- Add `@@index([...])` for columns used in lookups/analytics (e.g. `(userId, createdAt)`).
- Prefer additive, backward-compatible changes. For required new columns on existing tables, add a
  default or a backfill step.
- Ledger-style tables (e.g. `PointsTransaction`) are append-only — no updates/deletes.
- Mark PII explicitly; keep it minimal and justify retention.

## Checklist
- [ ] Existing models preserved; only required additions made
- [ ] Indexes for new query paths
- [ ] Backward-compatible or backfill noted
- [ ] `pnpm prisma:generate` run after editing
