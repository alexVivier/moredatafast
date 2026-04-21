"use client";

import { useTranslations } from "next-intl";
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
import { formatCurrency } from "@/lib/utils/format";
import {
  MDF_AXIS_TICK,
  MDF_CURSOR_STROKE,
  MDF_GRID_STROKE,
  MDF_TOOLTIP_LABEL_STYLE,
  MDF_TOOLTIP_STYLE,
} from "@/lib/charts/chart-theme";
import { register, type WidgetContext } from "@/widgets/registry";

type Config = Record<string, never>;

const configSchema = z.object({}).passthrough();

function intervalForRange(days: number): "hour" | "day" | "week" | "month" {
  if (days <= 1) return "hour";
  if (days <= 90) return "day";
  if (days <= 365) return "week";
  return "month";
}

type Breakdown = { new: number; renewal: number; refund: number };

export function RevenueTimeseries({
  siteId,
  currency,
  dateRange,
}: WidgetContext<Config>) {
  const t = useTranslations("widgets.timeseries");
  const interval = intervalForRange(dateRange.lengthDays);
  const query = useWidgetData<TimeseriesResponse["data"]>(
    siteId,
    "analytics/timeseries",
    {
      fields: "revenue,name",
      interval,
      startAt: dateRange.startAt,
      endAt: dateRange.endAt,
    }
  );

  const { data, total, totalBreakdown } = useMemo(() => {
    const envelope = query.data as
      | (TimeseriesResponse & { data: TimeseriesResponse["data"] })
      | undefined;
    const points = envelope?.data ?? [];
    const totals = envelope?.totals as
      | { revenue?: number; revenueBreakdown?: Breakdown }
      | undefined;
    return {
      data: points.map((p) => ({
        name: p.name,
        value: (p.revenue as number | undefined) ?? 0,
        breakdown: p.revenueBreakdown,
      })),
      total: totals?.revenue ?? 0,
      totalBreakdown: totals?.revenueBreakdown,
    };
  }, [query.data]);

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
          <div className="mdf-micro">{t("labelRevenueOverTime")}</div>
          <div className="mdf-kpi">
            {query.isLoading ? (
              <span className="inline-block h-[36px] w-24 animate-pulse rounded bg-mdf-line-1" />
            ) : (
              formatCurrency(total, currency)
            )}
          </div>
          {totalBreakdown &&
          (totalBreakdown.renewal > 0 || totalBreakdown.refund > 0) ? (
            <div className="text-[11px] text-mdf-fg-3 font-mono tabular-nums">
              {t("breakdownNew")} {formatCurrency(totalBreakdown.new ?? 0, currency)}
              {totalBreakdown.renewal > 0 ? (
                <>
                  {" · "}
                  {t("breakdownRenewal")}{" "}
                  {formatCurrency(totalBreakdown.renewal, currency)}
                </>
              ) : null}
              {totalBreakdown.refund > 0 ? (
                <>
                  {" · "}
                  {t("breakdownRefund")}{" "}
                  {formatCurrency(totalBreakdown.refund, currency)}
                </>
              ) : null}
            </div>
          ) : null}
        </div>
        <div className="mdf-micro">
          {t(
            `interval${interval.charAt(0).toUpperCase()}${interval.slice(1)}` as
              | "intervalHour"
              | "intervalDay"
              | "intervalWeek"
              | "intervalMonth",
          )}
        </div>
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
                <linearGradient id="rev-grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--mdf-cat-2)" stopOpacity={0.45} />
                  <stop offset="100%" stopColor="var(--mdf-cat-2)" stopOpacity={0.02} />
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
                tickFormatter={(v: number) => formatCurrency(v, currency)}
                width={60}
              />
              <Tooltip
                cursor={{ stroke: MDF_CURSOR_STROKE, strokeWidth: 1 }}
                contentStyle={MDF_TOOLTIP_STYLE}
                labelStyle={MDF_TOOLTIP_LABEL_STYLE}
                formatter={(value) => [
                  formatCurrency(typeof value === "number" ? value : 0, currency),
                  t("metricRevenue"),
                ]}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke="var(--mdf-cat-2)"
                strokeWidth={1.5}
                fill="url(#rev-grad)"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

register<Config>({
  id: "revenue-timeseries",
  displayName: "Revenue over time",
  description: "Attributed revenue chart with new / renewal / refund breakdown.",
  category: "timeseries",
  defaultSize: { w: 8, h: 4 },
  minSize: { w: 4, h: 3 },
  configSchema: configSchema as unknown as z.ZodType<Config>,
  defaultConfig: {},
  Component: RevenueTimeseries,
});
