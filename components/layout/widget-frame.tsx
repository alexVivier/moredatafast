"use client";

import { GripVertical, Pin, X } from "lucide-react";
import { useTranslations } from "next-intl";

import { useConfirm } from "@/components/ui/confirm-dialog";
import { cn } from "@/lib/utils";
import { DATE_RANGE_LABELS } from "@/lib/utils/date-range";
import type { WidgetMeta } from "@/widgets/_meta";

import { WidgetSettingsMenu } from "./widget-settings-menu";

type WidgetFrameProps = {
  title: string;
  subtitle?: string | null;
  editMode: boolean;
  onRemove?: () => void;
  children: React.ReactNode;
  className?: string;
  /** Meta-driven extras. Only rendered when values are supplied. */
  pinned?: boolean;
  dateOverride?: WidgetMeta["dateRangeOverride"];
  onTogglePin?: () => void;
  onSetDateOverride?: (next: WidgetMeta["dateRangeOverride"]) => void;
};

export function WidgetFrame({
  title,
  subtitle,
  editMode,
  onRemove,
  children,
  className,
  pinned,
  dateOverride,
  onTogglePin,
  onSetDateOverride,
}: WidgetFrameProps) {
  const t = useTranslations("dashboard.widget");
  const confirm = useConfirm();
  const dateOverrideLabel = dateOverride
    ? DATE_RANGE_LABELS[dateOverride.preset]
    : null;

  async function handleRemove() {
    if (!onRemove) return;
    if (pinned) {
      const ok = await confirm({
        title: t("confirmRemovePinnedTitle"),
        description: t("confirmRemovePinned"),
        confirmLabel: t("remove"),
        tone: "danger",
      });
      if (!ok) return;
    }
    onRemove();
  }

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
            {pinned ? (
              <span
                className="ml-2 inline-flex items-center text-mdf-brand"
                aria-label="Pinned"
                title="Pinned"
              >
                <Pin size={11} strokeWidth={1.8} />
              </span>
            ) : null}
            {dateOverrideLabel ? (
              <span className="ml-2 rounded px-1.5 py-0.5 text-[9px] font-mono uppercase tracking-wider text-mdf-fg-3 bg-mdf-line-1">
                {dateOverrideLabel}
              </span>
            ) : null}
          </div>
          {onTogglePin && onSetDateOverride ? (
            <WidgetSettingsMenu
              pinned={!!pinned}
              override={dateOverride ?? null}
              onTogglePin={onTogglePin}
              onSetOverride={onSetDateOverride}
            />
          ) : null}
          {onRemove ? (
            <button
              type="button"
              className="mdf-widget__close"
              onClick={handleRemove}
              aria-label={t("remove")}
            >
              <X size={14} strokeWidth={1.5} />
            </button>
          ) : null}
        </div>
      ) : pinned || dateOverrideLabel ? (
        // Read-only marker row when we have something meta to surface.
        <div className="mdf-widget__head pointer-events-none">
          <div className="mdf-widget__title">
            <span className="mdf-micro" style={{ color: "var(--mdf-fg-2)" }}>
              {title}
            </span>
            {pinned ? (
              <span
                className="ml-2 inline-flex items-center text-mdf-brand"
                aria-label="Pinned"
              >
                <Pin size={11} strokeWidth={1.8} />
              </span>
            ) : null}
            {dateOverrideLabel ? (
              <span className="ml-2 rounded px-1.5 py-0.5 text-[9px] font-mono uppercase tracking-wider text-mdf-fg-3 bg-mdf-line-1">
                {dateOverrideLabel}
              </span>
            ) : null}
          </div>
        </div>
      ) : null}
      <div className="mdf-widget__body">{children}</div>
    </div>
  );
}
