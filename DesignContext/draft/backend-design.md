# 3. Diseño del Backend y Capa de Datos

> **SmartCart** — Motor de perfilamiento predictivo e inteligencia de mercado para comercio regional.  
> Un monolito modular NestJS con tres dominios funcionales: **Consumer API**, **Analytics API**, y **AI Profiling Worker**.

---

## 3.1 Stack de Tecnologías

### Tabla de dependencias con versiones

| Librería / Herramienta | Versión | Justificación |
|------------------------|---------|---------------|
| `node` | 20 LTS | LTS activo con soporte nativo ESM, performance de V8 mejorada |
| `typescript` | 5.4.x | Type safety compartido con frontend (monorepo), decoradores habilitados |
| `@nestjs/core` | 10.x | Framework modular con DI nativo, guards, interceptors, pipes declarativos |
| `@nestjs/platform-fastify` | 10.x | Runtime HTTP más rápido que Express (~2x throughput), mismo API de NestJS |
| `@nestjs/jwt` | 10.x | Integración JWT consistente con la estrategia del frontend |
| `@nestjs/passport` | 10.x | Estrategias de autenticación (local, jwt, jwt-refresh) |
| `@nestjs/websockets` | 10.x | WebSockets para push de cupones en tiempo real |
| `@nestjs/schedule` | 4.x | Cron jobs para expiración de carritos y reportes batch |
| `@nestjs/bull` | 10.x | Integración con Bull/BullMQ para colas de procesamiento asíncrono |
| `prisma` | 5.14.x | ORM type-safe con migraciones, consistente con TypeScript del monorepo |
| `@prisma/client` | 5.14.x | Cliente generado con tipos exactos del schema |
| `ioredis` | 5.x | Cliente Redis para caché, pub/sub y rate limiting |
| `bullmq` | 5.x | Cola de mensajes sobre Redis para procesamiento de eventos de IA |
| `zod` | 3.x | Validación de contratos compartidos con el frontend (`packages/schemas`) |
| `@nestjs/config` | 3.x | Manejo de variables de entorno con validación |
| `helmet` | 7.x | Headers de seguridad HTTP (CSP, HSTS, X-Frame-Options) |
| `@nestjs/throttler` | 5.x | Rate limiting por IP y por usuario |
| `@opentelemetry/sdk-node` | 0.51.x | Trazas distribuidas (OpenTelemetry → AWS X-Ray) |
| `pino` | 9.x | Logger JSON estructurado de alto rendimiento |
| `@sentry/node` | 8.x | Monitoreo de errores y performance en producción |
| `expo-server-sdk` | 3.x | Envío de push notifications a través de Expo Push API |
| `qrcode` | 1.5.x | Generación de QR codes en servidor |
| `jest` | 29.x | Framework de testing unitario e integración |
| `supertest` | 7.x | Testing de endpoints HTTP |

**Justificación del stack:**
- **NestJS sobre Express/Fastify puro:** NestJS proporciona el marco estructural (módulos, DI, guards, interceptors) necesario para un monolito modular grande. La consistencia de TypeScript con el frontend evita errores de contrato.
- **Prisma sobre TypeORM:** Generación de tipos exactos desde el schema SQL, migraciones declarativas, y compatibilidad nativa con PostgreSQL 16 con extensiones (uuid, pgcrypto).
- **PostgreSQL + Redis:** Dos propósitos distintos. Postgres para toda la lógica transaccional con ACID completo; Redis para caché, sesiones y la cola de eventos de IA (BullMQ). Evitar introducir un tercer motor de base de datos reduce la complejidad operativa.
- **Monolito modular sobre microservicios:** Equipo pequeño, producto en evolución. La separación por módulos de NestJS provee los mismos límites de dominio que microservicios sin el overhead de red, Service Mesh y consistencia distribuida.

---

## 3.2 Hosting y Servicios Cloud (AWS)

| Servicio AWS | Rol en SmartCart |
|-------------|-----------------|
| **ECS Fargate** | Ejecución del servidor NestJS en contenedores sin gestión de EC2 |
| **RDS PostgreSQL 16 Multi-AZ** | Base de datos principal con failover automático |
| **ElastiCache Redis 7 (Cluster Mode)** | Caché L2, pub/sub para WebSockets, colas BullMQ |
| **Application Load Balancer (ALB)** | Balanceo de carga + terminación TLS, health checks |
| **AWS WAF** | Protección OWASP contra SQLi, XSS, rate limiting a nivel de borde |
| **AWS API Gateway** | API Management, throttling, documentación OpenAPI |
| **AWS Secrets Manager** | Almacenamiento de credenciales de BD, JWT secrets, API keys de IA |
| **AWS SQS** | Cola FIFO para eventos de checkout que alimentan el pipeline de IA |
| **AWS S3** | Imágenes de productos, exportaciones de reportes analíticos |
| **AWS CloudFront** | CDN para imágenes de productos en S3 |
| **AWS X-Ray** | Trazas distribuidas para correlacionar requests entre capas |
| **AWS CloudWatch** | Logs centralizados, métricas custom, alarmas |
| **AWS ECR** | Registro de imágenes Docker con escaneo de vulnerabilidades |
| **AWS SNS** | Notificaciones de alarmas a Slack/email del equipo de ops |

### Diagrama de red (subredes)

```
Internet
    │
    ▼
┌── AWS WAF ──────────────────────────────────────────┐
│   CloudFront (CDN assets)                            │
│   API Gateway (throttling, OpenAPI docs)             │
└── ALB (TLS termination) ───────────────────────────┘
            │
┌─ Public Subnet ──────────────────────────────────────┐
│   ECS Fargate Tasks (NestJS)                          │
│   NAT Gateway                                         │
└──────────────────────────────────────────────────────┘
            │
┌─ Private Subnet ─────────────────────────────────────┐
│   RDS PostgreSQL (Multi-AZ, no inbound from internet) │
│   ElastiCache Redis (cluster, no inbound public)      │
└──────────────────────────────────────────────────────┘
```

---

## 3.3 Patrones Arquitectónicos

### A. Monolito Modular (Bounded Contexts)

**Responsabilidades:** Cada módulo NestJS encapsula un contexto de dominio completo: entidades, repositorios, servicios y controladores propios. Los módulos se comunican vía inyección de dependencia o eventos internos, nunca accediendo directamente a los repositorios de otro módulo.

**Módulos del sistema:**

| Módulo | Bounded Context | Responsabilidad |
|--------|----------------|-----------------|
| `AuthModule` | Identidad | JWT, refresh tokens, registro, logout |
| `UsersModule` | Consumidor | Perfil de usuario, preferencias |
| `ProductsModule` | Catálogo | Lookup por barcode, catálogo, sponsored |
| `CartModule` | Carrito | Sesión de compra activa, agregar/quitar items |
| `CheckoutModule` | Pago | QR generation, validación en caja, acreditación |
| `RewardsModule` | Fidelización | Catálogo de recompensas, canje |
| `NotificationsModule` | Comunicación | Push via Expo, eventos en tiempo real |
| `AnalyticsModule` | Inteligencia B2B | Queries de segmentos, reportes, insights |
| `CampaignsModule` | Publicidad | Gestión de productos patrocinados, cupones |
| `ProfilingWorker` | IA | Procesamiento async de eventos, actualización de perfiles |

**Ventajas:** Límites de dominio claros sin costo de red de microservicios. Si en el futuro se decide extraer el módulo de Analytics como microservicio independiente, el límite ya está definido en el código.

### B. BFF (Backend for Frontend)

Dos grupos de controladores distintos, uno por familia de cliente:

```
/api/v1/consumer/*   → BFF para SmartCart Mobile (JWT de consumidor)
/api/v1/b2b/*        → BFF para SmartCart Dashboard (JWT de organización)
```

Los BFFs exponen exactamente los datos que cada cliente necesita, evitando over-fetching. El BFF móvil devuelve respuestas optimizadas para bajo ancho de banda; el BFF B2B devuelve datasets más amplios para tablas y gráficas.

### C. CQRS (Command Query Responsibility Segregation) — parcial

Para el dominio de Analytics, las consultas de segmentos y reportes son costosas y no deben bloquear las escrituras de la app móvil. Se aplica CQRS ligero:

- **Commands** (escrituras): `ScanProductCommand`, `ConfirmCheckoutCommand`, `RedeemRewardCommand`
- **Queries** (lecturas B2B): `GetConsumerSegmentsQuery`, `GetProductInsightsQuery`

Las queries de analytics se ejecutan contra réplicas de lectura de PostgreSQL, sin afectar la base primaria.

### D. Event-Driven (BullMQ)

Los eventos de comportamiento del consumidor (scan, checkout, ubicación) se encolan en Redis vía BullMQ y son procesados por el `ProfilingWorker` de forma asíncrona. Esto desacopla el path crítico de la app móvil del procesamiento de IA.

```
HTTP Request → Controller → Service → DB Write
                                    ↘ BullMQ Job → ProfilingWorker → Update ConsumerProfile
```

---

## 3.4 Patrones de Diseño Orientados a Objetos

### A. Repository Pattern

Encapsula todo acceso a la base de datos. Los servicios de negocio nunca importan `PrismaClient` directamente.

