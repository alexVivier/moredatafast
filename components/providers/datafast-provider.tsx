"use client";

import { useEffect } from "react";

import { initDataFast } from "datafast";

export function DataFastProvider() {
  useEffect(() => {
    const websiteId = process.env.NEXT_PUBLIC_DATAFAST_WEBSITE_ID;
    if (!websiteId) return;
    // Fire-and-forget: DataFast handles its own lifecycle once initialised.
    void initDataFast({ websiteId, cookieless: true });
  }, []);

  return null;
}
