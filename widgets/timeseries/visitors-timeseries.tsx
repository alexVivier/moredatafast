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
import {
  MDF_AXIS_TICK,
  MDF_CURSOR_STROKE,
  MDF_GRID_STROKE,
  MDF_TOOLTIP_LABEL_STYLE,
  MDF_TOOLTIP_STYLE,
} from "@/lib/charts/chart-theme";
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
      <div className="flex h-full items-center justify-center text-sm text-mdf-danger">
        {query.error.message}
      </div>
    );
  }

  const label = metric === "visitors" ? "Visitors" : "Sessions";

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-baseline justify-between pb-2">
        <div>
          <div className="mdf-micro">{label} over time</div>
          <div className="mdf-kpi">
            {query.isLoading ? (
              <span className="inline-block h-[36px] w-20 animate-pulse rounded bg-mdf-line-1" />
            ) : (
              formatNumber(total)
            )}
          </div>
        </div>
        <div className="mdf-micro">{interval}</div>
      </div>
      <div className="flex-1 min-h-[120px]">
        {query.isLoading ? (
          <div className="h-full w-full animate-pulse rounded bg-mdf-line-1" />
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={data}
              margin={{ top: 4, right: 4, bottom: 0, left: 0 }}
            >
              <defs>
                <linearGradient id="vis-grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--mdf-cat-1)" stopOpacity={0.45} />
                  <stop offset="100%" stopColor="var(--mdf-cat-1)" stopOpacity={0.02} />
                </linearGradient>
              </defs>
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
              <YAxis
                tickLine={false}
                axisLine={false}
                tick={MDF_AXIS_TICK}
                tickFormatter={(v: number) => formatNumber(v)}
                width={40}
              />
              <Tooltip
                cursor={{ stroke: MDF_CURSOR_STROKE, strokeWidth: 1 }}
                contentStyle={MDF_TOOLTIP_STYLE}
                labelStyle={MDF_TOOLTIP_LABEL_STYLE}
                formatter={(value) => [
                  formatNumber(typeof value === "number" ? value : 0),
                  label,
                ]}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke="var(--mdf-cat-1)"
                strokeWidth={1.5}
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
