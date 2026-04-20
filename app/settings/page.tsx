import Link from "next/link";
import { asc, eq } from "drizzle-orm";

import { db, schema } from "@/db/client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { requirePageOrg } from "@/lib/auth/session";
import { DeleteSiteButton } from "./delete-site-button";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const { organizationId, role } = await requirePageOrg("/settings");
  const canManageSites = role === "owner" || role === "admin";

  const sites = await db
    .select()
    .from(schema.sites)
    .where(eq(schema.sites.organizationId, organizationId))
    .orderBy(asc(schema.sites.sortOrder), asc(schema.sites.createdAt));

  const viewsBySite = new Map<string, string>();
  const views = await db
    .select()
    .from(schema.views)
    .where(eq(schema.views.organizationId, organizationId));
  for (const v of views) if (v.siteId) viewsBySite.set(v.siteId, v.id);

  return (
    <div className="mx-auto max-w-4xl px-3 sm:px-6 py-4 sm:py-6 space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">
            Sites
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage the DataFast-tracked websites connected to this dashboard.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Link href="/settings/organization" className="flex-1 sm:flex-none">
            <Button variant="outline" className="w-full">
              Organization
            </Button>
          </Link>
          {canManageSites ? (
            <Link href="/settings/sites/new" className="flex-1 sm:flex-none">
              <Button className="w-full">+ Add site</Button>
            </Link>
          ) : null}
        </div>
      </div>

      {sites.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No sites yet</CardTitle>
            <CardDescription>
              Add your first DataFast website to start seeing analytics.
              You&apos;ll need an API key from{" "}
              <span className="font-mono">Website Settings → API</span> in your
              DataFast dashboard.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {canManageSites ? (
              <Link href="/settings/sites/new">
                <Button>Add your first site</Button>
              </Link>
            ) : (
              <p className="text-xs text-muted-foreground">
                Ask an admin to add the first site for this organization.
              </p>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {sites.map((s) => {
            const viewId = viewsBySite.get(s.id);
            return (
              <Card key={s.id}>
                <CardContent className="flex flex-wrap items-center gap-3 sm:gap-4 pt-4">
                  {s.logoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={s.logoUrl}
                      alt=""
                      className="h-10 w-10 rounded bg-muted object-contain shrink-0"
                    />
                  ) : (
                    <div className="h-10 w-10 rounded bg-muted flex items-center justify-center text-sm font-semibold text-muted-foreground shrink-0">
                      {s.name.slice(0, 2).toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1 min-w-0 basis-0">
                    <div className="flex flex-wrap items-baseline gap-x-2">
                      <span className="font-medium truncate">{s.name}</span>
                      <span className="text-xs text-muted-foreground truncate">
                        {s.domain}
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground truncate">
                      {s.timezone} · {s.currency} · added{" "}
                      {new Date(s.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  {viewId ? (
                    <Link href={`/view/${viewId}`}>
                      <Button variant="outline" size="sm">
                        Open
                      </Button>
                    </Link>
                  ) : null}
                  {canManageSites ? (
                    <DeleteSiteButton siteId={s.id} siteName={s.name} />
                  ) : null}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <div className="pt-4 text-xs text-muted-foreground">
        <p>
          API keys are encrypted at rest using AES-256-GCM. Back up{" "}
          <span className="font-mono">data/master.key</span> if you&apos;re using
          the auto-generated key.
        </p>
      </div>
    </div>
  );
}
