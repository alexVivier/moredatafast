/**
 * One-shot, idempotent migration from user-scoped to organization-scoped data.
 *
 * After drizzle migration 0001_add_organizations.sql has created the org tables
 * and added nullable organization_id columns to sites/views/segments, this
 * script:
 *
 *   1. For every user with no membership row, creates a "<name>'s workspace"
 *      organization and an owner-role member record.
 *   2. Backfills organization_id on sites/views/segments based on the legacy
 *      user_id column.
 *   3. Once every row has organization_id set, drops the legacy user_id columns
 *      and marks organization_id NOT NULL.
 *
 * Safe to re-run: every step is guarded by an IF EXISTS / IS NULL check, so
 * subsequent boots become no-ops once the migration has completed.
 */

import crypto from "node:crypto";
import postgres from "postgres";

const ROLE_OWNER = "owner";

function slugify(input) {
  const base = (input ?? "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
  return base || "workspace";
}

function newId(prefix) {
  return `${prefix}_${crypto.randomBytes(9).toString("base64url")}`;
}

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error("[backfill-orgs] DATABASE_URL not set");
    process.exit(1);
  }

  const sql = postgres(url, { max: 1 });

  try {
    // Guard: if the organizations table doesn't exist yet, migration 0001
    // hasn't run — the drizzle migrator should have failed already, but be
    // defensive anyway.
    const [orgTable] = await sql`
      SELECT 1 AS present
      FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = 'organizations'
      LIMIT 1
    `;
    if (!orgTable) {
      console.log(
        "[backfill-orgs] organizations table missing — run drizzle migrations first",
      );
      return;
    }

    // ----- 1. Create personal org + owner membership for each user ---------
    const usersWithoutOrg = await sql`
      SELECT u.id, u.email, u.name, u.created_at
      FROM users u
      LEFT JOIN members m ON m.user_id = u.id
      WHERE m.id IS NULL
      ORDER BY u.created_at
    `;

    if (usersWithoutOrg.length > 0) {
      console.log(
        `[backfill-orgs] seeding personal orgs for ${usersWithoutOrg.length} user(s)`,
      );
    }

    for (const u of usersWithoutOrg) {
      const baseName = u.name || (u.email ? u.email.split("@")[0] : "User");
      const suffix = crypto
        .createHash("md5")
        .update(u.id)
        .digest("hex")
        .slice(0, 6);
      const slug = `${slugify(baseName)}-${suffix}`;
      const orgId = newId("org");
      const memberId = newId("mem");

      await sql.begin(async (tx) => {
        await tx`
          INSERT INTO organizations (id, name, slug, created_at)
          VALUES (${orgId}, ${baseName + "'s workspace"}, ${slug}, ${u.created_at})
          ON CONFLICT (slug) DO NOTHING
        `;
        // If slug collided, fetch the already-existing personal org for this
        // user (rare — only happens if a previous crashed run left a stray).
        const [existing] = await tx`
          SELECT id FROM organizations WHERE slug = ${slug} LIMIT 1
        `;
        const finalOrgId = existing?.id ?? orgId;

        await tx`
          INSERT INTO members (id, organization_id, user_id, role, created_at)
          VALUES (${memberId}, ${finalOrgId}, ${u.id}, ${ROLE_OWNER}, now())
          ON CONFLICT (organization_id, user_id) DO NOTHING
        `;
      });
    }

    // ----- 2. Backfill organization_id on sites/views/segments -------------
    const tablesWithUserId = await sql`
      SELECT table_name
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND column_name = 'user_id'
        AND table_name IN ('sites', 'views', 'segments')
    `;

    const legacyTables = tablesWithUserId.map((r) => r.table_name);
    if (legacyTables.length === 0) {
      console.log("[backfill-orgs] no legacy user_id columns — already migrated");
      return;
    }

    for (const table of legacyTables) {
      // Map every row's organization_id to the user's (unique) personal org.
      const safeTable = /^[a-z_]+$/.test(table) ? table : null;
      if (!safeTable) throw new Error(`unexpected table name: ${table}`);

      const updated = await sql.unsafe(
        `
        UPDATE ${safeTable} t
        SET organization_id = m.organization_id
        FROM members m
        WHERE m.user_id = t.user_id
          AND m.role = 'owner'
          AND t.organization_id IS NULL
        RETURNING t.id
        `,
      );
      console.log(
        `[backfill-orgs] ${safeTable}: backfilled organization_id on ${updated.length} row(s)`,
      );
    }

    // ----- 3. Verify nothing is orphaned before dropping user_id -----------
    for (const table of legacyTables) {
      const safeTable = /^[a-z_]+$/.test(table) ? table : null;
      if (!safeTable) throw new Error(`unexpected table name: ${table}`);
      const [orphan] = await sql.unsafe(
        `SELECT count(*)::int AS n FROM ${safeTable} WHERE organization_id IS NULL`,
      );
      if (orphan.n > 0) {
        throw new Error(
          `[backfill-orgs] ${safeTable} still has ${orphan.n} row(s) without organization_id — aborting before DROP`,
        );
      }
    }

    // ----- 4. Drop legacy user_id columns + SET NOT NULL on organization_id
    for (const table of legacyTables) {
      const safeTable = /^[a-z_]+$/.test(table) ? table : null;
      if (!safeTable) throw new Error(`unexpected table name: ${table}`);

      await sql.unsafe(
        `ALTER TABLE ${safeTable} ALTER COLUMN organization_id SET NOT NULL`,
      );
      // The user_id indexes get implicitly dropped by DROP COLUMN CASCADE.
      await sql.unsafe(`ALTER TABLE ${safeTable} DROP COLUMN user_id CASCADE`);
      console.log(
        `[backfill-orgs] ${safeTable}: dropped user_id, organization_id is now NOT NULL`,
      );
    }

    // ----- 5. Ensure the unique (organization_id, domain) index exists -----
    const [uniqDomain] = await sql`
      SELECT 1 AS present
      FROM pg_indexes
      WHERE schemaname = 'public' AND indexname = 'unique_org_domain'
      LIMIT 1
    `;
    if (!uniqDomain) {
      await sql`
        CREATE UNIQUE INDEX "unique_org_domain" ON "sites" ("organization_id", "domain")
      `;
      console.log("[backfill-orgs] created unique_org_domain index");
    }

    console.log("[backfill-orgs] migration complete");
  } finally {
    await sql.end({ timeout: 5 });
  }
}

main().catch((err) => {
  console.error("[backfill-orgs] FAILED:", err);
  process.exit(1);
});
