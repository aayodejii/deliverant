"use client";

import { useState } from "react";
import useSWR from "swr";
import { apiFetch, fetcher } from "@/lib/api";
import type { Endpoint } from "@/lib/types";
import { LuPlus, LuPencil, LuPause, LuPlay } from "react-icons/lu";

function EndpointForm({
  initial,
  onSubmit,
  onCancel,
  loading,
}: {
  initial?: Partial<Endpoint>;
  onSubmit: (data: Record<string, unknown>) => void;
  onCancel: () => void;
  loading: boolean;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [url, setUrl] = useState(initial?.url ?? "");
  const [secret, setSecret] = useState("");
  const [timeout, setTimeout] = useState(initial?.timeout_seconds ?? 10);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data: Record<string, unknown> = { name, url, timeout_seconds: timeout };
    if (secret) data.secret = secret;
    onSubmit(data);
  };

  const inputClass = "w-full px-3 py-2.5 bg-elevated border border-border rounded-lg text-sm text-text-primary placeholder:text-text-muted";

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-text-muted mb-1.5">Name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} className={inputClass} placeholder="My Endpoint" required />
        </div>
        <div>
          <label className="block text-sm text-text-muted mb-1.5">URL</label>
          <input value={url} onChange={(e) => setUrl(e.target.value)} type="url" className={`${inputClass} font-mono`} placeholder="https://..." required />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-text-muted mb-1.5">
            Secret {initial ? "(blank = keep current)" : ""}
          </label>
          <input value={secret} onChange={(e) => setSecret(e.target.value)} type="password" className={inputClass} placeholder="whsec_..." />
        </div>
        <div>
          <label className="block text-sm text-text-muted mb-1.5">Timeout (s)</label>
          <input value={timeout} onChange={(e) => setTimeout(Number(e.target.value))} type="number" min={1} max={30} className={inputClass} />
        </div>
      </div>
      <div className="flex gap-3 justify-end pt-2">
        <button type="button" onClick={onCancel} className="px-4 py-2 text-sm text-text-secondary hover:text-text-primary transition-colors">
          Cancel
        </button>
        <button type="submit" disabled={loading} className="px-4 py-2 bg-accent text-white text-sm font-medium rounded-lg hover:bg-accent-hover disabled:opacity-50 transition-colors">
          {loading ? "Saving..." : "Save"}
        </button>
      </div>
    </form>
  );
}

export default function EndpointsPage() {
  const { data: endpoints, mutate } = useSWR<Endpoint[]>("/endpoints", fetcher);
  const [showCreate, setShowCreate] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleCreate = async (data: Record<string, unknown>) => {
    setLoading(true);
    try {
      await apiFetch("/endpoints", { method: "POST", body: JSON.stringify(data) });
      await mutate();
      setShowCreate(false);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (id: string, data: Record<string, unknown>) => {
    setLoading(true);
    try {
      await apiFetch(`/endpoints/${id}`, { method: "PATCH", body: JSON.stringify(data) });
      await mutate();
      setEditingId(null);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (ep: Endpoint) => {
    const newStatus = ep.status === "ACTIVE" ? "PAUSED" : "ACTIVE";
    await apiFetch(`/endpoints/${ep.id}`, {
      method: "PATCH",
      body: JSON.stringify({ status: newStatus }),
    });
    await mutate();
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-text-primary">Endpoints</h1>
          <p className="text-text-muted mt-0.5">Manage your webhook destinations</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2 bg-accent text-white text-sm font-medium rounded-lg hover:bg-accent-hover transition-colors"
        >
          <LuPlus size={15} />
          Create Endpoint
        </button>
      </div>

      {showCreate && (
        <div className="bg-surface border border-border rounded-xl p-6 animate-fade-in">
          <h2 className="text-sm font-medium text-text-muted uppercase tracking-wider mb-5">New Endpoint</h2>
          <EndpointForm onSubmit={handleCreate} onCancel={() => setShowCreate(false)} loading={loading} />
        </div>
      )}

      <div className="bg-surface border border-border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left px-4 py-3 text-sm font-medium text-text-muted">Name</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-text-muted">URL</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-text-muted">Status</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-text-muted">Timeout</th>
              <th className="text-right px-4 py-3 text-sm font-medium text-text-muted">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {endpoints?.map((ep) => (
              <tr key={ep.id}>
                {editingId === ep.id ? (
                  <td colSpan={5} className="p-5">
                    <EndpointForm
                      initial={ep}
                      onSubmit={(data) => handleUpdate(ep.id, data)}
                      onCancel={() => setEditingId(null)}
                      loading={loading}
                    />
                  </td>
                ) : (
                  <>
                    <td className="px-4 py-3 font-medium text-text-primary">{ep.name}</td>
                    <td className="px-4 py-3 text-text-secondary font-mono text-sm truncate max-w-xs">{ep.url}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        ep.status === "ACTIVE"
                          ? "bg-delivered/10 text-delivered"
                          : "bg-pending/10 text-pending"
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${ep.status === "ACTIVE" ? "bg-delivered" : "bg-pending"}`} />
                        {ep.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-text-secondary font-mono text-sm">{ep.timeout_seconds}s</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setEditingId(ep.id)}
                          className="p-1.5 rounded-md text-text-muted hover:text-text-primary hover:bg-surface-hover transition-colors"
                          title="Edit"
                        >
                          <LuPencil size={14} />
                        </button>
                        <button
                          onClick={() => handleToggleStatus(ep)}
                          className={`p-1.5 rounded-md transition-colors ${
                            ep.status === "ACTIVE"
                              ? "text-text-muted hover:text-pending hover:bg-pending/10"
                              : "text-text-muted hover:text-delivered hover:bg-delivered/10"
                          }`}
                          title={ep.status === "ACTIVE" ? "Pause" : "Resume"}
                        >
                          {ep.status === "ACTIVE" ? <LuPause size={14} /> : <LuPlay size={14} />}
                        </button>
                      </div>
                    </td>
                  </>
                )}
              </tr>
            ))}
            {(!endpoints || endpoints.length === 0) && (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-text-muted">No endpoints configured</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
