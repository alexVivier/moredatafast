"use client";

import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

import { LOCALES, LOCALE_COOKIE, type Locale } from "@/i18n/config";
import { cn } from "@/lib/utils";

function setLocaleCookie(locale: Locale) {
  if (typeof document === "undefined") return;
  const oneYear = 60 * 60 * 24 * 365;
  document.cookie = `${LOCALE_COOKIE}=${locale}; Path=/; Max-Age=${oneYear}; SameSite=Lax`;
}

/**
 * Compact inline toggle used in menus (UserMenu) and the landing footer.
 * Click a label → set the cookie → refresh the RSC tree in the new locale.
 */
export function LocaleSwitcher({ className }: { className?: string }) {
  const active = useLocale() as Locale;
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function pick(next: Locale) {
    if (next === active) return;
    setLocaleCookie(next);
    startTransition(() => router.refresh());
  }

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1 text-xs font-mono tabular-nums",
        pending && "opacity-60",
        className,
      )}
      role="group"
      aria-label="Language"
    >
      {LOCALES.map((loc, i) => (
        <span key={loc} className="inline-flex items-center">
          {i > 0 ? <span className="text-mdf-fg-4 mx-1">·</span> : null}
          <button
            type="button"
            onClick={() => pick(loc)}
            aria-pressed={loc === active}
            className={cn(
              "uppercase tracking-wider transition-colors",
              loc === active
                ? "text-mdf-fg-1"
                : "text-mdf-fg-3 hover:text-mdf-fg-1",
            )}
          >
            {loc}
          </button>
        </span>
      ))}
    </div>
  );
}
