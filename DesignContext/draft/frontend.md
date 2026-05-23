# SmartCart — Frontend Design Document

> **Proyecto:** SmartCart — Asistente de compras inteligente con perfilamiento predictivo  
> **Materia:** Diseño de Software  
> **Versión del documento:** 1.0  

---

## Índice

1. [Technology Stack](#1-technology-stack)
2. [Hosting y Cloud Services](#2-hosting-y-cloud-services)
3. [Estructura del Proyecto](#3-estructura-del-proyecto)
4. [Componentes Visuales y Estructura en Código](#4-componentes-visuales-y-estructura-en-código)
5. [Convenciones de Nomenclatura](#5-convenciones-de-nomenclatura)
6. [Lineamientos de CSS y Estilos](#6-lineamientos-de-css-y-estilos)
7. [Prototipado y UX Testing](#7-prototipado-y-ux-testing)
8. [Autenticación y Autorización](#8-autenticación-y-autorización)
9. [Seguridad (OWASP)](#9-seguridad-owasp)
10. [Patrones Arquitectónicos](#10-patrones-arquitectónicos)
11. [Patrones de Diseño](#11-patrones-de-diseño)
12. [Manejo de Estado y Almacenamiento](#12-manejo-de-estado-y-almacenamiento)
13. [Consumo de APIs y Contratos de Datos](#13-consumo-de-apis-y-contratos-de-datos)
14. [CI/CD](#14-cicd)
15. [Estrategias de Testing](#15-estrategias-de-testing)
16. [Diagramas de Arquitectura](#16-diagramas-de-arquitectura)
17. [Optimización de Rendimiento](#17-optimización-de-rendimiento)

---

## 1. Technology Stack

| Tecnología | Versión | Propósito | Justificación |
|---|---|---|---|
| **React Native** | 0.76.x | Framework de desarrollo mobile (iOS y Android) | Permite desarrollo multiplataforma con una sola base de código TypeScript/JavaScript. La app necesita acceso a cámara (escaneo de códigos de barras), geolocalización (detección de tienda), y notificaciones push — capacidades nativas que React Native expone de forma madura. Comunidad extensa y rendimiento cercano a nativo con New Architecture (Fabric/TurboModules). |
| **TypeScript** | 5.x | Lenguaje de programación | Tipado estático que reduce errores en tiempo de compilación, mejora la documentación del código y facilita el refactoring. Crítico para un equipo que debe mantener contratos de datos con el backend y manejar estados complejos. |
| **Expo** | 52.x | Plataforma de desarrollo y build para React Native | Acelera el desarrollo con herramientas preconfiguradas (cámara, geolocalización, notificaciones). Managed workflow simplifica el pipeline de builds para App Store y Google Play. EAS Build para CI/CD. |
| **React Navigation** | 7.x | Enrutamiento y navegación | Estándar de facto en React Native. Soporta navegación por stacks, tabs y modales. Tipado completo con TypeScript. |
| **Zustand** | 5.x | Manejo de estado global | Ligero (< 1KB), sin boilerplate, basado en hooks. Mejor alternativa a Redux para apps mobile con estado moderadamente complejo. Soporta middlewares (persist, devtools). |
| **React Query (TanStack Query)** | 5.x | Fetching, caching y sincronización de datos del servidor | Manejo automático de caché, retries, stale-while-revalidate y paginación. Elimina la necesidad de escribir lógica de fetching manual. Ideal para las consultas a la API de productos, puntos y recompensas. |
| **React Hook Form** | 7.x | Manejo de formularios | Formularios performantes con mínimo re-renderizado. Integración con Zod para validación del lado del cliente (ej: ingreso manual de código de barras EAN-13). |
| **Zod** | 3.x | Validación de esquemas | Define contratos de datos que se comparten entre frontend y backend. Valida respuestas de API en runtime para garantizar integridad. |
| **expo-camera** | ~16.x | Acceso a cámara para escaneo de códigos de barras | API nativa optimizada con soporte para CodeScanner (barcode scanning automático). |
| **expo-location** | ~18.x | Geolocalización para detección de tienda | Permite verificar que el usuario está físicamente en la tienda antes de permitir escaneos (anti-fraude). |
| **react-native-qrcode-svg** | 6.x | Generación de QR dinámicos | Para la pantalla de validación en caja (`pantalla-5-qr-validacion.html`). |
| **react-native-reanimated** | 3.x | Animaciones fluidas | Para transiciones entre pantallas, animación de la línea de escaneo, y micro-interacciones (como la barra de progreso de puntos). |
| **Jest + React Native Testing Library** | 30.x / 12.x | Testing unitario y de componentes | Framework de testing estándar. React Native Testing Library enfatiza pruebas desde la perspectiva del usuario. |
| **Maestro** | latest | E2E testing mobile | Framework de pruebas E2E declarativo para flujos críticos como escaneo → validación → acreditación de puntos. |
| **ESLint + Prettier** | 9.x / 3.x | Análisis estático y formateo | Consistent code style. ESLint con config `@react-native/eslint-config`. Prettier para formateo automático. |

### Justificación de la elección de React Native sobre alternativas

| Alternativa | Por qué NO la elegimos |
|---|---|
| **Flutter** | Mayor curva de aprendizaje del equipo (sin experiencia en Dart). Ecosistema de librerías para escaneo de códigos y geolocalización menos maduro que React Native + Expo. |
| **Kotlin Multiplatform (KMP)** | Aún en fase de adopción temprana. Menor cantidad de desarrolladores en el mercado. Mayor tiempo de desarrollo inicial. |
| **Native (Swift/Kotlin)** | Costo duplicado de desarrollo y mantenimiento. El equipo necesita entregar iOS y Android con recursos limitados. |
| **PWA** | Sin acceso completo a hardware (cámara con escaneo continuo, geolocalización en background, notificaciones push confiables). |

---

## 2. Hosting y Cloud Services

### Provedor cloud: **Google Cloud Platform (GCP)**

| Servicio | Uso | Justificación |
|---|---|---|
| **Firebase Authentication** | Autenticación de usuarios | Integración directa con React Native/Expo. Soporta email/password, Google Sign-In y Apple Sign-In. MFA incorporado. |
| **Cloud Firestore** | Base de datos en tiempo real para puntos, productos escaneados y sesiones | Sincronización en tiempo real entre dispositivos. Escalabilidad automática. Ideal para el flujo de validación en caja (la cajera ve los productos que el usuario escaneó). |
| **Cloud Functions (2ª gen)** | Backend serverless (BFF) | Procesamiento de escaneos, cálculo de puntos, generación de QR, integración con IA predictiva. Escala a cero cuando no hay uso. |
| **Cloud Storage** | Imágenes de productos, logos de marcas patrocinadoras | Almacenamiento de assets dinámicos con URLs firmadas. |
| **Cloud Tasks** | Cola de procesamiento asíncrono para análisis de IA | El perfilamiento predictivo se ejecuta en background sin bloquear la experiencia del usuario. |
| **Cloud CDN** | Distribución de assets estáticos (si se requiere web dashboard) | Baja latencia global para el dashboard de marcas (B2B). |
| **Vertex AI** | Modelos de IA predictiva | Perfilamiento conductual, predicción de productos a agotar, recomendaciones personalizadas. |
| **Firebase Cloud Messaging** | Notificaciones push | Cupones patrocinados, recordatorios de lista de compras, alertas de puntos por vencer. |

### Dominio y distribución

- **App Mobile**: Distribuida via **Google Play Store** y **Apple App Store**. Builds generados con **EAS Build** (Expo Application Services).
- **Dashboard B2B** (para marcas): Aplicación web separada (React + Vite) alojada en **Cloud Run** con dominio `dashboard.smartcart.app`.

---

## 3. Estructura del Proyecto

```
smartcart/
├── app/                          # Expo Router (file-based routing)
│   ├── (tabs)/                   # Bottom tab navigator
│   │   ├── _layout.tsx           # Configuración de los tabs
│   │   ├── index.tsx             # Pantalla Lobby (pantalla-1-lobby)
│   │   ├── scan.tsx              # Pantalla de escaneo (pantalla-2-camara)
│   │   ├── pending.tsx           # Pantalla de pendientes (pantalla-4-pendientes)
│   │   └── profile.tsx           # Pantalla de perfil
│   ├── scan/
│   │   ├── manual.tsx            # Ingreso manual de código (pantalla-2B)
│   │   └── confirm.tsx           # Confirmar producto (pantalla-2C)
│   ├── product/
│   │   └── [id].tsx              # Producto escaneado (pantalla-3-producto)
│   ├── checkout/
│   │   ├── qr.tsx                # QR de validación (pantalla-5-qr)
│   │   └── confirmed.tsx         # Confirmación final (pantalla-6-confirmacion)
│   └── rewards/
│       └── index.tsx             # Recompensas (pantalla-7-recompensas)
│
├── src/
│   ├── components/               # Componentes reutilizables
│   │   ├── ui/                   # Componentes atómicos (Button, Card, Badge, ProgressBar)
│   │   ├── product/              # Componentes de producto (ProductCard, ProductIcon, PointsTag)
│   │   ├── scan/                 # Componentes de escaneo (ScanFrame, BarcodeLine, ManualKeypad)
│   │   ├── points/               # Componentes de puntos (PointsCard, PointsBar, PendingSummary)
│   │   ├── qr/                   # Componentes de QR (QRDisplay, QRSummary)
│   │   └── layout/               # Layout components (StatusBar, TopBar, BottomNav, ScreenFrame)
│   │
│   ├── services/                 # Capa de servicios (API calls, Firebase)
│   │   ├── api/                  # Clientes HTTP
│   │   │   ├── client.ts         # Axios/fetch wrapper con interceptors
│   │   │   ├── products.ts       # API de productos
│   │   │   ├── points.ts         # API de puntos
│   │   │   └── rewards.ts        # API de recompensas
│   │   ├── auth.ts               # Firebase Authentication
│   │   ├── location.ts           # expo-location wrapper
│   │   ├── notifications.ts      # FCM push notifications
│   │   └── analytics.ts          # Event tracking
│   │
│   ├── stores/                   # Estado global (Zustand)
│   │   ├── auth.store.ts         # Estado de autenticación
│   │   ├── scan.store.ts         # Estado del escaneo actual
│   │   ├── points.store.ts       # Estado de puntos y progreso
│   │   └── cart.store.ts         # Estado del carrito/pendientes
│   │
│   ├── hooks/                    # Custom hooks
│   │   ├── useBarcodeScanner.ts  # Hook para lógica de escaneo
│   │   ├── useLocation.ts        # Hook para geolocalización
│   │   ├── usePoints.ts          # Hook para consulta de puntos
│   │   └── useDebounce.ts        # Hook utilitario
│   │
│   ├── models/                   # Modelos de dominio y contratos (Zod)
│   │   ├── product.ts            # Product, ScannedProduct
│   │   ├── points.ts             # PointsBalance, PointsTransaction
│   │   ├── reward.ts             # Reward, Coupon
│   │   └── user.ts               # User, UserProfile
│   │
│   ├── utils/                    # Utilidades
│   │   ├── formatters.ts         # Formatos de moneda, fecha, puntos
│   │   ├── validators.ts         # Validaciones (EAN-13, etc.)
│   │   ├── constants.ts          # Constantes de la app
│   │   └── permissions.ts        # Helpers de permisos
│   │
│   ├── theme/                    # Sistema de diseño (Design Tokens)
│   │   ├── colors.ts             # Paleta de colores
│   │   ├── typography.ts         # Tipografía
│   │   ├── spacing.ts            # Espaciados
│   │   ├── radii.ts              # Border radius
│   │   └── shadows.ts            # Sombras
│   │
│   └── types/                    # Tipos globales de TypeScript
│       ├── navigation.ts         # Tipos de navegación
│       ├── api.ts                # Tipos de API responses
│       └── environment.ts        # Variables de entorno tipadas
│
├── assets/                       # Imágenes, fuentes, iconos estáticos
│   ├── images/
│   ├── fonts/
│   └── icons/
│
├── __tests__/                    # Pruebas unitarias y de integración
│   ├── components/
│   ├── services/
│   └── stores/
│
├── e2e/                          # Pruebas E2E (Maestro)
│   ├── scan-flow.yaml
│   └── rewards-flow.yaml
│
├── app.json                      # Expo config
├── eas.json                      # EAS Build config
├── tsconfig.json
├── .eslintrc.js
├── .prettierrc
├── babel.config.js
└── package.json
```

### Principios aplicados en la estructura

- **Separación por dominio** (`product/`, `scan/`, `points/`) y no por tipo técnico → alta cohesión (principio de diseño #2)
- **Carpeta `ui/`** para componentes atómicos → reutilización (principio #5)
- **Capa `services/`** desacoplada de componentes → bajo acoplamiento (principio #3)
- **Modelos centralizados** con Zod → contrato único entre frontend y backend → anticipar obsolescencia (principio #7)

---

## 4. Componentes Visuales y Estructura en Código

### Estrategia: Atomic Design adaptado a React Native

| Nivel | Descripción | Ejemplos en el proyecto |
|---|---|---|
| **Átomos** | Componentes básicos e indivisibles | `Button`, `Badge`, `Icon`, `ProgressBar`, `StepCircle` |
| **Moléculas** | Combinación de átomos con funcionalidad | `ProductCard`, `PointsCard`, `ScanFrame`, `ReminderChip` |
| **Organismos** | Secciones complejas de la UI | `LobbyContent`, `PendingList`, `RewardsList`, `QRCard` |
| **Pantallas** | Páginas completas (`app/` con Expo Router) | `index.tsx` (Lobby), `scan.tsx`, `pending.tsx` |

### Ejemplo real: `ProductCard` (visto en `pantalla-3-producto-escaneado.html:31-37`)

```tsx
// src/components/product/ProductCard.tsx
import { View, Text } from 'react-native'
import { Product } from '@/src/models/product'
import { PointsTag } from '@/src/components/ui/PointsTag'
import { ProductIcon } from '@/src/components/product/ProductIcon'
import { theme } from '@/src/theme'

type Props = {
  product: Product
  variant?: 'default' | 'big' | 'pending'
}

export function ProductCard({ product, variant = 'default' }: Props) {
  return (
    <View style={styles.container}>
      <ProductIcon category={product.category} size={variant === 'big' ? 56 : 36} />
      <View style={styles.info}>
        <Text style={styles.name}>{product.name}</Text>
        <Text style={styles.brand}>{product.brand}</Text>
        <Text style={styles.price}>{formatCurrency(product.price)}</Text>
      </View>
      {product.points && <PointsTag points={product.points} />}
    </View>
  )
}
```

### Estructura de cada componente

```
src/components/product/
├── ProductCard.tsx        # Componente principal
├── ProductCard.styles.ts  # Estilos (StyleSheet.create)
├── ProductCard.test.tsx   # Pruebas unitarias
└── index.ts               # Re-export
```

### Renderizado condicional y variantes

Los componentes aceptan una prop `variant` para cambiar su apariencia según el contexto:

- `ProductCard variant="big"` — usado en `pantalla-2C-confirmar-producto.html:31` (vista de confirmación con detalle)
- `ProductCard variant="pending"` — usado en `pantalla-4-pendientes.html:46` (con indicador de estado pendiente)
- `ProductCard variant="default"` — usado en `pantalla-3-producto-escaneado.html:31`

---

## 5. Convenciones de Nomenclatura

### Archivos y carpetas

| Tipo | Convención | Ejemplo |
|---|---|---|
| **Componentes** | `PascalCase.tsx` | `ProductCard.tsx`, `ScanFrame.tsx` |
| **Hooks** | `camelCase.ts` con prefijo `use` | `useBarcodeScanner.ts`, `useLocation.ts` |
| **Servicios** | `camelCase.ts` | `points.ts`, `auth.ts` |
| **Stores** | `camelCase.store.ts` | `scan.store.ts`, `points.store.ts` |
| **Modelos** | `camelCase.ts` | `product.ts`, `reward.ts` |
| **Estilos** | `ComponentName.styles.ts` | `ProductCard.styles.ts` |
| **Tests** | `ComponentName.test.tsx` | `ProductCard.test.tsx` |
| **Pantallas (Expo Router)** | `kebab-case.tsx` | `scan/manual.tsx` |

### Nomenclatura de componentes

```
[Propósito][Contexto opcional][Tipo opcional]
Ejemplos: PointsTag, ProductCard, ScanFrame, PointsBarFill
```

### Variables y funciones

```typescript
// TypeScript: camelCase para variables/funciones, PascalCase para tipos/interfaces
const pendingPoints = 33                // variable
function formatCurrency(amount: number) // función
type PointsBalance = { total: number }  // tipo
interface Product { name: string }      // interfaz
```

### Constantes

```typescript
// UPPER_SNAKE_CASE para valores fijos conocidos en build time
export const EAN_13_LENGTH = 13
export const QR_EXPIRATION_MINUTES = 10
export const POINTS_BAR_MAX = 200
```

---

## 6. Lineamientos de CSS y Estilos

### 6.1 Sistema de Design Tokens

Basado en el prototipo HTML existente, se definen tokens centralizados en `src/theme/`.

#### Colores

```typescript
// src/theme/colors.ts
export const colors = {
  // Primarios
  primary:         '#1D9E75',   // Verde SmartCart (botones, acentos, header)
  primaryDark:     '#0d6e48',   // Texto interactivo, hover
  primaryLight:    '#9fd4b8',   // Bordes de inputs, fondos suaves

  // Neutrales
  background:      '#f5f7f5',   // Fondo de pantallas
  backgroundAlt:   '#e8ede8',   // Fondo exterior
  surface:         '#ffffff',   // Cards, contenedores
  border:          '#dfe6df',   // Bordes de cards
  borderLight:     '#eff4ef',   // Separadores

  // Texto
  textPrimary:     '#1a2a1a',   // Títulos, texto principal
  textSecondary:   '#7a8a7a',   // Subtítulos, metadata
  textOnPrimary:   '#ffffff',   // Texto sobre fondo primary
  textDisabled:    '#b4c0b4',   // Texto deshabilitado

  // Semánticos
  warning:         '#f0c040',   // Alerta / advertencia
  warningBg:       '#fff8e1',   // Fondo de advertencia
  warningText:     '#7a5800',   // Texto de advertencia
  error:           '#c0392b',   // Error
  errorBg:         '#fdecea',   // Fondo de error
  success:         '#1D9E75',   // Éxito
  successBg:       '#e4f0ea',   // Fondo de éxito

  // Iconos de producto (gradientes)
  productCoffee:   ['#8B5A2B', '#5C3A1E'],
  productDiscount: ['#1D9E75', '#0d6e48'],
  productStore:    ['#4a90c2', '#2b5d80'],
}
```

#### Tipografía

```typescript
// src/theme/typography.ts
export const typography = {
  fontFamily: {
    regular: 'System',
    mono:    'Courier New',     // Para códigos de barras (pantalla-2B:36)
  },
  fontSize: {
    xs:   10,                   // Etiquetas, metadata
    sm:   11,                   // Subtítulos pequeños
    base: 12,                   // Texto de cards
    md:   13,                   // Nombres de productos
    lg:   15,                   // Títulos de pantalla
    xl:   17,                   // Títulos grandes
    xxl:  21,                   // Héroes
    hero: 36,                   // Números grandes (puntos)
  },
  fontWeight: {
    regular: '400',
    semibold: '600',
    bold: '700',
    extrabold: '800',
  },
}
```

#### Espaciados

```typescript
// src/theme/spacing.ts
export const spacing = {
  xs:   4,
  sm:   8,
  md:   12,
  lg:   16,
  xl:   20,
  xxl:  24,
  // Padding de pantalla
  screenX: 16,
  screenY: 14,
}
```

#### Radios

```typescript
export const radii = {
  sm:    8,
  md:    12,
  lg:    16,
  xl:    20,
  full:  9999,   // Círculos
}
```

### 6.2 Enlace a prototipo: mapeo de tokens a HTML

| Token | Valor | Uso en prototipo |
|---|---|---|
| `colors.primary` | `#1D9E75` | Botón "Escanear producto" (`pantalla-1-lobby.html:46`), points card (`pantalla-1-lobby.html:31`), barra de progreso |
| `colors.background` | `#f5f7f5` | Fondo del `phone` en todas las pantallas |
| `colors.textSecondary` | `#7a8a7a` | Subtítulos como "Tus puntos" (`pantalla-1-lobby.html:102`) |
| `colors.warningBg` | `#fff8e1` | Card de verificación (`pantalla-2C-confirmar-producto.html:47`) |
| `typography.fontSize.hero` | `46px` | Número de puntos (`pantalla-1-lobby.html:35`) |
| `radii.lg` | `16` | Cards de producto (`pantalla-3-producto-escaneado.html:31`) |

### 6.3 Responsive Design

- La app es **mobile-first** con diseño fijo de 360x720 como baseline (basado en el viewport del prototipo).
- Uso de `Dimensions.get('window')` al inicio para escalar proporcionalmente en tablets.
- Los carruseles horizontales (vistos en `pantalla-1-lobby.html:55`) usan `FlatList horizontal` con `snapToInterval`.
- Teclado numérico custom (visto en `pantalla-2B-ingreso-manual.html:54`) se implementa con `useWindowDimensions` para posicionarlo correctamente sobre el teclado nativo.

### 6.4 Branding y etiquetado visual

- **Nombre:** SmartCart
- **Logotipo:** "Smart**Cart**" con la "Cart" en `colors.primary` (verde) — `pantalla-1-lobby.html:18`
- **Iconografía:** Font Awesome 6.5 (vía `@expo/vector-icons` con set FontAwesome)
- **Tono:** Profesional, fresco, ecológico (verdes sobre fondos neutros)
- **Idioma:** Español (Costa Rica) — moneda en colones (`3,250`), formatos locales

---

## 7. Prototipado y UX Testing

### 7.1 Prototipo HTML

Se desarrollaron 7 pantallas funcionales como prototipos HTML que simulan el flujo completo del usuario:

| # | Archivo | Pantalla | Flujo |
|---|---|---|---|
| 1 | `pantalla-1-lobby.html` | Lobby principal | Puntos, escanear, productos patrocinados, lista de recordatorio |
| 2 | `pantalla-2-camara-escaneando.html` | Cámara escaneando | Scanner de código de barras con marco visual |
| 2B | `pantalla-2B-ingreso-manual.html` | Ingreso manual | Teclado numérico para código EAN-13 |
| 2C | `pantalla-2C-confirmar-producto.html` | Confirmar producto | Verificación visual antes de acreditar |
| 3 | `pantalla-3-producto-escaneado.html` | Producto detectado | Éxito + pasos para acreditar puntos |
| 4 | `pantalla-4-pendientes.html` | Pendientes de validar | Lista de productos escaneados no comprados |
| 5 | `pantalla-5-qr-validacion.html` | QR para caja | Código QR dinámico + espera de validación |
| 6 | `pantalla-6-confirmacion.html` | Compra validada | Puntos acreditados, resumen de compra |
| 7 | `pantalla-7-recompensas.html` | Mis recompensas | Catálogo de canje con puntos |

### 7.2 Decisiones de UX derivadas del prototipado

| Decisión | Fundamento |
|---|---|
| **Bottom navigation con 4 tabs** | Los usuarios necesitan acceso rápido a Inicio, Escanear, Pendientes y Perfil. Consistent con patrones de supermercados (Walmart, Sam's Club). |
| **Barra de progreso de puntos** | Gamificación: muestra cuánto falta para el siguiente descuento, incentivando más escaneos. |
| **Pasos numerados (StepProgress)** | Reduce la fricción cognitiva: el usuario sabe exactamente en qué paso del proceso está. |
| **QR dinámico con expiración de 10 min** | Seguridad: evita reuso de QR. Tiempo suficiente para completar la compra en caja. |
| **Teclado numérico custom en ingreso manual** | Los códigos EAN-13 son solo dígitos. Un teclado numérico grande reduce errores comparado con el teclado completo del OS. |
| **Card amarilla de verificación** | Llamado a la acción antes de confirmar: reduce escaneos accidentales. |
| **Carrusel de productos patrocinados** | Monetización B2B: marcas pagan por visibilidad. Formato horizontal eficiente en espacio. |

### 7.3 UX Testing (plan)

| Aspecto | Detalle |
|---|---|
| **Perfiles de usuarios** | 5 participantes: 2 amas de casa (35-50), 2 estudiantes (20-25), 1 adulto mayor (60+) |
| **Escenarios** | Escanear producto → confirmar → generar QR → validar en caja → ver puntos |
| **Métrica principal** | Tiempo promedio para completar el flujo completo (< 2 min objetivo) |
| **Métrica secundaria** | Tasa de error en ingreso manual de código |
| **Herramienta** | Maze + prototipo HTML navegable |
| **Hallazgo esperado** | Validar que el paso de confirmación (2C) no sea percibido como fricción innecesaria |

---

## 8. Autenticación y Autorización

### 8.1 Mecanismo de autenticación

**Firebase Authentication** con los siguientes providers:

```
┌──────────────────────────────────────────────────────────┐
│                    SmartCart App                          │
│                                                          │
│  ┌─────────────────────┐         ┌───────────────────┐   │
│  │ Email + Password     │         │ Google / Apple     │   │
│  │ (con verificación)   │         │ Sign-In (oauth)    │   │
│  └──────────┬──────────┘         └────────┬──────────┘   │
│             │                             │              │
│             └──────────┬──────────────────┘              │
│                        │                                 │
│               ┌────────▼────────┐                        │
│               │ Firebase Auth   │                        │
│               │ (Identity Platt)│                        │
│               └────────┬────────┘                        │
│                        │                                 │
│               ┌────────▼────────┐                        │
│               │ Custom Claims   │                        │
│               │ (role: user/    │                        │
│               │  admin/brand)   │                        │
│               └────────┬────────┘                        │
└─────────────────────────┼────────────────────────────────┘
                          │
              ┌───────────▼───────────┐
              │ ID Token (JWT)        │
              │ expires: 1 hora       │
              │ refreshed autom.      │
              └───────────────────────┘
```

- **Registro mínimo**: email + contraseña, o Google/Apple Sign-In. Sin registro para solo escanear (modo invitado con límite de 3 productos).
- **MFA**: Opcional en perfil. Requerido para cuentas de marca (dashboard B2B).
- **Tokens JWT**: Firebase emite ID Tokens (JWT) que se envían en cada request. El backend verifica la firma con las keys públicas de Firebase.

### 8.2 Autorización

#### RBAC (Role-Based Access Control)

| Rol | Permisos |
|---|---|
| `consumer` | Escanear productos, ver puntos, canjear recompensas, generar QR |
| `brand` | Acceso a dashboard B2B, ver reportes de insights, crear campañas de cupones |
| `cashier` | Validar QR en caja (app POS/web), marcar productos como comprados |
| `admin` | Gestionar productos, marcas, configurar puntos, ver reportes globales |

Implementación con **Custom Claims** de Firebase:

```typescript
// src/services/auth.ts
import auth from '@react-native-firebase/auth'

export async function getUserRole(): Promise<UserRole> {
  const user = auth().currentUser
  const idTokenResult = await user?.getIdTokenResult()
  return (idTokenResult?.claims.role as UserRole) ?? 'consumer'
}
```

#### Validación de permisos en componentes

```typescript
// src/components/ui/PermissionGate.tsx
type Props = {
  requiredRole: UserRole
  children: React.ReactNode
  fallback?: React.ReactNode
}

export function PermissionGate({ requiredRole, children, fallback }: Props) {
  const role = useAuthStore(state => state.role)
  const hasPermission = ROLE_HIERARCHY[role] >= ROLE_HIERARCHY[requiredRole]
  return hasPermission ? children : fallback ?? null
}
```

### 8.3 Manejo de sesiones

- **Firebase Auth** maneja sesiones de forma nativa con persistencia en AsyncStorage.
- **Refresh automático**: Firebase refresca el token cada hora sin intervención del usuario.
- **Cierre de sesión**: Al hacer logout, se limpian stores (Zustand), caché de React Query, y AsyncStorage.
- **Expiración forzada**: El backend puede invalidar tokens mediante revocation de Firebase.

---

## 9. Seguridad (OWASP)

### 9.1 Prácticas OWASP Mobile Top 10 aplicadas

| Riesgo OWASP | Mitigación en SmartCart |
|---|---|
| **M1 - Improper Credential Usage** | Firebase Auth maneja hashing y almacenamiento de credenciales. Nunca se almacenan passwords en el dispositivo. |
| **M2 - Insecure Data Storage** | Datos sensibles (tokens, perfil) en `expo-secure-store` (Keychain/Keystore). No en AsyncStorage. Datos de caché (React Query) se limpian al cerrar sesión. |
| **M3 - Insecure Communication** | Todas las comunicaciones via HTTPS/TLS 1.3. Certificate pinning con `react-native-ssl-pinning`. |
| **M4 - Insecure Authentication** | Firebase Auth con MFA opcional. Tokens JWT firmados. Validación de token en cada request del backend. |
| **M5 - Insufficient Cryptography** | Cifrado AES-256-GCM para datos en reposo sensibles usando `expo-crypto`. |
| **M6 - Insecure Authorization** | RBAC validado tanto en frontend (UI) como en backend (API). Principio de mínimo privilegio. |
| **M7 - Client Code Quality** | ESLint + TypeScript estrictos. Análisis estático en CI/CD. |
| **M8 - Code Tampering** | CodePush con firma. Builds con EAS Build (código compilado, no interpretado). |
| **M9 - Reverse Engineering** | ProGuard (Android) + obfuscación con `expo-build-properties`. Ofuscación de strings sensibles. |
| **M10 - Extraneous Functionality** | Logs condicionales (solo en entorno dev). Stripeo de código muerto con ESLint. |

### 9.2 OWASP específico para APIs (Web/REST)

- **Rate Limiting**: Cloud Armor + Firebase App Check para prevenir abusos.
- **Input Validation**: Zod schemas validan TODOS los inputs del usuario (código EAN-13, formularios).
- **CORS**: Solo orígenes permitidos (dashboard B2B).
- **SQL Injection**: Firestore usa consultas parametrizadas (no SQL).
- **IDOR Prevention**: Los endpoints verifican que el `userId` del token coincida con el recurso solicitado.

### 9.3 Cifrado y masking

```typescript
// src/utils/crypto.ts
import * as Crypto from 'expo-crypto'

export async function encryptSensitiveData(data: string): Promise<string> {
  const key = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    ENCRYPTION_KEY
  )
  // AES-256-GCM implementation using expo-crypto + subtle
}

// Masking de datos en UI
export function maskEmail(email: string): string {
  return email.replace(/(.{2})(.*)(@.*)/, '$1****$3')
}
// "juan.perez@email.com" → "ju****@email.com"
```

### 9.4 Validación de permisos (OWASP Top 10 API Security)

Se implementa un middleware centralizado en el backend que verifica:

1. El token JWT es válido y no está revocado
2. El `role` en Custom Claims tiene permiso para el recurso
3. El `userId` del token coincide con el recurso (previene IDOR)
4. Rate limit por usuario no se ha excedido

---

## 10. Patrones Arquitectónicos

### 10.1 Arquitectura en Capas

La app sigue una arquitectura en **4 capas** que separa claramente responsabilidades:

```
┌───────────────────────────────────────────────────────────────┐
│                        UI LAYER                               │
│  (Pantallas + Componentes)                                    │
│  - app/ (Expo Router screens)                                 │
│  - src/components/ (átomos, moléculas, organismos)            │
│  Responsabilidad: Renderizado, interacción con usuario        │
├───────────────────────────────────────────────────────────────┤
│                     STATE LAYER                                │
│  (Estado global + server state)                                │
│  - src/stores/ (Zustand — estado cliente)                      │
│  - React Query (estado servidor — caché, fetching)             │
│  Responsabilidad: Mantener estado sincronizado                 │
├───────────────────────────────────────────────────────────────┤
│                     SERVICE LAYER                              │
│  (Lógica de negocio + comunicación externa)                    │
│  - src/services/ (API clients, Firebase, location, etc.)      │
│  Responsabilidad: Orquestar llamadas, transformar datos        │
├───────────────────────────────────────────────────────────────┤
│                      DATA LAYER                                │
│  (Modelos + validación)                                        │
│  - src/models/ (Zod schemas)                                   │
│  - src/types/ (TypeScript interfaces)                          │
│  Responsabilidad: Definir contratos, validar datos             │
└───────────────────────────────────────────────────────────────┘
```

**Principios aplicados:** Divide and Conquer (#1), Cohesion (#2), Reducing Coupling (#3), Level of Abstraction (#4).

### 10.2 BFF (Backend for Frontend)

En lugar de que la app mobile consuma directamente los microservicios internos, se implementa un **BFF** usando Firebase Cloud Functions:

```
[Mobile App] ← HTTPS/REST → [BFF - Cloud Functions] ← gRPC → [Internal Services]
                                      │
                                      ├── [Products Service]
                                      ├── [Points Service]
                                      ├── [AI Profiling Service]
                                      └── [Brands Service]
```

El BFF:
- Agrega datos de múltiples servicios en una sola respuesta
- Transforma los datos al formato que la app necesita
- Maneja autenticación y autorización en el borde
- Reduce la cantidad de llamadas desde el dispositivo móvil (crítico para latency en redes móviles)

### 10.3 Event-Driven para flujos asíncronos

```
[User scans product] → [Cloud Task] → [AI Profiling Service] → [Update Consumer Profile]
                                     → [Points Calculation]   → [Update Points Balance]
                                     → [Coupon Engine]        → [Push Notification]
```

El escaneo de un producto dispara eventos que se procesan asíncronamente, permitiendo que la UI responda inmediatamente mientras la IA procesa en background.

---

## 11. Patrones de Diseño

### 11.1 Observer / Event Emitter (notificaciones push)

```typescript
// src/services/notifications.ts
// Las notificaciones push siguen el patrón Observer:
// FCM actúa como subject, la app como observer

import messaging from '@react-native-firebase/messaging'

class NotificationService {
  private listeners: Map<string, (data: any) => void> = new Map()

  async setup(): Promise<void> {
    const granted = await messaging().requestPermission()
    if (granted) {
      const token = await messaging().getToken()
      await registerToken(token)
    }
    messaging().onMessage(this.handleForegroundMessage)
    messaging().onNotificationOpenedApp(this.handleNotificationOpen)
  }

  on(event: string, handler: (data: any) => void): void {
    this.listeners.set(event, handler)
  }

  private handleForegroundMessage = (remoteMessage: RemoteMessage) => {
    // Notificación recibida en foreground -> actualizar UI sin alerta nativa
    const event = remoteMessage.data?.event ?? 'default'
    this.listeners.get(event)?.(remoteMessage.data)
    // Ejemplo: actualizar puntos en tiempo real cuando se acredita un escaneo
  }
}

export const notificationService = new NotificationService()
```

**Ubicación en el proyecto:** `src/services/notifications.ts`

### 11.2 Strategy (validación de códigos de barras)

```typescript
// src/utils/validators.ts
// Patrón Strategy: diferentes estrategias de validación según el tipo de código

interface BarcodeValidationStrategy {
  validate(code: string): boolean
  format(code: string): string
}

class EAN13Strategy implements BarcodeValidationStrategy {
  validate(code: string): boolean {
    if (code.length !== 13 || !/^\d{13}$/.test(code)) return false
    return this.checkDigitValid(code)
  }
  format(code: string): string {
    return `${code.slice(0,3)}-${code.slice(3,7)}-${code.slice(7)}`
  }
  private checkDigitValid(code: string): boolean { /* checksum EAN-13 */ }
}

class UPCStrategy implements BarcodeValidationStrategy {
  validate(code: string): boolean { /* UPC-A validation */ }
  format(code: string): string { /* ... */ }
}

const strategies: Record<string, BarcodeValidationStrategy> = {
  'EAN-13': new EAN13Strategy(),
  UPC: new UPCStrategy(),
}

export function validateBarcode(code: string, type: string): boolean {
  return strategies[type]?.validate(code) ?? false
}
```

**Ubicación en el proyecto:** `src/utils/validators.ts`

### 11.3 Adapter (geolocalización)

```typescript
// src/services/location.ts
// Patrón Adapter: abstrae expo-location para poder cambiarlo sin afectar consumidores

import * as Location from 'expo-location'

export interface LocationProvider {
  getCurrentPosition(): Promise<{ lat: number; lng: number; accuracy: number }>
  isInStore(storeCoordinates: { lat: number; lng: number; radius: number }): Promise<boolean>
  watchPosition(callback: (pos: { lat: number; lng: number }) => void): () => void
}

export class ExpoLocationAdapter implements LocationProvider {
  async getCurrentPosition() {
    const { coords } = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High })
    return { lat: coords.latitude, lng: coords.longitude, accuracy: coords.accuracy ?? 0 }
  }

  async isInStore(store: { lat: number; lng: number; radius: number }): Promise<boolean> {
    const pos = await this.getCurrentPosition()
    const distance = this.haversineDistance(pos.lat, pos.lng, store.lat, store.lng)
    return distance <= store.radius
  }

  watchPosition(callback: (pos: { lat: number; lng: number }) => void) {
    const sub = Location.watchPositionAsync({ distanceInterval: 10 }, ({ coords }) => {
      callback({ lat: coords.latitude, lng: coords.longitude })
    })
    return () => sub.then(s => s.remove())
  }

  private haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    // Cálculo de distancia entre coordenadas
  }
}
```

**Ubicación en el proyecto:** `src/services/location.ts`

### 11.4 Singleton (stores de Zustand)

```typescript
// src/stores/scan.store.ts
// Zustand stores siguen el patrón Singleton: un solo store global

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import AsyncStorage from '@react-native-async-storage/async-storage'

interface ScanState {
  scannedProducts: ScannedProduct[]
  isScanning: boolean
  currentBarcode: string | null
  addProduct: (product: ScannedProduct) => void
  removeProduct: (productId: string) => void
  clearPending: () => void
}

export const useScanStore = create<ScanState>()(
  persist(
    (set) => ({
      scannedProducts: [],
      isScanning: false,
      currentBarcode: null,
      addProduct: (product) =>
        set((state) => ({ scannedProducts: [...state.scannedProducts, product] })),
      removeProduct: (productId) =>
        set((state) => ({
          scannedProducts: state.scannedProducts.filter((p) => p.id !== productId),
        })),
      clearPending: () => set({ scannedProducts: [] }),
    }),
    {
      name: 'scan-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
)
```

**Ubicación en el proyecto:** `src/stores/scan.store.ts`

### 11.5 Factory (creación de componentes condicionales)

```typescript
// src/components/product/ProductCardFactory.tsx
// Patrón Factory: crea el tipo de card según el contexto

type ProductCardContext = 'scan-result' | 'confirmation' | 'pending' | 'rewards'

export function createProductCard(product: Product, context: ProductCardContext) {
  switch (context) {
    case 'scan-result':
      return <ProductCard product={product} variant="default" showPoints />
    case 'confirmation':
      return <ProductCard product={product} variant="big" showDetails showBarcode />
    case 'pending':
      return <ProductCard product={product} variant="pending" showStatus />
    case 'rewards':
      return <ProductCard product={product} variant="rewards" showRedeemButton />
  }
}
```

---

## 12. Manejo de Estado y Almacenamiento

### 12.1 Estrategia general

| Tipo de estado | Herramienta | Persistencia | Ejemplos |
|---|---|---|---|
| **Estado del servidor** | React Query (TanStack Query) | Caché en memoria + GC | Productos, puntos, recompensas, perfil |
| **Estado del cliente (global)** | Zustand + persist middleware | AsyncStorage | Productos escaneados, UI state, preferencias |
| **Estado del cliente (local)** | `useState` / `useReducer` | No persiste | Input de código manual, animaciones |
| **Estado de autenticación** | Firebase Auth + Zustand | SecureStore (Keychain/Keystore) | Token JWT, sesión |
| **Estado de navegación** | React Navigation | No persiste | Historial de pantallas |

### 12.2 Session Storage vs Local Storage

```typescript
// Equivalente React Native:
// - SecureStore (expo-secure-store): Datos sensibles (tokens, perfil)
// - AsyncStorage: Datos no sensibles (preferencias, caché)
// - No existe "session storage" nativo; se simula con estado en memoria (Zustand sin persist)

// Sensible (uses SecureStore)
await SecureStore.setItemAsync('auth_token', token)    // Keychain/Keystore
await SecureStore.getItemAsync('auth_token')

// No sensible (uses AsyncStorage via Zustand persist)
useScanStore.persist.setOptions({ name: 'scanned-products' })
```

### 12.3 Web Sockets y Comunicación Asíncrona

| Caso de uso | Tecnología | Implementación |
|---|---|---|
| **Validación en caja (QR escaneado)** | Firestore snapshot listener | `onSnapshot` escucha cambios en el documento de la sesión de validación. Cuando la cajera escanea el QR, el documento cambia a `status: 'confirmed'` y la UI reacciona en tiempo real. |
| **Notificaciones de puntos acreditados** | FCM (Firebase Cloud Messaging) | `onMessage` handler actualiza puntos en UI sin alerta nativa. |
| **Actualización de precios/cupones en tiempo real** | Firestore listener en documentos de ofertas | `onSnapshot` en la colección `offers` para actualizar carrusel de productos patrocinados. |
| **Procesamiento de IA (largo)** | Cloud Tasks + notificación push | El escaneo encola un task. Cuando el perfilamiento termina, se envía una notificación push. |

Ejemplo de listener en tiempo real para validación en caja:

```typescript
// src/services/checkout.ts
import firestore from '@react-native-firebase/firestore'

export function listenForValidation(
  sessionId: string,
  onValidated: (result: ValidationResult) => void
): () => void {
  const unsubscribe = firestore()
    .collection('validation_sessions')
    .doc(sessionId)
    .onSnapshot((snapshot) => {
      const data = snapshot.data()
      if (data?.status === 'confirmed') {
        onValidated({
          totalPoints: data.totalPoints,
          validatedProducts: data.products,
          timestamp: data.validatedAt,
        })
      }
    })
  return unsubscribe
}
```

### 12.4 Manejo de procesos largos

Los procesos que toman > 2 segundos (perfilamiento IA, generación de reportes) se manejan con:

1. El frontend envía el request y recibe un `sessionId` inmediatamente
2. Un **Cloud Tasks** procesa en background
3. El frontend muestra un estado "procesando" con un loader
4. Cuando termina, una notificación push o un `onSnapshot` de Firestore actualiza la UI
5. Estrategia de **retries**: 3 reintentos con backoff exponencial (1s, 2s, 4s)

### 12.5 Manejo de errores

```typescript
// src/services/api/client.ts
// Interceptor centralizado para manejo de errores

const apiClient = axios.create({ baseURL: API_BASE_URL })

apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response) {
      switch (error.response.status) {
        case 401:
          // Token expirado o inválido → logout forzado
          useAuthStore.getState().logout()
          break
        case 403:
          // Sin permisos → mostrar alerta
          showPermissionDeniedAlert()
          break
        case 429:
          // Rate limit → retry after header
          const retryAfter = error.response.headers['retry-after']
          scheduleRetry(parseInt(retryAfter ?? '5'))
          break
        case 500:
          // Error del servidor → mostrar mensaje genérico
          showGenericError()
          break
      }
    }
    return Promise.reject(normalizeError(error))
  }
)
```

### 12.6 Caching

| Estrategia | Dónde | TTL |
|---|---|---|
| **React Query `staleTime`** | Datos de productos, puntos | 5 minutos |
| **React Query `gcTime`** | Datos no visibles actualmente | 30 minutos |
| **AsyncStorage (persist)** | Productos escaneados (pendientes) | Hasta que se validen |
| **SecureStore** | Token de autenticación | Hasta logout/expiración |
| **Imágenes** | `expo-image` caché automática | 7 días |

```typescript
// Ejemplo de React Query con caching agresivo
export function usePoints() {
  return useQuery({
    queryKey: ['points'],
    queryFn: () => pointsApi.getBalance(),
    staleTime: 5 * 60 * 1000,         // 5 min antes de refetch
    gcTime: 30 * 60 * 1000,            // 30 min en caché
    retry: 3,
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 10000),
  })
}
```

### 12.7 Observabilidad y monitoreo

- **Sentry**: Error tracking con breadcrumbs de navegación y eventos de usuario.
- **Firebase Performance**: Monitoreo de latencia de API calls y renderizado de pantallas.
- **Analytics personalizados**: Eventos como `scan_started`, `scan_completed`, `qr_generated`, `points_redeemed`.

---

## 13. Consumo de APIs y Manejo de Contratos de Datos

### 13.1 Contratos con Zod (compartidos entre frontend y backend)

```typescript
// src/models/product.ts
import { z } from 'zod'

export const ProductSchema = z.object({
  id: z.string().uuid(),
  barcode: z.string().length(13),
  name: z.string().min(1).max(120),
  brand: z.string().min(1).max(100),
  price: z.number().positive(),
  category: z.enum(['coffee', 'dairy', 'oil', 'snacks', 'beverages', 'other']),
  measurementUnit: z.string(),
  imageUrl: z.string().url().optional(),
  points: z.number().int().nonnegative(),
})

export type Product = z.infer<typeof ProductSchema>

// Validación en runtime de la respuesta de la API
export function validateProductResponse(data: unknown): Product {
  const result = ProductSchema.safeParse(data)
  if (!result.success) {
    Sentry.captureMessage('Invalid product response', {
      extra: { errors: result.error.flatten() },
    })
    throw new ValidationError('Invalid product data from API')
  }
  return result.data
}
```

### 13.2 Capa de API

```typescript
// src/services/api/products.ts
import { apiClient } from './client'
import { Product, ProductSchema } from '@/src/models/product'

export const productsApi = {
  getByBarcode: async (barcode: string): Promise<Product> => {
    const { data } = await apiClient.get(`/products/${barcode}`)
    return validateProductResponse(data)
  },

  getSponsored: async (storeId: string): Promise<Product[]> => {
    const { data } = await apiClient.get('/products/sponsored', {
      params: { storeId },
    })
    return z.array(ProductSchema).parse(data)
  },

  confirmScanned: async (productId: string): Promise<ScanResult> => {
    const { data } = await apiClient.post(`/products/${productId}/scan`)
    return ScanResultSchema.parse(data)
  },
}
```

### 13.3 React Query hooks

```typescript
// src/hooks/useProducts.ts
export function useProductByBarcode(barcode: string) {
  return useQuery({
    queryKey: ['product', barcode],
    queryFn: () => productsApi.getByBarcode(barcode),
    enabled: barcode.length === 13,
    staleTime: 60 * 60 * 1000, // 1 hora (el producto no cambia frecuentemente)
  })
}

export function useSponsoredProducts(storeId: string) {
  return useQuery({
    queryKey: ['sponsored', storeId],
    queryFn: () => productsApi.getSponsored(storeId),
    staleTime: 10 * 60 * 1000, // 10 min (carrusel de ofertas)
  })
}
```

---

## 14. CI/CD

### 14.1 Pipeline (GitHub Actions)

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:

jobs:
  typecheck:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - run: npm ci
      - run: npx tsc --noEmit

  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - run: npm ci
      - run: npx eslint src/ app/

  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - run: npm ci
      - run: npx jest --coverage
      - uses: actions/upload-artifact@v4
        with:
          name: coverage
          path: coverage/

  e2e:
    runs-on: macos-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - run: npm ci
      - run: npx expo run:ios  # o Android emulator
      - run: npx maestro test e2e/
```

### 14.2 Estrategia de deployment

```
                        ┌─────────────┐
                        │   develop    │
                        └──────┬──────┘
                               │
                    ┌──────────▼──────────┐
                    │  CI (typecheck +    │
                    │  lint + test + e2e) │
                    └──────────┬──────────┘
                               │
          ┌────────────────────┼────────────────────┐
          ▼                    ▼                    ▼
   ┌────────────┐      ┌────────────┐      ┌────────────┐
   │ EAS Build  │      │ EAS Build  │      │ EAS Build  │
   │ Android    │      │ iOS Sim    │      │ iOS        │
   │ internal   │      │ internal   │      │ TestFlight │
   └────────────┘      └────────────┘      └────────────┘
          │                    │                    │
          ▼                    ▼                    ▼
   Internal Testers      Dev Team              QA Team
                                                    
   main branch → EAS Build → App Store / Google Play
```

### 14.3 Validaciones automáticas pre-commit

```json
// package.json (lint-staged)
{
  "lint-staged": {
    "*.{ts,tsx}": ["eslint --fix", "prettier --write"],
    "*.{json,md}": ["prettier --write"]
  }
}
```

- Husky corre `lint-staged` en cada commit
- TypeScript estricto: `strict: true` en `tsconfig.json`
- ESLint con reglas de `@react-native/eslint-config` + `eslint-plugin-react-hooks`

---

## 15. Estrategias de Testing

### 15.1 Pirámide de testing

```
        ╱╲
       ╱ E2E ╲               Maestro — 5 flujos críticos
      ╱────────╲
     ╱Integration╲            RNTL + MSW — 20 pruebas
    ╱──────────────╲
   ╱  Unit Testing   ╲        Jest — 80% cobertura mínima
  ╱────────────────────╲
```

### 15.2 Unit Testing (Jest)

```typescript
// __tests__/utils/validators.test.ts
import { validateBarcode } from '@/src/utils/validators'

describe('validateBarcode', () => {
  it('validates correct EAN-13', () => {
    expect(validateBarcode('7441001823456', 'EAN-13')).toBe(true)
  })
  it('rejects incorrect checksum', () => {
    expect(validateBarcode('7441001823457', 'EAN-13')).toBe(false)
  })
  it('rejects non-numeric input', () => {
    expect(validateBarcode('abcdefghijklm', 'EAN-13')).toBe(false)
  })
})
```

### 15.3 Integration Testing (React Native Testing Library)

```typescript
// __tests__/components/ProductCard.test.tsx
import { render, screen } from '@testing-library/react-native'
import { ProductCard } from '@/src/components/product/ProductCard'

const mockProduct = {
  id: '123',
  name: 'Cafe Britt 500g',
  brand: 'Cafe Britt',
  price: 3250,
  barcode: '7441001823456',
  points: 15,
  category: 'coffee',
  measurementUnit: '500g',
}

describe('ProductCard', () => {
  it('renders product name and price', () => {
    render(<ProductCard product={mockProduct} />)
    expect(screen.getByText('Cafe Britt 500g')).toBeTruthy()
    expect(screen.getByText('3,250')).toBeTruthy()
  })

  it('shows points tag when product has points', () => {
    render(<ProductCard product={mockProduct} />)
    expect(screen.getByText('+15 pts')).toBeTruthy()
  })
})
```

### 15.4 E2E Testing (Maestro)

```yaml
# e2e/scan-flow.yaml
appId: com.smartcart.app
---
- launchApp
- tapOn: "Escanear producto"
- assertVisible: "Apunta al codigo de barras"
- tapOn: "Ingresar codigo manualmente"
- assertVisible: "Codigo de barras"
- tapOn: "7"
- tapOn: "4"
- tapOn: "4"
- tapOn: "1"
- tapOn: "0"
- tapOn: "0"
- tapOn: "1"
- tapOn: "8"
- tapOn: "2"
- tapOn: "3"
- tapOn: "Verificar producto"
- assertVisible: "Cafe Britt 500g"
- tapOn: "Si, es este producto"
- assertVisible: "Codigo de barras leido"
```

### 15.5 Cobertura mínima esperada

| Tipo | Cobertura mínima |
|---|---|
| **Unit tests** (utils, validators, formatters) | 90% |
| **Component tests** (RNTL) | 80% |
| **Store tests** (Zustand) | 90% |
| **E2E flows** (Maestro) | 5 flujos críticos: escaneo, manual, QR, canje, lobby |

---

## 16. Diagramas de Arquitectura

### 16.1 Diagrama C4 — Nivel 1 (Contexto)

```
┌────────────────────────────────────────────────────────────────────┐
│                      SmartCart System                               │
│                                                                     │
│  ┌──────────────┐     ┌──────────────────┐     ┌──────────────┐    │
│  │  Consumer     │     │    SmartCart      │     │   Cashier     │   │
│  │  (App Mobile) │────▶│    Backend        │◀────│  (POS / Web)  │   │
│  │               │     │  (Cloud Functions) │     │              │   │
│  └──────────────┘     └────────┬─────────┘     └──────────────┘    │
│                                │                                    │
│                       ┌────────▼─────────┐                          │
│                       │   Firebase / GCP  │                         │
│                       │   (Auth, Storage, │                          │
│                       │    Firestore, AI) │                          │
│                       └──────────────────┘                          │
│                                │                                    │
│                       ┌────────▼─────────┐                          │
│                       │   Dashboard B2B   │                         │
│                       │   (Marcas/Web)    │                         │
│                       └──────────────────┘                          │
└────────────────────────────────────────────────────────────────────┘
```

### 16.2 Diagrama C4 — Nivel 2 (Contenedores)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         SmartCart Mobile App                              │
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │                    UI Layer (React Native)                         │   │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────┐  │   │
│  │  │ Lobby    │ │ Scanner  │ │ Pending  │ │ Checkout │ │Rewards │  │   │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └────────┘  │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                    │                                     │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │                  State Layer (Zustand + React Query)              │   │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────────┐   │   │
│  │  │Auth Store│ │Scan Store│ │Points   │ │React Query Cache │   │   │
│  │  │          │ │          │ │Store    │ │                  │   │   │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────────────┘   │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                    │                                     │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │              Service Layer (API Clients + Firebase)               │   │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────────┐   │   │
│  │  │API Client│ │Firebase  │ │Location  │ │Notification     │   │   │
│  │  │(Axios)   │ │Auth      │ │Service   │ │Service (FCM)    │   │   │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────────────┘   │   │
│  └──────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
```

### 16.3 Diagrama de flujo — Escaneo → Validación

```
Consumer App                    BFF (Cloud Functions)          Firestore
     │                                  │                        │
     │── Escanear producto ──────────────▶                        │
     │                                  │── validateBarcode() ──▶│
     │                                  │◀── product data ────── │
     │◀─ Product + Points ──────────────│                        │
     │                                  │                        │
     │── Confirmar producto ────────────▶                        │
     │                                  │── createPendingScan()─▶│
     │◀─ Added to pending ──────────────│                        │
     │                                  │                        │
     │── Generar QR ────────────────────▶                        │
     │                                  │── createSession() ────▶│
     │◀─ QR data + sessionId ───────────│                        │
     │                                  │                        │
     │── (listener: onSnapshot) ─────────────────────────────────▶│
     │                                  │                        │
     │                    ┌─────────────┤                        │
     │                    │ Cashier     │── scan QR ─────────────▶│
     │                    │             │── updateSession() ────▶│
     │                    └─────────────┤                        │
     │◀─ (snapshot: confirmed) ─────────┼────────────────────────│
     │                                  │                        │
     │── fetchPoints() ────────────────▶│── creditPoints() ────▶│
     │◀─ updated balance ───────────────│                        │
```

---

## 17. Optimización de Rendimiento

### 17.1 Lazy Loading y Code Splitting

```typescript
// app/checkout/qr.tsx
// Las pantallas de checkout se cargan con lazy loading (Expo Router lo hace por defecto)
// El código de QR generation (react-native-qrcode-svg) solo se carga cuando se navega a esta pantalla

// Para componentes pesados dentro de una pantalla:
import { lazy, Suspense } from 'react'

const QRCodeView = lazy(() => import('@/src/components/qr/QRCodeView'))

function QRScreen() {
  return (
    <Suspense fallback={<QRSkeleton />}>
      <QRCodeView sessionId={sessionId} />
    </Suspense>
  )
}
```

### 17.2 Reducción de bundles

- **EAS Build** con `expo-updates` para OTA updates (evita rebuild completo para cambios de JS)
- **Tree shaking**: `import { specificFunction } from 'library'` en lugar de imports completos
- **Imágenes**: `expo-image` con formato WebP, lazy loading, y caché automática
- **Iconos**: Solo los sets de FontAwesome que se usan (config en `app.json`)

### 17.3 Manejo eficiente de imágenes

```typescript
// Uso de expo-image para optimización automática
import { Image } from 'expo-image'

// Los productos patrocinados en el carrusel (pantalla-1-lobby.html:55)
<Image
  source={{ uri: product.imageUrl }}
  style={styles.productImage}
  placeholder={require('@/assets/placeholder.png')}
  contentFit="cover"
  transition={300}
  cachePolicy="memory-disk"
/>
```

### 17.4 Memoización

```typescript
// src/components/product/ProductCard.tsx
import React, { memo } from 'react'

export const ProductCard = memo(function ProductCard({ product, variant }: Props) {
  return (
    /* render */
  )
}, (prev, next) =>
  prev.product.id === next.product.id &&
  prev.variant === next.variant
)
```

### 17.5 Virtualización (listas largas)

```typescript
// src/screens/pending.tsx
// La lista de productos pendientes usa FlatList para virtualización
import { FlatList } from 'react-native'

function PendingList() {
  const { scannedProducts } = useScanStore()

  return (
    <FlatList
      data={scannedProducts}
      renderItem={({ item }) => <PendingProductItem product={item} />}
      keyExtractor={(item) => item.id}
      getItemLayout={(_, index) => ({
        length: ITEM_HEIGHT,
        offset: ITEM_HEIGHT * index,
        index,
      })}
      windowSize={5}
      maxToRenderPerBatch={10}
    />
  )
}
```

### 17.6 Optimización para la pantalla de escaneo

La cámara de escaneo (vista en `pantalla-2-camara-escaneando.html`) es crítica de rendimiento:

- `expo-camera` con `ratio: '16:9'` para resolución balanceada
- `onBarcodeScanned` con debounce de 500ms para evitar escaneos duplicados
- La cámara se apaga cuando la app pasa a background (AppState listener)
- Overlay del marco de escaneo es un SVG estático (no se re-renderiza)

```typescript
// src/hooks/useBarcodeScanner.ts
export function useBarcodeScanner() {
  const [isScanning, setIsScanning] = useState(true)
  const lastScanned = useRef<string | null>(null)

  const handleBarcodeScanned = useCallback(
    debounce((data: { data: string; type: string }) => {
      if (data.data === lastScanned.current) return  // Evita duplicados
      lastScanned.current = data.data
      setIsScanning(false)
      // Procesar código
    }, 500),
    []
  )

  return { isScanning, handleBarcodeScanned, resumeScanning: () => setIsScanning(true) }
}
```

---

## Apéndice A: Referencia cruzada prototipo → código

| Pantalla HTML | Archivo en `app/` | Componentes clave |
|---|---|---|
| `pantalla-1-lobby.html` | `app/(tabs)/index.tsx` | `PointsCard`, `SponsoredCarousel`, `ReminderCard`, `LocationPill` |
| `pantalla-2-camara-escaneando.html` | `app/(tabs)/scan.tsx` | `ScanFrame`, `CameraPreview`, `LocationPill` |
| `pantalla-2B-ingreso-manual.html` | `app/scan/manual.tsx` | `NumericKeypad`, `BarcodeInput` |
| `pantalla-2C-confirmar-producto.html` | `app/scan/confirm.tsx` | `ProductCard` (big variant), `VerifyCard` |
| `pantalla-3-producto-escaneado.html` | `app/product/[id].tsx` | `SuccessHero`, `StepProgress`, `ProductCard` |
| `pantalla-4-pendientes.html` | `app/(tabs)/pending.tsx` | `PendingSummary`, `PendingList` |
| `pantalla-5-qr-validacion.html` | `app/checkout/qr.tsx` | `QRDisplay`, `WaitingIndicator` |
| `pantalla-6-confirmacion.html` | `app/checkout/confirmed.tsx` | `PointsResult`, `ValidatedList`, `TicketTotal` |
| `pantalla-7-recompensas.html` | `app/rewards/index.tsx` | `BalanceCard`, `RewardCard`, `FeaturedCoupon` |

## Apéndice B: Principios de diseño aplicados

| Principio | Dónde se aplica |
|---|---|
| **Divide and Conquer** | Arquitectura en 4 capas (UI → State → Services → Data). Cada capa tiene responsabilidad única. |
| **Cohesion** | Componentes agrupados por dominio (`product/`, `scan/`, `points/`). |
| **Reducing Coupling** | Servicios inyectados via hooks (no acceso directo). Stores desacoplados de componentes. |
| **Level of Abstraction** | BFF abstrae microservicios internos. Hooks abstraen lógica de estado de los componentes. |
| **Reusability** | `src/components/ui/` con componentes atómicos reutilizables. |
| **Flexibility** | Factory pattern para `ProductCard`. Adapter para `LocationProvider`. |
| **Anticipating Obsolescence** | Zod schemas como contrato único. Adapter pattern en servicios externos. |
| **Portability** | React Native + Expo permite compartir ~90% del código entre iOS y Android. |
| **Testability** | Inyección de dependencias via hooks. Stores puros sin side effects. |
| **Defensive Design** | Zod validation en runtime. Error boundary en cada pantalla. |
| **SOLID** | SRP: cada store maneja un dominio. OCP: componentes extensibles via variants. DIP: servicios dependen de interfaces. |
| **DRY** | Centralización de estilos en theme/, validación en Zod schemas, lógica de escaneo en `useBarcodeScanner`. |