```ts
// /src/products/repositories/product.repository.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/infrastructure/prisma/prisma.service';
import { Product } from '@prisma/client';

export interface IProductRepository {
  findByBarcode(barcode: string): Promise<Product | null>;
  findSponsoredByStore(storeId: string): Promise<Product[]>;
}

@Injectable()
export class ProductRepository implements IProductRepository {
  constructor(private readonly prisma: PrismaService) {}

  findByBarcode(barcode: string): Promise<Product | null> {
    return this.prisma.product.findUnique({ where: { barcode } });
  }

  findSponsoredByStore(storeId: string): Promise<Product[]> {
    return this.prisma.product.findMany({
      where: {
        sponsoredProducts: { some: { storeId, active: true } },
      },
      include: { sponsoredProducts: { where: { storeId } } },
    });
  }
}
```

**Clases participantes:** `IProductRepository` (interfaz), `ProductRepository` (implementación), `PrismaService` (infraestructura). El `ProductService` depende de `IProductRepository`, no de la implementación concreta — cumple DIP de SOLID.

### B. Strategy Pattern — Algoritmo de acreditación de puntos

Distintas campañas tienen reglas de acreditación distintas (puntos fijos, multiplicadores por monto, puntos por volumen). Se encapsulan como estrategias intercambiables:

```ts
// /src/checkout/strategies/points-accrual.strategy.ts
export interface PointsAccrualStrategy {
  calculate(quantity: number, unitPrice: number, campaignConfig: CampaignConfig): number;
}

@Injectable()
export class FixedPointsStrategy implements PointsAccrualStrategy {
  calculate(quantity: number, _price: number, config: CampaignConfig): number {
    return config.pointsPerUnit * quantity;
  }
}

@Injectable()
export class MultiplierStrategy implements PointsAccrualStrategy {
  calculate(quantity: number, unitPrice: number, config: CampaignConfig): number {
    return Math.floor((unitPrice * quantity) / config.spendPerPoint);
  }
}

// /src/checkout/services/checkout.service.ts
@Injectable()
export class CheckoutService {
  constructor(
    @Inject('POINTS_STRATEGY_MAP')
    private readonly strategies: Map<string, PointsAccrualStrategy>,
  ) {}

  private getPoints(item: CartItem, campaign: Campaign): number {
    const strategy = this.strategies.get(campaign.strategyType) ?? new FixedPointsStrategy();
    return strategy.calculate(item.quantity, item.unitPrice, campaign.config);
  }
}
```

### C. Observer Pattern — Eventos de dominio internos

Cuando se confirma un checkout, múltiples subsistemas deben reaccionar (acreditar puntos, enviar push notification, encolar evento de IA). En lugar de acoplar estos en el `CheckoutService`, se emiten eventos de dominio:

```ts
// /src/checkout/events/checkout-confirmed.event.ts
export class CheckoutConfirmedEvent {
  constructor(
    public readonly transactionId: string,
    public readonly userId: string,
    public readonly cartItems: CartItem[],
    public readonly totalPoints: number,
  ) {}
}

// /src/checkout/services/checkout.service.ts
@Injectable()
export class CheckoutService {
  constructor(private readonly eventEmitter: EventEmitter2) {}

  async confirmCheckout(qrToken: string): Promise<Transaction> {
    const transaction = await this.processTransaction(qrToken);
    this.eventEmitter.emit('checkout.confirmed', new CheckoutConfirmedEvent(
      transaction.id, transaction.userId, transaction.items, transaction.totalPoints,
    ));
    return transaction;
  }
}

// /src/rewards/listeners/points-accrual.listener.ts
@Injectable()
export class PointsAccrualListener {
  @OnEvent('checkout.confirmed')
  async handle(event: CheckoutConfirmedEvent) {
    await this.pointsLedger.credit(event.userId, event.totalPoints, event.transactionId);
  }
}
```

### D. Decorator Pattern — Guards y Pipes

NestJS usa decoradores que implementan el patrón Decorator para añadir comportamiento a los controladores de forma declarativa:

```ts
// /src/auth/decorators/roles.decorator.ts
export const Roles = (...roles: UserRole[]) => SetMetadata('roles', roles);

// Uso en controlador:
@Get('segments/:userId')
@Roles(UserRole.BRAND_ANALYST, UserRole.PLATFORM_ADMIN)
@UseGuards(JwtAuthGuard, RolesGuard)
async getConsumerSegments(@Param('userId') userId: string) { ... }
```

### E. Factory Pattern — Creación de QR tokens

```ts
// /src/checkout/factories/qr-token.factory.ts
@Injectable()
export class QrTokenFactory {
  constructor(private readonly jwtService: JwtService) {}

  create(cartId: string, userId: string, storeId: string): string {
    return this.jwtService.sign(
      { cartId, userId, storeId, type: 'checkout_qr' },
      { expiresIn: '15m', secret: process.env.QR_SECRET },
    );
  }

  verify(token: string): QrPayload {
    return this.jwtService.verify(token, { secret: process.env.QR_SECRET });
  }
}
```

---

## 3.5 Diseño en Capas

```
┌─────────────────────────────────────────────────────────────┐
│  CAPA DE PRESENTACIÓN (HTTP / WS)                           │
│  Controllers, WebSocket Gateways, Pipes, Guards             │
│  ✓ Recibe requests HTTP/WS, valida DTOs, retorna respuestas │
│  ✗ NO contiene lógica de negocio ni acceso a DB             │
├─────────────────────────────────────────────────────────────┤
│  CAPA DE APLICACIÓN (Use Cases / Services)                  │
│  Services, Command Handlers, Event Listeners                │
│  ✓ Orquesta entidades y repositorios, emite eventos         │
│  ✗ NO importa PrismaClient directamente                     │
│  ✗ NO contiene lógica de dominio pura (validaciones de      │
│    invariantes van en entidades/domain services)            │
├─────────────────────────────────────────────────────────────┤
│  CAPA DE DOMINIO (Business Logic)                           │
│  Domain Services, Entities, Value Objects, Strategies       │
│  ✓ Reglas de negocio puras, independientes de frameworks    │
│  ✗ NO importa NestJS ni Prisma                              │
├─────────────────────────────────────────────────────────────┤
│  CAPA DE INFRAESTRUCTURA (Persistence / External)           │
│  Repositories, PrismaService, RedisService, QueueProducers  │
│  ExternalAPIs (Expo Push, AI service)                       │
│  ✓ Acceso a BD, caché, colas, servicios externos            │
│  ✗ NO contiene lógica de negocio                            │
└─────────────────────────────────────────────────────────────┘
```

**Flujo de una request típica:**

```
HTTP POST /api/v1/consumer/cart/scan
    → ValidationPipe (DTO Zod)
    → JwtAuthGuard (token válido)
    → CartController.scanProduct()
        → CartService.addItem(userId, barcodeDto)
            → ProductRepository.findByBarcode(barcode)    [Infraestructura]
            → CartRepository.addItem(cartId, product)     [Infraestructura]
            → EventEmitter.emit('product.scanned', ...)   [Dominio]
        ← CartItemDto (respuesta serializada)
    ← HTTP 201 { cartItem: {...} }
```

**Restricción crítica:** Ningún módulo accede al repositorio de otro módulo. Si `CheckoutService` necesita datos del carrito, llama a `CartService`, no a `CartRepository`.

---

## 3.6 Diagramas de Arquitectura — Modelo C4

### Nivel 1 — Contexto del Sistema

```mermaid
graph TB
    Consumer["👤 Consumidor<br/>(usa SmartCart Mobile)"]
    StoreAdmin["🏪 Administrador de<br/>Supermercado (Web Dashboard)"]
    BrandAnalyst["📊 Analista de Marca<br/>(Web Dashboard)"]
    Cashier["🧾 Cajera<br/>(valida QR en caja)"]

    subgraph SmartCart["SmartCart Platform"]
        MobileApp["📱 SmartCart Mobile<br/>React Native + Expo"]
        Dashboard["💻 SmartCart Dashboard<br/>Next.js 14"]
        Backend["⚙️ SmartCart Backend API<br/>NestJS + PostgreSQL"]
    end

    ExpoPN["Expo Push<br/>Notification Service"]
    AIService["AWS Bedrock<br/>(AI Profiling)"]

    Consumer -->|"escanea productos,<br/>canjea puntos"| MobileApp
    StoreAdmin -->|"ve inventario,<br/>gestiona campañas"| Dashboard
    BrandAnalyst -->|"ve segmentos,<br/>compra insights"| Dashboard
    Cashier -->|"escanea QR<br/>en punto de venta"| Backend
    MobileApp -->|"HTTPS/JSON + WSS"| Backend
    Dashboard -->|"HTTPS/JSON"| Backend
    Backend -->|"push notifications"| ExpoPN
    Backend -->|"eventos de comportamiento"| AIService
    ExpoPN -->|"push a dispositivo"| MobileApp
```

### Nivel 2 — Contenedores

