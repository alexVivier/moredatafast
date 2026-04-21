"use client";

import { useTranslations } from "next-intl";
import { useMemo } from "react";
import { z } from "zod";

import { useWidgetData } from "@/lib/hooks/use-widget-data";
import type { TimeseriesResponse } from "@/lib/datafast/types";
import { register, type WidgetContext } from "@/widgets/registry";

import {
  HeatmapEmpty,
  HeatmapError,
  HeatmapLegend,
  HeatmapLoading,
  METRIC_LABEL,
  METRIC_VALUES,
  type HeatmapMetric,
  formatMetric,
  intensityColor,
  metricSchema,
  parseWallClock,
  dowMondayFirst,
} from "./_shared";

type Config = { metric: HeatmapMetric };

const configSchema = z.object({ metric: metricSchema.default("visitors") });

const DAY_KEYS = [
  "dayMon",
  "dayTue",
  "dayWed",
  "dayThu",
  "dayFri",
  "daySat",
  "daySun",
] as const;
const HOURS = Array.from({ length: 24 }, (_, i) => i);

const METRIC_KEY: Record<HeatmapMetric, "metricVisitors" | "metricSessions" | "metricRevenue" | "metricConversion"> = {
  visitors: "metricVisitors",
  sessions: "metricSessions",
  revenue: "metricRevenue",
  conversion_rate: "metricConversion",
};

export function TrafficHeatmap({
  siteId,
  currency,
  dateRange,
  config,
}: WidgetContext<Config>) {
  const t = useTranslations("widgets.heatmap");
  const metric = config.metric;
  const dayLabels = DAY_KEYS.map((k) => t(k));
  const metricLabel = t(METRIC_KEY[metric]);

  const query = useWidgetData<TimeseriesResponse>(
    siteId,
    "analytics/timeseries",
    {
      fields: `${metric},name`,
      interval: "hour",
      startAt: dateRange.startAt,
      endAt: dateRange.endAt,
    },
  );

  const { grid, max, totalPoints } = useMemo(() => {
    const g: number[][] = Array.from({ length: 7 }, () => Array(24).fill(0));
    const count: number[][] = Array.from({ length: 7 }, () =>
      Array(24).fill(0),
    );
    let m = 0;
    let total = 0;
    const envelope = query.data as unknown as TimeseriesResponse | undefined;
    const points = envelope?.data ?? [];
    for (const p of points) {
      const wc = parseWallClock(p.timestamp);
      if (!wc) continue;
      const col = dowMondayFirst(wc.year, wc.month, wc.day);
      const row = wc.hour;
      const raw = (p as Record<string, unknown>)[metric];
      if (typeof raw !== "number" || !Number.isFinite(raw)) continue;
      // Conversion rate averages; everything else sums.
      if (metric === "conversion_rate") {
        g[col][row] += raw;
        count[col][row] += 1;
      } else {
        g[col][row] += raw;
      }
      total += 1;
    }
    if (metric === "conversion_rate") {
      for (let c = 0; c < 7; c++) {
        for (let r = 0; r < 24; r++) {
          if (count[c][r] > 0) g[c][r] = g[c][r] / count[c][r];
        }
      }
    }
    for (let c = 0; c < 7; c++) {
      for (let r = 0; r < 24; r++) {
        if (g[c][r] > m) m = g[c][r];
      }
    }
    return { grid: g, max: m, totalPoints: total };
  }, [query.data, metric]);

  if (query.error) return <HeatmapError message={query.error.message} />;
  if (query.isLoading) return <HeatmapLoading />;
  if (totalPoints === 0)
    return <HeatmapEmpty text={t("emptyHourly")} />;

  return (
    <div className="flex h-full flex-col gap-2">
      <div className="flex items-baseline justify-between gap-2">
        <div className="mdf-micro">
          {t("labelTrafficAxis", { metric: metricLabel })}
        </div>
        <HeatmapLegend
          min={0}
          max={max}
          format={(n) => formatMetric(n, metric, currency)}
        />
      </div>

      <div className="flex min-h-0 flex-1 gap-2">
        {/* Hour labels on the left (every 6h) */}
        <div className="flex flex-col justify-between py-3 text-[9px] font-mono tabular-nums text-mdf-fg-3">
          {[0, 6, 12, 18, 23].map((h) => (
            <div key={h}>{String(h).padStart(2, "0")}h</div>
          ))}
        </div>

        {/* Grid: 7 day columns, each with 24 hour rows */}
        <div className="flex flex-1 flex-col gap-1 min-w-0">
          <div className="grid grid-cols-7 gap-1 text-[10px] text-mdf-fg-3 text-center">
            {dayLabels.map((d) => (
              <div key={d}>{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1 flex-1 min-h-0">
            {Array.from({ length: 7 }, (_, col) => (
              <div
                key={col}
                className="flex flex-col gap-[2px] min-h-0"
              >
                {HOURS.map((row) => {
                  const v = grid[col][row];
                  const t = max > 0 ? v / max : 0;
                  return (
                    <div
                      key={row}
                      className="flex-1 rounded-[2px] transition-colors"
                      style={{ background: intensityColor(t) }}
                      title={`${dayLabels[col]} ${String(row).padStart(2, "0")}h — ${formatMetric(v, metric, currency)}`}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

register<Config>({
  id: "traffic-heatmap",
  displayName: "Traffic heatmap (hour × day)",
  description:
    "Reveals intra-week time-of-day patterns. Each cell = an hour slot across the selected range.",
  category: "timeseries",
  defaultSize: { w: 6, h: 7 },
  minSize: { w: 4, h: 5 },
  mobileSize: { h: 8 },
  configSchema: configSchema as unknown as z.ZodType<Config>,
  defaultConfig: { metric: "visitors" },
  Component: TrafficHeatmap,
});
