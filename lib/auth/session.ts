import "server-only";

import { and, asc, eq } from "drizzle-orm";
import { headers as nextHeaders } from "next/headers";
import { redirect } from "next/navigation";
import { NextResponse } from "next/server";

import { db, schema } from "@/db/client";
import { getBillingStatus, type BillingStatus } from "@/lib/billing/gating";

import { auth, type AuthSession } from "./server";

export type Role = "owner" | "admin" | "member";

const ROLE_RANK: Record<Role, number> = { owner: 3, admin: 2, member: 1 };

function hasAtLeastRole(actual: string, required: Role): boolean {
  const a = ROLE_RANK[actual as Role];
  if (!a) return false;
  return a >= ROLE_RANK[required];
}

export async function getSession(
  headers?: Headers,
): Promise<AuthSession | null> {
  const h = headers ?? (await nextHeaders());
  const s = await auth.api.getSession({ headers: h });
  return s ?? null;
}

export function unauthorized(): NextResponse {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export function forbidden(): NextResponse {
  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}

export function noOrganization(): NextResponse {
  return NextResponse.json(
    { error: "No active organization" },
    { status: 409 },
  );
}

/** Use inside RSCs / server pages: returns the session or redirects to /login. */
export async function requirePageSession(
  nextPath?: string,
): Promise<AuthSession> {
  const session = await getSession();
  if (!session) {
    const q = nextPath ? `?next=${encodeURIComponent(nextPath)}` : "";
    redirect(`/login${q}`);
  }
  return session;
}

export type OrgContext = {
  userId: string;
  organizationId: string;
  role: Role;
};

/**
 * Internal helper — resolves the user's currently active org (or falls back
 * to their first membership) and loads the member row so we can enforce role.
 */
async function loadOrgContext(
  session: AuthSession,
): Promise<OrgContext | null> {
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
    if (!first) return null;
    activeOrgId = first.organizationId;
  }

  const [member] = await db
    .select({ role: schema.members.role })
    .from(schema.members)
    .where(
      and(
        eq(schema.members.organizationId, activeOrgId),
        eq(schema.members.userId, session.user.id),
      ),
    )
    .limit(1);
  if (!member) return null;

  return {
    userId: session.user.id,
    organizationId: activeOrgId,
    role: member.role as Role,
  };
}

export class OrgAuthError extends Error {
  constructor(
    public readonly kind: "unauthorized" | "no-org" | "forbidden",
    message?: string,
  ) {
    super(message ?? kind);
  }

  toResponse(): NextResponse {
    if (this.kind === "unauthorized") return unauthorized();
    if (this.kind === "no-org") return noOrganization();
    return forbidden();
  }
}

/**
 * Use inside route handlers. Throws OrgAuthError if the caller is not
 * signed in, has no org, or lacks the required role — convert with
 * `err.toResponse()` in the catch block.
 */
export async function requireOrgMember(
  headers: Headers,
  requiredRole: Role = "member",
): Promise<OrgContext> {
  const session = await getSession(headers);
  if (!session) throw new OrgAuthError("unauthorized");
  const ctx = await loadOrgContext(session);
  if (!ctx) throw new OrgAuthError("no-org");
  if (!hasAtLeastRole(ctx.role, requiredRole)) {
    throw new OrgAuthError("forbidden");
  }
  return ctx;
}

/**
 * RSC/server-page variant: redirects to /login or /settings/organization on
 * error rather than throwing a JSON response. Also loads billing status so
 * pages can render the trial banner without an extra round-trip.
 */
export async function requirePageOrg(
  nextPath?: string,
  requiredRole: Role = "member",
): Promise<
  OrgContext & { session: AuthSession; billing: BillingStatus }
> {
  const session = await getSession();
  if (!session) {
    const q = nextPath ? `?next=${encodeURIComponent(nextPath)}` : "";
    redirect(`/login${q}`);
  }
  const ctx = await loadOrgContext(session);
  if (!ctx) redirect("/settings/organization");
  if (!hasAtLeastRole(ctx.role, requiredRole)) redirect("/");
  const billing = await getBillingStatus(ctx.organizationId);
  return { ...ctx, session, billing };
}
