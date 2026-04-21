"use client";

import { Calendar, Check, MoreVertical, Pin, PinOff } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import {
  DATE_RANGE_LABELS,
  resolveDateRange,
  type DateRangePreset,
} from "@/lib/utils/date-range";
import type { WidgetMeta } from "@/widgets/_meta";

type Props = {
  pinned: boolean;
  override: WidgetMeta["dateRangeOverride"];
  onTogglePin: () => void;
  onSetOverride: (next: WidgetMeta["dateRangeOverride"]) => void;
};

const PRESETS: Exclude<DateRangePreset, "custom">[] = [
  "today",
  "7d",
  "30d",
  "90d",
];

export function WidgetSettingsMenu({
  pinned,
  override,
  onTogglePin,
  onSetOverride,
}: Props) {
  const [open, setOpen] = useState(false);
  const [dateOpen, setDateOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onClickAway(e: MouseEvent) {
      if (!ref.current?.contains(e.target as Node)) {
        setOpen(false);
        setDateOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickAway);
    return () => document.removeEventListener("mousedown", onClickAway);
  }, [open]);

  function pick(preset: Exclude<DateRangePreset, "custom">) {
    const resolved = resolveDateRange(preset);
    onSetOverride({
      preset: resolved.preset,
      startAt: resolved.startAt,
      endAt: resolved.endAt,
      lengthDays: resolved.lengthDays,
    });
    setOpen(false);
    setDateOpen(false);
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
          setDateOpen(false);
        }}
        className="mdf-widget__close"
        aria-label="Widget settings"
      >
        <MoreVertical size={14} strokeWidth={1.5} />
      </button>

      {open ? (
        <div className="absolute right-0 top-full z-50 mt-1 w-56 rounded-md border border-mdf-line-2 bg-mdf-bg-raised py-1 shadow-[var(--mdf-shadow-popover)]">
          <button
            type="button"
            onClick={() => {
              onTogglePin();
              setOpen(false);
            }}
            className="flex w-full items-center gap-2 px-3 py-1.5 text-xs text-mdf-fg-1 hover:bg-mdf-line-1"
          >
            {pinned ? (
              <PinOff size={14} strokeWidth={1.5} />
            ) : (
              <Pin size={14} strokeWidth={1.5} />
            )}
            {pinned ? "Unpin widget" : "Pin widget"}
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setDateOpen((v) => !v);
            }}
            className="flex w-full items-center justify-between px-3 py-1.5 text-xs text-mdf-fg-1 hover:bg-mdf-line-1"
          >
            <span className="flex items-center gap-2">
              <Calendar size={14} strokeWidth={1.5} />
              Date range
            </span>
            <span className="text-[10px] text-mdf-fg-3">
              {override ? DATE_RANGE_LABELS[override.preset] : "Global"}
            </span>
          </button>

          {dateOpen ? (
            <div className="border-t border-mdf-line-1 py-1">
              <button
                type="button"
                onClick={() => {
                  onSetOverride(null);
                  setOpen(false);
                  setDateOpen(false);
                }}
                className="flex w-full items-center justify-between px-3 py-1 text-xs text-mdf-fg-2 hover:bg-mdf-line-1"
              >
                <span>Use global range</span>
                {!override ? <Check size={12} strokeWidth={1.5} /> : null}
              </button>
              {PRESETS.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => pick(p)}
                  className="flex w-full items-center justify-between px-3 py-1 text-xs text-mdf-fg-2 hover:bg-mdf-line-1"
                >
                  <span>{DATE_RANGE_LABELS[p]}</span>
                  {override?.preset === p ? (
                    <Check size={12} strokeWidth={1.5} />
                  ) : null}
                </button>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
