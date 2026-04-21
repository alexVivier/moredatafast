"use client";

import { useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { nanoid } from "nanoid";
import Link from "next/link";

import { GridCanvas, type GridItem } from "./grid-canvas";
import { AddWidgetPalette } from "./add-widget-palette";
import { FilterBar } from "./filter-bar";
import { SegmentsDropdown } from "./segments-dropdown";
import { Button } from "@/components/ui/button";
import { useDateRangeState } from "@/lib/hooks/use-date-range";
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
  const { resolved } = useDateRangeState();

  const [items, setItems] = useState<GridItem[]>(initialItems);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingItems = useRef<GridItem[] | null>(null);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">(
    "idle"
  );

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
        pendingItems.current = null;
        setSaveState("saved");
        window.setTimeout(() => setSaveState("idle"), 1500);
      } catch {
        setSaveState("error");
      }
    },
    [viewId]
  );

  const persist = useCallback(
    (next: GridItem[]) => {
      if (!editMode) return;
      pendingItems.current = next;
      if (saveTimer.current) clearTimeout(saveTimer.current);
      setSaveState("saving");
      saveTimer.current = setTimeout(() => {
        saveTimer.current = null;
        void doSave(next);
      }, 500);
    },
    [editMode, doSave]
  );

  // Flush any debounced save synchronously. Used on navigation, tab hide,
  // and reload. `keepalive: true` tells the browser to complete the request
  // even if the page is unloading.
  const flushNow = useCallback(() => {
    if (saveTimer.current) {
      clearTimeout(saveTimer.current);
      saveTimer.current = null;
    }
    const pending = pendingItems.current;
    if (pending) {
      pendingItems.current = null;
      void doSave(pending, { keepalive: true });
    }
  }, [doSave]);

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
          {editMode ? (
            <Link href={readHref} onClick={() => flushNow()}>
              <Button variant="outline">{t("done")}</Button>
            </Link>
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
    </div>
  );
}
