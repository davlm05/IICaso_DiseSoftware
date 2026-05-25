
# Documento de Contexto y Funcionamiento: SmartCart

## 1. Propósito General de la Aplicación

**SmartCart** es una aplicación móvil diseñada para transformar la experiencia de compra en supermercados mediante un programa de lealtad basado en puntos. Su objetivo principal es ofrecer un sistema simple y transparente que recompense a los clientes por adquirir productos patrocinados dentro de las cadenas afiliadas, generando valor tanto para el consumidor como para las marcas y supermercados.
 
La aplicación permite a los usuarios descubrir productos en promoción que otorgan puntos de recompensa, escanearlos directamente con la cámara del dispositivo mientras realizan sus compras, y validar dichas compras al salir del supermercado mediante un código QR que la cajera verifica contra el sistema POS. Solo los productos efectivamente comprados acreditan puntos a la cuenta del usuario, garantizando la integridad del sistema y evitando el fraude por escaneo sin compra.
 
Los puntos acumulados pueden canjearse posteriormente por cupones de descuento, cerrando el ciclo de valor del programa de lealtad y motivando al usuario a regresar.
 
El flujo principal se centra en el ciclo: **Descubrir → Escanear → Validar → Acumular → Canjear**.

# 2. Flujo de la Aplicación y Descripción de Pantallas

A continuación, se detalla el flujo de navegación principal de la aplicación, describiendo el propósito y las funcionalidades de cada pantalla. Este flujo refleja el enfoque centrado en el sistema de puntos como núcleo del producto, donde el usuario escanea productos patrocinados, los acumula durante su recorrido por el supermercado, y valida la compra al salir mediante un código QR.

---

## Pantalla 1: Main / Lobby (estado vacío) — `pantalla-1-main-vacio.html`

Es la pantalla principal y el punto de partida del usuario al ingresar al supermercado.

**Propósito:** Ofrecer un resumen del estado del usuario, las promociones activas y el acceso directo a la acción central de escanear productos.

**Componentes Clave:**

- **Indicador de Ubicación:** Confirma automáticamente la sucursal donde se encuentra el usuario (detectado vía GPS o balizas internas del super). Es crucial porque solo dentro del establecimiento se habilita la acumulación de puntos.
- **Tarjeta de Puntos:** Resumen visual del programa de lealtad con los puntos actuales acumulados, una barra de progreso hacia la siguiente recompensa, y un subtítulo motivacional ("Te faltan X puntos para tu descuento").
- **Botón de Escaneo ("Escanear producto"):** Llamada a la acción principal, prominente y destacada. Es la única vía para iniciar el flujo de acumulación de puntos.
- **Empty State ("Aún no has escaneado nada"):** Tarjeta con borde punteado que comunica claramente al usuario que aún no ha escaneado productos. Incluye un mensaje explicativo invitando a escanear productos patrocinados.
- **Carrusel "Productos con puntos hoy":** Lista horizontal de productos patrocinados activos del día. Cada tarjeta muestra nombre, marca, precio y los puntos que otorga. Funciona como motivador visual para que el usuario busque y escanee esos productos específicos.
- **Barra de Navegación Inferior:** Accesos directos a Inicio, Escanear, Recompensas y Perfil.

---

## Pantalla 2: Cámara Escaneando — `pantalla-2-escanear.html`

Se accede al presionar el botón "Escanear producto" en el main.

**Propósito:** Permitir al usuario escanear el código de barras de un producto patrocinado.

**Componentes Clave:**

- **Vista de Cámara:** Feed en vivo de la cámara del dispositivo ocupando la mayor parte de la pantalla.
- **Marco de Escaneo:** Recuadro con esquinas verdes que guía visualmente al usuario para alinear el código de barras correctamente.
- **Línea de Escaneo Animada:** Línea horizontal que indica que la cámara está activa y procesando.
- **Instrucción Superior:** Mensaje breve y claro: "Apunta al código de barras".
- **Confirmación de Ubicación:** Píldora verde inferior que reafirma que el usuario está dentro del supermercado y que el escaneo es válido.
- **Acceso a Ingreso Manual:** Botón secundario para casos donde la cámara no funcione o el código de barras esté dañado.
- **Botones Superiores:** Cerrar (vuelve al main) y Flash (control de luz).

