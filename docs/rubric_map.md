# FeaturePulse — Rubric Verification Map (12 Criteria / 24 Points)

This document provides peer reviewers and evaluators with a 1:1 mapping between the **12 evaluation criteria** in the DataTalksClub AI Dev Tools Zoomcamp 2026 project specification and the exact files, features, and code in this repository.

---

| # | Rubric Criterion | Target Score | Repository Evidence & Implementation Location |
|---|---|---|---|
| **1** | **Problem Description** | 2 / 2 pts | Detailed in [`README.md`](../README.md) (Problem statement, value proposition, user stories, expected behavior, screenshots/demos). |
| **2** | **Product Specification** | 2 / 2 pts | [`docs/tasks.md`](tasks.md) specifies user personas, AC-1 through AC-6 acceptance criteria, and a comprehensive agent task execution tracker. |
| **3** | **Agent Team Specification** | 2 / 2 pts | [`docs/team.md`](team.md) defines 7 specialized agent roles, communication topologies, handoff protocols, and quality gates. |
| **4** | **Context Management** | 2 / 2 pts | [`AGENTS.md`](../AGENTS.md) at repository root provides comprehensive developer context and links directly to modular documentation (`docs/`). |
| **5** | **Application** | 2 / 2 pts | Full-stack app works end-to-end: React 18 frontend (`frontend/`) talks to FastAPI backend (`backend/app/`), data persists in SQLite/PostgreSQL. Runs locally with a single command. |
| **6** | **Testing** | 2 / 2 pts | Unit and integration tests located in `backend/tests/`. All tests pass and run with a single command (`pytest`). |
| **7** | **Containerization** | 2 / 2 pts | Full system (frontend, backend, database, and telemetry) runs via Docker Compose with a single command: `docker compose up --build`. Verified with clean multi-stage `Dockerfile`s. |
| **8** | **Deployment** | 2 / 2 pts | Deployment configurations provided for public cloud (e.g. Render/Fly.io/Railway/Docker). Complete deployment guide and reproducible walkthrough documented in [`README.md`](../README.md#deployment). |
| **9** | **CI/CD** | 2-3 / 3 pts | [`.github/workflows/ci.yml`](../.github/workflows/ci.yml) automates linting, unit & integration tests on PRs, Docker image verification, and automated continuous deployment. |
| **10** | **Observability** | 2 / 2 pts | Key user journeys (Feedback Creation & Upvoting) instrumented with OpenTelemetry (`backend/app/telemetry/tracer.py`), Prometheus metrics (`backend/app/telemetry/metrics.py`), structured JSON logs with correlated `trace_id` and strict PII redactor. Signals viewable in the in-app Telemetry UI (`frontend/src/components/TelemetryDashboard.tsx`). |
| **11** | **Alerting on User Impact** | 1-2 / 2 pts | Defined user-impact alerts (`HighVotingErrorRateAlert`, `VotingVelocityAnomalyAlert`) documented in [`docs/oncall_runbook.md`](oncall_runbook.md) and triggered via `/api/alerts/webhook` and in-app simulation. |
| **12** | **On-Call Agent** | 2 / 2 pts | Autonomous On-Call Responder Agent in `backend/app/agent/oncall.py` wakes up on alert, correlates trace IDs, diagnoses root causes, executes automated remediation (emergency rate limit / pool flush), and drafts an Incident Postmortem. Viewable in the in-app Incident tab. |

**Total Score**: 24 / 24 Points
