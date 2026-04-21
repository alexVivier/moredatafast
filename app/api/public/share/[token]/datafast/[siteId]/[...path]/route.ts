import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";

import { db, schema } from "@/db/client";
import { decrypt } from "@/lib/crypto/keyring";
import { fetchDataFast, DataFastError } from "@/lib/datafast/client";
import { resolveShareToken } from "@/lib/views/shares";

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
  context: { params: Promise<{ token: string; siteId: string; path: string[] }> },
) {
  const { token, siteId, path } = await context.params;
  const share = await resolveShareToken(token);
  if (!share.ok) {
    const status = share.reason === "expired" ? 410 : 404;
    return NextResponse.json({ error: share.reason }, { status });
  }

  // The share token gives access to a specific view; the siteId in the proxy
  // URL must match that view's site. Reject any other.
  if (!share.view.siteId || share.view.siteId !== siteId) {
    return NextResponse.json(
      { status: "error", error: { code: 403, message: "Site not shared" } },
      { status: 403 },
    );
  }

  const [site] = await db
    .select()
    .from(schema.sites)
    .where(
      and(
        eq(schema.sites.id, siteId),
        eq(schema.sites.organizationId, share.view.organizationId),
      ),
    )
    .limit(1);
  if (!site) {
    return NextResponse.json(
      { status: "error", error: { code: 404, message: "Site not found" } },
      { status: 404 },
    );
  }

  let apiKey: string;
  try {
    apiKey = decrypt(site.apiKeyEncrypted);
  } catch {
    return NextResponse.json(
      {
        status: "error",
        error: { code: 500, message: "Cannot decrypt site API key" },
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
        { status: "error", error: { code: e.status, message: e.message } },
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
