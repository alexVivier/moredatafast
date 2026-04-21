export function faviconUrlForDomain(
  domain: string | null | undefined,
  size = 64,
): string | null {
  if (!domain) return null;
  const clean = domain
    .trim()
    .replace(/^https?:\/\//i, "")
    .replace(/\/.*$/, "")
    .replace(/:\d+$/, "");
  if (!clean) return null;
  return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(clean)}&sz=${size}`;
}

export function siteIconUrl(
  logoUrl: string | null | undefined,
  domain: string | null | undefined,
  size = 64,
): string | null {
  if (logoUrl && logoUrl.trim()) return logoUrl;
  return faviconUrlForDomain(domain, size);
}