```
┌─────────────────── AWS VPC ──────────────────────────────────────────┐
│                                                                       │
│  ┌── Internet-Facing ──────────────────────────────────────────────┐ │
│  │  AWS WAF → ALB (HTTPS/443) → API Gateway                        │ │
│  └─────────────────────────────────────────────────────────────────┘ │
│                           │                                           │
│  ┌── ECS Fargate (Public Subnet) ──────────────────────────────────┐ │
│  │                                                                   │ │
│  │  ┌────────────────────────────────────────────────────────────┐  │ │
│  │  │  NestJS Backend API (Node 20, TypeScript 5.4)              │  │ │
│  │  │  Consumer API (/api/v1/consumer/*)                         │  │ │
│  │  │  Analytics API (/api/v1/b2b/*)                             │  │ │
│  │  │  WebSocket Gateway (wss://)                                │  │ │
│  │  │  BullMQ Workers (ProfilingWorker, NotificationWorker)      │  │ │
│  │  └────────────────────────────────────────────────────────────┘  │ │
│  │                                                                   │ │
│  └───────────────────────────────────────────────────────────────────┘ │
│                    │                        │                          │
│  ┌── Private Subnet ────────────────────────────────────────────────┐  │
│  │                                                                   │  │
│  │  RDS PostgreSQL 16       ElastiCache Redis 7        S3 Bucket   │  │
│  │  (Multi-AZ, Prisma ORM)  (BullMQ + caché + pub/sub) (imágenes)  │  │
│  │                                                                   │  │
│  └───────────────────────────────────────────────────────────────────┘  │
│                                                                          │
│  AWS Secrets Manager  │  CloudWatch Logs  │  X-Ray Traces               │
└──────────────────────────────────────────────────────────────────────────┘

Externos:
  Expo Push Notification Service  (push → iOS/Android)
  AWS Bedrock Claude Haiku         (AI profiling inference)
```

### Nivel 3 — Componentes del Backend

```
NestJS Backend
├── [HTTP Layer]
│   ├── AuthController        ← POST /auth/login, /auth/refresh, /auth/logout
│   ├── ProductsController    ← GET /products/barcode/:ean
│   ├── CartController        ← POST /cart/scan, GET /cart, DELETE /cart/:itemId
│   ├── CheckoutController    ← POST /checkout/qr, POST /checkout/validate
│   ├── RewardsController     ← GET /rewards, POST /rewards/:id/redeem
│   ├── AnalyticsController   ← GET /b2b/segments, GET /b2b/products/:id/insights
│   └── CampaignsController   ← CRUD /b2b/campaigns
│
├── [Application Layer]
│   ├── AuthService           ← lógica de tokens y sesiones
│   ├── CartService           ← gestión de carrito activo
│   ├── CheckoutService       ← QR + validación + acreditación
│   ├── PointsService         ← cálculo y registro de puntos
│   ├── ProfilingService      ← construcción de perfil de consumidor
│   └── AnalyticsService      ← queries de segmentos y reportes
│
├── [Domain Layer]
│   ├── CartDomain            ← reglas: máx items, productos duplicados
│   ├── PointsAccrualStrategy ← Fixed / Multiplier / Volume
│   └── QrTokenFactory        ← creación/verificación de tokens QR
│
└── [Infrastructure Layer]
    ├── PrismaService         ← connection pool PostgreSQL
    ├── RedisService          ← ioredis client
    ├── ProductRepository     ← queries de productos
    ├── CartRepository        ← CRUD de carrito
    ├── TransactionRepository ← escritura de transacciones
    ├── PointsLedgerRepository← append-only de puntos
    ├── BullMQ Producers      ← encolar jobs de IA y notificaciones
    └── ExpoPushAdapter       ← envío de push notifications
```

### Nivel 4 — Diagrama de Clases (Módulo Checkout)

```
┌──────────────────────────────────────────┐
│  CheckoutController  [HTTP Layer]         │
│  + generateQr(userId): QrResponseDto     │
│  + validateQr(token): TransactionDto     │
└──────────────────┬───────────────────────┘
                   │ uses
┌──────────────────▼───────────────────────┐
│  CheckoutService  [Application Layer]    │
│  - qrFactory: QrTokenFactory             │
│  - cartRepo: ICartRepository             │
│  - txRepo: ITransactionRepository        │
│  - eventEmitter: EventEmitter2           │
│  + generateQrToken(userId): string       │
│  + confirmCheckout(token): Transaction   │
└──────────────────┬───────────────────────┘
          ┌────────┴────────┐
          │                 │
┌─────────▼──────┐  ┌───────▼──────────────┐
│ QrTokenFactory │  │  ICartRepository      │
│ [Domain]       │  │  [Infrastructure]     │
│ + create()     │  │  + findByUser()       │
│ + verify()     │  │  + lockForCheckout()  │
└────────────────┘  └──────────────────────┘
```

---

## 3.7 Middlewares, Seguridad y Configuración

### Cadena de middlewares (orden de ejecución)

```
Request
  │
  ├─ 1. Helmet (security headers)
  ├─ 2. CORS (orígenes permitidos por ambiente)
  ├─ 3. ThrottlerGuard (rate limiting: 100 req/min por IP)
  ├─ 4. RequestIdMiddleware (inyecta X-Request-Id para trazas)
  ├─ 5. LoggingInterceptor (Pino: método, path, status, latencia)
  ├─ 6. JwtAuthGuard (verifica accessToken, excluye rutas públicas)
  ├─ 7. RolesGuard (verifica rol del usuario)
  ├─ 8. ValidationPipe (Zod schema del DTO)
  ├─ 9. Controller Handler
  └─ 10. ResponseInterceptor (serializa, añade envelope { data, meta })
```

### Implementación del RequestId Middleware

```ts
// /src/common/middleware/request-id.middleware.ts
import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const requestId = (req.headers['x-request-id'] as string) ?? uuidv4();
    req['requestId'] = requestId;
    res.setHeader('X-Request-Id', requestId);
    next();
  }
}
```

### Variables de entorno y configuración

```ts
// /src/config/env.schema.ts  — Validación de ENV al arrancar el servidor
import { z } from 'zod';

export const envSchema = z.object({
  NODE_ENV:          z.enum(['development', 'staging', 'production']),
  PORT:              z.coerce.number().default(3000),

  DATABASE_URL:      z.string().url(),      // Inyectado por Secrets Manager en producción
  REDIS_URL:         z.string().url(),

  JWT_ACCESS_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET:z.string().min(32),
  QR_SECRET:         z.string().min(32),
  JWT_ACCESS_EXPIRY: z.string().default('15m'),
  JWT_REFRESH_EXPIRY:z.string().default('7d'),

  EXPO_ACCESS_TOKEN: z.string(),
  AI_SERVICE_ENDPOINT: z.string().url(),
  AI_SERVICE_API_KEY:  z.string(),

  SENTRY_DSN:        z.string().optional(),
  AWS_REGION:        z.string().default('us-east-1'),
});

// El servidor falla al arrancar si alguna variable requerida falta.
// Nunca arranca en producción con variables inválidas.
```

### Manejo de errores global

```ts
// /src/common/filters/global-exception.filter.ts
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  constructor(private readonly logger: PinoLogger) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();

    const status = exception instanceof HttpException
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;

    const message = exception instanceof HttpException
      ? exception.message
      : 'Internal server error';

    // Nunca exponer stack traces al cliente en producción
    const isProduction = process.env.NODE_ENV === 'production';

    this.logger.error({ requestId: request['requestId'], exception }, message);

    if (status >= 500) {
      Sentry.captureException(exception);
    }

    response.status(status).json({
      error: {
        status,
        message,
        requestId: request['requestId'],
        ...(isProduction ? {} : { stack: (exception as Error).stack }),
      },
    });
  }
}
```

### DTOs y validación

Los DTOs usan Zod (compartido con el frontend) envuelto en un `ZodValidationPipe`:

```ts
// /packages/schemas/cart.schema.ts  (monorepo compartido)
export const ScanProductDto = z.object({
  barcode: z.string().regex(/^\d{13}$/, 'EAN-13 debe tener exactamente 13 dígitos'),
  storeId: z.string().uuid(),
});
export type ScanProductDto = z.infer<typeof ScanProductDto>;

// /src/cart/cart.controller.ts
@Post('scan')
@UsePipes(new ZodValidationPipe(ScanProductDto))
async scanProduct(@Body() dto: ScanProductDto, @CurrentUser() user: JwtPayload) {
  return this.cartService.addItem(user.sub, dto);
}
```

### Connection Pooling

```ts
// /src/infrastructure/prisma/prisma.service.ts
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    super({
      datasources: { db: { url: process.env.DATABASE_URL } },
      // Pool configurado en la URL: ?connection_limit=20&pool_timeout=30
      log: process.env.NODE_ENV !== 'production' ? ['query', 'warn'] : ['warn', 'error'],
    });
  }

  async onModuleInit() { await this.$connect(); }
  async onModuleDestroy() { await this.$disconnect(); }
}

// DATABASE_URL en producción:
// postgresql://user:pass@rds-host:5432/smartcart?connection_limit=20&pool_timeout=30&sslmode=require
```

**Configuración de pool por ambiente:**

| Ambiente | `connection_limit` | `pool_timeout` |
|----------|-------------------|----------------|
| development | 5 | 10s |
| staging | 10 | 20s |
| production | 20 | 30s |

### Caché con Redis

```ts
// /src/infrastructure/cache/cache.service.ts
@Injectable()
export class CacheService {
  constructor(@InjectRedis() private readonly redis: Redis) {}

  async get<T>(key: string): Promise<T | null> {
    const data = await this.redis.get(key);
    return data ? JSON.parse(data) : null;
  }

  async set<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
    await this.redis.setex(key, ttlSeconds, JSON.stringify(value));
  }

  async invalidate(pattern: string): Promise<void> {
    const keys = await this.redis.keys(pattern);
    if (keys.length > 0) await this.redis.del(...keys);
  }
}

// Uso en ProductService: caché de 5 min para lookups de barcode
async findByBarcode(barcode: string): Promise<Product> {
  const cacheKey = `product:barcode:${barcode}`;
  const cached = await this.cache.get<Product>(cacheKey);
  if (cached) return cached;

  const product = await this.productRepo.findByBarcode(barcode);
  if (!product) throw new NotFoundException('Producto no encontrado');

  await this.cache.set(cacheKey, product, 300);
  return product;
}
```

