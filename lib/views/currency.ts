import "server-only";

import type { Site } from "@/db/schema";

/**
 * For the unified view: if all sites share the same currency, use it;
 * otherwise "MIXED" so the widget layer can short-circuit revenue display.
 */
export function effectiveCurrency(sites: Pick<Site, "currency">[]): string {
  if (sites.length === 0) return "USD";
  const set = new Set(sites.map((s) => s.currency));
  if (set.size === 1) return [...set][0];
  return "MIXED";
}
