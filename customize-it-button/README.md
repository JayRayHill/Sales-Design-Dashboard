# Customize It — Liquid Glass Button

A leveled-up "Customize It" CTA for Hot Cup Factory product pages: a frosted
liquid-glass pane over a slow-turning current of brand color. The current is
always drifting to catch the eye; on hover (desktop) or press (mobile) the
frost thins and the color surges through, finished with a specular light sweep.

Pure CSS — no images, no JavaScript, no apps.

## Files

| File | What it is |
| --- | --- |
| `hcf-customize-it-button.liquid` | Production Shopify snippet (markup + styles in one file) |
| `demo.html` | Standalone interactive demo — open in any browser |

## Brand colors used (HCF design system v12)

The default moving current is the full brand run, weighted warm with one
cool pass:

Roasted dark `#BC5713` → Roasted `#FD822C` → Brew `#FFCB1F` → Iced light `#9FDCED` → Iced dark `#2A7A8A`

Label is "Design Online" (UNIQ's proven label for this designer), Ink
`#161310` text, focus ring Roasted `#FD822C`. The label is a single line in
the snippet — swap freely, or A/B test against "Customize It".

**The theme controls all structural settings** so the button reads as
native; only the glass look (color current, frost, ring, hover wipe, glow)
is custom. Specifically, these follow the theme's own button variables,
each with a fallback:

| Property | Bound to | Fallback |
| --- | --- | --- |
| Corner radius | `var(--btn-border-radius)` | 4px |
| Padding / height | `var(--btn-padding-y)` + `var(--btn-border-width)` (matches `.btn--primary`) | 12px / 1px |
| Font family | `inherit` (theme body font) | — |
| Font size | `var(--btn-text-size)` | 15px |
| Casing | `var(--btn-text-transform)` | none |
| Line height | `1.2em` (theme `.btn` value) | — |

Text color stays Ink (`--hcf-label`) rather than the theme's button text
color, because the glass surface is light and needs dark text for contrast
— that's part of the custom look, not a structural setting. Font weight is
700, matching the theme's `.btn`.

**Shipped configuration:** Prism Ring finish + Brisk 7s speed, with
full-brand color, frosted texture, and flush depth (the defaults). Those
two classes (`hcf-glass-btn--ring hcf-glass-btn--brisk`) are already on the
`<a>` in the snippet — change them to restyle.

Four alternate color ranges ship as one-class swaps (see Tuning below):
Roasted only, Brew only, Iced only, and Roasted + Brew ("sunrise", no cool
tones). Note: the design system scopes Iced teal to cold-product sections —
the full-brand and Iced-only ranges use it only as a moving accent inside
the glass; pick Roasted, Brew, or Roasted + Brew to stay strictly warm.

## What this is

This ports UNIQ Supply's "Design Online" designer button onto Hot Cup
Factory as an upgraded glass CTA. It reads the `customizer.type` /
`customizer.size` product metafields and links to the online designer with
`brand`/`type`/`size` as query params, reproducing UNIQ's flow with the
glass styling.

The designer app is hosted on **UNIQ Supply**
(`uniqsupply.com/pages/custom-designer`) and is **brand-aware** — passing
`brand=hcf` re-skins it to Hot Cup Factory (confirmed working). So the
button links cross-domain to UNIQ; **HCF does not need its own designer
page.** The link opens in a new tab so the shopper keeps their HCF product
page. If you later host the designer on `hotcupfactory.com`, just change
`cz_designer_base` in the snippet.

## Prerequisites on Hot Cup Factory

The button only appears when these are in place on HCF:

1. **Metafield definitions** `customizer.type` and `customizer.size`, defined
   and populated per product (mirror UNIQ's value tokens — e.g. `single-wall`,
   `12oz`). The button renders only when **both** are set on a product.
2. That's it for the connection — the UNIQ-hosted app already recognizes
   `brand=hcf`.

## Install (HCF draft theme)

1. Shopify admin → Online Store → Themes → **Edit code** on the draft theme.
2. Under **Snippets**, *Add a new snippet* named `hcf-customize-it-button`,
   and paste in `hcf-customize-it-button.liquid`.
3. In the product template, at the spot where the CTA should appear, add:

   ```liquid
   {% render 'hcf-customize-it-button', product: product %}
   ```

4. Preview a product that has both `customizer.type` and `customizer.size`
   set. If the button doesn't show, one of the two metafields is empty.

## Tuning

CSS variables on `.hcf-glass-btn`:

| Variable | Default | Effect |
| --- | --- | --- |
| `--hcf-aura-speed` | `10s` | One full rotation of the color current — higher is slower |
| `--hcf-frost` | `0.62` | Frost opacity at rest (0–1) — lower shows more color |
| `--hcf-radius` | `12px` | Corner radius |
| `--hcf-label` | `#161310` | Label text color (Ink) |

Finish variants (add a class beside `hcf-glass-btn` in the snippet markup):

- `hcf-glass-btn--ring` — near-clear glass, the color shows as a crisp moving
  border ring (closest to the previous button's look)
- `hcf-glass-btn--molten` — thinner frost, richer color at rest, maximum
  attention

Color ranges (combine freely with any finish; default is the full brand run):

- `hcf-glass-btn--roasted` — orange only
- `hcf-glass-btn--brew` — yellow only
- `hcf-glass-btn--iced` — blue only
- `hcf-glass-btn--sunrise` — orange + yellow, no cool tones

Each range also retunes the button's glow/shadow colors to match.

Texture (default is frosted):

- `hcf-glass-btn--satin` — semi-sheer middle ground between frosted and
  liquid: color clearly present at rest but gently hazed, with a soft top
  sheen
- `hcf-glass-btn--liquid` — clear "liquid glass": a thin wet film instead of
  the milky frost, vivid color underneath, and a permanent gloss highlight

Speed (default is a 10s drift; `--hcf-aura-speed` accepts any value):

- `hcf-glass-btn--brisk` — 7s rotation, noticeably livelier
- `hcf-glass-btn--lively` — 4s rotation, high energy

Depth (combine freely with any finish, color range, texture, and speed;
default is flush):

- `hcf-glass-btn--raised` — a clear step off the page: layered shadow,
  top-lit pane, higher lift on hover
- `hcf-glass-btn--domed` — full 3D lens: curved glare cap, beveled edge,
  deep stacked shadow, and a press-down on click

## Hover behavior

The hover is theme-exact. Canopy CTAs hover with one motion only: a 104°
diagonal color wipe — an oversized two-stop gradient whose
`background-position` slides with ease-out — no lift, no glow change,
no sweep. This button does precisely that and nothing else: the frost
floods away at 104° with the same easing, revealing the moving color
current. Duration is 0.4s ease-out, matching the theme's own buttons. Only the Raised and Domed depth variants add a lift on
hover, since dimension is their entire purpose.

## Accessibility & performance

- Honors `prefers-reduced-motion` (current freezes, sweep is removed).
- Solid-frost fallback for browsers without `backdrop-filter`.
- Single styled `<a>` with `aria-label` and a visible focus ring — replaces
  the old invalid `<button>`-inside-`<a>` markup.
- Animation is compositor-only (`transform` rotation on a blurred layer); no
  layout work per frame.
