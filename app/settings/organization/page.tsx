import Link from "next/link";
import { and, asc, desc, eq } from "drizzle-orm";

import { db, schema } from "@/db/client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getSession, requirePageSession } from "@/lib/auth/session";
import type { Role } from "@/lib/auth/session";

import { OrganizationClient } from "./organization-client";

export const dynamic = "force-dynamic";

type MemberRow = {
  id: string;
  userId: string;
  role: Role;
  createdAt: Date;
  email: string;
  name: string | null;
  image: string | null;
};

type InvitationRow = {
  id: string;
  email: string;
  role: Role;
  status: string;
  expiresAt: Date;
  inviterEmail: string | null;
};

export default async function OrganizationSettingsPage() {
  const session = await requirePageSession("/settings/organization");

  // We intentionally don't call requirePageOrg here so that a user without any
  // org can land on this page and create one.
  const sessionAny = session.session as unknown as {
    activeOrganizationId?: string | null;
  };
  let activeOrgId = sessionAny.activeOrganizationId ?? null;

  if (!activeOrgId) {
    const [first] = await db
      .select({ organizationId: schema.members.organizationId })
      .from(schema.members)
      .where(eq(schema.members.userId, session.user.id))
      .orderBy(asc(schema.members.createdAt))
      .limit(1);
    activeOrgId = first?.organizationId ?? null;
  }

  if (!activeOrgId) {
    return (
      <div className="mx-auto max-w-4xl space-y-6 p-6">
        <Header backHref="/settings" />
        <Card>
          <CardHeader>
            <CardTitle>No organization yet</CardTitle>
            <CardDescription>
              Create one from the dropdown in the top bar to start adding sites
              and inviting teammates.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/">
              <Button>Back to dashboard</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const [org] = await db
    .select()
    .from(schema.organizations)
    .where(eq(schema.organizations.id, activeOrgId));
  if (!org) {
    return (
      <div className="mx-auto max-w-4xl space-y-6 p-6">
        <Header backHref="/settings" />
        <p className="text-sm text-destructive">
          Active organization not found.
        </p>
      </div>
    );
  }

  const [myMember] = await db
    .select({ role: schema.members.role })
    .from(schema.members)
    .where(
      and(
        eq(schema.members.organizationId, activeOrgId),
        eq(schema.members.userId, session.user.id),
      ),
    );
  const currentRole = (myMember?.role ?? "member") as Role;

  const memberRows = await db
    .select({
      id: schema.members.id,
      userId: schema.members.userId,
      role: schema.members.role,
      createdAt: schema.members.createdAt,
      email: schema.users.email,
      name: schema.users.name,
      image: schema.users.image,
    })
    .from(schema.members)
    .innerJoin(schema.users, eq(schema.users.id, schema.members.userId))
    .where(eq(schema.members.organizationId, activeOrgId))
    .orderBy(asc(schema.members.createdAt));

  const members: MemberRow[] = memberRows.map((m) => ({
    id: m.id,
    userId: m.userId,
    role: m.role as Role,
    createdAt: m.createdAt,
    email: m.email,
    name: m.name,
    image: m.image,
  }));

  const invitationRows = await db
    .select({
      id: schema.invitations.id,
      email: schema.invitations.email,
      role: schema.invitations.role,
      status: schema.invitations.status,
      expiresAt: schema.invitations.expiresAt,
      inviterEmail: schema.users.email,
    })
    .from(schema.invitations)
    .leftJoin(
      schema.users,
      eq(schema.users.id, schema.invitations.inviterId),
    )
    .where(
      and(
        eq(schema.invitations.organizationId, activeOrgId),
        eq(schema.invitations.status, "pending"),
      ),
    )
    .orderBy(desc(schema.invitations.expiresAt));

  const invitations: InvitationRow[] = invitationRows.map((r) => ({
    id: r.id,
    email: r.email,
    role: r.role as Role,
    status: r.status,
    expiresAt: r.expiresAt,
    inviterEmail: r.inviterEmail,
  }));

  const canManage = currentRole === "owner" || currentRole === "admin";

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      <Header backHref="/settings" />
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{org.name}</h1>
        <p className="text-sm text-muted-foreground">
          {members.length} member{members.length === 1 ? "" : "s"} · slug{" "}
          <span className="font-mono">{org.slug}</span> · your role:{" "}
          <span className="font-medium">{currentRole}</span>
        </p>
      </div>

      <OrganizationClient
        organizationId={activeOrgId}
        organizationName={org.name}
        currentUserId={session.user.id}
        currentRole={currentRole}
        canManage={canManage}
        isOwner={currentRole === "owner"}
        members={serializeMembers(members)}
        invitations={serializeInvitations(invitations)}
      />
    </div>
  );
}

function Header({ backHref }: { backHref: string }) {
  return (
    <div className="flex items-center gap-2">
      <Link href={backHref}>
        <Button variant="ghost" size="sm">
          ← Back
        </Button>
      </Link>
    </div>
  );
}

function serializeMembers(rows: MemberRow[]) {
  return rows.map((r) => ({
    id: r.id,
    userId: r.userId,
    role: r.role,
    createdAt: r.createdAt.toISOString(),
    email: r.email,
    name: r.name,
    image: r.image,
  }));
}

function serializeInvitations(rows: InvitationRow[]) {
  return rows.map((r) => ({
    id: r.id,
    email: r.email,
    role: r.role,
    status: r.status,
    expiresAt: r.expiresAt.toISOString(),
    inviterEmail: r.inviterEmail,
  }));
}
