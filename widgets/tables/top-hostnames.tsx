"use client";

import { z } from "zod";

import { useWidgetData } from "@/lib/hooks/use-widget-data";
import { register, type WidgetContext } from "@/widgets/registry";
import { TopMetricTable } from "./top-metric-table";

type Row = { hostname: string; visitors: number; revenue: number };
type Config = { limit: number };

const configSchema = z.object({
  limit: z.number().int().min(3).max(100).default(10),
});

export function TopHostnames({
  siteId,
  currency,
  config,
}: WidgetContext<Config>) {
  const query = useWidgetData<Row[]>(siteId, "analytics/hostnames", {
    limit: config.limit,
  });

  return (
    <TopMetricTable<Row>
      title="Top hostnames"
      rows={query.data?.data}
      loading={query.isLoading}
      error={query.error?.message ?? null}
      limit={config.limit}
      itemLabel="Hostname"
      rowKey={(r, i) => `${r.hostname}-${i}`}
      renderLabel={(r) => <span className="font-mono">{r.hostname}</span>}
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
  id: "top-hostnames",
  displayName: "Top hostnames",
  description: "Breakdown by subdomain / cross-domain tracked hostname.",
  category: "table",
  defaultSize: { w: 5, h: 4 },
  minSize: { w: 3, h: 3 },
  configSchema: configSchema as unknown as z.ZodType<Config>,
  defaultConfig: { limit: 10 },
  Component: TopHostnames,
});
