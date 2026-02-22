export interface Endpoint {
  id: string;
  name: string;
  url: string;
  headers_json: Record<string, string>;
  timeout_seconds: number;
  status: "ACTIVE" | "PAUSED";
  paused_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Attempt {
  id: string;
  attempt_number: number;
  started_at: string;
  ended_at: string | null;
  latency_ms: number | null;
  outcome: "SUCCESS" | "RETRYABLE_FAILURE" | "NON_RETRYABLE_FAILURE" | null;
  classification:
    | "NETWORK_ERROR"
    | "DNS_ERROR"
    | "TLS_ERROR"
    | "TIMEOUT"
    | "HTTP_4XX_PERMANENT"
    | "HTTP_5XX_RETRYABLE"
    | "RATE_LIMITED"
    | "WORKER_CRASH_OR_UNKNOWN"
    | "OTHER"
    | null;
  http_status: number | null;
  response_headers_json: Record<string, string> | null;
  response_body_snippet: string | null;
  error_detail: string | null;
  created_at: string;
}

export interface Delivery {
  id: string;
  event_id: string;
  endpoint_id: string;
  endpoint_name: string;
  event_type: string;
  mode: "RELIABLE" | "BASIC";
  status: "PENDING" | "SCHEDULED" | "IN_PROGRESS" | "DELIVERED" | "FAILED" | "EXPIRED" | "CANCELLED";
  attempts_count: number;
  next_attempt_at: string | null;
  first_scheduled_at: string | null;
  last_attempt_at: string | null;
  terminal_at: string | null;
  terminal_reason: string | null;
  cancel_requested: boolean;
  created_at: string;
  updated_at: string;
}

export interface DeliveryDetail extends Delivery {
  attempts: Attempt[];
}

export interface Event {
  id: string;
  type: string;
  payload: Record<string, unknown>;
  created_at: string;
}

export interface PaginatedResponse<T> {
  results: T[];
  has_more: boolean;
  next_cursor: string | null;
}

export interface DeliveryBatch {
  id: string;
  type: string;
  dry_run: boolean;
  requested_at: string;
  created_deliveries_count: number;
  status: "CREATED" | "COMPLETED";
}
