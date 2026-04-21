import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";

import { db, schema } from "@/db/client";
import { OrgAuthError, requireOrgMember } from "@/lib/auth/session";

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string; shareId: string }> },
) {
  let organizationId: string;
  try {
    ({ organizationId } = await requireOrgMember(request.headers, "admin"));
  } catch (err) {
    if (err instanceof OrgAuthError) return err.toResponse();
    throw err;
  }

  const { id, shareId } = await context.params;

  // Ensure the share belongs to a view in this org. Otherwise an admin of one
  // org could revoke a token that isn't theirs.
  const [view] = await db
    .select({ id: schema.views.id })
    .from(schema.views)
    .where(
      and(
        eq(schema.views.id, id),
        eq(schema.views.organizationId, organizationId),
      ),
    )
    .limit(1);
  if (!view) {
    return NextResponse.json({ error: "View not found" }, { status: 404 });
  }

  await db
    .update(schema.viewShares)
    .set({ revokedAt: new Date() })
    .where(
      and(
        eq(schema.viewShares.id, shareId),
        eq(schema.viewShares.viewId, id),
      ),
    );

  return NextResponse.json({ ok: true });
}
