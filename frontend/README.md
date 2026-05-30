# SmartCart — Frontend (Caso #2, Fase 2: Diseño del Frontend)

Aplicación web **mobile-first** que implementa el flujo de lealtad de SmartCart:
escanear productos patrocinados → acumular puntos pendientes → generar un QR →
validarlo en caja (POS) → recibir puntos acreditados → canjear recompensas.

Es un **MVP funcional** construido a partir de los mockups de Figma
(`../DesignContext/figmaScreens/`), con datos simulados (mock) en lugar de un
backend real (que corresponde a la Fase 3). El código de patrones de diseño,
manejo de estado, seguridad y pruebas es **real y ejecutable**.

> Demo: la app corre en un marco de teléfono 360×720; en pantallas pequeñas
> (móvil real) ocupa toda la ventana.

---

## 1. Stack tecnológico

| Concern | Elección | Versión | Justificación |
|---|---|---|---|
| Tipo de app | Web SPA mobile-first | — | Demo por URL en aula (sin emuladores); deploy a Vercel; los mockups ya son HTML/CSS web |
| Librería UI | **React** | ^18.3 | Estándar, ecosistema, `lazy`/`Suspense` para code splitting |
| Build/dev | **Vite** | ^5.4 | Dev server y HMR rápidos, build optimizado, code splitting por ruta |
| Lenguaje | **TypeScript** (strict) | ^5.5 | Seguridad de tipos de extremo a extremo (dominio → UI) |
| Estado | **Zustand** | ^4.5 | Ligero, sin boilerplate, suscripciones finas (Observer) |
| Routing | **React Router** | ^6.26 | Rutas declarativas + carga perezosa por ruta |
| Estilos | **CSS Modules + design tokens** | — | Migración fiel de los mockups, scoping automático, tokens documentables |
| Íconos | **Font Awesome** (empaquetado) | ^6.6 | Bundled localmente (funciona offline, sin depender de un CDN) |
| Test unit/comp | **Vitest + Testing Library** | ^2.1 / ^16 | Integración nativa con Vite; tests de comportamiento |
| Test E2E | **Playwright** | ^1.47 | Smoke del flujo principal en navegador real |
| Calidad | **ESLint 9 + Prettier** | ^9 / ^3.3 | Análisis estático + formato consistente |
| CI/CD | **GitHub Actions** | — | Lint → typecheck → test → build → e2e |
| Hosting | **Vercel** | — | Deploy automático en `main` + preview por PR |

---

## 2. Cómo ejecutar

El gestor de paquetes es **pnpm** (ver `packageManager` en `package.json`).

```bash
cd frontend
pnpm install
pnpm dev              # servidor de desarrollo (http://localhost:5173)
pnpm build            # build de producción (tsc -b + vite build)
pnpm preview          # sirve el build
pnpm lint             # ESLint
pnpm typecheck        # tsc -b (sin emitir)
pnpm test             # Vitest (unit + componentes)
pnpm test:coverage
pnpm test:e2e         # Playwright (levanta la app en :5180)
```

---

## 3. Estructura del proyecto (diseño por capas)

```text
src/
├── main.tsx, App.tsx          # entrada + inicialización (sesión/ubicación)
├── router/                    # rutas + carga perezosa (code splitting)
├── pages/                     # PRESENTACIÓN — una página por pantalla
├── components/
│   ├── ui/                    # primitivos (Button, Card, Pill, Icon, Toast, ProgressBar…)
│   ├── layout/                # PhoneShell, TopBar, BottomNav, ToastHost
│   └── domain/                # componentes con semántica de negocio
├── store/                     # ESTADO (Zustand): session, points, rewards, auth, selectors
├── domain/                    # DOMINIO/APLICACIÓN (sin React)
│   ├── models/types.ts        # contrato único de tipos e interfaces
│   ├── states/ commands/ strategies/ decorators/ factories/ validation/ events/
├── services/                  # DATOS — capa mock (interfaces listas para la Fase 3)
├── hooks/                     # puente UI ↔ estado/dominio
├── styles/                    # tokens.css, global.css, animations.css
├── config/ utils/ test/
```

