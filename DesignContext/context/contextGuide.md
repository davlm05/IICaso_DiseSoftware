# Guía de Contexto para Diseño de Sistemas de Software

Esta guía proporciona un marco de referencia para el diseño de software, destinada a ser utilizada por agentes de IA y desarrolladores. Cubre principios de diseño, un escenario práctico, y lineamientos para la arquitectura de frontend y backend.

---

## 1. Principios de Diseño de Software

### Patrones de Diseño Clásicos (GoF)
La siguiente lista de patrones de diseño orientado a objetos es fundamental para resolver problemas comunes de diseño:

*   **Creacionales:**
    *   `Factory Method`: Define una interfaz para crear un objeto, pero deja que las subclases decidan qué clase instanciar.
    *   `Builder`: Separa la construcción de un objeto complejo de su representación.
    *   `Singleton`: Asegura que una clase solo tenga una instancia y proporciona un punto de acceso global a ella.
*   **Estructurales:**
    *   `Adapter`: Convierte la interfaz de una clase en otra interfaz que los clientes esperan.
    *   `Bridge`: Desacopla una abstracción de su implementación para que ambas puedan evolucionar independientemente.
    *   `Decorator`: Añade responsabilidades adicionales a un objeto de forma dinámica.
    *   `Proxy`: Proporciona un sustituto o marcador de posición para otro objeto para controlar el acceso a él.
*   **De Comportamiento:**
    *   `Chain of Responsibility`: Evita acoplar el emisor de una petición a su receptor dando a más de un objeto la oportunidad de manejar la petición.
    *   `Command`: Encapsula una solicitud como un objeto.
    *   `Iterator`: Proporciona una forma de acceder a los elementos de un objeto agregado secuencialmente sin exponer su representación subyacente.
    *   `Mediator`: Define un objeto que encapsula cómo un conjunto de objetos interactúan.
    *   `Observer`: Define una dependencia uno-a-muchos entre objetos.
    *   `Visitor`: Representa una operación a ser realizada sobre los elementos de una estructura de objetos.

### Evaluación de Diseño y Patrones
Utilice estas preguntas y pruebas para evaluar la calidad y robustez de un diseño.

#### Principios Fundamentales (SOLID-inspired)
*   **Single Responsibility Principle:** ¿Alguna clase tiene más de una razón para cambiar?
*   **Separation of Concerns:** ¿El patrón introduce lógica que mezcla responsabilidades (concerns)?
*   **Open/Closed Principle:** ¿Puedo extender el comportamiento sin modificar las clases existentes?
*   **Liskov Substitution Principle:** ¿Pueden las subclases reemplazar completamente a las clases base sin romper el comportamiento?
*   **Interface Segregation Principle:** ¿Son las interfaces demasiado amplias? ¿Se obliga a los clientes a depender de métodos que no utilizan?
*   **Dependency Inversion Principle:** ¿Los módulos de alto nivel dependen de abstracciones? ¿El patrón introdujo nuevas dependencias concretas?
*   **Conditionals:** ¿El patrón reduce la necesidad de usar sentencias condicionales?

#### Pruebas de Calidad Arquitectónica
*   **Test de Desacoplamiento:**
    *   **Objetivo:** Medir la resiliencia al cambio.
    *   **Simulación:** Si una clase A importante cambia internamente (especialmente un método público), ¿qué otras clases se ven afectadas?
    *   **Métricas de éxito:** Reducción de referencias directas, menos `import`s, menor conocimiento de implementaciones concretas, y dependencia de abstracciones.

*   **Test de Escalabilidad:**
    *   **Objetivo:** Evaluar cómo el sistema crece.
    *   **Simulación:** Si aparecen N nuevos elementos (ej. 5, 10, 100 nuevos tipos de archivos, reportes, etc.), ¿cómo cambian las clases y qué se debe agregar?
    *   **Métricas de éxito:** El crecimiento de clases se mantiene lineal y aislado.

*   **Test de Reusabilidad:**
    *   **Objetivo:** Identificar componentes verdaderamente modulares.
    *   **Preguntas Clave:**
        *   ¿Cuáles de las clases se pueden usar en otro sistema con modificaciones mínimas?
        *   ¿Qué partes del diseño son independientes de frameworks o librerías?

*   **Test de Detección de Anti-Patrones:**
    *   **Objetivo:** Asegurar simplicidad y evitar sobre-ingeniería.
    *   **Pregunta Clave:** ¿Sería posible resolver lo que hace este patrón de una forma más simple y directa?

