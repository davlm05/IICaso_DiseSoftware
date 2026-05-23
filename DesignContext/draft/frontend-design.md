# 2. Diseño del Frontend

> **SmartCart** — Plataforma de perfilamiento predictivo e inteligencia de mercado para comercio regional.  
> Dos frontends: la app móvil del consumidor (`/mobile`) y el dashboard analítico B2B (`/dashboard`).

---

## 2.1 Stack de Tecnologías

### Frontends del proyecto

| App | Tecnología base | Audiencia |
|-----|----------------|-----------|
| **SmartCart Mobile** | React Native 0.74 + Expo SDK 51 | Consumidores en tienda |
| **SmartCart Dashboard** | Next.js 14.2 (App Router) | Supermercados y marcas (B2B) |

---

### Tabla de dependencias con versiones

#### SmartCart Mobile (`/mobile`)

| Librería | Versión | Justificación |
|----------|---------|---------------|
| `react-native` | 0.74.x | Core del framework móvil multiplataforma |
| `expo` | ~51.0 | Simplifica builds, acceso a APIs nativas (cámara, location, notificaciones) |
| `expo-camera` | ~15.0 | Acceso nativo a cámara para escaneo de código de barras |
| `expo-barcode-scanner` | ~13.0 | Lectura de EAN-13 y QR codes |
| `expo-location` | ~17.0 | Geolocalización para detectar sucursal activa |
| `expo-notifications` | ~0.28 | Push notifications para cupones en tiempo real |
| `react-navigation` | 6.x | Navegación entre pantallas con stack y bottom tabs |
| `zustand` | 4.5.x | Estado global ligero (carrito, sesión, puntos) |
| `@tanstack/react-query` | 5.x | Fetching, caché y sincronización con el backend |
| `axios` | 1.7.x | Cliente HTTP con interceptores para auth y errores |
| `react-hook-form` | 7.x | Manejo de formularios con validación (ingreso manual) |
| `zod` | 3.x | Validación de esquemas TypeScript-first |
| `nativewind` | 4.x | Tailwind CSS para React Native |
| `@expo/vector-icons` | 14.x | Font Awesome 6 y otros icon sets (consistencia con prototipo) |
| `expo-secure-store` | ~13.0 | Almacenamiento cifrado de tokens (equivalente a Keychain/Keystore) |
| `react-native-reanimated` | 3.x | Animaciones de alto rendimiento |
| `@sentry/react-native` | 5.x | Monitoreo de errores y performance en producción |

#### SmartCart Dashboard (`/dashboard`)

| Librería | Versión | Justificación |
|----------|---------|---------------|
| `next` | 14.2.x | SSR/SSG, App Router, Server Components para dashboards de datos |
| `react` | 18.3.x | Base UI |
| `typescript` | 5.4.x | Type safety end-to-end |
| `tailwindcss` | 3.4.x | Sistema de diseño utilitario, consistente con NativeWind |
| `@tanstack/react-query` | 5.x | Fetching y caché (misma librería que mobile, mismos contratos) |
| `recharts` | 2.12.x | Gráficas de comportamiento de consumo y segmentación |
| `@radix-ui/react-*` | latest | Componentes accesibles headless (modales, dropdowns, tooltips) |
| `zustand` | 4.5.x | Estado global (filtros, sesión de admin) |
| `next-auth` | 4.24.x | Autenticación OAuth/JWT para acceso de marcas y supermercados |
| `zod` | 3.x | Validación de contratos de API compartidos |
| `axios` | 1.7.x | Cliente HTTP con interceptores |
| `@sentry/nextjs` | 8.x | Monitoreo de errores SSR y cliente |

**Justificación general de elecciones:**

- **React Native + Expo** sobre Flutter: ecosistema más maduro para integraciones con librerías web (React Query, Zustand), el equipo comparte lógica de negocio y contratos entre mobile y dashboard al estar ambos en TypeScript/React.
- **Next.js 14** sobre Vite+React SPA: el dashboard tiene rutas que necesitan SSR para cargar datos iniciales sin loading states, y facilita SEO para páginas de landing del producto.
- **Zustand** sobre Redux: menor boilerplate, más simple para un equipo que mantiene estado relativamente simple (sesión, carrito, filtros). Evita sobreingeniería.
- **TanStack Query** sobre SWR: soporte superior para mutaciones optimistas, reintentos configurables, y gestión de caché granular — crítico para el carrito en tiempo real.
- **Zod** compartido entre mobile y dashboard: los esquemas de validación son la única fuente de verdad para los contratos de la API.

---

## 2.2 Hosting y Servicios Cloud (AWS)

### Diagrama de infraestructura

```
┌─────────────────────────────────────────────────────────┐
│                       USUARIOS                          │
│    Consumidor (iOS/Android)    Marca/Supermercado (Web) │
└────────────┬──────────────────────────┬─────────────────┘
             │                          │
     ┌───────▼───────┐         ┌────────▼────────┐
     │  Expo EAS     │         │  AWS CloudFront  │
     │  (App Store / │         │  CDN + WAF       │
     │  Play Store)  │         └────────┬─────────┘
     └───────────────┘                  │
                                ┌───────▼────────┐
                                │  AWS Amplify   │
                                │  (Next.js SSR) │
                                │  dashboard/    │
                                └────────────────┘
```

