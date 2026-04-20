"use client";

import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

import { formatNumber } from "@/lib/utils/format";

const COLORS = [
  "hsl(217 91% 60%)", // blue
  "hsl(142 71% 45%)", // emerald
  "hsl(38 92% 50%)", // amber
  "hsl(330 81% 60%)", // pink
  "hsl(250 91% 66%)", // indigo
  "hsl(186 91% 45%)", // cyan
  "hsl(346 77% 50%)", // rose
  "hsl(265 80% 66%)", // violet
];

export type DonutDatum = { name: string; value: number };

export function DonutBreakdown({
  title,
  rows,
  loading,
  error,
  total,
  totalLabel,
}: {
  title: string;
  rows: DonutDatum[] | undefined;
  loading: boolean;
  error: string | null;
  total?: number;
  totalLabel?: string;
}) {
  if (error) {
    return <div className="text-sm text-destructive">{error}</div>;
  }

  const data = (rows ?? []).filter((r) => r.value > 0);
  const sum =
    total !== undefined
      ? total
      : data.reduce((acc, r) => acc + r.value, 0);

  return (
    <div className="flex h-full flex-col">
      <div className="pb-2">
        <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {title}
        </div>
        {sum > 0 ? (
          <div className="text-xs text-muted-foreground">
            {formatNumber(sum)} {totalLabel ?? "total"}
          </div>
        ) : null}
      </div>
      <div className="flex-1 min-h-[160px]">
        {loading ? (
          <div className="h-full w-full animate-pulse rounded-full bg-muted/40" />
        ) : data.length === 0 ? (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            No data in this range
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
              <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                innerRadius="55%"
                outerRadius="85%"
                stroke="hsl(var(--card))"
                strokeWidth={2}
                paddingAngle={1}
              >
                {data.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  background: "hsl(var(--popover))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: 8,
                  fontSize: 12,
                }}
                formatter={(value, name) => [
                  formatNumber(typeof value === "number" ? value : 0),
                  String(name ?? ""),
                ]}
              />
              <Legend
                iconType="circle"
                verticalAlign="bottom"
                height={28}
                wrapperStyle={{ fontSize: 11 }}
              />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
