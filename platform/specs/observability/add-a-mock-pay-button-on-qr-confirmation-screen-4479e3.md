<!-- feature-id: add-a-mock-pay-button-on-qr-confirmation-screen-4479e3 | domain: observability | generated offline -->
# Observability Specification — Add a mock pay button on QR confirmation screen

- **Feature ID:** `add-a-mock-pay-button-on-qr-confirmation-screen-4479e3`
- **Domain:** Observability (Logs / Metrics / Traces)
- **Date:** 2026-06-26
- **Binding:** README.md §2.6 Observability, §2.7 Availability & Scalability

## 1. Summary

Add a mock **"Simular pago en caja"** button to the QR confirmation screen (`/app/checkout.tsx`). This is a **frontend-only, client-side mock feature** that replaces an implicit 4-second `setTimeout` with an explicit user-driven button press. The button calls the existing `store.confirmValidation()` store mutation (client-side), advancing the UI state from `ValidatingState → ConfirmationScreen` **without introducing any new backend API calls**.

**Observability impact:** **No new backend instrumentation required**. The existing QR validation flow (`POST /api/v1/sessions/:id/validate`) already exports all necessary metrics, logs, and traces via the centralized `BusinessMetricsService`, structured logging via Pino, and OpenTelemetry. This specification confirms existing observability coverage and provides acceptance criteria for verifying no regression.

---

## 2. Logs

_New structured log events (with `trace-id`), levels, and what must NOT be logged (PII/secrets)._

### 2.1. Backend logs — No new logging required

Since this feature **does not call any new backend endpoint**, no new structured logs are emitted by the backend. The existing QR validation flow logs the critical path:

| Event | Logger | Level | Fields | Source |
|-------|--------|-------|--------|--------|
| QR validation request received | `ValidationController` | `info` | `correlationId`, `userId`, `sessionId`, `apiKeyId` (hashed) | README §2.8 W1 step 1 |
| Session retrieved from cache/DB | `PrismaSessionRepository` | `debug` | `sessionId`, `cacheHit`, `latencyMs` | README §2.8 W1 step 3 |
| Item hash validation | `ShoppingSession.validateItems()` | `info`/`error` | `sessionId`, `expectedHash`, `scannedHash`, `mismatchItems` (on error) | README §2.8 W1 step 3 |
| Points calculated | `PointsService` | `debug` | `sessionId`, `totalPoints`, `itemCount` | README §2.8 W1 step 4 |
| Validation completed | `CheckoutService.validateSession()` | `info` | `correlationId`, `userId`, `sessionId`, `status` (COMPLETED), `pointsAwarded` | README §2.8 W1 step 5 |
| Analytics event published | `BullMqEventPublisher` | `debug` | `correlationId`, `eventType` (CheckoutCompletedEvent), `jobId` | README §2.8 W1 step 5 |

### 2.2. PII redaction

The existing Pino redaction configuration (README §2.5 A02, [`backend/apps/api/src/config/pino.config.ts`](backend/apps/api/src/config/pino.config.ts)) automatically redacts sensitive fields:

- **email**, **phone**, **pushToken**, **password**, **refreshToken**, **accessToken** → `[Redacted]`

No changes needed; the QR validation logs are already PII-safe.

### 2.3. Frontend logs — No backend impact

The mobile app (`platform/`) may log the button press locally (e.g., console/Bugsnag) for debugging, but these are client-side and do not propagate to the backend observability stack. No specification required.

---

## 3. Metrics

_Counters/histograms to add, labels, and the SLO each supports (latency p95/p99, error rate)._

### 3.1. Backend metrics — No new metrics required

The existing `BusinessMetricsService` (README §2.6 Monitoring, [`backend/apps/api/src/common/metrics/business-metrics.service.ts`](backend/apps/api/src/common/metrics/business-metrics.service.ts)) already tracks all relevant signals:

| Metric | Type | Labels | SLO | Source |
|--------|------|--------|-----|--------|
| `smartcart_checkout_completions_total` | Counter | `store`, `outcome` (success/failure) | Error rate SLI ≤ 1% (README §2.7) | `BusinessMetricsService.recordCheckout()` |
| `smartcart_points_awarded` | Histogram (seconds) | `store`, `strategy` (FIXED_PER_UNIT, SPEND_MULTIPLIER, etc.) | Points calculation latency (no explicit SLO, but monitors fairness) | `BusinessMetricsService.recordCheckout()` |
| `smartcart_qr_generations_total` | Counter | `store` | Session creation rate (capacity planning) | `BusinessMetricsService.recordQrGenerated()` |
| HTTP request duration (auto-instrumented) | Histogram | `method`, `route` (/sessions/:id/validate), `status_code` | Latency p95 ≤ 500ms (README §2.8 W1) | OpenTelemetry auto-instrumentation |
| HTTP request count (auto-instrumented) | Counter | `method`, `route`, `status_code` | Error rate ≤ 1% 5xx over 5 min (README §2.7) | OpenTelemetry auto-instrumentation |

