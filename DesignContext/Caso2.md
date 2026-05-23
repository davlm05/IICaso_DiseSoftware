## 1. Fase 1: Prototipado y Refinamiento UX (5%)

### 2.1. Creación y Prueba del Prototipo
*   **Prototipo Funcional:** Crear un prototipo interactivo de la ventana o flujo principal de la aplicación, enfocado en resolver el problema definido en el *Problem Statement*.
*   **Herramientas:** Utilizar una herramienta de prototipado como Figma, Maze, Adobe XD, o similar.
*   **Pruebas de Usabilidad (UX Testing):**
    *   Realizar sesiones de prueba con al menos 4 usuarios (estudiantes de diseño externos al equipo).
    *   Definir tareas concretas para los participantes (ej: "completa el registro", "encuentra la función de búsqueda").

### 2.2. Documentación de Hallazgos
*   **Evidencia:** Documentar los resultados del UX Testing, incluyendo:
    *   Capturas de pantalla o grabaciones.
    *   Métricas básicas (ej. tiempo en tarea, tasa de éxito).
    *   Problemas de usabilidad, navegación o accesibilidad detectados.
    *   Comentarios y observaciones relevantes de los participantes.
*   **Análisis y Corrección:**
    *   Presentar las correcciones aplicadas al prototipo basadas en los hallazgos.
    *   Justificar cada corrección, explicando qué problema resuelve y por qué se tomó esa decisión de diseño.

---

## 2. Fase 2: Diseño del Frontend (10%)

### 3.1. Objetivo
Elaborar un documento de diseño técnico detallado que sirva como guía para el equipo de desarrollo. Este documento debe residir en el `README.md` del repositorio o estar claramente enlazado desde él.

### 3.2. Requisitos del Diseño Frontend

#### 3.2.1. Arquitectura y Stack
*   **Stack Tecnológico:** Definir y justificar la elección de frameworks, librerías y versiones.
*   **Hosting y Cloud:** Especificar el servicio de hosting y los servicios cloud a utilizar (ej. Vercel, AWS Amplify).
*   **Estructura del Proyecto:** Explicar la organización de carpetas y la estructura general del código.
*   **Convenciones:** Definir convenciones de nomenclatura para archivos, componentes, estilos, etc.
*   **Diagramas:** Incluir diagramas de arquitectura (C4, por capas, etc.) para visualizar el diseño.

#### 3.2.2. UI y Experiencia de Usuario (UX)
*   **Lineamientos de Estilo (Branding):**
    *   Documentar paleta de colores, tipografías, logos e iconografía.
    *   Definir guías de espaciado, estilos reutilizables y principios de *responsive design*.
*   **Diseño de Componentes:** Documentar cómo se construirán los componentes, su estructura y su reutilización.
*   **Resultados de Prototipado:** Integrar las conclusiones y decisiones del UX Testing en el diseño final.

#### 3.2.3. Seguridad
*   **Autenticación y Autorización:**
    *   Definir el flujo de autenticación (ej. JWT, OAuth).
    *   Especificar cómo se gestionará la autorización y los permisos.
*   **Manejo de Datos y Sesiones:**
    *   Estrategia para el manejo seguro de sesiones, expiración de tokens, y privacidad de datos.
    *   Uso de `sessionStorage` vs. `localStorage`.
*   **Estándares de Seguridad:** Documentar prácticas de seguridad basadas en OWASP (ej. protección contra XSS).

#### 3.2.4. Patrones y Lógica de Aplicación
*   **Patrones Arquitectónicos:** Explicar los patrones utilizados (ej. MVC, MVVM, por capas).
*   **Patrones de Diseño:** Documentar patrones de componentes o de lógica de negocio (ej. Observer, Factory).
*   **Manejo de Estado:** Definir la estrategia para la gestión del estado (ej. Redux, Zustand, Context API).
*   **Comunicación Asíncrona:**
    *   Manejo de llamadas a APIs y contratos de datos.
    *   Uso de Web Sockets, manejo de procesos largos y eventos.
*   **Manejo de Errores y Observabilidad:**
    *   Estrategia para el monitoreo, manejo de errores y retries.
    *   Implementación de observabilidad en el frontend.

