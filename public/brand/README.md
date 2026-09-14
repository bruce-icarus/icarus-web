# Icarus Technologies brand assets

Two marks, deliberately:

- **The figure** is the *icon* — favicon, app icon, dashboard chrome. Square,
  works in a 16px tab.
- **The wing wordmark** is the *lockup* — hero, social cards, decks, anywhere
  the full name should read.

This split is intentional, not drift. The figure's navy is `#002354` and the new
brand navy is `#032356`, so the two sit together without a clash.

The wordmark assets below are generated from the source artwork in `new_logos/`. The supplied SVGs ship with a
solid background rectangle baked in and their outline paths are missing
`fill="none"` (which renders the letter interiors black). Everything here has
both issues corrected: transparent background, outlines stroked properly.

## In the app — use the React components

```tsx
import { IcarusWordmark, IcarusMark } from '@/components/brand/icarus-logo'

<IcarusWordmark className="h-11 w-auto text-foreground md:h-16" />
<IcarusMark className="h-6 w-auto text-primary" />
```

Both draw with `currentColor`, so colour them with a text utility. No network
request, no layout shift, scales cleanly to any size.

## Static files — for anything outside the app

| File | Use |
| --- | --- |
| `icarus-wordmark-{white,navy,blue}.svg/.png` | Full lockup, transparent (PNG 1200×266) |
| `icarus-mark-{white,navy}.svg/.png` | Winged-I only, transparent (PNG 921×1024) |
| `icarus-figure.png` | The figure icon, cream field (300&times;300) |
| `icarus-figure-transparent.png` | The figure icon, transparent field |
| `icarus-figure-{192,512}.png` | PWA / manifest sizes |
| `icarus-icon.svg`, `icarus-icon-{192,512}.png` | Wing on a navy tile &mdash; unused by the app, kept as an option |
| `icarus-og.png` | 1200×630 social preview, wired up in `src/app/layout.tsx` |

Favicons live at `src/app/{favicon.ico,icon.png,apple-icon.png}` — Next.js serves
and links these automatically from the app directory. All are built from the
figure artwork.

`favicon.ico` is a real multi-size container (16/32/48). The previous one was a
300x300 PNG renamed `.ico`, which forced every browser to downscale a large
image on the fly — that is why it looked soft in the tab strip.

Icons are full-bleed squares on purpose. iOS, Android and CSS each apply their
own corner mask; pre-rounding the source gives you black corners on iOS.

## Colours

| Token | Hex | CSS variable | Tailwind |
| --- | --- | --- | --- |
| Navy | `#032356` | `--brand-navy` | `bg-brand-navy` |
| Blue | `#498AF3` | `--brand-blue` | `text-brand-blue` |

The brand blue is identical to the existing `--primary`, so the dashboard's
accent colour already matches the logo.

## Regenerating

Assets are derived, not hand-edited. If the artwork is ever reissued, drop the
new files in `new_logos/` and rebuild rather than patching these by hand.
