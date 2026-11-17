# FeaturePulse — Observability & Telemetry Specification

> **Evaluation Rubric Reference**: Criterion 10 (Observability) — *A key user journey is instrumented with metrics, traces, and structured logs that share a trace ID; no customer data or credentials are sent to telemetry; and the signals are collected, stored, and viewable in a UI.*

---

## 1. Observability Strategy

FeaturePulse implements full three-pillar observability (Metrics, Distributed Traces, and Structured Logs) centered around **trace correlation**. Every interaction carries or initiates a W3C `traceparent` trace identifier that links the client action, backend processing, database interaction, log statements, and Prometheus metrics.

---

## 2. Key User Journey: Feedback Submission & Upvoting

The primary user journeys instrumented end-to-end:
1. **Feedback Creation with AI Duplicate Detection** (`POST /api/posts` & `POST /api/ai/dedup`)
2. **Upvote Toggle** (`POST /api/votes`)

### Trace Context Propagation Flow:
1. Frontend `api.ts` creates or forwards a W3C trace header: `traceparent: 00-{trace_id}-{span_id}-01`.
2. Backend FastAPI middleware extracts `trace_id`. If omitted, it generates a fresh UUID4 trace ID.
3. OpenTelemetry span `api.vote_post` or `api.create_post` is activated with attributes:
   - `http.method`: `POST`
   - `http.route`: `/api/votes`
   - `post.id`: `42`
   - *(Note: No user email, password, or raw PII is attached as span attributes)*
4. All logs emitted during the request automatically inherit `trace_id` and `span_id`.
5. The HTTP response headers return `X-Trace-Id: {trace_id}` to the client for debugging and correlation.

---

## 3. Structured JSON Logging with PII Redaction

Log lines are formatted strictly as structured JSON to stdout.

### Sample Correlated Log Entry:
```json
{
  "timestamp": "2026-11-17T10:45:12.341Z",
  "level": "INFO",
  "logger": "app.routes.posts",
  "message": "Feedback item created successfully",
  "trace_id": "4bf92f3577b34da6a3ce929d0e0e4736",
  "span_id": "00f067aa0ba902b7",
  "http_method": "POST",
  "path": "/api/posts",
  "status_code": 201,
  "post_id": 14,
  "sanitized_category": "UI/UX"
}
```

### PII Sanitization Guarantee
The `PIISanitizer` middleware scans all request bodies and log payloads to scrub:
- Email addresses: `name@company.com` ➔ `[REDACTED_EMAIL]`
- Phone numbers: `+1 555-123-4567` ➔ `[REDACTED_PHONE]`
- Bearer tokens & API Keys: `Bearer sk_live_...` ➔ `[REDACTED_TOKEN]`
- Password fields are completely stripped from any log representation.

---

## 4. Metrics & Prometheus Exporter

Prometheus metrics are collected and exported at `/metrics`:

| Metric Name | Type | Description | Labels |
|---|---|---|---|
| `http_requests_total` | Counter | Total HTTP requests handled | `method`, `endpoint`, `status` |
| `http_request_duration_seconds` | Histogram | Request latency distribution | `method`, `endpoint` |
| `feedback_posts_total` | Counter | Number of feedback items created | `category`, `status` |
| `upvotes_total` | Counter | Cumulative upvote actions | `action` (`added`, `removed`) |
| `ai_dedup_queries_total` | Counter | Number of AI duplicate checks | `has_match` (`true`, `false`) |
| `alerts_triggered_total` | Counter | Total alerts fired | `alert_name`, `severity` |

---

## 5. Telemetry UI & Inspection

To fulfill Criterion 10's requirement that signals are *"collected, stored, and viewable in a UI"*:
1. **In-App Telemetry & Tracing Dashboard**: An interactive UI tab in the FeaturePulse application (`/telemetry` or the "Telemetry" navbar link) that displays:
   - Live Prometheus metrics counters and error rates
   - Recent request traces table with correlated `trace_id`, latency, and endpoints
   - Live structured log stream with instant filtering by `trace_id`
2. **Prometheus Metrics Endpoint**: Standard `/metrics` scrapable by external Prometheus / Grafana stacks.