| Servicio | Uso |
|----------|-----|
| **Expo EAS Build** | Compilación y firma de binarios iOS/Android en CI |
| **Expo EAS Submit** | Publicación automática a App Store y Play Store |
| **AWS Amplify** | Hosting del dashboard Next.js con SSR, CI/CD integrado |
| **AWS CloudFront** | CDN global, caché de assets estáticos, WAF integrado |
| **AWS S3** | Assets estáticos (imágenes de productos, logos de marcas) |
| **AWS Cognito** (opcional) | Identity pool si se opta por auth federada en el dashboard |
| **AWS CloudWatch** | Logs y alertas del dashboard SSR |

**Ambientes:**

| Ambiente | Branch | URL Dashboard |
|----------|--------|---------------|
| `development` | `develop` | `dev.dashboard.smartcart.app` |
| `staging` | `staging` | `staging.dashboard.smartcart.app` |
| `production` | `main` | `dashboard.smartcart.app` |

---

## 2.3 Estructura de Carpetas del Proyecto

```
smartcart/
├── mobile/                          # React Native + Expo
│   ├── app/                         # Expo Router (file-based routing)
│   │   ├── (auth)/
│   │   │   ├── login.tsx
│   │   │   └── register.tsx
│   │   ├── (tabs)/
│   │   │   ├── index.tsx            # Pantalla 1: Lobby
│   │   │   ├── scan.tsx             # Pantalla 2: Cámara escaneando
│   │   │   ├── pending.tsx          # Pantalla 4: Pendientes
│   │   │   └── profile.tsx
│   │   ├── scan/
│   │   │   ├── manual.tsx           # Pantalla 2B: Ingreso manual
│   │   │   ├── confirm.tsx          # Pantalla 2C: Confirmar producto
│   │   │   └── success.tsx          # Pantalla 3: Producto escaneado
│   │   ├── checkout/
│   │   │   ├── qr.tsx               # Pantalla 5: QR validación
│   │   │   └── confirmation.tsx     # Pantalla 6: Confirmación
│   │   └── rewards.tsx              # Pantalla 7: Recompensas
│   ├── src/
│   │   ├── components/
│   │   │   ├── ui/                  # Átomos reutilizables
│   │   │   │   ├── Button.tsx
│   │   │   │   ├── Card.tsx
│   │   │   │   ├── PointsBadge.tsx
│   │   │   │   └── index.ts
│   │   │   ├── features/            # Componentes de dominio
│   │   │   │   ├── cart/
│   │   │   │   ├── scanner/
│   │   │   │   ├── rewards/
│   │   │   │   └── sponsored/
│   │   │   └── layout/
│   │   │       ├── BottomNav.tsx
│   │   │       └── TopBar.tsx
│   │   ├── hooks/                   # Custom hooks
│   │   │   ├── useCartStore.ts
│   │   │   ├── useSession.ts
│   │   │   ├── useBarcode.ts
│   │   │   └── useLocation.ts
│   │   ├── stores/                  # Zustand stores
│   │   │   ├── cartStore.ts
│   │   │   ├── sessionStore.ts
│   │   │   └── notificationStore.ts
│   │   ├── services/                # Capa de API
│   │   │   ├── api.ts               # Instancia axios + interceptores
│   │   │   ├── authService.ts
│   │   │   ├── productService.ts
│   │   │   └── rewardsService.ts
│   │   ├── schemas/                 # Zod schemas (contratos de datos)
│   │   │   ├── product.schema.ts
│   │   │   ├── session.schema.ts
│   │   │   └── cart.schema.ts
│   │   ├── security/
│   │   │   ├── tokenManager.ts      # Gestión de JWT + refresh
│   │   │   ├── sessionGuard.tsx     # HOC de protección de rutas
│   │   │   └── permissionChecker.ts
│   │   ├── constants/
│   │   │   ├── theme.ts             # Colores, tipografía, espaciados
│   │   │   └── routes.ts
│   │   └── utils/
│   │       ├── formatters.ts
│   │       └── validators.ts
│   ├── __tests__/
│   ├── e2e/                         # Detox tests
│   └── app.json
│
├── dashboard/                       # Next.js 14
│   ├── app/
│   │   ├── (auth)/
│   │   │   └── login/page.tsx
│   │   ├── (protected)/
│   │   │   ├── overview/page.tsx
│   │   │   ├── segments/page.tsx
│   │   │   ├── products/page.tsx
│   │   │   └── reports/page.tsx
│   │   ├── api/
│   │   │   └── auth/[...nextauth]/route.ts
│   │   └── layout.tsx
│   ├── src/
│   │   ├── components/
│   │   │   ├── ui/
│   │   │   ├── charts/
│   │   │   └── layout/
│   │   ├── hooks/
│   │   ├── stores/
│   │   ├── services/
│   │   └── schemas/                 # Schemas Zod reutilizados desde @smartcart/schemas
│   └── next.config.ts
│
└── packages/
    └── schemas/                     # Monorepo: schemas Zod compartidos
        ├── product.schema.ts
        ├── session.schema.ts
        └── index.ts
```

