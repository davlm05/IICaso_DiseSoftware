# MVP — Local Execution & Scope

This section documents the **implemented functional MVP**. The MVP focuses on the *problem statement*: the shopper
loop **Discover → Scan → Validate → Accumulate → Redeem**, delivered as a
**simplified but functional** solution wired end-to-end across frontend, backend, and
database. Satellite modules (B2B/AI analytics, queues, cache, real-time,
observability) were reduced to the bare minimum.

> **Important: the MVP runs 100% locally.** No cloud dependencies: the database is
> PostgreSQL in Docker (`localhost:5432`), the API listens on `localhost:3000`, and
> the frontend runs on the Expo dev server pointed at that local API. No accounts,
> production secrets, or external services are required.

### Quick start (all three layers)

From the **repo root** (backend + DB):

```bash
npm run setup          # install → build:types → db:up → prisma:migrate → db:seed
npm run api:dev        # http://localhost:3000/api/v1
```

In a second terminal (mobile app — requires the local `frontend/` folder):

```bash
cd frontend
npm install
npm start              # Expo Go / emulator; login shopper@example.com / test-password
```

`npm run setup` is equivalent to running `npm install`, `npm run build:types`, `npm run db:up`,
`npm run prisma:migrate`, and `npm run db:seed` in sequence.

## Fidelity to the designed architecture

The backend faithfully follows the README architecture:

- **Modular NestJS monolith** with one module per *bounded context*
  (`auth`, `users`, `catalog`, `checkout`, `rewards`).
- **Strict layered design** in each module: `presentation/` (controllers) →
  `application/` (services + port interfaces) → `domain/` (entities, state machine,
  strategies, errors; pure TypeScript) → `infrastructure/` (Prisma repositories, JWT
  signer, mappers) — Layer Rules.
- **Shared contracts** `@smartcart/shared-types` (Zod + DTOs) validated at the HTTP
  edge with `ZodValidationPipe` — Type-Safe Contract Sharing.
- **Business patterns** : Strategy (points calculation), State Machine (session),
  Factory + SHA-256 hash (anti-tamper QR), Repository + Dependency Inversion,
  ACID `$transaction` (POS validation + points ledger).
- **Data model and endpoints** implemented on the design `schema.prisma`
  (enums + jsonb, unmodified).

The frontend consumes this backend through a dedicated API layer
(`frontend/src/api/`) while preserving the design patterns (Atomic Design,
Strategy / Chain of Responsibility / Command / Decorator). See
"Frontend ↔ Backend integration" below.

## Components and how to run each one

### 1. Database / Data Layer (PostgreSQL in Docker)

The data layer is PostgreSQL 17 brought up with Docker Compose
(`backend/infra/docker/docker-compose.yml`). Prisma is the ORM, and the schema's
source of truth is `backend/apps/api/prisma/schema.prisma`.

```bash
# From the repo root
npm run db:up      # starts the smartcart-postgres container on localhost:5432
# (to stop: npm run db:down)
```

Local container credentials: user `smartcart`, password `smartcart`, database
`smartcart`. Data persisted in the Docker volume `smartcart-pgdata`.

### 2. Backend (BE) — NestJS API

```bash
# From the repo root (npm workspaces)
npm install              # installs shared-types + api dependencies
npm run build:types      # builds @smartcart/shared-types (required by the API)
npm run prisma:migrate   # creates/applies the schema in the DB (generates Prisma Client)
npm run db:seed          # initializes demo data (see "Data initialization")
npm run api:dev          # starts the API at http://localhost:3000/api/v1
```

- API base: <http://localhost:3000/api/v1>
- Swagger / OpenAPI (interactive): <http://localhost:3000/api/docs>
- Health check: <http://localhost:3000/api/v1/health>
- Detailed backend guide: [`backend/README.md`](backend/README.md)
- MVP status and decisions: [`backend/PROGRESS.md`](backend/PROGRESS.md)

