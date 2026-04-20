"use client";

import { useMemo } from "react";
import { useQuery, type UseQueryOptions } from "@tanstack/react-query";

import type { DataFastEnvelope } from "@/lib/datafast/types";
import { useFilters } from "@/lib/hooks/use-filters";
import { encodeFilters } from "@/lib/filters/schema";

export type QueryParams = Record<
  string,
  string | number | boolean | undefined | null
>;

function serializeParams(params?: QueryParams): string {
  if (!params) return "";
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null || v === "") continue;
    q.set(k, String(v));
  }
  const s = q.toString();
  return s ? `?${s}` : "";
}

export function widgetKey(
  siteId: string,
  path: string,
  params?: QueryParams
): readonly unknown[] {
  return ["datafast", siteId, path, params ?? {}] as const;
}

function endpointCadence(path: string): {
  staleTime: number;
  refetchInterval: number | false;
} {
  if (path === "analytics/realtime") {
    return { staleTime: 0, refetchInterval: 5_000 };
  }
  if (path === "analytics/realtime/map") {
    return { staleTime: 0, refetchInterval: 10_000 };
  }
  if (path === "analytics/metadata") {
    return { staleTime: 3_600_000, refetchInterval: false };
  }
  if (path.startsWith("visitors/")) {
    return { staleTime: 30_000, refetchInterval: false };
  }
  return { staleTime: 60_000, refetchInterval: false };
}

function acceptsFilters(path: string): boolean {
  if (path === "analytics/metadata") return false;
  if (path === "analytics/realtime") return false;
  if (path === "analytics/realtime/map") return false;
  if (path.startsWith("visitors/")) return false;
  return path.startsWith("analytics/");
}

export type WidgetDataError = {
  status: "error";
  error: { code: number; message: string };
};

function buildProxyUrl(
  siteId: string,
  path: string,
  params?: QueryParams
): string {
  if (siteId === "unified") {
    return `/api/datafast/aggregate/${path}${serializeParams(params)}`;
  }
  return `/api/datafast/${encodeURIComponent(siteId)}/${path}${serializeParams(params)}`;
}

async function fetchProxy<T>(
  siteId: string,
  path: string,
  params?: QueryParams
): Promise<DataFastEnvelope<T>> {
  const url = buildProxyUrl(siteId, path, params);
  const res = await fetch(url, { credentials: "same-origin" });
  const json = (await res.json().catch(() => ({}))) as unknown;
  if (!res.ok) {
    const err = json as WidgetDataError;
    const message = err?.error?.message || `Request failed (${res.status})`;
    throw new Error(message);
  }
  return json as DataFastEnvelope<T>;
}

export type UseWidgetDataOptions = {
  enabled?: boolean;
  /** Skip global filter injection. Rare; most widgets want filters applied. */
  skipFilters?: boolean;
};

export function useWidgetData<T = unknown>(
  siteId: string,
  path: string,
  params?: QueryParams,
  options?: UseWidgetDataOptions
) {
  const { filters } = useFilters();
  const { staleTime, refetchInterval } = endpointCadence(path);

  const mergedParams = useMemo(() => {
    if (options?.skipFilters || !acceptsFilters(path)) return params;
    const filterParams = encodeFilters(filters);
    if (Object.keys(filterParams).length === 0) return params;
    return { ...params, ...filterParams };
  }, [params, filters, path, options?.skipFilters]);

  return useQuery<DataFastEnvelope<T>, Error>({
    queryKey: widgetKey(siteId, path, mergedParams),
    queryFn: () => fetchProxy<T>(siteId, path, mergedParams),
    staleTime,
    refetchInterval,
    enabled: options?.enabled ?? true,
  } satisfies UseQueryOptions<DataFastEnvelope<T>, Error>);
}
