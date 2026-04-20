import "server-only";

import { asc, eq } from "drizzle-orm";
import { nanoid } from "nanoid";

import { db, schema } from "@/db/client";

export type LayoutRow = typeof schema.layoutItems.$inferSelect;

/**
 * Returns the layout items for a view. If the view is missing items AND
 * `withDefault` is truthy, seeds a reasonable starting layout (one KPI row,
 * one timeseries, one top-pages table).
 */
export async function getViewLayout(
  viewId: string,
  options: { seedDefault?: boolean } = {}
): Promise<LayoutRow[]> {
  const existing = await db
    .select()
    .from(schema.layoutItems)
    .where(eq(schema.layoutItems.viewId, viewId))
    .orderBy(asc(schema.layoutItems.y), asc(schema.layoutItems.x));

  if (existing.length > 0 || !options.seedDefault) return existing;

  const defaults: Omit<LayoutRow, "id">[] = [
    {
      viewId,
      widgetType: "overview-kpis",
      x: 0,
      y: 0,
      w: 12,
      h: 3,
      configJson: "{}",
    },
    {
      viewId,
      widgetType: "visitors-timeseries",
      x: 0,
      y: 3,
      w: 8,
      h: 4,
      configJson: JSON.stringify({ metric: "visitors" }),
    },
    {
      viewId,
      widgetType: "top-pages",
      x: 8,
      y: 3,
      w: 4,
      h: 4,
      configJson: JSON.stringify({ limit: 10 }),
    },
  ];

  await db.transaction(async (tx) => {
    for (const d of defaults) {
      await tx.insert(schema.layoutItems).values({ id: nanoid(12), ...d });
    }
  });

  return db
    .select()
    .from(schema.layoutItems)
    .where(eq(schema.layoutItems.viewId, viewId))
    .orderBy(asc(schema.layoutItems.y), asc(schema.layoutItems.x));
}
