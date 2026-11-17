import uuid
import time
from collections import deque
from typing import Optional, Dict, Any

class TraceSpan:
    def __init__(self, name: str, trace_id: str, span_id: str, parent_id: Optional[str] = None):
        self.name = name
        self.trace_id = trace_id
        self.span_id = span_id
        self.parent_id = parent_id
        self.start_time = time.time()
        self.end_time: Optional[float] = None
        self.duration_ms: float = 0.0
        self.attributes: Dict[str, Any] = {}
        self.status: str = "OK"

    def set_attribute(self, key: str, value: Any):
        # Ensure no sensitive attributes are recorded
        if "secret" in key.lower() or "password" in key.lower() or "token" in key.lower():
            self.attributes[key] = "[REDACTED]"
        else:
            self.attributes[key] = value

    def finish(self, status: str = "OK"):
        self.status = status
        self.end_time = time.time()
        self.duration_ms = round((self.end_time - self.start_time) * 1000, 2)
        trace_recorder.record(self)

class TraceRecorder:
    """In-memory rolling buffer of recent traces for in-app UI & on-call agent inspection."""
    def __init__(self, max_size: int = 150):
        self._buffer: deque = deque(maxlen=max_size)

    def record(self, span: TraceSpan):
        self._buffer.append({
            "name": span.name,
            "trace_id": span.trace_id,
            "span_id": span.span_id,
            "parent_id": span.parent_id,
            "duration_ms": span.duration_ms,
            "status": span.status,
            "timestamp": time.strftime("%Y-%m-%d %H:%M:%S", time.gmtime(span.start_time)),
            "attributes": span.attributes,
        })

    def get_recent_spans(self, limit: int = 50) -> list[dict]:
        return list(self._buffer)[-limit:][::-1]

    def find_by_trace_id(self, trace_id: str) -> list[dict]:
        return [s for s in self._buffer if s.get("trace_id") == trace_id]

trace_recorder = TraceRecorder()

def generate_trace_id() -> str:
    """Generate 32-hex W3C compliant trace ID."""
    return uuid.uuid4().hex

def generate_span_id() -> str:
    """Generate 16-hex W3C compliant span ID."""
    return uuid.uuid4().hex[:16]

def parse_traceparent(traceparent: Optional[str]) -> tuple[str, Optional[str]]:
    """
    Parse W3C traceparent header: '00-{trace_id}-{parent_id}-{flags}'
    """
    if not traceparent:
        return generate_trace_id(), None
    parts = traceparent.split("-")
    if len(parts) >= 4 and len(parts[1]) == 32:
        return parts[1], parts[2]
    return generate_trace_id(), None
