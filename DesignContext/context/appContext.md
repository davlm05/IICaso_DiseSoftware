
# Documento de Contexto y Funcionamiento: SmartCart

## 1. Propósito General de la Aplicación

**SmartCart** es una aplicación móvil diseñada para transformar la experiencia de compra en supermercados. Su objetivo principal es actuar como un asistente de compras inteligente que integra un programa de lealtad basado en puntos con funcionalidades de navegación y optimización de rutas dentro de la tienda.

La aplicación permite a los usuarios descubrir productos en promoción que otorgan puntos de recompensa, escanearlos para llevar un registro, y validar su compra en la caja para acreditar dichos puntos. Adicionalmente, una característica clave es el **asistente de voz**, que guía al usuario a través del supermercado, optimizando su ruta de compra basada en su lista de pendientes y la ubicación de los productos en la tienda.

El flujo principal se centra en el ciclo: **Descubrir -> Escanear -> Validar -> Acumular -> Canjear**.

## 2. Flujo de la Aplicación y Descripción de Pantallas

A continuación, se detalla el flujo de navegación principal de la aplicación, describiendo el propósito y las funcionalidades de cada pantalla.

### Pantalla 1: Lobby / Inicio (figmaScreen/pantalla-1-lobby.html)

Es la pantalla principal y el punto de partida para el usuario.

- **Propósito:** Ofrecer un resumen del estado del usuario, las promociones activas y el acceso a las funciones principales.
- **Componentes Clave:**
    - **Indicador de Ubicación:** Muestra en qué sucursal del supermercado se encuentra el usuario. Esto es crucial para que la app ofrezca promociones y rutas relevantes. El sistema debería detectar esto automáticamente (vía GPS o balizas de la tienda).
    - **Tarjeta de Puntos:** Un resumen visual del programa de lealtad.
        - **Puntos Actuales:** El total de puntos que el usuario puede canjear.
        - **Puntos Pendientes:** Puntos de productos que han sido escaneados pero aún no validados en caja.
        - **Barra de Progreso:** Indica cuántos puntos faltan para alcanzar la siguiente recompensa o nivel.
    - **Botón de Escaneo (`Escanear producto`):** El llamado a la acción principal que inicia el proceso de escaneo de productos.
    - **Carrusel de "Productos con puntos hoy":** Una lista horizontal de productos patrocinados que otorgan puntos extra si se compran ese día. Cada tarjeta de producto muestra su nombre, marca, precio y los puntos que otorga.
    - **Lista de Recordatorio ("Mi lista"):** Un widget que muestra una lista de compras simple que el usuario ha creado. Esta lista es fundamental para el asistente de voz.
    - **Barra de Navegación Inferior:** Contiene accesos directos a las secciones principales: Inicio, Escanear, Mi Lista/Pendientes, y Perfil.

### Pantalla 2: Cámara Escaneando (figmaScreen/pantalla-2-camara-escaneando.html)

Se accede a esta pantalla al presionar el botón "Escanear producto".

- **Propósito:** Permitir al usuario escanear el código de barras de un producto.
- **Componentes Clave:**
    - **Vista de Cámara:** Muestra el feed de la cámara del dispositivo.
    - **Marco de Escaneo:** Un recuadro visual que ayuda al usuario a alinear el código de barras.
    - **Instrucción:** Un texto simple como "Apunta al código de barras".
    - **Acceso a Ingreso Manual:** Un botón para ir a la `Pantalla 2B` si la cámara no funciona o el código está dañado.
    - **Guía de Pasos:** Un recordatorio del proceso: 1. Escanea, 2. Compra y valida al salir.

### Pantalla 2B: Ingreso Manual de Código (figmaScreen/pantalla-2B-ingreso-manual.html)

Una ruta alternativa a la cámara.

- **Propósito:** Permitir la entrada manual del código de barras (EAN-13).
- **Componentes Clave:**
    - **Campo de Entrada:** Un campo de texto para el código numérico.
    - **Teclado Numérico en Pantalla:** Facilita la entrada de los dígitos.
    - **Botón de Verificación:** Envía el código ingresado para su validación.

### Pantalla 2C: Confirmar Producto (figmaScreen/pantalla-2C-confirmar-producto.html)

