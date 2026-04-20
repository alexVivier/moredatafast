import "server-only";

import crypto from "node:crypto";
import { and, eq, isNull } from "drizzle-orm";
import { nanoid } from "nanoid";

import { db, schema } from "@/db/client";

function slugify(input: string | null | undefined): string {
  const base = (input ?? "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
  return base || "workspace";
}

function deterministicSuffix(userId: string): string {
  return crypto.createHash("md5").update(userId).digest("hex").slice(0, 6);
}

/**
 * Returns the unified-view id for a given organization, seeding it lazily.
 * A unified view is the default cross-site dashboard (siteId IS NULL).
 */
export async function seedUnifiedViewForOrganization(
  organizationId: string,
): Promise<string> {
  const existing = await db
    .select({ id: schema.views.id })
    .from(schema.views)
    .where(
      and(
        eq(schema.views.organizationId, organizationId),
        isNull(schema.views.siteId),
        eq(schema.views.isDefault, true),
      ),
    );
  if (existing[0]) return existing[0].id;

  const id = nanoid(12);
  await db.insert(schema.views).values({
    id,
    organizationId,
    name: "Unified",
    siteId: null,
    isDefault: true,
    sortOrder: 0,
  });
  return id;
}

/**
 * Creates a "Personal workspace" organization for a brand-new user: an org,
 * an owner-role membership, and a default unified view — in a single
 * transaction so we never leave a half-created user behind.
 *
 * Idempotent: if the user already has any membership, this is a no-op.
 */
export async function createPersonalOrganizationForUser(user: {
  id: string;
  email: string;
  name?: string | null;
}): Promise<string> {
  const [existingMembership] = await db
    .select({ organizationId: schema.members.organizationId })
    .from(schema.members)
    .where(eq(schema.members.userId, user.id))
    .limit(1);
  if (existingMembership) return existingMembership.organizationId;

  const baseName = user.name || user.email.split("@")[0] || "User";
  const slug = `${slugify(baseName)}-${deterministicSuffix(user.id)}`;
  const orgId = nanoid(12);
  const memberId = nanoid(12);
  const viewId = nanoid(12);

  await db.transaction(async (tx) => {
    await tx.insert(schema.organizations).values({
      id: orgId,
      name: `${baseName}'s workspace`,
      slug,
      createdAt: new Date(),
    });
    await tx.insert(schema.members).values({
      id: memberId,
      organizationId: orgId,
      userId: user.id,
      role: "owner",
      createdAt: new Date(),
    });
    await tx.insert(schema.views).values({
      id: viewId,
      organizationId: orgId,
      name: "Unified",
      siteId: null,
      isDefault: true,
      sortOrder: 0,
    });
  });

  return orgId;
}
