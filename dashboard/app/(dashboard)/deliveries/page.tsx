"use client";

import { useState } from "react";
import useSWR from "swr";
import { fetcher } from "@/lib/api";
import type { Delivery, Endpoint } from "@/lib/types";
import { DeliveryStatusBadge } from "@/components/DeliveryStatusBadge";
import Link from "next/link";

const STATUSES = ["", "PENDING", "SCHEDULED", "IN_PROGRESS", "DELIVERED", "FAILED", "EXPIRED", "CANCELLED"];

export default function DeliveriesPage() {
  const [statusFilter, setStatusFilter] = useState("");
  const [endpointFilter, setEndpointFilter] = useState("");

  const params = new URLSearchParams();
  if (statusFilter) params.set("status", statusFilter);
  if (endpointFilter) params.set("endpoint_id", endpointFilter);
  const qs = params.toString();

  const { data: deliveries } = useSWR<Delivery[]>(`/deliveries${qs ? `?${qs}` : ""}`, fetcher, {
    refreshInterval: 5000,
  });
  const { data: endpoints } = useSWR<Endpoint[]>("/endpoints", fetcher);

  const selectClass = "px-3 py-2 bg-elevated border border-border rounded-lg text-sm text-text-primary";

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-xl font-semibold text-text-primary">Deliveries</h1>
        <p className="text-text-muted mt-0.5">Track and filter webhook delivery attempts</p>
      </div>

      <div className="flex gap-3">
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className={selectClass}>
          <option value="">All statuses</option>
          {STATUSES.filter(Boolean).map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>

        <select value={endpointFilter} onChange={(e) => setEndpointFilter(e.target.value)} className={selectClass}>
          <option value="">All endpoints</option>
          {endpoints?.map((ep) => (
            <option key={ep.id} value={ep.id}>{ep.name}</option>
          ))}
        </select>
      </div>

      <div className="bg-surface border border-border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left px-4 py-3 text-sm font-medium text-text-muted">Event</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-text-muted">Endpoint</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-text-muted">Status</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-text-muted">Mode</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-text-muted">Attempts</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-text-muted">Created</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {deliveries?.map((d) => (
              <tr key={d.id} className="hover:bg-surface-hover transition-colors">
                <td className="px-4 py-3">
                  <Link href={`/deliveries/${d.id}`} className="text-text-primary hover:text-accent transition-colors font-mono text-sm">
                    {d.event_type}
                  </Link>
                </td>
                <td className="px-4 py-3 text-text-secondary text-sm">{d.endpoint_name}</td>
                <td className="px-4 py-3"><DeliveryStatusBadge status={d.status} /></td>
                <td className="px-4 py-3 text-text-secondary text-sm font-mono">{d.mode}</td>
                <td className="px-4 py-3 text-text-secondary font-mono text-sm">{d.attempts_count}</td>
                <td className="px-4 py-3 text-text-muted font-mono text-sm">{new Date(d.created_at).toLocaleString()}</td>
              </tr>
            ))}
            {(!deliveries || deliveries.length === 0) && (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-text-muted">No deliveries found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
