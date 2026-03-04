from prometheus_client import Counter, Histogram, Gauge

deliveries_created_total = Counter(
    "deliveries_created_total",
    "Total number of deliveries created",
    ["tenant_id", "mode"],
)

attempts_executed_total = Counter(
    "attempts_executed_total",
    "Total number of delivery attempts executed",
    ["outcome", "classification"],
)

delivery_latency_seconds = Histogram(
    "delivery_latency_seconds",
    "Time from delivery creation to terminal state",
    buckets=[1, 5, 10, 30, 60, 300, 600, 1800, 3600, 7200, 86400],
)

attempt_latency_seconds = Histogram(
    "attempt_latency_seconds",
    "HTTP request latency per attempt",
    buckets=[0.1, 0.25, 0.5, 1, 2.5, 5, 10],
)

backlog_size = Gauge(
    "backlog_size",
    "Number of deliveries waiting to be processed",
    ["status"],
    multiprocess_mode="liveall",
)

endpoint_success_rate = Gauge(
    "endpoint_success_rate",
    "Success rate per endpoint",
    ["endpoint_id", "endpoint_name"],
    multiprocess_mode="liveall",
)
