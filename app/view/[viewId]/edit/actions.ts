"use server";

import { and, eq, isNull } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { db, schema } from "@/db/client";
import { OrgAuthError, requireOrgMember } from "@/lib/auth/session";
import { headers } from "next/headers";

const LOG = "[dash-save/action]";
function stamp() {
  return new Date().toISOString().slice(11, 23);
}

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
  console.log(
    `${LOG} ${stamp()} enter viewId=${viewId} rawItemsCount=${Array.isArray(rawItems) ? rawItems.length : "n/a"}`,
  );
  if (Array.isArray(rawItems)) {
    console.log(
      `${LOG} ${stamp()} raw items:`,
      rawItems.map((it: unknown) => {
        const r = it as Record<string, unknown>;
        return {
          id: r.id,
          type: r.widgetType,
          x: r.x,
          y: r.y,
          w: r.w,
          h: r.h,
        };
      }),
    );
  }

  let organizationId: string;
  try {
    ({ organizationId } = await requireOrgMember(await headers()));
    console.log(`${LOG} ${stamp()} auth-ok organizationId=${organizationId}`);
  } catch (err) {
    console.log(`${LOG} ${stamp()} auth-failed`, err);
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
  if (!view) {
    console.log(
      `${LOG} ${stamp()} view-not-found viewId=${viewId} orgId=${organizationId}`,
    );
    throw new Error("View not found");
  }
  console.log(`${LOG} ${stamp()} view-found viewId=${viewId}`);

  const parsed = bodySchema.safeParse({ items: rawItems });
  if (!parsed.success) {
    console.log(
      `${LOG} ${stamp()} validation-failed`,
      parsed.error.issues,
    );
    throw new Error(
      parsed.error.issues.map((i) => i.message).join("; "),
    );
  }
  console.log(
    `${LOG} ${stamp()} validation-ok itemsCount=${parsed.data.items.length}`,
  );

  try {
    await db.transaction(async (tx) => {
      console.log(`${LOG} ${stamp()} tx-begin`);
      const deleted = await tx
        .delete(schema.layoutItems)
        .where(eq(schema.layoutItems.viewId, viewId))
        .returning({ id: schema.layoutItems.id });
      console.log(`${LOG} ${stamp()} tx-deleted rows=${deleted.length}`);

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
      console.log(
        `${LOG} ${stamp()} tx-inserted rows=${parsed.data.items.length}`,
      );

      const seeded = await tx
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
        `${LOG} ${stamp()} tx-seeded-flag-set rows=${seeded.length}`,
      );
      console.log(`${LOG} ${stamp()} tx-commit`);
    });
  } catch (err) {
    console.log(`${LOG} ${stamp()} tx-failed`, err);
    throw err;
  }

  // Post-write read to confirm the DB actually has what we just wrote.
  const verify = await db
    .select({ id: schema.layoutItems.id })
    .from(schema.layoutItems)
    .where(eq(schema.layoutItems.viewId, viewId));
  console.log(
    `${LOG} ${stamp()} post-write-verify rowCount=${verify.length} ids=${JSON.stringify(verify.map((v) => v.id))}`,
  );

  console.log(`${LOG} ${stamp()} revalidatePath /view/${viewId}`);
  revalidatePath(`/view/${viewId}`);
  console.log(`${LOG} ${stamp()} revalidatePath /view/${viewId}/edit`);
  revalidatePath(`/view/${viewId}/edit`);
  console.log(`${LOG} ${stamp()} redirect → /view/${viewId}`);
  redirect(`/view/${viewId}`);
}