---

## 2.4 Diseño y Estrategia de Componentes

Se aplica **Atomic Design** adaptado a React Native y Next.js:

| Nivel | Descripción | Ejemplos |
|-------|-------------|---------|
| **Átomos** | Primitivas sin lógica de negocio | `Button`, `Badge`, `Input`, `Icon` |
| **Moléculas** | Combinaciones de átomos | `ProductCard`, `PointsBadge`, `BarcodeInput` |
| **Organismos** | Secciones funcionales completas | `SponsoredCarousel`, `CartList`, `QRDisplay` |
| **Plantillas** | Layout de pantalla sin datos reales | `ScanLayout`, `RewardsLayout` |
| **Páginas** | Pantallas con datos reales | `LobbyScreen`, `PendingScreen` |

### Ejemplo de componente átomo (`/mobile/src/components/ui/Button.tsx`)

```tsx
// /mobile/src/components/ui/Button.tsx
import { TouchableOpacity, Text, ActivityIndicator } from 'react-native';
import { styled } from 'nativewind';

type Variant = 'primary' | 'secondary';

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: Variant;
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
}

const variantStyles: Record<Variant, { container: string; text: string }> = {
  primary: {
    container: 'bg-primary rounded-2xl py-4 flex-row justify-center items-center gap-3 shadow-primary',
    text: 'text-white font-extrabold text-base',
  },
  secondary: {
    container: 'bg-transparent border border-primary rounded-2xl py-4 flex-row justify-center items-center gap-3',
    text: 'text-primary font-semibold text-base',
  },
};

export function Button({ label, onPress, variant = 'primary', loading, disabled, icon }: ButtonProps) {
  const styles = variantStyles[variant];
  return (
    <TouchableOpacity
      className={`${styles.container} ${disabled ? 'opacity-50' : ''}`}
      onPress={onPress}
      disabled={disabled || loading}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      {loading ? <ActivityIndicator color="white" /> : icon}
      <Text className={styles.text}>{label}</Text>
    </TouchableOpacity>
  );
}
```

### Ejemplo de componente organismo (`/mobile/src/components/features/sponsored/SponsoredCarousel.tsx`)

```tsx
// /mobile/src/components/features/sponsored/SponsoredCarousel.tsx
import { ScrollView } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { getSponsoredProducts } from '@/services/productService';
import { ProductCard } from '@/components/ui/ProductCard';
import { SponsoredProduct } from '@/schemas/product.schema';

export function SponsoredCarousel({ storeId }: { storeId: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ['sponsored', storeId],
    queryFn: () => getSponsoredProducts(storeId),
    staleTime: 5 * 60 * 1000,  // 5 minutos de caché
  });

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} className="gap-x-3">
      {data?.map((product: SponsoredProduct) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </ScrollView>
  );
}
```

---

## 2.5 Convenciones de Nomenclatura

| Elemento | Convención | Ejemplo |
|----------|-----------|---------|
| Componentes React | `PascalCase` | `ProductCard.tsx`, `SponsoredCarousel.tsx` |
| Archivos de hooks | `camelCase` con prefijo `use` | `useCartStore.ts`, `useBarcode.ts` |
| Archivos de stores | `camelCase` con sufijo `Store` | `cartStore.ts`, `sessionStore.ts` |
| Archivos de servicios | `camelCase` con sufijo `Service` | `productService.ts`, `authService.ts` |
| Esquemas Zod | `camelCase` con sufijo `.schema` | `product.schema.ts` |
| Constantes | `SCREAMING_SNAKE_CASE` | `MAX_CART_ITEMS`, `TOKEN_EXPIRY_MINUTES` |
| Carpetas de features | `kebab-case` plural | `features/cart/`, `features/scanner/` |
| Carpetas de rutas (Expo Router) | `kebab-case` | `scan/confirm.tsx`, `checkout/qr.tsx` |
| Clases CSS/NativeWind | Tailwind utilities; BEM solo si custom CSS | `bg-primary`, `pts-card` |
| Tipos e interfaces TypeScript | `PascalCase` con prefijo descriptivo | `ProductSchema`, `CartItem`, `UserSession` |

---

## 2.6 Lineamientos de CSS, Estilos y Branding

### Paleta de colores

Extraída directamente de los prototipos HTML (`pantalla-1-lobby.html`):

```ts
// /mobile/src/constants/theme.ts
export const colors = {
  // Primarios
  primary:         '#1D9E75',  // Verde SmartCart – CTAs, puntos, íconos activos
  primaryDark:     '#0d6e48',  // Hover / pressed state
  primaryDarker:   '#0d5c40',  // Avatar, texto de énfasis
  primaryAccent:   '#1a7a58',  // Tags, screen labels

  // Fondo y superficies
  bgApp:           '#e8ede8',  // Fondo general de la app (verde muy suave)
  bgSurface:       '#f5f7f5',  // Fondo de tarjetas y topbar
  bgCard:          '#ffffff',  // Tarjetas flotantes

  // Texto
  textPrimary:     '#1a2a1a',  // Texto principal (casi negro con tono verde)
  textMuted:       '#7a8a7a',  // Texto secundario, etiquetas

  // Bordes y divisores
  border:          '#dfe6df',  // Bordes de tarjetas y nav
  borderAccent:    '#9fd4b8',  // Bordes con acento verde (row de ubicación)

  // Mint / Acento suave
  mintLight:       '#c8e8d8',  // Avatar background
  mintSubtle:      '#f0f5f0',  // Chips de reminder, fondos de íconos

  // Semánticos
  success:         '#1D9E75',
  error:           '#D94F4F',
  warning:         '#E8A020',
  info:            '#3B82F6',
} as const;
```

