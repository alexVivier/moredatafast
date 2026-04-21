"use client";

import { useMemo } from "react";
import { z } from "zod";
import {
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { useWidgetData } from "@/lib/hooks/use-widget-data";
import type { TimeseriesResponse } from "@/lib/datafast/types";
import { formatCurrency, formatNumber } from "@/lib/utils/format";
import { register, type WidgetContext } from "@/widgets/registry";

const METRIC_IDS = [
  "visitors",
  "sessions",
  "revenue",
  "conversion_rate",
] as const;
type MetricId = (typeof METRIC_IDS)[number];

const configSchema = z.object({
  metrics: z
    .array(z.enum(METRIC_IDS))
    .min(1)
    .max(4)
    .default(["visitors", "revenue"]),
});
type Config = z.infer<typeof configSchema>;

const METRIC_LABEL: Record<MetricId, string> = {
  visitors: "Visitors",
  sessions: "Sessions",
  revenue: "Revenue",
  conversion_rate: "Conversion rate",
};

const METRIC_COLOR: Record<MetricId, string> = {
  visitors: "hsl(217 91% 60%)",
  sessions: "hsl(250 91% 66%)",
  revenue: "hsl(142 71% 45%)",
  conversion_rate: "hsl(38 92% 50%)",
};

function intervalForRange(days: number): "hour" | "day" | "week" | "month" {
  if (days <= 1) return "hour";
  if (days <= 90) return "day";
  if (days <= 365) return "week";
  return "month";
}

function isCurrency(m: MetricId) {
  return m === "revenue";
}

export function MultiMetricTimeseries({
  siteId,
  currency,
  dateRange,
  config,
}: WidgetContext<Config>) {
  const interval = intervalForRange(dateRange.lengthDays);
  const metrics: MetricId[] = config.metrics.length ? config.metrics : ["visitors"];
  const fieldsParam = [...metrics, "name"].join(",");

  const query = useWidgetData<TimeseriesResponse["data"]>(
    siteId,
    "analytics/timeseries",
    {
      fields: fieldsParam,
      interval,
      startAt: dateRange.startAt,
      endAt: dateRange.endAt,
    }
  );

  const data = useMemo(() => {
    const envelope = query.data as
      | (TimeseriesResponse & { data: TimeseriesResponse["data"] })
      | undefined;
    return (envelope?.data ?? []).map((p) => {
      const out: Record<string, number | string> = { name: p.name };
      for (const m of metrics) {
        const v = (p as Record<string, unknown>)[m];
        out[m] = typeof v === "number" ? v : 0;
      }
      return out;
    });
  }, [query.data, metrics]);

  const hasCurrency = metrics.some(isCurrency);
  const hasCount = metrics.some((m) => !isCurrency(m));

  if (query.error) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-destructive">
        {query.error.message}
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-baseline justify-between pb-2">
        <div>
          <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Metrics over time
          </div>
          <div className="text-xs text-muted-foreground">
            {metrics.map((m) => METRIC_LABEL[m]).join(" · ")}
          </div>
        </div>
        <div className="text-xs text-muted-foreground">{interval}</div>
      </div>
      <div className="flex-1 min-h-[140px]">
        {query.isLoading ? (
          <div className="h-full w-full animate-pulse rounded bg-muted/40" />
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={data}
              margin={{ top: 4, right: 4, bottom: 0, left: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="var(--border)"
                opacity={0.3}
                vertical={false}
              />
              <XAxis
                dataKey="name"
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                interval="preserveStartEnd"
                minTickGap={40}
              />
              {hasCount ? (
                <YAxis
                  yAxisId="count"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                  tickFormatter={(v: number) => formatNumber(v)}
                  width={42}
                />
              ) : null}
              {hasCurrency ? (
                <YAxis
                  yAxisId="currency"
                  orientation="right"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                  tickFormatter={(v: number) => formatCurrency(v, currency)}
                  width={60}
                />
              ) : null}
              <Tooltip
                cursor={{ stroke: "var(--border)", strokeWidth: 1 }}
                contentStyle={{
                  background: "var(--popover)",
                  border: "1px solid var(--border)",
                  borderRadius: 8,
                  fontSize: 12,
                }}
                labelStyle={{ color: "var(--muted-foreground)" }}
                formatter={(value, name) => {
                  const m = name as MetricId;
                  const n = typeof value === "number" ? value : 0;
                  if (m === "revenue") return [formatCurrency(n, currency), METRIC_LABEL[m]];
                  if (m === "conversion_rate")
                    return [`${n.toFixed(2)}%`, METRIC_LABEL[m]];
                  return [formatNumber(n), METRIC_LABEL[m] ?? String(m)];
                }}
              />
              <Legend
                iconType="line"
                wrapperStyle={{ fontSize: 11 }}
                formatter={(name) => METRIC_LABEL[name as MetricId] ?? String(name)}
              />
              {metrics.map((m) => (
                <Line
                  key={m}
                  yAxisId={isCurrency(m) ? "currency" : "count"}
                  type="monotone"
                  dataKey={m}
                  name={m}
                  stroke={METRIC_COLOR[m]}
                  strokeWidth={2}
                  dot={false}
                />
              ))}
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

register<Config>({
  id: "multi-metric-timeseries",
  displayName: "Multi-metric timeseries",
  description: "Plot visitors, sessions, revenue and conversion on one chart.",
  category: "timeseries",
  defaultSize: { w: 8, h: 4 },
  minSize: { w: 4, h: 3 },
  configSchema: configSchema as unknown as z.ZodType<Config>,
  defaultConfig: { metrics: ["visitors", "revenue"] },
  Component: MultiMetricTimeseries,
});
