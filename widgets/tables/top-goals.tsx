"use client";

import { useTranslations } from "next-intl";
import { z } from "zod";

import { useWidgetData } from "@/lib/hooks/use-widget-data";
import { register, type WidgetContext } from "@/widgets/registry";
import { TopMetricTable } from "./top-metric-table";

type Row = { goal: string; completions: number; visitors: number };
type Config = { limit: number };

const configSchema = z.object({
  limit: z.number().int().min(3).max(100).default(10),
});

export function TopGoals({ siteId, config }: WidgetContext<Config>) {
  const t = useTranslations("widgets");
  const query = useWidgetData<Row[]>(siteId, "analytics/goals", {
    limit: config.limit,
  });

  return (
    <TopMetricTable<Row>
      title={t("goals.displayName")}
      rows={query.data?.data}
      loading={query.isLoading}
      error={query.error?.message ?? null}
      limit={config.limit}
      itemLabel={t("table.colGoal")}
      rowKey={(r, i) => `${r.goal}-${i}`}
      renderLabel={(r) => (
        <span className="font-mono">{r.goal}</span>
      )}
      primary={(r) => r.completions}
      primaryLabel={t("table.colVisitors")}
      secondary={(r) => r.visitors}
      secondaryLabel={t("table.colVisitors")}
      secondaryFormat="number"
    />
  );
}

register<Config>({
  id: "top-goals",
  displayName: "Top goals",
  description: "Custom events tracked via datafast(goal) or data-fast-goal attributes.",
  category: "table",
  defaultSize: { w: 6, h: 4 },
  minSize: { w: 4, h: 3 },
  configSchema: configSchema as unknown as z.ZodType<Config>,
  defaultConfig: { limit: 10 },
  Component: TopGoals,
});
