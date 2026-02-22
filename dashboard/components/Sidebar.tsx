"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import useSWR from "swr";
import { fetcher } from "@/lib/api";
import type { PaginatedResponse, Delivery } from "@/lib/types";
import {
  LuLayoutDashboard,
  LuPlug,
  LuPackage,
  LuRotateCcw,
  LuLogOut,
  LuZap,
  LuSearch,
  LuSettings,
  LuEllipsis,
} from "react-icons/lu";
import type { IconType } from "react-icons";

const navItems: { href: string; label: string; icon: IconType }[] = [
  { href: "/", label: "Overview", icon: LuLayoutDashboard },
  { href: "/endpoints", label: "Endpoints", icon: LuPlug },
  { href: "/deliveries", label: "Deliveries", icon: LuPackage },
  { href: "/replays", label: "Replays", icon: LuRotateCcw },
  { href: "/settings", label: "Settings", icon: LuSettings },
];

const mobileTabItems = navItems.filter((item) => item.href !== "/settings");
const mobileMoreItems = navItems.filter((item) => item.href === "/settings");

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [moreOpen, setMoreOpen] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);

  const { data: deliveriesData } = useSWR<PaginatedResponse<Delivery>>(
    "/deliveries",
    fetcher,
    { refreshInterval: 5000 }
  );

  const inProgressCount =
    deliveriesData?.results?.filter((d) =>
      ["PENDING", "SCHEDULED", "IN_PROGRESS"].includes(d.status)
    ).length ?? 0;

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  };

  const openCommandPalette = () => {
    window.dispatchEvent(
      new KeyboardEvent("keydown", { key: "k", metaKey: true })
    );
  };

  useEffect(() => {
    if (!moreOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) {
        setMoreOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [moreOpen]);

  useEffect(() => {
    setMoreOpen(false);
  }, [pathname]);

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-56 h-screen sticky top-0 flex-col border-r border-border bg-surface shrink-0">
        <div className="px-5 py-5">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-accent flex items-center justify-center">
              <LuZap size={14} className="text-white" />
            </div>
            <span className="text-base font-semibold tracking-tight text-text-primary">
              Deliverant
            </span>
          </div>
        </div>

        <nav className="flex-1 px-3 space-y-px">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/" && pathname.startsWith(item.href));
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`relative flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-white/[0.06] text-text-primary"
                    : "text-text-secondary hover:text-text-primary hover:bg-white/[0.03]"
                }`}
              >
                {isActive && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[2px] h-3.5 rounded-r bg-accent" />
                )}
                <Icon
                  size={16}
                  className={isActive ? "text-accent" : "text-text-muted"}
                />
                {item.label}
                {item.href === "/deliveries" && inProgressCount > 0 && (
                  <span className="ml-auto px-1.5 py-0.5 bg-in-progress/15 text-in-progress text-[10px] font-mono rounded-full">
                    {inProgressCount}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="px-3 py-4 space-y-2 border-t border-border">
          <button
            onClick={openCommandPalette}
            className="flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-sm text-text-muted hover:text-text-secondary hover:bg-white/[0.03] transition-colors cursor-pointer"
          >
            <LuSearch size={15} />
            <span className="flex-1 text-left">Search</span>
            <kbd className="px-1.5 py-0.5 bg-elevated border border-border rounded text-[11px] font-mono">
              &#8984;K
            </kbd>
          </button>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-sm text-text-muted hover:text-text-secondary transition-colors cursor-pointer"
          >
            <LuLogOut size={15} />
            Log out
          </button>
        </div>
      </aside>

      {/* Mobile bottom tab bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-surface border-t border-border">
        <nav className="flex items-center justify-around px-2 py-1">
          {mobileTabItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/" && pathname.startsWith(item.href));
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`relative flex flex-col items-center gap-0.5 px-3 py-2 rounded-lg text-[11px] font-medium transition-colors ${
                  isActive ? "text-accent" : "text-text-muted"
                }`}
              >
                <Icon size={20} />
                {item.label}
                {item.href === "/deliveries" && inProgressCount > 0 && (
                  <span className="absolute -top-0.5 right-0.5 w-4 h-4 bg-in-progress text-white text-[9px] font-mono rounded-full flex items-center justify-center">
                    {inProgressCount}
                  </span>
                )}
              </Link>
            );
          })}

          {/* More menu */}
          <div ref={moreRef} className="relative">
            <button
              onClick={() => setMoreOpen(!moreOpen)}
              className={`flex flex-col items-center gap-0.5 px-3 py-2 rounded-lg text-[11px] font-medium transition-colors cursor-pointer ${
                moreOpen || mobileMoreItems.some((item) =>
                  pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href))
                )
                  ? "text-accent"
                  : "text-text-muted"
              }`}
            >
              <LuEllipsis size={20} />
              More
            </button>

            {moreOpen && (
              <div className="absolute bottom-full right-0 mb-2 w-48 bg-surface border border-border rounded-xl shadow-lg overflow-hidden animate-fade-in">
                {mobileMoreItems.map((item) => {
                  const Icon = item.icon;
                  const isActive =
                    pathname === item.href ||
                    (item.href !== "/" && pathname.startsWith(item.href));
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center gap-3 px-4 py-3 text-sm transition-colors ${
                        isActive
                          ? "text-accent bg-white/[0.06]"
                          : "text-text-secondary hover:bg-white/[0.03]"
                      }`}
                    >
                      <Icon size={16} />
                      {item.label}
                    </Link>
                  );
                })}
                <div className="border-t border-border">
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 w-full px-4 py-3 text-sm text-text-muted hover:bg-white/[0.03] transition-colors cursor-pointer"
                  >
                    <LuLogOut size={16} />
                    Log out
                  </button>
                </div>
              </div>
            )}
          </div>
        </nav>
      </div>
    </>
  );
}
