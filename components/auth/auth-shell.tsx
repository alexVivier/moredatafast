"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";

export function AuthShell({ children }: { children: ReactNode }) {
  const t = useTranslations("auth.shell");
  return (
    <div className="min-h-screen flex flex-col bg-mdf-bg-app text-mdf-fg-1">
      <main className="flex-1 flex items-center justify-center px-4 py-10 sm:py-16 relative">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 overflow-hidden"
        >
          <div
            className="absolute -top-40 right-[-220px] h-[720px] w-[720px]"
            style={{
              background:
                "radial-gradient(circle, rgba(245,155,60,0.09) 0%, rgba(245,155,60,0) 60%)",
            }}
          />
        </div>

        <div className="relative w-full max-w-[400px]">
          <Link
            href="/"
            className="mb-8 flex flex-col items-center gap-2.5 text-center"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/brand/logo-mark.svg" alt="More Data Fast" className="h-10" />
            <span
              className="text-mdf-fg-1"
              style={{
                fontFamily: "var(--mdf-font-display)",
                fontSize: 22,
                letterSpacing: "-0.01em",
                lineHeight: 1.1,
              }}
            >
              More Data Fast
            </span>
            <span className="mdf-micro">{t("tagline")}</span>
          </Link>

          <div className="rounded-[10px] border border-mdf-line-1 bg-mdf-bg-surface p-6 sm:p-7">
            {children}
          </div>

          <p className="mt-6 text-center text-[11px] text-mdf-fg-3 font-mono tracking-wider">
            {t("copyright")}
          </p>
        </div>
      </main>
    </div>
  );
}
