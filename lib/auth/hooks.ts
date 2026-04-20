import "server-only";

import { and, eq, isNull } from "drizzle-orm";
import { nanoid } from "nanoid";

import { db, schema } from "@/db/client";

export async function seedUnifiedViewForUser(userId: string): Promise<string> {
  const existing = await db
    .select({ id: schema.views.id })
    .from(schema.views)
    .where(
      and(
        eq(schema.views.userId, userId),
        isNull(schema.views.siteId),
        eq(schema.views.isDefault, true),
      ),
    );
  if (existing[0]) return existing[0].id;

  const id = nanoid(12);
  await db.insert(schema.views).values({
    id,
    userId,
    name: "Unified",
    siteId: null,
    isDefault: true,
    sortOrder: 0,
  });
  return id;
}

/**
 * Returns the unified-view id for a given user, seeding it lazily if absent.
 * Use this anywhere the app previously hard-coded "unified" in URLs or lookups.
 */
export async function getUnifiedViewId(userId: string): Promise<string> {
  return seedUnifiedViewForUser(userId);
}
