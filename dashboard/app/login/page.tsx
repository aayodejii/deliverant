"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { LuZap, LuArrowRight, LuChevronDown } from "react-icons/lu";
import { FaGoogle, FaGithub } from "react-icons/fa";

export default function LoginPage() {
  const [apiKey, setApiKey] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  const oauthError = searchParams.get("error");

  const handleApiKeySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ api_key: apiKey }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Invalid API key");
        return;
      }

      router.push("/dashboard");
    } catch {
      setError("Failed to connect");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-accent/[0.03] rounded-full blur-[100px] pointer-events-none" />

      <div className="relative w-full max-w-sm px-6 animate-fade-in">
        <div className="flex flex-col items-center mb-8">
          <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center mb-4">
            <LuZap size={20} className="text-white" />
          </div>
          <h1 className="text-xl font-semibold tracking-tight text-text-primary">Deliverant</h1>
          <p className="text-sm text-text-muted mt-1">Webhook reliability platform</p>
        </div>

        <div className="bg-surface border border-border rounded-xl p-6 space-y-5">
          <div>
            <h2 className="text-base font-semibold text-text-primary">Sign in</h2>
            <p className="text-sm text-text-muted mt-1">Continue with your account</p>
          </div>

          {(oauthError || error) && (
            <div className="bg-failed/10 border border-failed/20 rounded-lg px-3 py-2">
              <p className="text-sm text-failed">
                {error || "Authentication failed. Please try again."}
              </p>
            </div>
          )}

          <div className="space-y-3">
            <a
              href="/api/auth/authorize/google"
              className="w-full flex items-center justify-center gap-3 py-2.5 bg-elevated border border-border rounded-lg text-sm text-text-primary hover:bg-border/50 transition-colors"
            >
              <FaGoogle size={16} />
              Continue with Google
            </a>
            <a
              href="/api/auth/authorize/github"
              className="w-full flex items-center justify-center gap-3 py-2.5 bg-elevated border border-border rounded-lg text-sm text-text-primary hover:bg-border/50 transition-colors"
            >
              <FaGithub size={16} />
              Continue with GitHub
            </a>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs text-text-muted">or</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          <button
            type="button"
            onClick={() => setShowApiKey(!showApiKey)}
            className="w-full flex items-center justify-center gap-1.5 text-sm text-text-muted hover:text-text-primary transition-colors"
          >
            Sign in with API key
            <LuChevronDown size={14} className={`transition-transform ${showApiKey ? "rotate-180" : ""}`} />
          </button>

          {showApiKey && (
            <form onSubmit={handleApiKeySubmit} className="space-y-4">
              <div>
                <label htmlFor="apiKey" className="block text-sm text-text-muted mb-1.5">API Key</label>
                <input
                  id="apiKey"
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="sk_live_..."
                  className="w-full px-3 py-2.5 bg-elevated border border-border rounded-lg text-sm text-text-primary placeholder:text-text-muted font-mono"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="group w-full flex items-center justify-center gap-2 py-2.5 bg-accent text-white text-sm font-medium rounded-lg hover:bg-accent-hover disabled:opacity-50 transition-colors"
              >
                {loading ? "Authenticating..." : (
                  <>Continue <LuArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" /></>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
