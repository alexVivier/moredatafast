import Link from "next/link";

import { AddSiteForm } from "@/components/forms/add-site-form";
import { Button } from "@/components/ui/button";

export default function NewSitePage() {
  return (
    <div className="mx-auto max-w-xl p-6 space-y-4">
      <div className="flex items-center gap-2">
        <Link href="/settings">
          <Button variant="ghost" size="sm">
            ← Back
          </Button>
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">Add a site</h1>
      </div>
      <AddSiteForm />
    </div>
  );
}
