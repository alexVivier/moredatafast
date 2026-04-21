export const LOCALES = ["en", "fr"] as const;
export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "en";
export const LOCALE_COOKIE = "NEXT_LOCALE";

export const LOCALE_LABELS: Record<Locale, string> = {
  en: "English",
  fr: "Français",
};

export function isLocale(value: string | undefined | null): value is Locale {
  return !!value && (LOCALES as readonly string[]).includes(value);
}

/**
 * Resolve a locale from a cookie value + Accept-Language header, falling back
 * to the default. Accept-Language is parsed in priority order and the first
 * supported code wins — quality values aren't re-sorted because modern
 * browsers emit them pre-sorted.
 */
export function resolveLocale(
  cookieValue: string | undefined,
  acceptLanguage: string | undefined,
): Locale {
  if (isLocale(cookieValue)) return cookieValue;
  if (acceptLanguage) {
    const entries = acceptLanguage
      .split(",")
      .map((part) => part.split(";")[0].trim().toLowerCase());
    for (const entry of entries) {
      const base = entry.split("-")[0];
      if (isLocale(base)) return base;
    }
  }
  return DEFAULT_LOCALE;
}
