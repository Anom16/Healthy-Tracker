---
name: GlowSculpt Vitality
colors:
  surface: '#faf8ff'
  surface-dim: '#d2d9f4'
  surface-bright: '#faf8ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f3ff'
  surface-container: '#eaedff'
  surface-container-high: '#e2e7ff'
  surface-container-highest: '#dae2fd'
  on-surface: '#131b2e'
  on-surface-variant: '#3c4a42'
  inverse-surface: '#283044'
  inverse-on-surface: '#eef0ff'
  outline: '#6c7a71'
  outline-variant: '#bbcabf'
  surface-tint: '#006c49'
  primary: '#006c49'
  on-primary: '#ffffff'
  primary-container: '#10b981'
  on-primary-container: '#00422b'
  inverse-primary: '#4edea3'
  secondary: '#a43073'
  on-secondary: '#ffffff'
  secondary-container: '#fc79bd'
  on-secondary-container: '#76014e'
  tertiary: '#00668a'
  on-tertiary: '#ffffff'
  tertiary-container: '#19aee8'
  on-tertiary-container: '#003e55'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#6ffbbe'
  primary-fixed-dim: '#4edea3'
  on-primary-fixed: '#002113'
  on-primary-fixed-variant: '#005236'
  secondary-fixed: '#ffd8e7'
  secondary-fixed-dim: '#ffafd3'
  on-secondary-fixed: '#3d0026'
  on-secondary-fixed-variant: '#85145a'
  tertiary-fixed: '#c4e7ff'
  tertiary-fixed-dim: '#7bd0ff'
  on-tertiary-fixed: '#001e2c'
  on-tertiary-fixed-variant: '#004c69'
  background: '#faf8ff'
  on-background: '#131b2e'
  surface-variant: '#dae2fd'
typography:
  headline-xl:
    fontFamily: Plus Jakarta Sans
    fontSize: 36px
    fontWeight: '800'
    lineHeight: 44px
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 36px
  headline-lg-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 22px
    fontWeight: '700'
    lineHeight: 30px
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 18px
    fontWeight: '700'
    lineHeight: 26px
  headline-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 22px
  body-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 15px
    fontWeight: '400'
    lineHeight: 22px
  body-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
  body-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
  label-lg:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '600'
    lineHeight: 18px
  label-md:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '600'
    lineHeight: 14px
  label-sm:
    fontFamily: Inter
    fontSize: 10px
    fontWeight: '700'
    lineHeight: 12px
  stat-counter:
    fontFamily: Plus Jakarta Sans
    fontSize: 20px
    fontWeight: '800'
    lineHeight: 24px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 0.75rem
  margin: 1rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 0.875rem
  space-lg: 1.25rem
  space-xl: 1.75rem
---

## Brand & Style

This design system embodies a serene, restorative, and uplifting aesthetic tailored for modern health, anti-aging, skincare, and habit mastery. Drawing inspiration from clean clinical skincare rituals, facial gua sha routines, and conscious holistic vitality, the interface emphasizes gentle discipline over aggressive gamification.

The core visual style is a hybrid of **Soft Organic Minimalism** and **Tactile Glass-Air Elevation**:
- **Tone:** Mindful, encouraging, luxurious yet accessible, rejuvenating, and luminous.
- **Audience:** Health-conscious individuals focused on anti-glycation (sugar cessation), radiant skin barrier maintenance, hydration optimization, smoking cessation, and intentional longevity rituals.
- **Aesthetic Principles:** Ample breathing room, soft tinted surfaces, pastel micro-accents, pill-shaped tactile controls, and delicate borders that feel like polished jade stones and skincare glass bottles.

## Colors

The palette balances clinical cleanliness with warm vitality. The base canvas is grounded in soft cloud and warm alabaster shades rather than harsh digital white.

- **Primary (`#10B981` / Sage & Emerald Glow):** Signifies vitality, successful habit completion, gua sha self-care rituals, clean habits, and cellular regeneration.
- **Secondary (`#F472B6` / Blush Coral & Rose Petal):** Evokes skin blood flow, craving management ("Craving SOS"), and delicate anti-glycation milestones.
- **Tertiary (`#38BDF8` / Hydration Sky):** Dedicated to water intake tracking, electrolytes, freshness, and optimal skin hydration.
- **Neutral (`#0F172A` / Obsidian Ink):** Provides deep, high-legibility typographic contrast against soft milky backdrops without feeling stark.
- **Surface & Canvas Foundations:**
  - Background canvas: `#F8FAFC` to `#FBFBFA` soft cream tint.
  - Surface cards: Pure `#FFFFFF` paired with translucent border overlays (`rgba(226, 232, 240, 0.8)`).
  - Habit specific tints: Soft amber peach (`#FFF7ED` / `#FB923C`) for sugar reduction and citrus vitamin tracking.

## Typography

The type scale combines **Plus Jakarta Sans** for warm geometric authority with **Inter** for dense statistical counters, sub-badges, and metric micro-copy.

- **Headlines:** Set in tight-tracking bold weights (`-0.02em`) to provide structural impact while retaining organic curvature.
- **Habit Metric Counters (`stat-counter`):** Rendered in high-weight Plus Jakarta Sans to make values such as `0g`, `0ml`, and `0 btg` immediately readable during quick check-ins.
- **Micro-labels and Status Tags:** Set in uppercase or semibold Inter with neutral letter-spacing (`+0.04em`) to ensure glanceable clarity across small tracker tiles.

