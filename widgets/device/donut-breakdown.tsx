"use client";

import { useTranslations } from "next-intl";
import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

import { formatNumber } from "@/lib/utils/format";
import { MDF_CATEGORICAL, MDF_TOOLTIP_STYLE } from "@/lib/charts/chart-theme";

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
  const t = useTranslations("widgets.devices");
  if (error) {
    return <div className="text-sm text-mdf-danger">{error}</div>;
  }

  const data = (rows ?? []).filter((r) => r.value > 0);
  const sum =
    total !== undefined
      ? total
      : data.reduce((acc, r) => acc + r.value, 0);

  return (
    <div className="flex h-full flex-col">
      <div className="pb-2">
        <div className="mdf-micro">{title}</div>
        {sum > 0 ? (
          <div className="text-xs text-mdf-fg-3 font-mono tabular-nums">
            {formatNumber(sum)} {totalLabel ?? t("totalLabel")}
          </div>
        ) : null}
      </div>
      <div className="flex-1 min-h-[160px]">
        {loading ? (
          <div className="h-full w-full animate-pulse rounded-full bg-mdf-line-1" />
        ) : data.length === 0 ? (
          <div className="flex h-full items-center justify-center text-sm text-mdf-fg-3">
            {t("empty")}
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
                stroke="var(--mdf-bg-surface)"
                strokeWidth={2}
                paddingAngle={1}
              >
                {data.map((_, i) => (
                  <Cell key={i} fill={MDF_CATEGORICAL[i % MDF_CATEGORICAL.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={MDF_TOOLTIP_STYLE}
                formatter={(value, name) => [
                  formatNumber(typeof value === "number" ? value : 0),
                  String(name ?? ""),
                ]}
              />
              <Legend
                iconType="circle"
                verticalAlign="bottom"
                height={28}
                wrapperStyle={{
                  fontSize: 10,
                  color: "var(--mdf-fg-3)",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  fontWeight: 500,
                }}
                iconSize={8}
              />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
