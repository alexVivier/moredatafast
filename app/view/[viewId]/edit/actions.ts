"use server";

import { and, eq, isNull } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { db, schema } from "@/db/client";
import { OrgAuthError, requireOrgMember } from "@/lib/auth/session";
import { headers } from "next/headers";

const itemSchema = z.object({
  id: z.string().min(1).max(24),
  widgetType: z.string().min(1).max(64),
  x: z.number().int().min(0).max(48),
  y: z.number().int().min(0).max(1000),
  w: z.number().int().min(1).max(12),
  h: z.number().int().min(1).max(24),
  configJson: z.string().default("{}"),
});

const bodySchema = z.object({
  items: z.array(itemSchema).max(40),
});

/**
 * Save the layout and finish editing in one atomic server round-trip.
 *
 * Rationale: `router.push` + `router.refresh` on the client is fundamentally
 * racy — the Router Cache can serve a prefetched RSC payload for /view/:id
 * that predates the save, making the read page appear to "reset" the layout.
 * By saving + revalidating + redirecting server-side, we guarantee the next
 * render uses fresh DB rows.
 */
export async function saveLayoutAndFinish(
  viewId: string,
  rawItems: unknown,
): Promise<void> {
  let organizationId: string;
  try {
    ({ organizationId } = await requireOrgMember(await headers()));
  } catch (err) {
    if (err instanceof OrgAuthError) {
      throw new Error("Not authorized");
    }
    throw err;
  }

  const [view] = await db
    .select({ id: schema.views.id })
    .from(schema.views)
    .where(
      and(
        eq(schema.views.id, viewId),
        eq(schema.views.organizationId, organizationId),
      ),
    );
  if (!view) throw new Error("View not found");

  const parsed = bodySchema.safeParse({ items: rawItems });
  if (!parsed.success) {
    throw new Error(
      parsed.error.issues.map((i) => i.message).join("; "),
    );
  }

  await db.transaction(async (tx) => {
    await tx
      .delete(schema.layoutItems)
      .where(eq(schema.layoutItems.viewId, viewId));
    for (const item of parsed.data.items) {
      await tx.insert(schema.layoutItems).values({
        id: item.id,
        viewId,
        widgetType: item.widgetType,
        x: item.x,
        y: item.y,
        w: item.w,
        h: item.h,
        configJson: item.configJson,
      });
    }
    await tx
      .update(schema.views)
      .set({ layoutSeededAt: new Date() })
      .where(
        and(
          eq(schema.views.id, viewId),
          isNull(schema.views.layoutSeededAt),
        ),
      );
  });

  revalidatePath(`/view/${viewId}`);
  revalidatePath(`/view/${viewId}/edit`);
  redirect(`/view/${viewId}`);
}
