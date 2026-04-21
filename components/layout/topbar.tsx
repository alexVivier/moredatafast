import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Settings } from "lucide-react";

import {
  TrialBanner,
  type TrialBannerProps,
} from "@/components/billing/trial-banner";
import { DateRangePicker } from "./date-range-picker";
import { OrganizationSwitcher } from "./organization-switcher";
import {
  SiteSwitcher,
  type SiteSwitcherEntry,
} from "./site-switcher";
import { UserMenu } from "./user-menu";
import { siteIconUrl } from "@/lib/utils/favicon";

export type TopbarUser = {
  email: string;
  name: string | null;
  image: string | null;
};

export type TopbarProps = {
  currentViewId: string;
  entries: SiteSwitcherEntry[];
  title: string;
  subtitle?: string | null;
  domain?: string | null;
  logoUrl?: string | null;
  user: TopbarUser;
  billing?: TrialBannerProps;
};

export async function Topbar({
  currentViewId,
  entries,
  title,
  subtitle,
  domain,
  logoUrl,
  user,
  billing,
}: TopbarProps) {
  const t = await getTranslations("dashboard.topbar");
  const iconUrl = siteIconUrl(logoUrl, domain);
  const sub = subtitle ?? domain ?? null;
  return (
    <header className="sticky top-0 z-40 isolate bg-mdf-bg-app">
      {billing ? <TrialBanner {...billing} /> : null}
      <div
        className="flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-mdf-line-1 px-3 sm:px-5 py-2 sm:py-0"
        style={{ minHeight: "var(--mdf-topbar-h)" }}
      >
        <BrandBlock iconUrl={iconUrl} title={title} subtitle={sub} />

        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap justify-end ml-auto">
          <OrganizationSwitcher />
          <SiteSwitcher current={currentViewId} entries={entries} />
          <DateRangePicker />
          <Link
            href="/settings"
            aria-label={t("settings")}
            className="inline-flex h-8 items-center gap-1.5 rounded-md px-2 text-sm text-mdf-fg-2 hover:text-mdf-fg-1 hover:bg-mdf-line-1"
          >
            <Settings size={16} strokeWidth={1.5} />
            <span className="hidden sm:inline">{t("settings")}</span>
          </Link>
          <UserMenu email={user.email} name={user.name} image={user.image} />
        </div>
      </div>
    </header>
  );
}

function BrandBlock({
  iconUrl,
  title,
  subtitle,
}: {
  iconUrl: string | null;
  title: string;
  subtitle: string | null;
}) {
  return (
    <Link
      href="/"
      className="flex items-center gap-2.5 min-w-0 flex-1 min-w-[140px] pr-3"
    >
      {iconUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={iconUrl} alt="" className="h-7 w-7 rounded shrink-0" />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src="/brand/logo-mark.svg"
          alt=""
          className="h-7 w-7 shrink-0"
        />
      )}
      <div className="flex flex-col leading-[1.15] min-w-0">
        <span
          className="truncate text-[15px] text-mdf-fg-1"
          style={{
            fontFamily: "var(--mdf-font-display)",
            letterSpacing: "-0.01em",
          }}
        >
          {title}
        </span>
        {subtitle ? (
          <span className="hidden sm:inline mdf-micro truncate">
            {subtitle}
          </span>
        ) : null}
      </div>
    </Link>
  );
}
