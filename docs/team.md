# FeaturePulse — Agent Team Specification

> **Evaluation Rubric Reference**: Criterion 3 (Agent Team Specification) — *The project defines the agent team and process of how they work together.*

---

## 1. Overview of the Agent Team

FeaturePulse was designed and engineered using a coordinated multi-agent team. Each agent has a distinct specialization, strict bounded context, well-defined inputs/outputs, and documented handoff protocols.

```
       ┌───────────────────────────────┐
       │   Lead Architecture Agent     │
       │  (System Design & Contracts)  │
       └──────────────┬────────────────┘
                      │ Specs & Contracts
         ┌────────────┴────────────┐
         ▼                         ▼
┌──────────────────┐      ┌──────────────────┐
│  Backend Agent   │      │  Frontend Agent  │
│ (FastAPI & ORM)  │      │ (React & Vite)   │
└────────┬─────────┘      └────────┬─────────┘
         │ Code & Endpoints        │ UI Components
         └────────────┬────────────┘
                      ▼
       ┌───────────────────────────────┐
       │     Observability Agent       │
       │  (OpenTelemetry & Prometheus) │
       └──────────────┬────────────────┘
                      │ Traces & Metrics
         ┌────────────┴────────────┐
         ▼                         ▼
┌──────────────────┐      ┌──────────────────┐
│     QA Agent     │      │   DevOps Agent   │
│ (Unit & Integr.) │      │ (Docker & CI/CD) │
└────────┬─────────┘      └────────┬─────────┘
         │ Verified Quality Gate   │ Container Images
         └────────────┬────────────┘
                      ▼
       ┌───────────────────────────────┐
       │   On-Call Responder Agent     │
       │ (Autonomous Incident Healing) │
       └───────────────────────────────┘
```

---

## 2. Agent Roles & Responsibilities

### 1. Lead Architecture Agent
- **Role**: System Architect & Product Owner.
- **Responsibilities**:
  - Author and maintain product specifications, data dictionaries, and API schemas (`docs/architecture.md`, `docs/tasks.md`).
  - Define acceptance criteria and ensure architectural integrity across all modules.
- **Handoff Artifacts**: OpenAPI schemas, DB entity-relationship diagrams, task tracker milestones.

### 2. Backend Agent
- **Role**: API & Core Logic Engineer.
- **Responsibilities**:
  - Implement FastAPI endpoints, SQLAlchemy data models, and Pydantic validation schemas.
  - Develop the AI deduplication engine (semantic vector/trigram similarity) and category tagging logic.
  - Implement database migrations and seeded sample datasets.
- **Handoff Artifacts**: Executable FastAPI service, route handlers, DB schema.

### 3. Frontend Agent
- **Role**: Client UI/UX Engineer.
- **Responsibilities**:
  - Build responsive React (TypeScript + Vite + Tailwind CSS) client.
  - Implement Feedback Board, Upvote interaction, Roadmap Kanban view, and real-time AI Duplicate detection preview.
  - Integrate client-side trace propagation (injecting W3C `traceparent` headers into outgoing fetch requests).
- **Handoff Artifacts**: Tested React web application in `frontend/`.

### 4. Observability & Telemetry Agent
- **Role**: Reliability & Telemetry Specialist.
- **Responsibilities**:
  - Configure OpenTelemetry SDK with W3C trace context propagation.
  - Expose Prometheus `/metrics` covering RED (Rate, Errors, Duration) and business KPIs (`upvotes_total`, `posts_total`).
  - Implement structured JSON logging correlated by `trace_id` and strict PII redactor.
- **Handoff Artifacts**: `backend/app/telemetry/` modules and dashboard.

### 5. QA & Verification Agent
- **Role**: Quality Assurance & Test Engineer.
- **Responsibilities**:
  - Author unit tests for business logic, AI deduplication, and PII sanitizer.
  - Author integration tests for API endpoints using FastAPI `TestClient` and SQLite test DB.
  - Ensure 100% test pass rate with a single command execution (`pytest`).
- **Handoff Artifacts**: `backend/tests/` test suite and pytest runner config.

### 6. DevOps & Release Agent
- **Role**: Infrastructure & CI/CD Engineer.
- **Responsibilities**:
  - Create production-ready `Dockerfile`s for frontend and backend.
  - Configure `docker-compose.yml` for single-command full-stack orchestration.
  - Author GitHub Actions pipeline (`.github/workflows/ci.yml`) enforcing automated tests, docker builds, and continuous deployment.
- **Handoff Artifacts**: `docker-compose.yml`, Dockerfiles, CI/CD workflows.

### 7. Autonomous On-Call Responder Agent
- **Role**: Production Incident Responder & Site Reliability Agent.
- **Responsibilities**:
  - Listen for alert payloads at `/api/alerts/webhook`.
  - Ingest alert symptoms, query correlated trace IDs, diagnose root causes (e.g. voting floods, rate limit saturation).
  - Execute automated remediation (toggle emergency throttling, purge memory pool, reset circuit breaker).
  - Draft automated Incident Postmortem report in markdown format.
- **Handoff Artifacts**: `backend/app/agent/oncall.py` and runbook documentation.

---

## 3. Collaboration Process & Handoff Protocols

1. **Specification Before Implementation**: No code is generated before the Architecture Agent records acceptance criteria in `docs/tasks.md`.
2. **Contract-First Development**: Backend and Frontend agents agree on Pydantic/TypeScript interfaces before implementation.
3. **Trace Propagation Contract**: Frontend must inject `traceparent` headers into every API call; Backend extracts and attaches the `trace_id` to database operations and logs.
4. **Quality Gate Escalation**: If tests fail in QA Agent's gate, work is returned to Backend or Frontend agent with explicit pytest traceback logs.
5. **Continuous Context Sync**: All agents reference `AGENTS.md` at root to maintain uniform context across sessions.
