import { CodeBlock } from "@/components/docs/CodeBlock";

export default function AuthenticationDocs() {
  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Authentication</h1>
        <p className="mt-3 text-lg text-text-secondary leading-relaxed">
          All API requests require authentication using an API key.
        </p>
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-4">Bearer Token</h2>
        <p className="text-[15px] text-text-secondary mb-4 leading-relaxed">
          Include your API key in the{" "}
          <code className="text-accent bg-accent/8 px-1.5 py-0.5 rounded text-[12px] font-mono">
            Authorization
          </code>{" "}
          header as a Bearer token on every request.
        </p>
        <CodeBlock title="Request header" language="shell">{`Authorization: Bearer dk_live_your_api_key_here`}</CodeBlock>
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-4">Example Request</h2>
        <CodeBlock title="curl" language="shell">{`curl -X GET https://api.deliverant.dev/v1/endpoints \\
  -H "Authorization: Bearer dk_live_your_api_key_here" \\
  -H "Content-Type: application/json"`}</CodeBlock>
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-4">Error Responses</h2>
        <p className="text-[15px] text-text-secondary mb-4 leading-relaxed">
          Requests without a valid API key return{" "}
          <code className="text-failed bg-failed/10 px-1.5 py-0.5 rounded text-[12px] font-mono">
            401 Unauthorized
          </code>
          .
        </p>
        <CodeBlock title="401 Response">{`{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Invalid or missing API key",
    "details": {}
  }
}`}</CodeBlock>
      </div>

      <div className="rounded-xl border border-accent/15 bg-accent/[0.03] p-5">
        <p className="text-sm text-text-secondary leading-relaxed">
          <span className="text-accent font-medium">Tip:</span> API keys are
          managed in the Dashboard under Settings. Each key is scoped to a single
          tenant and can be revoked at any time.
        </p>
      </div>
    </div>
  );
}
