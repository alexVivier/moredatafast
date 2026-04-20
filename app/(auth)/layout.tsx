import { Suspense, type ReactNode } from "react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-6 sm:p-6 bg-muted/20">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <h1 className="text-xl font-semibold tracking-tight">DataFast Dashboard</h1>
          <p className="text-xs text-muted-foreground">
            Unified analytics for your SaaS products.
          </p>
        </div>
        <Suspense>{children}</Suspense>
      </div>
    </div>
  );
}
