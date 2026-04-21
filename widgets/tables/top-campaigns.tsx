"use client";

import { useTranslations } from "next-intl";
import { z } from "zod";

import { useWidgetData } from "@/lib/hooks/use-widget-data";
import { register, type WidgetContext } from "@/widgets/registry";
import { TopMetricTable } from "./top-metric-table";

type CampaignObj = {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_term?: string;
  utm_content?: string;
  ref?: string;
  source?: string;
  via?: string;
};

type Row = { campaign: CampaignObj; visitors: number; revenue: number };
type Config = { limit: number };

const configSchema = z.object({
  limit: z.number().int().min(3).max(100).default(10),
});

function summarizeCampaign(c: CampaignObj): string {
  // Prefer the most specific non-empty value for the primary label.
  if (c.utm_campaign) {
    const medium = c.utm_medium ? ` · ${c.utm_medium}` : "";
    const src = c.utm_source ? ` (${c.utm_source})` : "";
    return `${c.utm_campaign}${medium}${src}`;
  }
  if (c.utm_source) {
    const medium = c.utm_medium ? ` · ${c.utm_medium}` : "";
    return `${c.utm_source}${medium}`;
  }
  if (c.ref) return `ref:${c.ref}`;
  if (c.source) return `source:${c.source}`;
  if (c.via) return `via:${c.via}`;
  return "—";
}

function keyForCampaign(c: CampaignObj): string {
  return [
    c.utm_source,
    c.utm_medium,
    c.utm_campaign,
    c.utm_term,
    c.utm_content,
    c.ref,
    c.source,
    c.via,
  ]
    .map((v) => v ?? "")
    .join("|");
}

export function TopCampaigns({
  siteId,
  currency,
  config,
}: WidgetContext<Config>) {
  const t = useTranslations("widgets");
  const query = useWidgetData<Row[]>(siteId, "analytics/campaigns", {
    limit: config.limit,
  });

  return (
    <TopMetricTable<Row>
      title={t("campaigns.displayName")}
      rows={query.data?.data}
      loading={query.isLoading}
      error={query.error?.message ?? null}
      limit={config.limit}
      itemLabel={t("table.colCampaign")}
      rowKey={(r, i) => `${keyForCampaign(r.campaign)}-${i}`}
      renderLabel={(r) => summarizeCampaign(r.campaign)}
      primary={(r) => r.visitors}
      primaryLabel={t("table.colVisitors")}
      secondary={(r) => r.revenue}
      secondaryLabel={t("table.colRevenue")}
      secondaryFormat="currency"
      currency={currency}
      emptyHint={t("campaigns.empty")}
    />
  );
}

register<Config>({
  id: "top-campaigns",
  displayName: "Top campaigns",
  description: "UTM & ref-tagged traffic grouped by campaign.",
  category: "table",
  defaultSize: { w: 6, h: 4 },
  minSize: { w: 4, h: 3 },
  configSchema: configSchema as unknown as z.ZodType<Config>,
  defaultConfig: { limit: 10 },
  Component: TopCampaigns,
});
