import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { eq } from "drizzle-orm";

import { db, schema } from "@/db/client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { requirePageSession } from "@/lib/auth/session";

import { AcceptInviteActions } from "./accept-invite-actions";

export const dynamic = "force-dynamic";

type Search = { id?: string };

export default async function AcceptInvitePage({
  searchParams,
}: {
  searchParams: Promise<Search>;
}) {
  const { id } = await searchParams;
  const thisPath = `/accept-invite${id ? `?id=${encodeURIComponent(id)}` : ""}`;
  const session = await requirePageSession(thisPath);
  const t = await getTranslations("settings.acceptInvite");
  const tOrg = await getTranslations("settings.organization");

  if (!id) {
    return (
      <Shell>
        <Card>
          <CardHeader>
            <CardTitle>{t("missingTitle")}</CardTitle>
            <CardDescription>{t("missingBody")}</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/">
              <Button variant="outline">{t("backToDashboard")}</Button>
            </Link>
          </CardContent>
        </Card>
      </Shell>
    );
  }

  const [invRow] = await db
    .select({
      id: schema.invitations.id,
      email: schema.invitations.email,
      role: schema.invitations.role,
      status: schema.invitations.status,
      expiresAt: schema.invitations.expiresAt,
      organizationId: schema.invitations.organizationId,
      inviterId: schema.invitations.inviterId,
    })
    .from(schema.invitations)
    .where(eq(schema.invitations.id, id));

  if (!invRow) {
    return (
      <Shell>
        <Card>
          <CardHeader>
            <CardTitle>{t("notFoundTitle")}</CardTitle>
            <CardDescription>{t("notFoundBody")}</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/">
              <Button variant="outline">{t("backToDashboard")}</Button>
            </Link>
          </CardContent>
        </Card>
      </Shell>
    );
  }

  const now = new Date();
  if (invRow.status !== "pending") {
    return (
      <Shell>
        <Card>
          <CardHeader>
            <CardTitle>
              {t("alreadyTitle", { status: invRow.status })}
            </CardTitle>
            <CardDescription>
              {t("alreadyBody", { email: invRow.email })}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/">
              <Button variant="outline">{t("backToDashboard")}</Button>
            </Link>
          </CardContent>
        </Card>
      </Shell>
    );
  }
  if (invRow.expiresAt.getTime() < now.getTime()) {
    return (
      <Shell>
        <Card>
          <CardHeader>
            <CardTitle>{t("expiredTitle")}</CardTitle>
            <CardDescription>{t("expiredBody")}</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/">
              <Button variant="outline">{t("backToDashboard")}</Button>
            </Link>
          </CardContent>
        </Card>
      </Shell>
    );
  }

  const [org] = await db
    .select({ id: schema.organizations.id, name: schema.organizations.name })
    .from(schema.organizations)
    .where(eq(schema.organizations.id, invRow.organizationId));
  const [inviter] = await db
    .select({ email: schema.users.email, name: schema.users.name })
    .from(schema.users)
    .where(eq(schema.users.id, invRow.inviterId));

  const inviterLabel = inviter?.name || inviter?.email || t("aTeammate");
  const orgName = org?.name ?? t("thisOrganization");
  const roleLabel = tOrg(
    `role${invRow.role.charAt(0).toUpperCase()}${invRow.role.slice(1)}` as
      | "roleOwner"
      | "roleAdmin"
      | "roleMember",
  );

  const emailMatches =
    session.user.email.toLowerCase() === invRow.email.toLowerCase();

  if (!emailMatches) {
    return (
      <Shell>
        <Card>
          <CardHeader>
            <CardTitle>{t("wrongAccountTitle")}</CardTitle>
            <CardDescription>
              {t("wrongAccountBody", {
                invited: invRow.email,
                current: session.user.email,
              })}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-xs text-muted-foreground">
              {t("wrongAccountHint")}
            </p>
            <Link href={`/login?next=${encodeURIComponent(thisPath)}`}>
              <Button variant="outline">{t("wrongAccountCta")}</Button>
            </Link>
          </CardContent>
        </Card>
      </Shell>
    );
  }

  return (
    <Shell>
      <Card>
        <CardHeader>
          <CardTitle>{t("joinTitle", { org: orgName })}</CardTitle>
          <CardDescription>
            {t("joinBody", { inviter: inviterLabel, role: roleLabel })}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AcceptInviteActions invitationId={invRow.id} />
        </CardContent>
      </Card>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto flex min-h-screen max-w-lg items-center p-6">
      <div className="w-full">{children}</div>
    </div>
  );
}
