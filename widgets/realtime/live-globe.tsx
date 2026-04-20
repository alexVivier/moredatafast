"use client";

import createGlobe, { type Marker } from "cobe";
import { useEffect, useMemo, useRef } from "react";
import { z } from "zod";

import { useWidgetData } from "@/lib/hooks/use-widget-data";
import type { RealtimeMapData } from "@/lib/datafast/realtime-types";
import { register, type WidgetContext } from "@/widgets/registry";
import { useVisitorDrawer } from "@/components/visitor/visitor-drawer-context";

type Config = Record<string, never>;
const configSchema = z.object({}).passthrough();

export function LiveGlobe({ siteId }: WidgetContext<Config>) {
  const query = useWidgetData<RealtimeMapData>(siteId, "analytics/realtime/map");
  const { open } = useVisitorDrawer();

  const data = query.data?.data;
  const visitors = data?.visitors ?? [];

  const markers: Marker[] = useMemo(
    () =>
      visitors
        .filter(
          (v) => Number.isFinite(v.latitude) && Number.isFinite(v.longitude)
        )
        .map((v) => ({
          location: [v.latitude, v.longitude] as [number, number],
          size: v.isCustomer ? 0.08 : 0.05,
        })),
    [visitors]
  );

  const markersRef = useRef<Marker[]>(markers);
  useEffect(() => {
    markersRef.current = markers;
  }, [markers]);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    let width = container.offsetWidth;
    let phi = 0;

    const onResize = () => {
      if (container) width = container.offsetWidth;
    };

    window.addEventListener("resize", onResize);

    const globe = createGlobe(canvas, {
      devicePixelRatio: 2,
      width: width * 2,
      height: width * 2,
      phi: 0,
      theta: 0.25,
      dark: 1,
      diffuse: 1.2,
      mapSamples: 16000,
      mapBrightness: 4,
      baseColor: [0.25, 0.25, 0.28],
      markerColor: [0.1, 0.8, 1],
      glowColor: [0.2, 0.2, 0.25],
      markers: markersRef.current,
    });

    let rafId = 0;
    const tick = () => {
      phi += 0.003;
      globe.update({
        phi,
        width: width * 2,
        height: width * 2,
        markers: markersRef.current,
      });
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);

    // Tiny fade-in
    canvas.style.opacity = "0";
    requestAnimationFrame(() => {
      if (canvas) canvas.style.transition = "opacity 600ms ease";
      if (canvas) canvas.style.opacity = "1";
    });

    return () => {
      window.removeEventListener("resize", onResize);
      cancelAnimationFrame(rafId);
      globe.destroy();
    };
  }, []);

  if (query.error) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-destructive">
        {query.error.message}
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col gap-3 sm:flex-row">
      <div className="flex-1 min-w-0 relative" ref={containerRef}>
        <canvas
          ref={canvasRef}
          style={{
            width: "100%",
            aspectRatio: "1",
            maxHeight: "100%",
            maxWidth: "100%",
          }}
        />
        <div className="pointer-events-none absolute top-2 left-2 flex items-center gap-2 rounded-md bg-background/80 backdrop-blur px-2 py-1 text-xs">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
          </span>
          {query.isLoading ? "…" : `${visitors.length} live`}
        </div>
      </div>
      <div className="w-full shrink-0 overflow-y-auto border-t border-border pt-3 sm:w-44 sm:border-l sm:border-t-0 sm:pl-3 sm:-my-3 sm:py-3 sm:pt-3">
        <div className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground mb-2">
          Live visitors
        </div>
        {query.isLoading ? (
          <div className="space-y-1.5">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="h-8 w-full animate-pulse rounded bg-muted/40"
              />
            ))}
          </div>
        ) : visitors.length === 0 ? (
          <div className="text-xs text-muted-foreground">
            No one here right now.
          </div>
        ) : (
          <ul className="space-y-0.5">
            {visitors.slice(0, 30).map((v) => (
              <li key={v.visitorId}>
                <button
                  type="button"
                  onClick={() => open(siteId, v.visitorId)}
                  className="w-full text-left text-xs rounded px-1.5 py-1 hover:bg-accent/40 transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    {v.location.countryCode ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={`https://purecatamphetamine.github.io/country-flag-icons/3x2/${v.location.countryCode.toUpperCase()}.svg`}
                        alt=""
                        className="h-2.5 w-3.5 rounded-sm object-cover shrink-0"
                        loading="lazy"
                      />
                    ) : (
                      <span className="h-2.5 w-3.5 shrink-0" />
                    )}
                    <span className="truncate font-medium">
                      {v.location.city ?? v.location.countryCode ?? "Unknown"}
                    </span>
                    {v.isCustomer ? (
                      <span className="ml-auto text-[9px] text-emerald-500 shrink-0">
                        ●
                      </span>
                    ) : null}
                  </div>
                  <div className="font-mono text-[10px] text-muted-foreground truncate pl-[18px]">
                    {v.currentUrl ?? ""}
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
  id: "live-globe",
  displayName: "Realtime globe",
  description: "3D globe with pulsing dots for each active visitor. Click a visitor to inspect.",
  category: "realtime",
  defaultSize: { w: 8, h: 6 },
  minSize: { w: 6, h: 5 },
  configSchema: configSchema as unknown as z.ZodType<Config>,
  defaultConfig: {},
  Component: LiveGlobe,
});
