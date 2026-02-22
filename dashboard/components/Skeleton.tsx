export function SkeletonLine({ className = "" }: { className?: string }) {
  return <div className={`bg-border/50 rounded animate-pulse ${className}`} />;
}

export function SkeletonCard() {
  return (
    <div className="bg-surface border border-border rounded-xl p-5">
      <SkeletonLine className="h-4 w-24 mb-3" />
      <SkeletonLine className="h-8 w-16 mb-2" />
      <SkeletonLine className="h-3 w-20" />
    </div>
  );
}

export function SkeletonTableRow({ cols = 5 }: { cols?: number }) {
  return (
    <tr>
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <SkeletonLine className="h-4 w-full max-w-[120px]" />
        </td>
      ))}
    </tr>
  );
}

export function SkeletonTable({ rows = 5, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div className="bg-surface border border-border rounded-xl overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="border-b border-border">
            {Array.from({ length: cols }).map((_, i) => (
              <th key={i} className="text-left px-4 py-3">
                <SkeletonLine className="h-3 w-16" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {Array.from({ length: rows }).map((_, i) => (
            <SkeletonTableRow key={i} cols={cols} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function SkeletonChart() {
  return (
    <div className="bg-surface border border-border rounded-xl p-5">
      <SkeletonLine className="h-4 w-32 mb-4" />
      <SkeletonLine className="h-56 w-full rounded-lg" />
    </div>
  );
}

export function SkeletonDetailGrid() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="bg-surface border border-border rounded-xl p-4">
          <SkeletonLine className="h-3 w-16 mb-2" />
          <SkeletonLine className="h-5 w-24" />
        </div>
      ))}
    </div>
  );
}
