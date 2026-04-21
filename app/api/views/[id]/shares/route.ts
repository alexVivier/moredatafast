import { NextResponse } from "next/server";
import { and, desc, eq, isNull } from "drizzle-orm";
import { nanoid } from "nanoid";
import crypto from "node:crypto";

import { db, schema } from "@/db/client";
import { OrgAuthError, requireOrgMember } from "@/lib/auth/session";

async function assertViewInOrg(
  viewId: string,
  organizationId: string,
): Promise<typeof schema.views.$inferSelect | null> {
  const [view] = await db
    .select()
    .from(schema.views)
    .where(
      and(
        eq(schema.views.id, viewId),
        eq(schema.views.organizationId, organizationId),
      ),
    )
    .limit(1);
  return view ?? null;
}

export async function GET(
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
  const view = await assertViewInOrg(id, organizationId);
  if (!view) {
    return NextResponse.json({ error: "View not found" }, { status: 404 });
  }

  const shares = await db
    .select({
      id: schema.viewShares.id,
      token: schema.viewShares.token,
      createdAt: schema.viewShares.createdAt,
      expiresAt: schema.viewShares.expiresAt,
      lastAccessedAt: schema.viewShares.lastAccessedAt,
    })
    .from(schema.viewShares)
    .where(
      and(
        eq(schema.viewShares.viewId, id),
        isNull(schema.viewShares.revokedAt),
      ),
    )
    .orderBy(desc(schema.viewShares.createdAt));

  return NextResponse.json({ shares });
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  let organizationId: string;
  let userId: string;
  try {
    ({ organizationId, userId } = await requireOrgMember(
      request.headers,
      "admin",
    ));
  } catch (err) {
    if (err instanceof OrgAuthError) return err.toResponse();
    throw err;
  }

  const { id } = await context.params;
  const view = await assertViewInOrg(id, organizationId);
  if (!view) {
    return NextResponse.json({ error: "View not found" }, { status: 404 });
  }

  // MVP: only allow sharing single-site views. Unified views would require a
  // public aggregate proxy; out of scope for the first iteration.
  if (!view.siteId) {
    return NextResponse.json(
      {
        error:
          "Unified (multi-site) views can't be shared yet. Share a site-scoped view instead.",
      },
      { status: 400 },
    );
  }

  // 160 random bits, URL-safe. Collisions are astronomically unlikely.
  const token = crypto.randomBytes(20).toString("base64url");
  const shareId = nanoid(16);

  await db.insert(schema.viewShares).values({
    id: shareId,
    viewId: id,
    token,
    createdBy: userId,
  });

  return NextResponse.json({
    share: {
      id: shareId,
      token,
      url: `/share/${token}`,
    },
  });
}
