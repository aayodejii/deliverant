import { Endpoint } from "@/components/docs/Endpoint";
import { CodeBlock } from "@/components/docs/CodeBlock";
import { ParamTable } from "@/components/docs/ParamTable";

export default function EventsDocs() {
  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Events</h1>
        <p className="mt-3 text-lg text-text-secondary leading-relaxed">
          Events represent something that happened in your system. When you
          create an event, Deliverant creates deliveries to each specified
          endpoint.
        </p>
      </div>

      <Endpoint
        method="POST"
        path="/v1/events"
        description="Ingest an event and create deliveries to the specified endpoints."
      >
        <ParamTable
          title="Request body"
          params={[
            { name: "type", type: "string", required: true, description: "Event type (e.g. order.created)" },
            { name: "payload", type: "object", required: true, description: "Event payload (max 256KB)" },
            { name: "endpoint_ids", type: "string[]", required: true, description: "List of prefixed endpoint IDs" },
            { name: "idempotency_key", type: "string", required: false, description: "Key for deduplication (enables RELIABLE mode)" },
          ]}
        />

        <CodeBlock title="Request">{`{
  "type": "order.created",
  "payload": { "order_id": 123, "amount": 99.99 },
  "endpoint_ids": ["ep_550e8400-e29b-41d4-a716-446655440000"],
  "idempotency_key": "unique-key-123"
}`}</CodeBlock>

        <CodeBlock title="202 Response">{`{
  "event_id": "evt_f47ac10b-58cc-4372-a567-0e02b2c3d479",
  "deliveries": [
    {
      "delivery_id": "del_6ba7b810-9dad-11d1-80b4-00c04fd430c8",
      "endpoint_id": "ep_550e8400-e29b-41d4-a716-446655440000",
      "created": true
    }
  ]
}`}</CodeBlock>
      </Endpoint>

      {/* Idempotency */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Idempotency</h2>
        <p className="text-[15px] text-text-secondary leading-relaxed">
          Deliverant supports two delivery modes based on whether you provide an{" "}
          <code className="text-accent bg-accent/8 px-1.5 py-0.5 rounded text-[12px] font-mono">
            idempotency_key
          </code>
          :
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="rounded-xl border border-delivered/15 bg-delivered/[0.03] p-5">
            <div className="flex items-center gap-2 mb-2.5">
              <span className="text-[10px] font-mono font-bold text-delivered bg-delivered/12 px-2 py-0.5 rounded tracking-[0.1em]">
                RELIABLE
              </span>
            </div>
            <p className="text-[13px] text-text-secondary leading-relaxed">
              When{" "}
              <code className="text-accent bg-accent/8 px-1 py-0.5 rounded text-[11px] font-mono">
                idempotency_key
              </code>{" "}
              is provided. Deduplication uses the user-supplied key within a
              72-hour window.
            </p>
          </div>
          <div className="rounded-xl border border-border bg-surface/30 p-5">
            <div className="flex items-center gap-2 mb-2.5">
              <span className="text-[10px] font-mono font-bold text-text-muted bg-border/50 px-2 py-0.5 rounded tracking-[0.1em]">
                BASIC
              </span>
            </div>
            <p className="text-[13px] text-text-secondary leading-relaxed">
              Without an idempotency key. A deterministic key is generated from
              tenant + endpoint + type + payload hash.
            </p>
          </div>
        </div>
      </div>

      {/* Dedup behavior */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Deduplication Behavior</h2>
        <p className="text-[15px] text-text-secondary leading-relaxed">
          When a duplicate is detected within the 72-hour window, the existing
          delivery is returned with{" "}
          <code className="text-accent bg-accent/8 px-1.5 py-0.5 rounded text-[12px] font-mono">
            {`"created": false`}
          </code>
          .
        </p>
        <p className="text-[15px] text-text-secondary leading-relaxed">
          If the same idempotency key is reused with a{" "}
          <span className="text-text-primary font-medium">
            different payload
          </span>
          , the API returns{" "}
          <code className="text-failed bg-failed/10 px-1.5 py-0.5 rounded text-[12px] font-mono">
            409 Conflict
          </code>
          .
        </p>
        <CodeBlock title="409 Response">{`{
  "error": {
    "code": "IDEMPOTENCY_KEY_CONFLICT",
    "message": "Idempotency key reused with different payload",
    "details": {}
  }
}`}</CodeBlock>
      </div>
    </div>
  );
}
