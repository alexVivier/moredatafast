"use client";

import { useEffect, useState } from "react";

export function useCountUp(
  target: number,
  { duration = 1200, active = true }: { duration?: number; active?: boolean } = {},
): number {
  const [value, setValue] = useState<number>(active ? 0 : target);

  useEffect(() => {
    if (!active) {
      setValue(target);
      return;
    }
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setValue(target * eased);
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, active, duration]);

  return value;
}
