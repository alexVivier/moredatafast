"use client";

import { z } from "zod";

import { cn } from "@/lib/utils";
import { useWidgetData } from "@/lib/hooks/use-widget-data";
import type { OverviewRow } from "@/lib/datafast/types";
import {
  formatCurrency,
  formatDeltaPercent,
  formatDurationMs,
  formatNumber,
  formatPercentAsIs,
} from "@/lib/utils/format";
import { previousRange } from "@/lib/utils/date-range";
import { register, type WidgetContext } from "@/widgets/registry";

type Metric =
  | { key: "visitors"; label: "VISITORS"; format: "number" }
  | { key: "sessions"; label: "SESSIONS"; format: "number" }
  | { key: "revenue"; label: "REVENUE"; format: "currency" }
  | { key: "bounce_rate"; label: "BOUNCE RATE"; format: "percent-as-is" }
  | { key: "conversion_rate"; label: "CONVERSION RATE"; format: "percent-as-is" }
  | { key: "avg_session_duration"; label: "AVG SESSION DURATION"; format: "duration-ms" };

const METRICS: Metric[] = [
  { key: "visitors", label: "VISITORS", format: "number" },
  { key: "sessions", label: "SESSIONS", format: "number" },
  { key: "revenue", label: "REVENUE", format: "currency" },
  { key: "conversion_rate", label: "CONVERSION RATE", format: "percent-as-is" },
  { key: "bounce_rate", label: "BOUNCE RATE", format: "percent-as-is" },
  {
    key: "avg_session_duration",
    label: "AVG SESSION DURATION",
    format: "duration-ms",
  },
];

const LOWER_IS_BETTER = new Set<Metric["key"]>(["bounce_rate"]);

function formatValue(metric: Metric, value: number, currency: string): string {
  switch (metric.format) {
    case "number":
      return formatNumber(value);
    case "currency":
      return formatCurrency(value, currency);
    case "percent-as-is":
      return formatPercentAsIs(value);
    case "duration-ms":
      return formatDurationMs(value);
  }
}

type OverviewKpisConfig = Record<string, never>;

export function OverviewKpis({
  siteId,
  dateRange,
  currency,
}: WidgetContext<OverviewKpisConfig>) {
  const prev = previousRange(dateRange);

  const current = useWidgetData<OverviewRow[]>(siteId, "analytics/overview", {
    startAt: dateRange.startAt,
    endAt: dateRange.endAt,
  });
  const previous = useWidgetData<OverviewRow[]>(siteId, "analytics/overview", {
    startAt: prev.startAt,
    endAt: prev.endAt,
  });

  const isLoading = current.isLoading || previous.isLoading;
  const error = current.error ?? previous.error;

  const row = current.data?.data?.[0];
  const prevRow = previous.data?.data?.[0];
  const resolvedCurrency = row?.currency || currency || "USD";

  if (error) {
    return (
      <div className="p-4 text-sm text-mdf-danger">{error.message}</div>
    );
  }

  return (
    <div className="mdf-kpistrip h-full grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
      {METRICS.map((metric) => {
        const value = row?.[metric.key] ?? 0;
        const prevValue = prevRow?.[metric.key] ?? 0;
        const delta = formatDeltaPercent(value, prevValue);
        const isGood =
          delta.direction === "flat"
            ? "flat"
            : LOWER_IS_BETTER.has(metric.key)
              ? delta.direction === "down"
                ? "up"
                : "down"
              : delta.direction === "up"
                ? "up"
                : "down";
        const arrow =
          delta.direction === "up" ? "↑" : delta.direction === "down" ? "↓" : "—";

        return (
          <div key={metric.key} className="mdf-kpistrip__cell">
            <div className="mdf-kpi__label truncate">{metric.label}</div>
            <div className="mdf-kpi__value truncate">
              {isLoading ? (
                <span className="inline-block h-[36px] w-20 animate-pulse rounded bg-mdf-line-1" />
              ) : (
                formatValue(metric, value, resolvedCurrency)
              )}
            </div>
            <div className="mdf-kpi__delta flex flex-wrap items-center gap-x-1">
              {isLoading ? (
                <span className="inline-block h-3 w-16 animate-pulse rounded bg-mdf-line-1" />
              ) : (
                <>
                  <span className={cn(isGood)}>
                    {arrow} {delta.label}
                  </span>
                  <span className="text-mdf-fg-3">
                    vs previous {dateRange.lengthDays}d
                  </span>
                </>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

register<OverviewKpisConfig>({
  id: "overview-kpis",
  displayName: "Overview KPIs",
  description: "Visitors, sessions, revenue, bounce rate, conversion, session duration — with period-over-period deltas.",
  category: "kpi",
  defaultSize: { w: 12, h: 3 },
  minSize: { w: 6, h: 3 },
  mobileSize: { h: 5 },
  configSchema: z.object({}).passthrough() as unknown as z.ZodType<OverviewKpisConfig>,
  defaultConfig: {},
  Component: OverviewKpis,
});
