import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";

import { db, schema } from "@/db/client";
import { OrgAuthError, requireOrgMember } from "@/lib/auth/session";

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  let organizationId: string;
  try {
    ({ organizationId } = await requireOrgMember(request.headers));
  } catch (err) {
    if (err instanceof OrgAuthError) return err.toResponse();
    throw err;
  }

  const { id } = await context.params;
  const deleted = await db
    .delete(schema.segments)
    .where(
      and(
        eq(schema.segments.id, id),
        eq(schema.segments.organizationId, organizationId),
      ),
    )
    .returning({ id: schema.segments.id });
  if (deleted.length === 0) {
    return NextResponse.json({ error: "Segment not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
