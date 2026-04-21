import type { ComponentType } from "react";
import type { ZodType } from "zod";

import type { ResolvedDateRange } from "@/lib/utils/date-range";

export type WidgetCategory =
  | "kpi"
  | "timeseries"
  | "table"
  | "geo"
  | "device"
  | "realtime";

export type WidgetContext<C = unknown> = {
  siteId: string;
  currency: string;
  dateRange: ResolvedDateRange;
  config: C;
};

export type WidgetDefinition<C = unknown> = {
  id: string;
  displayName: string;
  description?: string;
  category: WidgetCategory;
  defaultSize: { w: number; h: number };
  minSize?: { w: number; h: number };
  maxSize?: { w: number; h: number };
  // Height (in grid rows) to use on narrow stacked layouts (sm/xs/xxs).
  // Widgets that wrap vertically on mobile (e.g. KPI grids) need more height
  // than their desktop size would imply.
  mobileSize?: { h: number };
  configSchema: ZodType<C>;
  defaultConfig: C;
  Component: ComponentType<WidgetContext<C>>;
  SettingsForm?: ComponentType<{ value: C; onChange: (next: C) => void }>;
};

const registry = new Map<string, WidgetDefinition<unknown>>();

export function register<C>(def: WidgetDefinition<C>): void {
  if (registry.has(def.id)) {
    console.warn(`[widgets] duplicate registration for "${def.id}"`);
  }
  registry.set(def.id, def as WidgetDefinition<unknown>);
}

export function getWidget(id: string): WidgetDefinition<unknown> | undefined {
  return registry.get(id);
}

export function getAllWidgets(): WidgetDefinition<unknown>[] {
  return Array.from(registry.values());
}

export function getWidgetsByCategory(): Record<
  WidgetCategory,
  WidgetDefinition<unknown>[]
> {
  const result: Record<WidgetCategory, WidgetDefinition<unknown>[]> = {
    kpi: [],
    timeseries: [],
    table: [],
    geo: [],
    device: [],
    realtime: [],
  };
  for (const def of registry.values()) {
    result[def.category].push(def);
  }
  return result;
}

export const CATEGORY_LABELS: Record<WidgetCategory, string> = {
  kpi: "KPIs",
  timeseries: "Time series",
  table: "Tables",
  geo: "Geography",
  device: "Devices & browsers",
  realtime: "Realtime",
};
