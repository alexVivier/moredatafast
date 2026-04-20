"use client";

import { z } from "zod";

import { cn } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
  | { key: "visitors"; label: "Visitors"; format: "number" }
  | { key: "sessions"; label: "Sessions"; format: "number" }
  | { key: "revenue"; label: "Revenue"; format: "currency" }
  | { key: "bounce_rate"; label: "Bounce rate"; format: "percent-as-is" }
  | {
      key: "conversion_rate";
      label: "Conversion rate";
      format: "percent-as-is";
    }
  | {
      key: "avg_session_duration";
      label: "Avg session duration";
      format: "duration-ms";
    };

const METRICS: Metric[] = [
  { key: "visitors", label: "Visitors", format: "number" },
  { key: "sessions", label: "Sessions", format: "number" },
  { key: "revenue", label: "Revenue", format: "currency" },
  { key: "conversion_rate", label: "Conversion rate", format: "percent-as-is" },
  { key: "bounce_rate", label: "Bounce rate", format: "percent-as-is" },
  {
    key: "avg_session_duration",
    label: "Avg session duration",
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
      <Card>
        <CardHeader>
          <CardTitle>Overview</CardTitle>
          <CardDescription className="text-destructive">
            {error.message}
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
      {METRICS.map((metric) => {
        const value = row?.[metric.key] ?? 0;
        const prevValue = prevRow?.[metric.key] ?? 0;
        const delta = formatDeltaPercent(value, prevValue);
        const isGood =
          delta.direction === "flat"
            ? "flat"
            : LOWER_IS_BETTER.has(metric.key)
              ? delta.direction === "down"
                ? "good"
                : "bad"
              : delta.direction === "up"
                ? "good"
                : "bad";

        return (
          <Card key={metric.key} className="min-h-[120px]">
            <CardHeader className="pb-2">
              <CardDescription className="text-xs font-medium uppercase tracking-wider">
                {metric.label}
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-2xl font-semibold tabular-nums">
                {isLoading ? (
                  <span className="inline-block h-7 w-20 animate-pulse rounded bg-muted/60" />
                ) : (
                  formatValue(metric, value, resolvedCurrency)
                )}
              </div>
              <div className="mt-1 flex items-center gap-1 text-xs">
                {isLoading ? (
                  <span className="inline-block h-3 w-10 animate-pulse rounded bg-muted/40" />
                ) : (
                  <>
                    <span
                      className={cn(
                        "font-medium",
                        isGood === "good" && "text-emerald-500",
                        isGood === "bad" && "text-destructive",
                        isGood === "flat" && "text-muted-foreground"
                      )}
                    >
                      {delta.direction === "up"
                        ? "↑"
                        : delta.direction === "down"
                          ? "↓"
                          : "·"}{" "}
                      {delta.label}
                    </span>
                    <span className="text-muted-foreground">
                      vs previous {dateRange.lengthDays}d
                    </span>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
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
  configSchema: z.object({}).passthrough() as unknown as z.ZodType<OverviewKpisConfig>,
  defaultConfig: {},
  Component: OverviewKpis,
});
