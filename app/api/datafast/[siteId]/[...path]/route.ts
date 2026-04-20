import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";

import { db, schema } from "@/db/client";
import { decrypt } from "@/lib/crypto/keyring";
import { fetchDataFast, DataFastError } from "@/lib/datafast/client";
import { getSession, unauthorized } from "@/lib/auth/session";

function revalidateFor(path: string): number | false {
  if (path === "analytics/realtime" || path === "analytics/realtime/map") {
    return false;
  }
  if (path === "analytics/metadata") return 3600;
  if (path.startsWith("visitors/")) return 30;
  return 60;
}

export async function GET(
  request: Request,
  context: { params: Promise<{ siteId: string; path: string[] }> },
) {
  const session = await getSession(request.headers);
  if (!session) return unauthorized();

  const { siteId, path } = await context.params;

  const [site] = await db
    .select()
    .from(schema.sites)
    .where(
      and(eq(schema.sites.id, siteId), eq(schema.sites.userId, session.user.id)),
    );

  if (!site) {
    return NextResponse.json(
      { status: "error", error: { code: 404, message: "Site not found" } },
      { status: 404 },
    );
  }

  let apiKey: string;
  try {
    apiKey = decrypt(site.apiKeyEncrypted);
  } catch (e) {
    return NextResponse.json(
      {
        status: "error",
        error: {
          code: 500,
          message:
            e instanceof Error
              ? `Cannot decrypt API key for site ${site.name}: ${e.message}`
              : "Cannot decrypt API key",
        },
      },
      { status: 500 },
    );
  }

  const joinedPath = path.join("/");
  const upstreamParams = new URL(request.url).searchParams;
  const searchParams: Record<string, string> = {};
  for (const [k, v] of upstreamParams.entries()) searchParams[k] = v;

  try {
    const envelope = await fetchDataFast(apiKey, joinedPath, {
      searchParams,
      revalidate: revalidateFor(joinedPath),
    });
    return NextResponse.json(envelope);
  } catch (e) {
    if (e instanceof DataFastError) {
      return NextResponse.json(
        {
          status: "error",
          error: { code: e.status, message: e.message },
        },
        { status: e.status >= 400 && e.status < 600 ? e.status : 502 },
      );
    }
    return NextResponse.json(
      {
        status: "error",
        error: {
          code: 502,
          message: e instanceof Error ? e.message : "Upstream error",
        },
      },
      { status: 502 },
    );
  }
}
