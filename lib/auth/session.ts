import "server-only";

import { headers as nextHeaders } from "next/headers";
import { redirect } from "next/navigation";
import { NextResponse } from "next/server";

import { auth, type AuthSession } from "./server";

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
