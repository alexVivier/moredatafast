import { Suspense, type ReactNode } from "react";

import { AuthShell } from "@/components/auth/auth-shell";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <AuthShell>
      <Suspense>{children}</Suspense>
    </AuthShell>
  );
}
