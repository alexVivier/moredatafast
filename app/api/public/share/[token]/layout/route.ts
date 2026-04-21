import { NextResponse } from "next/server";
import { asc, eq } from "drizzle-orm";

import { db, schema } from "@/db/client";
import { resolveShareToken, touchShareAccess } from "@/lib/views/shares";

export async function GET(
  _request: Request,
  context: { params: Promise<{ token: string }> },
) {
  const { token } = await context.params;
  const result = await resolveShareToken(token);
  if (!result.ok) {
    const status = result.reason === "expired" ? 410 : 404;
    return NextResponse.json({ error: result.reason }, { status });
  }

  const [site] = result.view.siteId
    ? await db
        .select({
          id: schema.sites.id,
          name: schema.sites.name,
          domain: schema.sites.domain,
          currency: schema.sites.currency,
          logoUrl: schema.sites.logoUrl,
          timezone: schema.sites.timezone,
        })
        .from(schema.sites)
        .where(eq(schema.sites.id, result.view.siteId))
        .limit(1)
    : [];

  const items = await db
    .select()
    .from(schema.layoutItems)
    .where(eq(schema.layoutItems.viewId, result.view.id))
    .orderBy(asc(schema.layoutItems.y), asc(schema.layoutItems.x));

  // Fire-and-forget: record the access for auditing without blocking.
  touchShareAccess(result.share.id).catch(() => {});

  return NextResponse.json({
    view: {
      id: result.view.id,
      name: result.view.name,
    },
    site: site ?? null,
    items,
  });
}
