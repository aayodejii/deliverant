import { Endpoint } from "@/components/docs/Endpoint";
import { CodeBlock } from "@/components/docs/CodeBlock";
import { ParamTable } from "@/components/docs/ParamTable";

export default function DeliveriesDocs() {
  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Deliveries</h1>
        <p className="mt-3 text-lg text-text-secondary leading-relaxed">
          A delivery represents the lifecycle of sending a single event payload to a single endpoint. Deliveries are created automatically when you ingest an event.
        </p>
      </div>

      <Endpoint
        method="GET"
        path="/v1/deliveries"
        description="List deliveries with optional filters and cursor-based pagination."
      >
        <ParamTable
          title="Query parameters"
          params={[
            { name: "status", type: "string", required: false, description: "Filter by status (PENDING, SCHEDULED, IN_PROGRESS, DELIVERED, FAILED, EXPIRED, CANCELLED)" },
            { name: "endpoint_id", type: "string", required: false, description: "Filter by endpoint (e.g. ep_550e8400-...)" },
            { name: "event_id", type: "string", required: false, description: "Filter by event (e.g. evt_f47ac10b-...)" },
            { name: "search", type: "string", required: false, description: "Search by event type or endpoint name" },
            { name: "cursor", type: "string", required: false, description: "Pagination cursor (ISO datetime)" },
            { name: "limit", type: "integer", required: false, description: "Results per page (default 20, max 100)" },
          ]}
        />
        <CodeBlock title="200 Response">{`{
  "results": [
    {
      "id": "del_6ba7b810-9dad-11d1-80b4-00c04fd430c8",
      "event_id": "evt_f47ac10b-58cc-4372-a567-0e02b2c3d479",
      "endpoint_id": "ep_550e8400-e29b-41d4-a716-446655440000",
      "endpoint_name": "my-webhook",
      "event_type": "order.created",
      "mode": "RELIABLE",
      "status": "DELIVERED",
      "attempts_count": 2,
      "next_attempt_at": null,
      "first_scheduled_at": "2024-01-01T00:00:05Z",
      "last_attempt_at": "2024-01-01T00:00:35Z",
      "terminal_at": "2024-01-01T00:00:35Z",
      "terminal_reason": null,
      "cancel_requested": false,
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-01T00:00:35Z"
    }
  ],
  "has_more": true,
  "next_cursor": "2024-01-01T00:00:00Z"
}`}</CodeBlock>
      </Endpoint>

      <Endpoint
        method="GET"
        path="/v1/deliveries/{del_id}"
        description="Get a delivery with its full attempt history."
      >
        <CodeBlock title="200 Response">{`{
  "id": "del_6ba7b810-9dad-11d1-80b4-00c04fd430c8",
  "event_id": "evt_f47ac10b-58cc-4372-a567-0e02b2c3d479",
  "endpoint_id": "ep_550e8400-e29b-41d4-a716-446655440000",
  "status": "DELIVERED",
  "attempts_count": 2,
  "attempts": [
    {
      "id": "att_7c9e6679-7425-40de-944b-e07fc1f90ae7",
      "attempt_number": 1,
      "started_at": "2024-01-01T00:00:05Z",
      "ended_at": "2024-01-01T00:00:06Z",
      "latency_ms": 1200,
      "outcome": "RETRYABLE_FAILURE",
      "classification": "HTTP_5XX_RETRYABLE",
      "http_status": 503,
      "error_detail": null
    },
    {
      "id": "att_a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "attempt_number": 2,
      "started_at": "2024-01-01T00:00:35Z",
      "ended_at": "2024-01-01T00:00:35Z",
      "latency_ms": 148,
      "outcome": "SUCCESS",
      "classification": null,
      "http_status": 200,
      "error_detail": null
    }
  ],
  ...
}`}</CodeBlock>
      </Endpoint>

      <Endpoint
        method="POST"
        path="/v1/deliveries/{del_id}/cancel"
        description="Cancel a non-terminal delivery. Returns 409 if the delivery is already in a terminal state (DELIVERED, FAILED, EXPIRED, CANCELLED)."
      >
        <CodeBlock title="200 Response">{`{
  "status": "cancelled",
  "delivery_id": "del_6ba7b810-9dad-11d1-80b4-00c04fd430c8"
}`}</CodeBlock>
      </Endpoint>
    </div>
  );
}
