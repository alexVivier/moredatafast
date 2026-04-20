"use client";

import { useDateRangeState, DATE_RANGE_LABELS } from "@/lib/hooks/use-date-range";
import type { DateRangePreset } from "@/lib/utils/date-range";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

const PRESETS: DateRangePreset[] = ["today", "7d", "30d", "90d", "custom"];

export function DateRangePicker() {
  const { preset, custom, resolved, setPreset, setCustom } = useDateRangeState();

  return (
    <div className="flex items-center gap-2">
      <Select
        value={preset}
        onChange={(e) => setPreset(e.target.value as DateRangePreset)}
      >
        {PRESETS.map((p) => (
          <option key={p} value={p}>
            {DATE_RANGE_LABELS[p]}
          </option>
        ))}
      </Select>

      {preset === "custom" ? (
        <>
          <Input
            type="date"
            value={custom.startAt ?? resolved.startAt}
            onChange={(e) =>
              setCustom(e.target.value, custom.endAt ?? resolved.endAt)
            }
            className="w-[140px]"
            aria-label="Start date"
          />
          <span className="text-muted-foreground text-sm">→</span>
          <Input
            type="date"
            value={custom.endAt ?? resolved.endAt}
            onChange={(e) =>
              setCustom(custom.startAt ?? resolved.startAt, e.target.value)
            }
            className="w-[140px]"
            aria-label="End date"
          />
        </>
      ) : (
        <span className="text-xs text-muted-foreground">
          {resolved.startAt} → {resolved.endAt}
        </span>
      )}
    </div>
  );
}
