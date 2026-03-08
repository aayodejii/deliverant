interface Param {
  name: string;
  type: string;
  required?: boolean;
  description: string;
}

const TYPE_COLORS: Record<string, { text: string; bg: string }> = {
  string: { text: "text-[#60a5fa]", bg: "bg-[#60a5fa]/8" },
  "string[]": { text: "text-[#60a5fa]", bg: "bg-[#60a5fa]/8" },
  uuid: { text: "text-[#60a5fa]", bg: "bg-[#60a5fa]/8" },
  object: { text: "text-[#a78bfa]", bg: "bg-[#a78bfa]/8" },
  array: { text: "text-[#a78bfa]", bg: "bg-[#a78bfa]/8" },
  boolean: { text: "text-[#fbbf24]", bg: "bg-[#fbbf24]/8" },
  integer: { text: "text-[#67e8f9]", bg: "bg-[#67e8f9]/8" },
  number: { text: "text-[#67e8f9]", bg: "bg-[#67e8f9]/8" },
};

const DEFAULT_TYPE = { text: "text-text-muted", bg: "bg-border/30" };

export function ParamTable({
  title,
  params,
}: {
  title?: string;
  params: Param[];
}) {
  return (
    <div>
      {title && (
        <p className="text-[10px] font-mono text-text-muted tracking-[0.15em] uppercase mb-3">
          {title}
        </p>
      )}
      <div className="rounded-lg border border-border overflow-hidden">
        {/* header */}
        <div className="grid grid-cols-[minmax(120px,1fr)_80px_2fr] sm:grid-cols-[minmax(140px,1fr)_90px_2.5fr] bg-surface/60 border-b border-border px-4 py-2.5">
          <span className="text-[10px] font-mono text-text-muted tracking-[0.12em] uppercase">
            Parameter
          </span>
          <span className="text-[10px] font-mono text-text-muted tracking-[0.12em] uppercase">
            Type
          </span>
          <span className="text-[10px] font-mono text-text-muted tracking-[0.12em] uppercase hidden sm:block">
            Description
          </span>
        </div>

        {/* rows */}
        {params.map((p, i) => {
          const typeStyle = TYPE_COLORS[p.type] || DEFAULT_TYPE;
          return (
            <div
              key={p.name}
              className={`grid grid-cols-[minmax(120px,1fr)_80px_2fr] sm:grid-cols-[minmax(140px,1fr)_90px_2.5fr] px-4 py-3 items-start hover:bg-surface/30 transition-colors ${
                i < params.length - 1 ? "border-b border-border/60" : ""
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <code className="text-[13px] font-mono text-text-primary truncate">
                  {p.name}
                </code>
                {p.required && (
                  <span className="text-[8px] font-mono text-failed/90 bg-failed/10 px-1.5 py-0.5 rounded tracking-[0.1em] uppercase shrink-0 leading-none">
                    req
                  </span>
                )}
              </div>
              <div>
                <span
                  className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${typeStyle.text} ${typeStyle.bg}`}
                >
                  {p.type}
                </span>
              </div>
              <div className="text-[13px] text-text-secondary leading-relaxed hidden sm:block">
                {p.description}
              </div>
              {/* mobile description */}
              <div className="col-span-full text-[12px] text-text-muted leading-relaxed mt-1 sm:hidden">
                {p.description}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
