"use client";

import { geoArea, geoMercator, geoPath } from "d3-geo";
import type { Feature, FeatureCollection } from "geojson";
import { useEffect, useMemo, useRef, useState } from "react";
import { feature } from "topojson-client";
import type { GeometryCollection, Topology } from "topojson-specification";
import { z } from "zod";

import { useVisitorDrawer } from "@/components/visitor/visitor-drawer-context";
import { useWidgetData } from "@/lib/hooks/use-widget-data";
import type { RealtimeMapData } from "@/lib/datafast/realtime-types";
import { register, type WidgetContext } from "@/widgets/registry";

// 110m = ~80 KB, cached by the browser after first load.
// world-atlas latest is v2; v3 doesn't exist on the registry.
const WORLD_URL =
  "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

// ISO-3166-1 alpha-2 → numeric code used as the feature id in world-atlas.
const COUNTRIES: Array<{
  code: string;
  numeric: string;
  name: string;
  flag: string;
}> = [
  { code: "FR", numeric: "250", name: "France", flag: "🇫🇷" },
  { code: "US", numeric: "840", name: "United States", flag: "🇺🇸" },
  { code: "DE", numeric: "276", name: "Germany", flag: "🇩🇪" },
  { code: "GB", numeric: "826", name: "United Kingdom", flag: "🇬🇧" },
  { code: "ES", numeric: "724", name: "Spain", flag: "🇪🇸" },
  { code: "IT", numeric: "380", name: "Italy", flag: "🇮🇹" },
  { code: "NL", numeric: "528", name: "Netherlands", flag: "🇳🇱" },
  { code: "BE", numeric: "056", name: "Belgium", flag: "🇧🇪" },
  { code: "CH", numeric: "756", name: "Switzerland", flag: "🇨🇭" },
  { code: "CA", numeric: "124", name: "Canada", flag: "🇨🇦" },
  { code: "BR", numeric: "076", name: "Brazil", flag: "🇧🇷" },
  { code: "MX", numeric: "484", name: "Mexico", flag: "🇲🇽" },
  { code: "JP", numeric: "392", name: "Japan", flag: "🇯🇵" },
  { code: "AU", numeric: "036", name: "Australia", flag: "🇦🇺" },
  { code: "IN", numeric: "356", name: "India", flag: "🇮🇳" },
  { code: "CN", numeric: "156", name: "China", flag: "🇨🇳" },
];

/**
 * Many countries are MultiPolygons that include far-away overseas territories
 * (France → French Guiana + Réunion, US → Alaska + Hawaii, etc.). Fitting the
 * viewport to the full geometry makes the mainland look like a tiny speck. We
 * instead pick the single largest polygon by spherical area to drive the
 * projection, but still render the whole feature — overseas bits just get
 * clipped by overflow-hidden.
 */
function mainlandFeature(feat: Feature): Feature {
  if (feat.geometry.type !== "MultiPolygon") return feat;
  const polygons = feat.geometry.coordinates;
  if (polygons.length <= 1) return feat;

  let bestIdx = 0;
  let bestArea = 0;
  for (let i = 0; i < polygons.length; i++) {
    const sub: Feature = {
      type: "Feature",
      properties: {},
      geometry: { type: "Polygon", coordinates: polygons[i] },
    };
    const area = geoArea(sub);
    if (area > bestArea) {
      bestArea = area;
      bestIdx = i;
    }
  }
  return {
    type: "Feature",
    properties: feat.properties,
    geometry: { type: "Polygon", coordinates: polygons[bestIdx] },
  };
}

let topologyCache: Promise<Topology> | null = null;
function loadTopology(): Promise<Topology> {
  if (!topologyCache) {
    topologyCache = fetch(WORLD_URL).then((r) => {
      if (!r.ok) throw new Error(`world-atlas fetch failed: ${r.status}`);
      return r.json() as Promise<Topology>;
    });
  }
  return topologyCache;
}

type Config = { countryCode: string };

const configSchema = z.object({
  countryCode: z.string().length(2).default("FR"),
});

