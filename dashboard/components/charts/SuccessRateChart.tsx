"use client";

import useSWR from "swr";
import { fetcher } from "@/lib/api";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { SkeletonLine } from "@/components/Skeleton";

interface RatePoint {
  hour: string;
  rate: number;
  total: number;
}

export function SuccessRateChart() {
  const { data, isLoading } = useSWR<RatePoint[]>(
    "/analytics/success-rate?hours=24",
    fetcher,
    { refreshInterval: 30000 }
  );

  const formatted = (data ?? []).map((d) => ({
    ...d,
    label: new Date(d.hour).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
  }));

  return (
    <div className="bg-surface border border-border rounded-xl p-5">
      <h3 className="text-sm font-medium text-text-muted uppercase tracking-wider mb-4">
        Success Rate
      </h3>
      <div className="h-56">
        {isLoading ? (
          <SkeletonLine className="h-full w-full rounded-lg" />
        ) : formatted.length === 0 ? (
          <div className="h-full flex items-center justify-center text-text-muted text-sm">
            No data in the last 24 hours
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={formatted}>
              <CartesianGrid stroke="#26262c" strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fill: "#5c5c6a", fontSize: 12 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                domain={[0, 100]}
                tick={{ fill: "#5c5c6a", fontSize: 12 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `${v}%`}
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
                formatter={(value: number | undefined) => [`${value ?? 0}%`, "Success Rate"]}
              />
              <Line
                type="monotone"
                dataKey="rate"
                stroke="#10b981"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, fill: "#10b981", stroke: "#111114", strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
