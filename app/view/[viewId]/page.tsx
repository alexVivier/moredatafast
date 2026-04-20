import Link from "next/link";
import { notFound } from "next/navigation";
import { and, asc, eq, isNull } from "drizzle-orm";

import { db, schema } from "@/db/client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Topbar } from "@/components/layout/topbar";
import type { SiteSwitcherEntry } from "@/components/layout/site-switcher";
import { ViewClient } from "@/components/layout/view-client";
import type { GridItem } from "@/components/layout/grid-canvas";
import { getViewLayout } from "@/lib/views/layout-helpers";
import { effectiveCurrency } from "@/lib/views/currency";
import { requirePageOrg } from "@/lib/auth/session";
import { seedUnifiedViewForOrganization } from "@/lib/auth/hooks";

export const dynamic = "force-dynamic";

export default async function ViewPage({
  params,
}: {
  params: Promise<{ viewId: string }>;
}) {
  const { viewId } = await params;
  const { session, organizationId } = await requirePageOrg(`/view/${viewId}`);

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

  const site = view.siteId
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

  const allSites = await db
    .select()
    .from(schema.sites)
    .where(eq(schema.sites.organizationId, organizationId))
    .orderBy(asc(schema.sites.sortOrder), asc(schema.sites.createdAt));

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

  const hasSites = allSites.length > 0;
  const isUnified = view.siteId === null && view.isDefault;
  const canRenderWidgets = isUnified ? hasSites : !!site;

  const items = canRenderWidgets
    ? ((await getViewLayout(view.id, { seedDefault: true })) as unknown as GridItem[])
    : [];

  const currency = isUnified
    ? effectiveCurrency(allSites)
    : (site?.currency ?? "USD");

  const targetSiteId = isUnified ? "unified" : site?.id;

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
        title={site?.name || view.name}
        subtitle={
          site
            ? site.domain
            : isUnified
              ? hasSites
                ? `${allSites.length} site${allSites.length === 1 ? "" : "s"}${currency === "MIXED" ? " · mixed currencies" : ""}`
                : "no sites yet"
              : null
        }
        logoUrl={site?.logoUrl}
        user={topbarUser}
      />

      <main className="flex-1 mx-auto w-full max-w-7xl px-3 sm:px-6 py-4 sm:py-6">
        {isUnified && !hasSites ? (
          <Card>
            <CardHeader>
              <CardTitle>Welcome to your DataFast dashboard</CardTitle>
              <CardDescription>
                Add your first site to start seeing analytics across all your
                SaaS products.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/settings/sites/new">
                <Button>+ Add your first site</Button>
              </Link>
            </CardContent>
          </Card>
        ) : targetSiteId ? (
          <ViewClient
            viewId={view.id}
            siteId={targetSiteId}
            currency={currency}
            initialItems={items}
            editMode={false}
            readHref={`/view/${view.id}`}
            editHref={`/view/${view.id}/edit`}
          />
        ) : null}
      </main>
    </div>
  );
}
