export type DateRangePreset = "today" | "7d" | "30d" | "90d" | "custom";

export type ResolvedDateRange = {
  preset: DateRangePreset;
  startAt: string; // YYYY-MM-DD
  endAt: string; // YYYY-MM-DD
  /** window length in days, inclusive of both endpoints */
  lengthDays: number;
};

const PRESET_DAYS: Record<Exclude<DateRangePreset, "custom">, number> = {
  today: 1,
  "7d": 7,
  "30d": 30,
  "90d": 90,
};

function toYMD(d: Date): string {
  const year = d.getUTCFullYear();
  const month = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function addDaysUTC(d: Date, days: number): Date {
  const copy = new Date(d.getTime());
  copy.setUTCDate(copy.getUTCDate() + days);
  return copy;
}

function todayUTC(): Date {
  const now = new Date();
  return new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
  );
}

export function resolveDateRange(
  preset: DateRangePreset,
  custom?: { startAt?: string; endAt?: string }
): ResolvedDateRange {
  if (preset === "custom" && custom?.startAt && custom?.endAt) {
    const start = new Date(custom.startAt);
    const end = new Date(custom.endAt);
    const ms = end.getTime() - start.getTime();
    const lengthDays = Math.max(1, Math.round(ms / 86_400_000) + 1);
    return {
      preset,
      startAt: toYMD(start),
      endAt: toYMD(end),
      lengthDays,
    };
  }

  const today = todayUTC();
  const days = PRESET_DAYS[preset === "custom" ? "7d" : preset];
  const startAt = addDaysUTC(today, -(days - 1));
  return {
    preset: preset === "custom" ? "7d" : preset,
    startAt: toYMD(startAt),
    endAt: toYMD(today),
    lengthDays: days,
  };
}

/**
 * Previous period window of the same length, ending the day before the
 * current range starts. Used for period-over-period deltas.
 */
export function previousRange(range: ResolvedDateRange): ResolvedDateRange {
  const startCur = new Date(range.startAt);
  const prevEnd = addDaysUTC(startCur, -1);
  const prevStart = addDaysUTC(prevEnd, -(range.lengthDays - 1));
  return {
    preset: range.preset,
    startAt: toYMD(prevStart),
    endAt: toYMD(prevEnd),
    lengthDays: range.lengthDays,
  };
}

export const DATE_RANGE_LABELS: Record<DateRangePreset, string> = {
  today: "Today",
  "7d": "Last 7 days",
  "30d": "Last 30 days",
  "90d": "Last 90 days",
  custom: "Custom",
};

export function isDateRangePreset(value: string): value is DateRangePreset {
  return (
    value === "today" ||
    value === "7d" ||
    value === "30d" ||
    value === "90d" ||
    value === "custom"
  );
}
