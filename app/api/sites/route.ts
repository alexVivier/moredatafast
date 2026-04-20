import { NextResponse } from "next/server";
import { z } from "zod";
import { nanoid } from "nanoid";
import { asc, eq } from "drizzle-orm";

import { db, schema } from "@/db/client";
import { encrypt } from "@/lib/crypto/keyring";
import { fetchDataFast, DataFastError } from "@/lib/datafast/client";
import type { MetadataRow } from "@/lib/datafast/types";
import { OrgAuthError, requireOrgMember } from "@/lib/auth/session";

const createSiteSchema = z.object({
  apiKey: z.string().trim().min(8, "API key is too short"),
  nameOverride: z.string().trim().max(80).optional(),
});

export async function GET(request: Request) {
  let organizationId: string;
  try {
    ({ organizationId } = await requireOrgMember(request.headers));
  } catch (err) {
    if (err instanceof OrgAuthError) return err.toResponse();
    throw err;
  }

  const rows = await db
    .select({
      id: schema.sites.id,
      name: schema.sites.name,
      domain: schema.sites.domain,
      timezone: schema.sites.timezone,
      currency: schema.sites.currency,
      logoUrl: schema.sites.logoUrl,
      sortOrder: schema.sites.sortOrder,
      createdAt: schema.sites.createdAt,
    })
    .from(schema.sites)
    .where(eq(schema.sites.organizationId, organizationId))
    .orderBy(asc(schema.sites.sortOrder), asc(schema.sites.createdAt));

  return NextResponse.json({ sites: rows });
}

export async function POST(request: Request) {
  let organizationId: string;
  try {
    // Any admin or owner can add a site.
    ({ organizationId } = await requireOrgMember(request.headers, "admin"));
  } catch (err) {
    if (err instanceof OrgAuthError) return err.toResponse();
    throw err;
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = createSiteSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues.map((i) => i.message).join("; ") },
      { status: 400 },
    );
  }
  const { apiKey, nameOverride } = parsed.data;

  let metadata: MetadataRow;
  try {
    const res = await fetchDataFast<MetadataRow[]>(
      apiKey,
      "analytics/metadata",
      { revalidate: false },
    );
    const rows = res.data;
    if (!rows || rows.length === 0) {
      return NextResponse.json(
        { error: "DataFast returned no metadata for that API key" },
        { status: 400 },
      );
    }
    metadata = rows[0];
  } catch (e) {
    if (e instanceof DataFastError) {
      return NextResponse.json(
        {
          error:
            e.status === 401
              ? "Invalid API key — DataFast rejected the request (401)"
              : `DataFast error ${e.status}: ${e.message}`,
        },
        { status: 400 },
      );
    }
    return NextResponse.json(
      { error: "Failed to reach DataFast API" },
      { status: 502 },
    );
  }

  const siteId = nanoid(12);
  const encryptedKey = encrypt(apiKey);

  const siteCount = (
    await db
      .select({ id: schema.sites.id })
      .from(schema.sites)
      .where(eq(schema.sites.organizationId, organizationId))
  ).length;

  await db.insert(schema.sites).values({
    id: siteId,
    organizationId,
    name: nameOverride || metadata.name || metadata.domain,
    domain: metadata.domain,
    apiKeyEncrypted: encryptedKey,
    timezone: metadata.timezone || "UTC",
    currency: metadata.currency || "USD",
    logoUrl: metadata.logo ?? null,
    sortOrder: siteCount,
  });

  const viewId = nanoid(12);
  await db.insert(schema.views).values({
    id: viewId,
    organizationId,
    name: metadata.name || metadata.domain,
    siteId,
    isDefault: false,
    sortOrder: siteCount + 1,
  });

  return NextResponse.json({
    site: {
      id: siteId,
      name: nameOverride || metadata.name || metadata.domain,
      domain: metadata.domain,
      timezone: metadata.timezone,
      currency: metadata.currency,
      logoUrl: metadata.logo,
    },
    viewId,
  });
}
