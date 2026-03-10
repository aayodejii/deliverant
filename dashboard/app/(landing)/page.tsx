"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

import {
  LuShieldCheck,
  LuFingerprint,
  LuTimer,
  LuEye,
  LuRotateCw,
  LuArrowRight,
  LuGithub,
} from "react-icons/lu";
import { DeliveryFlow } from "@/components/landing/DeliveryFlow";
import { CodeBlock } from "@/components/landing/CodeBlock";
import { DeliveryTimeline } from "@/components/landing/DeliveryTimeline";

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
  id,
}: {
  children: React.ReactNode;
  className?: string;
  id?: string;
}) {
  const { ref, visible } = useInView();
  return (
    <section
      ref={ref}
      id={id}
      className={`transition-all duration-700 ease-out ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
      } ${className}`}
    >
      {children}
    </section>
  );
}

function ProblemCards() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-12">
      {/* Lost events — a log that trails off into nothing */}
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

      {/* Duplicate deliveries — same payload sent twice */}
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
                ✓ 200 — 14:32:01
              </div>
            </div>
            <div className="rounded-md border border-pending/30 bg-pending/[0.03] px-3 py-2 font-mono text-[11px]">
              <div className="text-text-secondary">order.created</div>
              <div className="text-text-muted">
                {"{"} id: 4891 {"}"}
              </div>
              <div className="text-pending text-[10px] mt-1">
                ⚠ 200 — 14:32:04 (retry)
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

      {/* Unclear failures — a cryptic error with no context */}
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
            <div className="text-text-muted/50">
              attempt: <span className="text-failed/70">?</span>
            </div>
          </div>
        </div>
        <div className="px-4 py-2.5 border-t border-border bg-bg">
          <p className="text-[11px] text-text-muted">
            Something broke. No way to know what.
          </p>
        </div>
      </div>

      {/* Risky replays — a dangerous button with no guardrails */}
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
                no dry run · no audit trail · no undo
              </div>
            </div>
            <div className="font-mono text-xs text-text-muted/40 text-center">
              Are you sure? <span className="text-failed/50">y/n</span>
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
  );
}

