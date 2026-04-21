# Dashboard UI Kit

The primary product surface: a customisable widget grid for tracking site analytics.

## Components

- `Topbar.jsx` — app chrome with workspace / site / date pickers, settings, account menu, trial banner
- `Widget.jsx` — generic widget chrome (grip + title + close) + `KpiStripWidget` 6-up overview strip
- `Charts.jsx` — `AreaChart`, `DonutChart` (lightweight SVG)
- `Feeds.jsx` — `CitiesList`, `LiveEvents`, `TopCampaigns`, `LivePaymentsEmpty`
- `Settings.jsx` — Sites management page

## Screens

- **Dashboard** (default) — editable widget grid
- **Settings** — click the gear in the topbar

Widgets can be dismissed via their `×` button (state is local; refresh restores).

## Notes
- All visual tokens pulled from `../../colors_and_type.css`.
- Light mode ready (set `data-theme="light"` on `<html>`), but dark is the intended default.
