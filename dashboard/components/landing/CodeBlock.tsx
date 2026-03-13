"use client";

import { useEffect, useRef, useState } from "react";
import { API_BASE_URL } from "@/lib/constants";

export function CodeBlock() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [cursorVisible, setCursorVisible] = useState(true);

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
      { threshold: 0.3 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!visible) return;
    const interval = setInterval(() => setCursorVisible((v) => !v), 530);
    return () => clearInterval(interval);
  }, [visible]);

  const lines = [
    { delay: 0, content: <><span className="text-accent">curl</span>{" "}<span className="text-text-secondary">-X POST</span>{" "}<span className="text-text-primary">{API_BASE_URL}/events</span>{" "}\</> },
    { delay: 80, content: <span className="pl-4">-H <span className="text-pending">&quot;Authorization: Bearer sk_live_...&quot;</span> \</span> },
    { delay: 160, content: <span className="pl-4">-H <span className="text-pending">&quot;Content-Type: application/json&quot;</span> \</span> },
    { delay: 240, content: <span className="pl-4">-d <span className="text-accent">&apos;{"{"}</span></span> },
    { delay: 320, content: <span className="pl-8"><span className="text-scheduled">&quot;type&quot;</span><span className="text-text-muted">: </span><span className="text-accent">&quot;order.created&quot;</span><span className="text-text-muted">,</span></span> },
    { delay: 400, content: <span className="pl-8"><span className="text-scheduled">&quot;payload&quot;</span><span className="text-text-muted">: {"{"} </span><span className="text-scheduled">&quot;order_id&quot;</span><span className="text-text-muted">: </span><span className="text-pending">4891</span><span className="text-text-muted"> {"}"}</span><span className="text-text-muted">,</span></span> },
    { delay: 480, content: <span className="pl-8"><span className="text-scheduled">&quot;endpoint_ids&quot;</span><span className="text-text-muted">: [</span><span className="text-accent">&quot;ep_8f3k...&quot;</span><span className="text-text-muted">],</span></span> },
    { delay: 560, content: <span className="pl-8"><span className="text-scheduled">&quot;idempotency_key&quot;</span><span className="text-text-muted">: </span><span className="text-accent">&quot;ord-4891-created&quot;</span></span> },
    { delay: 640, content: <span className="pl-4"><span className="text-accent">{"}"}&apos;</span></span> },
  ];

  return (
    <div ref={ref} className="relative rounded-xl border border-border bg-surface overflow-hidden font-mono text-sm">
      {/* Terminal header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-bg">
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-failed/60" />
          <div className="w-2.5 h-2.5 rounded-full bg-pending/60" />
          <div className="w-2.5 h-2.5 rounded-full bg-delivered/60" />
        </div>
        <span className="text-text-muted text-xs ml-2">POST /v1/events</span>
      </div>

      <div className="p-5 text-[13px] leading-relaxed overflow-x-auto">
        {lines.map((line, i) => (
          <div
            key={i}
            className="text-text-muted transition-all duration-300"
            style={{
              opacity: visible ? 1 : 0,
              transform: visible ? "translateX(0)" : "translateX(-6px)",
              transitionDelay: `${line.delay}ms`,
            }}
          >
            {line.content}
            {i === lines.length - 1 && (
              <span
                className="text-accent ml-0.5"
                style={{ opacity: cursorVisible ? 1 : 0 }}
              >
                ▌
              </span>
            )}
          </div>
        ))}

        {/* Response */}
        <div
          className="mt-5 pt-4 border-t border-border transition-all duration-500"
          style={{
            opacity: visible ? 1 : 0,
            transform: visible ? "translateY(0)" : "translateY(8px)",
            transitionDelay: "900ms",
          }}
        >
          <div className="flex items-center gap-2 mb-3">
            <span className="text-[10px] font-semibold tracking-wider text-delivered bg-delivered/10 px-2 py-0.5 rounded shadow-[0_0_12px_rgba(52,211,153,0.15)]">
              202 ACCEPTED
            </span>
          </div>
          <div className="text-text-muted">{"{"}</div>
          <div className="pl-4">
            <span className="text-scheduled">&quot;event_id&quot;</span>
            <span className="text-text-muted">: </span>
            <span className="text-text-secondary">&quot;evt_a1b2c3d4&quot;</span>
            <span className="text-text-muted">,</span>
          </div>
          <div className="pl-4">
            <span className="text-scheduled">&quot;deliveries&quot;</span>
            <span className="text-text-muted">: [{"{"}</span>
          </div>
          <div className="pl-8">
            <span className="text-scheduled">&quot;delivery_id&quot;</span>
            <span className="text-text-muted">: </span>
            <span className="text-text-secondary">&quot;del_x7y8z9&quot;</span>
            <span className="text-text-muted">,</span>
          </div>
          <div className="pl-8">
            <span className="text-scheduled">&quot;created&quot;</span>
            <span className="text-text-muted">: </span>
            <span className="text-accent">true</span>
          </div>
          <div className="pl-4 text-text-muted">{"}]"}</div>
          <div className="text-text-muted">{"}"}</div>
        </div>
      </div>
    </div>
  );
}