La dependencia siempre apunta hacia adentro: **Presentación → Estado → Dominio → Datos**.
El dominio no conoce React; los servicios exponen las mismas interfaces que tendrá
el backend en la Fase 3, por lo que migrar de mock a HTTP es sustituir la implementación.

---

## 4. Sistema de diseño (design tokens)

Todos los colores, tipografías, radios y espaciados se extrajeron 1:1 de los
mockups y viven como variables CSS en [`src/styles/tokens.css`](src/styles/tokens.css)
(prefijo `--sc-`). Ningún componente hardcodea valores; todo consume `var(--sc-…)`.

- Verde de marca `--sc-color-primary: #1D9E75`
- Fondo app `--sc-color-bg-app`, superficies, bordes, estados (pendiente, danger)
- Gradientes de recompensa (discount/coffee/store/premium)
- Escala tipográfica (`--sc-fs-*`), radios (`--sc-radius-*`), espaciado (`--sc-sp-*`)
- Marco del teléfono (`--sc-phone-w/h`)

---

## 5. Manejo de estado

Estado global con **Zustand** en [`src/store/`](src/store/), dividido por dominio:

- [`sessionStore.ts`](src/store/sessionStore.ts) — sesión de compra (productos, estado, QR).
- [`pointsStore.ts`](src/store/pointsStore.ts) — saldo de puntos y meta de canje.
- [`rewardsStore.ts`](src/store/rewardsStore.ts) — catálogo y cupones canjeados.
- [`authStore.ts`](src/store/authStore.ts) — sesión de usuario (JWT mock).
- [`selectors.ts`](src/store/selectors.ts) — selectores puros (suscripción fina = Observer).

Los hooks de [`src/hooks/`](src/hooks/) conectan la UI con el estado y orquestan
el dominio (p. ej. [`useScanner.ts`](src/hooks/useScanner.ts) combina Strategy +
Chain of Responsibility + Command + Observer).

---

## 6. Patrones de diseño (GoF) — con código real

| Patrón | Rol en SmartCart | Implementación |
|---|---|---|
| **State** | Estados discretos de la sesión (empty, scanning, withProducts, validating, confirmed) gobiernan qué puede hacer la UI | [`src/domain/states/`](src/domain/states/) + [`sessionStore.ts`](src/store/sessionStore.ts) |
| **Singleton** | Una sola sesión de compra activa por usuario | [`src/store/sessionStore.ts`](src/store/sessionStore.ts) |
| **Observer** | Al escanear, varios componentes reaccionan (Toast, lista, puntos) sin acoplarse | [`src/domain/events/EventBus.ts`](src/domain/events/EventBus.ts) + selectores de Zustand |
| **Command** | Acciones reversibles (agregar/eliminar producto, generar QR, canjear) con undo | [`src/domain/commands/`](src/domain/commands/) |
| **Strategy** | Captura de barcode intercambiable: cámara vs ingreso manual | [`src/domain/strategies/`](src/domain/strategies/) |
| **Decorator** | Estados visuales de producto (patrocinado/nuevo/validado) y bloqueo de recompensa | [`src/domain/decorators/`](src/domain/decorators/) |
| **Factory Method** | Creación de recompensas por tipo (descuento, 2x1, categoría, bono, premium) | [`src/domain/factories/RewardFactory.ts`](src/domain/factories/RewardFactory.ts) |
| **Chain of Responsibility** | Pipeline de validación del escaneo: ubicación → formato → patrocinado → duplicado | [`src/domain/validation/`](src/domain/validation/) |
| **Adapter / Proxy** | (Backend, Fase 3) integración con distintos POS y validación segura del QR. El servicio mock ya respeta esa interfaz | [`src/services/QrValidationService.ts`](src/services/QrValidationService.ts) |

---

## 7. Routing y navegación