### Tipografía

```ts
// /mobile/src/constants/theme.ts
export const typography = {
  fontFamily: {
    base:   'Inter_400Regular',
    medium: 'Inter_500Medium',
    bold:   'Inter_700Bold',
    black:  'Inter_900Black',
  },
  size: {
    xs:   10,   // Etiquetas pequeñas (pts-pending-lbl)
    sm:   11,   // Chips, badges
    base: 12,   // Cuerpo secundario
    md:   13,   // Cuerpo principal, títulos de sección
    lg:   17,   // Botones primarios
    xl:   18,   // Logo
    '2xl': 22,  // Números secundarios
    '4xl': 46,  // Número de puntos destacado
  },
  weight: {
    regular: '400',
    semibold: '600',
    bold: '700',
    extrabold: '800',
  },
} as const;
```

> **Fuente:** Inter (Google Fonts via `expo-font`). Sustituye a `Segoe UI` del prototipo por ser una fuente de sistema de Windows no disponible en iOS/Android. Inter mantiene la misma neutralidad geométrica.

### Iconografía

- **Librería:** `@expo/vector-icons` — subconjunto `FontAwesome6` (mantiene paridad con el prototipo HTML que usa Font Awesome 6.5.0).
- **Uso exclusivo:** Los íconos de navegación, acciones y estados son siempre de FA6. No mezclar con otras familias de íconos.

```tsx
import { FontAwesome6 } from '@expo/vector-icons';
<FontAwesome6 name="barcode" size={22} color={colors.primary} />
```

### Espaciados y bordes redondeados

```ts
// /mobile/src/constants/theme.ts
export const spacing = {
  xs: 4, sm: 8, md: 12, lg: 16, xl: 20, '2xl': 24,
} as const;

export const radius = {
  sm:   10,   // Notch, elementos pequeños
  md:   12,   // Chips, badges, cards pequeñas
  lg:   14,   // Tarjetas de productos patrocinados
  xl:   18,   // Botón de escanear
  '2xl': 20,  // Tarjeta de puntos
  full: 9999, // Píldoras (reminder chips)
} as const;
```

### Logo

```
Smart[Cart]
```
- `Smart` en peso 800, color `#1a2a1a`
- `Cart` en peso 800, color `#1D9E75` (verde primario)
- Ambas palabras sin espacio, fuente Inter Black

### Responsive Design

La app móvil se diseña para pantallas de **360–430 px de ancho** (target principal: 390px — iPhone 14). Se usa `useWindowDimensions` de React Native para ajustes dinámicos. El dashboard Next.js usa breakpoints Tailwind estándar (`sm`, `md`, `lg`, `xl`).

### Branding del Dashboard (B2B)

El dashboard mantiene la paleta de colores pero con un look más formal: fondo blanco/gris claro, tablas de datos, gráficas con el verde primario como color principal de datasets. Los logos de las marcas (Nestlé, Unilever, etc.) se muestran en escala de grises hasta que el usuario interactúa.

---

## 2.7 Prototipado y Decisiones de UX Testing

### Pantallas del prototipo (`/files/pantalla-*.html`)

| Pantalla | Archivo | Flujo |
|----------|---------|-------|
| 1 – Lobby | `pantalla-1-lobby.html` | Home con puntos, productos patrocinados y lista de recordatorio |
| 2 – Cámara | `pantalla-2-camara-escaneando.html` | Visor de cámara para escaneo de barcode |
| 2B – Manual | `pantalla-2B-ingreso-manual.html` | Fallback de ingreso manual del código EAN-13 |
| 2C – Confirmar | `pantalla-2C-confirmar-producto.html` | Confirmación del producto detectado |
| 3 – Escaneado | `pantalla-3-producto-escaneado.html` | Confirmación de producto añadido al carrito |
| 4 – Pendientes | `pantalla-4-pendientes.html` | Lista de carrito con opción de generar QR |
| 5 – QR | `pantalla-5-qr-validacion.html` | Código QR para mostrar en caja |
| 6 – Confirmación | `pantalla-6-confirmacion.html` | Compra confirmada, puntos acreditados |
| 7 – Recompensas | `pantalla-7-recompensas.html` | Catálogo de recompensas canjeables |

### Decisiones derivadas del UX Testing

