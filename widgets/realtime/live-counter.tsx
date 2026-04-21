"use client";

import { useTranslations } from "next-intl";
import { z } from "zod";

import { useWidgetData } from "@/lib/hooks/use-widget-data";
import { formatNumber } from "@/lib/utils/format";
import { register, type WidgetContext } from "@/widgets/registry";

type Row = { visitors: number };
type Config = Record<string, never>;

const configSchema = z.object({}).passthrough();

export function LiveCounter({ siteId }: WidgetContext<Config>) {
  const t = useTranslations("widgets.counter");
  const query = useWidgetData<Row[]>(siteId, "analytics/realtime");
  const count = query.data?.data?.[0]?.visitors ?? 0;

  return (
    <div className="flex h-full flex-col items-start justify-center">
      <div className="mdf-micro flex items-center gap-2">
        <span className="relative flex h-2 w-2">
          <span
            className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-75"
            style={{ background: "var(--mdf-success)" }}
          />
          <span
            className="relative inline-flex h-2 w-2 rounded-full"
            style={{ background: "var(--mdf-success)" }}
          />
        </span>
        {t("liveNow")}
      </div>
      <div className="mt-2" style={{ fontFamily: "var(--mdf-font-display)", fontSize: "56px", lineHeight: 1.05, letterSpacing: "-0.02em", fontVariantNumeric: "tabular-nums" }}>
        {query.isLoading ? (
          <span className="inline-block h-12 w-24 animate-pulse rounded bg-mdf-line-1" />
        ) : (
          formatNumber(count)
        )}
      </div>
      <div className="text-xs text-mdf-fg-3 mt-1">
        {count === 1 ? t("activeSingular") : t("activePlural")}
      </div>
      {query.error ? (
        <div className="mt-2 text-xs text-mdf-danger">
          {query.error.message}
        </div>
      ) : null}
    </div>
  );
}

register<Config>({
  id: "live-counter",
  displayName: "Live visitor counter",
  description: "Big number showing visitors active right now. Polls every 5s.",
  category: "realtime",
  defaultSize: { w: 3, h: 3 },
  minSize: { w: 2, h: 2 },
  configSchema: configSchema as unknown as z.ZodType<Config>,
  defaultConfig: {},
  Component: LiveCounter,
});
