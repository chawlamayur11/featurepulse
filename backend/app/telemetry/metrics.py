from prometheus_client import Counter, Histogram, generate_latest, CONTENT_TYPE_LATEST

# Prometheus Metrics Definitions
HTTP_REQUESTS_TOTAL = Counter(
    "http_requests_total",
    "Total HTTP requests received",
    ["method", "endpoint", "status"]
)

HTTP_REQUEST_DURATION_SECONDS = Histogram(
    "http_request_duration_seconds",
    "HTTP request latency in seconds",
    ["method", "endpoint"],
    buckets=[0.01, 0.05, 0.1, 0.25, 0.5, 1.0, 2.5, 5.0]
)

FEEDBACK_POSTS_TOTAL = Counter(
    "feedback_posts_total",
    "Total feedback posts created",
    ["category", "status"]
)

UPVOTES_TOTAL = Counter(
    "upvotes_total",
    "Total feedback upvote and unvote actions",
    ["action"]  # 'added', 'removed'
)

AI_DEDUP_QUERIES_TOTAL = Counter(
    "ai_dedup_queries_total",
    "Total AI semantic duplicate queries run",
    ["has_match"]  # 'true', 'false'
)

ALERTS_TRIGGERED_TOTAL = Counter(
    "alerts_triggered_total",
    "Total monitoring alerts triggered",
    ["alert_name", "severity"]
)

def get_metrics_snapshot() -> dict:
    """Returns a structured summary of core metrics for the in-app Telemetry dashboard."""
    # We maintain quick cumulative counters for the dashboard
    return {
        "metrics_status": "healthy",
        "prometheus_scrape_endpoint": "/metrics"
    }
