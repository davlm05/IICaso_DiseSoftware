# Guía de Arquitectura de Software

## 1. Diseño del Frontend

### 1.1. Technology Stack
- Definir frameworks (React, Vue, Angular), librerías de UI, herramientas de build, hosting (Vercel, Netlify) y versiones
- Decisión basada en: requisitos del proyecto, experiencia del equipo, ecosistema existente

### 1.2. Patrones de Autenticación y Autorización

**Autenticación (¿Quién eres?)**
- `Password`: tradicional; requiere hash seguro
- `MFA`: múltiples factores (sabe / tiene / es)
- `JWT`: ideal para APIs stateless y arquitecturas distribuidas
- `OAuth 2.0`: delegación de autorización; estándar para "Login con..."
- `Certificados`: alta seguridad; común en B2B y mTLS
- `Biometría`: factor "algo que eres"; dependiente de hardware

**Autorización (¿Qué puedes hacer?)**
- `RBAC`: permisos asignados a roles; simple y común
- `ABAC`: decisiones basadas en atributos de usuario, recurso y contexto; granular
- `ACL`: lista de permisos por recurso; difícil de gestionar a escala
- `Policy-Based`: reglas evaluadas por motor centralizado; desacoplado y escalable

### 1.3. Análisis UX/UI
**Atributos clave**: usabilidad, accesibilidad (WCAG), consistencia, eficiencia, feedback, tolerancia a errores, performance percibida

**Proceso típico**:
1. Entendimiento del negocio y usuario (personas, journeys)
2. Análisis de tareas y flujos críticos
3. Benchmarking de soluciones similares
4. Arquitectura de información y navegación
5. Wireframing (baja fidelidad): validar estructura
6. Prototipado (alta fidelidad, interactivo): simular experiencia
7. Pruebas de usabilidad con usuarios reales

**Herramientas**: Figma, Adobe XD, Sketch, Miro, Maze

### 1.4. Estrategia de Componentes
- Implementar Design System (Storybook)
- Estilos encapsulados: Styled Components / CSS-in-JS
- Internacionalización (i18n): `react-intl` u equivalente
- Responsividad desde el diseño base

### 1.5. Diseño por Capas (Frontend)
- **Presentación (UI)**: componentes visuales, layouts
- **Estado (State Management)**: lógica global y local (Redux, Zustand, React Context)
- **Dominio/Aplicación**: lógica de negocio del frontend, validaciones
- **Acceso a Datos**: interacción con APIs (fetch, Axios, React Query, SWR)

---

## 2. Diseño del Backend

### 2.1. Technology Stack

| Decisión | Opciones | Cuándo |
|---|---|---|
| Protocolo de API | REST (OpenAPI), GraphQL, gRPC | REST: estándar · GraphQL: flexibilidad de cliente · gRPC: microservicios |
| Tiempo Real | WebSockets, SSE | Chats, dashboards en vivo, notificaciones push |
| Procesamiento Asíncrono | RabbitMQ, Kafka, SQS, Pub/Sub | Desacoplar servicios, absorber picos, tareas largas — incluye el pipeline de inferencia IA para analytics B2B |
| Hosting | IaaS, PaaS (Cloud Run), Serverless (Lambda) | Control total vs. simplicidad vs. escalado a cero |
| Lenguaje/Framework | Node.js, Python, Java, Go, .NET, Rust | Ecosistema, rendimiento, experiencia del equipo |
| Base de Datos | SQL (PostgreSQL), NoSQL (MongoDB), Cache (Redis) | Modelo relacional vs. flexible vs. caché de acceso rápido |
| IaC | Terraform, Pulumi, CloudFormation, Bicep | Automatizar y versionar infraestructura |

### 2.2. Arquitectura de Servicios y DDD

| Concepto | Cuándo |
|---|---|
| Monolito Modular | Equipos pequeños/medianos, producto en evolución |
| Microservicios | Equipos grandes, escalado independiente, alta complejidad |
| Monorepo | Refactorización transversal frecuente (Nx, Turbo) |
| Multirepo | Límites de propiedad claros por servicio |
| DDD | Dominios de negocio complejos; define Bounded Contexts y Agregados |

### 2.3. Seguridad
- Autenticación/Autorización: OAuth2/OIDC; mTLS entre servicios (Zero Trust)
- Secretos: nunca en código; usar AWS Secrets Manager, Azure Key Vault, GCP Secret Manager
- API Security: rate limiting, validación de entradas (OWASP Top 10), API Gateway
- Red: VPCs, subredes privadas para bases de datos, Security Groups

### 2.4. Observabilidad
- **Logs**: estructurados (JSON), centralizados, incluir `trace-id`
- **Métricas**: latencia (p95, p99), tasa de errores, saturación (Prometheus, Grafana, CloudWatch)
- **Trazas**: indispensable en microservicios (OpenTelemetry, Jaeger, X-Ray)

### 2.5. Pipeline de IA para Analytics B2B

El motor de IA es un componente backend asíncrono; no forma parte del flujo del usuario en la app móvil.

- **Trigger**: eventos de compra validada publicados en la cola de mensajería (post confirmación de POS)
- **Procesamiento**: batch sobre datos agregados de compras — patrones de consumo, segmentación de clientes, predicción de demanda
- **Salida**: reportes e insights entregados a marcas y supermercados; es el modelo de ingreso principal de SmartCart
- **Modelo**: LLM vía API externa (ver Ficha de Integración en `designGuidelines.md`); el modelo concreto es intercambiable
- **Restricciones**:
  - Procesamiento en horas valle para no saturar la cola compartida con el flujo transaccional
  - Los datos deben estar anonimizados/agregados antes de enviarse al modelo
  - Costos de inferencia deben monitorearse como métrica de negocio (no solo de infra)

### 2.6. Disponibilidad y Escalabilidad
**Disponibilidad**:
- Diseño Multi-AZ
- Replicación de bases de datos con failover automático
- Patrones de resiliencia: `Circuit Breaker`, `Retry con Backoff`, `Bulkhead`

**Escalabilidad**:
- Servicios stateless en capa de aplicación
- Colas y workers para trabajo pesado
- Caching: CDN (estáticos), Redis/ElastiCache (datos)
- Auto-scaling basado en métricas (CPU, RPS, longitud de cola)

---

## 3. Modelo C4

### Nivel 1: Diagrama de Contexto
- Audiencia: negocio, no técnica
- Muestra el sistema como caja negra + actores + sistemas externos
- Herramienta: Mermaid `graph` o `C4Context`

### Nivel 2: Diagrama de Contenedores
- Audiencia: arquitectos, ops
- Descompone en contenedores ejecutables o almacenes de datos (App Web, API, DB, Microservicio)
- Muestra interacciones tecnológicas entre contenedores
- Herramienta: Mermaid `C4Container`

### Nivel 3: Diagrama de Componentes
- Audiencia: desarrolladores del sistema
- Descompone un contenedor en módulos lógicos principales
- Muestra responsabilidades y relaciones
- Herramienta: Mermaid `C4Component`

### Nivel 4: Diagrama de Código (Clases)
- Audiencia: desarrolladores del componente
- Opcional; ilustra patrones de diseño o estructura interna clave
- Herramienta: Mermaid `classDiagram`