export function CountryMap({ siteId, config }: WidgetContext<Config>) {
  const query = useWidgetData<RealtimeMapData>(siteId, "analytics/realtime/map");
  const { open } = useVisitorDrawer();

  const [topology, setTopology] = useState<Topology | null>(null);
  const [topoError, setTopoError] = useState<string | null>(null);
  const [selected, setSelected] = useState<string>(() => {
    const initial = (config.countryCode ?? "FR").toUpperCase();
    return COUNTRIES.some((c) => c.code === initial) ? initial : "FR";
  });
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState<{ w: number; h: number }>({ w: 0, h: 0 });

  useEffect(() => {
    let cancelled = false;
    loadTopology()
      .then((t) => {
        if (!cancelled) setTopology(t);
      })
      .catch((err: unknown) => {
        if (!cancelled)
          setTopoError(err instanceof Error ? err.message : "Failed to load map");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const update = () => setSize({ w: el.clientWidth, h: el.clientHeight });
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const country =
    COUNTRIES.find((c) => c.code === selected) ?? COUNTRIES[0];

  const feat = useMemo<Feature | null>(() => {
    if (!topology) return null;
    const fc = feature(
      topology,
      topology.objects.countries as GeometryCollection
    ) as FeatureCollection;
    return (
      fc.features.find((f) => String(f.id) === country.numeric) ?? null
    );
  }, [topology, country.numeric]);

  const { projection, pathD } = useMemo(() => {
    if (!feat || size.w < 16 || size.h < 16)
      return {
        projection: null as ReturnType<typeof geoMercator> | null,
        pathD: null as string | null,
      };
    const mainland = mainlandFeature(feat);
    const proj = geoMercator().fitExtent(
      [
        [12, 12],
        [size.w - 12, size.h - 12],
      ],
      mainland,
    );
    // Render the full feature (including any overseas polygons) — anything
    // outside the SVG viewport is clipped by the parent overflow-hidden.
    const path = geoPath(proj);
    return { projection: proj, pathD: path(feat) };
  }, [feat, size.w, size.h]);

  const allVisitors = query.data?.data?.visitors ?? [];
  const countryVisitors = useMemo(
    () =>
      allVisitors.filter(
        (v) =>
          v.location.countryCode?.toUpperCase() === country.code &&
          Number.isFinite(v.latitude) &&
          Number.isFinite(v.longitude)
      ),
    [allVisitors, country.code]
  );

  const markers = useMemo(() => {
    if (!projection) return [];
    return countryVisitors
      .map((v) => {
        const pt = projection([v.longitude, v.latitude]);
        return pt ? { visitor: v, x: pt[0], y: pt[1] } : null;
      })
      .filter((m): m is NonNullable<typeof m> => m !== null);
  }, [projection, countryVisitors]);

  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-wrap items-baseline justify-between gap-2 pb-2">
        <div className="min-w-0 flex-1">
          <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground truncate">
            Live map · {country.name}
          </div>
          <div className="text-xs text-muted-foreground truncate">
            {countryVisitors.length} visitor
            {countryVisitors.length === 1 ? "" : "s"} in {country.name}
          </div>
        </div>
        <select
          aria-label="Country"
          className="h-7 max-w-[160px] shrink-0 rounded-md border border-border bg-background px-2 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
          value={selected}
          onChange={(e) => setSelected(e.target.value)}
        >
          {COUNTRIES.map((c) => (
            <option key={c.code} value={c.code}>
              {c.flag} {c.name}
            </option>
          ))}
        </select>
      </div>
      <div
        ref={containerRef}
        className="relative flex-1 min-h-[180px] overflow-hidden rounded-md bg-muted/20"
      >
        {topoError ? (
          <div className="flex h-full items-center justify-center px-4 text-center text-xs text-destructive">
            {topoError}
          </div>
        ) : query.error ? (
          <div className="flex h-full items-center justify-center px-4 text-center text-xs text-destructive">
            {query.error.message}
          </div>
        ) : !topology ? (
          <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
            Loading map…
          </div>
        ) : !feat ? (
          <div className="flex h-full items-center justify-center px-4 text-center text-xs text-muted-foreground">
            No outline available for {country.name}
          </div>
        ) : size.w > 0 && size.h > 0 ? (
          <svg
            width="100%"
            height="100%"
            viewBox={`0 0 ${size.w} ${size.h}`}
            preserveAspectRatio="xMidYMid meet"
          >
            {pathD ? (
              <path
                d={pathD}
                fill="var(--muted)"
                stroke="var(--border)"
                strokeWidth={1}
                strokeLinejoin="round"
              />
            ) : null}
            {markers.map(({ visitor, x, y }) => {
              const color = visitor.isCustomer
                ? "rgb(16, 185, 129)"
                : "rgb(59, 130, 246)";
              const innerR = visitor.isCustomer ? 4 : 3;
              return (
                <g
                  key={visitor.visitorId}
                  transform={`translate(${x}, ${y})`}
                  className="cursor-pointer"
                  onClick={() => open(siteId, visitor.visitorId)}
                >
                  <circle fill={color} fillOpacity={0.35}>
                    <animate
                      attributeName="r"
                      from="2"
                      to="14"
                      dur="2.2s"
                      repeatCount="indefinite"
                    />
                    <animate
                      attributeName="fill-opacity"
                      from="0.4"
                      to="0"
                      dur="2.2s"
                      repeatCount="indefinite"
                    />
                  </circle>
                  <circle r={innerR} fill={color} />
                  <title>
                    {visitor.location.city ??
                      visitor.location.region ??
                      country.name}
                    {visitor.isCustomer ? " · customer" : ""}
                  </title>
                </g>
              );
            })}
            {!query.isLoading && markers.length === 0 ? (
              <text
                x={size.w / 2}
                y={size.h / 2}
                textAnchor="middle"
                dominantBaseline="middle"
                className="fill-muted-foreground"
                style={{ fontSize: 11 }}
              >
                No one in {country.name} right now
              </text>
            ) : null}
          </svg>
        ) : null}
      </div>
    </div>
  );
}

register<Config>({
  id: "country-map",
  displayName: "Country map",
  description:
    "2D map of a single country with pulsing dots for each active visitor in it.",
  category: "realtime",
  defaultSize: { w: 6, h: 5 },
  minSize: { w: 4, h: 4 },
  configSchema: configSchema as unknown as z.ZodType<Config>,
  defaultConfig: { countryCode: "FR" },
  Component: CountryMap,
});
