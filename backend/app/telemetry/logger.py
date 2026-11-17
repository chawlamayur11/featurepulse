import json
import logging
import re
import sys
import time
from collections import deque
from contextvars import ContextVar
from typing import Any, Dict, Optional

# Context variables for request-bound tracing
current_trace_id: ContextVar[Optional[str]] = ContextVar("current_trace_id", default=None)
current_span_id: ContextVar[Optional[str]] = ContextVar("current_span_id", default=None)

EMAIL_REGEX = re.compile(r"[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+")
PHONE_REGEX = re.compile(r"(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}")
BEARER_REGEX = re.compile(r"(Bearer\s+)[A-Za-z0-9\-_.]+", re.IGNORECASE)
API_KEY_REGEX = re.compile(r"(api[_-]?key|secret|token)[\s:=]+([\'\"]?[\w\-]{12,}[\'\"]?)", re.IGNORECASE)

class PIISanitizer:
    @staticmethod
    def sanitize_text(text: str) -> str:
        if not isinstance(text, str):
            return text
        text = EMAIL_REGEX.sub("[REDACTED_EMAIL]", text)
        text = PHONE_REGEX.sub("[REDACTED_PHONE]", text)
        text = BEARER_REGEX.sub(r"\1[REDACTED_TOKEN]", text)
        text = API_KEY_REGEX.sub(r"\1=[REDACTED_SECRET]", text)
        return text

    @classmethod
    def sanitize_dict(cls, data: Dict[str, Any]) -> Dict[str, Any]:
        sanitized = {}
        sensitive_terms = ("password", "secret", "authorization", "token", "cookie", "api_key", "key")
        for k, v in data.items():
            k_lower = str(k).lower()
            if any(term in k_lower for term in sensitive_terms):
                sanitized[k] = "[REDACTED]"
            elif isinstance(v, str):
                sanitized[k] = cls.sanitize_text(v)
            elif isinstance(v, dict):
                sanitized[k] = cls.sanitize_dict(v)
            elif isinstance(v, list):
                sanitized[k] = [cls.sanitize_text(x) if isinstance(x, str) else x for x in v]
            else:
                sanitized[k] = v
        return sanitized

class LogBuffer:
    """In-memory rolling buffer of recent structured logs for UI & on-call triage."""
    def __init__(self, max_size: int = 200):
        self._buffer: deque = deque(maxlen=max_size)

    def append(self, log_entry: dict):
        self._buffer.append(log_entry)

    def get_recent(self, limit: int = 50) -> list[dict]:
        return list(self._buffer)[-limit:][::-1]

    def filter_by_trace(self, trace_id: str) -> list[dict]:
        return [entry for entry in self._buffer if entry.get("trace_id") == trace_id]

    def get_recent_errors(self, limit: int = 20) -> list[dict]:
        return [entry for entry in self._buffer if entry.get("level") in ("ERROR", "CRITICAL")][-limit:][::-1]

log_buffer = LogBuffer()

class JSONFormatter(logging.Formatter):
    def format(self, record: logging.LogRecord) -> str:
        trace_id = current_trace_id.get()
        span_id = current_span_id.get()

        log_data = {
            "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime(record.created)),
            "level": record.levelname,
            "logger": record.name,
            "message": PIISanitizer.sanitize_text(record.getMessage()),
            "trace_id": trace_id or "00000000000000000000000000000000",
            "span_id": span_id or "0000000000000000",
        }

        # Include custom extra fields if provided
        if hasattr(record, "extra_fields") and isinstance(record.extra_fields, dict):
            sanitized_extras = PIISanitizer.sanitize_dict(record.extra_fields)
            log_data.update(sanitized_extras)

        log_buffer.append(log_data)
        return json.dumps(log_data)

class StructuredLogger:
    """Wrapper around standard logger to support extra_fields kwarg easily."""
    def __init__(self, name: str = "featurepulse"):
        self._logger = logging.getLogger(name)
        if not self._logger.handlers:
            self._logger.setLevel(logging.INFO)
            handler = logging.StreamHandler(sys.stdout)
            handler.setFormatter(JSONFormatter())
            self._logger.addHandler(handler)
            self._logger.propagate = False

    def _log(self, level: int, msg: str, extra_fields: Optional[Dict[str, Any]] = None):
        extra = {"extra_fields": extra_fields or {}}
        self._logger.log(level, msg, extra=extra)

    def debug(self, msg: str, extra_fields: Optional[Dict[str, Any]] = None):
        self._log(logging.DEBUG, msg, extra_fields)

    def info(self, msg: str, extra_fields: Optional[Dict[str, Any]] = None):
        self._log(logging.INFO, msg, extra_fields)

    def warning(self, msg: str, extra_fields: Optional[Dict[str, Any]] = None):
        self._log(logging.WARNING, msg, extra_fields)

    def error(self, msg: str, extra_fields: Optional[Dict[str, Any]] = None):
        self._log(logging.ERROR, msg, extra_fields)

    def critical(self, msg: str, extra_fields: Optional[Dict[str, Any]] = None):
        self._log(logging.CRITICAL, msg, extra_fields)

logger = StructuredLogger("featurepulse")
