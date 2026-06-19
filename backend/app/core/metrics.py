from prometheus_client import Counter, Histogram, Gauge

REQUEST_COUNT = Counter(
    "request_count", "Total HTTP requests", ["method", "endpoint", "status_code"]
)

REQUEST_DURATION = Histogram(
    "request_duration_seconds",
    "HTTP request duration in seconds",
    ["method", "endpoint"],
)

REQUEST_ERRORS = Counter(
    "request_errors", "Total HTTP request errors", ["method", "endpoint"]
)

ACTIVE_REQUESTS = Gauge("active_requests", "Currently active HTTP requests")

DATABASE_POOL_USAGE = Gauge("database_pool_usage", "Database connection pool usage")

REDIS_STATUS = Gauge(
    "redis_status", "Redis connection status (1 for healthy, 0 for unhealthy)"
)

OUTBOX_QUEUE_SIZE = Gauge("outbox_queue_size", "Number of pending outbox events")

OUTBOX_FAILED_EVENTS = Gauge("outbox_failed_events", "Number of failed outbox events")

AUDIT_LOG_EVENTS = Counter("audit_log_events", "Total audit log events recorded")

ADMIN_ACTIONS = Counter(
    "admin_actions", "Total admin actions performed", ["action_type"]
)
