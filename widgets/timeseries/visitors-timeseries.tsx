"use client";

import { useMemo } from "react";
import { z } from "zod";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { useWidgetData } from "@/lib/hooks/use-widget-data";
import type { TimeseriesResponse } from "@/lib/datafast/types";
import { formatNumber } from "@/lib/utils/format";
import { register, type WidgetContext } from "@/widgets/registry";

type Config = { metric: "visitors" | "sessions" };

const configSchema = z.object({
  metric: z.enum(["visitors", "sessions"]).default("visitors"),
});

function intervalForRange(days: number): "hour" | "day" | "week" | "month" {
  if (days <= 1) return "hour";
  if (days <= 90) return "day";
  if (days <= 365) return "week";
  return "month";
}

export function VisitorsTimeseries({
  siteId,
  dateRange,
  config,
}: WidgetContext<Config>) {
  const interval = intervalForRange(dateRange.lengthDays);
  const metric = config.metric;
  const query = useWidgetData<TimeseriesResponse["data"]>(
    siteId,
    "analytics/timeseries",
    {
      fields: `${metric},name`,
      interval,
      startAt: dateRange.startAt,
      endAt: dateRange.endAt,
    }
  );

  const { data, total } = useMemo(() => {
    const envelope = query.data as
      | (TimeseriesResponse & { data: TimeseriesResponse["data"] })
      | undefined;
    const points = envelope?.data ?? [];
    const totals = envelope?.totals as
      | Record<string, number | undefined>
      | undefined;
    return {
      data: points.map((p) => ({
        name: p.name,
        value: (p as Record<string, unknown>)[metric] as number | undefined,
      })),
      total: (totals?.[metric] as number | undefined) ?? 0,
    };
  }, [query.data, metric]);

  if (query.error) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-destructive">
        {query.error.message}
      </div>
    );
  }

  const label = metric === "visitors" ? "Visitors" : "Sessions";

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-baseline justify-between pb-2">
        <div>
          <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {label} over time
          </div>
          <div className="text-2xl font-semibold tabular-nums">
            {query.isLoading ? (
              <span className="inline-block h-7 w-16 animate-pulse rounded bg-muted/60" />
            ) : (
              formatNumber(total)
            )}
          </div>
        </div>
        <div className="text-xs text-muted-foreground">{interval}</div>
      </div>
      <div className="flex-1 min-h-[120px]">
        {query.isLoading ? (
          <div className="h-full w-full animate-pulse rounded bg-muted/40" />
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={data}
              margin={{ top: 4, right: 4, bottom: 0, left: 0 }}
            >
              <defs>
                <linearGradient id="vis-grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(217 91% 60%)" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="hsl(217 91% 60%)" stopOpacity={0} />
                </linearGradient>
              </defs>
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
              <YAxis
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                tickFormatter={(v: number) => formatNumber(v)}
                width={40}
              />
              <Tooltip
                cursor={{ stroke: "var(--border)", strokeWidth: 1 }}
                contentStyle={{
                  background: "var(--popover)",
                  border: "1px solid var(--border)",
                  borderRadius: 8,
                  fontSize: 12,
                }}
                labelStyle={{ color: "var(--muted-foreground)" }}
                formatter={(value) => [
                  formatNumber(typeof value === "number" ? value : 0),
                  label,
                ]}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke="hsl(217 91% 60%)"
                strokeWidth={2}
                fill="url(#vis-grad)"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

register<Config>({
  id: "visitors-timeseries",
  displayName: "Visitors over time",
  description: "Daily (or hourly) visitors or sessions chart with a gradient area.",
  category: "timeseries",
  defaultSize: { w: 8, h: 4 },
  minSize: { w: 4, h: 3 },
  configSchema: configSchema as unknown as z.ZodType<Config>,
  defaultConfig: { metric: "visitors" },
  Component: VisitorsTimeseries,
});
