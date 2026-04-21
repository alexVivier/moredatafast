import { cookies, headers } from "next/headers";
import { getRequestConfig } from "next-intl/server";

import { LOCALE_COOKIE, resolveLocale } from "./config";

export default getRequestConfig(async () => {
  const cookieStore = await cookies();
  const hdrs = await headers();
  const locale = resolveLocale(
    cookieStore.get(LOCALE_COOKIE)?.value,
    hdrs.get("accept-language") ?? undefined,
  );
  const messages = (await import(`../messages/${locale}.json`)).default;
  return { locale, messages };
});
