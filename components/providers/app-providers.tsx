"use client";

import { NuqsAdapter } from "nuqs/adapters/next/app";

import { VisitorDrawer } from "@/components/visitor/visitor-drawer";
import { VisitorDrawerProvider } from "@/components/visitor/visitor-drawer-context";
import { DataFastProvider } from "./datafast-provider";
import { QueryProvider } from "./query-provider";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <QueryProvider>
      <NuqsAdapter>
        <VisitorDrawerProvider>
          <DataFastProvider />
          {children}
          <VisitorDrawer />
        </VisitorDrawerProvider>
      </NuqsAdapter>
    </QueryProvider>
  );
}
