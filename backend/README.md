# SmartCart Backend (MVP)

API NestJS (monolito modular) que implementa el núcleo del diseño del README §2:
auth JWT, catálogo, sesiones de compra con máquina de estados, generación/validación
de QR firmado (anti-tamper por hash SHA-256), cálculo de puntos por estrategias,
ledger de puntos y canje de recompensas. Documentación interactiva en Swagger.

Fuera de alcance del MVP (del diseño §2 completo): worker de analytics, Redis,
BullMQ, IA, WebSockets, observabilidad (Pino/OTel/Prometheus/Sentry) e infra de
producción (Nginx/K8s/Terraform). Ver [`PROGRESS.md`](PROGRESS.md).

## Requisitos

- Node.js 20+ (probado en 24)
- Docker (para PostgreSQL)
- npm (workspaces)

## Arranque rápido

Desde la **raíz del repo**:

```bash
npm install                 # instala workspaces (shared-types + api)
npm run build:types         # compila @smartcart/shared-types
npm run db:up               # levanta Postgres en Docker (puerto 5432)
npm run prisma:migrate      # crea el esquema en la DB
npm run db:seed             # carga datos demo (tienda, productos, rewards, usuario)
npm run api:dev             # arranca la API en http://localhost:3000/api/v1
```

- Swagger UI: <http://localhost:3000/api/docs>
- Health: <http://localhost:3000/api/v1/health>

Variables de entorno: `backend/apps/api/.env` (copiado de `.env.example`).

## Credenciales / datos demo (del seed)

- Usuario: `shopper@example.com` / `test-password` (balance inicial 120 pts)
- `storeId`: `11111111-1111-4111-8111-111111111111`
- API key POS (header `x-api-key`): `pos-demo-key-0001`
- API key B2B: `b2b-demo-key-0001`
- Barcodes sembrados (coinciden con el mock del frontend): `7441001823000`,
  `7441002934111`, `7441003045222`, `7441234567890`, `7441004056333` (VOLUME_TIER),
  `7441005067444` (WEEKEND_BONUS)

## Flujo de demo (curl)

```bash
BASE=http://localhost:3000/api/v1
# 1) login
TOKEN=$(curl -s -X POST $BASE/auth/login -H 'Content-Type: application/json' \
  -d '{"email":"shopper@example.com","password":"test-password"}' | jq -r .accessToken)
# 2) crear sesión
SID=$(curl -s -X POST $BASE/sessions -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"storeId":"11111111-1111-4111-8111-111111111111"}' | jq -r .id)
# 3) escanear producto
curl -s -X POST $BASE/sessions/$SID/items -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' -d '{"barcode":"7441001823000","quantity":1}'
# 4) generar QR de salida
QR=$(curl -s -X POST $BASE/sessions/$SID/qr -H "Authorization: Bearer $TOKEN" | jq -r .token)
# 5) POS valida y acredita puntos
curl -s -X POST $BASE/sessions/$SID/validate -H 'x-api-key: pos-demo-key-0001' \
  -H 'Content-Type: application/json' \
  -d "{\"qrToken\":\"$QR\",\"scannedItems\":[\"7441001823000\"]}"
```

## Endpoints (README §2.4)

| Método | Ruta | Auth |
|---|---|---|
| POST | `/auth/register`, `/auth/login`, `/auth/refresh` | — |
| POST | `/auth/logout` | JWT |
| GET/PATCH | `/users/me` | JWT |
| GET | `/users/me/points/history` | JWT |
| GET | `/products/:barcode`, `/products/search?q=` | JWT |
| POST | `/sessions` · GET `/sessions/active` · GET `/sessions/:id` | JWT |
| POST | `/sessions/:id/items` · DELETE `/sessions/:id/items/:itemId` | JWT |
| POST | `/sessions/:id/qr` | JWT |
| POST | `/sessions/:id/validate` | API key POS |
| GET | `/rewards` · GET `/rewards/:id` · POST `/rewards/:id/redeem` | JWT |
| GET | `/health` | — |

## Estructura por capas (README §2.2)

```
src/
  common/           pipes, guards, filters, decorators, health (transversal)
  config/           validación de entorno (Zod)
  infrastructure/   PrismaService global
  modules/<dominio>/
    presentation/   controllers (HTTP)
    application/    services + interfaces (puertos)
    domain/         entidades, máquina de estados, estrategias, errores (TS puro)
    infrastructure/ repositorios Prisma, signer JWT, mappers (adaptadores)
```

Patrones clave implementados: Strategy (puntos), State Machine (sesión),
Factory + hash SHA-256 (QR anti-tamper), Repository + Dependency Inversion
(tokens de inyección), `$transaction` ACID (validación + ledger).