export default function LandingPage() {
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
              href="https://github.com/aayodejii/deliverant"
              target="_blank"
              rel="noopener noreferrer"
              className="text-text-muted hover:text-text-primary transition-colors"
            >
              <LuGithub className="w-5 h-5" />
            </a>
            <Link
              href="/login"
              className="text-sm text-text-secondary hover:text-text-primary transition-colors"
            >
              Dashboard
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <div className="relative overflow-hidden">
        {/* Radial gradient backdrop */}
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-300 h-150 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 60% 50% at 50% 0%, rgba(16, 185, 129, 0.06) 0%, transparent 100%)",
          }}
        />

        <div className="max-w-[1400px] mx-auto px-6 pt-20 md:pt-28 pb-8">
          <div className="max-w-3xl mx-auto text-center hero-stagger">
            <h1 className="text-4xl md:text-[64px] md:leading-[1.08] font-bold tracking-tight text-text-primary">
              Reliable webhook delivery{" "}
              <span className="text-accent">under failure</span>
            </h1>

            <p className="mt-6 text-xl md:text-2xl text-text-secondary leading-relaxed max-w-2xl mx-auto">
              Deliverant makes sure your outbound webhooks are delivered safely,
              even when networks fail, endpoints go down, or retries are
              required.
            </p>

            <p className="mt-4 text-base font-mono text-text-muted tracking-wide">
              No silent drops. No guesswork. No fragile retry loops.
            </p>

            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3">
              <a
                href="https://github.com/aayodejii/deliverant"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-accent text-bg font-semibold text-sm hover:bg-accent-hover transition-colors"
              >
                <LuGithub className="w-4 h-4" />
                View on GitHub
              </a>
              <a
                href="#how-it-works"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-lg border border-border text-text-secondary text-sm hover:border-border-hover hover:text-text-primary transition-colors"
              >
                How it works
                <LuArrowRight className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>

        {/* Delivery flow visualization */}
        <div className="max-w-5xl mx-auto px-6 mt-4">
          <div className="rounded-2xl border border-border/60 bg-surface/30 overflow-hidden animate-flow-in">
            <DeliveryFlow />
          </div>
        </div>
      </div>

      {/* Problem */}
      <Section className="max-w-[1400px] mx-auto px-6 pt-32 pb-16">
        <div className="max-w-2xl">
          <p className="text-xs font-mono text-accent tracking-widest uppercase mb-4">
            The problem
          </p>
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight">
            Webhooks are easy to send.
            <br />
            <span className="text-text-secondary">
              They&apos;re hard to deliver reliably.
            </span>
          </h2>
          <p className="mt-6 text-lg text-text-secondary leading-relaxed">
            When something goes wrong, there&apos;s often no way to answer a
            simple question:{" "}
            <span className="text-text-primary font-medium italic">
              Did the webhook actually arrive?
            </span>
          </p>
        </div>

        <ProblemCards />
      </Section>

      {/* Solution */}
      <Section className="max-w-[1400px] mx-auto px-6 py-16" id="how-it-works">
        <div className="max-w-2xl">
          <p className="text-xs font-mono text-accent tracking-widest uppercase mb-4">
            The solution
          </p>
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight">
            A reliability layer for
            <br />
            <span className="text-accent">outbound webhooks</span>
          </h2>
          <p className="mt-6 text-lg text-text-secondary leading-relaxed">
            Deliverant sits between your system and your customers&apos;
            endpoints and takes responsibility for delivery, retries, and
            visibility.
          </p>
        </div>

        {/* Narrative flow: You call → We handle */}
        <div className="mt-12 space-y-6 lg:space-y-0 lg:grid lg:grid-cols-[1fr_auto_1fr] lg:gap-0 lg:items-start">
          {/* Step 1: Your API call */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-accent/15 text-accent text-xs font-mono font-bold">
                1
              </span>
              <span className="text-sm font-medium text-text-secondary">
                You call the API
              </span>
            </div>
            <CodeBlock />
          </div>

          {/* Connector */}
          <div className="hidden lg:flex flex-col items-center justify-center px-4 pt-14">
            <div className="w-px h-8 bg-border" />
            <div className="my-2 px-3 py-1.5 rounded-full border border-border bg-surface text-[10px] font-mono text-text-muted tracking-wider whitespace-nowrap">
              then
            </div>
            <div className="w-px h-8 bg-border" />
            <div className="w-2 h-2 rounded-full bg-accent mt-1" />
          </div>
          {/* Mobile connector */}
          <div className="flex lg:hidden items-center justify-center py-2">
            <div className="h-px w-8 bg-border" />
            <span className="mx-3 px-3 py-1 rounded-full border border-border bg-surface text-[10px] font-mono text-text-muted tracking-wider">
              then
            </span>
            <div className="h-px w-8 bg-border" />
          </div>

          {/* Step 2: We handle delivery */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-delivered/15 text-delivered text-xs font-mono font-bold">
                2
              </span>
              <span className="text-sm font-medium text-text-secondary">
                We handle the rest
              </span>
            </div>
            <DeliveryTimeline delay={1000} />
          </div>
        </div>
      </Section>

      {/* Features */}
      <Section className="max-w-[1400px] mx-auto px-6 py-16">
        <div className="text-center max-w-2xl mx-auto">
          <p className="text-xs font-mono text-accent tracking-widest uppercase mb-4">
            What Deliverant provides
          </p>
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight">
            Built for correctness,
            <br />
            <span className="text-text-secondary">not convenience</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 mt-12">
          {/* At-least-once delivery */}
          <div className="feature-card group relative rounded-xl border border-border bg-surface hover:border-border-hover overflow-hidden lg:col-span-2">
            <div className="p-6">
              <div className="w-9 h-9 rounded-lg bg-delivered/10 flex items-center justify-center mb-4">
                <LuShieldCheck className="w-4.5 h-4.5 text-delivered" />
              </div>
              <h3 className="text-base font-semibold text-text-primary">
                At-least-once delivery
              </h3>
              <p className="text-[15px] text-text-secondary mt-2 leading-relaxed">
                Events are never silently dropped. If the system is unsure, it
                retries.
              </p>
            </div>
            <div className="px-6 pb-4">
              <div className="rounded-md bg-bg border border-border px-3 py-2 font-mono text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-text-muted">attempt 1</span>
                  <span className="text-failed">timeout</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-text-muted">attempt 2</span>
                  <span className="text-failed">503</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-text-muted">attempt 3</span>
                  <span className="text-delivered">200 ✓</span>
                </div>
              </div>
            </div>
          </div>

          {/* Enforced deduplication */}
          <div className="feature-card group relative rounded-xl border border-border bg-surface hover:border-border-hover overflow-hidden lg:col-span-2">
            <div className="p-6">
              <div className="w-9 h-9 rounded-lg bg-scheduled/10 flex items-center justify-center mb-4">
                <LuFingerprint className="w-4.5 h-4.5 text-scheduled" />
              </div>
              <h3 className="text-base font-semibold text-text-primary">
                Enforced deduplication
              </h3>
              <p className="text-[15px] text-text-secondary mt-2 leading-relaxed">
                Idempotency is first-class. Duplicate deliveries are prevented
                within a defined window.
              </p>
            </div>
            <div className="px-6 pb-4">
              <div className="rounded-md bg-bg border border-border px-3 py-2 font-mono text-xs">
                <div className="text-text-muted">
                  idempotency_key:{" "}
                  <span className="text-scheduled">ord-4891</span>
                </div>
                <div className="flex items-center gap-1.5 mt-1.5">
                  <span className="text-[10px] text-delivered bg-delivered/10 px-1.5 py-0.5 rounded">
                    CREATED
                  </span>
                  <span className="text-[10px] text-text-muted bg-border/50 px-1.5 py-0.5 rounded line-through">
                    DEDUPED
                  </span>
                  <span className="text-[10px] text-text-muted bg-border/50 px-1.5 py-0.5 rounded line-through">
                    DEDUPED
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Deterministic retries */}
          <div className="feature-card group relative rounded-xl border border-border bg-surface hover:border-border-hover overflow-hidden lg:col-span-2">
            <div className="p-6">
              <div className="w-9 h-9 rounded-lg bg-pending/10 flex items-center justify-center mb-4">
                <LuTimer className="w-4.5 h-4.5 text-pending" />
              </div>
              <h3 className="text-base font-semibold text-text-primary">
                Deterministic retries
              </h3>
              <p className="text-[15px] text-text-secondary mt-2 leading-relaxed">
                Retries are bounded, explainable and visible. Not infinite loops
                hidden in code.
              </p>
            </div>
            <div className="px-6 pb-4">
              <div className="rounded-md bg-bg border border-border px-3 py-2 font-mono text-xs text-text-muted">
                <div className="flex items-center gap-3">
                  <span className="text-pending">5s</span>
                  <span>→</span>
                  <span className="text-pending">30s</span>
                  <span>→</span>
                  <span className="text-pending">2m</span>
                  <span>→</span>
                  <span className="text-pending">10m</span>
                  <span>→</span>
                  <span className="text-text-muted/50">...</span>
                </div>
                <div className="text-[10px] text-text-muted/60 mt-1">
                  exponential backoff · max 8 attempts
                </div>
              </div>
            </div>
          </div>

          {/* Full delivery visibility */}
          <div className="feature-card group relative rounded-xl border border-border bg-surface hover:border-border-hover overflow-hidden lg:col-span-2 lg:col-start-2">
            <div className="p-6">
              <div className="w-9 h-9 rounded-lg bg-in-progress/10 flex items-center justify-center mb-4">
                <LuEye className="w-4.5 h-4.5 text-in-progress" />
              </div>
              <h3 className="text-base font-semibold text-text-primary">
                Full delivery visibility
              </h3>
              <p className="text-[15px] text-text-secondary mt-2 leading-relaxed">
                Every attempt is recorded with timestamps, outcomes, and failure
                classification.
              </p>
            </div>
            <div className="px-6 pb-4">
              <div className="rounded-md bg-bg border border-border px-3 py-2 font-mono text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-text-muted">status</span>
                  <span className="text-delivered">DELIVERED</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-text-muted">attempts</span>
                  <span className="text-text-secondary">2</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-text-muted">latency</span>
                  <span className="text-text-secondary">148ms</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-text-muted">classification</span>
                  <span className="text-in-progress">SUCCESS</span>
                </div>
              </div>
            </div>
          </div>

          {/* Safe replay */}
          <div className="feature-card group relative rounded-xl border border-border bg-surface hover:border-border-hover overflow-hidden lg:col-span-2 lg:col-start-4">
            <div className="p-6">
              <div className="w-9 h-9 rounded-lg bg-accent/10 flex items-center justify-center mb-4">
                <LuRotateCw className="w-4.5 h-4.5 text-accent" />
              </div>
              <h3 className="text-base font-semibold text-text-primary">
                Safe replay
              </h3>
              <p className="text-[15px] text-text-secondary mt-2 leading-relaxed">
                Failed deliveries can be replayed with guardrails and a full
                audit trail.
              </p>
            </div>
            <div className="px-6 pb-4">
              <div className="rounded-md bg-bg border border-border px-3 py-2 font-mono text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-text-muted">replay batch</span>
                  <span className="text-accent text-[10px] bg-accent/10 px-1.5 py-0.5 rounded">
                    DRY RUN
                  </span>
                </div>
                <div className="text-text-muted/60 mt-1.5 text-[10px]">
                  3 deliveries · linked to original · audited
                </div>
              </div>
            </div>
          </div>
        </div>
      </Section>

      {/* Honest guarantees */}
      <Section className="max-w-[1400px] mx-auto px-6 py-16">
        <div className="relative rounded-2xl border border-border bg-surface overflow-hidden">
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                "radial-gradient(ellipse 80% 60% at 20% 50%, rgba(16, 185, 129, 0.04) 0%, transparent 100%)",
            }}
          />
          <div className="relative grid grid-cols-1 lg:grid-cols-2 gap-12 p-8 md:p-12">
            <div>
              <p className="text-xs font-mono text-accent tracking-widest uppercase mb-4">
                Honest guarantees
              </p>
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
                We don&apos;t hide
                <br />
                tradeoffs.
              </h2>
              <p className="mt-5 text-lg text-text-secondary leading-relaxed">
                Deliverant provides at-least-once delivery. It does not promise
                exactly-once execution, and it does not hide tradeoffs.
              </p>
              <p className="mt-4 text-lg text-text-secondary leading-relaxed">
                Reliability is treated as an engineering discipline, not
                marketing.
              </p>
            </div>

            <div className="space-y-4">
              <div className="p-4 rounded-lg border border-border bg-bg">
                <p className="text-xs font-mono text-accent mb-2">
                  Designed for
                </p>
                <ul className="space-y-2 text-[15px] text-text-secondary">
                  <li className="flex items-center gap-2">
                    <div className="w-1 h-1 rounded-full bg-accent" />
                    SaaS platforms
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1 h-1 rounded-full bg-accent" />
                    API-first products
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1 h-1 rounded-full bg-accent" />
                    Teams who care about reliability and trust
                  </li>
                </ul>
              </div>

              <div className="p-4 rounded-lg border border-border bg-bg">
                <p className="text-xs font-mono text-text-muted mb-2">
                  Not designed for
                </p>
                <ul className="space-y-2 text-[15px] text-text-muted">
                  <li className="flex items-center gap-2">
                    <div className="w-1 h-1 rounded-full bg-text-muted" />
                    Workflow engines
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1 h-1 rounded-full bg-text-muted" />
                    No-code automation tools
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </Section>

      {/* CTA */}
      <Section className="max-w-[1400px] mx-auto px-6 pt-16 pb-32">
        <div className="text-center max-w-2xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight">
            Deliver your events
            <br />
            <span className="text-accent">with confidence</span>
          </h2>
          <p className="mt-6 text-lg text-text-secondary leading-relaxed">
            If webhooks are part of your product&apos;s contract with customers,
            they deserve production-grade reliability. Deliverant exists to make
            that reliability boring, predictable, and provable.
          </p>

          <div className="mt-8">
            <a
              href="https://github.com/aayodejii/deliverant"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-accent text-bg font-semibold text-sm hover:bg-accent-hover transition-colors"
            >
              <LuGithub className="w-4 h-4" />
              View on GitHub
            </a>
          </div>
        </div>
      </Section>

      {/* Footer */}
      <footer className="border-t border-border">
        <div className="max-w-[1400px] mx-auto px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-5 h-5 rounded-md bg-accent/15 flex items-center justify-center">
              <div className="w-1.5 h-1.5 rounded-full bg-accent" />
            </div>
            <span className="text-sm text-text-muted">Deliverant</span>
          </div>
          <div className="flex items-center gap-6 text-xs text-text-muted">
            <a
              href="https://github.com/aayodejii/deliverant"
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
