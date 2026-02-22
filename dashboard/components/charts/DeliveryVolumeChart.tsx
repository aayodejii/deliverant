"use client";

import useSWR from "swr";
import { fetcher } from "@/lib/api";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface VolumePoint {
  hour: string;
  total: number;
  delivered: number;
  failed: number;
}

export function DeliveryVolumeChart() {
  const { data } = useSWR<VolumePoint[]>(
    "/analytics/delivery-volume?hours=24",
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
        Delivery Volume
      </h3>
      <div className="h-56">
        {formatted.length === 0 ? (
          <div className="h-full flex items-center justify-center text-text-muted text-sm">
            No data in the last 24 hours
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={formatted}>
              <defs>
                <linearGradient id="deliveredGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#34d399" stopOpacity={0.2} />
                  <stop offset="100%" stopColor="#34d399" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="failedGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#fb7185" stopOpacity={0.15} />
                  <stop offset="100%" stopColor="#fb7185" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#26262c" strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fill: "#5c5c6a", fontSize: 12 }}
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
              />
              <Area
                type="monotone"
                dataKey="delivered"
                stroke="#34d399"
                strokeWidth={1.5}
                fill="url(#deliveredGrad)"
              />
              <Area
                type="monotone"
                dataKey="failed"
                stroke="#fb7185"
                strokeWidth={1.5}
                fill="url(#failedGrad)"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
