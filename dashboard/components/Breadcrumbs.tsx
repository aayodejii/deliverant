"use client";

import Link from "next/link";
import { LuChevronRight } from "react-icons/lu";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

export function Breadcrumbs({ items }: { items: BreadcrumbItem[] }) {
  return (
    <nav className="flex flex-wrap items-center gap-1.5 text-sm mb-3">
      {items.map((item, i) => {
        const isLast = i === items.length - 1;
        return (
          <span key={i} className="flex items-center gap-1.5">
            {i > 0 && <LuChevronRight size={13} className="text-text-muted" />}
            {isLast || !item.href ? (
              <span className="text-text-secondary font-mono text-xs">{item.label}</span>
            ) : (
              <Link
                href={item.href}
                className="text-text-muted hover:text-text-secondary transition-colors"
              >
                {item.label}
              </Link>
            )}
          </span>
        );
      })}
    </nav>
  );
}
