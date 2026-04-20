"use client";

import { Plus, X } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
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
      <Button onClick={() => setOpen(true)} size="sm">
        <Plus className="h-4 w-4" />
        Add widget
      </Button>

      {open ? (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center bg-background/80 backdrop-blur-sm animate-in fade-in"
          onClick={(e) => {
            if (e.target === e.currentTarget) setOpen(false);
          }}
        >
          <div className="mt-4 sm:mt-16 mx-3 sm:mx-0 w-full max-w-[calc(100vw-1.5rem)] sm:max-w-3xl rounded-lg border border-border bg-card text-card-foreground shadow-lg">
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <div>
                <h2 className="font-semibold">Add widget</h2>
                <p className="text-xs text-muted-foreground">
                  Pick one to drop it into your dashboard.
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setOpen(false)}
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </Button>
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
                    <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2">
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
                            "flex flex-col items-start gap-1 rounded-md border border-border bg-background p-3 text-left transition-colors",
                            "hover:border-primary/40 hover:bg-accent/50"
                          )}
                        >
                          <div className="flex items-center justify-between w-full">
                            <span className="font-medium text-sm">
                              {def.displayName}
                            </span>
                            <span className="text-xs text-muted-foreground tabular-nums">
                              {def.defaultSize.w}×{def.defaultSize.h}
                            </span>
                          </div>
                          {def.description ? (
                            <span className="text-xs text-muted-foreground leading-snug">
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
