const statusConfig: Record<string, { dot: string; bg: string; text: string; ring?: boolean }> = {
  PENDING: { dot: "bg-pending", bg: "bg-pending/10", text: "text-pending", ring: true },
  SCHEDULED: { dot: "bg-scheduled", bg: "bg-scheduled/10", text: "text-scheduled", ring: true },
  IN_PROGRESS: { dot: "bg-in-progress", bg: "bg-in-progress/10", text: "text-in-progress", ring: true },
  DELIVERED: { dot: "bg-delivered", bg: "bg-delivered/10", text: "text-delivered" },
  FAILED: { dot: "bg-failed", bg: "bg-failed/10", text: "text-failed" },
  EXPIRED: { dot: "bg-expired", bg: "bg-expired/10", text: "text-expired" },
  CANCELLED: { dot: "bg-cancelled", bg: "bg-cancelled/10", text: "text-cancelled" },
};

const fallback = { dot: "bg-text-muted", bg: "bg-text-muted/10", text: "text-text-muted" };

function ProgressRing({ className }: { className?: string }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 14 14"
      className={`animate-spin ${className ?? ""}`}
    >
      <circle
        cx="7"
        cy="7"
        r="5"
        fill="none"
        stroke="currentColor"
        strokeOpacity="0.25"
        strokeWidth="2"
      />
      <circle
        cx="7"
        cy="7"
        r="5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeDasharray="20"
        strokeDashoffset="15"
      />
    </svg>
  );
}

export function DeliveryStatusBadge({ status }: { status: string }) {
  const config = statusConfig[status] || fallback;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
      {config.ring ? (
        <ProgressRing />
      ) : (
        <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      )}
      {status}
    </span>
  );
}
