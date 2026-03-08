"use client";

import { useState } from "react";

const METHOD_CONFIG: Record<string, { bg: string; text: string; glow: string; border: string }> = {
  GET: {
    bg: "bg-scheduled/12",
    text: "text-scheduled",
    glow: "shadow-[inset_0_0_12px_rgba(96,165,250,0.06)]",
    border: "border-scheduled/25",
  },
  POST: {
    bg: "bg-delivered/12",
    text: "text-delivered",
    glow: "shadow-[inset_0_0_12px_rgba(52,211,153,0.06)]",
    border: "border-delivered/25",
  },
  PATCH: {
    bg: "bg-pending/12",
    text: "text-pending",
    glow: "shadow-[inset_0_0_12px_rgba(251,191,36,0.06)]",
    border: "border-pending/25",
  },
  DELETE: {
    bg: "bg-failed/12",
    text: "text-failed",
    glow: "shadow-[inset_0_0_12px_rgba(251,113,133,0.06)]",
    border: "border-failed/25",
  },
  PUT: {
    bg: "bg-[#a78bfa]/12",
    text: "text-[#a78bfa]",
    glow: "shadow-[inset_0_0_12px_rgba(167,139,250,0.06)]",
    border: "border-[#a78bfa]/25",
  },
};

export function Endpoint({
  method,
  path,
  description,
  children,
}: {
  method: string;
  path: string;
  description?: string;
  children?: React.ReactNode;
}) {
  const config = METHOD_CONFIG[method] || METHOD_CONFIG.GET;
  const [isHovered, setIsHovered] = useState(false);

  // highlight path params like {del_id}
  const pathParts = path.split(/(\{[^}]+\})/g);

  return (
    <div
      className={`rounded-xl border border-border overflow-hidden transition-all duration-300 ${
        isHovered ? "border-border-hover shadow-lg shadow-black/20" : ""
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* method + path header */}
      <div className={`flex items-center gap-3.5 px-5 py-3.5 border-b border-border ${config.glow} bg-surface/60`}>
        <span
          className={`inline-flex items-center justify-center w-[4.5rem] py-1.5 rounded-md text-[10px] font-mono font-bold tracking-[0.12em] border ${config.bg} ${config.text} ${config.border}`}
        >
          {method}
        </span>
        <code className="text-[14px] font-mono text-text-primary">
          {pathParts.map((part, i) =>
            part.startsWith("{") ? (
              <span key={i} className="text-text-muted italic">
                {part}
              </span>
            ) : (
              <span key={i}>{part}</span>
            )
          )}
        </code>
      </div>

      {/* body */}
      <div className="bg-bg px-5 py-5 space-y-5">
        {description && (
          <p className="text-[15px] text-text-secondary leading-relaxed">
            {description}
          </p>
        )}
        {children}
      </div>
    </div>
  );
}
