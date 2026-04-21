"use client";

import { useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo, useState } from "react";
import type {
  Compactor,
  Layout,
  LayoutItem,
  ResponsiveLayouts,
  UseContainerWidthResult,
} from "react-grid-layout";

import "./grid-styles.css";

import { WidgetFrame } from "./widget-frame";
import { getWidget } from "@/widgets";
import "@/widgets";
import type { ResolvedDateRange } from "@/lib/utils/date-range";
import {
  effectiveDateRange,
  parseWidgetMeta,
  writeWidgetMeta,
  type WidgetMeta,
} from "@/widgets/_meta";

type RglModule = typeof import("react-grid-layout");

export type GridItem = {
  id: string;
  widgetType: string;
  x: number;
  y: number;
  w: number;
  h: number;
  configJson: string;
};

type Props = {
  viewId: string;
  siteId: string;
  currency: string;
  dateRange: ResolvedDateRange;
  items: GridItem[];
  editMode: boolean;
  onChange: (items: GridItem[]) => void;
};

const BREAKPOINTS = { lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 };
const COLS = { lg: 12, md: 12, sm: 8, xs: 4, xxs: 1 };

function itemsToLayout(items: GridItem[]): LayoutItem[] {
  return items.map((item) => {
    const def = getWidget(item.widgetType);
    return {
      i: item.id,
      x: item.x,
      y: item.y,
      w: item.w,
      h: item.h,
      minW: def?.minSize?.w,
      minH: def?.minSize?.h,
      maxW: def?.maxSize?.w,
      maxH: def?.maxSize?.h,
    };
  });
}

/**
 * On narrow viewports (≤ `xs`) the 12-col desktop layout collapses into
 * unreadable fractional widgets. Instead we re-stack every widget as a
 * full-width row, preserving the desktop order.
 */
function itemsToStackedLayout(
  items: GridItem[],
  cols: number,
): LayoutItem[] {
  // Preserve the reading order the user set up on desktop (top-to-bottom,
  // left-to-right).
  const ordered = [...items].sort((a, b) => {
    if (a.y !== b.y) return a.y - b.y;
    return a.x - b.x;
  });

  let cursorY = 0;
  return ordered.map((item) => {
    const def = getWidget(item.widgetType);
    const mobileH = def?.mobileSize?.h;
    const h = mobileH != null ? Math.max(item.h, mobileH) : item.h;
    const minH = def?.minSize?.h;
    const maxH = def?.maxSize?.h;
    const row: LayoutItem = {
      i: item.id,
      x: 0,
      y: cursorY,
      w: cols,
      h,
      minW: 1,
      maxW: cols,
      minH,
      maxH,
    };
    cursorY += h;
    return row;
  });
}

function parseConfig<C>(raw: string, fallback: C): C {
  if (!raw) return fallback;
  try {
    const parsed = JSON.parse(raw) as C;
    return parsed ?? fallback;
  } catch {
    return fallback;
  }
}

function useWidgetName() {
  const tNames = useTranslations("widgets.names");
  return (def: { id: string; displayName: string }) => {
    try {
      return tNames(def.id);
    } catch {
      return def.displayName;
    }
  };
}

