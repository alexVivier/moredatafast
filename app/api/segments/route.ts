import { NextResponse } from "next/server";
import { and, asc, eq, isNull } from "drizzle-orm";
import { nanoid } from "nanoid";
import { z } from "zod";

import { db, schema } from "@/db/client";
import { filtersSchema } from "@/lib/filters/schema";
import { getSession, unauthorized } from "@/lib/auth/session";

const createSchema = z.object({
  name: z.string().trim().min(1).max(80),
  siteId: z.string().min(1).nullable().optional(),
  filters: filtersSchema,
});

export async function GET(request: Request) {
  const session = await getSession(request.headers);
  if (!session) return unauthorized();
  const userId = session.user.id;

  const url = new URL(request.url);
  const siteIdParam = url.searchParams.get("siteId");

  const scoped =
    siteIdParam === "unified"
      ? and(eq(schema.segments.userId, userId), isNull(schema.segments.siteId))
      : siteIdParam
        ? and(
            eq(schema.segments.userId, userId),
            eq(schema.segments.siteId, siteIdParam),
          )
        : eq(schema.segments.userId, userId);

  const rows = await db
    .select()
    .from(schema.segments)
    .where(scoped)
    .orderBy(asc(schema.segments.createdAt));

  return NextResponse.json({
    segments: rows.map((r) => ({
      id: r.id,
      name: r.name,
      siteId: r.siteId,
      filters: JSON.parse(r.filtersJson) as unknown,
      createdAt: r.createdAt,
    })),
  });
}

export async function POST(request: Request) {
  const session = await getSession(request.headers);
  if (!session) return unauthorized();
  const userId = session.user.id;

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = createSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues.map((i) => i.message).join("; ") },
      { status: 400 },
    );
  }

  const { name, siteId, filters } = parsed.data;
  const segmentSiteId = siteId && siteId !== "unified" ? siteId : null;

  if (segmentSiteId) {
    const [owned] = await db
      .select({ id: schema.sites.id })
      .from(schema.sites)
      .where(
        and(
          eq(schema.sites.id, segmentSiteId),
          eq(schema.sites.userId, userId),
        ),
      );
    if (!owned) {
      return NextResponse.json({ error: "Site not found" }, { status: 404 });
    }
  }

  const id = nanoid(12);
  await db.insert(schema.segments).values({
    id,
    userId,
    name,
    siteId: segmentSiteId,
    filtersJson: JSON.stringify(filters),
  });

  return NextResponse.json({ id, name, siteId: segmentSiteId, filters });
}
