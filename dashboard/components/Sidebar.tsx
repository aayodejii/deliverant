"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LuLayoutDashboard, LuPlug, LuPackage, LuRotateCcw, LuLogOut, LuZap } from "react-icons/lu";
import type { IconType } from "react-icons";

const navItems: { href: string; label: string; icon: IconType }[] = [
  { href: "/", label: "Overview", icon: LuLayoutDashboard },
  { href: "/endpoints", label: "Endpoints", icon: LuPlug },
  { href: "/deliveries", label: "Deliveries", icon: LuPackage },
  { href: "/replays", label: "Replays", icon: LuRotateCcw },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  };

  return (
    <aside className="w-56 flex flex-col border-r border-border bg-surface">
      <div className="px-5 py-5">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-accent flex items-center justify-center">
            <LuZap size={14} className="text-white" />
          </div>
          <span className="text-base font-semibold tracking-tight text-text-primary">Deliverant</span>
        </div>
      </div>

      <nav className="flex-1 px-3 space-y-px">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
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
              <Icon size={16} className={isActive ? "text-accent" : "text-text-muted"} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="px-3 py-4 border-t border-border">
        <button
          onClick={handleLogout}
          className="flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-sm text-text-muted hover:text-text-secondary transition-colors"
        >
          <LuLogOut size={15} />
          Log out
        </button>
      </div>
    </aside>
  );
}
