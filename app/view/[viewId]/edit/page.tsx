import { notFound } from "next/navigation";
import { and, asc, eq } from "drizzle-orm";

import { db, schema } from "@/db/client";
import { Topbar } from "@/components/layout/topbar";
import type { SiteSwitcherEntry } from "@/components/layout/site-switcher";
import { ViewClient } from "@/components/layout/view-client";
import type { GridItem } from "@/components/layout/grid-canvas";
import { getViewLayout } from "@/lib/views/layout-helpers";
import { effectiveCurrency } from "@/lib/views/currency";
import { requirePageOrg } from "@/lib/auth/session";
import { seedUnifiedViewForOrganization } from "@/lib/auth/hooks";

export const dynamic = "force-dynamic";

export default async function EditViewPage({
  params,
}: {
  params: Promise<{ viewId: string }>;
}) {
  const { viewId } = await params;
  const { session, organizationId, billing } = await requirePageOrg(
    `/view/${viewId}/edit`,
  );

  const [view] = await db
    .select()
    .from(schema.views)
    .where(
      and(
        eq(schema.views.id, viewId),
        eq(schema.views.organizationId, organizationId),
      ),
    );

  if (!view) notFound();

  const isUnified = view.siteId === null && view.isDefault;

  const site =
    !isUnified && view.siteId
      ? (
          await db
            .select()
            .from(schema.sites)
            .where(
              and(
                eq(schema.sites.id, view.siteId),
                eq(schema.sites.organizationId, organizationId),
              ),
            )
        )[0] ?? null
      : null;

  if (!isUnified && !site) notFound();

  const allSites = await db
    .select()
    .from(schema.sites)
    .where(eq(schema.sites.organizationId, organizationId))
    .orderBy(asc(schema.sites.sortOrder), asc(schema.sites.createdAt));

  if (isUnified && allSites.length === 0) notFound();

  const allViews = await db
    .select()
    .from(schema.views)
    .where(eq(schema.views.organizationId, organizationId));

  const viewsBySite = new Map<string, string>();
  for (const v of allViews) if (v.siteId) viewsBySite.set(v.siteId, v.id);

  const unifiedViewId = await seedUnifiedViewForOrganization(organizationId);

  const entries: SiteSwitcherEntry[] = [
    { viewId: unifiedViewId, label: "Unified" },
    ...allSites.map((s) => ({
      viewId: viewsBySite.get(s.id) ?? unifiedViewId,
      label: s.name,
      domain: s.domain,
      logoUrl: s.logoUrl,
    })),
  ];

  const items = (await getViewLayout(view.id, {
    seedDefault: true,
  })) as unknown as GridItem[];

  const currency = isUnified
    ? effectiveCurrency(allSites)
    : (site?.currency ?? "USD");
  const siteId = isUnified ? "unified" : site!.id;

  const topbarUser = {
    email: session.user.email,
    name: session.user.name ?? null,
    image: session.user.image ?? null,
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Topbar
        currentViewId={view.id}
        entries={entries}
        title={site?.name ?? view.name}
        subtitle={
          site
            ? `${site.domain} · editing layout`
            : `${allSites.length} site${allSites.length === 1 ? "" : "s"} · editing layout`
        }
        domain={site?.domain ?? null}
        logoUrl={site?.logoUrl}
        user={topbarUser}
        billing={{
          trialEndsAt: billing.trialEndsAt.toISOString(),
          trialActive: billing.trialActive,
          subscriptionStatus: billing.subscriptionStatus,
        }}
      />

      <main className="flex-1 mx-auto w-full max-w-7xl px-3 sm:px-5 pt-4 pb-10">
        <ViewClient
          viewId={view.id}
          siteId={siteId}
          currency={currency}
          initialItems={items}
          editMode={true}
          editHref={`/view/${view.id}/edit`}
        />
      </main>
    </div>
  );
}
