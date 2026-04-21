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
import {
  MDF_AXIS_TICK,
  MDF_CURSOR_STROKE,
  MDF_GRID_STROKE,
  MDF_TOOLTIP_LABEL_STYLE,
  MDF_TOOLTIP_STYLE,
} from "@/lib/charts/chart-theme";
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
  visitors: "var(--mdf-cat-1)",
  sessions: "var(--mdf-cat-4)",
  revenue: "var(--mdf-cat-2)",
  conversion_rate: "var(--mdf-cat-3)",
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
      <div className="flex h-full items-center justify-center text-sm text-mdf-danger">
        {query.error.message}
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-baseline justify-between pb-2">
        <div>
          <div className="mdf-micro">Metrics over time</div>
          <div className="text-xs text-mdf-fg-3">
            {metrics.map((m) => METRIC_LABEL[m]).join(" · ")}
          </div>
        </div>
        <div className="mdf-micro">{interval}</div>
      </div>
      <div className="flex-1 min-h-[140px]">
        {query.isLoading ? (
          <div className="h-full w-full animate-pulse rounded bg-mdf-line-1" />
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={data}
              margin={{ top: 4, right: 4, bottom: 0, left: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke={MDF_GRID_STROKE}
                vertical={false}
              />
              <XAxis
                dataKey="name"
                tickLine={false}
                axisLine={false}
                tick={MDF_AXIS_TICK}
                interval="preserveStartEnd"
                minTickGap={40}
              />
              {hasCount ? (
                <YAxis
                  yAxisId="count"
                  tickLine={false}
                  axisLine={false}
                  tick={MDF_AXIS_TICK}
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
                  tick={MDF_AXIS_TICK}
                  tickFormatter={(v: number) => formatCurrency(v, currency)}
                  width={60}
                />
              ) : null}
              <Tooltip
                cursor={{ stroke: MDF_CURSOR_STROKE, strokeWidth: 1 }}
                contentStyle={MDF_TOOLTIP_STYLE}
                labelStyle={MDF_TOOLTIP_LABEL_STYLE}
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
                wrapperStyle={{ fontSize: 11, color: "var(--mdf-fg-3)" }}
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
                  strokeWidth={1.5}
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
