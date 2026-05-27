# Diseño y Especificación de Integraciones (Ficha de Integración)

## Integraciones del Sistema SmartCart

SmartCart depende de las siguientes integraciones externas. Cada una debe ser documentada y diseñada usando la Ficha de Integración definida en este archivo.

| Integración | Rol en el sistema | Criticidad |
|---|---|---|
| **POS del Supermercado** | Valida que los productos escaneados fueron efectivamente comprados; confirma la acreditación de puntos | Alta — sin esta validación no se acreditan puntos |
| **Catálogo de Productos / Base de Barcode** | Resuelve el barcode escaneado: determina si el producto es patrocinado, qué puntos otorga, nombre y marca | Alta — bloquea el flujo de escaneo si no responde |
| **Servicios de Ubicación (GPS / BLE Beacons)** | Confirma que el usuario está dentro de una tienda afiliada; habilita o bloquea la acumulación de puntos | Media — falla degradada: pedir confirmación manual al usuario |
| **Plataforma B2B de Analytics** | Recibe datos agregados de compras para su venta a marcas y supermercados; es el modelo de ingreso principal | Media — asíncrona; no bloquea el flujo del usuario |
| **Motor de IA / LLM (Analytics)** | Procesa datos de compra agregados para generar insights: patrones de consumo, segmentación de clientes, predicción de demanda y reportes para marcas y supermercados; consume datos de la Plataforma B2B | Media — procesamiento batch; no bloquea flujo del usuario |
| **Servicio de Notificaciones Push** | Envía alertas sobre promociones activas, cupones próximos a vencer y confirmaciones de acreditación | Baja — complementario; falla silenciosa aceptable |

> **Regla**: Toda nueva integración que se incorpore al sistema debe documentarse con la Ficha de Integración antes de su implementación.

---

## [Contexto y Activación]
Cuando el usuario solicite diseñar, documentar, analizar o proponer una integración con un sistema de terceros, o cuando el flujo arquitectónico lo requiera, el agente DEBE generar una "Ficha de Integración".

## [Objetivo]
El propósito de esta ficha no es solo recolectar datos, sino correlacionar las limitaciones del sistema destino (Throughput, Workload e Infraestructura) para formular una estrategia de conexión segura, eficiente y no invasiva.

## [Estructura Obligatoria de la Ficha]
El agente debe estructurar su respuesta utilizando estrictamente los siguientes campos:
- Nombre del Sistema: Plataforma destino a la que se realizará la conexión.
- Proveedor: Entidad, fabricante o empresa responsable del sistema externo.
- Protocolo de Comunicación: Medio o estándar técnico de transferencia (ej. REST API, GraphQL, gRPC, TCP/IP, FTP, WebSockets, mcast, pipeline de SO, driver binario). 
- Restricciones de Seguridad: Mecanismos de autenticación y protección requeridos (ej. API Key, validación de sesión, MFA, usuario/contraseña, llaves de encriptación, firma digital, integración con MS Entra). 
- Gestión de Configuración y Secretos: Definición de dónde y cómo se almacenarán los parámetros de conexión y credenciales de forma segura (ej. Bóvedas de secretos, variables de entorno protegidas).
- Throughput (Rendimiento y Límites): Capacidad de respuesta del servicio destino. Debe especificar: cuotas de peticiones, tamaño de los paquetes de transferencia, límites de almacenamiento, duración de sesiones y tiempos de espera (timeouts).
- Capacidad de Infraestructura: Anchos de banda disponibles y capacidad de procesamiento esperada del sistema al que se conecta.
- Workload (Carga de Trabajo Operativa): Contexto del entorno destino. Debe detallar los picos de uso del sistema externo para evitar disrupciones. (Ejemplo: Servidor SQL en producción operando al 70-85% de capacidad entre 10:00 y 17:00, de lunes a viernes).

## Estrategia de Integración: El diseño táctico de la conexión.

### [Reglas de Razonamiento del Agente]
Al redactar el campo Estrategia de Integración, el agente debe aplicar la siguiente lógica deductiva:

- Protección del origen: La estrategia debe diseñarse para no impactar el sistema destino. Si el Workload indica alta demanda en cierto horario, la estrategia debe esquivarlo.
- Manejo de datos: Plantear soluciones técnicas específicas según el escenario (ej. extracción por lotes/batch en horas valle, uso de Job Schedulers, diseño de cargas incrementales o deltas para evitar transferencias redundantes, o colas de mensajería para desacoplar cargas).

