# AGENTS.md — Agent System Context & Guidelines

Welcome to **FeaturePulse**! This file serves as the primary system context, development charter, and architectural compass for all AI agents and human contributors collaborating on this codebase.

---

## 1. Project Mission & High-Level Scope

FeaturePulse is an open-source, AI-powered customer feedback intelligence and product roadmap platform (inspired by Canny.io and Fider). It enables product teams to gather feedback, upvote features, maintain a public Kanban roadmap, detect duplicate requests via semantic AI, and operate with production-grade OpenTelemetry observability and self-healing incident response.

---

## 2. Modular Documentation Links

To maintain clear separation of concerns, comprehensive documentation is organized into modular specifications. Agents **must** consult these specialized docs:

- **[Product Specifications & Task Tracker](docs/tasks.md)**: User personas, acceptance criteria (AC-1 to AC-6), and task tracker execution log.
- **[Agent Team Specification](docs/team.md)**: Agent roles (Architecture, Backend, Frontend, QA, DevOps, Observability, On-Call), handoff protocols, and collaboration workflows.
- **[System Architecture & Design](docs/architecture.md)**: System topology, sequence diagrams, database schemas, and PII protection policy.
- **[Observability & Telemetry](docs/observability.md)**: OpenTelemetry tracing, Prometheus `/metrics`, structured JSON logging with `trace_id`, and PII sanitization.
- **[Alerting & On-Call Runbook](docs/oncall_runbook.md)**: Real user impact alert definitions, webhook triggers, autonomous on-call agent remediation, and postmortem generation.
- **[Rubric Verification Map](docs/rubric_map.md)**: Direct mapping between the 12 course criteria and concrete implementation files.

---

## 3. Technology Stack & Directory Conventions

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, Lucide icons (`frontend/`)
- **Backend API**: Python 3.11+, FastAPI, Pydantic v2, SQLAlchemy ORM (`backend/app/`)
- **Database**: SQLite (default local zero-setup) and PostgreSQL (production / Docker Compose)
- **Telemetry**: OpenTelemetry Python SDK, Prometheus Client, Structured JSON Logging
- **Testing**: Pytest, FastAPI `TestClient`, Vitest (`backend/tests/`)
- **Infrastructure**: Docker, Docker Compose, GitHub Actions (`.github/workflows/ci.yml`)

---

## 4. Development & Coding Principles for Agents

1. **Contract-First & Pydantic Validation**: All API inputs and outputs must have strict Pydantic schemas with type hints.
2. **Trace Correlation Everywhere**: Every incoming HTTP request must extract or generate a W3C `traceparent` / `trace_id`, propagate it to database queries, and tag structured log entries with it.
3. **No PII or Secrets in Logs/Traces**: Never log plain text emails, passwords, tokens, or personal identifiers. Always run payloads through the PII sanitizer.
4. **Single Command Run & Test**:
   - Single command to start the entire system: `docker compose up --build` or `./scripts/run.sh` / `./scripts/run.ps1`.
   - Single command to execute all tests: `pytest` in `backend/` or `npm test` in `frontend/`.
5. **Deterministic Business Logic**: AI capabilities (semantic duplicate detection, category tagging) must have robust fallback heuristics so the application functions seamlessly even without external LLM API keys.
6. **Task Tracker Updating**: When completing a task or milestone, update `docs/tasks.md` with the corresponding status and validation notes.
