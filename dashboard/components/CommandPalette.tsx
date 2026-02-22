"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  LuLayoutDashboard,
  LuPlug,
  LuPackage,
  LuRotateCcw,
  LuSearch,
} from "react-icons/lu";
import type { IconType } from "react-icons";

interface Command {
  id: string;
  label: string;
  icon: IconType;
  action: () => void;
  section: string;
}

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const commands: Command[] = [
    { id: "overview", label: "Go to Overview", icon: LuLayoutDashboard, action: () => router.push("/"), section: "Navigation" },
    { id: "endpoints", label: "Go to Endpoints", icon: LuPlug, action: () => router.push("/endpoints"), section: "Navigation" },
    { id: "deliveries", label: "Go to Deliveries", icon: LuPackage, action: () => router.push("/deliveries"), section: "Navigation" },
    { id: "replays", label: "Go to Replays", icon: LuRotateCcw, action: () => router.push("/replays"), section: "Navigation" },
  ];

  const filtered = query
    ? commands.filter((c) => c.label.toLowerCase().includes(query.toLowerCase()))
    : commands;

  const sections = [...new Set(filtered.map((c) => c.section))];

  const execute = useCallback(
    (command: Command) => {
      setOpen(false);
      setQuery("");
      command.action();
    },
    []
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
        setQuery("");
        setActiveIndex(0);
      }

      if (e.key === "Escape" && open) {
        e.preventDefault();
        setOpen(false);
        setQuery("");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  useEffect(() => {
    if (open) {
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((prev) => (prev + 1) % filtered.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((prev) => (prev - 1 + filtered.length) % filtered.length);
    } else if (e.key === "Enter" && filtered[activeIndex]) {
      e.preventDefault();
      execute(filtered[activeIndex]);
    }
  };

  useEffect(() => {
    const activeEl = listRef.current?.querySelector("[data-active='true']");
    activeEl?.scrollIntoView({ block: "nearest" });
  }, [activeIndex]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh]">
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm animate-overlay-in"
        onClick={() => {
          setOpen(false);
          setQuery("");
        }}
      />

      <div className="relative w-full max-w-lg bg-surface border border-border rounded-xl shadow-2xl overflow-hidden animate-palette-in">
        <div className="flex items-center gap-3 px-4 border-b border-border">
          <LuSearch size={16} className="text-text-muted shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a command or search..."
            className="flex-1 py-3.5 bg-transparent text-sm text-text-primary placeholder:text-text-muted outline-none border-none focus:ring-0 focus:shadow-none"
            style={{ boxShadow: "none" }}
          />
          <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-elevated border border-border rounded text-[10px] text-text-muted font-mono">
            ESC
          </kbd>
        </div>

        <div ref={listRef} className="max-h-72 overflow-y-auto py-2">
          {filtered.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-text-muted">
              No results found
            </div>
          ) : (
            sections.map((section) => (
              <div key={section}>
                <div className="px-4 pt-2 pb-1">
                  <span className="text-[11px] font-medium text-text-muted uppercase tracking-wider">
                    {section}
                  </span>
                </div>
                {filtered
                  .filter((c) => c.section === section)
                  .map((command) => {
                    const index = filtered.indexOf(command);
                    const isActive = index === activeIndex;
                    const Icon = command.icon;
                    return (
                      <button
                        key={command.id}
                        data-active={isActive}
                        onClick={() => execute(command)}
                        onMouseEnter={() => setActiveIndex(index)}
                        className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors cursor-pointer ${
                          isActive
                            ? "bg-white/[0.06] text-text-primary"
                            : "text-text-secondary hover:text-text-primary"
                        }`}
                      >
                        <Icon
                          size={16}
                          className={isActive ? "text-accent" : "text-text-muted"}
                        />
                        {command.label}
                      </button>
                    );
                  })}
              </div>
            ))
          )}
        </div>

        <div className="border-t border-border px-4 py-2 flex items-center gap-4 text-[11px] text-text-muted">
          <span className="flex items-center gap-1">
            <kbd className="px-1 py-0.5 bg-elevated border border-border rounded font-mono">&#8593;</kbd>
            <kbd className="px-1 py-0.5 bg-elevated border border-border rounded font-mono">&#8595;</kbd>
            navigate
          </span>
          <span className="flex items-center gap-1">
            <kbd className="px-1 py-0.5 bg-elevated border border-border rounded font-mono">&#9166;</kbd>
            select
          </span>
          <span className="flex items-center gap-1">
            <kbd className="px-1 py-0.5 bg-elevated border border-border rounded font-mono">esc</kbd>
            close
          </span>
        </div>
      </div>
    </div>
  );
}