**Estrategia de TTL por tipo de dato:**

| Dato | TTL | Justificación |
|------|-----|---------------|
| Lookup de barcode | 5 min | Datos de producto casi estáticos |
| Productos patrocinados | 2 min | Pueden cambiar por campaña activa |
| Perfil de usuario | 1 min | Puntos cambian con cada transacción |
| Segmentos analíticos | 1 hora | Queries costosas, datos del día anterior |

### WebSockets — Cupones en tiempo real

```ts
// /src/notifications/gateways/coupons.gateway.ts
@WebSocketGateway({ namespace: 'coupons', cors: { origin: '*' } })
export class CouponsGateway implements OnGatewayConnection {
  @WebSocketServer() server: Server;

  handleConnection(client: Socket) {
    const userId = client.handshake.auth?.userId;
    if (!userId) { client.disconnect(); return; }
    client.join(`user:${userId}`);
  }

  async pushCouponToUser(userId: string, coupon: CouponDto) {
    this.server.to(`user:${userId}`).emit('coupon:available', coupon);
  }
}
```

### Procesamiento asíncrono con BullMQ

```ts
// /src/profiling/queues/behavioral-events.queue.ts
export const BEHAVIORAL_EVENTS_QUEUE = 'behavioral-events';

// Productor (en CheckoutService)
@InjectQueue(BEHAVIORAL_EVENTS_QUEUE)
private readonly queue: Queue,

await this.queue.add('checkout-completed', {
  userId, storeId, items: cartItems, timestamp: new Date(),
}, { attempts: 3, backoff: { type: 'exponential', delay: 5000 } });

// Consumidor (ProfilingWorker)
@Processor(BEHAVIORAL_EVENTS_QUEUE)
export class ProfilingWorker {
  @Process('checkout-completed')
  async handleCheckout(job: Job<CheckoutEvent>) {
    await this.profilingService.updateConsumerProfile(job.data);
  }
}
```

### Integración con IA (AWS Bedrock)

```ts
// /src/profiling/services/ai-inference.service.ts
@Injectable()
export class AiInferenceService {
  private readonly client: BedrockRuntimeClient;

  constructor() {
    this.client = new BedrockRuntimeClient({ region: 'us-east-1' });
  }

  async classifyConsumerSegment(profile: ConsumerBehaviorProfile): Promise<ConsumerSegment> {
    const prompt = this.buildSegmentationPrompt(profile);

    const response = await this.client.send(new InvokeModelCommand({
      modelId: 'anthropic.claude-haiku-4-5',
      body: JSON.stringify({
        anthropic_version: 'bedrock-2023-05-31',
        max_tokens: 512,
        messages: [{ role: 'user', content: prompt }],
      }),
    }));

    return this.parseSegmentResponse(response.body);
  }

  private buildSegmentationPrompt(profile: ConsumerBehaviorProfile): string {
    return `Analiza el siguiente perfil de comportamiento de compra y clasifica al consumidor.
    
Historial de categorías: ${JSON.stringify(profile.categoryFrequency)}
Hora promedio de compra: ${profile.avgPurchaseHour}
Ticket promedio: ${profile.avgTicket}
Frecuencia semanal: ${profile.weeklyFrequency}
Preferencia orgánicos: ${profile.organicRatio}

Responde en JSON con: { segment, confidence, traits[] }`;
  }
}
```

### Observabilidad — OpenTelemetry

```ts
// /src/instrumentation.ts  (cargado antes de iniciar el servidor)
import { NodeSDK } from '@opentelemetry/sdk-node';
import { AWSXRayPropagator } from '@opentelemetry/propagator-aws-xray';
import { AWSXRayIdGenerator } from '@opentelemetry/id-generator-aws-xray';

const sdk = new NodeSDK({
  traceExporter: new OTLPTraceExporter(),
  idGenerator: new AWSXRayIdGenerator(),
  textMapPropagator: new AWSXRayPropagator(),
  instrumentations: [
    new HttpInstrumentation(),
    new PrismaInstrumentation(),    // Trazas de queries SQL
    new RedisInstrumentation(),
  ],
});

sdk.start();
```

**Métricas custom con CloudWatch:**

```ts
// /src/common/metrics/business-metrics.service.ts
export class BusinessMetricsService {
  async recordScanEvent(storeId: string) {
    await this.cloudwatch.putMetricData({
      Namespace: 'SmartCart/Business',
      MetricData: [{
        MetricName: 'ProductScans',
        Dimensions: [{ Name: 'StoreId', Value: storeId }],
        Value: 1, Unit: 'Count',
      }],
    });
  }
}
```

---

## 3.8 Estrategias de Testing

### Unit Testing

```ts
// /src/__tests__/unit/checkout.service.spec.ts
describe('CheckoutService', () => {
  let service: CheckoutService;
  let cartRepo: jest.Mocked<ICartRepository>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        CheckoutService,
        { provide: ICartRepository, useValue: { findByUser: jest.fn(), lockForCheckout: jest.fn() } },
        { provide: QrTokenFactory, useValue: { create: jest.fn().mockReturnValue('mock-qr-token') } },
        { provide: EventEmitter2, useValue: { emit: jest.fn() } },
      ],
    }).compile();

    service = module.get(CheckoutService);
    cartRepo = module.get(ICartRepository);
  });

  it('genera un QR token válido para un carrito activo', async () => {
    cartRepo.findByUser.mockResolvedValue({ id: 'cart-1', items: [mockCartItem] });
    const result = await service.generateQrToken('user-1', 'store-1');
    expect(result.token).toBe('mock-qr-token');
    expect(cartRepo.findByUser).toHaveBeenCalledWith('user-1', 'store-1');
  });

  it('lanza NotFoundException si el carrito está vacío', async () => {
    cartRepo.findByUser.mockResolvedValue({ id: 'cart-1', items: [] });
    await expect(service.generateQrToken('user-1', 'store-1'))
      .rejects.toThrow(NotFoundException);
  });
});
```

### Integration Testing

```ts
// /src/__tests__/integration/cart.integration.spec.ts
describe('Cart API Integration', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const module = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(PrismaService)
      .useValue(testPrismaClient)   // BD de test real (PostgreSQL en Docker)
      .compile();

    app = module.createNestApplication();
    await app.init();
  });

  it('POST /api/v1/consumer/cart/scan agrega un producto al carrito', async () => {
    const { accessToken } = await loginTestUser(app);

    const response = await request(app.getHttpServer())
      .post('/api/v1/consumer/cart/scan')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ barcode: '1234567890123', storeId: testStoreId })
      .expect(201);

    expect(response.body.data.cartItem.barcode).toBe('1234567890123');
  });
});
```

### Health Checks

```ts
// /src/health/health.controller.ts
@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private db: PrismaHealthIndicator,
    private redis: RedisHealthIndicator,
  ) {}

  @Get()
  @HealthCheck()
  check() {
    return this.health.check([
      () => this.db.pingCheck('database'),
      () => this.redis.pingCheck('redis'),
      () => this.health.check([() => Promise.resolve({ api: { status: 'up' } })]),
    ]);
  }
}
// GET /health → { status: 'ok', details: { database: {status:'up'}, redis: {status:'up'} } }
```

### Contract Testing

Los contratos entre frontend y backend se validan automáticamente en CI usando los schemas Zod compartidos:

```ts
// /packages/schemas/__tests__/contract.spec.ts
import { ScanProductDto, ProductSchema } from '../index';

describe('Contratos de API — Scanner', () => {
  it('ScanProductDto rechaza barcode de longitud incorrecta', () => {
    expect(() => ScanProductDto.parse({ barcode: '123', storeId: 'uuid' })).toThrow();
  });

  it('ProductSchema parsea respuesta real de la API', () => {
    const apiResponse = { id: crypto.randomUUID(), barcode: '7702011081149', name: 'Café Britt', brand: 'Café Britt', price: 3250 };
    expect(() => ProductSchema.parse(apiResponse)).not.toThrow();
  });
});
```

**Cobertura mínima esperada:**

| Capa | Cobertura mínima |
|------|-----------------|
| Services (Application Layer) | 85% |
| Repositories (Infrastructure) | 75% |
| Controllers | 70% |
| Domain Services / Strategies | 90% |
| Schemas (contratos) | 100% |
| **Total** | **75%** |

---

## 3.9 Reglas de Negocio Complejas

### Algoritmo 1: Generación y Validación del QR de Checkout

El QR no es solo un identificador; es un **JWT firmado con clave independiente** que contiene el estado del carrito en ese momento. Esto previene modificar el carrito después de mostrar el QR.

```
PASO 1 — Generar QR:
  1. Verificar que el carrito del usuario tiene al menos 1 item en `storeId`
  2. Calcular el total de puntos que se acreditarán (suma de sponsored_points por item)
  3. Crear JWT con payload { cartId, userId, storeId, itemCount, estimatedPoints, type:'checkout_qr' }
     → firmado con QR_SECRET (distinto del JWT_ACCESS_SECRET)
     → expiración: 15 minutos
  4. Marcar el carrito como 'pending_checkout' en la BD (evita doble checkout)
  5. Retornar el JWT como string (el frontend lo convierte a QR visual con expo-barcode-scanner)

PASO 2 — Validar QR (llamado por el POS de la cajera):
  1. Verificar firma y expiración del JWT
  2. Verificar que el carrito sigue en estado 'pending_checkout'
  3. Verificar que el storeId del JWT coincide con el storeId de la sesión de la cajera
  4. Iniciar transacción PostgreSQL:
     a. Crear Transaction record con estado 'completed'
     b. Crear TransactionItem por cada CartItem
     c. Para cada sponsored item: calcular puntos con la estrategia activa
     d. Insertar entrada en points_ledger (append-only, nunca UPDATE)
     e. Marcar carrito como 'completed'
     f. Emitir evento 'checkout.confirmed'
  5. Fuera de la transacción: push notification al consumidor con puntos acreditados
```