---

## Pantalla 3: Main con productos escaneados (estado con 1 producto) — `pantalla-3-main-1producto.html`

Después de un escaneo exitoso, el usuario regresa al main donde se refleja inmediatamente el producto agregado.

**Propósito:** Confirmar visualmente que el escaneo fue exitoso y mostrar el estado actualizado de la sesión de compra, sin sacar al usuario del flujo principal.

**Componentes Clave:**

- **Toast de Confirmación:** Banner verde superior que aparece tras escanear, mostrando el nombre del producto agregado y los puntos pendientes ganados (ej. "Café Britt 500g agregado · +15 pts pendientes").
- **Tarjeta de Puntos Actualizada:** La cajita lateral ahora muestra los "+15 Pendientes" en una sección destacada dentro de la tarjeta principal de puntos.
- **Botón "Escanear otro producto":** Reemplaza al botón inicial de "Escanear producto" para indicar continuidad de la sesión.
- **Sección "Productos escaneados":** Nueva sección que aparece dinámicamente con un contador (ej. "1 producto"). Lista los productos escaneados durante la sesión.
- **Tarjeta del Producto Escaneado:** Muestra ícono, nombre, marca, precio y tag amarillo con los puntos pendientes. El producto más reciente se destaca con fondo verde claro y etiqueta "Nuevo".
- **Botón Eliminar (X rojo):** Cada producto tiene un botón para removerlo de la lista en caso de error o cambio de opinión, antes de validar la compra.

---

## Pantalla 4: Main con múltiples productos (listo para validar) — `pantalla-4-main-3productos.html`

Estado del main cuando el usuario ha escaneado varios productos y está listo para finalizar.

**Propósito:** Permitir al usuario revisar todos los productos escaneados, decidir si seguir agregando o proceder con la validación en caja.

**Componentes Clave:**

- **Toast del Último Producto:** Confirma el escaneo más reciente.
- **Tarjeta de Puntos con Acumulado:** Muestra la suma total de puntos pendientes acumulados durante la sesión (ej. "+33 Pendientes").
- **Botones Duales:** La acción principal cambia cuando hay productos en la lista:
  - **"Escanear otro"** (botón secundario, borde verde): para seguir agregando productos.
  - **"Generar QR de salida"** (botón principal, fondo verde sólido): acción para finalizar y dirigirse a caja. Visualmente más prominente para guiar al usuario.
- **Lista Completa de Productos Escaneados:** Muestra todos los productos acumulados durante la sesión, cada uno con su precio, puntos pendientes y opción de eliminar individualmente.
- **Indicador "Nuevo":** El producto más recientemente agregado mantiene la etiqueta y fondo destacado para que el usuario lo identifique fácilmente.

---

## Pantalla 5: QR de Validación — `pantalla-5-qr-validacion.html`

Paso final dentro de la app antes de salir del supermercado.

**Propósito:** Generar un código QR único que el cajero escaneará para validar que los productos pendientes efectivamente se compraron.

**Componentes Clave:**

- **Fondo Verde Pleno:** Toda la pantalla cambia a verde corporativo para destacar visualmente la importancia del momento y facilitar que la cajera identifique la pantalla.
- **Instrucción Principal:** Texto claro: "Muéstrale este código a la cajera".
- **Código QR Grande y Centrado:** Ocupa la zona central de la pantalla, con código alfanumérico debajo (ej. "SC-2026-AX9K-7283") como respaldo visual.
- **Validez Temporal:** Indica que el código es válido por 10 minutos para evitar uso fraudulento posterior.
- **Resumen de Transacción:** Tarjeta inferior dentro del QR mostrando la cantidad de productos pendientes y el total de puntos a validar.
- **Indicador de Espera:** Mensaje "Esperando validación de la cajera..." mientras la app se comunica con el sistema POS del supermercado.

