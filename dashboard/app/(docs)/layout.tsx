"use client";

import { useState } from "react";
import Link from "next/link";
import { LuGithub, LuMenu, LuX } from "react-icons/lu";
import { DocsSidebar } from "@/components/docs/DocsSidebar";
import { DocsPrevNext } from "@/components/docs/DocsPrevNext";

export default function DocsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-bg text-text-primary">
      {/* top bar */}
      <header className="fixed top-0 left-0 right-0 z-50 h-14 border-b border-border bg-bg/80 backdrop-blur-xl">
        <div className="h-full px-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden text-text-muted hover:text-text-primary transition-colors"
              aria-label="Toggle sidebar"
            >
              {sidebarOpen ? (
                <LuX className="w-5 h-5" />
              ) : (
                <LuMenu className="w-5 h-5" />
              )}
            </button>
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="w-7 h-7 rounded-lg bg-accent/15 flex items-center justify-center group-hover:bg-accent/20 transition-colors">
                <div className="w-2 h-2 rounded-full bg-accent" />
              </div>
              <span className="font-semibold text-[15px] tracking-tight">
                Deliverant
              </span>
            </Link>
            <span className="text-border/60 select-none">·</span>
            <span className="text-[10px] font-mono text-text-muted/60 tracking-[0.18em] uppercase">
              Docs
            </span>
          </div>

          <div className="flex items-center gap-5">
            <a
              href="https://github.com/aayodejii/deliverant"
              target="_blank"
              rel="noopener noreferrer"
              className="text-text-muted hover:text-text-primary transition-colors"
            >
              <LuGithub className="w-[18px] h-[18px]" />
            </a>
            <Link
              href="/login"
              className="text-[13px] text-text-secondary hover:text-text-primary transition-colors"
            >
              Dashboard
            </Link>
          </div>
        </div>
      </header>

      <DocsSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* main content */}
      <main className="pt-14 lg:pl-64">
        <div className="max-w-[800px] mx-auto px-6 sm:px-8 py-12 lg:py-16">
          {children}
          <DocsPrevNext />
        </div>
      </main>
    </div>
  );
}
