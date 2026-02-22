"use client";

import useSWR from "swr";
import { fetcher } from "@/lib/api";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { SkeletonLine } from "@/components/Skeleton";

interface EndpointHealth {
  endpoint_id: string;
  name: string;
  status: string;
  total: number;
  delivered: number;
  success_rate: number;
  avg_latency_ms: number;
}

function getHealthColor(rate: number) {
  if (rate >= 95) return "#34d399";
  if (rate >= 80) return "#fbbf24";
  return "#fb7185";
}

function HealthTooltip({ active, payload, label }: { active?: boolean; payload?: { payload: EndpointHealth }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  const ep = payload[0].payload;
  return (
    <div className="bg-elevated border border-border rounded-lg px-3 py-2 text-sm">
      <p className="text-text-primary font-medium">{label}</p>
      <p className="text-text-secondary mt-1">
        {ep.success_rate}% ({ep.delivered}/{ep.total}) &middot; {ep.avg_latency_ms}ms avg
      </p>
    </div>
  );
}

export function EndpointHealthChart() {
  const { data, isLoading } = useSWR<EndpointHealth[]>(
    "/analytics/endpoint-health",
    fetcher,
    { refreshInterval: 30000 }
  );

  const endpoints = (data ?? []).map((ep) => ({
    ...ep,
    fill: getHealthColor(ep.success_rate),
  }));

  return (
    <div className="bg-surface border border-border rounded-xl p-5">
      <h3 className="text-sm font-medium text-text-muted uppercase tracking-wider mb-4">
        Endpoint Health (24h)
      </h3>
      <div className="h-56">
        {isLoading ? (
          <SkeletonLine className="h-full w-full rounded-lg" />
        ) : endpoints.length === 0 ? (
          <div className="h-full flex items-center justify-center text-text-muted text-sm">
            No endpoints configured
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={endpoints} layout="vertical">
              <CartesianGrid stroke="#26262c" strokeDasharray="3 3" horizontal={false} />
              <XAxis
                type="number"
                domain={[0, 100]}
                tick={{ fill: "#5c5c6a", fontSize: 12 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `${v}%`}
              />
              <YAxis
                type="category"
                dataKey="name"
                tick={{ fill: "#9394a1", fontSize: 12 }}
                axisLine={false}
                tickLine={false}
                width={120}
              />
              <Tooltip content={<HealthTooltip />} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
              <Bar dataKey="success_rate" radius={[0, 4, 4, 0]} maxBarSize={24} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
