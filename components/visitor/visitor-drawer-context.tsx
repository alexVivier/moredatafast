"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";

type VisitorTarget = { siteId: string; visitorId: string } | null;

type Ctx = {
  target: VisitorTarget;
  open: (siteId: string, visitorId: string) => void;
  close: () => void;
};

const VisitorDrawerContext = createContext<Ctx | null>(null);

export function VisitorDrawerProvider({ children }: { children: React.ReactNode }) {
  const [target, setTarget] = useState<VisitorTarget>(null);

  const open = useCallback((siteId: string, visitorId: string) => {
    setTarget({ siteId, visitorId });
  }, []);

  const close = useCallback(() => setTarget(null), []);

  const value = useMemo(
    () => ({ target, open, close }),
    [target, open, close]
  );

  return (
    <VisitorDrawerContext.Provider value={value}>
      {children}
    </VisitorDrawerContext.Provider>
  );
}

export function useVisitorDrawer(): Ctx {
  const ctx = useContext(VisitorDrawerContext);
  if (!ctx) {
    throw new Error("useVisitorDrawer must be used within VisitorDrawerProvider");
  }
  return ctx;
}
