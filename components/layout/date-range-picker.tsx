"use client";

import { useDateRangeState, DATE_RANGE_LABELS } from "@/lib/hooks/use-date-range";
import type { DateRangePreset } from "@/lib/utils/date-range";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

const PRESETS: DateRangePreset[] = ["today", "7d", "30d", "90d", "custom"];

export function DateRangePicker() {
  const { preset, custom, resolved, setPreset, setCustom } = useDateRangeState();

  return (
    <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
      <Select
        value={preset}
        onChange={(e) => setPreset(e.target.value as DateRangePreset)}
        className="min-w-[92px]"
      >
        {PRESETS.map((p) => (
          <option key={p} value={p}>
            {DATE_RANGE_LABELS[p]}
          </option>
        ))}
      </Select>

      {preset === "custom" ? (
        <div className="flex items-center gap-1 sm:gap-2 basis-full sm:basis-auto order-3 sm:order-none">
          <Input
            type="date"
            value={custom.startAt ?? resolved.startAt}
            onChange={(e) =>
              setCustom(e.target.value, custom.endAt ?? resolved.endAt)
            }
            className="flex-1 sm:w-[140px] min-w-0"
            aria-label="Start date"
          />
          <span className="text-muted-foreground text-sm">→</span>
          <Input
            type="date"
            value={custom.endAt ?? resolved.endAt}
            onChange={(e) =>
              setCustom(custom.startAt ?? resolved.startAt, e.target.value)
            }
            className="flex-1 sm:w-[140px] min-w-0"
            aria-label="End date"
          />
        </div>
      ) : (
        <span className="hidden md:inline text-xs text-muted-foreground">
          {resolved.startAt} → {resolved.endAt}
        </span>
      )}
    </div>
  );
}
