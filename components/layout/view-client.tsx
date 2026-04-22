"use client";

import { useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { nanoid } from "nanoid";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { GridCanvas, type GridItem } from "./grid-canvas";
import { AddWidgetPalette } from "./add-widget-palette";
import { FilterBar } from "./filter-bar";
import { SegmentsDropdown } from "./segments-dropdown";
import { ShareDialog } from "./share-dialog";
import { Button } from "@/components/ui/button";
import { useDateRangeState } from "@/lib/hooks/use-date-range";
import { downloadCsv, rowsToCsv } from "@/lib/utils/csv";
import type { WidgetDefinition } from "@/widgets";

type Props = {
  viewId: string;
  siteId: string;
  currency: string;
  initialItems: GridItem[];
  editMode: boolean;
  readHref: string;
  editHref: string;
};

function nextPosition(items: GridItem[]): { x: number; y: number } {
  const maxY = items.reduce((acc, it) => Math.max(acc, it.y + it.h), 0);
  return { x: 0, y: maxY };
}

export function ViewClient({
  viewId,
  siteId,
  currency,
  initialItems,
  editMode,
  readHref,
  editHref,
}: Props) {
  const t = useTranslations("dashboard.editMode");
  const tShare = useTranslations("dialogs.share");
  const router = useRouter();
  const { resolved } = useDateRangeState();

  const [items, setItems] = useState<GridItem[]>(initialItems);
  const itemsRef = useRef<GridItem[]>(initialItems);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingItems = useRef<GridItem[] | null>(null);
  const inflightSave = useRef<Promise<void> | null>(null);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">(
    "idle"
  );
  const [shareOpen, setShareOpen] = useState(false);
  const [exporting, setExporting] = useState(false);

  // Keep a ref in sync with the latest items so flushAndWait can persist the
  // authoritative current state without chasing stale closures.
  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  // Only reset local state to server state when the viewId actually changes.
  // Guarding on initialItems alone caused unrelated parent re-renders to wipe
  // in-progress edits when Next handed down a fresh array reference.
  const lastResetKey = useRef<string>("");
  useEffect(() => {
    const key = `${viewId}:${editMode}`;
    if (lastResetKey.current !== key) {
      lastResetKey.current = key;
      setItems(initialItems);
    }
  }, [viewId, editMode, initialItems]);

  const doSave = useCallback(
    async (next: GridItem[], opts?: { keepalive?: boolean }) => {
      setSaveState("saving");
      try {
        const res = await fetch(`/api/views/${viewId}/layout`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ items: next }),
          keepalive: opts?.keepalive,
        });
        if (!res.ok) throw new Error(await res.text());
        // Only clear pending if nothing newer was queued while this save was
        // in flight. Unconditionally wiping wipes edits the user made mid-
        // request, which then makes Done's flushAndWait skip saving them.
        if (pendingItems.current === next) pendingItems.current = null;
        setSaveState("saved");
        window.setTimeout(() => setSaveState("idle"), 1500);
      } catch {
        setSaveState("error");
      }
    },
    [viewId]
  );

  // Tracks the in-flight save so flushAndWait can serialize on top of it
  // rather than firing a concurrent PUT that might land out of order.
  const trackSave = useCallback(
    (next: GridItem[], opts?: { keepalive?: boolean }): Promise<void> => {
      const p = doSave(next, opts);
      inflightSave.current = p;
      p.finally(() => {
        if (inflightSave.current === p) inflightSave.current = null;
      });
      return p;
    },
    [doSave]
  );

  const persist = useCallback(
    (next: GridItem[]) => {
      if (!editMode) return;
      pendingItems.current = next;
      if (saveTimer.current) clearTimeout(saveTimer.current);
      setSaveState("saving");
      saveTimer.current = setTimeout(() => {
        saveTimer.current = null;
        void trackSave(next);
      }, 500);
    },
    [editMode, trackSave]
  );

  // Fire-and-forget flush. Used on pagehide / beforeunload where we can't
  // await anything — `keepalive: true` tells the browser to finish the
  // request even if the page is unloading.
  const flushNow = useCallback(() => {
    if (saveTimer.current) {
      clearTimeout(saveTimer.current);
      saveTimer.current = null;
    }
    const pending = pendingItems.current;
    if (pending) {
      pendingItems.current = null;
      void trackSave(pending, { keepalive: true });
    }
  }, [trackSave]);

  // Awaitable flush for interactive transitions (Done button). We MUST wait
  // for the save to land before navigating, otherwise the read page SSRs
  // from stale DB rows and the user sees their edits reset.
  const flushAndWait = useCallback(async () => {
    if (saveTimer.current) {
      clearTimeout(saveTimer.current);
      saveTimer.current = null;
    }
    // Wait for any save already in flight so our Done save layers on top of
    // a known DB state rather than racing a concurrent PUT that could
    // overwrite it with older items.
    if (inflightSave.current) {
      try {
        await inflightSave.current;
      } catch {}
    }
    // Always persist the current items as the authoritative truth on Done.
    // Relying on pendingItems alone is fragile: a save that finished mid-
    // drag could have cleared pending even though items2 is the real latest.
    pendingItems.current = null;
    await trackSave(itemsRef.current);
  }, [trackSave]);

  const [navigating, setNavigating] = useState(false);
  const handleDone = useCallback(async () => {
    setNavigating(true);
    try {
      await flushAndWait();
      // Invalidate the Router Cache BEFORE navigating. If we push first,
      // Next can serve a prefetched RSC payload for /view/:id that predates
      // our save, which renders the old layout and looks like a reset.
      router.refresh();
      router.push(readHref);
    } finally {
      setNavigating(false);
    }
  }, [flushAndWait, router, readHref]);

  useEffect(() => {
    if (!editMode) return;
    const onHide = () => flushNow();
    window.addEventListener("pagehide", onHide);
    window.addEventListener("beforeunload", onHide);
    return () => {
      window.removeEventListener("pagehide", onHide);
      window.removeEventListener("beforeunload", onHide);
      flushNow();
    };
  }, [editMode, flushNow]);

  const handleChange = useCallback(
    (next: GridItem[]) => {
      setItems(next);
      persist(next);
    },
    [persist]
  );

  const exportCsv = useCallback(async () => {
    setExporting(true);
    try {
      const path =
        siteId === "unified"
          ? "aggregate/analytics/timeseries"
          : `${encodeURIComponent(siteId)}/analytics/timeseries`;
      const params = new URLSearchParams({
        fields: "visitors,sessions,revenue,conversion_rate,bounce_rate,name",
        interval: "day",
        startAt: resolved.startAt,
        endAt: resolved.endAt,
      });
      const res = await fetch(`/api/datafast/${path}?${params.toString()}`);
      if (!res.ok) throw new Error(`Export failed (${res.status})`);
      const envelope = (await res.json()) as {
        data?: Array<Record<string, unknown>>;
      };
      const rows = envelope.data ?? [];
      if (rows.length === 0) {
        alert("No data to export for the selected range.");
        return;
      }
      const csv = rowsToCsv(rows, [
        "name",
        "timestamp",
        "visitors",
        "sessions",
        "revenue",
        "conversion_rate",
        "bounce_rate",
      ]);
      const safeSite = siteId === "unified" ? "unified" : siteId;
      downloadCsv(
        `datafast-${safeSite}-${resolved.startAt}_to_${resolved.endAt}.csv`,
        csv,
      );
    } catch (err) {
      alert(err instanceof Error ? err.message : "Export failed");
    } finally {
      setExporting(false);
    }
  }, [siteId, resolved.startAt, resolved.endAt]);

  const handlePick = useCallback(
    (def: WidgetDefinition<unknown>) => {
      setItems((prev) => {
        const { x, y } = nextPosition(prev);
        const fresh: GridItem = {
          id: nanoid(12),
          widgetType: def.id,
          x,
          y,
          w: def.defaultSize.w,
          h: def.defaultSize.h,
          configJson: JSON.stringify(def.defaultConfig ?? {}),
        };
        const next = [...prev, fresh];
        persist(next);
        return next;
      });
    },
    [persist]
  );

  const saveIndicator = useMemo(() => {
    if (!editMode) return null;
    const labels: Record<typeof saveState, string> = {
      idle: "",
      saving: t("saving"),
      saved: t("saved"),
      error: t("saveFailed"),
    };
    const colors: Record<typeof saveState, string> = {
      idle: "text-muted-foreground",
      saving: "text-muted-foreground",
      saved: "text-emerald-500",
      error: "text-destructive",
    };
    const label = labels[saveState];
    if (!label) return null;
    return <span className={`text-xs ${colors[saveState]}`}>{label}</span>;
  }, [editMode, saveState, t]);

  return (
    <div className="space-y-4">
      {/* Filter bar + segments + edit toggle */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <FilterBar />
        <div className="flex items-center gap-2 shrink-0">
          <SegmentsDropdown siteId={siteId} />
          <Button
            variant="outline"
            onClick={exportCsv}
            disabled={exporting}
            className="hidden md:inline-flex"
            title="Download daily metrics as CSV for the selected date range"
          >
            {exporting ? "Exporting…" : "Export CSV"}
          </Button>
          {siteId !== "unified" ? (
            <Button
              variant="outline"
              onClick={() => setShareOpen(true)}
              className="hidden md:inline-flex"
            >
              {tShare("shareCta")}
            </Button>
          ) : null}
          {editMode ? (
            <Button
              variant="outline"
              onClick={handleDone}
              disabled={navigating || saveState === "saving"}
            >
              {navigating || saveState === "saving" ? t("saving") : t("done")}
            </Button>
          ) : (
            // Layout editing is disabled on sub-md viewports (react-grid-layout
            // can't really handle 1-col drag + the UI crushes), so don't offer
            // the entry point there either.
            <Link href={editHref} className="hidden md:inline-block">
              <Button variant="outline">{t("editLayout")}</Button>
            </Link>
          )}
        </div>
      </div>

      {/* Palette + save indicator only in edit mode */}
      {editMode ? (
        <div className="flex items-center gap-3">
          <AddWidgetPalette onPick={handlePick} />
          {saveIndicator}
        </div>
      ) : null}

      <GridCanvas
        viewId={viewId}
        siteId={siteId}
        currency={currency}
        dateRange={resolved}
        items={items}
        editMode={editMode}
        onChange={handleChange}
      />

      <ShareDialog
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        viewId={viewId}
      />
    </div>
  );
}
