"use client";

import { NuqsAdapter } from "nuqs/adapters/next/app";

import { DialogProvider } from "@/components/ui/confirm-dialog";
import { VisitorDrawer } from "@/components/visitor/visitor-drawer";
import { VisitorDrawerProvider } from "@/components/visitor/visitor-drawer-context";
import { DataFastProvider } from "./datafast-provider";
import { QueryProvider } from "./query-provider";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <QueryProvider>
      <NuqsAdapter>
        <DialogProvider>
          <VisitorDrawerProvider>
            <DataFastProvider />
            {children}
            <VisitorDrawer />
          </VisitorDrawerProvider>
        </DialogProvider>
      </NuqsAdapter>
    </QueryProvider>
  );
}
