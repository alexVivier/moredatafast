import "server-only";

import { and, asc, eq, isNull } from "drizzle-orm";
import { nanoid } from "nanoid";

import { db, schema } from "@/db/client";

const LOG = "[dash-save/loader]";
function stamp() {
  return new Date().toISOString().slice(11, 23);
}

export type LayoutRow = typeof schema.layoutItems.$inferSelect;

/**
 * Returns the layout items for a view. If the view has never been seeded
 * AND `seedDefault` is truthy, inserts a starter layout (KPI row + timeseries
 * + top-pages) exactly once — even under concurrent requests — and records
 * that on `views.layoutSeededAt` so a user who later empties the layout
 * doesn't get defaults rewritten on top of their intent.
 */
export async function getViewLayout(
  viewId: string,
  options: { seedDefault?: boolean } = {}
): Promise<LayoutRow[]> {
  console.log(
    `${LOG} ${stamp()} fetch viewId=${viewId} seedDefault=${!!options.seedDefault}`,
  );
  const existing = await db
    .select()
    .from(schema.layoutItems)
    .where(eq(schema.layoutItems.viewId, viewId))
    .orderBy(asc(schema.layoutItems.y), asc(schema.layoutItems.x));
  console.log(
    `${LOG} ${stamp()} fetched viewId=${viewId} count=${existing.length} ids=${JSON.stringify(existing.map((r) => r.id))}`,
  );

  if (existing.length > 0 || !options.seedDefault) return existing;

  // Atomic claim: only the request that flips `layout_seeded_at` from NULL
  // actually seeds. Concurrent requests get an empty `returning` and skip.
  const claimed = await db
    .update(schema.views)
    .set({ layoutSeededAt: new Date() })
    .where(
      and(
        eq(schema.views.id, viewId),
        isNull(schema.views.layoutSeededAt),
      ),
    )
    .returning({ id: schema.views.id });
  console.log(
    `${LOG} ${stamp()} seed-claim viewId=${viewId} claimed=${claimed.length}`,
  );

  if (claimed.length === 0) return existing;
  console.log(`${LOG} ${stamp()} seeding defaults for viewId=${viewId}`);

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
