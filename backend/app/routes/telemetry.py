from typing import Optional
from fastapi import APIRouter, Response, Query
from app.telemetry.tracer import trace_recorder
from app.telemetry.logger import log_buffer
from app.telemetry.metrics import generate_latest, CONTENT_TYPE_LATEST

router = APIRouter(tags=["telemetry"])

@router.get("/metrics")
def prometheus_metrics():
    """Exposes standard Prometheus scrape metrics."""
    return Response(content=generate_latest(), media_type=CONTENT_TYPE_LATEST)

@router.get("/api/telemetry/traces")
def get_recent_traces(limit: int = 50, trace_id: Optional[str] = None):
    """Returns recent recorded spans for in-app telemetry UI."""
    if trace_id:
        return trace_recorder.find_by_trace_id(trace_id)
    return trace_recorder.get_recent_spans(limit=limit)

@router.get("/api/telemetry/logs")
def get_recent_logs(limit: int = 50, trace_id: Optional[str] = None):
    """Returns recent structured JSON logs with optional trace_id filtering."""
    if trace_id:
        return log_buffer.filter_by_trace(trace_id)
    return log_buffer.get_recent(limit=limit)

@router.get("/api/telemetry/stats")
def get_telemetry_stats():
    """Returns high level telemetry summary for UI dashboard."""
    recent_spans = trace_recorder.get_recent_spans(limit=100)
    total_spans = len(recent_spans)
    error_spans = len([s for s in recent_spans if s.get("status") == "ERROR"])
    error_rate = round((error_spans / total_spans * 100), 1) if total_spans > 0 else 0.0

    avg_duration = 0.0
    if total_spans > 0:
        avg_duration = round(sum(s.get("duration_ms", 0) for s in recent_spans) / total_spans, 1)

    return {
        "total_requests_recorded": total_spans,
        "error_count": error_spans,
        "error_rate_pct": error_rate,
        "avg_duration_ms": avg_duration,
        "recent_logs_count": len(log_buffer.get_recent(limit=100))
    }
