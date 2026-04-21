"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type {
  Compactor,
  Layout,
  LayoutItem,
  UseContainerWidthResult,
} from "react-grid-layout";

import "./grid-styles.css";

import { WidgetFrame } from "./widget-frame";
import { getWidget } from "@/widgets";
import "@/widgets";
import type { ResolvedDateRange } from "@/lib/utils/date-range";

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

export function GridCanvas(props: Props) {
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
      <div className="rounded-lg border border-border bg-card p-6 text-sm text-muted-foreground">
        Loading grid…
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
  const { ResponsiveGridLayout, useContainerWidth, verticalCompactor } = rgl;
  const { width, containerRef, mounted }: UseContainerWidthResult =
    useContainerWidth({ measureBeforeMount: false });

  // On sub-md viewports we render a stacked, full-width layout purely for
  // display — persisting layout edits from there would trash the desktop
  // layout. Treat mobile breakpoints as read-only.
  const isMobileBreakpoint = width > 0 && width < BREAKPOINTS.md;
  const effectiveEditMode = editMode && !isMobileBreakpoint;

  const handleLayoutChange = useCallback(
    (layout: Layout) => {
      if (isMobileBreakpoint) return;
      const byId = new Map(layout.map((l) => [l.i, l]));
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
    [items, onChange, isMobileBreakpoint]
  );

  const handleRemove = useCallback(
    (id: string) => {
      onChange(items.filter((i) => i.id !== id));
    },
    [items, onChange]
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
      <div className="rounded-lg border border-dashed border-border bg-muted/30 p-12 text-center text-sm text-muted-foreground">
        {editMode
          ? "Empty canvas — click + Add widget above to drop your first widget."
          : "No widgets yet. Switch to Edit mode to customize this view."}
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
          margin={[12, 12]}
          containerPadding={[0, 0]}
          compactor={verticalCompactor as Compactor}
          dragConfig={{ enabled: effectiveEditMode, handle: ".drag-handle" }}
          resizeConfig={{ enabled: effectiveEditMode }}
          onLayoutChange={handleLayoutChange}
        >
          {items.map((item) => {
            const def = getWidget(item.widgetType);
            return (
              <div key={item.id}>
                {def ? (
                  <WidgetFrame
                    title={def.displayName}
                    editMode={effectiveEditMode}
                    onRemove={
                      effectiveEditMode ? () => handleRemove(item.id) : undefined
                    }
                  >
                    <def.Component
                      siteId={siteId}
                      currency={currency}
                      dateRange={dateRange}
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
                  >
                    <div className="text-sm text-muted-foreground">
                      Widget type{" "}
                      <span className="font-mono">{item.widgetType}</span> is
                      not registered.
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