### Algoritmo 2: Pipeline de Perfilamiento de Consumidor

```
TRIGGER: Job 'checkout-completed' en BullMQ (asíncrono, fuera del path crítico)

PASO 1 — Agregar evento al historial:
  INSERT INTO behavioral_events (userId, eventType, payload, storeId, timestamp)

PASO 2 — Recalcular perfil conductual (última ventana de 90 días):
  - category_frequency: mapa { categoría → cantidad_de_items }
  - avg_purchase_hour: promedio de la hora del día de las transacciones
  - avg_ticket: promedio del monto total por transacción
  - weekly_frequency: transacciones por semana (promedio)
  - organic_ratio: proporción de items de categoría 'orgánico' vs total
  - store_loyalty: tienda más frecuentada

PASO 3 — Clasificación con IA (AWS Bedrock):
  - Solo si el perfil tiene >= 5 transacciones históricas (evitar clasificaciones con poco dato)
  - Llamar AiInferenceService.classifyConsumerSegment(profile)
  - Segmentos ejemplo: 'budget_conscious', 'organic_premium', 'impulse_buyer', 'brand_loyal'

PASO 4 — Actualizar ConsumerProfile:
  UPSERT consumer_profiles SET segment, confidence, traits, updated_at = NOW()

PASO 5 — Si confidence < 0.6: marcar como 'uncertain', no usar para targeting de campañas

PASO 6 — Invalidar caché del perfil en Redis (key: profile:userId)
```

### Algoritmo 3: Targeting de Cupones en Tiempo Real

```
TRIGGER: Evento de localización del usuario dentro de la tienda (cada 30 seg desde la app)

PASO 1 — Obtener contexto:
  - Carrito activo del usuario (items actuales)
  - Perfil de segmento del consumidor
  - Campañas activas para esa sucursal (del caché Redis, TTL 2 min)

PASO 2 — Filtrar campañas elegibles:
  - La campaña aplica al storeId actual
  - El usuario NO tiene el producto de la campaña en su carrito ya
  - La campaña no fue ya enviada a este usuario en los últimos 30 min (Redis: coupon_sent:userId:campaignId TTL 1800s)
  - El segmento del usuario está en el target_segments de la campaña

PASO 3 — Puntuar y seleccionar:
  - Ordenar campañas elegibles por (points_value DESC, segment_match_score DESC)
  - Seleccionar top 1 campaña

PASO 4 — Enviar:
  - Si hay usuario conectado vía WebSocket: pushCouponToUser() por WS
  - Simultáneamente: encolar Expo push notification (persistente)
  - Registrar el envío en Redis (coupon_sent:userId:campaignId TTL 1800s)
```

---

## 3.10 Organización del Código

```
smartcart/
└── backend/
    ├── src/
    │   ├── main.ts                     # Bootstrap NestJS
    │   ├── app.module.ts               # Root module
    │   ├── instrumentation.ts          # OpenTelemetry (pre-load)
    │   │
    │   ├── auth/                       # Módulo de autenticación
    │   │   ├── auth.module.ts
    │   │   ├── auth.controller.ts
    │   │   ├── auth.service.ts
    │   │   ├── strategies/
    │   │   │   ├── jwt.strategy.ts
    │   │   │   └── jwt-refresh.strategy.ts
    │   │   ├── guards/
    │   │   │   ├── jwt-auth.guard.ts
    │   │   │   └── roles.guard.ts
    │   │   └── decorators/
    │   │       ├── current-user.decorator.ts
    │   │       └── roles.decorator.ts
    │   │
    │   ├── products/
    │   │   ├── products.module.ts
    │   │   ├── products.controller.ts
    │   │   ├── products.service.ts
    │   │   └── repositories/
    │   │       └── product.repository.ts
    │   │
    │   ├── cart/
    │   ├── checkout/
    │   │   ├── checkout.module.ts
    │   │   ├── checkout.controller.ts
    │   │   ├── checkout.service.ts
    │   │   ├── factories/
    │   │   │   └── qr-token.factory.ts
    │   │   └── strategies/
    │   │       ├── fixed-points.strategy.ts
    │   │       └── multiplier.strategy.ts
    │   │
    │   ├── rewards/
    │   ├── notifications/
    │   ├── analytics/
    │   ├── campaigns/
    │   │
    │   ├── profiling/                  # IA Worker
    │   │   ├── profiling.module.ts
    │   │   ├── workers/
    │   │   │   └── profiling.worker.ts
    │   │   └── services/
    │   │       ├── profiling.service.ts
    │   │       └── ai-inference.service.ts
    │   │
    │   ├── infrastructure/             # Capa de infraestructura transversal
    │   │   ├── prisma/
    │   │   │   └── prisma.service.ts
    │   │   ├── redis/
    │   │   │   └── redis.service.ts
    │   │   ├── cache/
    │   │   │   └── cache.service.ts
    │   │   └── push/
    │   │       └── expo-push.adapter.ts
    │   │
    │   └── common/                     # Transversales sin dominio
    │       ├── filters/
    │       │   └── global-exception.filter.ts
    │       ├── interceptors/
    │       │   ├── logging.interceptor.ts
    │       │   └── response.interceptor.ts
    │       ├── middleware/
    │       │   └── request-id.middleware.ts
    │       └── pipes/
    │           └── zod-validation.pipe.ts
    │
    ├── prisma/
    │   ├── schema.prisma               # Definición del schema
    │   ├── migrations/                 # Migraciones generadas por Prisma Migrate
    │   └── seed.ts                     # Script de seeding
    │
    └── test/
        ├── unit/
        ├── integration/
        └── helpers/
            └── test-setup.ts
```

---

## 3.11 CI/CD Pipelines

```yaml
# .github/workflows/backend-ci.yml
name: Backend CI/CD
on: [push, pull_request]

jobs:
  quality:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16-alpine
        env: { POSTGRES_DB: smartcart_test, POSTGRES_PASSWORD: test }
        options: --health-cmd pg_isready
      redis:
        image: redis:7-alpine
        options: --health-cmd "redis-cli ping"

    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20', cache: 'npm' }
      - run: npm ci
      - run: npx tsc --noEmit                      # 1. Type checking
      - run: npx eslint src/ --max-warnings 0      # 2. Lint (0 warnings permitidos)
      - run: npx prisma migrate deploy             # 3. Migraciones en BD de test
        env: { DATABASE_URL: postgresql://postgres:test@localhost:5432/smartcart_test }
      - run: npm run test:unit -- --coverage       # 4. Unit tests
      - run: npm run test:integration              # 5. Integration tests
        env: { DATABASE_URL: postgresql://postgres:test@localhost:5432/smartcart_test, REDIS_URL: redis://localhost:6379 }
      - run: npx jest --coverage --coverageThreshold='{"global":{"lines":75}}'   # 6. Coverage gate

  build:
    needs: quality
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: docker build -t smartcart-backend:${{ github.sha }} .
      - run: docker run --rm aquasec/trivy image smartcart-backend:${{ github.sha }}  # 7. Escaneo de vulnerabilidades
      - uses: aws-actions/amazon-ecr-login@v2
      - run: docker tag smartcart-backend:${{ github.sha }} $ECR_REGISTRY/smartcart-backend:${{ github.sha }}
      - run: docker push $ECR_REGISTRY/smartcart-backend:${{ github.sha }}

  deploy-staging:
    needs: build
    if: github.ref == 'refs/heads/staging'
    runs-on: ubuntu-latest
    steps:
      - run: aws ecs update-service --cluster smartcart-staging --service backend --force-new-deployment
      - run: |
          # Esperar rollout y validar health check
          aws ecs wait services-stable --cluster smartcart-staging --services backend
          curl -f https://api-staging.smartcart.app/health

  deploy-production:
    needs: build
    if: github.ref == 'refs/heads/main'
    environment: production      # Requiere aprobación manual
    runs-on: ubuntu-latest
    steps:
      - run: |
          # Blue/Green deployment via AWS CodeDeploy
          aws deploy create-deployment \
            --application-name smartcart-backend \
            --deployment-group-name production \
            --image-uri $ECR_REGISTRY/smartcart-backend:${{ github.sha }}
```

### Quality Gates

| Gate | Umbral | Acción si falla |
|------|--------|----------------|
| TypeScript errors | 0 | Bloquea merge |
| ESLint warnings | 0 | Bloquea merge |
| Test coverage | 75% líneas | Bloquea merge |
| Trivy HIGH/CRITICAL vulns | 0 | Bloquea deploy |
| Health check post-deploy | HTTP 200 | Rollback automático |

---

## 3.12 Configuración por Ambiente

### `.env.development`

```env
NODE_ENV=development
PORT=3000
DATABASE_URL=postgresql://smartcart:dev_pass@localhost:5432/smartcart_dev
REDIS_URL=redis://localhost:6379
JWT_ACCESS_SECRET=dev_access_secret_must_be_at_least_32_chars_long
JWT_REFRESH_SECRET=dev_refresh_secret_must_be_at_least_32_chars
QR_SECRET=dev_qr_secret_must_be_at_least_32_chars_xx
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d
EXPO_ACCESS_TOKEN=dev_expo_token
AI_SERVICE_ENDPOINT=http://localhost:8080/ai
AI_SERVICE_API_KEY=dev_ai_key
```