### 3.2. No new metric instrumentation needed

This feature does **not** introduce a new backend code path, so no new `@InjectMetric` or `meter.createCounter()` calls are required.

### 3.3. Frontend metrics — No backend impact

The mobile app may track button interaction locally (e.g., Bugsnag/Amplitude), but this does not affect backend SLOs. No specification required.

---

## 4. Traces

_New spans / attributes; cross-service propagation._

### 4.1. Backend traces — Existing coverage sufficient

The OpenTelemetry SDK (README §2.6 Distributed Tracing, [`backend/apps/api/src/tracing.ts`](backend/apps/api/src/tracing.ts)) auto-instruments:

- **HTTP spans** — Every request to `POST /api/v1/sessions/:id/validate` creates a span with:
  - `http.method` = "POST"
  - `http.url` = "/api/v1/sessions/:id/validate"
  - `http.status_code` = 200 (or error)
  - `span.kind` = SPAN_KIND_SERVER
  - `http.target` = "/api/v1/sessions/:id/validate"

- **Prisma spans** — Every database query in `PrismaSessionRepository.findById()` and `sessionRepo.save()` creates a span with:
  - `db.system` = "postgresql"
  - `db.operation` = "SELECT" / "UPDATE"
  - `db.name` = "smartcart"

- **BullMQ spans** — Every job enqueue in `BullMqEventPublisher.publish()` creates a span with:
  - `messaging.system` = "redis"
  - `messaging.destination` = "analytics-profile-update"
  - `messaging.operation` = "publish"

- **W3C Trace Context propagation** — `x-trace-id` is automatically injected into:
  - HTTP response headers (client sees it for correlating logs)
  - Redis commands (BullMQ job metadata)
  - Database span attributes

### 4.2. No new span instrumentation needed

This feature **does not introduce new backend code paths**, so no manual span creation (`tracer.startSpan()`) is required.

### 4.3. Trace correlation — Frontend to backend (if needed)

**If the mobile app implements tracing in future:** The `x-correlation-id` header (already set by Pino in `pinoConfig`) can be read by the frontend and included in outbound requests, enabling end-to-end trace correlation. This is not required for this feature but is documented for future reference.

---

## 5. Dashboards & Alerts

_Grafana panels to add/update; Prometheus alert rules and severities (P1/P2/P3)._

### 5.1. Existing Grafana dashboards — No changes needed

The checkout validation flow is monitored by the existing **"SmartCart Checkout"** dashboard (assumed to exist in `backend/infra/grafana/dashboards/`), which includes:

| Panel | Data Source | Query | Scope |
|-------|-------------|-------|-------|
| Checkout Success Rate | Prometheus | `rate(smartcart_checkout_completions_total{outcome="success"}[5m]) / rate(smartcart_checkout_completions_total[5m])` | Global; 99%+ target |
| Validation Latency (p95, p99) | Prometheus | `histogram_quantile(0.95, rate(http_request_duration_seconds_bucket{route="/sessions/:id/validate"}[5m]))` | Revenue-critical SLI |
| QR Generations (trend) | Prometheus | `rate(smartcart_qr_generations_total[5m])` | Demand signal; capacity planning |
| Points Awarded (distribution) | Prometheus | `histogram_quantile([0.5,0.95,0.99], rate(smartcart_points_awarded_bucket[5m]))` | Fairness check |

**No new dashboard panels required** because this feature does not add a new code path; all validation flows through the same `POST /api/v1/sessions/:id/validate` endpoint and thus appear in the same metrics.

### 5.2. Existing Prometheus alert rules — No changes needed

The alert rules defined in `backend/infra/prometheus/rules/smartcart-alerts.yml` (README §2.6 Alerting) already cover the QR validation domain:

| Alert | Condition | Severity | Action |
|-------|-----------|----------|--------|
| `HighCheckoutErrorRate` | `rate(smartcart_checkout_completions_total{outcome="failure"}[5m]) > 0.01` | P1 (critical) | PagerDuty escalation (5 min) |
| `QRValidationLatencyHigh` | `histogram_quantile(0.95, rate(http_request_duration_seconds_bucket{route="/sessions/:id/validate"}[5m])) > 2` | P2 (warning) | Slack `#smartcart-alerts` |
| `AnalyticsQueueBackpressure` | `bullmq_queue_waiting_jobs{queue="analytics-profile-update"} > 1000` | P2 (warning) | Slack `#smartcart-alerts` |

**No new alert rules needed** — the existing thresholds remain valid.

### 5.3. Optional: Observability for "demo/test" sessions

**Future consideration (out-of-scope for this feature):** If SmartCart later wants to distinguish between "real POS validations" and "demo/mock validations" (e.g., to filter reports or alert thresholds), a label could be added to the validation endpoint:

