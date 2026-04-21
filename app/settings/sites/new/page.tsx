import Link from "next/link";

import { AddSiteForm } from "@/components/forms/add-site-form";
import { Button } from "@/components/ui/button";
import { requirePageOrg } from "@/lib/auth/session";
import { getPlanPrices } from "@/lib/billing/prices";

export default async function NewSitePage() {
  // Only admin/owner can reach this page; members get redirected to "/".
  await requirePageOrg("/settings/sites/new", "admin");
  const prices = await getPlanPrices();
  return (
    <div className="mx-auto max-w-xl px-3 sm:px-6 py-4 sm:py-6 space-y-4">
      <div className="flex items-center gap-2">
        <Link href="/settings">
          <Button variant="ghost" size="sm">
            ← Back
          </Button>
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">Add a site</h1>
      </div>
      <AddSiteForm
        monthlyPriceLabel={prices.monthly?.display ?? null}
        yearlyPriceLabel={prices.yearly?.display ?? null}
        yearlySavingsPercent={prices.yearlySavingsPercent}
      />
    </div>
  );
}
