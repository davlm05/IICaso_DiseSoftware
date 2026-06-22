# Skill: tests & quality gates

These are the exact commands `/release-feature` runs as quality gates (and CI mirrors them).

## Backend (`backend/`, pnpm)
```bash
pnpm lint            # ESLint, zero warnings
pnpm type-check      # tsc --noEmit (api + worker)
pnpm test:unit       # jest unit
pnpm test:integration# jest integration (needs postgres + redis)
pnpm test:contract   # contract project
pnpm openapi:validate# validate docs/api/openapi.yaml
```

## Frontend (`frontend/`, npm)
```bash
npm run lint
npm run typecheck    # tsc --noEmit
npm test             # jest-expo (+ --coverage in CI)
```

## Platform (`platform/`)
```bash
pnpm test            # orchestrator unit tests (offline)
```

Gates must exit 0. A failure becomes structured feedback routed to the responsible agent — no PR is
opened until every gate is green.