export function GridCanvas(props: Props) {
  const t = useTranslations("dashboard.empty");
  const [rgl, setRgl] = useState<RglModule | null>(null);

  useEffect(() => {
    let cancelled = false;
    void import("react-grid-layout").then((mod) => {
      if (!cancelled) setRgl(mod);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!rgl) {
    return (
      <div className="rounded-[10px] border border-mdf-line-1 bg-mdf-bg-surface p-6 text-sm text-mdf-fg-3">
        {t("loadingGrid")}
      </div>
    );
  }

  return <GridCanvasInner {...props} rgl={rgl} />;
}

function GridCanvasInner({
  viewId,
  siteId,
  currency,
  dateRange,
  items,
  editMode,
  onChange,
  rgl,
}: Props & { rgl: RglModule }) {
  const t = useTranslations("dashboard.empty");
  const widgetName = useWidgetName();
  const { ResponsiveGridLayout, useContainerWidth, verticalCompactor } = rgl;
  const { width, containerRef, mounted }: UseContainerWidthResult =
    useContainerWidth({ measureBeforeMount: false });

  // On sub-md viewports we render a stacked, full-width layout purely for
  // display — persisting layout edits from there would trash the desktop
  // layout. Treat mobile breakpoints as read-only.
  const isMobileBreakpoint = width > 0 && width < BREAKPOINTS.md;
  const effectiveEditMode = editMode && !isMobileBreakpoint;

  // We only persist authoritative desktop positions. On every layout change,
  // ResponsiveGridLayout hands us the full per-breakpoint map; we read
  // `layouts.lg` (always reflects what we passed in for desktop, plus any
  // user drag/resize on desktop) and ignore anything else. This is robust
  // against the race where width hasn't caught up to a breakpoint switch.
  const handleLayoutChange = useCallback(
    (_currentLayout: Layout, allLayouts: ResponsiveLayouts<string>) => {
      const lgLayout = allLayouts.lg;
      if (!lgLayout || lgLayout.length === 0) return;
      const byId = new Map(lgLayout.map((l) => [l.i, l]));
      let changed = false;
      const next = items.map((item) => {
        const l = byId.get(item.id);
        if (!l) return item;
        if (
          l.x === item.x &&
          l.y === item.y &&
          l.w === item.w &&
          l.h === item.h
        ) {
          return item;
        }
        changed = true;
        return { ...item, x: l.x, y: l.y, w: l.w, h: l.h };
      });
      if (changed) onChange(next);
    },
    [items, onChange]
  );

  const handleRemove = useCallback(
    (id: string) => {
      onChange(items.filter((i) => i.id !== id));
    },
    [items, onChange]
  );

  const handlePatchMeta = useCallback(
    (id: string, patch: Partial<WidgetMeta>) => {
      const next = items.map((item) =>
        item.id === id
          ? { ...item, configJson: writeWidgetMeta(item.configJson, patch) }
          : item,
      );
      onChange(next);
    },
    [items, onChange],
  );

  const layouts = useMemo(
    () => ({
      lg: itemsToLayout(items),
      md: itemsToLayout(items),
      sm: itemsToStackedLayout(items, COLS.sm),
      xs: itemsToStackedLayout(items, COLS.xs),
      xxs: itemsToStackedLayout(items, COLS.xxs),
    }),
    [items],
  );

  if (items.length === 0) {
    return (
      <div className="rounded-[10px] border border-dashed border-mdf-line-3 bg-transparent p-12 text-center text-sm text-mdf-fg-3">
        {editMode ? t("canvas") : t("noWidgets")}
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative">
      {mounted ? (
        <ResponsiveGridLayout
          key={viewId + "-" + editMode}
          width={width}
          className="layout"
          layouts={layouts}
          breakpoints={BREAKPOINTS}
          cols={COLS}
          rowHeight={60}
          margin={[16, 16]}
          containerPadding={[0, 0]}
          compactor={verticalCompactor as Compactor}
          dragConfig={{ enabled: effectiveEditMode, handle: ".drag-handle" }}
          resizeConfig={{ enabled: effectiveEditMode }}
          onLayoutChange={handleLayoutChange}
        >
          {items.map((item) => {
            const def = getWidget(item.widgetType);
            const meta = parseWidgetMeta(item.configJson);
            const itemDateRange = effectiveDateRange(meta, dateRange);
            return (
              <div key={item.id}>
                {def ? (
                  <WidgetFrame
                    title={widgetName(def)}
                    editMode={effectiveEditMode}
                    onRemove={
                      effectiveEditMode ? () => handleRemove(item.id) : undefined
                    }
                    pinned={!!meta.pinned}
                    dateOverride={meta.dateRangeOverride}
                    onTogglePin={
                      effectiveEditMode
                        ? () => handlePatchMeta(item.id, { pinned: !meta.pinned })
                        : undefined
                    }
                    onSetDateOverride={
                      effectiveEditMode
                        ? (next) =>
                            handlePatchMeta(item.id, { dateRangeOverride: next })
                        : undefined
                    }
                  >
                    <def.Component
                      siteId={siteId}
                      currency={currency}
                      dateRange={itemDateRange}
                      config={parseConfig(item.configJson, def.defaultConfig)}
                    />
                  </WidgetFrame>
                ) : (
                  <WidgetFrame
                    title="Unknown widget"
                    subtitle={item.widgetType}
                    editMode={effectiveEditMode}
                    onRemove={
                      effectiveEditMode ? () => handleRemove(item.id) : undefined
                    }
                    pinned={!!meta.pinned}
                  >
                    <div className="text-sm text-muted-foreground">
                      {t("unknownWidget", { type: item.widgetType })}
                    </div>
                  </WidgetFrame>
                )}
              </div>
            );
          })}
        </ResponsiveGridLayout>
      ) : (
        <div className="h-[400px] animate-pulse rounded-lg bg-muted/30" />
      )}
    </div>
  );
}
