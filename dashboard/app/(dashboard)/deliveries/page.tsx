"use client";

import { useState, useCallback } from "react";
import useSWR from "swr";
import { fetcher, apiFetch } from "@/lib/api";
import type { Delivery, Endpoint, PaginatedResponse } from "@/lib/types";
import { DeliveryStatusBadge } from "@/components/DeliveryStatusBadge";
import { SkeletonTable } from "@/components/Skeleton";
import { EmptyState } from "@/components/EmptyState";
import Link from "next/link";
import { LuSearch, LuLoader } from "react-icons/lu";

const STATUSES = [
  "",
  "PENDING",
  "SCHEDULED",
  "IN_PROGRESS",
  "DELIVERED",
  "FAILED",
  "EXPIRED",
  "CANCELLED",
];

export default function DeliveriesPage() {
  const [statusFilter, setStatusFilter] = useState("");
  const [endpointFilter, setEndpointFilter] = useState("");
  const [search, setSearch] = useState("");
  const [extraPages, setExtraPages] = useState<Delivery[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);

  const params = new URLSearchParams();
  if (statusFilter) params.set("status", statusFilter);
  if (endpointFilter) params.set("endpoint_id", endpointFilter);
  const qs = params.toString();

  const { data, isLoading } = useSWR<PaginatedResponse<Delivery>>(
    `/deliveries${qs ? `?${qs}` : ""}`,
    fetcher,
    {
      refreshInterval: 5000,
      onSuccess: (res) => {
        setExtraPages([]);
        setNextCursor(res.has_more ? res.next_cursor : null);
      },
    }
  );
  const { data: endpoints } = useSWR<Endpoint[]>("/endpoints", fetcher);

  const allDeliveries = [...(data?.results ?? []), ...extraPages];

  const filtered = search
    ? allDeliveries.filter(
        (d) =>
          d.event_type.toLowerCase().includes(search.toLowerCase()) ||
          d.endpoint_name.toLowerCase().includes(search.toLowerCase())
      )
    : allDeliveries;

  const hasMore = nextCursor !== null;

  const loadMore = useCallback(async () => {
    if (!nextCursor || loadingMore) return;
    setLoadingMore(true);
    try {
      const cursorParams = new URLSearchParams(params);
      cursorParams.set("cursor", nextCursor);
      const res = await apiFetch<PaginatedResponse<Delivery>>(
        `/deliveries?${cursorParams.toString()}`
      );
      setExtraPages((prev) => [...prev, ...res.results]);
      setNextCursor(res.has_more ? res.next_cursor : null);
    } finally {
      setLoadingMore(false);
    }
  }, [nextCursor, loadingMore, params]);

  const selectClass =
    "px-3 py-2 bg-elevated border border-border rounded-lg text-sm text-text-primary";

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-xl font-semibold text-text-primary">Deliveries</h1>
        <p className="text-text-muted mt-0.5">
          Track and filter webhook delivery attempts
        </p>
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1 max-w-xs">
          <LuSearch
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search events or endpoints..."
            className="w-full pl-9 pr-3 py-2 bg-elevated border border-border rounded-lg text-sm text-text-primary placeholder:text-text-muted"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className={selectClass}
        >
          <option value="">All statuses</option>
          {STATUSES.filter(Boolean).map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>

        <select
          value={endpointFilter}
          onChange={(e) => setEndpointFilter(e.target.value)}
          className={selectClass}
        >
          <option value="">All endpoints</option>
          {endpoints?.map((ep) => (
            <option key={ep.id} value={ep.id}>
              {ep.name}
            </option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <SkeletonTable rows={8} cols={6} />
      ) : !filtered || filtered.length === 0 ? (
        search || statusFilter || endpointFilter ? (
          <div className="bg-surface border border-border rounded-xl">
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <p className="text-text-muted">
                No deliveries match your filters
              </p>
            </div>
          </div>
        ) : (
          <div className="bg-surface border border-border rounded-xl">
            <EmptyState preset="deliveries" />
          </div>
        )
      ) : (
        <div className="bg-surface border border-border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left px-4 py-3 text-sm font-medium text-text-muted">
                  Event
                </th>
                <th className="text-left px-4 py-3 text-sm font-medium text-text-muted">
                  Endpoint
                </th>
                <th className="text-left px-4 py-3 text-sm font-medium text-text-muted">
                  Status
                </th>
                <th className="text-left px-4 py-3 text-sm font-medium text-text-muted">
                  Mode
                </th>
                <th className="text-left px-4 py-3 text-sm font-medium text-text-muted">
                  Attempts
                </th>
                <th className="text-left px-4 py-3 text-sm font-medium text-text-muted">
                  Created
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((d) => (
                <tr
                  key={d.id}
                  className="hover:bg-surface-hover transition-colors"
                >
                  <td className="px-4 py-3">
                    <Link
                      href={`/deliveries/${d.id}`}
                      className="text-text-primary hover:text-accent transition-colors font-mono text-sm"
                    >
                      {d.event_type}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-text-secondary text-sm">
                    {d.endpoint_name}
                  </td>
                  <td className="px-4 py-3">
                    <DeliveryStatusBadge status={d.status} />
                  </td>
                  <td className="px-4 py-3 text-text-secondary text-sm font-mono">
                    {d.mode}
                  </td>
                  <td className="px-4 py-3 text-text-secondary font-mono text-sm">
                    {d.attempts_count}
                  </td>
                  <td className="px-4 py-3 text-text-muted font-mono text-sm">
                    {new Date(d.created_at).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {hasMore && (
            <div className="border-t border-border px-4 py-3 flex justify-center">
              <button
                onClick={loadMore}
                disabled={loadingMore}
                className="flex items-center gap-2 px-4 py-2 text-sm text-text-secondary hover:text-text-primary transition-colors disabled:opacity-50 cursor-pointer"
              >
                {loadingMore && <LuLoader size={14} className="animate-spin" />}
                {loadingMore ? "Loading..." : "Load more"}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
