import Link from "next/link";

import { Button } from "@/components/ui/button";
import { DateRangePicker } from "./date-range-picker";
import { OrganizationSwitcher } from "./organization-switcher";
import {
  SiteSwitcher,
  type SiteSwitcherEntry,
} from "./site-switcher";
import { UserMenu } from "./user-menu";

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
  logoUrl?: string | null;
  user: TopbarUser;
};

export function Topbar({
  currentViewId,
  entries,
  title,
  subtitle,
  logoUrl,
  user,
}: TopbarProps) {
  return (
    <header className="border-b border-border bg-background/60 backdrop-blur supports-[backdrop-filter]:bg-background/50">
      <div className="mx-auto max-w-7xl px-6 h-14 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logoUrl} alt="" className="h-6 w-6 rounded shrink-0" />
          ) : (
            <div className="h-6 w-6 rounded bg-primary/10 shrink-0" />
          )}
          <div className="min-w-0">
            <div className="font-semibold truncate">{title}</div>
            {subtitle ? (
              <div className="text-xs text-muted-foreground truncate">
                {subtitle}
              </div>
            ) : null}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <OrganizationSwitcher />
          <SiteSwitcher current={currentViewId} entries={entries} />
          <DateRangePicker />
          <Link href="/settings">
            <Button variant="ghost" size="sm">
              Settings
            </Button>
          </Link>
          <UserMenu email={user.email} name={user.name} image={user.image} />
        </div>
      </div>
    </header>
  );
}