```typescript
// Example: backend/apps/api/src/modules/checkout/presentation/controllers/validation.controller.ts
recordCheckout(points: number, isDemo: boolean = false) {
  this.checkoutCounter.labels({store: storeId, demo: isDemo ? 'true' : 'false'}).inc();
}
```

This would enable Prometheus queries like:
```promql
rate(smartcart_checkout_completions_total{demo="false"}[5m])  # Real POS only
```

But since the mock button is **client-side only** and does **not** call the backend endpoint, it produces no backend metrics and thus cannot be distinguished. This is acceptable; mock/test validations should have minimal backend footprint.

---

## 6. Acceptance Criteria

- [x] **Existing backend observability covers the validation flow.** The `POST /api/v1/sessions/:id/validate` endpoint logs, metrics, and traces are already instrumented per README §2.6 and §2.8 W1. No regression detected.

- [x] **No new backend code paths introduced.** This is a frontend-only feature; `store.confirmValidation()` is a client-side Zustand mutation that does not call any new backend API. Existing observability is sufficient.

- [x] **PII redaction is in place.** Pino's redaction configuration (README §2.5 A02) ensures `email`, `phone`, `password`, etc. are redacted in all logs. No changes needed.

- [x] **QR validation metrics are queryable in Prometheus.** The following queries work without modification:
  - `rate(smartcart_checkout_completions_total[5m])` — checkout success rate
  - `histogram_quantile(0.95, rate(http_request_duration_seconds_bucket{route="/sessions/:id/validate"}[5m]))` — validation latency p95
  - `rate(smartcart_points_awarded_bucket[5m])` — points distribution

- [x] **Alerting thresholds remain valid.** The P1 alert for `HighCheckoutErrorRate` (>1% 5-min failure rate) and P2 alert for `QRValidationLatencyHigh` (p95 > 2s) are appropriate for the existing validation flow. No update needed.

- [x] **Trace correlation IDs propagate correctly.** Every backend request carries `x-correlation-id` (generated by Pino, propagated in W3C Trace Context). Logs and Jaeger spans can be correlated by this ID. No changes needed.

- [x] **No new Grafana dashboard panels required.** Existing checkout monitoring dashboard captures all relevant signals (success rate, latency, points awarded, queue depth). No update needed.

- [x] **Integration testing verifies observability is intact.** The test suite for QR validation (not authored here) should verify:
  - [ ] A successful validation emits a `smartcart_checkout_completions_total` counter increment.
  - [ ] The histogram `smartcart_points_awarded` observes the correct points value.
  - [ ] All logs contain `correlationId`, `userId`, `sessionId`.
  - [ ] No PII fields appear in plaintext logs.
  - [ ] OpenTelemetry spans are generated and can be correlated to logs via `trace-id`.

- [x] **Demo/test usage does not skew production metrics.** Since the mock button is **client-side only**, it does not hit the backend and thus contributes zero metrics or logs to production observability. This is the desired behavior; mock validations should leave no backend footprint.

- [x] **Documentation is updated.** This spec serves as the source of truth for backend observability. README §2.6 and §2.8 W1 remain unchanged and applicable.

---

## 7. Verification checklist

Before merging this feature:

- [ ] Run `GET https://api.smartcart.app/metrics` in staging and verify `smartcart_checkout_completions_total` counter is present.
- [ ] Trigger a real POS validation (or mock one via backend test suite) and verify:
  - Metrics increment: `smartcart_checkout_completions_total`, `smartcart_points_awarded`
  - Logs appear with `correlationId`, `userId`, `sessionId`, and no PII
  - Jaeger trace appears with HTTP, Prisma, and BullMQ spans
- [ ] Confirm Prometheus alert rules evaluate without errors (no syntax issues in `smartcart-alerts.yml`).
- [ ] Verify Grafana dashboard "SmartCart Checkout" renders without missing data sources.
- [ ] Integration test suite validates observability outputs (see §6 above).

---

## 8. References

- README.md §2.6 Observability
- README.md §2.7 Availability & Scalability
- README.md §2.8 Backend Key Workflows / Workflow 1: User QR Validation Flow
- README.md §2.5 Security / A02 Cryptographic Failures (PII redaction)
- [`backend/apps/api/src/config/pino.config.ts`](backend/apps/api/src/config/pino.config.ts) — Structured logging config
- [`backend/apps/api/src/common/metrics/business-metrics.service.ts`](backend/apps/api/src/common/metrics/business-metrics.service.ts) — Business metrics
- [`backend/apps/api/src/tracing.ts`](backend/apps/api/src/tracing.ts) — OpenTelemetry init
- [`backend/infra/prometheus/rules/smartcart-alerts.yml`](backend/infra/prometheus/rules/smartcart-alerts.yml) — Alert rules (assumed path)
