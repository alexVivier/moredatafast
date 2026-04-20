import { redirect } from "next/navigation";

import { getUnifiedViewId } from "@/lib/auth/hooks";
import { requirePageSession } from "@/lib/auth/session";

export default async function Home() {
  const session = await requirePageSession("/");
  const unifiedId = await getUnifiedViewId(session.user.id);
  redirect(`/view/${unifiedId}`);
}
