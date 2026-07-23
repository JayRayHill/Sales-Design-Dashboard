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

Label is Ink `#161310`, focus ring is Roasted `#FD822C`.

Four alternate color ranges ship as one-class swaps (see Tuning below):
Roasted only, Brew only, Iced only, and Roasted + Brew ("sunrise", no cool
tones). Note: the design system scopes Iced teal to cold-product sections —
the full-brand and Iced-only ranges use it only as a moving accent inside
the glass; pick Roasted, Brew, or Roasted + Brew to stay strictly warm.

## Install (Main Theme 2026)

1. Shopify admin → Online Store → Themes → **Edit code** on the live theme.
2. Under **Snippets**, click *Add a new snippet*, name it
   `hcf-customize-it-button`, and paste the contents of
   `hcf-customize-it-button.liquid`.
3. Open `snippets/product-template.liquid` and search for
   `hcf-customize-it-container` (it sits inside the `buy_buttons` block case).
   Replace the whole old block:

   ```liquid
   {% assign metafield_value = product.metafields.custom.customize_it_product %}
   {% if metafield_value %}
     {% assign related_product = all_products[metafield_value] %}
     {% if related_product %}
       <div class="hcf-customize-it-container">
         <a href="{{ related_product.url }}">
           <button type="button" class="hcf-customize-it-btn">Customize It</button>
         </a>
       </div>
     {% endif %}
   {% endif %}
   ```

   with:

   ```liquid
   {% render 'hcf-customize-it-button', product: product %}
   ```

4. Preview a product that has the `custom.customize_it_product` metafield set
   (the trigger logic is unchanged — same metafield, same link target).
5. Optional cleanup: remove the old `.hcf-customize-it-btn` /
   `.hcf-customize-it-container` CSS from the theme stylesheet if it lives
   there.

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

Depth (combine freely with any finish, color range, and texture; default is
flush):

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
current. Duration is 0.6s, deliberately a touch slower than the theme's
0.4s so the glass reveal breathes. Only the Raised and Domed depth variants add a lift on
hover, since dimension is their entire purpose.

## Accessibility & performance

- Honors `prefers-reduced-motion` (current freezes, sweep is removed).
- Solid-frost fallback for browsers without `backdrop-filter`.
- Single styled `<a>` with `aria-label` and a visible focus ring — replaces
  the old invalid `<button>`-inside-`<a>` markup.
- Animation is compositor-only (`transform` rotation on a blurred layer); no
  layout work per frame.
