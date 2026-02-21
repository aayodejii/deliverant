"use client";

import { useParams } from "next/navigation";
import useSWR from "swr";
import { apiFetch, fetcher } from "@/lib/api";
import type { DeliveryDetail } from "@/lib/types";
import { DeliveryStatusBadge } from "@/components/DeliveryStatusBadge";
import { AttemptTimeline } from "@/components/AttemptTimeline";
import { useState } from "react";
import Link from "next/link";
import { LuArrowLeft, LuBan, LuClock, LuTriangleAlert } from "react-icons/lu";

export default function DeliveryDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: delivery, mutate } = useSWR<DeliveryDetail>(`/deliveries/${id}`, fetcher, {
    refreshInterval: 3000,
  });
  const [cancelling, setCancelling] = useState(false);

  if (!delivery) {
    return <p className="text-text-muted py-12 text-center text-sm">Loading...</p>;
  }

  const canCancel = ["PENDING", "SCHEDULED", "IN_PROGRESS"].includes(delivery.status);

  const handleCancel = async () => {
    setCancelling(true);
    try {
      await apiFetch(`/deliveries/${id}/cancel`, { method: "POST" });
      await mutate();
    } finally {
      setCancelling(false);
    }
  };

  const infoItems = [
    { label: "Status", value: <DeliveryStatusBadge status={delivery.status} /> },
    { label: "Event Type", value: <span className="font-mono text-sm">{delivery.event_type}</span> },
    { label: "Endpoint", value: delivery.endpoint_name },
    { label: "Mode", value: <span className="font-mono text-sm uppercase">{delivery.mode}</span> },
    { label: "Attempts", value: <span className="font-mono">{delivery.attempts_count}</span> },
    { label: "Created", value: <span className="font-mono text-sm">{new Date(delivery.created_at).toLocaleString()}</span> },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/deliveries" className="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-text-secondary transition-colors mb-3">
            <LuArrowLeft size={14} /> Back to deliveries
          </Link>
          <h1 className="text-xl font-semibold text-text-primary">Delivery</h1>
          <p className="text-sm text-text-muted mt-0.5 font-mono">{delivery.id}</p>
        </div>
        {canCancel && (
          <button
            onClick={handleCancel}
            disabled={cancelling}
            className="flex items-center gap-2 px-4 py-2 bg-failed/10 text-failed border border-failed/20 text-sm font-medium rounded-lg hover:bg-failed/15 disabled:opacity-50 transition-colors"
          >
            <LuBan size={14} />
            {cancelling ? "Cancelling..." : "Cancel Delivery"}
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 stagger">
        {infoItems.map((item) => (
          <div key={item.label} className="bg-surface border border-border rounded-xl p-4">
            <p className="text-sm text-text-muted">{item.label}</p>
            <div className="mt-1.5 text-sm text-text-primary">{item.value}</div>
          </div>
        ))}
      </div>

      {delivery.next_attempt_at && (
        <div className="flex items-center gap-3 bg-pending/10 border border-pending/20 rounded-lg px-4 py-3">
          <LuClock size={15} className="text-pending shrink-0" />
          <p className="text-sm text-pending">
            Next attempt: <span className="font-mono">{new Date(delivery.next_attempt_at).toLocaleString()}</span>
          </p>
        </div>
      )}

      {delivery.terminal_reason && (
        <div className="flex items-center gap-3 bg-surface border border-border rounded-lg px-4 py-3">
          <LuTriangleAlert size={15} className="text-text-muted shrink-0" />
          <div>
            <p className="text-sm text-text-muted">Terminal Reason</p>
            <p className="text-sm text-text-secondary mt-0.5">{delivery.terminal_reason}</p>
          </div>
        </div>
      )}

      <div>
        <h2 className="text-sm font-medium text-text-muted uppercase tracking-wider mb-4">Attempts</h2>
        <div className="bg-surface border border-border rounded-xl p-5">
          <AttemptTimeline attempts={delivery.attempts} />
        </div>
      </div>
    </div>
  );
}
