"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { LuGithub, LuArrowRight, LuCheck, LuLoaderCircle } from "react-icons/lu";
import { GITHUB_URL } from "@/lib/constants";

function useInView(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);

  return { ref, visible };
}

function Section({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const { ref, visible } = useInView();
  return (
    <section
      ref={ref}
      className={`transition-all duration-700 ease-out ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
      } ${className}`}
    >
      {children}
    </section>
  );
}

function StatusLine({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
      <span className="text-xs font-mono text-text-muted">{label}</span>
      <span className={`text-xs font-mono ${color}`}>{value}</span>
    </div>
  );
}

export default function WaitlistPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || status === "loading") return;

    setStatus("loading");
    setErrorMsg("");

    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Something went wrong");
      }

      setStatus("success");
    } catch (err) {
      setStatus("error");
      setErrorMsg(err instanceof Error ? err.message : "Something went wrong");
    }
  };

  return (
    <div className="min-h-screen bg-bg text-text-primary">
      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b border-border/50 bg-bg/80 backdrop-blur-xl">
        <div className="max-w-[1400px] mx-auto px-6 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <img src="/img/logo.png" alt="Deliverant" width={24} height={24} />
            <span className="font-semibold text-[15px] tracking-tight">
              Deliverant
            </span>
          </Link>

          <div className="flex items-center gap-4">
            <Link
              href="/docs"
              className="text-sm text-text-secondary hover:text-text-primary transition-colors"
            >
              Docs
            </Link>
            <a
              href={GITHUB_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-text-muted hover:text-text-primary transition-colors"
            >
              <LuGithub className="w-5 h-5" />
            </a>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <div className="relative overflow-hidden">
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-300 h-150 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 60% 50% at 50% 0%, rgba(16, 185, 129, 0.06) 0%, transparent 100%)",
          }}
        />

        {/* Dot grid texture */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.03]"
          style={{
            backgroundImage: "radial-gradient(circle, #ededef 1px, transparent 1px)",
            backgroundSize: "24px 24px",
          }}
        />

        <div className="max-w-[1400px] mx-auto px-6 pt-24 md:pt-36 pb-8">
          <div className="max-w-3xl mx-auto text-center hero-stagger">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-accent/20 bg-accent/[0.06] mb-8">
              <div className="w-1.5 h-1.5 rounded-full bg-accent pulse" />
              <span className="text-xs font-mono text-accent tracking-wide">
                launching soon
              </span>
            </div>

            <h1 className="text-4xl md:text-[64px] md:leading-[1.08] font-bold tracking-tight text-text-primary">
              Reliable webhook delivery{" "}
              <span className="text-accent">under failure</span>
            </h1>

            <p className="mt-6 text-lg md:text-xl text-text-secondary leading-relaxed max-w-2xl mx-auto">
              Deliverant is a reliability layer for outbound webhooks.
              At-least-once delivery, enforced deduplication, deterministic retries,
              and full delivery visibility.
            </p>

            {/* Email form */}
            <div className="mt-10 max-w-md mx-auto">
              {status === "success" ? (
                <div className="flex items-center justify-center gap-2.5 px-6 py-4 rounded-xl border border-accent/30 bg-accent/[0.06]">
                  <div className="w-7 h-7 rounded-full bg-accent/15 flex items-center justify-center">
                    <LuCheck className="w-4 h-4 text-accent" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-medium text-text-primary">You&apos;re on the list</p>
                    <p className="text-xs text-text-muted mt-0.5">We&apos;ll reach out when it&apos;s time.</p>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="relative">
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted font-mono text-sm select-none pointer-events-none">
                        $
                      </div>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@company.com"
                        required
                        className="w-full pl-8 pr-4 py-3 rounded-lg border border-border bg-surface text-sm text-text-primary placeholder:text-text-muted/60 font-mono focus:border-accent focus:ring-1 focus:ring-accent transition-all"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={status === "loading"}
                      className="px-5 py-3 rounded-lg bg-accent text-bg font-semibold text-sm hover:bg-accent-hover transition-colors flex items-center gap-2 disabled:opacity-60 whitespace-nowrap"
                    >
                      {status === "loading" ? (
                        <LuLoaderCircle className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          Join waitlist
                          <LuArrowRight className="w-3.5 h-3.5" />
                        </>
                      )}
                    </button>
                  </div>
                  {status === "error" && (
                    <p className="mt-2 text-xs text-failed text-left font-mono">{errorMsg}</p>
                  )}
                </form>
              )}
            </div>

            <div className="mt-6 flex items-center justify-center gap-3">
              <a
                href={GITHUB_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-sm text-text-secondary hover:border-border-hover hover:text-text-primary transition-colors"
              >
                <LuGithub className="w-4 h-4" />
                Star on GitHub
              </a>
            </div>

            <p className="mt-4 text-xs text-text-muted">
              Open source &middot; Self-hostable &middot; No vendor lock-in
            </p>
          </div>
        </div>
      </div>

      {/* Problem cards */}
      <Section className="max-w-[1400px] mx-auto px-6 pt-24 pb-16">
        <div className="max-w-2xl">
          <p className="text-xs font-mono text-accent tracking-widest uppercase mb-4">
            The problem
          </p>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
            Webhooks are easy to send.
            <br />
            <span className="text-text-secondary">
              They&apos;re hard to deliver reliably.
            </span>
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-12">
          <div className="feature-card group rounded-xl border border-border bg-surface hover:border-border-hover overflow-hidden">
            <div className="px-4 pt-4 pb-3">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-2 h-2 rounded-full bg-failed/60" />
                <span className="text-[10px] font-mono text-text-muted tracking-wider uppercase">
                  Lost events
                </span>
              </div>
              <div className="font-mono text-[11px] leading-[1.7] space-y-0.5">
                <div className="text-text-muted">
                  <span className="text-text-secondary">14:32:01</span> POST
                  /webhook <span className="text-failed">→ sent</span>
                </div>
                <div className="text-text-muted">
                  <span className="text-text-secondary">14:32:01</span> waiting for
                  ack...
                </div>
                <div className="text-text-muted/50">
                  <span className="text-text-secondary/50">14:32:06</span> timeout
                </div>
                <div className="text-text-muted/25">
                  <span className="text-text-secondary/25">14:32:06</span> no
                  response
                </div>
                <div className="text-text-muted/10">14:32:06 ...</div>
              </div>
            </div>
            <div className="px-4 py-2.5 border-t border-border bg-bg">
              <p className="text-[11px] text-text-muted">
                No confirmation. No trace.
              </p>
            </div>
          </div>

          <div className="feature-card group rounded-xl border border-border bg-surface hover:border-border-hover overflow-hidden">
            <div className="px-4 pt-4 pb-3">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-2 h-2 rounded-full bg-pending/60" />
                <span className="text-[10px] font-mono text-text-muted tracking-wider uppercase">
                  Duplicates
                </span>
              </div>
              <div className="space-y-1.5">
                <div className="rounded-md border border-border bg-bg px-3 py-2 font-mono text-[11px]">
                  <div className="text-text-secondary">order.created</div>
                  <div className="text-text-muted">
                    {"{"} id: 4891 {"}"}
                  </div>
                  <div className="text-delivered text-[10px] mt-1">
                    ✓ 200
                  </div>
                </div>
                <div className="rounded-md border border-pending/30 bg-pending/[0.03] px-3 py-2 font-mono text-[11px]">
                  <div className="text-text-secondary">order.created</div>
                  <div className="text-text-muted">
                    {"{"} id: 4891 {"}"}
                  </div>
                  <div className="text-pending text-[10px] mt-1">
                    ⚠ 200 (retry)
                  </div>
                </div>
              </div>
            </div>
            <div className="px-4 py-2.5 border-t border-border bg-bg">
              <p className="text-[11px] text-text-muted">
                Same payload. Processed twice.
              </p>
            </div>
          </div>

          <div className="feature-card group rounded-xl border border-border bg-surface hover:border-border-hover overflow-hidden">
            <div className="px-4 pt-4 pb-3">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-2 h-2 rounded-full bg-failed/60" />
                <span className="text-[10px] font-mono text-text-muted tracking-wider uppercase">
                  Unclear failures
                </span>
              </div>
              <div className="rounded-md border border-failed/20 bg-failed/[0.03] px-3 py-3 font-mono text-[11px] space-y-1">
                <div className="text-failed font-semibold">ERROR</div>
                <div className="text-text-muted">webhook delivery failed</div>
                <div className="text-text-muted/50">
                  status: <span className="text-failed/70">unknown</span>
                </div>
                <div className="text-text-muted/50">
                  response: <span className="text-failed/70">—</span>
                </div>
              </div>
            </div>
            <div className="px-4 py-2.5 border-t border-border bg-bg">
              <p className="text-[11px] text-text-muted">
                Something broke. No way to know what.
              </p>
            </div>
          </div>

          <div className="feature-card group rounded-xl border border-border bg-surface hover:border-border-hover overflow-hidden">
            <div className="px-4 pt-4 pb-3">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-2 h-2 rounded-full bg-failed/60" />
                <span className="text-[10px] font-mono text-text-muted tracking-wider uppercase">
                  Risky replays
                </span>
              </div>
              <div className="space-y-2">
                <div className="rounded-md border border-border bg-bg px-3 py-2 font-mono text-[11px]">
                  <div className="flex items-center justify-between">
                    <span className="text-text-muted">3 failed deliveries</span>
                    <span className="text-[10px] text-failed bg-failed/10 px-1.5 py-0.5 rounded">
                      FAILED
                    </span>
                  </div>
                </div>
                <div className="rounded-md border border-failed/30 bg-failed/[0.04] px-3 py-2.5 text-center">
                  <div className="text-failed text-xs font-semibold">
                    ↻ Retry All
                  </div>
                  <div className="text-text-muted/40 text-[10px] mt-0.5">
                    no dry run · no audit trail
                  </div>
                </div>
              </div>
            </div>
            <div className="px-4 py-2.5 border-t border-border bg-bg">
              <p className="text-[11px] text-text-muted">
                No guardrails. Good luck.
              </p>
            </div>
          </div>
        </div>
      </Section>

      {/* What Deliverant provides */}
      <Section className="max-w-[1400px] mx-auto px-6 py-16">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <p className="text-xs font-mono text-accent tracking-widest uppercase mb-4">
            What you get
          </p>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
            Built for correctness,{" "}
            <span className="text-text-secondary">not convenience</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl mx-auto">
          {[
            { label: "At-least-once delivery", desc: "Events are never silently dropped. If uncertain, the system retries.", color: "text-delivered" },
            { label: "Enforced deduplication", desc: "Idempotency keys prevent duplicate processing within a bounded window.", color: "text-scheduled" },
            { label: "Deterministic retries", desc: "Exponential backoff with bounded attempts. Visible, predictable, explainable.", color: "text-pending" },
            { label: "Full delivery visibility", desc: "Every attempt recorded with timestamps, status codes, and failure classification.", color: "text-in-progress" },
            { label: "Safe replay", desc: "Replay failed deliveries with dry-run mode, batch controls, and audit trail.", color: "text-accent" },
            { label: "HMAC signatures", desc: "Every delivery is signed. Receivers can verify authenticity and integrity.", color: "text-failed" },
          ].map((feature) => (
            <div
              key={feature.label}
              className="flex items-start gap-3.5 p-4 rounded-xl border border-border bg-surface hover:border-border-hover transition-colors"
            >
              <div className={`w-1.5 h-1.5 rounded-full mt-2 shrink-0 ${feature.color.replace("text-", "bg-")}`} />
              <div>
                <h3 className="text-sm font-semibold text-text-primary">{feature.label}</h3>
                <p className="text-[13px] text-text-secondary mt-1 leading-relaxed">{feature.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* System status panel */}
      <Section className="max-w-[1400px] mx-auto px-6 py-16">
        <div className="max-w-lg mx-auto">
          <div className="rounded-xl border border-border bg-surface overflow-hidden">
            <div className="px-4 py-3 border-b border-border bg-bg flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-accent pulse" />
                <span className="text-xs font-mono text-text-muted tracking-wider uppercase">
                  system status
                </span>
              </div>
              <span className="text-[10px] font-mono text-text-muted">v1.0</span>
            </div>
            <div className="px-4 py-2">
              <StatusLine label="api" value="ready" color="text-delivered" />
              <StatusLine label="delivery_worker" value="ready" color="text-delivered" />
              <StatusLine label="retry_scheduler" value="ready" color="text-delivered" />
              <StatusLine label="analytics_pipeline" value="ready" color="text-delivered" />
              <StatusLine label="dashboard" value="ready" color="text-delivered" />
              <StatusLine label="hosted_platform" value="coming soon" color="text-pending" />
            </div>
          </div>
          <p className="text-center text-xs text-text-muted mt-4">
            Self-host today via{" "}
            <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer" className="text-accent hover:text-accent-hover transition-colors">
              GitHub
            </a>
            . Hosted platform launching soon.
          </p>
        </div>
      </Section>

      {/* Final CTA */}
      <Section className="max-w-[1400px] mx-auto px-6 pt-8 pb-32">
        <div className="text-center max-w-2xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
            Be the first to know
          </h2>
          <p className="mt-4 text-lg text-text-secondary leading-relaxed">
            Join the waitlist and we&apos;ll notify you when the hosted platform is live.
          </p>

          <div className="mt-8 max-w-md mx-auto">
            {status === "success" ? (
              <div className="flex items-center justify-center gap-2 text-sm text-accent font-mono">
                <LuCheck className="w-4 h-4" />
                you&apos;re on the list
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="flex gap-2">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  required
                  className="flex-1 px-4 py-3 rounded-lg border border-border bg-surface text-sm text-text-primary placeholder:text-text-muted/60 font-mono"
                />
                <button
                  type="submit"
                  disabled={status === "loading"}
                  className="px-5 py-3 rounded-lg bg-accent text-bg font-semibold text-sm hover:bg-accent-hover transition-colors disabled:opacity-60"
                >
                  {status === "loading" ? (
                    <LuLoaderCircle className="w-4 h-4 animate-spin" />
                  ) : (
                    "Join"
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      </Section>

      {/* Footer */}
      <footer className="border-t border-border">
        <div className="max-w-[1400px] mx-auto px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <img src="/img/logo.png" alt="Deliverant" width={18} height={18} />
            <span className="text-sm text-text-muted">Deliverant</span>
          </div>
          <div className="flex items-center gap-6 text-xs text-text-muted">
            <a
              href={GITHUB_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-text-secondary transition-colors"
            >
              GitHub
            </a>
            <span>AGPL-3.0</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