1. **Flujo de escaneo con fallback manual:** Los usuarios en pruebas tuvieron dificultad escaneando productos con empaques dañados → se agregó la pantalla 2B de ingreso manual del EAN-13 accesible con un solo tap.
2. **Confirmación visual explícita:** Antes del prototipo, la app no mostraba el nombre del producto antes de añadirlo. El UX test reveló ansiedad en los usuarios → se añadió pantalla 2C con imagen, nombre y precio del producto para confirmar.
3. **QR code en lugar de Bluetooth:** Se evaluó integración directa con las cajas mediante BLE. Los usuarios no confiaban en la conexión invisible → el QR es tangible, visible y genera confianza.
4. **Puntos pendientes visibles:** En el lobby, los puntos "en tránsito" de compras no validadas se muestran explícitamente (+15 pendientes) para evitar frustración por puntos "perdidos".
5. **Bottom nav de 4 ítems:** Tests con 5 ítems generaron confusión sobre cuál tab tocar primero → se redujo a 4 (Inicio, Escanear, Pendientes, Perfil) priorizando el flujo principal.

---

## 2.8 Autenticación, Autorización y Seguridad de Sesiones

### Mecanismo de autenticación

Se usa autenticación basada en **JWT (JSON Web Tokens)** con refresh token rotatorio:

```
Usuario → POST /auth/login → { accessToken (15 min), refreshToken (7 días) }
```

- `accessToken`: almacenado en memoria (estado de Zustand). **Nunca** en AsyncStorage ni localStorage.
- `refreshToken`: almacenado en `expo-secure-store` (iOS Keychain / Android Keystore). Cifrado en reposo por el SO.

```ts
// /mobile/src/security/tokenManager.ts
import * as SecureStore from 'expo-secure-store';

const REFRESH_KEY = 'sc_refresh_token';

export const tokenManager = {
  async saveRefreshToken(token: string): Promise<void> {
    await SecureStore.setItemAsync(REFRESH_KEY, token, {
      keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
    });
  },

  async getRefreshToken(): Promise<string | null> {
    return SecureStore.getItemAsync(REFRESH_KEY);
  },

  async clearTokens(): Promise<void> {
    await SecureStore.deleteItemAsync(REFRESH_KEY);
    sessionStore.getState().clearSession();
  },
};
```

### Autorización — RBAC

Roles definidos en el sistema:

| Rol | Acceso |
|-----|--------|
| `consumer` | App móvil: escaneo, carrito, puntos, recompensas |
| `store_admin` | Dashboard: inventario de su sucursal, reportes propios |
| `brand_analyst` | Dashboard: insights de sus productos, campañas |
| `platform_admin` | Dashboard completo, gestión de usuarios y supermercados |

```tsx
// /mobile/src/security/sessionGuard.tsx
import { useSessionStore } from '@/stores/sessionStore';
import { Redirect } from 'expo-router';

export function SessionGuard({ children }: { children: React.ReactNode }) {
  const { user, accessToken } = useSessionStore();
  if (!user || !accessToken) return <Redirect href="/(auth)/login" />;
  return <>{children}</>;
}
```

### Expiración de tokens y refresh automático

```ts
// /mobile/src/services/api.ts
import axios from 'axios';
import { tokenManager } from '@/security/tokenManager';
import { sessionStore } from '@/stores/sessionStore';

export const apiClient = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL,
  timeout: 10_000,
});

// Adjunta el access token en cada request
apiClient.interceptors.request.use((config) => {
  const token = sessionStore.getState().accessToken;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Refresca el token si el servidor devuelve 401
apiClient.interceptors.response.use(
  (res) => res,
  async (error) => {
    if (error.response?.status !== 401) return Promise.reject(error);
    const refreshToken = await tokenManager.getRefreshToken();
    if (!refreshToken) {
      await tokenManager.clearTokens();
      return Promise.reject(error);
    }
    try {
      const { data } = await axios.post(`${process.env.EXPO_PUBLIC_API_URL}/auth/refresh`, { refreshToken });
      sessionStore.getState().setAccessToken(data.accessToken);
      error.config.headers.Authorization = `Bearer ${data.accessToken}`;
      return apiClient(error.config);
    } catch {
      await tokenManager.clearTokens();
      return Promise.reject(error);
    }
  }
);
```

### Privacidad de datos y masking

- Los datos biométricos del usuario (comportamiento de compra, ubicación) se anonomizan antes de enviarse al motor de IA usando un UUID interno que no tiene relación con el PII del usuario.
- En el dashboard B2B, los identificadores de consumidores se muestran siempre enmascarados: `user_a8f3***` — nunca nombre real ni email.
- Las notificaciones push contienen solo IDs de cupones, no datos del carrito.

```ts
// /mobile/src/utils/privacy.ts
export const maskUserId = (id: string): string =>
  `user_${id.slice(0, 4)}***`;
```

---

## 2.9 Estándares de Seguridad OWASP

Se aplican los controles de **OWASP Mobile Top 10 (M1–M10)** y **OWASP Top 10 Web**:

