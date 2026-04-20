"use client";

import { z } from "zod";

import { useWidgetData } from "@/lib/hooks/use-widget-data";
import { register, type WidgetContext } from "@/widgets/registry";
import { TopMetricTable } from "@/widgets/tables/top-metric-table";

type Row = {
  country: string;
  image: string; // flag SVG URL
  visitors: number;
  revenue: number;
};
type Config = { limit: number };

const configSchema = z.object({
  limit: z.number().int().min(3).max(100).default(10),
});

export function CountriesTable({
  siteId,
  currency,
  config,
}: WidgetContext<Config>) {
  const query = useWidgetData<Row[]>(siteId, "analytics/countries", {
    limit: config.limit,
  });

  return (
    <TopMetricTable<Row>
      title="Countries"
      rows={query.data?.data}
      loading={query.isLoading}
      error={query.error?.message ?? null}
      limit={config.limit}
      itemLabel="Country"
      rowKey={(r, i) => `${r.country}-${i}`}
      renderLabel={(r) => (
        <span className="inline-flex items-center gap-2">
          {r.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={r.image}
              alt=""
              className="h-3 w-4 rounded-sm object-cover shrink-0"
              loading="lazy"
            />
          ) : null}
          <span className="truncate">{r.country}</span>
        </span>
      )}
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
  id: "countries-table",
  displayName: "Countries",
  description: "Visitor breakdown by country with flags and revenue.",
  category: "geo",
  defaultSize: { w: 5, h: 4 },
  minSize: { w: 3, h: 3 },
  configSchema: configSchema as unknown as z.ZodType<Config>,
  defaultConfig: { limit: 10 },
  Component: CountriesTable,
});
