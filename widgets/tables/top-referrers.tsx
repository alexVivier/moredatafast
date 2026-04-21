"use client";

import { useTranslations } from "next-intl";
import { z } from "zod";

import { useWidgetData } from "@/lib/hooks/use-widget-data";
import { register, type WidgetContext } from "@/widgets/registry";
import { TopMetricTable } from "./top-metric-table";

type Row = { referrer: string; visitors: number; revenue: number };
type Config = { limit: number };

const configSchema = z.object({
  limit: z.number().int().min(3).max(100).default(10),
});

export function TopReferrers({
  siteId,
  currency,
  config,
}: WidgetContext<Config>) {
  const t = useTranslations("widgets");
  const query = useWidgetData<Row[]>(siteId, "analytics/referrers", {
    limit: config.limit,
  });

  return (
    <TopMetricTable<Row>
      title={t("referrers.displayName")}
      rows={query.data?.data}
      loading={query.isLoading}
      error={query.error?.message ?? null}
      limit={config.limit}
      itemLabel={t("table.colReferrer")}
      rowKey={(r, i) => `${r.referrer}-${i}`}
      renderLabel={(r) => r.referrer || "—"}
      primary={(r) => r.visitors}
      primaryLabel={t("table.colVisitors")}
      secondary={(r) => r.revenue}
      secondaryLabel={t("table.colRevenue")}
      secondaryFormat="currency"
      currency={currency}
    />
  );
}

register<Config>({
  id: "top-referrers",
  displayName: "Top referrers",
  description: "Where visitors are coming from — sources, affiliates, search.",
  category: "table",
  defaultSize: { w: 6, h: 4 },
  minSize: { w: 4, h: 3 },
  configSchema: configSchema as unknown as z.ZodType<Config>,
  defaultConfig: { limit: 10 },
  Component: TopReferrers,
});
