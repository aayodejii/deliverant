"use client";

import { useState } from "react";
import { apiFetch } from "@/lib/api";
import { toast } from "sonner";
import { LuRotateCcw, LuCircleCheck, LuInfo } from "react-icons/lu";

interface ReplayResult {
  batch_id: string;
  created_deliveries: number;
  dry_run: boolean;
}

export default function ReplaysPage() {
  const [deliveryIds, setDeliveryIds] = useState("");
  const [dryRun, setDryRun] = useState(true);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ReplayResult | null>(null);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setResult(null);
    setLoading(true);

    const ids = deliveryIds
      .split(/[\n,]+/)
      .map((s) => s.trim())
      .filter(Boolean);

    if (ids.length === 0) {
      setError("Enter at least one delivery ID");
      setLoading(false);
      return;
    }

    try {
      const data = await apiFetch<ReplayResult>("/replays", {
        method: "POST",
        body: JSON.stringify({ delivery_ids: ids, dry_run: dryRun }),
      });
      setResult(data);
      if (data.dry_run) {
        toast.success(`Dry run complete — ${data.created_deliveries} deliveries would be created`);
      } else {
        toast.success(`Replay created — ${data.created_deliveries} deliveries queued`);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to create replay";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-xl font-semibold text-text-primary">Replays</h1>
        <p className="text-text-muted mt-0.5">Re-deliver failed or expired webhooks</p>
      </div>

      <div className="bg-surface border border-border rounded-xl p-6">
        <h2 className="text-sm font-medium text-text-muted uppercase tracking-wider mb-5">Create Replay Batch</h2>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm text-text-muted mb-1.5">Delivery IDs</label>
            <textarea
              value={deliveryIds}
              onChange={(e) => setDeliveryIds(e.target.value)}
              rows={6}
              className="w-full px-3 py-2.5 bg-elevated border border-border rounded-lg text-sm font-mono text-text-primary placeholder:text-text-muted resize-none"
              placeholder={"Paste delivery IDs, one per line or comma-separated\n\n550e8400-e29b-41d4-a716-446655440000\n6ba7b810-9dad-11d1-80b4-00c04fd430c8"}
            />
          </div>

          <div className="flex items-center gap-2.5">
            <input
              id="dryRun"
              type="checkbox"
              checked={dryRun}
              onChange={(e) => setDryRun(e.target.checked)}
              className="w-4 h-4 rounded border-border bg-elevated accent-accent"
            />
            <label htmlFor="dryRun" className="text-sm text-text-secondary">
              Dry run — validate without creating deliveries
            </label>
          </div>

          {error && (
            <div className="bg-failed/10 border border-failed/20 rounded-lg px-3 py-2">
              <p className="text-sm text-failed">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2.5 bg-accent text-white text-sm font-medium rounded-lg hover:bg-accent-hover disabled:opacity-50 transition-colors"
          >
            <LuRotateCcw size={14} className={loading ? "animate-spin" : ""} />
            {loading ? "Creating..." : "Create Replay"}
          </button>
        </form>
      </div>

      {result && (
        <div className={`border rounded-xl p-5 animate-fade-in ${
          result.dry_run
            ? "bg-scheduled/10 border-scheduled/20"
            : "bg-delivered/10 border-delivered/20"
        }`}>
          <div className="flex items-start gap-3">
            {result.dry_run ? (
              <LuInfo size={18} className="text-scheduled mt-0.5 shrink-0" />
            ) : (
              <LuCircleCheck size={18} className="text-delivered mt-0.5 shrink-0" />
            )}
            <div>
              <h3 className={`text-sm font-medium ${result.dry_run ? "text-scheduled" : "text-delivered"}`}>
                {result.dry_run ? "Dry Run Complete" : "Replay Created"}
              </h3>
              <div className="mt-2 text-sm space-y-1 text-text-secondary">
                <p>Batch ID: <span className="font-mono text-text-primary">{result.batch_id}</span></p>
                <p>Deliveries {result.dry_run ? "would be" : ""} created: <span className="font-mono text-text-primary">{result.created_deliveries}</span></p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
