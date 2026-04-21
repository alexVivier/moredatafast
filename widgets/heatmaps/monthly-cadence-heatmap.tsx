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
  type HeatmapMetric,
  formatMetric,
  intensityColor,
  metricSchema,
  parseWallClock,
} from "./_shared";

type Config = { metric: HeatmapMetric };

const configSchema = z.object({ metric: metricSchema.default("visitors") });

const MONTH_KEYS = [
  "monthJan",
  "monthFeb",
  "monthMar",
  "monthApr",
  "monthMay",
  "monthJun",
  "monthJul",
  "monthAug",
  "monthSep",
  "monthOct",
  "monthNov",
  "monthDec",
] as const;

const METRIC_KEY: Record<HeatmapMetric, "metricVisitors" | "metricSessions" | "metricRevenue" | "metricConversion"> = {
  visitors: "metricVisitors",
  sessions: "metricSessions",
  revenue: "metricRevenue",
  conversion_rate: "metricConversion",
};

function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
}

export function MonthlyCadenceHeatmap({
  siteId,
  currency,
  dateRange,
  config,
}: WidgetContext<Config>) {
  const t = useTranslations("widgets.heatmap");
  const metric = config.metric;
  const MONTH_SHORT = MONTH_KEYS.map((k) => t(k));
  const metricLabel = t(METRIC_KEY[metric]);

  const query = useWidgetData<TimeseriesResponse>(
    siteId,
    "analytics/timeseries",
    {
      fields: `${metric},name`,
      interval: "day",
      startAt: dateRange.startAt,
      endAt: dateRange.endAt,
    },
  );

  const { rows, max, totalMonths } = useMemo(() => {
    type Row = { year: number; month: number; values: (number | null)[] };
    const map = new Map<string, Row>();
    const envelope = query.data as unknown as TimeseriesResponse | undefined;
    const points = envelope?.data ?? [];
    let m = 0;

    for (const p of points) {
      const wc = parseWallClock(p.timestamp);
      if (!wc) continue;
      const raw = (p as Record<string, unknown>)[metric];
      if (typeof raw !== "number" || !Number.isFinite(raw)) continue;
      const key = `${wc.year}-${wc.month}`;
      let row = map.get(key);
      if (!row) {
        const size = daysInMonth(wc.year, wc.month);
        row = {
          year: wc.year,
          month: wc.month,
          values: Array.from({ length: size }, (_, i) =>
            i < daysInMonth(wc.year, wc.month) ? 0 : null,
          ),
        };
        map.set(key, row);
      }
      const idx = wc.day - 1;
      if (idx >= 0 && idx < row.values.length) {
        const current = row.values[idx] ?? 0;
        row.values[idx] = current + raw;
        if ((row.values[idx] as number) > m) m = row.values[idx] as number;
      }
    }

    const rowsArr = Array.from(map.values()).sort((a, b) => {
      if (a.year !== b.year) return a.year - b.year;
      return a.month - b.month;
    });

    return { rows: rowsArr, max: m, totalMonths: rowsArr.length };
  }, [query.data, metric]);

  if (query.error) return <HeatmapError message={query.error.message} />;
  if (query.isLoading) return <HeatmapLoading />;
  if (totalMonths === 0)
    return <HeatmapEmpty text={t("emptyDaily")} />;

  // Pad every row to 31 columns so the grid stays rectangular even for Feb.
  const COLS = 31;
  const DAY_MARKS = [1, 5, 10, 15, 20, 25, 30];

  return (
    <div className="flex h-full flex-col gap-2">
      <div className="flex items-baseline justify-between gap-2">
        <div className="mdf-micro">
          {t("labelCadenceAxis", { metric: metricLabel })}
        </div>
        <HeatmapLegend
          min={0}
          max={max}
          format={(n) => formatMetric(n, metric, currency)}
        />
      </div>

      <div className="flex min-h-0 flex-1 gap-2">
        {/* Month labels on the left */}
        <div className="flex w-[44px] shrink-0 flex-col gap-[2px] text-[10px] font-mono text-mdf-fg-3">
          {rows.map((r) => (
            <div
              key={`${r.year}-${r.month}`}
              className="flex min-h-0 flex-1 items-center"
            >
              {MONTH_SHORT[r.month]}{" "}
              <span className="ml-1 text-mdf-fg-4">
                &apos;{String(r.year).slice(-2)}
              </span>
            </div>
          ))}
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-1">
          {/* Day-of-month column labels (sparse) */}
          <div
            className="grid text-center text-[9px] font-mono text-mdf-fg-3"
            style={{ gridTemplateColumns: `repeat(${COLS}, minmax(0, 1fr))` }}
          >
            {Array.from({ length: COLS }, (_, i) => {
              const day = i + 1;
              return (
                <div key={day}>{DAY_MARKS.includes(day) ? day : ""}</div>
              );
            })}
          </div>

          {/* Rows */}
          <div className="flex min-h-0 flex-1 flex-col gap-[2px]">
            {rows.map((r) => {
              const rowMax = daysInMonth(r.year, r.month);
              return (
                <div
                  key={`${r.year}-${r.month}`}
                  className="grid min-h-0 flex-1 gap-[2px]"
                  style={{
                    gridTemplateColumns: `repeat(${COLS}, minmax(0, 1fr))`,
                  }}
                >
                  {Array.from({ length: COLS }, (_, col) => {
                    const day = col + 1;
                    if (day > rowMax) {
                      return (
                        <div
                          key={col}
                          className="rounded-[2px]"
                          style={{ background: "transparent" }}
                        />
                      );
                    }
                    const raw = r.values[day - 1];
                    const v = raw ?? 0;
                    const t = max > 0 ? v / max : 0;
                    return (
                      <div
                        key={col}
                        className="rounded-[2px]"
                        style={{ background: intensityColor(t) }}
                        title={`${MONTH_SHORT[r.month]} ${day}, ${r.year} — ${formatMetric(v, metric, currency)}`}
                      />
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

register<Config>({
  id: "monthly-cadence-heatmap",
  displayName: "Monthly cadence heatmap",
  description:
    "Day-of-month × month. Surfaces rhythms that align with the calendar — paydays, invoicing cycles, end-of-month effects.",
  category: "timeseries",
  defaultSize: { w: 12, h: 4 },
  minSize: { w: 6, h: 3 },
  mobileSize: { h: 5 },
  configSchema: configSchema as unknown as z.ZodType<Config>,
  defaultConfig: { metric: "visitors" },
  Component: MonthlyCadenceHeatmap,
});
