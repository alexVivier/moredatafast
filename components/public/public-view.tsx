"use client";

import { GridCanvas, type GridItem } from "@/components/layout/grid-canvas";
import { FilterBar } from "@/components/layout/filter-bar";
import { useDateRangeState } from "@/lib/hooks/use-date-range";
import { ShareContext } from "@/lib/hooks/use-widget-data";

type Props = {
  token: string;
  viewName: string;
  siteName: string;
  siteDomain: string;
  siteLogoUrl: string | null;
  siteId: string;
  currency: string;
  items: GridItem[];
};

export function PublicView({
  token,
  viewName,
  siteName,
  siteDomain,
  siteLogoUrl,
  siteId,
  currency,
  items,
}: Props) {
  const { resolved } = useDateRangeState();

  return (
    <ShareContext.Provider value={{ token }}>
      <div className="min-h-screen flex flex-col">
        <header className="border-b border-mdf-line-1 bg-mdf-bg-surface">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-3 sm:px-5 py-3">
            <div className="flex min-w-0 items-center gap-3">
              {siteLogoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={siteLogoUrl}
                  alt=""
                  className="h-6 w-6 shrink-0 rounded"
                />
              ) : null}
              <div className="min-w-0">
                <h1 className="truncate text-sm font-medium text-mdf-fg-1">
                  {siteName}
                </h1>
                <div className="truncate text-[11px] text-mdf-fg-3">
                  {siteDomain} · {viewName}
                </div>
              </div>
            </div>
            <span className="shrink-0 rounded px-1.5 py-0.5 text-[9px] font-mono uppercase tracking-wider text-mdf-fg-3 bg-mdf-line-1">
              Shared view · read-only
            </span>
          </div>
        </header>

        <main className="flex-1 mx-auto w-full max-w-7xl px-3 sm:px-5 pt-4 pb-10">
          <div className="space-y-4">
            <FilterBar />
            <GridCanvas
              viewId={`share:${token}`}
              siteId={siteId}
              currency={currency}
              dateRange={resolved}
              items={items}
              editMode={false}
              onChange={() => {}}
            />
          </div>
        </main>

        <footer className="border-t border-mdf-line-1 py-3 text-center text-[10px] text-mdf-fg-3">
          Powered by DataFast
        </footer>
      </div>
    </ShareContext.Provider>
  );
}
