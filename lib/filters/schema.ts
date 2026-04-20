import { z } from "zod";

export const FILTER_KEYS = [
  "country",
  "region",
  "city",
  "device",
  "browser",
  "os",
  "referrer",
  "source",
  "via",
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_term",
  "utm_content",
  "page",
  "hostname",
] as const;

export type FilterKey = (typeof FILTER_KEYS)[number];

export type Filters = Partial<Record<FilterKey, string[]>>;

export const FILTER_LABELS: Record<FilterKey, string> = {
  country: "Country",
  region: "Region",
  city: "City",
  device: "Device",
  browser: "Browser",
  os: "OS",
  referrer: "Referrer",
  source: "Source",
  via: "Via",
  utm_source: "UTM source",
  utm_medium: "UTM medium",
  utm_campaign: "UTM campaign",
  utm_term: "UTM term",
  utm_content: "UTM content",
  page: "Page",
  hostname: "Hostname",
};

export const filtersSchema = z.object(
  Object.fromEntries(
    FILTER_KEYS.map((k) => [k, z.array(z.string().min(1).max(200)).optional()])
  ) as Record<FilterKey, z.ZodOptional<z.ZodArray<z.ZodString>>>
);

export function isFilterKey(k: string): k is FilterKey {
  return (FILTER_KEYS as readonly string[]).includes(k);
}

/** Convert internal filters to DataFast API query params: `filter_xxx=is:a,b`. */
export function encodeFilters(f: Filters): Record<string, string> {
  const out: Record<string, string> = {};
  for (const key of FILTER_KEYS) {
    const values = f[key];
    if (!values || values.length === 0) continue;
    out[`filter_${key}`] = `is:${values.join(",")}`;
  }
  return out;
}

export function filtersAreEmpty(f: Filters): boolean {
  return FILTER_KEYS.every((k) => !f[k] || f[k]?.length === 0);
}

export function describeFilters(f: Filters): string {
  const parts: string[] = [];
  for (const k of FILTER_KEYS) {
    const v = f[k];
    if (v && v.length > 0)
      parts.push(`${FILTER_LABELS[k]}: ${v.slice(0, 2).join(", ")}${v.length > 2 ? ` +${v.length - 2}` : ""}`);
  }
  return parts.join(" · ");
}
