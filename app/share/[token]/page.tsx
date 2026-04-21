import { asc, eq } from "drizzle-orm";
import { notFound } from "next/navigation";

import { db, schema } from "@/db/client";
import { PublicView } from "@/components/public/public-view";
import type { GridItem } from "@/components/layout/grid-canvas";
import { resolveShareToken, touchShareAccess } from "@/lib/views/shares";

export const dynamic = "force-dynamic";

export default async function PublicSharePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const result = await resolveShareToken(token);
  if (!result.ok) {
    if (result.reason === "expired") {
      return (
        <main className="flex min-h-screen items-center justify-center p-6">
          <div className="max-w-sm text-center text-sm text-mdf-fg-3">
            This share link has expired. Ask the owner for a new one.
          </div>
        </main>
      );
    }
    notFound();
  }

  if (!result.view.siteId) {
    return (
      <main className="flex min-h-screen items-center justify-center p-6">
        <div className="max-w-sm text-center text-sm text-mdf-fg-3">
          This share link points to a multi-site view, which isn&apos;t
          currently supported for public sharing.
        </div>
      </main>
    );
  }

  const [site] = await db
    .select()
    .from(schema.sites)
    .where(eq(schema.sites.id, result.view.siteId))
    .limit(1);

  if (!site) notFound();

  const items = (await db
    .select()
    .from(schema.layoutItems)
    .where(eq(schema.layoutItems.viewId, result.view.id))
    .orderBy(asc(schema.layoutItems.y), asc(schema.layoutItems.x))) as unknown as GridItem[];

  touchShareAccess(result.share.id).catch(() => {});

  return (
    <PublicView
      token={token}
      viewName={result.view.name}
      siteName={site.name}
      siteDomain={site.domain}
      siteLogoUrl={site.logoUrl}
      siteId={site.id}
      currency={site.currency ?? "USD"}
      items={items}
    />
  );
}
