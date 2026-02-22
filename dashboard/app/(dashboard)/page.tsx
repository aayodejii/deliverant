"use client";

import useSWR from "swr";
import { fetcher } from "@/lib/api";
import type { Delivery, Endpoint, PaginatedResponse } from "@/lib/types";
import { MetricsCard } from "@/components/MetricsCard";
import { DeliveryStatusBadge } from "@/components/DeliveryStatusBadge";
import { DeliveryVolumeChart } from "@/components/charts/DeliveryVolumeChart";
import { SuccessRateChart } from "@/components/charts/SuccessRateChart";
import { LatencyDistributionChart } from "@/components/charts/LatencyDistributionChart";
import { SkeletonCard, SkeletonChart, SkeletonTable } from "@/components/Skeleton";
import { EmptyState } from "@/components/EmptyState";
import Link from "next/link";
import { LuArrowUpRight } from "react-icons/lu";

export default function DashboardPage() {
  const { data: deliveriesData, isLoading: loadingDeliveries } = useSWR<PaginatedResponse<Delivery>>("/deliveries", fetcher, { refreshInterval: 5000 });
  const deliveries = deliveriesData?.results;
  const { data: endpoints } = useSWR<Endpoint[]>("/endpoints", fetcher, { refreshInterval: 10000 });

  const total = deliveries?.length ?? 0;
  const delivered = deliveries?.filter((d) => d.status === "DELIVERED").length ?? 0;
  const failed = deliveries?.filter((d) => d.status === "FAILED").length ?? 0;
  const pending = deliveries?.filter((d) => ["PENDING", "SCHEDULED", "IN_PROGRESS"].includes(d.status)).length ?? 0;
  const successRate = total > 0 ? ((delivered / total) * 100).toFixed(1) : "—";

  const recent = deliveries?.slice(0, 10) ?? [];

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-xl font-semibold text-text-primary">Overview</h1>
        <p className="text-text-muted mt-0.5">Webhook delivery metrics and recent activity</p>
      </div>

      {loadingDeliveries ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 stagger">
          <MetricsCard label="Total Deliveries" value={total} />
          <MetricsCard label="Success Rate" value={`${successRate}%`} sub={`${delivered} delivered`} />
          <MetricsCard label="Failed" value={failed} />
          <MetricsCard label="In Progress" value={pending} sub={`${endpoints?.length ?? 0} endpoints`} />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <DeliveryVolumeChart />
        <SuccessRateChart />
      </div>

      <LatencyDistributionChart />

      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-medium text-text-muted uppercase tracking-wider">Recent Deliveries</h2>
          <Link href="/deliveries" className="group flex items-center gap-1 text-sm text-text-secondary hover:text-accent transition-colors">
            View all <LuArrowUpRight size={13} className="transition-transform group-hover:-translate-y-px" />
          </Link>
        </div>

        {loadingDeliveries ? (
          <SkeletonTable rows={5} cols={5} />
        ) : (
          <div className="bg-surface border border-border rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left px-4 py-3 text-sm font-medium text-text-muted">Event</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-text-muted">Endpoint</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-text-muted">Status</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-text-muted">Attempts</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-text-muted">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {recent.map((d) => (
                  <tr key={d.id} className="hover:bg-surface-hover transition-colors">
                    <td className="px-4 py-3">
                      <Link href={`/deliveries/${d.id}`} className="text-text-primary hover:text-accent transition-colors font-mono text-sm">
                        {d.event_type}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-text-secondary text-sm">{d.endpoint_name}</td>
                    <td className="px-4 py-3"><DeliveryStatusBadge status={d.status} /></td>
                    <td className="px-4 py-3 text-text-secondary font-mono text-sm">{d.attempts_count}</td>
                    <td className="px-4 py-3 text-text-muted font-mono text-sm">{new Date(d.created_at).toLocaleString()}</td>
                  </tr>
                ))}
                {recent.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-0">
                      <EmptyState preset="deliveries" />
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
