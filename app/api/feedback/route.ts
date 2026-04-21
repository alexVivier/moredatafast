import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";

import { db, schema } from "@/db/client";
import { OrgAuthError, requireOrgMember } from "@/lib/auth/session";
import { DISCORD_COLORS, notifyDiscord } from "@/lib/notifications/discord";

const BodySchema = z.object({
  type: z.enum(["bug", "suggestion"]),
  message: z.string().trim().min(5).max(2000),
});

export async function POST(request: Request) {
  let ctx;
  try {
    ctx = await requireOrgMember(request.headers, "member");
  } catch (err) {
    if (err instanceof OrgAuthError) return err.toResponse();
    throw err;
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = BodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues.map((i) => i.message).join("; ") },
      { status: 400 },
    );
  }
  const { type, message } = parsed.data;

  const [row] = await db
    .select({
      email: schema.users.email,
      name: schema.users.name,
      orgName: schema.organizations.name,
    })
    .from(schema.users)
    .innerJoin(
      schema.organizations,
      eq(schema.organizations.id, ctx.organizationId),
    )
    .where(eq(schema.users.id, ctx.userId))
    .limit(1);

  notifyDiscord("feedback", {
    title: type === "bug" ? "🐛 Bug report" : "💡 Suggestion",
    description: message,
    color: type === "bug" ? DISCORD_COLORS.red : DISCORD_COLORS.purple,
    fields: [
      {
        name: "From",
        value: row?.name ? `${row.name} <${row.email}>` : (row?.email ?? ctx.userId),
        inline: false,
      },
      {
        name: "Organization",
        value: row?.orgName ?? ctx.organizationId,
        inline: true,
      },
      { name: "Role", value: ctx.role, inline: true },
    ],
  }).catch(() => {});

  return NextResponse.json({ ok: true });
}
