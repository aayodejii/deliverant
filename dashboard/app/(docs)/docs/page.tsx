import Link from "next/link";
import { API_BASE_URL } from "@/lib/constants";
import {
  LuKey,
  LuRadio,
  LuCalendarClock,
  LuSend,
  LuRotateCcw,
  LuChartBar,
  LuWebhook,
  LuArrowRight,
} from "react-icons/lu";
import { CodeBlock } from "@/components/docs/CodeBlock";

const QUICK_LINKS = [
  { name: "Authentication", href: "/docs/authentication", icon: LuKey, desc: "API key setup" },
  { name: "Endpoints", href: "/docs/endpoints", icon: LuRadio, desc: "Manage webhook targets" },
  { name: "Events", href: "/docs/events", icon: LuCalendarClock, desc: "Ingest events" },
  { name: "Deliveries", href: "/docs/deliveries", icon: LuSend, desc: "Track delivery status" },
  { name: "Replays", href: "/docs/replays", icon: LuRotateCcw, desc: "Re-deliver webhooks" },
  { name: "Analytics", href: "/docs/analytics", icon: LuChartBar, desc: "Delivery metrics" },
  { name: "Webhooks", href: "/docs/webhooks", icon: LuWebhook, desc: "Headers, signatures, retries" },
];

const PREFIXES = [
  { resource: "Event", prefix: "evt_", example: "evt_550e8400-e29b-41d4-a716-446655440000" },
  { resource: "Delivery", prefix: "del_", example: "del_6ba7b810-9dad-11d1-80b4-00c04fd430c8" },
  { resource: "Endpoint", prefix: "ep_", example: "ep_f47ac10b-58cc-4372-a567-0e02b2c3d479" },
  { resource: "Attempt", prefix: "att_", example: "att_7c9e6679-7425-40de-944b-e07fc1f90ae7" },
  { resource: "Batch", prefix: "bat_", example: "bat_a1b2c3d4-e5f6-7890-abcd-ef1234567890" },
];

export default function DocsOverview() {
  return (
    <div className="space-y-14">
      {/* hero */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">API Reference</h1>
        <p className="mt-3 text-lg text-text-secondary leading-relaxed max-w-[600px]">
          The Deliverant API is organized around REST. All requests and responses
          use JSON. Authenticate with a Bearer token and use prefixed IDs for all
          resources.
        </p>
      </div>

      {/* base url */}
      <div>
        <h2 className="text-[10px] font-mono text-text-muted/70 tracking-[0.18em] uppercase mb-3">
          Base URL
        </h2>
        <CodeBlock language="shell">{API_BASE_URL}</CodeBlock>
      </div>

      {/* auth quick */}
      <div>
        <h2 className="text-[10px] font-mono text-text-muted/70 tracking-[0.18em] uppercase mb-3">
          Authentication
        </h2>
        <p className="text-[15px] text-text-secondary mb-4 leading-relaxed">
          All API requests require a Bearer token in the{" "}
          <code className="text-accent bg-accent/8 px-1.5 py-0.5 rounded text-[12px] font-mono">
            Authorization
          </code>{" "}
          header.
        </p>
        <CodeBlock title="Request header" language="shell">{`Authorization: Bearer dk_live_your_api_key_here`}</CodeBlock>
        <p className="mt-3 text-sm text-text-muted">
          <Link
            href="/docs/authentication"
            className="text-accent/80 hover:text-accent transition-colors"
          >
            Learn more about authentication →
          </Link>
        </p>
      </div>

      {/* ID format */}
      <div>
        <h2 className="text-[10px] font-mono text-text-muted/70 tracking-[0.18em] uppercase mb-3">
          ID Format
        </h2>
        <p className="text-[15px] text-text-secondary mb-4 leading-relaxed">
          All resource IDs use a prefixed format for easy identification. Pass
          prefixed IDs in URL paths, query parameters, and request bodies.
        </p>
        <div className="rounded-xl border border-border overflow-hidden">
          <div className="grid grid-cols-[100px_70px_1fr] bg-surface/60 border-b border-border px-4 py-2.5">
            <span className="text-[10px] font-mono text-text-muted/70 tracking-[0.12em] uppercase">
              Resource
            </span>
            <span className="text-[10px] font-mono text-text-muted/70 tracking-[0.12em] uppercase">
              Prefix
            </span>
            <span className="text-[10px] font-mono text-text-muted/70 tracking-[0.12em] uppercase hidden sm:block">
              Example
            </span>
          </div>
          {PREFIXES.map((p, i) => (
            <div
              key={p.prefix}
              className={`grid grid-cols-[100px_70px_1fr] px-4 py-3 items-center hover:bg-surface/30 transition-colors ${
                i < PREFIXES.length - 1 ? "border-b border-border/60" : ""
              }`}
            >
              <span className="text-sm text-text-primary">{p.resource}</span>
              <code className="text-[13px] font-mono text-accent font-medium">
                {p.prefix}
              </code>
              <code className="text-[11px] font-mono text-text-muted/70 hidden sm:block truncate">
                {p.example}
              </code>
            </div>
          ))}
        </div>
      </div>

      {/* quick links grid */}
      <div>
        <h2 className="text-[10px] font-mono text-text-muted/70 tracking-[0.18em] uppercase mb-4">
          API Sections
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {QUICK_LINKS.map((link) => {
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                className="group flex items-center gap-3 p-4 rounded-xl border border-border/80 bg-surface/30 hover:bg-surface/60 hover:border-border-hover transition-all duration-200"
              >
                <div className="w-9 h-9 rounded-lg bg-accent/8 flex items-center justify-center shrink-0 group-hover:bg-accent/12 transition-colors">
                  <Icon className="w-4 h-4 text-accent/70 group-hover:text-accent transition-colors" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-medium text-text-primary">
                    {link.name}
                  </p>
                  <p className="text-[11px] text-text-muted mt-0.5">
                    {link.desc}
                  </p>
                </div>
                <LuArrowRight className="w-3.5 h-3.5 text-text-muted/40 group-hover:text-accent/60 group-hover:translate-x-0.5 transition-all shrink-0" />
              </Link>
            );
          })}
        </div>
      </div>

      {/* status codes */}
      <div>
        <h2 className="text-[10px] font-mono text-text-muted/70 tracking-[0.18em] uppercase mb-3">
          Status Codes
        </h2>
        <div className="rounded-xl border border-border overflow-hidden">
          {[
            ["200", "Success", "delivered"],
            ["201", "Created", "delivered"],
            ["202", "Accepted (async processing)", "delivered"],
            ["204", "No Content", "delivered"],
            ["400", "Validation error", "failed"],
            ["401", "Unauthorized", "failed"],
            ["404", "Not found", "failed"],
            ["409", "Conflict (idempotency or state)", "failed"],
          ].map(([code, desc, color], i, arr) => (
            <div
              key={code}
              className={`flex items-center gap-4 px-4 py-2.5 hover:bg-surface/30 transition-colors ${
                i < arr.length - 1 ? "border-b border-border/60" : ""
              }`}
            >
              <code
                className={`text-[13px] font-mono font-bold w-10 ${
                  color === "delivered" ? "text-delivered" : "text-failed"
                }`}
              >
                {code}
              </code>
              <span className="text-[13px] text-text-secondary">{desc}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
