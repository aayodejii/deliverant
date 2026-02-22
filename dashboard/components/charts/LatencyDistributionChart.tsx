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

interface LatencyBucket {
  bucket: string;
  count: number;
}

export function LatencyDistributionChart() {
  const { data, isLoading } = useSWR<LatencyBucket[]>(
    "/analytics/latency-distribution",
    fetcher,
    { refreshInterval: 30000 }
  );

  return (
    <div className="bg-surface border border-border rounded-xl p-5">
      <h3 className="text-sm font-medium text-text-muted uppercase tracking-wider mb-4">
        Latency Distribution
      </h3>
      <div className="h-56">
        {isLoading ? (
          <SkeletonLine className="h-full w-full rounded-lg" />
        ) : !data || data.every((d) => d.count === 0) ? (
          <div className="h-full flex items-center justify-center text-text-muted text-sm">
            No latency data in the last 24 hours
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid stroke="#26262c" strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="bucket"
                tick={{ fill: "#5c5c6a", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: "#5c5c6a", fontSize: 12 }}
                axisLine={false}
                tickLine={false}
                allowDecimals={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#222228",
                  border: "1px solid #26262c",
                  borderRadius: 8,
                  fontSize: 13,
                  color: "#ededef",
                }}
                labelStyle={{ color: "#9394a1" }}
                formatter={(value: number | undefined) => [value ?? 0, "Attempts"]}
              />
              <Bar
                dataKey="count"
                fill="#a78bfa"
                radius={[4, 4, 0, 0]}
                maxBarSize={40}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
