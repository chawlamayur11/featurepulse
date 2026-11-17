#!/usr/bin/env bash
# Creates GitHub Issues from docs/tasks.md using GitHub CLI (gh)
set -e

if ! command -v gh &> /dev/null; then
    echo "GitHub CLI (gh) is not installed. Please create issues manually or install gh."
    exit 1
fi

echo "Creating GitHub issues for FeaturePulse task tracker..."

gh issue create --title "[TASK-01] Architecture design, data schemas, API contracts" \
  --body "Defined in docs/tasks.md. Owner: Architecture Agent. Acceptance Criteria: AC-1 to AC-6." \
  --label "architecture,done"

gh issue create --title "[TASK-02] Context management & AGENTS.md modular links" \
  --body "Root AGENTS.md pointing to modular documentation in docs/. Owner: Context Agent." \
  --label "documentation,done"

gh issue create --title "[TASK-03] Backend core: FastAPI app, SQLAlchemy models, SQLite/PG" \
  --body "FastAPI REST API with SQLite and PostgreSQL support. Owner: Backend Agent. Acceptance Criteria: AC-1.1, AC-1.2, AC-2.1." \
  --label "backend,done"

gh issue create --title "[TASK-04] AI Deduplication & Smart Tagging engine" \
  --body "Semantic NLP similarity checking for duplicate feature requests. Owner: Backend Agent. Acceptance Criteria: AC-3.1, AC-3.2, AC-3.3." \
  --label "ai,done"

gh issue create --title "[TASK-05] OpenTelemetry, Prometheus metrics & structured JSON logs" \
  --body "W3C traceparent context propagation and /metrics exporter. Owner: Observability Agent. Acceptance Criteria: AC-5.1, AC-5.2, AC-5.3." \
  --label "observability,done"

gh issue create --title "[TASK-06] Alert trigger & Autonomous On-Call Responder Agent" \
  --body "Automated healing and incident postmortem generation on user impact. Owner: Ops/OnCall Agent. Acceptance Criteria: AC-6.1, AC-6.2, AC-6.3." \
  --label "sre,done"

gh issue create --title "[TASK-07] Frontend: React + Vite + Tailwind UI (Board, Roadmap, AI)" \
  --body "Responsive modern feedback boards and Kanban roadmap. Owner: Frontend Agent. Acceptance Criteria: AC-1.1, AC-2.3, AC-3.3, AC-4.1." \
  --label "frontend,done"

gh issue create --title "[TASK-08] Unit & Integration Test Suite (pytest, TestClient)" \
  --body "Full test suite runnable with single command. Owner: QA Agent. Status: 20/20 passing." \
  --label "testing,done"

gh issue create --title "[TASK-09] Docker Compose & single-command local run orchestration" \
  --body "docker compose up --build starts frontend, backend, DB, and prometheus. Owner: DevOps Agent." \
  --label "devops,done"

gh issue create --title "[TASK-10] CI/CD pipeline (GitHub Actions) with test & deploy gates" \
  --body "Automated CI testing on PRs and CD deployment workflow. Owner: DevOps Agent." \
  --label "ci-cd,done"

echo "All GitHub issues created successfully!"