| Amenaza OWASP | Control implementado |
|---------------|---------------------|
| **M1 – Credenciales impropias** | Tokens en SecureStore, nunca en AsyncStorage o logs |
| **M2 – Seguridad de datos insuficiente** | Cifrado en reposo via OS (iOS Keychain / Android Keystore) |
| **M3 – Comunicación insegura** | HTTPS obligatorio, certificate pinning con `expo-certificate-pinning` |
| **M4 – Autenticación débil** | JWT con expiración de 15 min + refresh rotatorio |
| **M5 – Controles de autorización insuficientes** | RBAC validado en el servidor, el cliente no toma decisiones de seguridad |
| **A01 – Broken Access Control** | Rutas protegidas con `SessionGuard`, permisos verificados en cada request |
| **A02 – Cryptographic Failures** | Refresh tokens nunca viajan en query strings; solo en body de POST |
| **A03 – Injection** | Toda entrada de usuario pasa por esquemas Zod antes de enviarse a la API |
| **A07 – Auth Failures** | Refresh tokens de un solo uso (rotación), invalidación de sesiones activas |

### Content Security Policy (Dashboard Next.js)

```ts
// /dashboard/next.config.ts
const securityHeaders = [
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  {
    key: 'Content-Security-Policy',
    value: "default-src 'self'; script-src 'self' 'unsafe-eval'; img-src 'self' data: https://cdn.smartcart.app",
  },
];
```

---

## 2.10 Patrones Arquitectónicos del Frontend

Se adopta **Feature-Sliced Design (FSD)** combinado con **Clean Architecture en capas**:

```
┌───────────────────────────────┐
│  Páginas / Pantallas (app/)   │  ← Ensamblado de features
├───────────────────────────────┤
│  Features (scanner, rewards)  │  ← Lógica de dominio + UI
├───────────────────────────────┤
│  Components/UI (átomos)       │  ← Presentación sin lógica
├───────────────────────────────┤
│  Services / Hooks             │  ← Comunicación con APIs
├───────────────────────────────┤
│  Stores (Zustand)             │  ← Estado global
├───────────────────────────────┤
│  Schemas (Zod)                │  ← Contratos de datos
└───────────────────────────────┘
```

**Regla de dependencia:** Las capas superiores pueden importar de capas inferiores, nunca al revés. Los componentes UI no importan stores directamente; reciben datos via props o custom hooks.

---

## 2.11 Patrones de Diseño Orientados a Objetos y de Componentes

### Observer — Notificaciones push en tiempo real

Cuando el usuario está en el pasillo de bebidas, el sistema escucha eventos del servidor y actualiza la UI con cupones relevantes:

```ts
// /mobile/src/services/notificationService.ts
type NotificationHandler = (coupon: Coupon) => void;

class NotificationService {
  private handlers: Set<NotificationHandler> = new Set();

  subscribe(handler: NotificationHandler) {
    this.handlers.add(handler);
    return () => this.handlers.delete(handler);
  }

  emit(coupon: Coupon) {
    this.handlers.forEach(h => h(coupon));
  }
}

export const notificationService = new NotificationService();
```

### Singleton — Instancia global del cliente API

```ts
// /mobile/src/services/api.ts — export de la instancia única
export const apiClient = axios.create({ ... });
// Todos los servicios importan este mismo objeto, nunca crean uno nuevo
```

### Factory — Creación de items del carrito

```ts
// /mobile/src/features/cart/cartItemFactory.ts
export function createCartItem(product: ScannedProduct): CartItem {
  return {
    id: crypto.randomUUID(),
    productId: product.id,
    name: product.name,
    price: product.price,
    points: product.sponsoredPoints ?? 0,
    scannedAt: new Date().toISOString(),
  };
}
```

### Compound Components — Tarjeta de puntos reutilizable

```tsx
// /mobile/src/components/features/rewards/PointsCard/index.tsx
export function PointsCard({ children }: { children: React.ReactNode }) { ... }
PointsCard.Progress = PointsProgress;
PointsCard.Pending = PointsPending;

// Uso:
<PointsCard>
  <PointsCard.Progress current={120} goal={200} />
  <PointsCard.Pending count={15} />
</PointsCard>
```

### Adapter — Normalización de respuestas de API

El backend puede devolver distintos formatos según el endpoint. El adapter normaliza antes de que llegue al store:

```ts
// /mobile/src/services/productService.ts
import { ProductSchema, type Product } from '@/schemas/product.schema';

export async function getProduct(barcode: string): Promise<Product> {
  const { data } = await apiClient.get(`/products/${barcode}`);
  return ProductSchema.parse(data);   // Zod valida y normaliza
}
```

---

## 2.12 Storage, WebSockets, Async, Estado y Caché

### Almacenamiento local

| Mecanismo | Uso en SmartCart | Justificación |
|-----------|-----------------|---------------|
| **Zustand (memoria)** | `accessToken`, estado del carrito activo, estado de UI | Rápido, no persiste entre sesiones (seguro para tokens) |
| **expo-secure-store** | `refreshToken` | Cifrado por el SO, necesario para tokens sensibles |
| **AsyncStorage** | Preferencias de usuario (idioma, notificaciones activadas) | Solo datos no sensibles, sin PII |
| **TanStack Query caché** | Respuestas de API (productos, sponsored) | Invalidación automática con `staleTime` |
| **NO usar** | `localStorage` o `sessionStorage` (web) para tokens | Vulnerable a XSS |

