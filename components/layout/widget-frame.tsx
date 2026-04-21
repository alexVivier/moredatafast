"use client";

import { GripVertical, X } from "lucide-react";
import { useTranslations } from "next-intl";

import { cn } from "@/lib/utils";

export function WidgetFrame({
  title,
  subtitle,
  editMode,
  onRemove,
  children,
  className,
}: {
  title: string;
  subtitle?: string | null;
  editMode: boolean;
  onRemove?: () => void;
  children: React.ReactNode;
  className?: string;
}) {
  const t = useTranslations("dashboard.widget");
  return (
    <div className={cn("mdf-widget h-full w-full", className)}>
      {editMode ? (
        <div className="mdf-widget__head">
          <span
            className="drag-handle mdf-widget__grip p-0.5"
            aria-label={t("dragHandle")}
          >
            <GripVertical size={14} strokeWidth={1.5} />
          </span>
          <div className="mdf-widget__title">
            <span className="mdf-micro" style={{ color: "var(--mdf-fg-2)" }}>
              {title}
            </span>
            {subtitle ? (
              <span className="ml-2 text-mdf-fg-3 font-normal normal-case tracking-normal">
                {subtitle}
              </span>
            ) : null}
          </div>
          {onRemove ? (
            <button
              type="button"
              className="mdf-widget__close"
              onClick={onRemove}
              aria-label={t("remove")}
            >
              <X size={14} strokeWidth={1.5} />
            </button>
          ) : null}
        </div>
      ) : null}
      <div className="mdf-widget__body">{children}</div>
    </div>
  );
}