#### 3.2.5. Rendimiento (Performance)
*   **Estrategias de Optimización:**
    *   Implementación de *lazy loading*, *code splitting*, y reducción de *bundles*.
    *   Manejo eficiente de imágenes y otros recursos.
    *   Uso de *memoization* o *virtualización* donde sea aplicable.

#### 3.2.6. Calidad y DevOps
*   **Estrategia de Pruebas (Testing):**
    *   Definir el enfoque para *unit testing*, *integration testing*, y *UI testing*.
    *   Establecer la cobertura mínima de código esperada.
*   **CI/CD (Integración y Despliegue Continuo):**
    *   Definir el pipeline de CI/CD (ej. GitHub Actions).
    *   Incluir scripts de despliegue, análisis estático y validaciones automáticas.

---

## 3. Fase 3: Diseño del Backend y Datos (20%)

### 4.1. Objetivo
Crear un diseño técnico exhaustivo para el backend y la capa de persistencia, enfocado en la escalabilidad, mantenibilidad y seguridad.

### 4.2. Requisitos del Diseño Backend

#### 4.2.1. Arquitectura y Stack
*   **Stack Tecnológico:** Definir y justificar la elección de lenguajes, frameworks y versiones.
*   **Hosting y Cloud:** Especificar dónde se alojará el backend y qué servicios cloud se usarán (ej. AWS EC2, GCP Cloud Run, Azure App Service).
*   **Patrones Arquitectónicos:** Documentar la arquitectura (ej. Monolito, Microservicios, Serverless), justificando la decisión.
*   **Diseño por Capas:** Definir las responsabilidades de cada capa (ej. Presentación, Aplicación, Dominio, Infraestructura).
*   **Diagramas:** Incluir diagramas C4 o de arquitectura para ilustrar el sistema.

#### 4.2.2. Lógica de Negocio y Diseño
*   **Patrones de Diseño:** Documentar la implementación de patrones de diseño OO con ejemplos de código.
*   **Lógica Compleja:** Detallar algoritmos, reglas de negocio o procesos que no sean operaciones CRUD simples.
*   **Organización del Código:** Explicar cómo la estructura del repositorio facilita el mantenimiento y la escalabilidad.

#### 4.2.3. APIs y Comunicación
*   **Diseño de API:** Especificar el estilo de la API (REST, GraphQL, gRPC) y documentar el contrato (ej. con OpenAPI/Swagger).
*   **Comunicación Asíncrona:** Detallar el uso de colas (`queues`), caches, y la gestión de procesos largos.
*   **Manejo de Datos:** Definir el uso de DTOs y la validación de datos de entrada/salida.

#### 4.2.4. Base de Datos y Persistencia
*   **Diseño de Base de Datos:**
    *   Utilizar DBML (Database Markup Language) o un equivalente para diseñar el esquema.
    *   Incluir diagramas Entidad-Relación específicos del motor de BD seleccionado.
    *   Para NoSQL, diseñar la estructura de documentos/colecciones con ejemplos JSON.
*   **Gestión de la Base de Datos:**
    *   Incluir scripts de creación, *seeding* y migraciones.
    *   Definir la estrategia de versionamiento y *rollback* del esquema.
*   **Seguridad de Datos:**
    *   Estrategia para cifrado en reposo y en tránsito.
    *   Planes de auditoría, trazabilidad, backups y recuperación ante desastres.

#### 4.2.5. Calidad, Seguridad y DevOps
*   **Estrategia de Pruebas (Testing):**
    *   Definir el enfoque para *unit testing*, *integration testing*, *API testing*, y *contract testing*.
    *   Implementar *health checks* para monitoreo.
*   **Seguridad:**
    *   Estrategia de autenticación y autorización.
    *   Gestión de secretos y variables de entorno.
    *   Implementación de *middlewares* de seguridad.
*   **CI/CD:**
    *   Definir pipelines para build, test y deploy.
    *   Implementar análisis estático y *quality gates*.
*   **Observabilidad:**
    *   Estrategia para logging, monitoreo y tracing.

---