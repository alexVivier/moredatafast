"use client";

import type { CSSProperties, ReactNode } from "react";

export function WidgetShell({
  title,
  hideClose = false,
  style,
  children,
}: {
  title: string;
  hideClose?: boolean;
  style?: CSSProperties;
  children: ReactNode;
}) {
  return (
    <div className="lp-widget" style={style}>
      <div className="lp-widget__head">
        <span className="lp-widget__grip" aria-hidden>⋮⋮</span>
        <span className="lp-widget__title">{title}</span>
        {hideClose ? null : (
          <span className="lp-widget__close" aria-hidden>×</span>
        )}
      </div>
      <div className="lp-widget__body">{children}</div>
    </div>
  );
}
