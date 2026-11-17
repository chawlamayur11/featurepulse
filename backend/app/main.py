import os
import time
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from app.config import settings
from app.database import init_db, SessionLocal
from app.models import Post, Vote
from app.routes import posts, votes, comments, ai, alerts, telemetry
from app.telemetry.tracer import parse_traceparent, generate_span_id, TraceSpan
from app.telemetry.logger import current_trace_id, current_span_id, logger
from app.telemetry.metrics import HTTP_REQUESTS_TOTAL, HTTP_REQUEST_DURATION_SECONDS

def seed_sample_data():
    db = SessionLocal()
    try:
        if db.query(Post).count() == 0:
            sample_posts = [
                Post(
                    title="Add Dark Mode Theme Support",
                    description="Support system-preference dark mode and a manual toggle for night-time work.",
                    category="UI/UX",
                    status="completed",
                    vote_count=42,
                    author_id="user_sarah"
                ),
                Post(
                    title="Slack and Discord Webhook Notifications",
                    description="Notify our team channel whenever a new high-priority feature request is posted.",
                    category="Integrations",
                    status="in_progress",
                    vote_count=35,
                    author_id="user_alex"
                ),
                Post(
                    title="CSV and JSON Export for Roadmaps",
                    description="Allow product managers to export the current board and vote counts into CSV for reporting.",
                    category="Core Feature",
                    status="planned",
                    vote_count=28,
                    author_id="user_michael"
                ),
                Post(
                    title="Two-Factor Authentication (2FA / MFA)",
                    description="Add support for TOTP authenticator apps to enhance account security.",
                    category="Security",
                    status="under_review",
                    vote_count=19,
                    author_id="user_elena"
                ),
                Post(
                    title="Optimized Mobile Responsive View",
                    description="Improve the touch target sizing and swipe navigation on mobile web views.",
                    category="UI/UX",
                    status="open",
                    vote_count=14,
                    author_id="user_david"
                ),
                Post(
                    title="Fix Slow Search Autocomplete Query",
                    description="Search query takes over 1 second when typing long keywords into the board search bar.",
                    category="Performance",
                    status="open",
                    vote_count=9,
                    author_id="user_clara"
                )
            ]
            db.add_all(sample_posts)
            db.commit()
            logger.info("Successfully seeded initial sample posts for FeaturePulse.")
    finally:
        db.close()

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: initialize database tables and seed sample data
    init_db()
    seed_sample_data()
    logger.info("FeaturePulse backend started successfully.")
    yield
    # Shutdown
    logger.info("FeaturePulse backend shutting down.")

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    lifespan=lifespan
)

# Enable CORS for frontend clients
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["X-Trace-Id"]
)

# Correlation & Telemetry Tracing Middleware
@app.middleware("http")
async def telemetry_middleware(request: Request, call_next):
    traceparent = request.headers.get("traceparent")
    trace_id, parent_span_id = parse_traceparent(traceparent)
    span_id = generate_span_id()

    token_trace = current_trace_id.set(trace_id)
    token_span = current_span_id.set(span_id)

    span = TraceSpan(
        name=f"http.{request.method.lower()} {request.url.path}",
        trace_id=trace_id,
        span_id=span_id,
        parent_id=parent_span_id
    )
    span.set_attribute("http.method", request.method)
    span.set_attribute("http.url", str(request.url.path))

    start_time = time.time()
    status_code = 500

    try:
        response = await call_next(request)
        status_code = response.status_code
        response.headers["X-Trace-Id"] = trace_id
        return response
    except Exception as exc:
        span.set_attribute("error", str(exc))
        logger.error(f"Unhandled exception during request: {exc}", extra_fields={"error": str(exc), "trace_id": trace_id})
        raise exc
    finally:
        duration = time.time() - start_time
        span_status = "ERROR" if status_code >= 400 else "OK"
        span.set_attribute("http.status_code", status_code)
        span.finish(status=span_status)

        # Prometheus metrics recording
        # Avoid exploding metrics cardinality on dynamic path parameters
        endpoint = request.url.path
        if endpoint.startswith("/api/posts/") and endpoint.split("/")[-1].isdigit():
            endpoint = "/api/posts/{id}"
        
        HTTP_REQUESTS_TOTAL.labels(method=request.method, endpoint=endpoint, status=str(status_code)).inc()
        HTTP_REQUEST_DURATION_SECONDS.labels(method=request.method, endpoint=endpoint).observe(duration)

        current_trace_id.reset(token_trace)
        current_span_id.reset(token_span)

# Healthcheck
@app.get("/health")
def healthcheck():
    return {"status": "healthy", "service": "featurepulse-backend", "version": settings.VERSION}

# Include Routers
app.include_router(posts.router)
app.include_router(votes.router)
app.include_router(comments.router)
app.include_router(ai.router)
app.include_router(alerts.router)
app.include_router(telemetry.router)

# Serve Frontend Static Assets if available (Production / Single-Container Render Deployment)
dist_candidates = [
    os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "frontend", "dist")),
    os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "frontend", "dist")),
    os.path.abspath(os.path.join(os.path.dirname(__file__), "dist")),
]
frontend_dist = next((p for p in dist_candidates if os.path.exists(p)), None)

if frontend_dist:
    app.mount("/", StaticFiles(directory=frontend_dist, html=True), name="frontend")
