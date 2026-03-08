import { Endpoint } from "@/components/docs/Endpoint";
import { CodeBlock } from "@/components/docs/CodeBlock";
import { ParamTable } from "@/components/docs/ParamTable";

export default function EndpointsDocs() {
  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Endpoints</h1>
        <p className="mt-3 text-lg text-text-secondary leading-relaxed">
          Endpoints represent the webhook URLs that receive deliveries. Create,
          update, pause, and delete endpoints.
        </p>
      </div>

      <Endpoint
        method="POST"
        path="/v1/endpoints"
        description="Register a new webhook endpoint."
      >
        <ParamTable
          title="Request body"
          params={[
            { name: "name", type: "string", required: true, description: "Display name for the endpoint" },
            { name: "url", type: "string", required: true, description: "The URL that receives webhooks" },
            { name: "secret", type: "string", required: false, description: "Signing secret for signature verification" },
            { name: "headers_json", type: "object", required: false, description: "Custom headers sent with each delivery" },
            { name: "timeout_seconds", type: "integer", required: false, description: "Request timeout (default: 10)" },
          ]}
        />
        <CodeBlock title="Request">{`{
  "name": "my-webhook",
  "url": "https://example.com/webhook",
  "secret": "whsec_your_signing_secret",
  "headers_json": {},
  "timeout_seconds": 10
}`}</CodeBlock>
        <CodeBlock title="201 Response">{`{
  "id": "ep_550e8400-e29b-41d4-a716-446655440000",
  "name": "my-webhook",
  "url": "https://example.com/webhook",
  "headers_json": {},
  "timeout_seconds": 10,
  "status": "ACTIVE",
  "paused_at": null,
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-01T00:00:00Z"
}`}</CodeBlock>
      </Endpoint>

      <Endpoint
        method="GET"
        path="/v1/endpoints"
        description="List all endpoints for the authenticated tenant."
      >
        <CodeBlock title="200 Response">{`[
  {
    "id": "ep_550e8400-e29b-41d4-a716-446655440000",
    "name": "my-webhook",
    "url": "https://example.com/webhook",
    "status": "ACTIVE",
    ...
  }
]`}</CodeBlock>
      </Endpoint>

      <Endpoint
        method="GET"
        path="/v1/endpoints/{ep_id}"
        description="Retrieve a single endpoint by its prefixed ID."
      >
        <CodeBlock title="200 Response">{`{
  "id": "ep_550e8400-e29b-41d4-a716-446655440000",
  "name": "my-webhook",
  "url": "https://example.com/webhook",
  "headers_json": {},
  "timeout_seconds": 10,
  "status": "ACTIVE",
  "paused_at": null,
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-01T00:00:00Z"
}`}</CodeBlock>
      </Endpoint>

      <Endpoint
        method="PATCH"
        path="/v1/endpoints/{ep_id}"
        description="Update an endpoint. Supports partial updates. Set status to PAUSED to pause delivery, ACTIVE to resume."
      >
        <ParamTable
          title="Request body (all optional)"
          params={[
            { name: "name", type: "string", required: false, description: "Updated display name" },
            { name: "url", type: "string", required: false, description: "Updated webhook URL" },
            { name: "secret", type: "string", required: false, description: "Updated signing secret" },
            { name: "headers_json", type: "object", required: false, description: "Updated custom headers" },
            { name: "timeout_seconds", type: "integer", required: false, description: "Updated timeout" },
            { name: "status", type: "string", required: false, description: "ACTIVE or PAUSED" },
          ]}
        />
        <CodeBlock title="Request">{`{
  "name": "updated-name",
  "status": "PAUSED"
}`}</CodeBlock>
        <CodeBlock title="200 Response">{`{
  "id": "ep_550e8400-e29b-41d4-a716-446655440000",
  "name": "updated-name",
  "status": "PAUSED",
  "paused_at": "2024-01-01T12:00:00Z",
  ...
}`}</CodeBlock>
      </Endpoint>

      <Endpoint
        method="DELETE"
        path="/v1/endpoints/{ep_id}"
        description="Permanently delete an endpoint."
      >
        <p className="text-sm text-text-muted">
          Returns{" "}
          <code className="text-accent bg-accent/8 px-1.5 py-0.5 rounded text-[12px] font-mono">
            204 No Content
          </code>{" "}
          on success.
        </p>
      </Endpoint>
    </div>
  );
}
