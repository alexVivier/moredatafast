"use client";

import { useTranslations } from "next-intl";
import { z } from "zod";

import { useWidgetData } from "@/lib/hooks/use-widget-data";
import { register, type WidgetContext } from "@/widgets/registry";
import { TopMetricTable } from "@/widgets/tables/top-metric-table";

type Row = { region: string; visitors: number; revenue: number };
type Config = { limit: number };

const configSchema = z.object({
  limit: z.number().int().min(3).max(100).default(10),
});

export function RegionsTable({
  siteId,
  currency,
  config,
}: WidgetContext<Config>) {
  const t = useTranslations("widgets");
  const query = useWidgetData<Row[]>(siteId, "analytics/regions", {
    limit: config.limit,
  });

  return (
    <TopMetricTable<Row>
      title={t("regions.displayName")}
      rows={query.data?.data}
      loading={query.isLoading}
      error={query.error?.message ?? null}
      limit={config.limit}
      itemLabel={t("table.colRegion")}
      rowKey={(r, i) => `${r.region}-${i}`}
      renderLabel={(r) => r.region}
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
  id: "regions-table",
  displayName: "Regions",
  description: "Visitor breakdown by state / region.",
  category: "geo",
  defaultSize: { w: 5, h: 4 },
  minSize: { w: 3, h: 3 },
  configSchema: configSchema as unknown as z.ZodType<Config>,
  defaultConfig: { limit: 10 },
  Component: RegionsTable,
});