### `.env.production` (valores inyectados por AWS Secrets Manager)

```env
NODE_ENV=production
PORT=3000
DATABASE_URL=${aws:secretsmanager:smartcart/prod/db-url}
REDIS_URL=${aws:secretsmanager:smartcart/prod/redis-url}
JWT_ACCESS_SECRET=${aws:secretsmanager:smartcart/prod/jwt-access}
JWT_REFRESH_SECRET=${aws:secretsmanager:smartcart/prod/jwt-refresh}
QR_SECRET=${aws:secretsmanager:smartcart/prod/qr-secret}
EXPO_ACCESS_TOKEN=${aws:secretsmanager:smartcart/prod/expo-token}
AI_SERVICE_ENDPOINT=https://bedrock.us-east-1.amazonaws.com
AI_SERVICE_API_KEY=${aws:secretsmanager:smartcart/prod/bedrock-key}
SENTRY_DSN=${aws:secretsmanager:smartcart/prod/sentry-dsn}
```

**Regla:** Los archivos `.env.*` nunca se commitean al repositorio. El `.gitignore` los excluye explícitamente. Solo `.env.example` (sin valores reales) vive en el repo.

---

## 3.13 Diseño de la Base de Datos

### Especificación en Markdown

```
## users
* user_id          UUID PK default gen_random_uuid()
* email            varchar(150) UNIQUE NOT NULL
* password_hash    varchar(255) NOT NULL
* first_name       varchar(100) NOT NULL
* last_name        varchar(100) NOT NULL
* phone            varchar(30)
* role             varchar(20) NOT NULL default 'consumer'   -- consumer, store_admin, brand_analyst, platform_admin
* enabled          boolean NOT NULL default true
* created_at       timestamptz NOT NULL default now()
* updated_at       timestamptz NOT NULL default now()
* checksum         bytea   -- integridad del registro

## organizations
* org_id           UUID PK default gen_random_uuid()
* org_name         varchar(150) NOT NULL
* org_type         varchar(30) NOT NULL   -- supermarket, brand
* tax_id           varchar(50) UNIQUE
* enabled          boolean NOT NULL default true
* created_at       timestamptz NOT NULL default now()
* checksum         bytea

## org_users
* org_user_id      UUID PK
* org_id           UUID FK → organizations
* user_id          UUID FK → users
* created_at       timestamptz

## stores
* store_id         UUID PK
* org_id           UUID FK → organizations
* store_name       varchar(150) NOT NULL
* address          varchar(300)
* city             varchar(100)
* latitude         decimal(10,7)
* longitude        decimal(10,7)
* enabled          boolean NOT NULL default true
* created_at       timestamptz NOT NULL default now()
* checksum         bytea

## product_categories
* category_id      UUID PK
* category_name    varchar(120) NOT NULL UNIQUE
* parent_id        UUID FK → product_categories (self-ref para jerarquía)
* created_at       timestamptz

## products
* product_id       UUID PK
* barcode          varchar(20) NOT NULL UNIQUE
* product_name     varchar(150) NOT NULL
* brand            varchar(100)
* category_id      UUID FK → product_categories
* description      nvarchar(500)
* image_url        varchar(500)   -- apunta a S3/CloudFront
* unit_price       decimal(12,2)
* enabled          boolean NOT NULL default true
* created_at       timestamptz NOT NULL default now()
* updated_at       timestamptz NOT NULL default now()
* checksum         bytea

## campaigns
* campaign_id      UUID PK
* org_id           UUID FK → organizations (la marca que patrocina)
* campaign_name    varchar(150) NOT NULL
* strategy_type    varchar(30) NOT NULL   -- fixed_points, multiplier, volume
* strategy_config  jsonb NOT NULL         -- { pointsPerUnit: 15 } o { spendPerPoint: 200 }
* target_segments  text[]                 -- segmentos de consumidor a los que aplica
* start_date       date NOT NULL
* end_date         date NOT NULL
* enabled          boolean NOT NULL default true
* created_at       timestamptz

## sponsored_products
* sponsored_id     UUID PK
* campaign_id      UUID FK → campaigns
* product_id       UUID FK → products
* store_id         UUID FK → stores
* active           boolean NOT NULL default true
* created_at       timestamptz

## refresh_tokens
* token_id         UUID PK
* user_id          UUID FK → users
* token_hash       varchar(255) NOT NULL UNIQUE   -- hash del refresh token (nunca plain)
* expires_at       timestamptz NOT NULL
* revoked          boolean NOT NULL default false
* created_at       timestamptz NOT NULL default now()
* ip_address       varchar(45)
* user_agent       varchar(300)

## push_tokens
* push_token_id    UUID PK
* user_id          UUID FK → users
* expo_token       varchar(200) NOT NULL
* platform         varchar(10) NOT NULL   -- ios, android
* active           boolean NOT NULL default true
* created_at       timestamptz

## carts
* cart_id          UUID PK
* user_id          UUID FK → users
* store_id         UUID FK → stores
* status           varchar(30) NOT NULL default 'active'   -- active, pending_checkout, completed, abandoned
* created_at       timestamptz NOT NULL default now()
* updated_at       timestamptz NOT NULL default now()

## cart_items
* cart_item_id     UUID PK
* cart_id          UUID FK → carts
* product_id       UUID FK → products
* quantity         int NOT NULL default 1
* unit_price       decimal(12,2) NOT NULL   -- precio al momento del escaneo (snapshot)
* sponsored_id     UUID FK → sponsored_products NULL   -- si aplica campaña
* scanned_at       timestamptz NOT NULL default now()

## transactions
* transaction_id   UUID PK
* cart_id          UUID FK → carts UNIQUE   -- 1 carrito → 1 transacción
* user_id          UUID FK → users
* store_id         UUID FK → stores
* total_amount     decimal(12,2) NOT NULL
* total_points     int NOT NULL default 0
* qr_token_hash    varchar(255) NOT NULL   -- hash del QR usado para validar
* status           varchar(30) NOT NULL default 'completed'
* confirmed_at     timestamptz NOT NULL default now()
* confirmed_by     varchar(100)   -- ID/nombre de la cajera que validó
* checksum         bytea

## transaction_items
* tx_item_id       UUID PK
* transaction_id   UUID FK → transactions
* product_id       UUID FK → products
* quantity         int NOT NULL
* unit_price       decimal(12,2) NOT NULL
* subtotal         decimal(12,2) NOT NULL
* points_earned    int NOT NULL default 0
* campaign_id      UUID FK → campaigns NULL

## points_ledger
* ledger_id        UUID PK
* user_id          UUID FK → users
* amount           int NOT NULL            -- positivo=crédito, negativo=débito
* ledger_type      varchar(30) NOT NULL    -- purchase_credit, reward_redemption, expiration, adjustment
* reference_id     UUID                    -- transaction_id o redemption_id
* balance_after    int NOT NULL
* created_at       timestamptz NOT NULL default now()
* notes            varchar(300)
-- APPEND ONLY: nunca UPDATE ni DELETE en esta tabla

## rewards
* reward_id        UUID PK
* reward_name      varchar(150) NOT NULL
* description      nvarchar(500)
* image_url        varchar(500)
* points_cost      int NOT NULL
* reward_type      varchar(30) NOT NULL   -- discount_pct, free_product, cashback
* reward_config    jsonb                  -- { discountPct: 10 } etc.
* stock            int                    -- NULL = ilimitado
* enabled          boolean NOT NULL default true
* expires_at       date
* created_at       timestamptz

## reward_redemptions
* redemption_id    UUID PK
* user_id          UUID FK → users
* reward_id        UUID FK → rewards
* points_spent     int NOT NULL
* redeemed_at      timestamptz NOT NULL default now()
* status           varchar(30) NOT NULL default 'pending'   -- pending, used, expired
* used_at          timestamptz

## consumer_profiles
* profile_id       UUID PK
* user_id          UUID FK → users UNIQUE
* segment          varchar(50)            -- budget_conscious, organic_premium, etc.
* confidence       decimal(4,3)           -- 0.000 – 1.000
* traits           text[]
* category_frequency jsonb               -- { "lácteos": 12, "bebidas": 8 }
* avg_ticket       decimal(12,2)
* avg_purchase_hour decimal(4,2)
* weekly_frequency  decimal(4,2)
* organic_ratio    decimal(4,3)
* updated_at       timestamptz NOT NULL default now()

## behavioral_events
* event_id         UUID PK
* user_id          UUID FK → users
* event_type       varchar(50) NOT NULL   -- product_scan, checkout_complete, location_update
* store_id         UUID FK → stores NULL
* payload          jsonb NOT NULL
* occurred_at      timestamptz NOT NULL default now()
-- Tabla de alta escritura; candidata a particionamiento por occurred_at

## audit_log
* audit_id         UUID PK
* user_id          UUID NULL
* action           varchar(100) NOT NULL   -- user.login, checkout.confirm, reward.redeem
* resource_type    varchar(50)
* resource_id      UUID
* ip_address       varchar(45)
* user_agent       varchar(300)
* old_value        jsonb
* new_value        jsonb
* occurred_at      timestamptz NOT NULL default now()
-- APPEND ONLY: nunca UPDATE ni DELETE
```

---

## 3.14 Agente de Revisión del Diseño de Base de Datos

El siguiente prompt se usa con una IA para revisar el diseño antes de generar las migraciones:

```
## AI Agent Instructions: SmartCart Database Model Review

### Objective
Analiza el diseño de la base de datos definido en Markdown DML para SmartCart — una plataforma
de perfilamiento predictivo y fidelización de consumidores. Produce observaciones constructivas
sobre posibles problemas, omisiones y oportunidades de mejora. Enfócate en:
calidad del diseño, escalabilidad, mantenibilidad e integridad de datos.

### Context
SmartCart tiene dos tipos de usuarios: consumidores (app móvil) y usuarios B2B (dashboard).
Las tablas más críticas en términos de rendimiento son:
  - products (alta lectura, lookup por barcode)
  - cart_items (alta escritura durante horario de tiendas)
  - points_ledger (append-only, nunca debe modificarse)
  - behavioral_events (muy alta escritura, candidata a particionamiento)
  - transactions (consistencia ACID crítica)

### Review Dimensions

1. Missing Common Business Fields
   Evalúa si falta contexto de negocio típico. Sugiere campos que serían útiles para
   el problema de SmartCart (fidelización, análisis de comportamiento, B2B SaaS).

2. Static vs Historical Data Mixing
   Identifica casos donde datos que cambian (precios, configuraciones de campaña) están
   mezclados con datos estáticos. Sugiere tablas de historial donde aplique.

3. Repeated String Values (Normalization)
   Detecta campos de tipo string que se repetirían masivamente y sugiere tablas de referencia.

4. Hardcoded / Non-Scalable Design
   Identifica estructuras que solo funcionan para casos fijos.

5. Storage of Large Binary Data
   Detecta campos que almacenan binarios grandes directamente en la BD.

6. Ambiguous Field Names
   Marca campos vagos sin significado de negocio claro.

7. Incorrect Cardinality
   Revisa relaciones FK y detecta inconsistencias de cardinalidad.

8. Inconsistent Naming
   Identifica el mismo concepto con nombres distintos entre tablas.

9. Performance Hotspots
   Para tablas de alta escritura (behavioral_events, cart_items): sugiere índices, 
   particionamiento, o estrategias de archiving.

10. Security & Compliance
    Verifica que PII (email, nombre, teléfono) tenga consideraciones de cifrado o anonimización.
    Verifica presencia de campos de auditoría en tablas críticas.

### Output Format
Por cada observación:
  - **Tabla:** nombre
  - **Observación:** descripción clara del problema potencial
  - **Sugerencia:** acción concreta a evaluar
  - **Impacto:** Alto / Medio / Bajo
```

---

## 3.15 DBML (Database Markup Language)

```dbml
// SmartCart — Database Schema
// Motor: PostgreSQL 16
// Generado para: https://dbdiagram.io

Table users {
  user_id    uuid [pk, default: `gen_random_uuid()`]
  email      varchar(150) [unique, not null]
  password_hash varchar(255) [not null]
  first_name varchar(100) [not null]
  last_name  varchar(100) [not null]
  phone      varchar(30)
  role       varchar(20) [not null, default: 'consumer']
  enabled    boolean [not null, default: true]
  created_at timestamptz [not null, default: `now()`]
  updated_at timestamptz [not null, default: `now()`]
  checksum   bytea
}

Table organizations {
  org_id    uuid [pk, default: `gen_random_uuid()`]
  org_name  varchar(150) [not null]
  org_type  varchar(30) [not null]
  tax_id    varchar(50) [unique]
  enabled   boolean [not null, default: true]
  created_at timestamptz [not null, default: `now()`]
  checksum  bytea
}

Table org_users {
  org_user_id uuid [pk]
  org_id      uuid [ref: > organizations.org_id]
  user_id     uuid [ref: > users.user_id]
  created_at  timestamptz
}

Table stores {
  store_id   uuid [pk, default: `gen_random_uuid()`]
  org_id     uuid [ref: > organizations.org_id]
  store_name varchar(150) [not null]
  address    varchar(300)
  city       varchar(100)
  latitude   decimal(10,7)
  longitude  decimal(10,7)
  enabled    boolean [not null, default: true]
  created_at timestamptz [not null, default: `now()`]
  checksum   bytea
}

Table product_categories {
  category_id   uuid [pk, default: `gen_random_uuid()`]
  category_name varchar(120) [not null, unique]
  parent_id     uuid [ref: > product_categories.category_id]
  created_at    timestamptz
}

Table products {
  product_id   uuid [pk, default: `gen_random_uuid()`]
  barcode      varchar(20) [unique, not null]
  product_name varchar(150) [not null]
  brand        varchar(100)
  category_id  uuid [ref: > product_categories.category_id]
  description  varchar(500)
  image_url    varchar(500)
  unit_price   decimal(12,2)
  enabled      boolean [not null, default: true]
  created_at   timestamptz [not null, default: `now()`]
  updated_at   timestamptz [not null, default: `now()`]
  checksum     bytea
}

Table campaigns {
  campaign_id     uuid [pk, default: `gen_random_uuid()`]
  org_id          uuid [ref: > organizations.org_id]
  campaign_name   varchar(150) [not null]
  strategy_type   varchar(30) [not null]
  strategy_config jsonb [not null]
  target_segments text[]
  start_date      date [not null]
  end_date        date [not null]
  enabled         boolean [not null, default: true]
  created_at      timestamptz
}

Table sponsored_products {
  sponsored_id uuid [pk, default: `gen_random_uuid()`]
  campaign_id  uuid [ref: > campaigns.campaign_id]
  product_id   uuid [ref: > products.product_id]
  store_id     uuid [ref: > stores.store_id]
  active       boolean [not null, default: true]
  created_at   timestamptz
}

Table refresh_tokens {
  token_id    uuid [pk, default: `gen_random_uuid()`]
  user_id     uuid [ref: > users.user_id]
  token_hash  varchar(255) [unique, not null]
  expires_at  timestamptz [not null]
  revoked     boolean [not null, default: false]
  created_at  timestamptz [not null, default: `now()`]
  ip_address  varchar(45)
  user_agent  varchar(300)
}

Table push_tokens {
  push_token_id uuid [pk]
  user_id       uuid [ref: > users.user_id]
  expo_token    varchar(200) [not null]
  platform      varchar(10) [not null]
  active        boolean [not null, default: true]
  created_at    timestamptz
}

Table carts {
  cart_id    uuid [pk, default: `gen_random_uuid()`]
  user_id    uuid [ref: > users.user_id]
  store_id   uuid [ref: > stores.store_id]
  status     varchar(30) [not null, default: 'active']
  created_at timestamptz [not null, default: `now()`]
  updated_at timestamptz [not null, default: `now()`]
}

Table cart_items {
  cart_item_id uuid [pk, default: `gen_random_uuid()`]
  cart_id      uuid [ref: > carts.cart_id]
  product_id   uuid [ref: > products.product_id]
  quantity     int [not null, default: 1]
  unit_price   decimal(12,2) [not null]
  sponsored_id uuid [ref: > sponsored_products.sponsored_id]
  scanned_at   timestamptz [not null, default: `now()`]
}

Table transactions {
  transaction_id  uuid [pk, default: `gen_random_uuid()`]
  cart_id         uuid [ref: - carts.cart_id, unique]
  user_id         uuid [ref: > users.user_id]
  store_id        uuid [ref: > stores.store_id]
  total_amount    decimal(12,2) [not null]
  total_points    int [not null, default: 0]
  qr_token_hash   varchar(255) [not null]
  status          varchar(30) [not null, default: 'completed']
  confirmed_at    timestamptz [not null, default: `now()`]
  confirmed_by    varchar(100)
  checksum        bytea
}

Table transaction_items {
  tx_item_id      uuid [pk, default: `gen_random_uuid()`]
  transaction_id  uuid [ref: > transactions.transaction_id]
  product_id      uuid [ref: > products.product_id]
  quantity        int [not null]
  unit_price      decimal(12,2) [not null]
  subtotal        decimal(12,2) [not null]
  points_earned   int [not null, default: 0]
  campaign_id     uuid [ref: > campaigns.campaign_id]
}

Table points_ledger {
  ledger_id     uuid [pk, default: `gen_random_uuid()`]
  user_id       uuid [ref: > users.user_id]
  amount        int [not null]
  ledger_type   varchar(30) [not null]
  reference_id  uuid
  balance_after int [not null]
  created_at    timestamptz [not null, default: `now()`]
  notes         varchar(300)

  Note: 'APPEND ONLY — no UPDATE, no DELETE allowed'
}

Table rewards {
  reward_id    uuid [pk, default: `gen_random_uuid()`]
  reward_name  varchar(150) [not null]
  description  varchar(500)
  image_url    varchar(500)
  points_cost  int [not null]
  reward_type  varchar(30) [not null]
  reward_config jsonb
  stock        int
  enabled      boolean [not null, default: true]
  expires_at   date
  created_at   timestamptz
}

Table reward_redemptions {
  redemption_id uuid [pk, default: `gen_random_uuid()`]
  user_id       uuid [ref: > users.user_id]
  reward_id     uuid [ref: > rewards.reward_id]
  points_spent  int [not null]
  redeemed_at   timestamptz [not null, default: `now()`]
  status        varchar(30) [not null, default: 'pending']
  used_at       timestamptz
}

Table consumer_profiles {
  profile_id         uuid [pk, default: `gen_random_uuid()`]
  user_id            uuid [ref: - users.user_id, unique]
  segment            varchar(50)
  confidence         decimal(4,3)
  traits             text[]
  category_frequency jsonb
  avg_ticket         decimal(12,2)
  avg_purchase_hour  decimal(4,2)
  weekly_frequency   decimal(4,2)
  organic_ratio      decimal(4,3)
  updated_at         timestamptz [not null, default: `now()`]
}

Table behavioral_events {
  event_id     uuid [pk, default: `gen_random_uuid()`]
  user_id      uuid [ref: > users.user_id]
  event_type   varchar(50) [not null]
  store_id     uuid [ref: > stores.store_id]
  payload      jsonb [not null]
  occurred_at  timestamptz [not null, default: `now()`]

  Note: 'Alta escritura — particionar por occurred_at (mensual)'
}

Table audit_log {
  audit_id       uuid [pk, default: `gen_random_uuid()`]
  user_id        uuid
  action         varchar(100) [not null]
  resource_type  varchar(50)
  resource_id    uuid
  ip_address     varchar(45)
  user_agent     varchar(300)
  old_value      jsonb
  new_value      jsonb
  occurred_at    timestamptz [not null, default: `now()`]

  Note: 'APPEND ONLY — no UPDATE, no DELETE allowed'
}
```

