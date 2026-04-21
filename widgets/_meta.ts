import type { DateRangePreset, ResolvedDateRange } from "@/lib/utils/date-range";

/**
 * Per-instance widget metadata persisted inside the `configJson` blob under
 * the `_meta` key. Widget-specific config schemas use `.strip()` (Zod's
 * default), so these extra fields are silently ignored by each widget's own
 * parser — letting us piggy-back pin + date-range-override on every widget
 * without touching the DB schema or individual widget code.
 */
export type WidgetMeta = {
  pinned?: boolean;
  dateRangeOverride?: {
    preset: DateRangePreset;
    startAt: string;
    endAt: string;
    lengthDays: number;
  } | null;
};

type WithMeta = { _meta?: WidgetMeta } & Record<string, unknown>;

export function parseWidgetMeta(configJson: string): WidgetMeta {
  if (!configJson) return {};
  try {
    const parsed = JSON.parse(configJson) as unknown;
    if (!parsed || typeof parsed !== "object") return {};
    const meta = (parsed as WithMeta)._meta;
    if (!meta || typeof meta !== "object") return {};
    return meta;
  } catch {
    return {};
  }
}

/** Merge a meta patch into the existing `configJson` and return the new JSON. */
export function writeWidgetMeta(
  configJson: string,
  patch: Partial<WidgetMeta>,
): string {
  let obj: WithMeta = {};
  if (configJson) {
    try {
      const parsed = JSON.parse(configJson) as unknown;
      if (parsed && typeof parsed === "object") obj = parsed as WithMeta;
    } catch {
      obj = {};
    }
  }
  const current = obj._meta ?? {};
  obj._meta = { ...current, ...patch };
  // Null out falsy values so they don't linger as stale overrides.
  if (obj._meta.dateRangeOverride === null) delete obj._meta.dateRangeOverride;
  if (obj._meta.pinned === false) delete obj._meta.pinned;
  if (Object.keys(obj._meta).length === 0) delete obj._meta;
  return JSON.stringify(obj);
}

/**
 * Resolve the effective date range for a widget. If the widget carries a
 * valid override, we use it; otherwise fall back to the view-level range.
 */
export function effectiveDateRange(
  meta: WidgetMeta,
  global: ResolvedDateRange,
): ResolvedDateRange {
  const o = meta.dateRangeOverride;
  if (!o) return global;
  return {
    preset: o.preset,
    startAt: o.startAt,
    endAt: o.endAt,
    lengthDays: o.lengthDays,
  };
}
