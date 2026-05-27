# SmartCart — Patrones de Diseño Aplicados

Patrones seleccionados del catálogo GoF que resuelven problemas reales en el contexto de SmartCart. Cada entrada especifica la funcionalidad, los actores involucrados y el rol que cumple el patrón.

---

## Observer — Actualización de estado tras escaneo

**Funcionalidad**: Al escanear un producto, múltiples componentes deben reflejar el cambio de forma inmediata y desacoplada.

**Actores**:
- `ScannerService` (Subject): detecta escaneo exitoso y notifica
- `PointsCardComponent` (Observer): actualiza puntos pendientes en la tarjeta
- `ProductListComponent` (Observer): agrega el producto a la lista escaneada
- `ToastComponent` (Observer): muestra confirmación verde al usuario
- `SessionStateManager` (Observer): actualiza estado interno de la sesión

**Por qué**: evita que el Scanner conozca a todos los componentes; cada Observer se suscribe y reacciona independientemente.

---

## State — Estados de la sesión de compra

**Funcionalidad**: La sesión de compra tiene estados discretos que determinan qué acciones y qué UI son válidas en cada momento.

**Actores**:
- `ShoppingSession` (Context): delega comportamiento al estado activo
- `EmptyState`: CTA "Escanear producto", sin lista de productos
- `ScanningState`: cámara activa, espera lectura de código de barras
- `WithProductsState`: lista de productos visible, dual CTA (escanear otro / generar QR)
- `ValidatingState`: QR visible, polling al POS, sin acciones del usuario
- `ConfirmedState`: pantalla de confirmación, puntos acreditados, nuevas CTAs

**Por qué**: elimina condicionales distribuidos sobre el estado de la sesión; cada estado define sus propias transiciones válidas.

---

## Command — Acciones reversibles sobre la sesión

**Funcionalidad**: Las acciones del usuario sobre la sesión de compra (agregar, eliminar producto) se encapsulan como objetos para permitir deshacer.

**Actores**:
- `User` (Invoker): dispara la acción desde la UI
- `SessionManager` (Receiver): ejecuta la operación sobre la sesión
- `AddProductCommand`: encapsula agregar un producto escaneado
- `RemoveProductCommand`: encapsula eliminar un producto (botón X rojo); soporta undo
- `GenerateQRCommand`: encapsula la transición a estado de validación
- `RedeemCouponCommand`: encapsula canje de puntos por cupón

**Por qué**: el botón eliminar necesita revertir la operación; Command permite undo sin lógica especial en la UI.

---

## Strategy — Método de ingreso del código de barras

**Funcionalidad**: La pantalla de escaneo soporta dos métodos de captura del código de barras con la misma interfaz de resultado.

**Actores**:
- `ScanController` (Context): usa la estrategia activa
- `IBarcodeInputStrategy` (Strategy interface)
- `CameraStrategy` (ConcreteStrategy): usa cámara del dispositivo + vision library
- `ManualEntryStrategy` (ConcreteStrategy): usuario ingresa el código manualmente

**Por qué**: desacopla la lógica de procesamiento del código de su método de captura; agregar biometría u otras formas no requiere modificar ScanController.

---

## Adapter — Integración con sistemas POS de distintas cadenas

**Funcionalidad**: Diferentes supermercados afiliados tienen APIs de POS distintas. SmartCart necesita una interfaz unificada para validar el QR en cualquier cadena.

**Actores**:
- `QRValidationService` (Client): solicita validación sin conocer el POS específico
- `IPOSAdapter` (Target interface): `validateQR(sessionId, products[]) → ValidationResult`
- `MasXMenosPOSAdapter` (Adapter): adapta la API propietaria de Más x Menos
- `WalmartPOSAdapter` (Adapter): adapta la API de Walmart CR
- `PeriPOSAdapter` (Adapter): adapta la API de Peri

**Por qué**: protege al backend de SmartCart de cambios en APIs externas; agregar una nueva cadena solo requiere un nuevo Adapter.

---

## Decorator — Estados visuales y funcionales del producto

**Funcionalidad**: Un producto en la sesión puede tener estados adicionales (patrocinado, nuevo, validado, bloqueado en rewards) que se componen dinámicamente.

**Actores**:
- `Product` (Component): entidad base con nombre, barcode, precio
- `SponsoredProductDecorator`: añade puntos ofrecidos y marca visual de patrocinador
- `NewlyScannedDecorator`: añade highlight verde + label "Nuevo" + tag amarillo de puntos pendientes
- `ValidatedProductDecorator`: añade check verde + puntos acreditados (pantalla de confirmación)
- `LockedRewardDecorator`: añade indicador "Faltan X pts" en catálogo de recompensas

**Por qué**: evita explosión de subclases para cada combinación de estado; los decoradores se apilan según el contexto de pantalla.

---

## Chain of Responsibility — Pipeline de validación de escaneo

**Funcionalidad**: Al escanear un barcode, una cadena de validaciones decide si el escaneo es aceptable antes de agregarlo a la sesión.

**Actores**:
- `ScannerService` (Client): inicia la cadena con el barcode leído
- `LocationHandler`: verifica que el usuario esté dentro de una tienda afiliada
- `BarcodeFormatHandler`: valida que el código de barras tenga formato correcto
- `SponsoredProductHandler`: consulta si el producto está en la lista de patrocinados activos
- `DuplicateScanHandler`: verifica que el producto no esté ya en la sesión
- `SessionAddHandler`: agrega el producto a la sesión y notifica Observers

**Por qué**: cada regla de validación es independiente y puede agregarse, removerse o reordenarse sin modificar las demás.

---

## Factory Method — Creación de tipos de recompensa

**Funcionalidad**: El catálogo de recompensas contiene cupones de distintos tipos; cada tipo tiene diferente lógica de visualización y validación.

**Actores**:
- `RewardFactory` (Creator): interface con método `createReward(data)`
- `DiscountCouponFactory`: crea cupones de porcentaje de descuento (e.g. "-15% en tu compra")
- `TwoForOneFactory`: crea cupones 2x1 para productos específicos
- `CategoryDiscountFactory`: crea cupones de descuento por categoría (e.g. "-10% en lácteos")
- `DiscountCoupon`, `TwoForOneCoupon`, `CategoryCoupon` (Products): las instancias concretas

**Por qué**: el catálogo puede crecer con nuevos tipos de recompensa sin modificar el código que renderiza o valida cupones.

---

## Proxy — Validación segura del QR ante el POS

**Funcionalidad**: El QR de validación no apunta directamente al POS del supermercado; pasa por un proxy en el backend de SmartCart que aplica seguridad y registra la transacción.

**Actores**:
- `Cashier POS Terminal` (Client): escanea el QR
- `QRValidationProxy` (Proxy): valida expiración (10 min), autenticidad del código, estado de sesión; registra evento para analytics
- `POSValidationService` (Real Subject): ejecuta la validación final contra el inventario comprado

**Por qué**: separa las responsabilidades de seguridad y logging del servicio de validación; el POS no necesita conocer la lógica de SmartCart.

---

## Singleton — Sesión de compra activa

**Funcionalidad**: En cada sesión de usuario solo puede existir una sesión de compra activa simultáneamente.

**Actores**:
- `ShoppingSession` (Singleton): instancia única por usuario autenticado; mantiene lista de productos escaneados, total de puntos pendientes, estado de la sesión

**Por qué**: previene inconsistencias si el usuario abre múltiples instancias o tabs; garantiza una única fuente de verdad para el estado de la sesión.
