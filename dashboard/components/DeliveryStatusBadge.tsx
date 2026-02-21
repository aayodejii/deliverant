const statusConfig: Record<string, { dot: string; bg: string; text: string }> = {
  PENDING: { dot: "bg-pending", bg: "bg-pending/10", text: "text-pending" },
  SCHEDULED: { dot: "bg-scheduled", bg: "bg-scheduled/10", text: "text-scheduled" },
  IN_PROGRESS: { dot: "bg-in-progress pulse", bg: "bg-in-progress/10", text: "text-in-progress" },
  DELIVERED: { dot: "bg-delivered", bg: "bg-delivered/10", text: "text-delivered" },
  FAILED: { dot: "bg-failed", bg: "bg-failed/10", text: "text-failed" },
  EXPIRED: { dot: "bg-expired", bg: "bg-expired/10", text: "text-expired" },
  CANCELLED: { dot: "bg-cancelled", bg: "bg-cancelled/10", text: "text-cancelled" },
};

const fallback = { dot: "bg-text-muted", bg: "bg-text-muted/10", text: "text-text-muted" };

export function DeliveryStatusBadge({ status }: { status: string }) {
  const config = statusConfig[status] || fallback;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      {status}
    </span>
  );
}