### 3. Frontend (FE) — React Native App (Expo)

> The FE **consumes the live backend API** (auth, catalog, sessions, rewards). Start
> the backend first (steps 1–2, seeded); the app reaches it through the local Expo
> dev server. The `frontend/` directory is in `.gitignore` (not in the remote repo)
> but must exist on your machine to run the app.

```bash
cd frontend
npm install              # app dependencies (see versions below)
npm start                # Metro/Expo dev server (Expo Go or dev client)
# Shortcuts: npm run android | npm run ios
# Quality: npm run typecheck | npm test
```

Log in with the seeded demo user `shopper@example.com` / `test-password`. Because POS
validation is authenticated by a POS API key (not the shopper JWT), the
checkout screen **polls** the session until the cashier validates it; during a local
demo, trigger that validation externally with the `curl` flow in
[`backend/README.md`](backend/README.md).

## Frontend ↔ Backend integration

The FE talks to the API through `frontend/src/api/`:

- **`client.ts`** — a single Axios instance with a request interceptor that attaches
  `Authorization: Bearer <access>`, and a response interceptor that, on `401`, runs a
  single-flight token refresh (`POST /auth/refresh`), retries the request, and on
  refresh failure clears the tokens and routes to `/login`.
- **`tokenStore.ts`** — access/refresh tokens persisted in **expo-secure-store**
  (device keychain/keystore, never AsyncStorage).
- **`config.ts`** — base URL from `EXPO_PUBLIC_API_URL` with a platform-aware default.
- **`mappers.ts`** — adapts backend payloads to the shapes the screens read, handling
  the documented contract gaps: a client-side `barcode → icon/price` table,
  authoritative `pointsValue` for the cart, and a derived `highlighted` reward.

The state stores are now async: `authStore` calls `/auth/*` + `/users/me`;
`sessionStore` calls `/sessions/*` and derives the points balance from `/users/me`;
`useScan` resolves barcodes via `GET /products/:barcode`. Since the MVP has no
WebSocket, `checkout.tsx` polls `GET /sessions/:id` every 3 s until the session
reaches `COMPLETED`. Known FE simplifications: `PATCH /users/me` only updates
name/phone, and the SUPER_ADMIN "create user" action reuses public registration
(there is no admin-create endpoint in the MVP).

## Required environment variables

**Backend** — file `backend/apps/api/.env` (template in
[`backend/apps/api/.env.example`](backend/apps/api/.env.example)). For local
development, copying the example as-is is enough:

| Variable | Example (local) | Description |
|---|---|---|
| `NODE_ENV` | `development` | Runtime environment |
| `PORT` | `3000` | API port |
| `DATABASE_URL` | `postgresql://smartcart:smartcart@localhost:5432/smartcart?schema=public` | Postgres connection (matches docker-compose) |
| `JWT_ACCESS_SECRET` | `dev-access-secret-change-me` | Access-token secret |
| `JWT_REFRESH_SECRET` | `dev-refresh-secret-change-me` | Refresh-token secret |
| `JWT_ACCESS_TTL` | `15m` | Access-token lifetime |
| `JWT_REFRESH_TTL` | `30d` | Refresh-token lifetime |
| `QR_SIGNING_SECRET` | `dev-qr-signing-secret-min-32-chars-long!!` | QR signing key — **minimum 32 characters** |
| `POS_API_KEY` | `pos-demo-key-0001` | POS API key (header `x-api-key`) for validating sessions |
| `B2B_API_KEY` | `b2b-demo-key-0001` | B2B API key (reserved; analytics out of scope) |
| `CORS_ORIGIN` | `*` | Allowed origins (Expo dev) |

The configuration is validated on startup with Zod (`src/config/env.validation.ts`);
if a variable is missing or invalid, the API **will not start**.

