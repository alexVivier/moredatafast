import "server-only";

import { eq } from "drizzle-orm";

import { db, schema } from "@/db/client";

export type ShareLookup = {
  id: string;
  viewId: string;
  token: string;
  expiresAt: Date | null;
  revokedAt: Date | null;
};

export type ValidShareResult =
  | { ok: true; share: ShareLookup; view: typeof schema.views.$inferSelect }
  | { ok: false; reason: "not-found" | "revoked" | "expired" };

/**
 * Look up a share token and its view. Caller is responsible for updating
 * `last_accessed_at` if desired. Never throws for "bad token" — returns a
 * typed result so routes can format the 404/410 consistently.
 */
export async function resolveShareToken(
  token: string,
): Promise<ValidShareResult> {
  if (!token || token.length < 8) return { ok: false, reason: "not-found" };
  const [share] = await db
    .select()
    .from(schema.viewShares)
    .where(eq(schema.viewShares.token, token))
    .limit(1);
  if (!share) return { ok: false, reason: "not-found" };
  if (share.revokedAt) return { ok: false, reason: "revoked" };
  if (share.expiresAt && share.expiresAt.getTime() < Date.now()) {
    return { ok: false, reason: "expired" };
  }
  const [view] = await db
    .select()
    .from(schema.views)
    .where(eq(schema.views.id, share.viewId))
    .limit(1);
  if (!view) return { ok: false, reason: "not-found" };
  return { ok: true, share, view };
}

export async function touchShareAccess(shareId: string): Promise<void> {
  await db
    .update(schema.viewShares)
    .set({ lastAccessedAt: new Date() })
    .where(eq(schema.viewShares.id, shareId));
}