Rutas con carga perezosa (`React.lazy`) en [`src/router/routes.tsx`](src/router/routes.tsx),
constantes en [`src/router/paths.ts`](src/router/paths.ts):

| Ruta | Pantalla |
|---|---|
| `/` | Home (vacío / 1 / 3+ productos según el estado) |
| `/scan` · `/scan/manual` | Cámara · ingreso manual EAN-13 |
| `/qr` · `/confirmation` | Validación QR · confirmación de puntos |
| `/rewards` · `/profile` | Recompensas · perfil |

---

## 8. Seguridad

- **Autenticación mock con JWT**: [`AuthService`](src/services/AuthService.ts) genera un
  token firmado simulado con `exp`; [`authStore`](src/store/authStore.ts) lo persiste en
  **`sessionStorage`** (no `localStorage`) y valida expiración (`checkSession`).
- **Cliente HTTP con interceptor**: [`apiClient`](src/services/http/apiClient.ts) inyecta
  `Authorization: Bearer` y maneja `401` (gancho de logout). Listo para la Fase 3.
- **Validación de entrada**: el barcode se valida (EAN-13, 13 dígitos) en
  [`BarcodeFormatHandler`](src/domain/validation/BarcodeFormatHandler.ts) antes de procesarse.
- **Sin secretos en el código**: configuración vía `import.meta.env` (ver `.env.example`).
- **Mapa OWASP**: A01 (control de acceso → guardas de ruta + RBAC futuro), A07
  (fallas de autenticación → expiración/validación de token).

---

## 9. Performance

- **Code splitting por ruta** (`React.lazy` + `Suspense`): cada pantalla es un chunk
  independiente (verificable en el output de `npm run build`).
- **Suscripciones finas** de Zustand vía selectores: cada componente re-renderiza solo
  ante el cambio que le afecta.
- **Servicios asíncronos** con cancelación (`AbortController`) en el polling del QR.
- Font Awesome empaquetado (sin bloqueo por CDN).

---

## 10. Estrategia de pruebas

- **Unitarias (Vitest)** sobre el dominio: comandos (incl. undo), transiciones de estado,
  cadena de validación, factory y decoradores; y sobre los stores (incl. la **idempotencia
  de la acreditación de puntos**).
- **Componentes (Testing Library)**: `ProductListItem`, `PointsCard`, `RewardCard`, `Toast`.
- **E2E (Playwright)**: smoke del flujo principal (escanear → QR → validar → confirmación)
  en [`e2e/main-flow.spec.ts`](e2e/main-flow.spec.ts).

```bash
npm run test            # unit + componentes
npm run test:coverage   # con cobertura
npm run test:e2e        # smoke en navegador
```

---

## 11. CI/CD y despliegue

[`.github/workflows/ci.yml`](../.github/workflows/ci.yml) ejecuta en cada push/PR a `main`:
`install → lint → typecheck → test (coverage) → build`, y un job de **E2E** con Playwright.
El despliegue se realiza en **Vercel** (producción en `main`, preview por PR).

---

## 12. Capa de datos mock → backend (Fase 3)

Los servicios de [`src/services/`](src/services/) devuelven datos simulados desde
[`src/services/mock/db.ts`](src/services/mock/db.ts) con latencia simulada. Sus
**interfaces son idénticas** a las del backend futuro: en la Fase 3 se sustituye la
implementación por llamadas con [`apiClient`](src/services/http/apiClient.ts) sin tocar
componentes ni stores. La validación del QR (`QrValidationService.awaitValidation`)
simula la confirmación del POS y respeta el contrato del futuro `QRValidationProxy`/`IPOSAdapter`.

---

## 13. Limitaciones conocidas / próximos pasos

- Cámara y GPS están **simulados** (patrón Strategy listo para enchufar `getUserMedia` + lector real).
- Sin backend: puntos/sesión viven en memoria (se reinician al recargar).
- Pantalla de Perfil es un placeholder.
- Próximo: conectar servicios reales (Fase 3), pantalla de login, internacionalización.