*   **Test de Mutación (o de Relevancia):**
    *   **Objetivo:** Validar que una abstracción aporta valor real.
    *   **Simulación:** Si se elimina o simplifica una abstracción clave del patrón, ¿qué parte del diseño se degrada funcional o estructuralmente?
    *   **Conclusión:** Si nada importante se degrada, el patrón podría ser un adorno innecesario.

---

## 2. Escenario Práctico: Generador de Reportes

### 2.1. Descripción del Problema

Se requiere una aplicación que procese múltiples archivos fuente en formatos **Word y Excel** con estructuras heterogéneas. El sistema también recibe una **plantilla Word** que define la estructura del documento final.

**Misión del sistema:**

1.  **Analizar** cada archivo fuente individualmente.
2.  **Extraer** información relevante de las secciones de interés.
3.  **Comprender semánticamente** el contenido tanto de los archivos fuente como de la plantilla.
4.  **Mapear** la información extraída a las secciones correspondientes en la plantilla.
5.  **Generar** un documento final estructurado y completo.

El reto principal es la falta de homogeneidad en los archivos fuente, lo que exige un mecanismo de **interpretación semántica** en lugar de reglas de extracción basadas en posiciones o formatos fijos.

### 2.2. Flujo de Trabajo Propuesto (Algoritmo Base sin IA semántica)

Este algoritmo se basa en conteo de palabras y sinónimos para el mapeo inicial.

```
// Preparación de la Plantilla
1. Cargar un diccionario de sinónimos de sustantivos en memoria.
2. Abrir la plantilla Word y para cada sección:
   a. Extraer los sustantivos clave.
   b. Expandir la lista de sustantivos con sus sinónimos del diccionario.
   c. Contar la frecuencia de cada término (palabra o sinónimo) por sección.
3. Almacenar en una estructura de datos: `[Sección_A: {palabra1: count, palabra2: count}, Sección_B: ...]`.

// Procesamiento de Archivos Fuente
4. Iterar sobre cada archivo fuente (Word, Excel):
   a. Si es Excel:
      i. Para cada hoja, extraer el texto del rango de celdas con datos.
      ii. Generar un título para este texto: "{nombre_archivo} - {nombre_hoja}".
   b. Si es Word:
      i. Extraer todo el texto del documento.
   c. Para el texto extraído (de Word o Excel):
      i. Extraer sus sustantivos y expandirlos con sinónimos.
      ii. Contar la frecuencia de cada término.

// Mapeo y Puntuación
5. Comparar los términos de cada sección de la plantilla con los términos de cada documento fuente procesado.
6. Por cada coincidencia de términos, acumular un "puntaje de relevancia" para ese documento en esa sección de la plantilla.
7. Al final, cada sección de la plantilla tendrá una lista de documentos fuente con su puntaje de relevancia.

// Generación del Reporte
8. Para cada sección de la plantilla:
   a. Seleccionar los N documentos fuente con mayor puntaje (ej. top 3).
   b. **(Punto de integración con IA)** Usar una IA generativa para redactar el contenido de la sección, usando los textos de los documentos seleccionados como contexto.
9. Reemplazar el contenido de la sección en la plantilla con el texto generado por la IA.
10. Guardar el documento final.
```

---

## 3. Diseño de la Arquitectura

### 3.1. Diseño del Frontend

El frontend es la interfaz entre el humano y el sistema, ya sea una app web, móvil, de voz, etc.

#### 3.1.1. Technology Stack
*   **Descripción:** Definir el conjunto de tecnologías para el frontend.
*   **Elementos a considerar:** Frameworks (React, Vue, Angular), librerías de UI, herramientas de build, hosting (ej. Vercel, Netlify), y versiones específicas.
*   **Decisión clave:** La elección debe basarse en los requisitos del proyecto, la experiencia del equipo y el ecosistema tecnológico existente.

#### 3.1.2. Patrones de Autenticación y Autorización
*   **Autenticación (¿Quién eres?):**
    *   **Password:** Tradicional, requiere almacenamiento seguro de hash.
    *   **MFA:** Múltiples factores (sabe, tiene, es). Aumenta la seguridad.
    *   **Token (JWT):** Ideal para APIs stateless y arquitecturas distribuidas.
    *   **OAuth 2.0:** Delegación de autorización, estándar para "Login con...".
    *   **Certificados:** Alta seguridad, común en B2B y mTLS.
    *   **Biometría:** Factor de "algo que eres", dependiente de hardware.
