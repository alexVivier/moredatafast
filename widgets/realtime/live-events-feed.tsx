"use client";

import { useTranslations } from "next-intl";
import { z } from "zod";

import { useWidgetData } from "@/lib/hooks/use-widget-data";
import type { RealtimeMapData } from "@/lib/datafast/realtime-types";
import { cn } from "@/lib/utils";
import { register, type WidgetContext } from "@/widgets/registry";
import { useVisitorDrawer } from "@/components/visitor/visitor-drawer-context";

type Config = Record<string, never>;
const configSchema = z.object({}).passthrough();

function useRelativeTime() {
  const t = useTranslations("widgets.live");
  return (iso: string): string => {
    const then = new Date(iso).getTime();
    const now = Date.now();
    const sec = Math.max(0, Math.round((now - then) / 1000));
    if (sec < 5) return t("justNow");
    if (sec < 60) return t("secondsAgo", { n: sec });
    const min = Math.floor(sec / 60);
    if (min < 60) return t("minutesAgo", { n: min });
    const hr = Math.floor(min / 60);
    if (hr < 24) return t("hoursAgo", { n: hr });
    return new Date(iso).toLocaleTimeString();
  };
}

export function LiveEventsFeed({ siteId }: WidgetContext<Config>) {
  const t = useTranslations("widgets.live");
  const relativeTime = useRelativeTime();
  const query = useWidgetData<RealtimeMapData>(
    siteId,
    "analytics/realtime/map"
  );
  const { open } = useVisitorDrawer();
  const events = query.data?.data?.recentEvents ?? [];

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-baseline justify-between pb-2">
        <div className="mdf-micro">{t("events")}</div>
        <div className="mdf-micro">{t("last10")}</div>
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto">
        {query.isLoading ? (
          <div className="space-y-1.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="h-8 w-full animate-pulse rounded bg-mdf-line-1"
              />
            ))}
          </div>
        ) : events.length === 0 ? (
          <div className="flex h-full items-center justify-center text-sm text-mdf-fg-3">
            {t("empty")}
          </div>
        ) : (
          <ul className="space-y-0.5">
            {events.map((e) => (
              <li key={e._id}>
                <button
                  type="button"
                  onClick={() => open(siteId, e.visitorId)}
                  className="w-full text-left rounded px-2 py-1.5 hover:bg-mdf-line-1 transition-colors"
                >
                  <div className="flex items-center gap-2 text-xs">
                    {e.countryCode ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={`https://purecatamphetamine.github.io/country-flag-icons/3x2/${e.countryCode.toUpperCase()}.svg`}
                        alt=""
                        className="h-2.5 w-3.5 rounded-sm object-cover shrink-0"
                        loading="lazy"
                      />
                    ) : (
                      <span className="h-2.5 w-3.5 shrink-0" />
                    )}
                    <span
                      className={cn(
                        "mdf-badge shrink-0",
                        e.type === "pageview"
                          ? "mdf-badge--info"
                          : "mdf-badge--brand",
                      )}
                    >
                      {e.type}
                    </span>
                    <span
                      className="truncate flex-1 text-mdf-fg-1"
                      style={{
                        fontFamily: "var(--mdf-font-mono)",
                        fontSize: "12px",
                      }}
                    >
                      {e.path ?? ""}
                    </span>
                    <span className="text-mdf-fg-3 shrink-0 text-[11px] font-mono tabular-nums">
                      {relativeTime(e.timestamp)}
                    </span>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

register<Config>({
  id: "live-events-feed",
  displayName: "Live events feed",
  description: "Last 10 minutes of pageviews and events. Click a row to inspect the visitor.",
  category: "realtime",
  defaultSize: { w: 5, h: 5 },
  minSize: { w: 3, h: 3 },
  configSchema: configSchema as unknown as z.ZodType<Config>,
  defaultConfig: {},
  Component: LiveEventsFeed,
});
