"use client";

import { X } from "lucide-react";
import { useEffect } from "react";

import { Button } from "@/components/ui/button";
import { useWidgetData } from "@/lib/hooks/use-widget-data";
import { cn } from "@/lib/utils";
import { formatDurationMs, formatNumber, formatPercent } from "@/lib/utils/format";
import { useVisitorDrawer } from "./visitor-drawer-context";

type Browser = { name?: string; version?: string };
type OS = { name?: string; version?: string };
type Device = { type?: string; vendor?: string; model?: string };

type VisitorData = {
  visitorId: string;
  identity: {
    country?: string | null;
    countryCode?: string | null;
    region?: string | null;
    city?: string | null;
    params?: Record<string, string | null> | null;
    browser?: Browser;
    os?: OS;
    device?: Device;
    viewport?: { width?: number; height?: number } | null;
  };
  activity: {
    visitCount: number;
    pageViewCount: number;
    timeSinceFirstVisit: number;
    timeSinceCurrentVisit: number;
    firstVisitAt?: string;
    lastVisitAt?: string;
    currentUrl?: string | null;
    visitedPages?: { url: string; timestamp: string }[];
    completedCustomGoals?: {
      name: string;
      description?: string | null;
      isServer?: boolean;
      timestamp: string;
    }[];
  };
  prediction?: {
    score: number;
    conversionRate: number;
    expectedValue: number;
    confidence: number;
  } | null;
};

export function VisitorDrawer() {
  const { target, close } = useVisitorDrawer();

  useEffect(() => {
    if (!target) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [target, close]);

  if (!target) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-background/70 backdrop-blur-sm animate-in fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) close();
      }}
    >
      <aside className="h-full w-full max-w-md overflow-y-auto border-l border-border bg-card text-card-foreground shadow-xl animate-in slide-in-from-right">
        <VisitorDrawerBody
          siteId={target.siteId}
          visitorId={target.visitorId}
          onClose={close}
        />
      </aside>
    </div>
  );
}

