<!-- feature-id: add-a-help-tooltip-to-the-rewards-screen-313fc6 | domain: observability | generated offline -->
# Observability Specification — Add a help tooltip to the rewards screen

- **Feature ID:** `add-a-help-tooltip-to-the-rewards-screen-313fc6`
- **Domain:** Observability (Logs / Metrics / Traces)
- **Date:** 2026-06-26
- **Binding:** README.md §2.6 Observability, §2.7 Availability & Scalability

## 1. Summary

Add observability instrumentation for a new static help-content endpoint (`GET /api/v1/rewards/help`) that serves localized tooltip text to the mobile rewards screen. The endpoint is cacheable, requires JWT auth, and has zero domain model changes — it is a pure read-only service. Observability focuses on standard HTTP request/response telemetry and ensuring the endpoint's cache headers are respected by downstream systems.

## 2. Logs

**Structured logging via `nestjs-pino` (README §2.6).**

### Request/Response Logging

The endpoint is covered by the existing global request/response interceptor configured in [`backend/apps/api/src/config/pino.config.ts`](backend/apps/api/src/config/pino.config.ts). Every HTTP request to `GET /api/v1/rewards/help` is logged as a structured JSON event with:

- **Field: `req.method`** → `"GET"`
- **Field: `req.url`** → `"/api/v1/rewards/help"`
- **Field: `res.statusCode`** → `200` (success) or `401` (unauthenticated)
- **Field: `trace-id`** → W3C Trace Context correlation ID (from `X-Trace-Id` header or generated)
- **Field: `userId`** → JWT `sub` claim (the authenticated user's UUID)
- **Field: `role`** → JWT `role` claim (always `"USER"` for mobile)
- **Field: `responseTime` / `duration`** → milliseconds
- **Field: `level`** → `"info"` on success, `"warn"` on 401

### No Audit Log Entry Required

This endpoint is **not** a sensitive operation per README §2.5 audit logging. It returns static, publicly visible marketing copy (help text), not financial records or PII. No separate `AuditInterceptor` entry is needed.

### What Must NOT Be Logged

- No response body is logged in full (body size is typically < 600 bytes; avoid cluttering logs).
- No JWT token from the `Authorization` header (handled by existing Pino `redact` config at token-bearer level).
- No PII from the response (the response contains only static help text — `title`, `body`, `learnMoreUrl` — none of which references user data).

**Implementation check:** Verify that `backend/apps/api/src/config/pino.config.ts` includes `'Authorization'` and `'authorization'` in the `redact.paths` array, which Pino applies to all log lines.

---

## 3. Metrics

### Default HTTP Metrics (Auto-Collected)

The endpoint contributes to **existing** Prometheus metrics exposed at `GET /api/v1/metrics` via the `@willsoto/nestjs-prometheus` package (README §2.6):

| Metric Name | Type | Labels | SLO/Threshold |
|---|---|---|---|
| `http_requests_total` | Counter | `method="GET"`, `route="/api/v1/rewards/help"`, `status_code="200"` | Count of successful requests. Baseline expectation: low volume (users fetch help <1 per session). |
| `http_request_duration_seconds` | Histogram | `method="GET"`, `route="/api/v1/rewards/help"`, `status_code="200"` | Latency p95/p99 **must be <50ms**. The response is entirely in-process (no DB, no I/O); expect <5ms typical. A spike >50ms indicates a problem in middleware (auth guard, header parsing). |
| `http_requests_total` (401 path) | Counter | `method="GET"`, `route="/api/v1/rewards/help"`, `status_code="401"` | Count of unauthenticated requests. Expected volume: near-zero. A spike indicates a client bug (missing/expired JWT on every request). |

### No New Business Metrics

The endpoint does not introduce a new business counter or histogram. It is not a user-facing action (like "checkout completed" or "points awarded"); it is infrastructure (static help text delivery). The default HTTP request metrics suffice.

### Optional: Dashboard Label Grouping

To organize the dashboard by module, consider configuring the Prometheus scrape config ([`backend/infra/prometheus/prometheus.yml`](backend/infra/prometheus/prometheus.yml)) to apply a label `module="rewards"` to all routes matching `/api/v1/rewards/*`. This allows Grafana to group rewards-module metrics in a single dashboard without per-endpoint configuration.

---

## 4. Traces

### OpenTelemetry Auto-Instrumentation

The endpoint is **automatically instrumented** by the OpenTelemetry SDK initialized in [`backend/apps/api/src/tracing.ts`](backend/apps/api/src/tracing.ts). No manual span creation is required. The auto-instrumentation covers:

- **HTTP/Express integration** — automatically creates a span for the incoming HTTP request with:
  - **span name:** `GET /api/v1/rewards/help`
  - **Attributes:**
    - `http.method` → `"GET"`
    - `http.url` → `"/api/v1/rewards/help"`
    - `http.status_code` → `200` or `401`
    - `http.response_content_length` → byte count of the response body (~150–400 bytes)
  - **Events:** auto-generated on request start and response completion
  - **Trace Context:** W3C Trace Context propagated from the client via `traceparent` header (if present) or generated fresh

- **Duration:** the span encompasses the entire request processing (auth guard, service call, response serialization).

- **No manual spans needed:** a static read-only endpoint with zero I/O does not benefit from additional granular spans. The auto-instrumented HTTP span is sufficient.

### Trace Export

Spans are exported via OTLP gRPC to Jaeger at the collector endpoint configured in `backend/apps/api/src/tracing.ts` (typically `http://localhost:4317` in dev, or Jaeger service in production). The trace is queryable by:
- **Service name:** `smartcart-api`
- **Span name:** `GET /api/v1/rewards/help`
- **Trace ID:** propagated from the client or generated by the SDK

---

## 5. Dashboards & Alerts

### Existing Rewards Dashboard

Add two optional visualization panels to the existing Rewards module dashboard in Grafana (if one exists):

#### Panel 1: Help Endpoint Request Rate

- **Title:** "Help Tooltip Request Rate"
- **Metric:** `rate(http_requests_total{route="/api/v1/rewards/help", status_code="200"}[5m])`
- **Type:** Graph (time-series line)
- **Legend:** "Successful requests per second"
- **Interpretation:** Shows user engagement with the help tooltip. Expected pattern: low, sporadic traffic (users read help a few times per session). Spike might indicate a UI bug (tooltip auto-opening repeatedly).

#### Panel 2: Help Endpoint Latency (p95)

- **Title:** "Help Endpoint Latency (p95)"
- **Metric:** `histogram_quantile(0.95, rate(http_request_duration_seconds_bucket{route="/api/v1/rewards/help"}[5m]))`
- **Type:** Graph (time-series line)
- **Unit:** Seconds
- **Threshold line:** 50ms (red line)
- **Interpretation:** Should always be <5ms (in-process, no I/O). If consistently >50ms, investigate middleware overhead (auth guard performance). If spiking to >100ms, suspect GC pause or upstream load balancer.

### Alert Rules (Optional)

**No P1 or P2 alerts are justified for this endpoint.** It is static content with zero business logic; if it fails, the tooltip is unavailable, but checkout and purchases are unaffected. A P3 notification is optional:

#### Alert Rule: Help Endpoint Error Rate

- **Rule name:** `RewardsHelpEndpointHighErrorRate`
- **Condition:** `rate(http_requests_total{route="/api/v1/rewards/help", status_code="401"}[5m]) > 0.1` (more than 0.1 errors/sec = >6/min)
- **Severity:** P3 (info)
- **Action:** Post to Slack `#smartcart-alerts` with message: "Rewards help endpoint returning >10% 401s — possible auth config issue or client bug."
- **Rationale:** A sustained spike in 401s (unauthenticated) suggests a client-side JWT handling regression, worth investigating.

**No latency alerts** — the endpoint is expected to complete in <5ms consistently. If it doesn't, it is a symptom of a broader system issue (high GC, CPU contention) that would be better caught by a host-level or cluster-level alert.

---

## 6. Acceptance Criteria

- [ ] **Logs:** The endpoint logs are visible in `stdout` when the API starts with `LOG_LEVEL=debug`. A `curl https://localhost:3000/api/v1/rewards/help -H "Authorization: Bearer <token>"` produces a structured JSON log entry with `level: "info"`, `req.method: "GET"`, `res.statusCode: 200`, `trace-id`, and `userId`.

- [ ] **Logs (PII):** No JWT token, email, or phone number appears in any log line when `curl`-testing the endpoint. Check that `pino.config.ts` redacts `Authorization` headers.

- [ ] **Metrics:** `GET /metrics` (Prometheus scrape endpoint) includes `http_requests_total{route="/api/v1/rewards/help", status_code="200"}` with a count >0 after at least one successful request.

- [ ] **Metrics (Latency):** `histogram_quantile(0.95, http_request_duration_seconds_bucket{route="/api/v1/rewards/help"})` is **<50ms** under normal load. Verify in Prometheus query UI or Grafana.

- [ ] **Metrics (Error):** An unauthenticated request (`curl` without JWT) increments `http_requests_total{route="/api/v1/rewards/help", status_code="401"}` by 1.

- [ ] **Traces:** A request to the endpoint produces a span in Jaeger queryable by service="smartcart-api", span name="GET /api/v1/rewards/help", with `http.status_code=200` and duration <10ms.

- [ ] **Traces (Propagation):** If the client sends a `traceparent` header, the Jaeger span's trace ID matches the header's trace ID, confirming cross-service correlation.

- [ ] **Cache Control:** The response includes `Cache-Control: public, max-age=3600` header. Verify with `curl -i https://localhost:3000/api/v1/rewards/help` and inspect the headers.

- [ ] **Dashboard (optional):** A Grafana dashboard panel displays the "Help Tooltip Request Rate" (request count over time) with no errors.

- [ ] **Alert (optional):** If a P3 alert rule is configured for `RewardsHelpEndpointHighErrorRate`, simulate 401s by sending unauthenticated requests and confirm Slack notification fires within 5 minutes.

- [ ] **No new observability code:** The endpoint reuses existing Pino logging, Prometheus instrumentation, and OpenTelemetry spans — no new files or configuration in `backend/apps/api/src/config/` or `backend/apps/api/src/common/`. All telemetry is automatic.
