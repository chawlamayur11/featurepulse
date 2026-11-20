# FeaturePulse — Customer Feedback Intelligence & SRE Self-Healing Platform

[![CI/CD Pipeline](https://github.com/chawlamayur11/featurepulse/actions/workflows/ci.yml/badge.svg)](https://github.com/chawlamayur11/featurepulse/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![OpenTelemetry](https://img.shields.io/badge/telemetry-OpenTelemetry-blueviolet)](docs/observability.md)
[![Live Demo](https://img.shields.io/badge/Live%20Demo-Render-emerald?style=flat&logo=render)](https://featurepulse-ro2p.onrender.com)
[![FastAPI](https://img.shields.io/badge/backend-FastAPI-009688)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/frontend-React%2018%20(Vite)-61DAFB)](https://react.dev)
[![Docker](https://img.shields.io/badge/docker-ready-2496ED)](docker-compose.yml)

> **AI Dev Tools Zoomcamp 2026 — Final Project Submission**  
> *A full-stack, AI-assisted feedback intelligence and roadmap platform with end-to-end OpenTelemetry correlation, real user impact alerting, and an autonomous on-call responder agent.*

---

### 🌐 Quick Links & Live Demo
- **Live Deployed Web Application**: [https://featurepulse-ro2p.onrender.com](https://featurepulse-ro2p.onrender.com)
- **Interactive API Swagger Docs**: [https://featurepulse-ro2p.onrender.com/docs](https://featurepulse-ro2p.onrender.com/docs)
- **Prometheus Telemetry Scrape Endpoint**: [https://featurepulse-ro2p.onrender.com/metrics](https://featurepulse-ro2p.onrender.com/metrics)
- **Service Health Check**: [https://featurepulse-ro2p.onrender.com/health](https://featurepulse-ro2p.onrender.com/health)
- **GitHub Repository**: [https://github.com/chawlamayur11/featurepulse](https://github.com/chawlamayur11/featurepulse)
- **12-Criteria Rubric Verification Map**: [docs/rubric_map.md](docs/rubric_map.md)

---

## 1. Problem Description & System Functionality

### The Problem
Modern product teams struggle with fragmented customer feedback across Discord, Slack, email, and support tickets:
1. **Duplicate Request Waste**: Users submit identical feature requests repeatedly because existing feedback boards don't detect semantic similarity during input.
2. **Roadmap Blindspots**: Users feel disconnected when their requests enter a "black box" without status updates (`Planned`, `In Progress`, `Completed`).
3. **Telemetry & Reliability Disconnect**: Traditional monitoring alerts on raw CPU or memory graphs instead of real user impact (failed votes, broken submissions). When an outage strikes, teams scramble manually rather than using autonomous agents to triage and self-heal.

### The Solution: FeaturePulse
**FeaturePulse** is an open-source feedback intelligence platform (inspired by Canny.io, Fider, and LogChimp):
- **Interactive Feedback Board**: Users submit feature requests, upvote existing ideas with atomic counters, and engage in threaded discussions.
- **Real-Time AI Duplicate Detection**: As a user types their feature title, an embedded NLP semantic engine checks existing requests in real time to prevent duplicates and suggests relevant category tags (`UI/UX`, `Integrations`, `Core Feature`, `Security`, `Performance`, `Bug`).
- **Public Roadmap (Kanban)**: Live Kanban board visualizing development progress across `Planned` ➔ `In Progress` ➔ `Completed`.
- **End-to-End Correlated Telemetry**: Every interaction propagates a W3C `traceparent` trace ID across React, FastAPI, SQLAlchemy, and Prometheus `/metrics`, backed by structured JSON logging with strict PII sanitization.
- **Alerting & Autonomous On-Call Agent**: Alerts trigger on real user impact (e.g. error rate $> 5\%$ or spambot voting floods). An autonomous **On-Call Responder Agent** wakes up via webhook, analyzes the correlated traces, executes automated self-healing remediation (dynamic rate-limiting or connection flush), and generates a markdown incident postmortem.

---

## 2. Quickstart (Single-Command Run)

### Option A: Via Docker Compose (Recommended)
Clone the repository and run:
```bash
docker compose up --build
```
Once started, access:
- **Frontend Web UI**: [http://localhost:3000](http://localhost:3000)
- **Backend API Docs (Swagger)**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **Prometheus Metrics**: [http://localhost:8000/metrics](http://localhost:8000/metrics)
- **Prometheus Dashboard**: [http://localhost:9090](http://localhost:9090)

---

### Option B: Local Development (Without Docker)
FeaturePulse defaults to SQLite locally with zero configuration required!

#### 1. Start Backend:
```bash
cd backend
pip install -r requirements.txt
python -m uvicorn app.main:app --reload --port 8000
```

#### 2. Start Frontend:
```bash
cd frontend
npm install
npm run dev
```
Open [http://localhost:5173](http://localhost:5173).

---

## 3. Running Tests (Single Command)

Execute the full backend unit and integration test suite:
```bash
python -m pytest backend/tests
```
**Output**:
```
======================== 20 passed, 1 warning in 0.36s ========================
```
- `backend/tests/test_unit_models.py`: Database models, cascading deletes, unique constraints.
- `backend/tests/test_unit_ai.py`: Semantic text similarity and category classifier.
- `backend/tests/test_unit_pii_sanitizer.py`: Automatic scrubbing of email, phone, and API keys.
- `backend/tests/test_integration_posts.py`: Post CRUD, filtering, PII redaction.
- `backend/tests/test_integration_votes.py`: Atomic upvoting, unvoting, and trace context propagation.
- `backend/tests/test_integration_oncall_agent.py`: Alert webhook, trace triage, on-call agent healing.

---

## 4. Deployment Guide

FeaturePulse is ready for containerized deployment to any cloud provider:

### Deploying to Render / Railway / Fly.io
1. **Database**: Provision a PostgreSQL instance.
2. **Backend Service**:
   - Environment: Docker
   - Root directory: `backend/`
   - Environment variables:
     - `DATABASE_URL`: `postgresql://<user>:<password>@<host>:5432/<dbname>`
     - `ENVIRONMENT`: `production`
3. **Frontend Service**:
   - Environment: Docker (Nginx) or Static Site (`dist/`)
   - Root directory: `frontend/`
   - Point `/api` proxy or `VITE_API_BASE_URL` to backend service URL.

---

## 5. Observability & Autonomous Self-Healing Demo

### Live Telemetry Inspector
Navigate to the **Telemetry & Traces** tab in the web UI:
- **Trace Propagation**: Every upvote and feedback submission sends a W3C `traceparent` header.
- **PII Redaction**: Email addresses (e.g. `user@example.com`) and secrets are automatically scrubbed into `[REDACTED_EMAIL]` before entering logs or database storage.
- **Correlated Logs**: Click any trace row to view all structured JSON logs sharing that exact `trace_id`.

### Live Incident Simulation & On-Call Agent
Navigate to the **Incidents & On-Call** tab:
1. Click **"Simulate High 5xx Error Rate"** or **"Simulate Vote Spambot Flood"**.
2. The alert triggers `/api/alerts/webhook`.
3. The **Autonomous On-Call Agent** (`app/agent/oncall.py`) wakes up immediately:
   - Diagnoses root cause from recent telemetry traces.
   - Executes remediation (dynamically activates emergency rate-limiting or flushes stale connection pools).
   - Generates an Incident Postmortem in markdown format, viewable directly in the UI.

---

## 6. Modular Documentation Index

- [`AGENTS.md`](AGENTS.md) — Root system context and guidelines
- [`docs/tasks.md`](docs/tasks.md) — Product specifications & agent task execution tracker
- [`docs/team.md`](docs/team.md) — Multi-agent team specifications & handoffs
- [`docs/architecture.md`](docs/architecture.md) — Architectural diagrams & sequence flows
- [`docs/observability.md`](docs/observability.md) — Metrics, distributed tracing & PII sanitization
- [`docs/oncall_runbook.md`](docs/oncall_runbook.md) — Alert definitions & on-call agent procedures
- [`docs/rubric_map.md`](docs/rubric_map.md) — Rubric point-by-point cross reference