Esta pantalla aparece después de un escaneo exitoso o ingreso manual.

- **Propósito:** Asegurarse de que el producto detectado por el sistema es el correcto. Es un paso de verificación crucial.
- **Componentes Clave:**
    - **Pregunta de Confirmación:** "¿Es este el producto?".
    - **Tarjeta de Producto Detallada:** Muestra la imagen (o icono), nombre, marca, presentación, precio y los puntos que otorga. También incluye el código de barras numérico para una doble verificación.
    - **Botones de Acción:**
        - **"Si, es este producto":** Confirma y lleva al usuario a la `Pantalla 3`.
        - **"No, escanear de nuevo":** Descarta el resultado y vuelve a la `Pantalla 2`.

### Pantalla 3: Producto Escaneado (figmaScreen/pantalla-3-producto-escaneado.html)

Confirma que el producto ha sido añadido a la lista de pendientes.

- **Propósito:** Informar al usuario que el producto patrocinado fue verificado y ahora está pendiente de compra.
- **Componentes Clave:**
    - **Mensaje de Éxito:** "Código de barras leído".
    - **Tarjeta de Producto:** Un resumen del producto recién escaneado.
    - **Advertencia de Puntos Pendientes:** Un mensaje claro que indica que los puntos solo se acreditarán después de comprar y validar.
    - **Pasos a Seguir:** Una guía visual que muestra el progreso:
        1.  `[Hecho]` Producto escaneado.
        2.  `[Actual]` Compra el producto.
        3.  `[Pendiente]` Valida al salir.
    - **Botones de Acción:**
        - **"Escanear otro producto":** Vuelve a la `Pantalla 2`.
        - **"Ver mis pendientes":** Lleva al usuario a la `Pantalla 4`.

### Pantalla 4: Mis Pendientes (figmaScreen/pantalla-4-pendientes.html)

Agrupa todos los productos escaneados en la sesión de compra actual.

- **Propósito:** Permitir al usuario revisar los productos que ha escaneado y generar el QR para la validación final.
- **Componentes Clave:**
    - **Resumen de Pendientes:** Tarjeta que totaliza los puntos pendientes y la cantidad de productos.
    - **Instrucción para la Caja:** Explica que debe mostrar el QR al cajero.
    - **Lista de Productos Escaneados:** Cada ítem en la lista muestra el nombre del producto, su precio y los puntos que otorga, con un estado "Pendiente de comprar".
    - **Botón "Generar QR para la caja":** La acción principal que lleva a la `Pantalla 5`.

### Pantalla 5: QR para Validación (figmaScreen/pantalla-5-qr-validacion.html)

El paso final de la compra dentro de la app.

- **Propósito:** Generar un código único que el cajero escaneará para validar la compra.
- **Componentes Clave:**
    - **Código QR:** Un código QR grande y visible que contiene la información de los productos pendientes del usuario.
    - **Instrucciones para el Cajero:** "Muéstrale este código a la cajera".
    - **Resumen de la Transacción:** Muestra la cantidad de productos y el total de puntos a validar.
    - **Indicador de Espera:** Un mensaje como "Esperando validación de la cajera..." que se muestra mientras el sistema de la app se comunica con el sistema del supermercado (POS).

### Pantalla 6: Confirmación Final (figmaScreen/pantalla-6-confirmacion.html)

Aparece después de que el cajero escanea el QR y el sistema del supermercado confirma la compra.

- **Propósito:** Notificar al usuario que la compra ha sido validada y los puntos han sido acreditados.
- **Componentes Clave:**
    - **Mensaje de Éxito:** "¡Puntos acreditados!".
    - **Resumen de Puntos Ganados:** Muestra cuántos puntos se ganaron en esa transacción y el nuevo total de puntos del usuario.
    - **Lista de Productos Validados:** Una lista de los productos que el sistema confirmó como comprados y por los cuales se otorgaron puntos.
    - **Total Comprado:** El monto total gastado en los productos patrocinados validados.
    - **Botones de Acción:**
        - **"Volver al inicio":** Regresa a la `Pantalla 1`.
        - **"Ver mis recompensas":** Lleva a la `Pantalla 7`.

### Pantalla 7: Mis Recompensas (figmaScreen/pantalla-7-recompensas.html)

