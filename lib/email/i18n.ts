import "server-only";

import { cookies } from "next/headers";

import en from "@/messages/en.json";
import fr from "@/messages/fr.json";
import { LOCALE_COOKIE, isLocale, type Locale } from "@/i18n/config";

type Messages = typeof en;
const CATALOG: Record<Locale, Messages> = {
  en: en as Messages,
  fr: fr as Messages,
};

/**
 * Resolve the recipient's locale for a transactional email. Prefers an
 * explicit argument (useful when the email is sent in a job outside the
 * request), then the NEXT_LOCALE cookie from the current request, then
 * defaults to "en". Never throws outside the request scope.
 */
export async function resolveEmailLocale(override?: string | null): Promise<Locale> {
  if (isLocale(override)) return override;
  try {
    const store = await cookies();
    const v = store.get(LOCALE_COOKIE)?.value;
    if (isLocale(v)) return v;
  } catch {
    // cookies() throws outside a request scope — fall through.
  }
  return "en";
}

/**
 * Minimal message lookup + ICU-style {var} interpolation for email templates.
 * Intentionally lightweight (no plurals or rich formatting) — emails rarely
 * need more.
 */
export function emailT(
  locale: Locale,
  path: string,
  vars?: Record<string, string | number>,
): string {
  const parts = path.split(".");
  let node: unknown = CATALOG[locale];
  for (const part of parts) {
    if (node && typeof node === "object" && part in node) {
      node = (node as Record<string, unknown>)[part];
    } else {
      node = undefined;
      break;
    }
  }
  if (typeof node !== "string") return path;
  if (!vars) return node;
  return node.replace(/\{(\w+)\}/g, (_, key: string) =>
    key in vars ? String(vars[key]) : `{${key}}`,
  );
}
