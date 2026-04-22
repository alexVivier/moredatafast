import { NextResponse } from "next/server";

import { runWebhookPoll } from "@/lib/webhooks/poller";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Simple shared-secret guard. Accept either `Authorization: Bearer <secret>`
// or `?secret=<secret>` so crontab-on-VPS (via `wget` / `curl`) and managed
// cron services both work.
function authorize(request: Request): boolean {
  const expected = process.env.CRON_SECRET;
  if (!expected) return false;

  const auth = request.headers.get("authorization") ?? "";
  if (auth.startsWith("Bearer ") && auth.slice(7) === expected) return true;

  const url = new URL(request.url);
  const q = url.searchParams.get("secret");
  if (q && q === expected) return true;

  return false;
}

export async function POST(request: Request) {
  if (!authorize(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const started = Date.now();
  const result = await runWebhookPoll();
  return NextResponse.json({
    ok: true,
    durationMs: Date.now() - started,
    ...result,
  });
}

// GET mirrors POST so a plain `curl` from crontab works without `-X POST`.
export const GET = POST;
