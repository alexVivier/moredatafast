import Link from "next/link";

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

export function Topbar({
  currentViewId,
  entries,
  title,
  subtitle,
  domain,
  logoUrl,
  user,
  billing,
}: TopbarProps) {
  const iconUrl = siteIconUrl(logoUrl, domain);
  return (
    <header className="sticky top-0 z-40 isolate border-b border-border bg-background/60 backdrop-blur supports-[backdrop-filter]:bg-background/50">
      {billing ? <TrialBanner {...billing} /> : null}
      <div className="mx-auto w-full max-w-7xl px-3 sm:px-6 py-2 sm:py-0 sm:h-14 flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
        <div className="flex items-center gap-3 min-w-0 flex-1 min-w-[140px]">
          {iconUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={iconUrl} alt="" className="h-6 w-6 rounded shrink-0" />
          ) : (
            <div className="h-6 w-6 rounded bg-primary/10 shrink-0" />
          )}
          <div className="min-w-0">
            <div className="font-semibold truncate text-sm sm:text-base">
              {title}
            </div>
            {subtitle ? (
              <div className="hidden sm:block text-xs text-muted-foreground truncate">
                {subtitle}
              </div>
            ) : null}
          </div>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap justify-end">
          <OrganizationSwitcher />
          <SiteSwitcher current={currentViewId} entries={entries} />
          <DateRangePicker />
          <Link
            href="/settings"
            aria-label="Settings"
            className="inline-flex h-9 items-center rounded-md px-2 text-sm hover:bg-accent/50"
          >
            <SettingsIcon />
            <span className="ml-1.5 hidden sm:inline">Settings</span>
          </Link>
          <UserMenu email={user.email} name={user.name} image={user.image} />
        </div>
      </div>
    </header>
  );
}

function SettingsIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden
    >
      <path
        d="M8 10.5A2.5 2.5 0 1 0 8 5.5a2.5 2.5 0 0 0 0 5Zm5.5-2.5c0 .32-.03.63-.08.93l1.46 1.14a.35.35 0 0 1 .08.44l-1.38 2.39a.35.35 0 0 1-.43.15l-1.72-.69a5.4 5.4 0 0 1-1.6.93l-.26 1.84a.35.35 0 0 1-.35.3H6.78a.35.35 0 0 1-.35-.3l-.26-1.84a5.4 5.4 0 0 1-1.6-.93l-1.72.69a.35.35 0 0 1-.43-.15L1.04 10.51a.35.35 0 0 1 .08-.44L2.58 8.93A5.53 5.53 0 0 1 2.5 8c0-.32.03-.63.08-.93L1.12 5.93a.35.35 0 0 1-.08-.44L2.42 3.1a.35.35 0 0 1 .43-.15l1.72.69a5.4 5.4 0 0 1 1.6-.93l.26-1.84A.35.35 0 0 1 6.78.57h2.44c.18 0 .33.12.35.3l.26 1.84c.58.23 1.12.54 1.6.93l1.72-.69a.35.35 0 0 1 .43.15l1.38 2.39a.35.35 0 0 1-.08.44l-1.46 1.14c.05.3.08.61.08.93Z"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinejoin="round"
      />
    </svg>
  );
}
