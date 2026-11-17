# FeaturePulse — System Architecture & Design

> **Evaluation Rubric Reference**: Criterion 4 (Context Management) & Criterion 5 (Application Architecture)

---

## 1. System Overview

FeaturePulse is an end-to-end feedback intelligence platform featuring:
- **Frontend**: Single-Page Application built with React 18, TypeScript, and Tailwind CSS.
- **Backend API**: High-performance asynchronous API built with FastAPI (Python 3.11/3.12).
- **Persistence Layer**: SQLAlchemy ORM with support for SQLite (zero-config local run) and PostgreSQL (production/docker-compose).
- **AI Deduplication**: Semantic text matching and n-gram similarity engine for real-time duplicate feedback detection.
- **Telemetry Layer**: OpenTelemetry tracing, Prometheus metrics exporter (`/metrics`), and JSON structured logger with automatic PII masking.
- **Autonomous On-Call Agent**: Webhook receiver that ingests alert triggers, queries recent telemetry traces, applies auto-remediation, and generates markdown incident postmortems.

---

## 2. Architecture Diagram

```mermaid
flowchart TD
    subgraph Client ["Frontend (React + Vite)"]
        UI["User Interface (Boards, Roadmap, Modal)"]
        TraceInjector["W3C Traceparent Header Injector"]
        TelemetryDash["In-App Telemetry & Incident View"]
    end

    subgraph Server ["Backend (FastAPI)"]
        Middleware["Telemetry & Correlation Middleware (trace_id extraction)"]
        RoutesPosts["/api/posts (CRUD & Filters)"]
        RoutesVotes["/api/votes (Atomic Upvoting)"]
        RoutesAI["/api/ai (Deduplication & Auto-Tag)"]
        RoutesAlerts["/api/alerts (Webhook & Simulation)"]
        
        Sanitizer["PII Redaction Engine"]
        OTel["OpenTelemetry Tracer & Prometheus Exporter"]
        Logger["Structured JSON Logger"]
        OnCallAgent["On-Call Responder Agent"]
    end

    subgraph Storage ["Persistence Layer"]
        DB[(PostgreSQL / SQLite Database)]
        Models["Posts, Votes, Comments, Tags, Incidents"]
    end

    UI --> TraceInjector
    TraceInjector -->|HTTP + traceparent| Middleware
    Middleware --> RoutesPosts & RoutesVotes & RoutesAI & RoutesAlerts
    
    RoutesPosts --> Sanitizer --> DB
    RoutesVotes --> DB
    RoutesAI --> DB
    
    RoutesAlerts -->|Trigger Alert| OnCallAgent
    OnCallAgent -->|Remediate & Postmortem| DB
    
    Middleware --> OTel
    Middleware --> Logger
    OTel -->|/metrics| TelemetryDash
```

---

## 3. Data Models (Entity-Relationship)

### `Post`
- `id`: Integer (Primary Key)
- `title`: String(255) (Indexed)
- `description`: Text (PII-sanitized)
- `category`: String(50) (e.g. `UI/UX`, `Performance`, `Integrations`, `Core Feature`, `Bug`)
- `status`: String(30) (`open`, `under_review`, `planned`, `in_progress`, `completed`)
- `vote_count`: Integer (Default: 1, Indexed)
- `author_id`: String(100) (Anonymous client hash or user handle)
- `created_at`: DateTime (UTC)
- `updated_at`: DateTime (UTC)

### `Vote`
- `id`: Integer (Primary Key)
- `post_id`: Integer (Foreign Key -> `Post.id`, Cascading Delete)
- `user_id`: String(100) (Client session ID)
- `created_at`: DateTime (UTC)
- *Unique Constraint*: `(post_id, user_id)` guarantees idempotent 1 vote per user per post.

### `Comment`
- `id`: Integer (Primary Key)
- `post_id`: Integer (Foreign Key -> `Post.id`)
- `author_id`: String(100)
- `content`: Text (PII-sanitized)
- `created_at`: DateTime (UTC)

### `Incident`
- `id`: Integer (Primary Key)
- `alert_name`: String(100)
- `severity`: String(20) (`warning`, `critical`)
- `status`: String(20) (`firing`, `investigating`, `resolved`)
- `symptoms`: Text
- `root_cause`: Text
- `remediation_action`: Text
- `trace_id`: String(64)
- `postmortem_md`: Text
- `created_at`: DateTime (UTC)

---

## 4. Key User Journey: Trace-Correlated Upvoting

```mermaid
sequenceDiagram
    autonumber
    actor User as User Browser
    participant FE as Frontend Client
    participant API as FastAPI Backend
    participant OTel as OpenTelemetry
    participant DB as Database
    participant Log as Structured Logger

    User->>FE: Clicks "Upvote" button
    FE->>FE: Generates W3C traceparent (or extends trace)
    FE->>API: POST /api/votes (with traceparent header)
    API->>OTel: Extract trace_id and start span "api.vote_post"
    API->>Log: Log info: "Processing upvote request" (bound to trace_id)
    API->>DB: Check existing vote (post_id, user_id)
    alt Already Voted
        API->>DB: Delete vote & decrement post.vote_count
        API->>Log: Log info: "Vote removed (unvoted)"
    else Not Yet Voted
        API->>DB: Insert vote & increment post.vote_count
        API->>Log: Log info: "Vote added"
    end
    API->>OTel: Record metric: upvotes_total.add(1)
    API->>OTel: Close span
    API-->>FE: HTTP 200 { post_id, vote_count, has_voted, trace_id }
    FE-->>User: Instant UI counter update with active upvote state
```

---

## 5. Security & PII Protection Policy

- **No Secrets in Telemetry**: Database credentials, tokens, and authorization headers are scrubbed at the logging and tracing middleware boundary.
- **PII Scrubbing**: Free-form text fields (feedback description, comments) are passed through an automated regular expression sanitizer that strips:
  - Email addresses (e.g., `user@domain.com` ➔ `[REDACTED_EMAIL]`)
  - Phone numbers (e.g., `+1-555-0199` ➔ `[REDACTED_PHONE]`)
  - API keys and tokens (e.g., `sk_live_...` ➔ `[REDACTED_KEY]`)
- **Anonymous Session Identifiers**: Client identities are hashed or stored as opaque session UUIDs.