---

## 3.16 Scripts de Base de Datos

### Script de creación con índices

```sql
-- /prisma/sql/01_indexes.sql
-- Ejecutado después de las migraciones de Prisma

-- Búsqueda de producto por barcode (path crítico del escaneo)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_barcode
  ON products(barcode);

-- Historial de puntos por usuario ordenado por fecha
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_points_ledger_user_date
  ON points_ledger(user_id, created_at DESC);

-- Carrito activo del usuario en una tienda
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_carts_user_store_status
  ON carts(user_id, store_id, status)
  WHERE status = 'active';

-- Eventos de comportamiento por usuario y fecha (para el pipeline de IA)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_behavioral_events_user_date
  ON behavioral_events(user_id, occurred_at DESC);

-- Productos patrocinados activos por tienda (para el lobby)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sponsored_active_store
  ON sponsored_products(store_id, active)
  WHERE active = true;

-- Refresh tokens no revocados por usuario
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_refresh_tokens_user_valid
  ON refresh_tokens(user_id, revoked, expires_at)
  WHERE revoked = false;

-- Particionamiento de behavioral_events por mes (PostgreSQL 16)
-- Se ejecuta manualmente al crear la tabla; Prisma no gestiona particiones nativas
ALTER TABLE behavioral_events
  PARTITION BY RANGE (occurred_at);

CREATE TABLE behavioral_events_2025_01
  PARTITION OF behavioral_events
  FOR VALUES FROM ('2025-01-01') TO ('2025-02-01');
-- (Crear particiones adicionales con el cron job de mantenimiento mensual)
```

### Script de Seeding (`/prisma/seed.ts`)

```ts
// /prisma/seed.ts
import { PrismaClient } from '@prisma/client';
import { hash } from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  // Organización de ejemplo
  const org = await prisma.organization.upsert({
    where: { taxId: '3-101-123456' },
    update: {},
    create: { orgName: 'Super Buen Precio', orgType: 'supermarket', taxId: '3-101-123456' },
  });

  // Tienda de ejemplo
  const store = await prisma.store.upsert({
    where: { storeId: 'seed-store-curridabat' },
    update: {},
    create: {
      storeId: 'seed-store-curridabat',
      orgId: org.orgId,
      storeName: 'Super Buen Precio — Curridabat',
      city: 'Curridabat',
      latitude: 9.9355,
      longitude: -84.0495,
    },
  });

  // Usuario consumidor de prueba
  await prisma.user.upsert({
    where: { email: 'juan.consumer@test.com' },
    update: {},
    create: {
      email: 'juan.consumer@test.com',
      passwordHash: await hash('Test1234!', 10),
      firstName: 'Juan',
      lastName: 'Consumer',
      role: 'consumer',
    },
  });

  // Categorías de productos
  const categories = ['Bebidas', 'Lácteos', 'Panadería', 'Snacks', 'Orgánicos'];
  for (const name of categories) {
    await prisma.productCategory.upsert({
      where: { categoryName: name }, update: {}, create: { categoryName: name },
    });
  }

  console.log('✅ Seed completado');
}

main().finally(() => prisma.$disconnect());
```

### Migraciones con Prisma Migrate

```bash
# Crear migración nueva (desarrollo)
npx prisma migrate dev --name add_consumer_profiles

# Aplicar migraciones en producción (CI/CD)
npx prisma migrate deploy

# Rollback: Prisma no soporta rollback automático.
# Estrategia: crear una nueva migración que revierta los cambios.
# Ejemplo de rollback manual:
npx prisma migrate dev --name rollback_consumer_profiles
# Dentro de la migración: DROP TABLE IF EXISTS consumer_profiles;
```

### Versionamiento y Rollback

- Las migraciones son archivos SQL con nombre `{timestamp}_{nombre}.sql`, versionados en Git junto con el código.
- En producción, `prisma migrate deploy` aplica solo las migraciones pendientes de forma incremental.
- El rollback se realiza creando una migración inversa, nunca modificando una migración ya aplicada.
- Antes de cada deployment en producción, el CI hace un backup automático via `pg_dump` y lo sube a S3.

---

## 3.17 Seguridad de Datos

### Cifrado

- **En tránsito:** TLS 1.3 obligatorio en todas las conexiones (ALB → backend, backend → RDS). La URL de PostgreSQL incluye `sslmode=require`.
- **En reposo:** RDS usa cifrado AES-256 habilitado con AWS KMS. ElastiCache usa cifrado en reposo habilitado. S3 usa SSE-S3 por defecto.
- **Campos sensibles:** `password_hash` usa bcrypt con salt factor 10. Los `refresh_tokens` se almacenan como hash SHA-256, nunca como valor plano. El campo `checksum` en tablas críticas (transactions, users) es un HMAC del registro completo para detectar manipulación directa en BD.

### Auditoría y Trazabilidad

Toda acción sensible escribe en `audit_log` de forma automática via un interceptor NestJS:

```ts
// /src/common/interceptors/audit.interceptor.ts
@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(private readonly auditRepo: AuditRepository) {}

  async intercept(context: ExecutionContext, next: CallHandler) {
    const request = context.switchToHttp().getRequest();
    const auditAction = Reflect.getMetadata('audit_action', context.getHandler());

    if (!auditAction) return next.handle();

    return next.handle().pipe(
      tap(async (responseData) => {
        await this.auditRepo.log({
          userId: request.user?.sub,
          action: auditAction,
          resourceType: request.params?.resource,
          resourceId: request.params?.id,
          ipAddress: request.ip,
          userAgent: request.headers['user-agent'],
          newValue: responseData,
        });
      }),
    );
  }
}

// Uso en controlador:
@Post(':id/redeem')
@Audit('reward.redeem')   // Decorador custom
async redeemReward(...) { ... }
```

### Manejo de Secretos

- **Desarrollo:** Variables en `.env.development` (no commitadas al repo).
- **Producción:** AWS Secrets Manager. El contenedor ECS recibe los secrets como variables de entorno inyectadas en tiempo de arranque por la task definition. El código en producción nunca lee archivos `.env`.
- **Rotación:** Los JWT secrets se rotan trimestralmente. Al rotar, se incrementa la versión en Secrets Manager y se hace un rolling deployment para que los tokens emitidos con la versión anterior sigan siendo válidos durante 24h.

### Backups y Recuperación

| Tipo | Frecuencia | Retención | Destino |
|------|-----------|-----------|---------|
| RDS automated backup | Diario | 7 días (dev) / 30 días (prod) | AWS Backup |
| RDS snapshot manual | Antes de cada deployment | 90 días | AWS S3 |
| pg_dump (CI pre-deploy) | Cada deployment | 14 días | S3 bucket privado |
| ElastiCache snapshot | Diario | 7 días | AWS Backup |

**RTO (Recovery Time Objective):** < 1 hora para producción con RDS Multi-AZ failover automático.  
**RPO (Recovery Point Objective):** < 5 minutos para producción con RDS con backup continuo de transaction logs.

### Row-Level Security en PostgreSQL

Para aislar datos entre organizaciones en el módulo B2B:

```sql
-- Habilitar RLS en tablas con datos multi-tenant
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;

-- Política: cada org solo ve sus propias campañas
CREATE POLICY campaigns_org_isolation ON campaigns
  FOR ALL
  USING (org_id = current_setting('app.current_org_id')::uuid);

-- El backend inyecta el org_id del usuario autenticado al inicio de cada query:
-- SET LOCAL app.current_org_id = 'uuid-de-la-org';
```

---

## 3.18 Tamaño de Artefactos y Eficiencia

### Imagen Docker optimizada

```dockerfile
# /Dockerfile — Multi-stage build
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npx prisma generate
RUN npm run build    # tsc → /dist

FROM node:20-alpine AS production
WORKDIR /app
# Solo copiar el output compilado y node_modules de producción
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma

# Ejecutar como usuario no-root
RUN addgroup -g 1001 -S nodejs && adduser -S nestjs -u 1001
USER nestjs

EXPOSE 3000
CMD ["node", "dist/main.js"]
```

**Resultado:** Imagen final ~180 MB vs ~500 MB con build completo. No incluye TypeScript, fuentes `.ts`, ni devDependencies.

**Reglas:**
1. Alpine como base (vs Debian slim).
2. `npm ci --only=production` excluye devDependencies.
3. `.dockerignore` excluye `node_modules/`, `src/`, `test/`, `.env*`, `*.md`.
4. El `Prisma Client` se genera durante el build (no en runtime).
