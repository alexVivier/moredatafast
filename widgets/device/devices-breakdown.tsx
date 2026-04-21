"use client";

import { useTranslations } from "next-intl";
import { z } from "zod";

import { useWidgetData } from "@/lib/hooks/use-widget-data";
import { register, type WidgetContext } from "@/widgets/registry";
import { DonutBreakdown } from "./donut-breakdown";

type Row = { device: string; visitors: number; revenue: number };
type Config = Record<string, never>;

const configSchema = z.object({}).passthrough();

export function DevicesBreakdown({ siteId }: WidgetContext<Config>) {
  const t = useTranslations("widgets.devices");
  const query = useWidgetData<Row[]>(siteId, "analytics/devices");
  const rows = (query.data?.data ?? []).map((r) => ({
    name: r.device,
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
  id: "devices-breakdown",
  displayName: "Devices",
  description: "Donut: desktop / mobile / tablet visitors.",
  category: "device",
  defaultSize: { w: 4, h: 4 },
  minSize: { w: 3, h: 3 },
  configSchema: configSchema as unknown as z.ZodType<Config>,
  defaultConfig: {},
  Component: DevicesBreakdown,
});
