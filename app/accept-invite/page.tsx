import Link from "next/link";
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

  if (!id) {
    return (
      <Shell>
        <Card>
          <CardHeader>
            <CardTitle>Missing invitation id</CardTitle>
            <CardDescription>
              The link you used is incomplete. Ask the sender to forward the
              original email.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/">
              <Button variant="outline">Back to dashboard</Button>
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
            <CardTitle>Invitation not found</CardTitle>
            <CardDescription>
              It may have been revoked or has already been accepted.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/">
              <Button variant="outline">Back to dashboard</Button>
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
            <CardTitle>Invitation already {invRow.status}</CardTitle>
            <CardDescription>
              This link has already been used. Ask {invRow.email}&apos;s inviter
              for a fresh one if you still need access.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/">
              <Button variant="outline">Back to dashboard</Button>
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
            <CardTitle>Invitation expired</CardTitle>
            <CardDescription>
              Invitations are valid for 48 hours. Ask for a new one.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/">
              <Button variant="outline">Back to dashboard</Button>
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

  const inviterLabel = inviter?.name || inviter?.email || "A teammate";
  const orgName = org?.name ?? "this organization";

  const emailMatches =
    session.user.email.toLowerCase() === invRow.email.toLowerCase();

  if (!emailMatches) {
    return (
      <Shell>
        <Card>
          <CardHeader>
            <CardTitle>Different account required</CardTitle>
            <CardDescription>
              This invitation was sent to{" "}
              <span className="font-medium">{invRow.email}</span>, but
              you&apos;re signed in as{" "}
              <span className="font-medium">{session.user.email}</span>.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-xs text-muted-foreground">
              Sign out and sign in with the invited email, then reopen this
              link.
            </p>
            <Link href={`/login?next=${encodeURIComponent(thisPath)}`}>
              <Button variant="outline">Switch account</Button>
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
          <CardTitle>Join {orgName}</CardTitle>
          <CardDescription>
            {inviterLabel} invited you to collaborate as{" "}
            <span className="font-medium">{invRow.role}</span>.
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
