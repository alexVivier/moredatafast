# Iconography

## Approach

More Data Fast uses a **single-weight line icon system** at 1.5px stroke width, matching the thin-hairline aesthetic of the rest of the UI. Icons are always 16×16 by default (20×20 in marketing/slides, 14×14 in dense tables). They never fill, they never colour — monochrome `var(--mdf-fg-2)` or `var(--mdf-fg-1)`. On hover they step one tone lighter.

## Source

**No icon set was present in the attached screenshots.** The visible icons (`⋮⋮` drag handle, `×` close, `+ Add widget`, gear/Settings, chevron picker, `↑ ↓` deltas) map cleanly onto [Lucide](https://lucide.dev) — same stroke weight, same corner treatment, same editorial restraint. We substitute Lucide from CDN until real assets arrive.

**Flag:** swap to the real set as soon as it's available; update `assets/icons/` accordingly.

## Usage

```html
<!-- CDN -->
<script src="https://unpkg.com/lucide@latest/dist/umd/lucide.js"></script>

<!-- in markup -->
<i data-lucide="settings" class="mdf-icon"></i>
<i data-lucide="x" class="mdf-icon"></i>
<i data-lucide="plus" class="mdf-icon"></i>

<script>lucide.createIcons();</script>
```

```css
.mdf-icon {
  width: 16px;
  height: 16px;
  stroke: currentColor;
  stroke-width: 1.5;
  color: var(--mdf-fg-2);
}
.mdf-icon:hover { color: var(--mdf-fg-1); }
```

## The canonical set (by usage)

| Purpose             | Lucide name      | Size |
| ------------------- | ---------------- | ---- |
| Drag handle         | `grip-vertical`  | 14   |
| Close / dismiss     | `x`              | 14   |
| Add widget          | `plus`           | 14   |
| Settings            | `settings`       | 16   |
| Picker chevron      | `chevron-down`   | 14   |
| Date range          | `calendar`       | 16   |
| Workspace           | `layers`         | 16   |
| Site                | `globe`          | 16   |
| Delta up            | `arrow-up`       | 12   |
| Delta down          | `arrow-down`     | 12   |
| No data (empty)     | `bar-chart-3`    | 16   |
| Menu / more         | `more-horizontal`| 16   |
| Expand / focus      | `maximize-2`     | 14   |
| Search              | `search`         | 16   |
| Copy                | `copy`           | 14   |

## Flags & emoji

- **Country flags** — Unicode regional-indicator emoji (`🇫🇷`, `🇺🇸`) inline in event feeds at 14px. This is the **only** emoji use in the product.
- **No other emoji** — product, settings, docs, dashboards all avoid them.

## Unicode glyphs as icons

- `↑ ↓` — deltas in KPIs (colored by sign: green / red)
- `→` — "Upgrade now →", "Open →" — link affordance
- `⋮⋮` — drag handle (fallback if Lucide `grip-vertical` unavailable)
- `·` — row separator in metadata (`Europe/Paris · EUR · added 4/20/2026`)
- `—` — em-dash in tables to indicate "no value" (never "N/A")

## Logo mark

The mark is a rotated rounded square (diamond/kite) in warm orange with a subtle inner bevel, containing an ascending-bar glyph. See `assets/logo-mark.svg`. Always use as provided; never recolour, never rotate further, never place on a non-dark background without the `logo-wordmark-light.svg` variant.