El catálogo donde los usuarios pueden usar sus puntos.

- **Propósito:** Permitir a los usuarios canjear sus puntos por premios y gestionar sus cupones.
- **Componentes Clave:**
    - **Balance de Puntos:** Muestra el total de puntos disponibles para canjear.
    - **Pestañas:** "Disponibles" (para canjear) y "Mis cupones" (recompensas ya canjeadas y listas para usar).
    - **Catálogo de Recompensas:** Una lista de premios disponibles (ej. descuentos, productos gratis, 2x1) con su "costo" en puntos.
    - **Recompensas Bloqueadas:** Premios que el usuario aún no puede permitirse, mostrando cuántos puntos le faltan.
    - **Botón "Canjear":** Inicia el proceso para obtener una recompensa, que probablemente la convierte en un cupón en la pestaña "Mis cupones".

## 3. Funcionalidad del Asistente de Voz

El asistente de voz es una capa de interacción que se superpone al flujo principal, diseñada para facilitar y optimizar la experiencia de compra "manos libres".

### Activación

- El asistente podría activarse mediante un **botón de micrófono** persistente en la interfaz (especialmente en el Lobby y la pantalla de Pendientes) o mediante un **comando de voz** como "Hola, SmartCart".

### Funcionamiento y Lógica

1.  **Acceso a la Lista de Compras:** El asistente utiliza la "Mi lista (recordatorio)" (`Pantalla 1`) como base para la ruta. Al activarse, podría preguntar: *"Veo que tienes 4 artículos en tu lista. ¿Quieres que cree la ruta de compra más eficiente para ti?"*.

2.  **Creación de la Ruta Óptima:**
    - El sistema necesita un **mapa digital de la tienda**, con la ubicación y categorización de los pasillos (ej. "Pasillo 3: Lácteos", "Pasillo 5: Cereales y Galletas").
    - Al confirmar el usuario, el asistente procesa la lista de compras y la compara con el mapa de la tienda.
    - Utilizando un algoritmo de optimización de rutas (similar al problema del viajante), calcula el recorrido más corto para recoger todos los artículos de la lista. También podría considerar la ubicación actual del usuario como punto de partida.

3.  **Guía por Voz Paso a Paso:**
    - Una vez calculada la ruta, el asistente comienza a dar instrucciones por voz. Por ejemplo:
        - *"Ok, empecemos. Primero, dirígete al Pasillo 3, a tu derecha, para encontrar la leche."*
        - Al llegar (detectado por balizas o GPS interior), podría decir: *"Ya estás en el pasillo de lácteos. La leche debería estar a mitad del pasillo."*

4.  **Integración con el Escaneo de Productos:**
    - Mientras el usuario recoge productos, el asistente puede integrarse con la funcionalidad de escaneo.
    - Si un artículo de la lista es también un producto patrocinado, el asistente podría decir: *"Recuerda escanear el café. Hoy te da 15 puntos extra."*
    - El usuario podría usar comandos de voz para escanear: *"SmartCart, escanea este producto."* La app activaría la cámara.

5.  **Interacción y Flexibilidad:**
    - El usuario puede interactuar con el asistente en cualquier momento:
        - *"SmartCart, ¿dónde encuentro las manzanas?"* -> El asistente consultaría el mapa y respondería: *"Las manzanas están en la sección de Frutas y Verduras, al fondo de la tienda."*
        - *"SmartCart, añade pan integral a mi lista."* -> El asistente actualizaría la lista y, si es necesario, recalcularía la ruta.
        - *"SmartCart, ya recogí la leche."* -> El asistente marcaría el artículo como completado y daría la siguiente instrucción: *"Perfecto. Ahora, vamos al Pasillo 5 para buscar el arroz."*

### Finalización de la Ruta

- Cuando todos los artículos de la lista han sido recogidos, el asistente podría concluir: *"¡Genial! Hemos completado tu lista de compras. Ahora puedes dirigirte a la zona de cajas. No olvides generar tu QR para validar los 33 puntos que has acumulado."*

En resumen, el asistente de voz actúa como un "Waze para supermercados", guiando al usuario de manera eficiente, recordándole las oportunidades de ganar puntos y manteniendo la experiencia de compra fluida y sin necesidad de mirar constantemente el teléfono.