## Layout & Spacing

The layout follows a mobile-first column-based containment model focused on ergonomic single-hand usage on portable devices and balanced centered framing on wide viewports.

- **Form Factors & Breakpoints:**
  - **Mobile (< 640px):** Single-column layout. Max container width 480px centered. Margin is `1rem` (16px), and card padding defaults to `space-md` (14px) to maximize screen real estate.
  - **Tablet (640px – 1024px):** 2-column modular card grids with `gutter` of `1rem` and dynamic outer margin of `2rem`.
  - **Desktop (> 1024px):** Fixed-width wellness dashboard view (`720px` to `960px` max width) with centered focus, preserving the intimate feel of a personal habit log.
- **Rhythm & Stacking:** Vertical flow relies on consistent gaps of `12px` to `16px` between distinct tracker modules, avoiding visual crowding while maintaining clear hierarchy.

## Elevation & Depth

This design system uses delicate ambient lighting combined with crisp perimeter borders, mimicking sculpted quartz, ceramics, and smooth polished stones.

- **Level 0 (Flat / Canvas):** Neutral background `#F8FAFC` to warm bone `#FBFBFA`.
- **Level 1 (Habit Cards & Metrics):** `#FFFFFF` surfaces with a 1px border (`#E2E8F0` or `#F1F5F9`) paired with a diffused ambient shadow: `0 4px 16px -2px rgba(15, 23, 42, 0.04), 0 2px 6px -1px rgba(15, 23, 42, 0.02)`.
- **Level 2 (Active Action Modules & Modals):** Tinted surfaces (e.g. pale mint `#ECFDF5`, pale rose `#FFF1F2`) with subtle saturated border glows (`rgba(16, 185, 129, 0.15)` or `rgba(244, 114, 182, 0.20)`) and floating shadows: `0 8px 24px -4px rgba(15, 23, 42, 0.06)`.
- **Level 3 (Floating Bars / Sticky Actions):** Full background blur (`backdrop-filter: blur(12px)`) with `rgba(255, 255, 255, 0.85)` fill and subtle top rim highlights.

## Shapes

Curves reflect the flowing motion of gua sha tools and organic hydration drops:
- **Cards & Habit Blocks:** Defined by `rounded-xl` (1.5rem / 24px) for approachable warmth.
- **Metric Tiles & Action Chips:** Defined by `rounded-lg` (1rem / 16px) offering ergonomic finger targets.
- **Pills, Badges & Buttons:** Fully curved (9999px pill shapes) for interactive and status indicators, delivering tactile appeal.
- **Progress Trackers:** Rounded inner and outer track caps to retain the pill metaphor across all stages of habit completion.

## Components

### 1. Habit Tracking Card
- **Structure:** White card (`#FFFFFF`) with 20px padding, rounded-2xl (24px) borders, hairline outline in `#F1F5F9`.
- **Header:** Leading circular emoji/icon container (`36x36px`, rounded-full with habit-specific pastel tint), habit title in `headline-sm`, target baseline in `body-sm` (`#64748B`), and an inline action pill button on the right.
- **Progress Track:** 8px high progress bar with `#F1F5F9` background track and pill-shaped animated progress fill in matching accent color (Mint, Sky Blue, or Coral).
- **Footer Data:** Split label with current intake vs. remaining allowance in `body-xs` semibold.

### 2. Metric Mini-Tiles (Summary Row)
- **Structure:** 4-column equal grid of compact vertical cards.
- **Styling:** Subtle gray tint background (`#F8FAFC`), rounded-xl (16px), 1px solid `#EEF2F6`.
- **Content Flow:** Icon at top + micro label, bold stat counter (`stat-counter`) in the center, and a micro pill tag at the bottom (e.g. "Bebas Gula" in `#D1FAE5` with `#065F46` text).

### 3. Action Badges & Quick SOS Buttons
- **SOS Button (Craving / Urge Intervention):** Delicate blush background (`#FFF1F2`), soft coral border (`#FECDD3`), bold red-coral icon badge, and dual-line prompt ("Craving SOS / Tahan manis").
- **Gua Sha Ritual Button:** Pale jade background (`#ECFDF5`), emerald border (`#A7F3D0`), starburst icon, dual-line prompt ("Pijat Gua Sha / Rahang tirus").
- **Behavior:** Subtle spring compression on active press (`transform: scale(0.98)`).

### 4. Interactive Action Buttons ("+ Catat" / "+ Tambah")
- **Pill Button:** Fully rounded pill structure with lightweight feel.
- **Variants:**
  - *Standard Habit Action:* Background transparent or soft `#F8FAFC`, border 1.5px solid `#E2E8F0`, text `#1E293B` in `label-md`.
  - *Hydration Quick Add:* Tinted `#E0F2FE` background, text `#0284C7`, hover/active `#BAE6FD`.
- **Size:** Height 32px, padding horizontal 14px, minimal icon + label gap of 4px.

### 5. Streak & Milestones Pill
- **Style:** Pill-shaped badge featuring warm amber-to-peach tint (`#FFFBEB`), warm gold border (`#FDE68A`), fire/clock emoji or icon, displaying continuous days of consistency in bold `label-sm`.