### WebSockets — Cupones en tiempo real

```ts
// /mobile/src/hooks/useRealTimeCoupons.ts
import { useEffect } from 'react';
import { notificationService } from '@/services/notificationService';

export function useRealTimeCoupons(storeId: string) {
  useEffect(() => {
    const ws = new WebSocket(`${process.env.EXPO_PUBLIC_WS_URL}/stores/${storeId}/coupons`);

    ws.onmessage = (event) => {
      const coupon = JSON.parse(event.data);
      notificationService.emit(coupon);           // Observer pattern
      cartStore.getState().addActiveCoupon(coupon);
    };

    ws.onerror = () => scheduleReconnect();        // Retry exponencial
    return () => ws.close();
  }, [storeId]);
}
```

### Manejo de procesos largos (escaneo y validación)

El flujo de escaneo → validación → acreditación de puntos puede tardar varios segundos. Se usa un **estado de máquina** explícito:

```ts
type ScanState = 'idle' | 'scanning' | 'validating' | 'confirmed' | 'error';
```

La UI reacciona a cada estado mostrando feedback inmediato (spinner, checkmark, mensaje de error) para evitar que el usuario duplique acciones.

### Manejo de errores global

```ts
// /mobile/src/services/api.ts — interceptor de errores
apiClient.interceptors.response.use(undefined, (error) => {
  const status = error.response?.status;
  if (status >= 500) Sentry.captureException(error);   // Monitoreo automático
  return Promise.reject(error);
});
```

### Reintentos (Retries)

TanStack Query maneja reintentos automáticos con backoff exponencial:

```ts
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 3,
      retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 30_000),
    },
  },
});
```

---

## 2.13 Consumo de APIs y Contratos de Datos

### Contrato compartido con Zod

Los schemas Zod se definen una sola vez en `packages/schemas/` y se usan tanto en mobile como en dashboard:

```ts
// /packages/schemas/product.schema.ts
import { z } from 'zod';

export const ProductSchema = z.object({
  id:              z.string().uuid(),
  barcode:         z.string().length(13),
  name:            z.string().min(1),
  brand:           z.string(),
  price:           z.number().positive(),
  sponsoredPoints: z.number().nonnegative().optional(),
  imageUrl:        z.string().url().optional(),
});

export type Product = z.infer<typeof ProductSchema>;
```

### Capa de servicios

Cada servicio expone funciones tipadas que encapsulan la comunicación HTTP:

```ts
// /mobile/src/services/productService.ts
import { apiClient } from './api';
import { ProductSchema } from '@smartcart/schemas';

export const productService = {
  getByBarcode: async (barcode: string) => {
    const { data } = await apiClient.get(`/products/barcode/${barcode}`);
    return ProductSchema.parse(data);    // Falla si el backend devuelve datos incorrectos
  },

  confirmPurchase: async (cartId: string) => {
    const { data } = await apiClient.post(`/cart/${cartId}/confirm`);
    return data;
  },
};
```

---

## 2.14 Estrategia de CI/CD

### Pipeline (GitHub Actions)

```yaml
# .github/workflows/mobile-ci.yml
name: Mobile CI
on: [push, pull_request]

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - run: npm ci
      - run: npx tsc --noEmit              # Type checking
      - run: npx eslint src/               # Análisis estático
      - run: npm test -- --coverage        # Unit + integration tests

  build-preview:
    needs: validate
    if: github.ref != 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - uses: expo/expo-github-action@v8
        with: { expo-version: latest, token: ${{ secrets.EXPO_TOKEN }} }
      - run: eas build --platform all --profile preview --non-interactive

  deploy-production:
    needs: validate
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - run: eas build --platform all --profile production --non-interactive
      - run: eas submit --platform all --non-interactive
```

### Validaciones automáticas en cada PR

1. **TypeScript** (`tsc --noEmit`) — sin errores de tipos.
2. **ESLint** con plugin `@typescript-eslint` y reglas de seguridad.
3. **Jest** — cobertura mínima del 70% (ver sección 2.15).
4. **Zod schema validation** — los schemas compartidos deben pasar sus propios tests.
5. **Bundle size check** — alerta si el bundle crece más del 5% respecto al baseline.

---

## 2.15 Estrategia de Testing

### Unit Testing

**Herramienta:** Jest + `@testing-library/react-native`

```tsx
// /mobile/__tests__/components/Button.test.tsx
import { render, fireEvent } from '@testing-library/react-native';
import { Button } from '@/components/ui/Button';

test('llama onPress al tocar el botón', () => {
  const onPress = jest.fn();
  const { getByRole } = render(<Button label="Escanear" onPress={onPress} />);
  fireEvent.press(getByRole('button'));
  expect(onPress).toHaveBeenCalledTimes(1);
});
```

### Integration Testing

```ts
// /mobile/__tests__/services/productService.test.ts
import { productService } from '@/services/productService';
import { server } from '../mocks/server';  // MSW mock server
import { http, HttpResponse } from 'msw';

test('getByBarcode normaliza la respuesta del backend', async () => {
  server.use(
    http.get('*/products/barcode/1234567890123', () =>
      HttpResponse.json({ id: 'uuid', barcode: '1234567890123', name: 'Café', brand: 'Britt', price: 3250 })
    )
  );
  const product = await productService.getByBarcode('1234567890123');
  expect(product.price).toBe(3250);
  expect(product.barcode).toHaveLength(13);
});
```

