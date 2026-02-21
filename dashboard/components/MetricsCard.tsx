export function MetricsCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="bg-surface border border-border rounded-xl p-5 hover:border-border-hover transition-colors">
      <p className="text-sm text-text-muted font-medium">{label}</p>
      <p className="text-3xl font-semibold mt-1.5 tracking-tight text-text-primary">{value}</p>
      {sub && <p className="text-sm text-text-secondary mt-1.5">{sub}</p>}
    </div>
  );
}