*   **Autorización (¿Qué puedes hacer?):**
    *   **RBAC (Role-Based):** Permisos asignados a roles. Simple y común.
    *   **ABAC (Attribute-Based):** Decisiones basadas en atributos del usuario, recurso y contexto. Flexible y granular.
    *   **ACL (Access Control List):** Lista de permisos por recurso. Directo, pero difícil de gestionar a escala.
    *   **Policy-Based:** Reglas formales evaluadas por un motor centralizado. Desacoplado y escalable.

#### 3.1.3. Análisis UX/UI
*   **Objetivo:** Garantizar que la aplicación sea usable, intuitiva, eficiente y accesible.
*   **Atributos Clave:** Usabilidad, accesibilidad (WCAG), consistencia, eficiencia, feedback, tolerancia a errores, performance percibida.
*   **Proceso Típico:**
    1.  Entendimiento del negocio y usuario (personas, journeys).
    2.  Análisis de tareas y flujos críticos.
    3.  Benchmarking de soluciones similares.
    4.  Arquitectura de información y navegación.
    5.  **Wireframing** (baja fidelidad) para validar estructura.
    6.  **Prototipado** (alta fidelidad, interactivo) para simular la experiencia.
    7.  **Pruebas de usabilidad** con usuarios reales para recolectar métricas y feedback.
*   **Herramientas Comunes:** Figma, Adobe XD, Sketch, Miro, Maze.
*   **IA en UX:** La IA puede ayudar a generar wireframes, analizar comportamiento, personalizar interfaces y crear "AX experiences" (Agentive Experiences).

#### 3.1.4. Estrategia de Componentes
*   **Definición:** Principios para diseñar componentes reutilizables, centralizar estilos (Branding), gestionar internacionalización (i18n) y asegurar responsividad.
*   **Ejemplo:** Implementar un Design System con Storybook, usar Styled Components o CSS-in-JS para estilos encapsulados, y bibliotecas como `react-intl` para i18n.

#### 3.1.5. Diseño por Capas (Layered Design)
*   **Descripción:** Estructurar el código del frontend en capas lógicas.
*   **Capas Comunes:**
    *   **Capa de Presentación (UI):** Componentes visuales, layouts.
    *   **Capa de Estado (State Management):** Lógica de estado global y local (ej. Redux, Zustand, React Context).
    *   **Capa de Dominio/Aplicación:** Lógica de negocio del frontend, validaciones.
    *   **Capa de Acceso a Datos:** Lógica para interactuar con APIs (ej. `fetch`, Axios, React Query, SWR).

---

### 3.2. Diseño del Backend

El backend es responsable de la lógica de negocio, persistencia de datos y comunicación entre sistemas.

#### 3.2.1. Technology Stack

| Decisión Clave            | Opciones Comunes                                                                | Cuándo Considerar                                                                      |
| ------------------------- | ------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| **Protocolo de API**      | REST (con OpenAPI), GraphQL, gRPC                                               | REST para estándar, GraphQL para flexibilidad de cliente, gRPC para microservicios.    |
| **Comunicación en Tiempo Real** | WebSockets, Server-Sent Events (SSE)                                            | Chats, dashboards en vivo, notificaciones push desde el servidor.                    |
| **Procesamiento Asíncrono** | Colas de mensajería (RabbitMQ, Kafka, SQS, Pub/Sub)                               | Desacoplar servicios, absorber picos de carga, ejecutar tareas largas.               |
| **Hosting (Ejecución)**   | IaaS (VMs), PaaS (App Service, Cloud Run), Serverless (Lambda, Functions)         | Control total vs. simplicidad operativa vs. escalado a cero.                         |
| **Lenguaje/Framework**    | Node.js (Express, NestJS), Python (Django, FastAPI), Java (Spring), Go, .NET, Rust | Basado en ecosistema, rendimiento, y experiencia del equipo.                          |
| **Base de Datos**         | SQL (PostgreSQL, MySQL), NoSQL (MongoDB, DynamoDB), Cache (Redis)               | Modelo de datos relacional vs. flexible, necesidades de caché de acceso rápido.      |
| **Infra como Código (IaC)** | Terraform, Pulumi, CloudFormation (AWS), Bicep (Azure)                          | Para automatizar y versionar la infraestructura.                                     |

#### 3.2.2. Arquitectura de Servicios y Dominio (DDD)

