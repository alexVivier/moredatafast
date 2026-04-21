import type { Metadata } from "next";
import { redirect } from "next/navigation";

import "./styles/landing.css";
import { Landing } from "@/components/landing/landing";
import { seedUnifiedViewForOrganization } from "@/lib/auth/hooks";
import { getSession, requirePageOrg } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "More Data Fast — Your DataFast numbers, recomposed.",
  description:
    "A dashboard layer on top of DataFast — live events, live payments, drag-and-drop widgets, shareable views. Built by one dev, for operators.",
};

export default async function Home() {
  const session = await getSession();
  if (!session) return <Landing />;

  // Signed-in: route through the same dashboard entry as before. requirePageOrg
  // will skip the /login redirect because the session is already present.
  const { organizationId } = await requirePageOrg("/");
  const unifiedId = await seedUnifiedViewForOrganization(organizationId);
  redirect(`/view/${unifiedId}`);
}
