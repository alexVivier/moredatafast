"use client";

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
  type HeatmapMetric,
  formatMetric,
  intensityColor,
  metricSchema,
  parseWallClock,
  dowMondayFirst,
} from "./_shared";

type Config = { metric: HeatmapMetric };

const configSchema = z.object({ metric: metricSchema.default("visitors") });

const DAY_LABELS = ["Mon", "Wed", "Fri"]; // sparse labels to avoid crowding
const MONTH_NAMES = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

type DayCell = {
  ymd: string;
  year: number;
  month: number;
  day: number;
  dow: number; // 0=Mon..6=Sun
  value: number;
  known: boolean;
};

function parseYmd(ymd: string): { y: number; m: number; d: number } {
  const [y, m, d] = ymd.split("-").map(Number);
  return { y, m: m - 1, d };
}

function ymdToDate(y: number, m: number, d: number): Date {
  return new Date(Date.UTC(y, m, d));
}

function dateToYmd(d: Date): string {
  const y = d.getUTCFullYear();
  const mo = String(d.getUTCMonth() + 1).padStart(2, "0");
  const da = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${mo}-${da}`;
}

export function CalendarHeatmap({
  siteId,
  currency,
  dateRange,
  config,
}: WidgetContext<Config>) {
  const metric = config.metric;

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

  const { weeks, max, monthMarkers } = useMemo(() => {
    const byDay = new Map<string, number>();
    const envelope = query.data as unknown as TimeseriesResponse | undefined;
    const points = envelope?.data ?? [];
    for (const p of points) {
      const wc = parseWallClock(p.timestamp);
      if (!wc) continue;
      const ymd = `${wc.year}-${String(wc.month + 1).padStart(2, "0")}-${String(
        wc.day,
      ).padStart(2, "0")}`;
      const raw = (p as Record<string, unknown>)[metric];
      if (typeof raw !== "number" || !Number.isFinite(raw)) continue;
      byDay.set(ymd, (byDay.get(ymd) ?? 0) + raw);
    }

    // Build the contiguous day range from startAt..endAt inclusive.
    const start = parseYmd(dateRange.startAt);
    const end = parseYmd(dateRange.endAt);
    const firstDate = ymdToDate(start.y, start.m, start.d);
    const lastDate = ymdToDate(end.y, end.m, end.d);

    // Pad to the previous Monday for a rectangular grid.
    const firstDow = dowMondayFirst(start.y, start.m, start.d);
    const gridStart = new Date(firstDate.getTime());
    gridStart.setUTCDate(gridStart.getUTCDate() - firstDow);

    // Pad forward to the following Sunday.
    const lastDow = dowMondayFirst(end.y, end.m, end.d);
    const gridEnd = new Date(lastDate.getTime());
    gridEnd.setUTCDate(gridEnd.getUTCDate() + (6 - lastDow));

    const weeksArr: DayCell[][] = [];
    const markers: { weekIndex: number; label: string }[] = [];
    let currentWeek: DayCell[] = [];
    let m = 0;
    let lastMonthSeen = -1;
    let weekIndex = 0;

    const cursor = new Date(gridStart.getTime());
    while (cursor.getTime() <= gridEnd.getTime()) {
      const y = cursor.getUTCFullYear();
      const mo = cursor.getUTCMonth();
      const da = cursor.getUTCDate();
      const ymd = dateToYmd(cursor);
      const dow = dowMondayFirst(y, mo, da);
      const inRange =
        cursor.getTime() >= firstDate.getTime() &&
        cursor.getTime() <= lastDate.getTime();
      const value = inRange ? byDay.get(ymd) ?? 0 : 0;

      currentWeek.push({
        ymd,
        year: y,
        month: mo,
        day: da,
        dow,
        value,
        known: inRange,
      });
      if (inRange && value > m) m = value;

      if (dow === 6) {
        // Sunday closes the week
        weeksArr.push(currentWeek);
        currentWeek = [];
        weekIndex += 1;
      }

      // Month marker when a new month first appears inside a week
      if (inRange && mo !== lastMonthSeen) {
        lastMonthSeen = mo;
        markers.push({ weekIndex, label: MONTH_NAMES[mo] });
      }

      cursor.setUTCDate(cursor.getUTCDate() + 1);
    }
    if (currentWeek.length > 0) weeksArr.push(currentWeek);

    return { weeks: weeksArr, max: m, monthMarkers: markers };
  }, [query.data, metric, dateRange.startAt, dateRange.endAt]);

  if (query.error) return <HeatmapError message={query.error.message} />;
  if (query.isLoading) return <HeatmapLoading />;
  if (weeks.length === 0 || max === 0)
    return <HeatmapEmpty text="No daily data for the selected range." />;

  return (
    <div className="flex h-full flex-col gap-2">
      <div className="flex items-baseline justify-between gap-2">
        <div className="mdf-micro">
          {METRIC_LABEL[metric]} — calendar view
        </div>
        <HeatmapLegend
          min={0}
          max={max}
          format={(n) => formatMetric(n, metric, currency)}
        />
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-1">
        {/* Month markers aligned with weeks */}
        <div
          className="grid gap-1 pl-6 text-[10px] text-mdf-fg-3"
          style={{
            gridTemplateColumns: `repeat(${weeks.length}, minmax(0, 1fr))`,
          }}
        >
          {Array.from({ length: weeks.length }, (_, i) => {
            const marker = monthMarkers.find((mm) => mm.weekIndex === i);
            return (
              <div key={i} className="truncate text-left">
                {marker?.label ?? ""}
              </div>
            );
          })}
        </div>

        <div className="flex min-h-0 flex-1 gap-1">
          {/* Day labels (Mon / Wed / Fri) */}
          <div className="flex w-5 flex-col justify-between py-[2px] text-[9px] text-mdf-fg-3">
            {DAY_LABELS.map((d) => (
              <div key={d}>{d}</div>
            ))}
          </div>

          {/* Week columns — each 7 rows tall */}
          <div
            className="grid flex-1 gap-1 min-w-0"
            style={{
              gridTemplateColumns: `repeat(${weeks.length}, minmax(0, 1fr))`,
            }}
          >
            {weeks.map((week, i) => (
              <div key={i} className="grid grid-rows-7 gap-[2px] min-h-0">
                {Array.from({ length: 7 }, (_, rowDow) => {
                  const cell = week.find((c) => c.dow === rowDow);
                  if (!cell || !cell.known) {
                    return (
                      <div
                        key={rowDow}
                        className="rounded-[2px]"
                        style={{ background: "transparent" }}
                      />
                    );
                  }
                  const t = max > 0 ? cell.value / max : 0;
                  return (
                    <div
                      key={rowDow}
                      className="rounded-[2px]"
                      style={{ background: intensityColor(t) }}
                      title={`${cell.ymd} — ${formatMetric(cell.value, metric, currency)}`}
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
  id: "calendar-heatmap",
  displayName: "Calendar heatmap",
  description:
    "GitHub-style calendar. Days colored by intensity over the selected range — shows seasonality and outliers at a glance.",
  category: "timeseries",
  defaultSize: { w: 12, h: 3 },
  minSize: { w: 6, h: 2 },
  mobileSize: { h: 4 },
  configSchema: configSchema as unknown as z.ZodType<Config>,
  defaultConfig: { metric: "visitors" },
  Component: CalendarHeatmap,
});