**Frontend** — optional. By default the app targets the local API per platform (iOS
simulator / web `http://localhost:3000/api/v1`; **Android emulator
`http://10.0.2.2:3000/api/v1`**, since `localhost` is not the host on Android).
Override with `EXPO_PUBLIC_API_URL` when running on a physical device (e.g.
`http://<your-LAN-IP>:3000/api/v1`). Backend CORS is `*`, so no server change is needed.

## Testing on a physical Android device (Expo Go)

`localhost` (iOS sim / web) and `10.0.2.2` (Android emulator) only resolve on the host
machine itself. To run on a **real Android phone via Expo Go**, point both Expo and the
API at your computer's LAN IP. No code change is required —
`frontend/src/api/config.ts` reads `EXPO_PUBLIC_API_URL` and only falls back to the
platform default when it is unset.

1. **Same network** — connect the phone and the computer to the **same Wi-Fi**.
2. **Find your LAN IP** — on Windows run `ipconfig` and copy the `IPv4 Address` of your
   active adapter (e.g. `192.168.0.12`); Expo also prints it in the dev-server banner.
3. **Point the app at that IP** — create `frontend/.env` (Expo auto-loads it):

   ```bash
   # frontend/.env  — replace with your machine's LAN IP
   EXPO_PUBLIC_API_URL=http://192.168.0.12:3000/api/v1
   ```

   `EXPO_PUBLIC_*` variables are inlined at bundle time, so **restart Metro clearing the
   cache** after creating/editing the file: `npx expo start -c`.
4. **Allow the ports through the firewall** — the backend already listens on all
   interfaces (`0.0.0.0:3000`, NestJS default). On Windows, allow inbound TCP **3000**
   (the API) and **8081** (Metro bundler) for Node on **private networks**.
5. **Start both** — backend `npm run api:dev` (seeded) from the root, and the app with
   `npx expo start -c` in `frontend/`; scan the QR with Expo Go (connection mode **LAN**).
6. **Verify reachability** — from the phone's browser open
   `http://<your-LAN-IP>:3000/api/v1/health`; a JSON `ok` response confirms the device
   can reach the API. Then log in with `shopper@example.com` / `test-password`.

> If the app loads but every request fails, the phone can reach Metro (8081) but not the
> API (3000) — almost always the firewall on port 3000 or a wrong/stale
> `EXPO_PUBLIC_API_URL` (remember `npx expo start -c` after changing it).

## Required dependencies

- **Node.js** 20+ (tested on 24) and **npm** (workspaces at repo root).
- **Docker** + Docker Compose (for local PostgreSQL).
- **Backend** — versions in [`backend/apps/api/package.json`](backend/apps/api/package.json), resolved in root [`package-lock.json`](package-lock.json):

  | Package | Version (resolved) |
  |---|---|
  | `@nestjs/common` / `@nestjs/core` | 10.4.22 |
  | `@nestjs/jwt` | 10.2.0 |
  | `@nestjs/swagger` | 7.4.2 |
  | `@nestjs/schedule` | 4.1.2 |
  | `@prisma/client` / `prisma` | 6.19.3 |
  | `bcryptjs` | 2.4.3 |
  | `jsonwebtoken` | 9.0.3 |
  | `helmet` | 8.2.0 |
  | `passport-jwt` | 4.0.1 |
  | `zod` | 3.23.8 (pinned) |

  Install with `npm install` from the repo root. 

- **Frontend** — versions in [`frontend/package.json`](frontend/package.json) (install separately under `frontend/`):

  | Package | Version |
  |---|---|
  | `expo` | ~52.0.0 |
  | `react-native` | 0.76.9 |
  | `react` | 18.3.1 |
  | `axios` | 1.7.7 |
  | `@tanstack/react-query` | 5.59.16 |
  | `expo-secure-store` | ~14.0.0 |
  | `zod` | 3.23.8 (pinned) |

  To open the app: Expo Go or an Android/iOS emulator.

## Data initialization procedure

