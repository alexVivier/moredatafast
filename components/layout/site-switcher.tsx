"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, Globe } from "lucide-react";

import { cn } from "@/lib/utils";

export type SiteSwitcherEntry = {
  viewId: string;
  label: string;
  domain?: string;
  logoUrl?: string | null;
};

export function SiteSwitcher({
  current,
  entries,
}: {
  current: string;
  entries: SiteSwitcherEntry[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickAway(e: MouseEvent) {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickAway);
    return () => document.removeEventListener("mousedown", onClickAway);
  }, []);

  const active = entries.find((e) => e.viewId === current) ?? entries[0];
  const activeLabel = active?.label ?? "Select site";

  return (
    <div ref={ref} className="relative">
      <button type="button" onClick={() => setOpen((v) => !v)} className="mdf-picker">
        <Globe size={14} strokeWidth={1.5} className="text-mdf-fg-2" aria-hidden />
        <span className="max-w-[180px] truncate">
          {activeLabel}
          {active?.domain ? (
            <span className="text-mdf-fg-3"> — {active.domain}</span>
          ) : null}
        </span>
        <ChevronDown size={14} strokeWidth={1.5} className="text-mdf-fg-3" aria-hidden />
      </button>

      {open ? (
        <div className="absolute right-0 top-full z-50 mt-1 w-72 max-w-[calc(100vw-1.5rem)] rounded-md border border-mdf-line-2 bg-mdf-bg-raised shadow-[var(--mdf-shadow-popover)]">
          <div className="mdf-micro px-3 py-2">Sites</div>
          <div className="max-h-72 overflow-y-auto">
            {entries.length === 0 ? (
              <div className="px-3 py-2 text-xs text-mdf-fg-3">No sites yet</div>
            ) : (
              entries.map((entry) => {
                const isActive = entry.viewId === current;
                return (
                  <button
                    key={entry.viewId}
                    type="button"
                    onClick={() => {
                      setOpen(false);
                      if (entry.viewId !== current) router.push(`/view/${entry.viewId}`);
                    }}
                    className={cn(
                      "flex w-full items-center gap-2 px-3 py-2 text-sm text-left hover:bg-mdf-line-1",
                      isActive && "text-mdf-fg-1",
                    )}
                  >
                    <span className="flex-1 truncate">
                      {entry.label}
                      {entry.domain ? (
                        <span className="text-mdf-fg-3"> — {entry.domain}</span>
                      ) : null}
                    </span>
                    {isActive ? <span className="text-mdf-brand" aria-hidden>●</span> : null}
                  </button>
                );
              })
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
