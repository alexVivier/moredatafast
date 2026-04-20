"use client";

import { z } from "zod";

import { useWidgetData } from "@/lib/hooks/use-widget-data";
import { register, type WidgetContext } from "@/widgets/registry";
import { TopMetricTable } from "@/widgets/tables/top-metric-table";

type Row = { city: string; visitors: number; revenue: number };
type Config = { limit: number };

const configSchema = z.object({
  limit: z.number().int().min(3).max(100).default(10),
});

export function CitiesTable({
  siteId,
  currency,
  config,
}: WidgetContext<Config>) {
  const query = useWidgetData<Row[]>(siteId, "analytics/cities", {
    limit: config.limit,
  });

  return (
    <TopMetricTable<Row>
      title="Cities"
      rows={query.data?.data}
      loading={query.isLoading}
      error={query.error?.message ?? null}
      limit={config.limit}
      itemLabel="City"
      rowKey={(r, i) => `${r.city}-${i}`}
      renderLabel={(r) => r.city}
      primary={(r) => r.visitors}
      primaryLabel="Visitors"
      secondary={(r) => r.revenue}
      secondaryLabel="Revenue"
      secondaryFormat="currency"
      currency={currency}
    />
  );
}

register<Config>({
  id: "cities-table",
  displayName: "Cities",
  description: "Visitor breakdown by city.",
  category: "geo",
  defaultSize: { w: 5, h: 4 },
  minSize: { w: 3, h: 3 },
  configSchema: configSchema as unknown as z.ZodType<Config>,
  defaultConfig: { limit: 10 },
  Component: CitiesTable,
});
