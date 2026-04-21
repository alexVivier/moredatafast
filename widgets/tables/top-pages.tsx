"use client";

import { useTranslations } from "next-intl";
import { z } from "zod";

import { useWidgetData } from "@/lib/hooks/use-widget-data";
import { formatCurrency, formatNumber } from "@/lib/utils/format";
import { register, type WidgetContext } from "@/widgets/registry";

type Row = {
  hostname: string;
  path: string;
  visitors: number;
  revenue: number;
};

type Config = { limit: number };

const configSchema = z.object({
  limit: z.number().int().min(3).max(100).default(10),
});

export function TopPages({
  siteId,
  currency,
  config,
}: WidgetContext<Config>) {
  const t = useTranslations("widgets");
  const query = useWidgetData<Row[]>(siteId, "analytics/pages", {
    limit: config.limit,
  });

  if (query.error) {
    return (
      <div className="text-sm text-destructive">{query.error.message}</div>
    );
  }

  const rows = query.data?.data ?? [];
  const maxVisitors = Math.max(1, ...rows.map((r) => r.visitors));

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-baseline justify-between pb-2">
        <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {t("pages.displayName")}
        </div>
        <div className="text-xs text-muted-foreground">
          {t("table.top", { n: config.limit })}
        </div>
      </div>
      <div className="flex-1 min-h-0 overflow-auto">
        {query.isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="h-6 w-full animate-pulse rounded bg-muted/40"
              />
            ))}
          </div>
        ) : rows.length === 0 ? (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            {t("table.empty")}
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-xs uppercase tracking-wider text-muted-foreground">
                <th className="text-left font-medium py-1.5">{t("table.colPage")}</th>
                <th className="text-right font-medium py-1.5 w-24">
                  {t("table.colVisitors")}
                </th>
                <th className="text-right font-medium py-1.5 w-24">
                  {t("table.colRevenue")}
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => {
                const bar = (r.visitors / maxVisitors) * 100;
                return (
                  <tr
                    key={`${r.hostname}${r.path}${i}`}
                    className="border-b border-border/40 last:border-0 hover:bg-accent/30 transition-colors"
                  >
                    <td className="py-1.5 relative">
                      <div
                        className="absolute inset-y-0 left-0 bg-primary/10 rounded-sm"
                        style={{ width: `${bar}%` }}
                        aria-hidden
                      />
                      <span className="relative font-mono text-xs truncate block pr-2">
                        {r.path}
                      </span>
                    </td>
                    <td className="py-1.5 text-right tabular-nums">
                      {formatNumber(r.visitors)}
                    </td>
                    <td className="py-1.5 text-right tabular-nums text-muted-foreground">
                      {r.revenue > 0 ? formatCurrency(r.revenue, currency) : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

register<Config>({
  id: "top-pages",
  displayName: "Top pages",
  description: "Most-visited pages with visitor counts and attributed revenue.",
  category: "table",
  defaultSize: { w: 6, h: 4 },
  minSize: { w: 4, h: 3 },
  configSchema: configSchema as unknown as z.ZodType<Config>,
  defaultConfig: { limit: 10 },
  Component: TopPages,
});
