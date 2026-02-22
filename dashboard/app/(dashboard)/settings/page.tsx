"use client";

import useSWR from "swr";
import { fetcher } from "@/lib/api";
import type { TenantInfo } from "@/lib/types";
import { SkeletonDetailGrid } from "@/components/Skeleton";
import { LuKey, LuBuilding, LuClock } from "react-icons/lu";

export default function SettingsPage() {
  const { data: tenant } = useSWR<TenantInfo>("/tenant", fetcher);

  if (!tenant) {
    return (
      <div className="space-y-8 animate-fade-in">
        <div>
          <h1 className="text-xl font-semibold text-text-primary">Settings</h1>
          <p className="text-text-muted mt-0.5">Tenant configuration and API keys</p>
        </div>
        <SkeletonDetailGrid />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-xl font-semibold text-text-primary">Settings</h1>
        <p className="text-text-muted mt-0.5">Tenant configuration and API keys</p>
      </div>

      <section className="bg-surface border border-border rounded-xl p-6 space-y-4">
        <h2 className="text-sm font-medium text-text-muted uppercase tracking-wider">
          Tenant
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex items-start gap-3">
            <LuBuilding size={16} className="text-text-muted mt-0.5 shrink-0" />
            <div>
              <p className="text-sm text-text-muted">Name</p>
              <p className="text-sm text-text-primary font-medium mt-0.5">{tenant.name}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <LuClock size={16} className="text-text-muted mt-0.5 shrink-0" />
            <div>
              <p className="text-sm text-text-muted">Created</p>
              <p className="text-sm text-text-primary font-mono mt-0.5">
                {new Date(tenant.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>
        <div>
          <p className="text-sm text-text-muted">Tenant ID</p>
          <p className="text-sm text-text-primary font-mono mt-0.5">{tenant.id}</p>
        </div>
      </section>

      <section className="bg-surface border border-border rounded-xl p-6 space-y-4">
        <h2 className="text-sm font-medium text-text-muted uppercase tracking-wider">
          API Keys
        </h2>
        {tenant.api_keys.length === 0 ? (
          <p className="text-sm text-text-muted">No active API keys</p>
        ) : (
          <div className="space-y-3">
            {tenant.api_keys.map((key) => (
              <div
                key={key.id}
                className="flex items-center gap-3 px-4 py-3 bg-elevated rounded-lg border border-border"
              >
                <LuKey size={14} className="text-text-muted shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-text-primary font-medium">
                    {key.name || "Unnamed key"}
                  </p>
                  <p className="text-xs text-text-muted font-mono mt-0.5">
                    {key.id}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <span className="inline-flex items-center px-2 py-0.5 bg-delivered/15 text-delivered text-xs font-medium rounded-full">
                    {key.status}
                  </span>
                  {key.last_used_at && (
                    <p className="text-xs text-text-muted mt-1">
                      Last used {new Date(key.last_used_at).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="bg-surface border border-border rounded-xl p-6 space-y-4">
        <h2 className="text-sm font-medium text-text-muted uppercase tracking-wider">
          Configuration
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="px-4 py-3 bg-elevated rounded-lg border border-border">
            <p className="text-sm text-text-muted">Dedup Window</p>
            <p className="text-sm text-text-primary font-mono mt-1">72 hours</p>
          </div>
          <div className="px-4 py-3 bg-elevated rounded-lg border border-border">
            <p className="text-sm text-text-muted">Max Attempts</p>
            <p className="text-sm text-text-primary font-mono mt-1">12</p>
          </div>
          <div className="px-4 py-3 bg-elevated rounded-lg border border-border">
            <p className="text-sm text-text-muted">Delivery TTL</p>
            <p className="text-sm text-text-primary font-mono mt-1">72 hours</p>
          </div>
        </div>
      </section>
    </div>
  );
}
