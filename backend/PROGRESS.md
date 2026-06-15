# Backend MVP — Progreso

Seguimiento del desarrollo del backend de SmartCart para el MVP. Última actualización: 2026-06-15.

> **ESTADO: ✅ MVP COMPLETO Y VERIFICADO.** La API compila, arranca contra Postgres
> (Docker), y el flujo completo fue probado e2e con curl: login → /users/me →
> crear sesión → escanear → generar QR → validación POS (acredita puntos) →
> canje de recompensa. También verificados: anti-tamper (hash mismatch → 409),
> y errores de auth (401 sin token / credenciales inválidas / sin API key).
> Guía de arranque: [`backend/README.md`](README.md).

## Decisiones de alcance (acordadas con el usuario)

- **Alcance:** MVP funcional. API NestJS con capas DDD + Prisma + auth JWT + lógica core (sesiones/estado, estrategias de puntos, QR firmado, rewards/canje, ledger de puntos, products, health, Swagger, seed).
- **Fuera de alcance (del diseño §2 completo):** worker de analytics, Redis, BullMQ, IA, WebSockets, observabilidad (Pino/OTel/Prometheus/Sentry), Docker prod/K8s/Terraform/Nginx.
- **Base de datos:** PostgreSQL vía Docker (`backend/infra/docker/docker-compose.yml`). Schema de Prisma se mantiene tal cual (enums + Json).
- **Frontend:** sin tocar (sigue con mocks). El backend se demuestra vía Swagger/Postman.
- **Gestor de paquetes:** `npm workspaces` (pnpm no está instalado; npm sí). Node v24.
- **Contratos:** `@smartcart/shared-types` (Zod + DTOs) consumido por el backend (README §2.2).

## Cómo correr (cuando esté completo)

```bash
# 1. Levantar Postgres
npm run db:up                 # docker compose up -d (raíz)
# 2. Instalar deps (raíz, workspaces)
npm install
# 3. Compilar contratos compartidos
npm run build:types
# 4. Migrar + generar Prisma client
npm run prisma:migrate
# 5. Sembrar datos demo
npm run db:seed
# 6. Levantar API (http://localhost:3000/api/v1, Swagger en /api/docs)
npm run api:dev
```

## Estado de tareas

### ✅ Hechas

1. **Workspace + shared-types** — `package.json` raíz (npm workspaces), `.gitignore`,
   `packages/shared-types/{package.json,tsconfig.json,src/index.ts}` (barrel que exporta Zod + DTOs).
2. **Scaffold NestJS + Prisma + config** — `backend/apps/api/{package.json,tsconfig*.json,nest-cli.json,.env,.env.example}`,
   `src/main.ts` (versionado /api/v1, Helmet, CORS, Swagger /api/docs, filtro global),
   `src/app.module.ts`, `src/config/env.validation.ts` (Zod, valida secreto QR ≥32),
   `src/infrastructure/prisma/{prisma.service.ts,prisma.module.ts}`,
   `backend/infra/docker/docker-compose.yml` (postgres:17).
3. **Capa common** — `pipes/zod-validation.pipe.ts`, `filters/global-exception.filter.ts`,
   `errors/domain-error.ts`, `decorators/{current-user,roles,api-key}.decorator.ts`,
   `guards/{jwt-auth,roles,api-key}.guard.ts`, `health/{health.controller,health.module}.ts`.

4. **Módulos Auth + Users** ✅
   - Auth: `password.service.ts` (bcrypt), `jwt.service.ts` (TokenService access/refresh),
     `jwt.strategy.ts` (passport-jwt), `auth.service.ts` (register/login/refresh/logout),
     `auth.controller.ts`, `auth.module.ts`.
   - Users: `users.service.ts` (GET/PATCH /users/me, /users/me/points/history, balance derivado),
     `users.controller.ts`, `users.module.ts`.
5. **Catalog + Rewards** ✅ — Products: `GET /products/:barcode`, `GET /products/search`
   (+ mapper Prisma→DTO). Rewards: `GET /rewards`, `GET /rewards/:id`,
   `POST /rewards/:id/redeem` (cupón + débito en ledger dentro de `$transaction`).
6. **Checkout (patrones de dominio)** ✅ — entidad `ShoppingSession` + máquina de estados,
   estrategias de puntos (interface + Fixed/SpendMultiplier/VolumeTier/WeekendBonus) + resolver + `PointsService`,
   `JwtQrSigner` + `QrTicketFactory` (hash SHA-256 de items), repos Prisma + mapper,
   `CheckoutService` (`$transaction`: valida QR + acredita puntos + ledger), controllers
   (`/sessions`, `/sessions/:id/items`, `/sessions/:id/qr`, `/sessions/:id/validate`),
   cron de expiración, publisher de eventos no-op (logger, sin BullMQ).
7. **Seed + verificación e2e** ✅ — `prisma/seed.ts` (store, 6 products con barcodes del frontend,
   4 rewards, API keys POS/B2B, usuario demo con balance 120). Instalado, migrado, build limpio,
   arranque OK y smoke test completo del flujo. Quickstart en `backend/README.md`.

### ⏳ Por hacer

- Nada para el alcance acordado del MVP. (Pendientes futuros = los ítems de "fuera de alcance".)

## Notas / deudas técnicas conscientes del MVP

- Logout es stateless (sin denylist de refresh tokens; el diseño §2.5 usa Redis).
- Sin caché Redis en products/sessions (el diseño usa Cache-Aside).
- Eventos `CheckoutCompletedEvent` se publican a un logger no-op en vez de BullMQ.
- Prisma 6.x / NestJS 10.x (el README cita Prisma 5.20 / Nest 10.4; se subió Prisma por compatibilidad con Node 24).
