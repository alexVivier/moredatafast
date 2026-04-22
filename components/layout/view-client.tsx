"use client";

import { useTranslations } from "next-intl";
import { useCallback, useEffect, useRef, useState } from "react";
import { nanoid } from "nanoid";
import Link from "next/link";

import { GridCanvas, type GridItem } from "./grid-canvas";
import { AddWidgetPalette } from "./add-widget-palette";
import { FilterBar } from "./filter-bar";
import { SegmentsDropdown } from "./segments-dropdown";
import { ShareDialog } from "./share-dialog";
import { Button } from "@/components/ui/button";
import { useDateRangeState } from "@/lib/hooks/use-date-range";
import { downloadCsv, rowsToCsv } from "@/lib/utils/csv";
import type { WidgetDefinition } from "@/widgets";
import { saveLayoutAndFinish } from "@/app/view/[viewId]/edit/actions";

type Props = {
  viewId: string;
  siteId: string;
  currency: string;
  initialItems: GridItem[];
  editMode: boolean;
  editHref: string;
};

function nextPosition(items: GridItem[]): { x: number; y: number } {
  const maxY = items.reduce((acc, it) => Math.max(acc, it.y + it.h), 0);
  return { x: 0, y: maxY };
}

function isSameLayout(a: GridItem[], b: GridItem[]): boolean {
  if (a === b) return true;
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    const x = a[i];
    const y = b[i];
    if (
      x.id !== y.id ||
      x.widgetType !== y.widgetType ||
      x.x !== y.x ||
      x.y !== y.y ||
      x.w !== y.w ||
      x.h !== y.h ||
      x.configJson !== y.configJson
    ) {
      return false;
    }
  }
  return true;
}

export function ViewClient({
  viewId,
  siteId,
  currency,
  initialItems,
  editMode,
  editHref,
}: Props) {
  const t = useTranslations("dashboard.editMode");
  const tShare = useTranslations("dialogs.share");
  const { resolved } = useDateRangeState();

  // `items` is the in-edit working copy. `baseline` tracks the last layout we
  // know is persisted server-side, so we can derive `isDirty` without calling
  // deep-compare on every render via a memo.
  const [items, setItems] = useState<GridItem[]>(initialItems);
  const [baseline, setBaseline] = useState<GridItem[]>(initialItems);

  const [saveState, setSaveState] = useState<"idle" | "saving" | "error">(
    "idle",
  );
  const [navigating, setNavigating] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [exporting, setExporting] = useState(false);

  // Only reset local state to server state when the viewId or edit mode
  // actually changes. Guarding on initialItems alone caused unrelated parent
  // re-renders to wipe in-progress edits when Next handed down a fresh array
  // reference.
  const lastResetKey = useRef<string>("");
  useEffect(() => {
    const key = `${viewId}:${editMode}`;
    if (lastResetKey.current !== key) {
      lastResetKey.current = key;
      setItems(initialItems);
      setBaseline(initialItems);
      setSaveState("idle");
    }
  }, [viewId, editMode, initialItems]);

  const isDirty = !isSameLayout(items, baseline);

  const handleChange = useCallback((next: GridItem[]) => {
    setItems(next);
  }, []);

  const handlePick = useCallback((def: WidgetDefinition<unknown>) => {
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
      return [...prev, fresh];
    });
  }, []);

  const handleDone = useCallback(async () => {
    if (navigating) return;
    setNavigating(true);
    setSaveState("saving");
    try {
      // saveLayoutAndFinish writes the DB, revalidates the read path, and
      // server-redirects to /view/:id. The redirect() throws NEXT_REDIRECT
      // which Next catches to perform the navigation — so code after the
      // await is only reached on save failure.
      await saveLayoutAndFinish(viewId, items);
    } catch (err) {
      if (
        err &&
        typeof err === "object" &&
        "digest" in err &&
        typeof (err as { digest: unknown }).digest === "string" &&
        (err as { digest: string }).digest.startsWith("NEXT_REDIRECT")
      ) {
        throw err;
      }
      setSaveState("error");
      setNavigating(false);
    }
  }, [viewId, items, navigating]);

  // Warn before the user closes the tab or hits back with unsaved edits.
  // Arm only while editing AND dirty AND not in the middle of a save-then-
  // redirect flow, so a successful Done doesn't trigger the prompt.
  useEffect(() => {
    if (!editMode || !isDirty || navigating) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [editMode, isDirty, navigating]);

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

  const saveIndicator = (() => {
    if (!editMode) return null;
    let label: string | null = null;
    let colorClass = "text-muted-foreground";
    if (saveState === "saving" || navigating) {
      label = t("saving");
    } else if (saveState === "error") {
      label = t("saveFailed");
      colorClass = "text-destructive";
    } else if (isDirty) {
      label = t("unsaved");
      colorClass = "text-amber-500";
    }
    if (!label) return null;
    return <span className={`text-xs ${colorClass}`}>{label}</span>;
  })();

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
            <Button variant="outline" onClick={handleDone} disabled={navigating}>
              {navigating ? t("saving") : t("done")}
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