---

## Pantalla 6: Confirmación Final — `pantalla-6-confirmacion.html`

Aparece automáticamente cuando el sistema del supermercado confirma la compra de los productos escaneados.

**Propósito:** Notificar al usuario que su compra fue validada y los puntos fueron acreditados oficialmente a su cuenta.

**Componentes Clave:**

- **Hero Verde con Check Grande:** Confirmación visual inmediata y celebratoria del éxito de la transacción.
- **Mensaje Principal:** "Puntos acreditados" con subtítulo "Tu compra fue verificada en caja".
- **Tarjeta de Puntos Ganados:** Muestra los puntos exactos ganados en esta transacción (ej. "+33"), el nuevo total acumulado (ej. "153 pts"), una barra de progreso actualizada hacia la próxima recompensa, y los puntos restantes para alcanzarla.
- **Lista de Productos Validados:** Cada producto comprado y validado aparece con un check verde, su ícono, nombre y los puntos otorgados. Esta lista confirma transparentemente qué productos del escaneo se contabilizaron.
- **Total Comprado:** Monto total gastado únicamente en los productos patrocinados validados.
- **Botones de Acción:**
  - **"Volver al inicio":** Regresa al main vacío para iniciar una nueva sesión.
  - **"Ver mis recompensas":** Lleva al usuario al catálogo de recompensas para canjear los puntos acumulados.

---

## Pantalla 7: Mis Recompensas — `pantalla-7-recompensas.html`

Catálogo donde el usuario puede convertir sus puntos en beneficios reales.

**Propósito:** Permitir a los usuarios canjear sus puntos por cupones de descuento y gestionar los cupones ya obtenidos. Esta pantalla es clave para cerrar el ciclo de valor del programa de puntos.

**Componentes Clave:**

- **Balance de Puntos Destacado:** Tarjeta verde superior con los puntos disponibles para canjear y un mensaje claro de su disponibilidad.
- **Pestañas:** 
  - **"Disponibles":** Catálogo de recompensas que pueden canjearse.
  - **"Mis cupones":** Recompensas ya canjeadas y listas para usar en próximas compras.
- **Recompensa Destacada:** Tarjeta principal con gradiente verde que muestra la recompensa más relevante para el usuario (ej. "-15% en tu compra · 100 pts").
- **Catálogo de Recompensas:** Lista de cupones disponibles, cada uno con:
  - Ícono temático del beneficio.
  - Nombre y descripción del cupón (ej. "2x1 en café Britt", "-10% en lácteos").
  - Costo en puntos.
  - Fecha de vencimiento del cupón.
  - Botón "Canjear" si el usuario tiene puntos suficientes.
- **Recompensas Bloqueadas:** Premios que requieren más puntos de los que el usuario tiene, mostrando exactamente cuántos puntos le faltan (ej. "Faltan 147"). Esto motiva al usuario a seguir escaneando productos para alcanzar metas más altas.

---

## Resumen del Flujo Principal

El recorrido del usuario sigue un patrón cíclico simple y centrado en la acumulación de puntos:

1. **Inicio:** El usuario entra al super → ve el main vacío con sus puntos actuales y los productos patrocinados del día.
2. **Escaneo:** Toca "Escanear producto" → abre la cámara → escanea un código de barras válido.
3. **Vuelta al main:** Regresa automáticamente al main con el producto reflejado en la lista, un toast de confirmación y los puntos pendientes actualizados.
4. **Repetición:** Puede repetir el escaneo cuantas veces quiera. Cada escaneo actualiza la lista y los pendientes.
5. **Validación:** Cuando termina su recorrido, toca "Generar QR de salida" → muestra el QR a la cajera.
6. **Confirmación:** El sistema valida la compra → muestra la pantalla de éxito con los puntos acreditados.
7. **Canje (opcional):** El usuario puede ir a Mis Recompensas para canjear sus puntos por cupones de descuento.
