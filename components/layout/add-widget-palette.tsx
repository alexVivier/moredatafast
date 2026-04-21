"use client";

import { Plus, X } from "lucide-react";
import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";
import {
  CATEGORY_LABELS,
  getWidgetsByCategory,
  type WidgetDefinition,
} from "@/widgets";

type Props = {
  onPick: (def: WidgetDefinition<unknown>) => void;
};

export function AddWidgetPalette({ onPick }: Props) {
  const [open, setOpen] = useState(false);
  const [categories] = useState(() => getWidgetsByCategory());

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="mdf-addbtn">
        <Plus size={14} strokeWidth={1.5} />
        Add widget
      </button>

      {open ? (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center bg-mdf-bg-overlay backdrop-blur-sm animate-in fade-in"
          onClick={(e) => {
            if (e.target === e.currentTarget) setOpen(false);
          }}
        >
          <div
            className="mt-4 sm:mt-16 mx-3 sm:mx-0 w-full max-w-[calc(100vw-1.5rem)] sm:max-w-3xl rounded-[14px] border border-mdf-line-2 bg-mdf-bg-raised text-mdf-fg-1"
            style={{ boxShadow: "var(--mdf-shadow-modal)" }}
          >
            <div className="flex items-center justify-between border-b border-mdf-line-1 px-4 py-3">
              <div>
                <h2
                  className="text-mdf-fg-1"
                  style={{
                    fontFamily: "var(--mdf-font-display)",
                    fontSize: "20px",
                    lineHeight: 1.1,
                    letterSpacing: "-0.01em",
                  }}
                >
                  Add widget
                </h2>
                <p className="text-xs text-mdf-fg-3 mt-0.5">
                  Pick one to drop it into your dashboard.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="mdf-widget__close"
              >
                <X size={14} strokeWidth={1.5} />
              </button>
            </div>
            <div className="max-h-[70vh] overflow-y-auto p-4 space-y-6">
              {(
                Object.entries(categories) as [
                  keyof typeof categories,
                  WidgetDefinition<unknown>[],
                ][]
              ).map(([cat, defs]) => {
                if (defs.length === 0) return null;
                return (
                  <div key={cat}>
                    <div className="mdf-micro mb-2">
                      {CATEGORY_LABELS[cat]}
                    </div>
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                      {defs.map((def) => (
                        <button
                          key={def.id}
                          type="button"
                          onClick={() => {
                            onPick(def);
                            setOpen(false);
                          }}
                          className={cn(
                            "flex flex-col items-start gap-1 rounded-md border border-mdf-line-1 bg-mdf-bg-surface p-3 text-left",
                            "transition-colors hover:border-mdf-line-3",
                          )}
                        >
                          <div className="flex items-center justify-between w-full">
                            <span className="font-medium text-sm text-mdf-fg-1">
                              {def.displayName}
                            </span>
                            <span className="text-[11px] text-mdf-fg-3 font-mono tabular-nums">
                              {def.defaultSize.w}×{def.defaultSize.h}
                            </span>
                          </div>
                          {def.description ? (
                            <span className="text-xs text-mdf-fg-2 leading-snug">
                              {def.description}
                            </span>
                          ) : null}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
