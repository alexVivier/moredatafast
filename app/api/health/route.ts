import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";

import { db } from "@/db/client";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await db.execute(sql`SELECT 1`);
    return NextResponse.json({
      status: "ok",
      db: "ok",
      time: new Date().toISOString(),
    });
  } catch (e) {
    return NextResponse.json(
      {
        status: "error",
        db: "down",
        error: e instanceof Error ? e.message : "db error",
      },
      { status: 503 },
    );
  }
}
