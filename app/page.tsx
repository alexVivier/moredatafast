import { redirect } from "next/navigation";

import { seedUnifiedViewForOrganization } from "@/lib/auth/hooks";
import { requirePageOrg } from "@/lib/auth/session";

export default async function Home() {
  const { organizationId } = await requirePageOrg("/");
  const unifiedId = await seedUnifiedViewForOrganization(organizationId);
  redirect(`/view/${unifiedId}`);
}
