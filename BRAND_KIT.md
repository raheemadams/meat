# Halaliy — Brand Kit

**Tagline:** Fresh. Shared. Delivered.
**Category:** Halal meat ordering & delivery platform
**Home market:** Houston, TX · (Dallas · Austin · Chicago · New York secondary)
**Personality:** Trustworthy · community-first · faith-informed · approachable · premium

---

## 1. Logo

The Halaliy logo is an **"H" monogram** in a rounded green tile, paired with the
**`Halaliy`** wordmark — "Halal" in dark slate, "iy" in brand green.

| Asset | File | Use |
|---|---|---|
| Mark (icon) | [`public/logo-mark.svg`](public/logo-mark.svg) | Avatars, app icon, favicon, tight spaces |
| Full lockup | [`public/logo-full.svg`](public/logo-full.svg) | Headers, emails, documents, signage |
| App icon (PNG) | `public/icon-512.png`, `icon-192.png` | App stores, PWA, social avatars |
| Email/header (PNG) | `public/logo-full.png` | Email clients (no SVG support) |
| Social card | `public/og-image.png` | Link previews (1200×630) |

**Regenerate PNGs:** `npm i sharp --no-save && node scripts/render-logos.mjs`

### Clear space & sizing
- Keep clear space around the logo equal to the height of the monogram's crossbar on all sides.
- **Minimum size:** mark ≥ 24px; full lockup ≥ 120px wide (digital).

### Do
- Use the mark on green or photographic backgrounds (white "H" reads cleanly).
- Use the full lockup on light/white backgrounds.
- Scale proportionally.

### Don't
- Recolor the monogram or wordmark outside the approved palette.
- Stretch, rotate, add shadows/outlines, or place the dark wordmark on a dark background.
- Recreate the wordmark in a different font.

---

## 2. Color Palette

### Core
| Role | Name | Hex | Notes |
|---|---|---|---|
| **Brand Green** | Green 700 | `#15803D` | Primary — logo tile, nav, key UI |
| **Action Green** | Green 500 | `#22C55E` | CTAs, buttons, links |
| Green Hover | Green 600 | `#16A34A` | Hover/active states |
| Accent Green | Green 400 | `#4ADE80` | Highlights, accent text |
| Soft Emerald | Emerald 300 | `#6EE7B7` | Body copy on dark backgrounds |

### Neutrals & support
| Role | Name | Hex | Notes |
|---|---|---|---|
| Dark Primary | Slate 950 | `#020617` | Hero/dark backgrounds, footer |
| Deep Dark | Green 950 | `#052E16` | Gradient pair with Slate 950 |
| Wordmark Dark | Slate 800 | `#1E293B` | "Halal" in wordmark |
| Heading | Slate 900 | `#0F172A` | Headings on light |
| Body / muted | Slate 600 / 400 | `#475569` / `#94A3B8` | Body & secondary text |
| Light BG | Slate 50 | `#F8FAFC` | Page/section backgrounds |
| **Warm Amber** | Amber 500 | `#F59E0B` | Accent only — tags, highlights |

**Signature gradient:** `#020617 → #052E16` (dark hero / social backgrounds).

---

## 3. Typography

| Use | Typeface | Weights |
|---|---|---|
| Display / headings / wordmark | **Outfit** | 700, 800, 900 |
| Body / UI / labels | **Inter** | 400, 500, 600, 700 |

- Headlines: Outfit Black (900), tight tracking (`-1` to `-2`).
- Body: Inter Regular/Medium, comfortable line-height.
- Currency is always **$ (USD)** — never ₦ or £.

Both are loaded via Google Fonts; Inter is the default `body` font and Outfit is the
`.font-display` class.

---

## 4. Voice & Tone

Warm, direct, and confident — never pushy. Faith-informed without being preachy.

**Always use:** "fresh, never frozen", "halal-certified", "Muslim butchers",
"ranch-raised", community-oriented language. Verbs: *start, order, join, get.*

**Never use:** "download", frozen-meat language, pork/alcohol references,
non-halal comparisons.

**Example:**
> Order whole goats, cows, or bulk chicken from local Houston farms. Split the
> cost with friends and family — each person pays only their share.

---

## 5. Iconography & Imagery

- **Icons:** Font Awesome 6 (solid), used sparingly and in brand green/slate.
- **Photography:** real meat, ranches, and Houston families. Warm, natural light.
  Fresh and clean — never raw/graphic or frozen-looking.
- **Shapes:** generous rounded corners (`rounded-xl` / 14–18px radius) and soft
  glow blobs in green/amber at low opacity on dark sections.

---

## 6. Hashtags

`#Halaliy` `#HalalHouston` `#HalalDelivery` `#HalalCertified` `#HalalMeat`
`#HoustonMuslims` `#FreshHalal` `#HalalFood` `#MuslimHouston` `#QurbaniHouston`
`#FreshNeverFrozen` `#RanchToTable`

---

*Brand assets live in [`public/`](public/). See also the visual one-pager:
`public/brand-sheet.png`.*
