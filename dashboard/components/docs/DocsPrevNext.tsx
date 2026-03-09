"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LuArrowLeft, LuArrowRight } from "react-icons/lu";
import { DOCS_PAGES } from "./docsNav";

export function DocsPrevNext() {
  const pathname = usePathname();
  const index = DOCS_PAGES.findIndex((p) => p.href === pathname);
  if (index === -1) return null;

  const prev = index > 0 ? DOCS_PAGES[index - 1] : null;
  const next = index < DOCS_PAGES.length - 1 ? DOCS_PAGES[index + 1] : null;

  return (
    <div className="mt-16 pt-8 border-t border-border/60 flex items-stretch gap-3">
      {prev ? (
        <Link
          href={prev.href}
          className="group flex-1 flex items-center gap-3 px-5 py-4 rounded-xl border border-border/80 bg-surface/20 hover:bg-surface/50 hover:border-border-hover transition-all duration-200"
        >
          <LuArrowLeft className="w-4 h-4 text-text-muted/50 group-hover:text-accent group-hover:-translate-x-0.5 transition-all shrink-0" />
          <div className="min-w-0">
            <p className="text-[10px] font-mono text-text-muted/50 tracking-[0.15em] uppercase mb-0.5">
              Previous
            </p>
            <p className="text-[13px] font-medium text-text-secondary group-hover:text-text-primary transition-colors truncate">
              {prev.name}
            </p>
          </div>
        </Link>
      ) : (
        <div className="flex-1" />
      )}

      {next ? (
        <Link
          href={next.href}
          className="group flex-1 flex items-center justify-end gap-3 px-5 py-4 rounded-xl border border-border/80 bg-surface/20 hover:bg-surface/50 hover:border-border-hover transition-all duration-200 text-right"
        >
          <div className="min-w-0">
            <p className="text-[10px] font-mono text-text-muted/50 tracking-[0.15em] uppercase mb-0.5">
              Next
            </p>
            <p className="text-[13px] font-medium text-text-secondary group-hover:text-text-primary transition-colors truncate">
              {next.name}
            </p>
          </div>
          <LuArrowRight className="w-4 h-4 text-text-muted/50 group-hover:text-accent group-hover:translate-x-0.5 transition-all shrink-0" />
        </Link>
      ) : (
        <div className="flex-1" />
      )}
    </div>
  );
}
