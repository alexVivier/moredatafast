import Link from "next/link";
import { getTranslations } from "next-intl/server";
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
import { siteIconUrl } from "@/lib/utils/favicon";
import { DeleteSiteButton } from "./delete-site-button";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const { organizationId, role } = await requirePageOrg("/settings");
  const canManageSites = role === "owner" || role === "admin";
  const t = await getTranslations("settings.sites");

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
            {t("title")}
          </h1>
          <p className="text-sm text-muted-foreground">{t("lead")}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Link href="/settings/organization" className="flex-1 sm:flex-none">
            <Button variant="outline" className="w-full">
              {t("organization")}
            </Button>
          </Link>
          {canManageSites ? (
            <Link href="/settings/sites/new" className="flex-1 sm:flex-none">
              <Button className="w-full">{t("addSite")}</Button>
            </Link>
          ) : null}
        </div>
      </div>

      {sites.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>{t("noSitesTitle")}</CardTitle>
            <CardDescription>{t("noSitesBody")}</CardDescription>
          </CardHeader>
          <CardContent>
            {canManageSites ? (
              <Link href="/settings/sites/new">
                <Button>{t("noSitesCta")}</Button>
              </Link>
            ) : (
              <p className="text-xs text-muted-foreground">
                {t("noSitesReader")}
              </p>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {sites.map((s) => {
            const viewId = viewsBySite.get(s.id);
            const iconUrl = siteIconUrl(s.logoUrl, s.domain);
            return (
              <Card key={s.id}>
                <CardContent className="flex flex-wrap items-center gap-3 sm:gap-4 pt-4">
                  {iconUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={iconUrl}
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
                      {s.timezone} · {s.currency} ·{" "}
                      {t("metaAdded", {
                        date: new Date(s.createdAt).toLocaleDateString(),
                      })}
                    </div>
                  </div>
                  {viewId ? (
                    <Link href={`/view/${viewId}`}>
                      <Button variant="outline">{t("open")}</Button>
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
        <p>{t("footNote")}</p>
      </div>
    </div>
  );
}
