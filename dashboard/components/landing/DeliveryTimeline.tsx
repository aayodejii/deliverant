"use client";

import { useEffect, useRef, useState } from "react";
import { LuCheck, LuRotateCw, LuArrowRight } from "react-icons/lu";

const steps = [
  {
    time: "14:32:01.003",
    label: "Event ingested",
    detail: "order.created → ep_8f3k",
    status: "done" as const,
  },
  {
    time: "14:32:01.018",
    label: "Delivery created",
    detail: "del_x7y8z9 — PENDING",
    status: "done" as const,
  },
  {
    time: "14:32:01.041",
    label: "Scheduled",
    detail: "Attempt 1 dispatched",
    status: "done" as const,
  },
  {
    time: "14:32:01.312",
    label: "Attempt 1 — 503",
    detail: "RETRYABLE_FAILURE · 271ms",
    status: "retry" as const,
  },
  {
    time: "14:32:06.819",
    label: "Attempt 2 — 200",
    detail: "SUCCESS · 148ms",
    status: "success" as const,
  },
  {
    time: "14:32:06.820",
    label: "Delivered",
    detail: "Terminal state reached",
    status: "success" as const,
  },
];

export function DeliveryTimeline({ delay = 0 }: { delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visibleCount, setVisibleCount] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          observer.disconnect();
          steps.forEach((_, i) => {
            setTimeout(() => setVisibleCount(i + 1), delay + 200 + i * 180);
          });
        }
      },
      { threshold: 0.3 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [delay]);

  return (
    <div ref={ref} className="relative rounded-xl border border-border bg-surface overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-bg">
        <div className="w-2 h-2 rounded-full bg-delivered pulse" />
        <span className="text-text-muted text-xs font-mono">
          del_x7y8z9 — delivery trace
        </span>
      </div>

      <div className="p-5">
        {steps.map((step, i) => {
          const revealed = i < visibleCount;
          return (
            <div
              key={i}
              className="flex gap-3 transition-all duration-300"
              style={{
                opacity: revealed ? 1 : 0,
                transform: revealed ? "translateY(0)" : "translateY(6px)",
              }}
            >
              {/* Timeline connector */}
              <div className="flex flex-col items-center">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 transition-all duration-300 ${
                    step.status === "success"
                      ? "bg-delivered/15 text-delivered"
                      : step.status === "retry"
                      ? "bg-failed/15 text-failed"
                      : "bg-accent/15 text-accent"
                  }`}
                >
                  {step.status === "success" ? (
                    <LuCheck className="w-3 h-3" />
                  ) : step.status === "retry" ? (
                    <LuRotateCw className="w-3 h-3" />
                  ) : (
                    <LuArrowRight className="w-3 h-3" />
                  )}
                </div>
                {i < steps.length - 1 && (
                  <div
                    className={`w-px flex-1 min-h-5 ${
                      step.status === "retry" ? "bg-failed/20" : "bg-border"
                    }`}
                  />
                )}
              </div>

              {/* Content */}
              <div className="pb-4 -mt-0.5">
                <div className="flex items-baseline gap-2">
                  <span className="text-text-primary text-sm font-medium">
                    {step.label}
                  </span>
                  <span className="text-text-muted text-[11px] font-mono">
                    {step.time}
                  </span>
                </div>
                <p className="text-text-secondary text-xs font-mono mt-0.5">
                  {step.detail}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
