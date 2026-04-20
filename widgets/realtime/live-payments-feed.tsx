"use client";

import { z } from "zod";
import { Sparkles, Repeat2 } from "lucide-react";

import { useWidgetData } from "@/lib/hooks/use-widget-data";
import type { RealtimeMapData } from "@/lib/datafast/realtime-types";
import { formatCurrency } from "@/lib/utils/format";
import { register, type WidgetContext } from "@/widgets/registry";

type Config = Record<string, never>;
const configSchema = z.object({}).passthrough();

function relativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  const now = Date.now();
  const sec = Math.max(0, Math.round((now - then) / 1000));
  if (sec < 5) return "just now";
  if (sec < 60) return `${sec}s ago`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  return new Date(iso).toLocaleTimeString();
}

export function LivePaymentsFeed({ siteId }: WidgetContext<Config>) {
  const query = useWidgetData<RealtimeMapData>(
    siteId,
    "analytics/realtime/map"
  );
  const payments = query.data?.data?.recentPayments ?? [];

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-baseline justify-between pb-2">
        <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Live payments
        </div>
        <div className="text-xs text-muted-foreground">last 10 min</div>
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto">
        {query.isLoading ? (
          <div className="space-y-1.5">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="h-10 w-full animate-pulse rounded bg-muted/40"
              />
            ))}
          </div>
        ) : payments.length === 0 ? (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            No payments yet. 💤
          </div>
        ) : (
          <ul className="space-y-0.5">
            {payments.map((p) => (
              <li
                key={p._id}
                className="rounded px-2 py-1.5 hover:bg-accent/30 transition-colors"
              >
                <div className="flex items-center justify-between gap-2 text-sm">
                  <span className="flex items-center gap-1.5 min-w-0">
                    {p.renewal ? (
                      <Repeat2 className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    ) : (
                      <Sparkles className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                    )}
                    <span className="truncate font-medium">
                      {p.name || p.email || "Anonymous"}
                    </span>
                  </span>
                  <span className="tabular-nums font-semibold shrink-0">
                    {formatCurrency(p.amount, p.currency || "USD")}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2 text-[11px] text-muted-foreground">
                  <span className="truncate">
                    {p.email ?? (p.renewal ? "renewal" : "new")}
                  </span>
                  <span className="shrink-0">{relativeTime(p.timestamp)}</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

register<Config>({
  id: "live-payments-feed",
  displayName: "Live payments feed",
  description: "Recent payments received in the last 10 minutes with new/renewal badges.",
  category: "realtime",
  defaultSize: { w: 4, h: 5 },
  minSize: { w: 3, h: 3 },
  configSchema: configSchema as unknown as z.ZodType<Config>,
  defaultConfig: {},
  Component: LivePaymentsFeed,
});