The seed (`backend/apps/api/prisma/seed.ts`) is **idempotent** (re-runnable) and loads:

```bash
npm run db:seed     # from the root, after prisma:migrate
```

Creates:
- **1 demo store** — `storeId` `11111111-1111-4111-8111-111111111111` (used as the
  constant store id by the FE, since the MVP has no `GET /stores` endpoint).
- **6 products** whose barcodes match the frontend catalog
  (includes `FIXED_PER_UNIT`, `VOLUME_TIER`, and `WEEKEND_BONUS` strategy examples).
- **4 redeemable rewards**.
- **POS and B2B API keys** (stored as SHA-256 hashes).
- **Demo user**: `shopper@example.com` / `test-password`, with an **initial balance of 120 points**.

The full demo flow (login → session → scan → QR → POS validation → redeem) is
documented with `curl` in [`backend/README.md`](backend/README.md), and is the same
flow the app exercises end-to-end.

## MVP scope

### Included (solves the problem statement)

- **Local auth**: register, login, refresh, logout (JWT access/refresh, bcrypt).
- **Profile + points**: `GET/PATCH /users/me`, history, and a **balance derived** from
  the immutable ledger (`SUM(delta)`).
- **Catalog**: barcode lookup and search.
- **Shopping session & checkout** (core): create session, scan/remove items,
  **state machine**, **strategy-based points calculation**, **signed QR with
  anti-tamper hash**, **POS validation** (credits points in a `$transaction`),
  cron-based expiry.
- **Rewards**: list, detail, and **redemption** (issues a coupon + atomic debit).
- **Health check**, **Swagger/OpenAPI**, Zod input validation, global error handling,
  Helmet/CORS.
- **Real persistence** in PostgreSQL + demo data seed.
- **End-to-end FE ↔ BE integration**: the React Native app consumes the API (JWT in
  SecureStore with auto-refresh, real session/scan/QR/redeem flows, checkout polling).

### Out of scope (minimized or deferred)

| Area | MVP status | Reason |
|---|---|---|
| B2B / AI analytics worker | Not implemented; the `CheckoutCompletedEvent` is logged (no-op publisher) | Satellite module; not part of the shopper loop |
| Redis / Cache-Aside cache | Not used; direct reads from Postgres | Unnecessary for demo volume |
| BullMQ / queues | Not used | Depends on the analytics worker |
| WebSockets / `SessionGateway` | Not implemented; the FE polls `GET /sessions/:id` every 3 s instead | Real-time is an enhancement, not core |
| Observability: Pino/OpenTelemetry/Prometheus/Sentry| Nest default logger only | Operational, not functional |
| `/analytics/*` endpoints | Not implemented | B2B product, outside the mobile flow |
| Refresh-token revocation / denylist | Logout is stateless | Requires Redis; acceptable for the demo |
| Image storage (Cloudflare R2) | Not used (`imageUrl` optional) | Cloud-external |
| Production infra: Nginx, K8s, Terraform, CI/CD, EAS | Not applied | The MVP runs locally only |

### MVP implementation note

The functional MVP  is a **local, npm-workspaces** slice of the full design. Intentional deviations from the tech stack tables:

| Design | MVP (as-built) |
|---|---|
| pnpm monorepo under `backend/` | **npm workspaces** at repo root (`packages/shared-types` + `backend/apps/api`) |
| Redis, BullMQ, analytics worker | **Not used** — Postgres only; `CheckoutCompletedEvent` logs to Nest logger |
| WebSockets (`SessionGateway`) | **Not used** — frontend polls `GET /sessions/:id` every 3 s |
| Observability (Pino / OTel / Sentry) | Nest **default logger** only |
| CI/CD (pnpm, SonarQube, Railway deploy) | **Not applied** — local Docker Compose + manual `npm run api:dev` |
| Resolved backend versions | NestJS **10.4.22**, Prisma **6.19.3** (see root `package-lock.json`) |