"use client";

import { Bookmark, Check, Save, Trash2, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useFilters } from "@/lib/hooks/use-filters";
import { filtersAreEmpty, type Filters } from "@/lib/filters/schema";
import { cn } from "@/lib/utils";

type StoredSegment = {
  id: string;
  name: string;
  siteId: string | null;
  filters: Filters;
};

export function SegmentsDropdown({ siteId }: { siteId: string }) {
  const [open, setOpen] = useState(false);
  const [saveOpen, setSaveOpen] = useState(false);
  const [saveName, setSaveName] = useState("");
  const [segments, setSegments] = useState<StoredSegment[]>([]);
  const [loading, setLoading] = useState(false);
  const { filters, count, replaceAll } = useFilters();
  const canSave = !filtersAreEmpty(filters);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/segments?siteId=${encodeURIComponent(siteId)}`);
      const body = await res.json();
      setSegments(body.segments ?? []);
    } finally {
      setLoading(false);
    }
  }, [siteId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const applySegment = (seg: StoredSegment) => {
    replaceAll(seg.filters);
    setOpen(false);
  };

  const saveCurrent = async () => {
    if (!saveName.trim()) return;
    const res = await fetch("/api/segments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: saveName.trim(),
        siteId,
        filters,
      }),
    });
    if (res.ok) {
      setSaveName("");
      setSaveOpen(false);
      await refresh();
    }
  };

  const deleteSegment = async (id: string) => {
    await fetch(`/api/segments/${id}`, { method: "DELETE" });
    await refresh();
  };

  return (
    <div className="relative">
      <Button
        variant="outline"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <Bookmark size={14} strokeWidth={1.5} />
        Segments
        {segments.length > 0 ? (
          <span className="rounded-full bg-mdf-line-1 px-1.5 text-[10px] font-medium text-mdf-fg-2">
            {segments.length}
          </span>
        ) : null}
      </Button>

      {open ? (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
            aria-hidden
          />
          <div className="absolute right-0 z-50 mt-1 w-72 max-w-[calc(100vw-1.5rem)] rounded-md border border-border bg-card shadow-lg overflow-hidden">
            <div className="flex items-center justify-between px-3 py-2 border-b border-border">
              <span className="text-xs font-medium">Saved segments</span>
              {canSave ? (
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7"
                  onClick={() => {
                    setOpen(false);
                    setSaveOpen(true);
                  }}
                >
                  <Save size={14} strokeWidth={1.5} />
                  Save current
                </Button>
              ) : (
                <span className="text-[11px] text-muted-foreground">
                  {count > 0 ? "—" : "no filter applied"}
                </span>
              )}
            </div>

            <div className="max-h-64 overflow-y-auto">
              {loading ? (
                <div className="p-3 text-xs text-muted-foreground">
                  Loading…
                </div>
              ) : segments.length === 0 ? (
                <div className="p-3 text-xs text-muted-foreground">
                  No saved segments yet. Apply filters and save them for one-click reuse.
                </div>
              ) : (
                <ul>
                  {segments.map((s) => (
                    <li
                      key={s.id}
                      className={cn(
                        "group flex items-center gap-1 px-2 py-1.5 hover:bg-accent/40"
                      )}
                    >
                      <button
                        type="button"
                        onClick={() => applySegment(s)}
                        className="flex-1 text-left flex items-center gap-2 min-w-0"
                      >
                        <Check size={12} strokeWidth={1.5} className="shrink-0 opacity-0 group-hover:opacity-60 transition-opacity" />
                        <span className="truncate text-sm">{s.name}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteSegment(s.id)}
                        className="opacity-0 group-hover:opacity-60 hover:opacity-100 transition-opacity text-destructive p-1"
                        aria-label={`Delete ${s.name}`}
                      >
                        <Trash2 size={14} strokeWidth={1.5} />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </>
      ) : null}

      {saveOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center bg-background/80 backdrop-blur-sm animate-in fade-in"
          onClick={(e) => {
            if (e.target === e.currentTarget) setSaveOpen(false);
          }}
        >
          <div className="mt-24 w-full max-w-md rounded-lg border border-border bg-card p-4 shadow-lg">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-semibold">Save as segment</h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSaveOpen(false)}
              >
                <X size={14} strokeWidth={1.5} />
              </Button>
            </div>
            <Input
              value={saveName}
              onChange={(e) => setSaveName(e.target.value)}
              placeholder="e.g. Mobile US customers"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") void saveCurrent();
                if (e.key === "Escape") setSaveOpen(false);
              }}
            />
            <div className="mt-4 flex justify-end gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSaveOpen(false)}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={saveCurrent}
                disabled={!saveName.trim()}
              >
                Save
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