### UI / E2E Testing

**Herramienta:** Detox (React Native E2E)

```ts
// /mobile/e2e/scanFlow.test.ts
describe('Flujo de escaneo completo', () => {
  it('escanea un producto y lo agrega al carrito', async () => {
    await element(by.id('scan-btn')).tap();
    await element(by.id('manual-entry-btn')).tap();
    await element(by.id('barcode-input')).typeText('1234567890123');
    await element(by.id('verify-btn')).tap();
    await expect(element(by.id('product-confirm-screen'))).toBeVisible();
    await element(by.id('confirm-yes-btn')).tap();
    await expect(element(by.id('product-added-screen'))).toBeVisible();
  });
});
```

### Cobertura mínima esperada

| Capa | Cobertura mínima |
|------|-----------------|
| Componentes UI (átomos) | 80% |
| Servicios / API layer | 85% |
| Stores (Zustand) | 75% |
| Hooks custom | 70% |
| Schemas (Zod) | 100% |
| **Total proyecto** | **70%** |

---

## 2.16 Diagramas de Arquitectura (Modelo C4)

### Nivel 1 — Contexto del sistema

```
┌─────────────────────────────────────────────────────────────────┐
│                        SmartCart Platform                       │
│                                                                 │
│  [Consumidor]──→[SmartCart Mobile App]──→[SmartCart Backend API]│
│                                                   │             │
│  [Supermercado]──→[SmartCart Dashboard]───────────┤             │
│                                                   │             │
│  [Marca/Anunciante]──→[SmartCart Dashboard]───────┘             │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Nivel 2 — Contenedores del frontend

```
┌────────────────────────────────────────────────────┐
│              SmartCart Mobile App                  │
│  (React Native + Expo, iOS/Android)                │
│                                                    │
│  ┌──────────┐ ┌──────────┐ ┌───────────────────┐  │
│  │  Screens │ │  Stores  │ │   Services Layer  │  │
│  │(Expo Rtr)│ │(Zustand) │ │  (Axios + TQ)     │  │
│  └──────────┘ └──────────┘ └────────┬──────────┘  │
└───────────────────────────────────────┼────────────┘
                                        │ HTTPS/JWT
┌────────────────────────────────────────┼────────────┐
│              SmartCart Dashboard       │            │
│  (Next.js 14, App Router)             │            │
│                                        │            │
│  ┌──────────┐ ┌──────────┐ ┌──────────┴────────┐  │
│  │  Pages   │ │  Stores  │ │   Services Layer  │  │
│  │(App Rtr) │ │(Zustand) │ │  (Axios + TQ)     │  │
│  └──────────┘ └──────────┘ └───────────────────┘  │
└────────────────────────────────────────────────────┘
```

---

## 2.17 Optimización de Rendimiento

### Lazy Loading y Code Splitting

Expo Router aplica code splitting automático por ruta. Para componentes pesados (gráficas del dashboard):

```tsx
// /dashboard/app/(protected)/segments/page.tsx
import dynamic from 'next/dynamic';

const ConsumerSegmentChart = dynamic(
  () => import('@/components/charts/ConsumerSegmentChart'),
  { loading: () => <ChartSkeleton />, ssr: false }
);
```

### Memoización

```tsx
// /mobile/src/components/features/sponsored/SponsoredCarousel.tsx
import { memo, useCallback } from 'react';

export const SponsoredCarousel = memo(function SponsoredCarousel({ storeId }: { storeId: string }) {
  // Evita re-renders cuando el storeId no cambia
  ...
});
```

### Manejo eficiente de imágenes

```tsx
// /mobile/src/components/ui/ProductImage.tsx
import { Image } from 'expo-image';  // Caché automático, blurhash placeholder

<Image
  source={{ uri: product.imageUrl }}
  placeholder={{ blurhash: product.blurhash }}
  contentFit="cover"
  transition={200}
  cachePolicy="memory-disk"
/>
```

### Virtualización de listas largas

```tsx
// /mobile/src/components/features/rewards/RewardsList.tsx
import { FlashList } from '@shopify/flash-list';  // Más eficiente que FlatList

<FlashList
  data={rewards}
  renderItem={({ item }) => <RewardCard reward={item} />}
  estimatedItemSize={120}
  keyExtractor={(item) => item.id}
/>
```

### Reducción de bundle size

- Tree shaking habilitado por defecto en Expo + Metro bundler.
- Solo importar íconos específicos de `@expo/vector-icons`, no el paquete completo.
- Las dependencias compartidas (Zod, TanStack Query) se deduplicaron via workspace de monorepo.
- Análisis periódico con `npx expo-bundle-analyzer` antes de releases.

---

*Los ejemplos de código en esta sección hacen referencia a rutas dentro de la estructura `/mobile/src/` y `/dashboard/src/` del monorepo SmartCart.*
