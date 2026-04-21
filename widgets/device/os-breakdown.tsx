"use client";

import { useTranslations } from "next-intl";
import { z } from "zod";

import { useWidgetData } from "@/lib/hooks/use-widget-data";
import { register, type WidgetContext } from "@/widgets/registry";
import { DonutBreakdown } from "./donut-breakdown";

type Row = { operating_system: string; visitors: number; revenue: number };
type Config = { limit: number };

const configSchema = z.object({
  limit: z.number().int().min(3).max(20).default(8),
});

export function OsBreakdown({ siteId, config }: WidgetContext<Config>) {
  const t = useTranslations("widgets.os");
  const query = useWidgetData<Row[]>(siteId, "analytics/operating-systems", {
    limit: config.limit,
  });
  const rows = (query.data?.data ?? []).map((r) => ({
    name: r.operating_system,
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
  id: "os-breakdown",
  displayName: "Operating systems",
  description: "Donut: OS distribution by visitors.",
  category: "device",
  defaultSize: { w: 4, h: 4 },
  minSize: { w: 3, h: 3 },
  configSchema: configSchema as unknown as z.ZodType<Config>,
  defaultConfig: { limit: 8 },
  Component: OsBreakdown,
});
