"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LuBookOpen,
  LuKey,
  LuRadio,
  LuCalendarClock,
  LuSend,
  LuRotateCcw,
  LuChartBar,
  LuWebhook,
} from "react-icons/lu";

const NAV_SECTIONS = [
  {
    label: "Getting Started",
    items: [
      { name: "Overview", href: "/docs", icon: LuBookOpen },
      { name: "Authentication", href: "/docs/authentication", icon: LuKey },
    ],
  },
  {
    label: "Resources",
    items: [
      { name: "Endpoints", href: "/docs/endpoints", icon: LuRadio },
      { name: "Events", href: "/docs/events", icon: LuCalendarClock },
      { name: "Deliveries", href: "/docs/deliveries", icon: LuSend },
      { name: "Replays", href: "/docs/replays", icon: LuRotateCcw },
    ],
  },
  {
    label: "Platform",
    items: [
      { name: "Analytics", href: "/docs/analytics", icon: LuChartBar },
      { name: "Webhooks", href: "/docs/webhooks", icon: LuWebhook },
    ],
  },
];

export function DocsSidebar({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const pathname = usePathname();

  return (
    <>
      {/* mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed top-14 left-0 bottom-0 w-64 bg-bg border-r border-border z-50 overflow-y-auto transition-transform duration-250 ease-out lg:translate-x-0 lg:z-auto ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* subtle gradient at top */}
        <div className="absolute top-0 left-0 right-0 h-16 bg-gradient-to-b from-accent/[0.02] to-transparent pointer-events-none" />

        <nav className="relative py-8 px-4">
          {NAV_SECTIONS.map((section, si) => (
            <div key={section.label} className={si > 0 ? "mt-8" : ""}>
              <p className="text-[10px] font-mono text-text-muted/70 tracking-[0.18em] uppercase px-3 mb-2.5">
                {section.label}
              </p>
              <ul className="space-y-0.5">
                {section.items.map((item) => {
                  const isActive = pathname === item.href;
                  const Icon = item.icon;
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onClick={onClose}
                        className={`relative flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] transition-all duration-150 ${
                          isActive
                            ? "bg-accent/8 text-accent"
                            : "text-text-secondary hover:text-text-primary hover:bg-surface/60"
                        }`}
                      >
                        {/* active indicator bar */}
                        {isActive && (
                          <span className="absolute left-0 top-1.5 bottom-1.5 w-[2px] rounded-full bg-accent" />
                        )}
                        <Icon
                          className={`w-4 h-4 shrink-0 ${
                            isActive ? "text-accent" : "text-text-muted"
                          }`}
                        />
                        <span className={isActive ? "font-medium" : ""}>
                          {item.name}
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}

          {/* version tag at bottom */}
          <div className="mt-12 px-3">
            <span className="text-[9px] font-mono text-text-muted/40 tracking-[0.15em] uppercase">
              API v1
            </span>
          </div>
        </nav>
      </aside>
    </>
  );
}
