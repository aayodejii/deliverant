import type { Attempt } from "@/lib/types";
import { LuCircleCheck, LuCircleX, LuCircleAlert, LuCircleDot } from "react-icons/lu";

const outcomeConfig: Record<string, { icon: typeof LuCircleCheck; color: string }> = {
  SUCCESS: { icon: LuCircleCheck, color: "text-delivered" },
  RETRYABLE_FAILURE: { icon: LuCircleAlert, color: "text-pending" },
  NON_RETRYABLE_FAILURE: { icon: LuCircleX, color: "text-failed" },
};

const fallback = { icon: LuCircleDot, color: "text-text-muted" };

export function AttemptTimeline({ attempts }: { attempts: Attempt[] }) {
  if (!attempts.length) {
    return <p className="text-text-muted py-8 text-center">No attempts yet</p>;
  }

  return (
    <div className="space-y-0">
      {attempts.map((a, i) => {
        const config = outcomeConfig[a.outcome || ""] || fallback;
        const Icon = config.icon;
        const isLast = i === attempts.length - 1;

        return (
          <div key={a.id} className="relative flex gap-4 pb-5 last:pb-0">
            {!isLast && (
              <div className="absolute left-[11px] top-7 bottom-0 w-px bg-border" />
            )}

            <div className="relative z-10 shrink-0 mt-0.5">
              <Icon size={22} className={config.color} />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2.5">
                <span className="font-medium text-text-primary">
                  Attempt {a.attempt_number}
                </span>
                {a.http_status && (
                  <span className={`font-mono text-sm px-1.5 py-0.5 rounded ${
                    a.http_status >= 200 && a.http_status < 300
                      ? "text-delivered bg-delivered/10"
                      : a.http_status >= 500
                      ? "text-failed bg-failed/10"
                      : "text-pending bg-pending/10"
                  }`}>
                    {a.http_status}
                  </span>
                )}
                {a.latency_ms != null && (
                  <span className="font-mono text-sm text-text-muted">{a.latency_ms}ms</span>
                )}
              </div>

              <p className="text-sm text-text-muted mt-1 font-mono">
                {new Date(a.started_at).toLocaleString()}
                {a.classification && (
                  <span className="ml-2 text-text-secondary font-sans">
                    {a.classification.replace(/_/g, " ").toLowerCase()}
                  </span>
                )}
              </p>

              {a.error_detail && (
                <p className="text-sm text-failed mt-2 font-mono bg-failed/5 rounded-md px-2.5 py-1.5 truncate">
                  {a.error_detail}
                </p>
              )}

              {a.response_body_snippet && (
                <pre className="text-sm text-text-secondary mt-2 bg-elevated border border-border rounded-lg p-3 overflow-x-auto max-h-24 font-mono">
                  {a.response_body_snippet}
                </pre>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
