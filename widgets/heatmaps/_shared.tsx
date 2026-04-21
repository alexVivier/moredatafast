"use client";

import { z } from "zod";

import { formatCurrency, formatNumber } from "@/lib/utils/format";

export const METRIC_VALUES = [
  "visitors",
  "sessions",
  "revenue",
  "conversion_rate",
] as const;

export type HeatmapMetric = (typeof METRIC_VALUES)[number];

export const METRIC_LABEL: Record<HeatmapMetric, string> = {
  visitors: "Visitors",
  sessions: "Sessions",
  revenue: "Revenue",
  conversion_rate: "Conversion rate",
};

export const metricSchema = z.enum(METRIC_VALUES);

export function formatMetric(
  value: number,
  metric: HeatmapMetric,
  currency: string,
): string {
  if (!Number.isFinite(value)) return "—";
  if (metric === "revenue") return formatCurrency(value, currency);
  if (metric === "conversion_rate") return `${value.toFixed(2)}%`;
  return formatNumber(value);
}

/**
 * Parse the wall-clock components out of a DataFast ISO timestamp. DataFast
 * returns timestamps pre-shifted to the site's timezone, so what we want is
 * *exactly* the numbers in the string — not a re-interpretation.
 */
export function parseWallClock(iso: string): {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
} | null {
  const m = iso.match(
    /^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})/,
  );
  if (!m) return null;
  return {
    year: Number(m[1]),
    month: Number(m[2]) - 1,
    day: Number(m[3]),
    hour: Number(m[4]),
    minute: Number(m[5]),
  };
}

/** Day of week (0=Mon … 6=Sun) from wall-clock y/m/d via UTC Date arithmetic. */
export function dowMondayFirst(y: number, m: number, d: number): number {
  // Date.UTC avoids local TZ shifting; we're just using it as a calendar.
  const day = new Date(Date.UTC(y, m, d)).getUTCDay(); // 0=Sun..6=Sat
  return (day + 6) % 7; // 0=Mon..6=Sun
}

/**
 * Quantize a normalized [0,1] intensity into one of 5 discrete buckets. Bucket
 * 0 is "empty" (near-bg), bucket 4 is the most saturated cell. Sequential
 * tokens are defined in the design system.
 */
export function intensityColor(t: number): string {
  if (!Number.isFinite(t) || t <= 0) return "var(--mdf-line-1)";
  if (t < 0.2) return "color-mix(in srgb, var(--mdf-seq-1) 85%, transparent)";
  if (t < 0.45) return "var(--mdf-seq-1)";
  if (t < 0.7) return "var(--mdf-seq-2)";
  if (t < 0.9) return "var(--mdf-seq-3)";
  return "var(--mdf-seq-4)";
}

export function HeatmapLegend({
  min,
  max,
  format,
}: {
  min: number;
  max: number;
  format: (n: number) => string;
}) {
  return (
    <div className="flex items-center gap-2 text-[10px] font-mono tabular-nums text-mdf-fg-3">
      <span>{format(min)}</span>
      <div className="flex h-2.5 overflow-hidden rounded-[3px]">
        <div
          className="w-5"
          style={{ background: "var(--mdf-line-1)" }}
        />
        <div
          className="w-5"
          style={{ background: "var(--mdf-seq-1)" }}
        />
        <div
          className="w-5"
          style={{ background: "var(--mdf-seq-2)" }}
        />
        <div
          className="w-5"
          style={{ background: "var(--mdf-seq-3)" }}
        />
        <div
          className="w-5"
          style={{ background: "var(--mdf-seq-4)" }}
        />
      </div>
      <span>{format(max)}</span>
    </div>
  );
}

export function HeatmapLoading() {
  return (
    <div className="flex h-full w-full items-stretch gap-1">
      <div className="flex-1 animate-pulse rounded bg-mdf-line-1" />
    </div>
  );
}

export function HeatmapError({ message }: { message: string }) {
  return (
    <div className="flex h-full items-center justify-center text-sm text-mdf-danger">
      {message}
    </div>
  );
}

export function HeatmapEmpty({ text }: { text: string }) {
  return (
    <div className="flex h-full items-center justify-center text-sm text-mdf-fg-3">
      {text}
    </div>
  );
}
