import { CodeBlock } from "@/components/docs/CodeBlock";

export default function WebhooksDocs() {
  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Webhooks</h1>
        <p className="mt-3 text-lg text-text-secondary leading-relaxed">
          When Deliverant delivers an event to your endpoint, it includes
          standard headers for identification and signature verification. This
          page covers what your server receives, how to verify signatures, and
          how the delivery lifecycle works.
        </p>
      </div>

      {/* Delivery Headers */}
      <div>
        <h2 className="text-xl font-semibold tracking-tight mb-4">
          Delivery headers
        </h2>
        <p className="text-[15px] text-text-secondary mb-4 leading-relaxed">
          Every webhook delivery includes the following headers alongside the
          JSON payload.
        </p>
        <div className="rounded-xl border border-border overflow-hidden">
          <div className="grid grid-cols-[200px_1fr] bg-surface/60 border-b border-border px-4 py-2.5">
            <span className="text-[10px] font-mono text-text-muted/70 tracking-[0.12em] uppercase">
              Header
            </span>
            <span className="text-[10px] font-mono text-text-muted/70 tracking-[0.12em] uppercase">
              Description
            </span>
          </div>
          {[
            ["Content-Type", "application/json"],
            ["X-Webhook-Event", "Event type (e.g. order.created)"],
            ["X-Webhook-Delivery", "Delivery UUID"],
            ["X-Webhook-Attempt", "Attempt number (1-based)"],
            ["X-Webhook-Timestamp", "Unix timestamp"],
            ["X-Webhook-Signature", "v1=<hmac_sha256> (if endpoint has a secret)"],
          ].map(([header, desc], i, arr) => (
            <div
              key={header}
              className={`grid grid-cols-[200px_1fr] px-4 py-3 items-center hover:bg-surface/30 transition-colors ${
                i < arr.length - 1 ? "border-b border-border/60" : ""
              }`}
            >
              <code className="text-[12px] font-mono text-accent">
                {header}
              </code>
              <span className="text-[13px] text-text-secondary">{desc}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Signature Verification */}
      <div>
        <h2 className="text-xl font-semibold tracking-tight mb-4">
          Signature verification
        </h2>
        <p className="text-[15px] text-text-secondary mb-4 leading-relaxed">
          If your endpoint has a signing secret configured, Deliverant computes
          an HMAC-SHA256 signature over the timestamp and request body. Verify
          this signature to ensure the webhook is authentic and untampered.
        </p>
        <div className="space-y-4">
          <CodeBlock title="Signature computation" language="shell">{`signature = HMAC-SHA256(secret, "{timestamp}.{body}")`}</CodeBlock>
          <CodeBlock title="Verification example (Python)">{`import hmac
import hashlib

def verify_webhook(secret: str, timestamp: str, body: bytes, signature: str) -> bool:
    expected = hmac.new(
        secret.encode(),
        f"{timestamp}.".encode() + body,
        hashlib.sha256
    ).hexdigest()
    return hmac.compare_digest(f"v1={expected}", signature)`}</CodeBlock>
          <CodeBlock title="Verification example (Node.js)">{`const crypto = require('crypto');

function verifyWebhook(secret, timestamp, body, signature) {
  const expected = crypto
    .createHmac('sha256', secret)
    .update(\`\${timestamp}.\${body}\`)
    .digest('hex');
  return signature === \`v1=\${expected}\`;
}`}</CodeBlock>
        </div>
      </div>

      {/* Delivery States */}
      <div>
        <h2 className="text-xl font-semibold tracking-tight mb-4">
          Delivery states
        </h2>
        <p className="text-[15px] text-text-secondary mb-4 leading-relaxed">
          Each delivery progresses through a series of states. Terminal states
          are final — once reached, no further attempts are made.
        </p>
        <div className="rounded-xl border border-border bg-[#0a0a0c] p-6 font-mono text-[13px] leading-loose">
          <div>
            <span className="text-pending">PENDING</span>
            <span className="text-text-muted/40"> → </span>
            <span className="text-scheduled">SCHEDULED</span>
            <span className="text-text-muted/40"> → </span>
            <span className="text-[#a78bfa]">IN_PROGRESS</span>
            <span className="text-text-muted/40"> → </span>
            <span className="text-delivered">DELIVERED</span>
          </div>
          <div className="text-text-muted/40 ml-[17ch]">
            ↘ <span className="text-failed">FAILED</span>
          </div>
          <div className="text-text-muted/40 ml-[17ch]">
            ↘ <span className="text-[#fb923c]">EXPIRED</span>
          </div>
          <div className="text-text-muted/40 ml-4">
            ↘ <span className="text-text-muted">CANCELLED</span>{" "}
            <span className="text-text-muted/40 text-[11px]">
              (from any non-terminal state)
            </span>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {[
            { state: "DELIVERED", color: "text-delivered", border: "border-delivered/20" },
            { state: "FAILED", color: "text-failed", border: "border-failed/20" },
            { state: "EXPIRED", color: "text-[#fb923c]", border: "border-[#fb923c]/20" },
            { state: "CANCELLED", color: "text-text-muted", border: "border-border" },
          ].map(({ state, color, border }) => (
            <span
              key={state}
              className={`text-[10px] font-mono font-bold px-2 py-1 rounded bg-surface/40 border tracking-[0.08em] ${color} ${border}`}
            >
              {state}
            </span>
          ))}
          <span className="text-[11px] text-text-muted/60 self-center ml-1">
            — terminal states
          </span>
        </div>
      </div>

      {/* Retry Backoff Schedule */}
      <div>
        <h2 className="text-xl font-semibold tracking-tight mb-4">
          Retry backoff schedule
        </h2>
        <p className="text-[15px] text-text-secondary mb-4 leading-relaxed">
          Failed deliveries are retried with exponential backoff. Full jitter is
          applied — the actual delay is{" "}
          <code className="text-accent bg-accent/8 px-1.5 py-0.5 rounded text-[11px] font-mono">
            random(0, max_delay)
          </code>
          .
        </p>
        <div className="rounded-xl border border-border overflow-hidden">
          <div className="grid grid-cols-[80px_1fr] bg-surface/60 border-b border-border px-4 py-2.5">
            <span className="text-[10px] font-mono text-text-muted/70 tracking-[0.12em] uppercase">
              Attempt
            </span>
            <span className="text-[10px] font-mono text-text-muted/70 tracking-[0.12em] uppercase">
              Max delay
            </span>
          </div>
          {[
            ["1", "5 seconds"],
            ["2", "30 seconds"],
            ["3", "2 minutes"],
            ["4", "10 minutes"],
            ["5", "30 minutes"],
            ["6", "2 hours"],
            ["7", "6 hours"],
            ["8", "12 hours"],
            ["9", "18 hours"],
            ["10–12", "24 hours"],
          ].map(([attempt, delay], i, arr) => (
            <div
              key={attempt}
              className={`grid grid-cols-[80px_1fr] px-4 py-2.5 items-center hover:bg-surface/30 transition-colors ${
                i < arr.length - 1 ? "border-b border-border/60" : ""
              }`}
            >
              <span className="font-mono text-[12px] text-text-primary">
                {attempt}
              </span>
              <span className="text-[13px] text-text-secondary">{delay}</span>
            </div>
          ))}
        </div>
        <p className="mt-3 text-[12px] text-text-muted/60">
          After 12 failed attempts, the delivery transitions to{" "}
          <span className="font-mono text-failed font-medium">FAILED</span>{" "}
          terminal state.
        </p>
      </div>
    </div>
  );
}
