import { NextResponse } from "next/server";
import { z } from "zod";
import { and, asc, eq } from "drizzle-orm";

import { db, schema } from "@/db/client";
import { getSession, unauthorized } from "@/lib/auth/session";

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

async function assertViewOwned(viewId: string, userId: string) {
  const [view] = await db
    .select({ id: schema.views.id })
    .from(schema.views)
    .where(and(eq(schema.views.id, viewId), eq(schema.views.userId, userId)));
  return !!view;
}

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const session = await getSession(request.headers);
  if (!session) return unauthorized();

  const { id } = await context.params;
  if (!(await assertViewOwned(id, session.user.id))) {
    return NextResponse.json({ error: "View not found" }, { status: 404 });
  }

  const items = await db
    .select()
    .from(schema.layoutItems)
    .where(eq(schema.layoutItems.viewId, id))
    .orderBy(asc(schema.layoutItems.y), asc(schema.layoutItems.x));

  return NextResponse.json({ viewId: id, items });
}

export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const session = await getSession(request.headers);
  if (!session) return unauthorized();

  const { id } = await context.params;
  if (!(await assertViewOwned(id, session.user.id))) {
    return NextResponse.json({ error: "View not found" }, { status: 404 });
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues.map((i) => i.message).join("; ") },
      { status: 400 },
    );
  }

  await db.transaction(async (tx) => {
    await tx
      .delete(schema.layoutItems)
      .where(eq(schema.layoutItems.viewId, id));
    for (const item of parsed.data.items) {
      await tx.insert(schema.layoutItems).values({
        id: item.id,
        viewId: id,
        widgetType: item.widgetType,
        x: item.x,
        y: item.y,
        w: item.w,
        h: item.h,
        configJson: item.configJson,
      });
    }
  });

  return NextResponse.json({
    ok: true,
    viewId: id,
    count: parsed.data.items.length,
  });
}