| Concepto             | Idea Central                                                                                                  | Cuándo Aplicar                                                                        |
| -------------------- | ------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| **Monolito Modular** | Una sola unidad de despliegue con módulos internos bien definidos. Comunicación en memoria.                      | Equipos pequeños/medianos, producto en evolución, simplicidad transaccional.          |
| **Microservicios**   | Múltiples servicios desplegables independientemente. Comunicación por red (HTTP, eventos).                    | Equipos grandes y autónomos, necesidad de escalado independiente, alta complejidad.     |
| **Monorepo**         | Un solo repositorio de código para múltiples proyectos/librerías.                                              | Facilita refactorización transversal y consistencia. Requiere herramientas (Nx, Turbo). |
| **Multirepo**        | Un repositorio por servicio o equipo.                                                                         | Límites de propiedad claros. Más fricción para cambios transversales.                 |
| **DDD**              | Alinear el software con el lenguaje del negocio. Define **Bounded Contexts** y **Agregados**. Es un enfoque de diseño, no de despliegue. | En dominios de negocio complejos para gestionar la complejidad y la comunicación.     |

#### 3.2.3. Seguridad (Security)
*   **Autenticación y Autorización:** Usar estándares como OAuth2/OIDC. mTLS para comunicación entre servicios (Zero Trust).
*   **Gestión de Secretos:** Nunca en el código. Usar servicios como AWS Secrets Manager, Azure Key Vault, o GCP Secret Manager.
*   **Seguridad de API:** Implementar rate limiting, validación de entradas (OWASP Top 10), y protección a nivel de API Gateway.
*   **Seguridad de Red:** Usar VPCs, subredes privadas para bases de datos, y firewalls (Security Groups).

#### 3.2.4. Observabilidad (Observability)
*   **Logs:** Deben ser estructurados (JSON) y centralizados. Incluir un `trace-id` para correlación.
*   **Métricas:** Monitorear latencia (p95, p99), tasa de errores, y saturación de recursos. (Prometheus, Grafana, CloudWatch).
*   **Trazas (Tracing):** Indispensable en microservicios para seguir una petición a través de varios servicios (OpenTelemetry, Jaeger, X-Ray).

#### 3.2.5. Disponibilidad y Escalabilidad (Availability & Scalability)
*   **Disponibilidad:**
    *   Diseño Multi-AZ para alta disponibilidad.
    *   Replicación de bases de datos y failover automático.
    *   Patrones de resiliencia: `Circuit Breaker`, `Retry con Backoff`, `Bulkhead`.
*   **Escalabilidad:**
    *   Diseñar servicios **stateless** en la capa de aplicación.
    *   Usar colas y workers para desacoplar y procesar trabajo pesado.
    *   Implementar caching (CDN para estáticos, Redis/ElastiCache para datos).
    *   Configurar auto-scaling basado en métricas relevantes (CPU, RPS, longitud de cola).

---

## 4. Modelo de Documentación de Arquitectura C4

El modelo C4 es una forma de visualizar y documentar la arquitectura de software en diferentes niveles de abstracción. Es ideal para comunicar el diseño a distintas audiencias.

*   **Nivel 1: Diagrama de Contexto (Audiencia: No técnica, negocio)**
    *   **Qué es:** Muestra el sistema como una caja negra, sus usuarios (actores) y sus interacciones con otros sistemas externos.
    *   **Documentación en Markdown:** Describir en texto los actores y sistemas, y luego usar un diagrama Mermaid (`graph` o `C4Context`).

*   **Nivel 2: Diagrama de Contenedores (Audiencia: Técnica, arquitectos, ops)**
    *   **Qué es:** Descompone el sistema en sus "contenedores": aplicaciones ejecutables o almacenes de datos (ej. App Web, API, Base de Datos, Microservicio). Muestra las interacciones tecnológicas entre ellos.
    *   **Documentación en Markdown:** Listar cada contenedor con su tecnología. Describir las conexiones indicando protocolo y dirección del flujo de datos. Usar un diagrama Mermaid `C4Container`.

*   **Nivel 3: Diagrama de Componentes (Audiencia: Desarrolladores del sistema)**
    *   **Qué es:** Descompone un contenedor en sus principales "componentes" o módulos lógicos. Muestra las responsabilidades y las relaciones entre ellos.
    *   **Documentación en Markdown:** Listar los componentes agrupados por dominio o capa (ej. "Componente de Gestión de Candidatos", "Motor de Matching"). Describir sus interfaces y cómo colaboran. Usar un diagrama Mermaid `C4Component`.

*   **Nivel 4: Diagrama de Código (Clases) (Audiencia: Desarrolladores del componente)**
    *   **Qué es:** Muestra la estructura de clases o el detalle de implementación de un componente. Es opcional y se usa para ilustrar patrones de diseño complejos o la estructura de código clave.
    *   **Documentación en Markdown:** Usar un diagrama de clases UML (con Mermaid `classDiagram`) para mostrar las clases, interfaces, herencia y composición. Acompañar con una explicación del patrón de diseño que se está implementando.