function VisitorDrawerBody({
  siteId,
  visitorId,
  onClose,
}: {
  siteId: string;
  visitorId: string;
  onClose: () => void;
}) {
  const query = useWidgetData<VisitorData>(siteId, `visitors/${visitorId}`);
  const body = query.data?.data;

  return (
    <div className="flex flex-col">
      <div className="sticky top-0 z-10 flex items-start justify-between gap-3 border-b border-border bg-card/95 backdrop-blur px-4 py-3">
        <div className="min-w-0">
          <div className="text-xs text-muted-foreground">Visitor</div>
          <div className="font-mono text-sm truncate">{visitorId}</div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex-1 p-4 space-y-5">
        {query.isLoading ? (
          <div className="space-y-3">
            <div className="h-6 w-40 animate-pulse rounded bg-muted/40" />
            <div className="h-20 animate-pulse rounded bg-muted/30" />
            <div className="h-20 animate-pulse rounded bg-muted/30" />
          </div>
        ) : query.error ? (
          <div className="text-sm text-destructive">{query.error.message}</div>
        ) : !body ? (
          <div className="text-sm text-muted-foreground">
            No data for this visitor.
          </div>
        ) : (
          <>
            <Section title="Identity">
              <KV
                k="Location"
                v={
                  [body.identity.city, body.identity.region, body.identity.country]
                    .filter(Boolean)
                    .join(", ") || "—"
                }
              />
              <KV
                k="Browser"
                v={`${body.identity.browser?.name ?? "?"} ${body.identity.browser?.version ?? ""}`.trim()}
              />
              <KV
                k="OS"
                v={`${body.identity.os?.name ?? "?"} ${body.identity.os?.version ?? ""}`.trim()}
              />
              <KV
                k="Device"
                v={
                  [
                    body.identity.device?.type,
                    body.identity.device?.vendor,
                    body.identity.device?.model,
                  ]
                    .filter(Boolean)
                    .join(" · ") || "—"
                }
              />
              {body.identity.viewport?.width ? (
                <KV
                  k="Viewport"
                  v={`${body.identity.viewport.width}×${body.identity.viewport.height}`}
                />
              ) : null}
              {body.identity.params ? (
                <div>
                  <div className="text-xs text-muted-foreground mb-1">
                    Source params
                  </div>
                  <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 text-xs font-mono">
                    {Object.entries(body.identity.params).map(([k, v]) =>
                      v ? (
                        <div key={k} className="truncate">
                          <span className="text-muted-foreground">{k}=</span>
                          {v}
                        </div>
                      ) : null
                    )}
                  </div>
                </div>
              ) : null}
            </Section>

            <Section title="Activity">
              <KV k="Visits" v={formatNumber(body.activity.visitCount)} />
              <KV
                k="Page views"
                v={formatNumber(body.activity.pageViewCount)}
              />
              <KV
                k="Current URL"
                v={body.activity.currentUrl || "—"}
                mono
              />
              <KV
                k="Time since first visit"
                v={formatDurationMs(body.activity.timeSinceFirstVisit)}
              />
              <KV
                k="First visit"
                v={
                  body.activity.firstVisitAt
                    ? new Date(body.activity.firstVisitAt).toLocaleString()
                    : "—"
                }
              />
            </Section>

            {body.prediction ? (
              <Section title="Conversion prediction">
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Score</span>
                  <span className="text-sm tabular-nums font-medium">
                    {body.prediction.score}/100
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                  <div
                    className={cn(
                      "h-full transition-all",
                      body.prediction.score >= 70
                        ? "bg-emerald-500"
                        : body.prediction.score >= 40
                          ? "bg-amber-500"
                          : "bg-destructive"
                    )}
                    style={{ width: `${body.prediction.score}%` }}
                  />
                </div>
                <div className="mt-2 grid grid-cols-3 gap-2 text-xs">
                  <div>
                    <div className="text-muted-foreground">Conv. rate</div>
                    <div className="tabular-nums">
                      {formatPercent(body.prediction.conversionRate, 2)}
                    </div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Expected $</div>
                    <div className="tabular-nums">
                      ${body.prediction.expectedValue.toFixed(2)}
                    </div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Confidence</div>
                    <div className="tabular-nums">
                      {formatPercent(body.prediction.confidence, 0)}
                    </div>
                  </div>
                </div>
              </Section>
            ) : null}

            {body.activity.completedCustomGoals &&
            body.activity.completedCustomGoals.length > 0 ? (
              <Section title={`Completed goals (${body.activity.completedCustomGoals.length})`}>
                <ul className="space-y-1">
                  {body.activity.completedCustomGoals.map((g, i) => (
                    <li key={i} className="flex items-center justify-between gap-2 text-xs">
                      <span className="font-mono truncate">{g.name}</span>
                      <span className="text-muted-foreground shrink-0">
                        {new Date(g.timestamp).toLocaleTimeString()}
                      </span>
                    </li>
                  ))}
                </ul>
              </Section>
            ) : null}

            {body.activity.visitedPages &&
            body.activity.visitedPages.length > 0 ? (
              <Section title={`Visited pages (${body.activity.visitedPages.length})`}>
                <ul className="space-y-1 max-h-64 overflow-y-auto">
                  {body.activity.visitedPages.map((p, i) => (
                    <li
                      key={i}
                      className="flex items-center justify-between gap-2 text-xs"
                    >
                      <span className="font-mono truncate" title={p.url}>
                        {p.url}
                      </span>
                      <span className="text-muted-foreground shrink-0">
                        {new Date(p.timestamp).toLocaleTimeString()}
                      </span>
                    </li>
                  ))}
                </ul>
              </Section>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {title}
      </div>
      <div className="space-y-1.5">{children}</div>
    </section>
  );
}

function KV({
  k,
  v,
  mono,
}: {
  k: string;
  v: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3 text-sm">
      <span className="text-muted-foreground text-xs shrink-0">{k}</span>
      <span
        className={cn(
          "truncate text-right",
          mono ? "font-mono text-xs" : ""
        )}
        title={v}
      >
        {v}
      </span>
    </div>
  );
}
