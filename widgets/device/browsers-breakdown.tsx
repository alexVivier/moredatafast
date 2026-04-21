"use client";

import { useTranslations } from "next-intl";
import { z } from "zod";

import { useWidgetData } from "@/lib/hooks/use-widget-data";
import { register, type WidgetContext } from "@/widgets/registry";
import { DonutBreakdown } from "./donut-breakdown";

type Row = { browser: string; visitors: number; revenue: number };
type Config = { limit: number };

const configSchema = z.object({
  limit: z.number().int().min(3).max(20).default(8),
});

export function BrowsersBreakdown({ siteId, config }: WidgetContext<Config>) {
  const t = useTranslations("widgets.browsers");
  const query = useWidgetData<Row[]>(siteId, "analytics/browsers", {
    limit: config.limit,
  });
  const rows = (query.data?.data ?? []).map((r) => ({
    name: r.browser,
    value: r.visitors,
  }));

  return (
    <DonutBreakdown
      title={t("displayName")}
      rows={rows}
      loading={query.isLoading}
      error={query.error?.message ?? null}
      totalLabel={t("totalLabel")}
    />
  );
}

register<Config>({
  id: "browsers-breakdown",
  displayName: "Browsers",
  description: "Donut: top browsers by visitors.",
  category: "device",
  defaultSize: { w: 4, h: 4 },
  minSize: { w: 3, h: 3 },
  configSchema: configSchema as unknown as z.ZodType<Config>,
  defaultConfig: { limit: 8 },
  Component: BrowsersBreakdown,
});
