# carsbid.lol Premium Redesign — Design Spec

**Date:** 2026-08-24
**Status:** Approved (general framework), ready for implementation planning

## Goal

Redesign carsbid.lol's entire visual and motion language from its current
red/mock-startup look to an "awwards-like, Apple-premium" feel — dark,
minimal, precise, with deliberate motion. This is a **pure visual/motion
reskin**: no changes to routing, i18n, data model, payment flow, voting
logic, or any other functional behavior. Every existing page and component
gets the same treatment in one pass.

Decisions below were validated with the user through a visual brainstorming
session (palette and logo shown as live-rendered HTML mockups, typography
shown as text comparisons) — see "Decisions" for what was picked and why.

## Decisions

### Color system — "Obsidian & Ice"

Dark-only (no light mode — matches the premium-app aesthetic, and the site
has never had a light mode toggle).

| Token | Value | Use |
|---|---|---|
| `--bg` | `#08090b` | Page background |
| `--surface` | `#111318` | Card/panel background |
| `--surface-2` | `#171a20` | Nested surface (e.g. odometer digit background) |
| `--border-soft` | `#1f232b` | Default hairline borders |
| `--border` | `#2a2f3a` | Emphasized borders (focus, hover) |
| `--text` | `#f4f6f8` | Primary text |
| `--text-muted` | `#b6bec8` | Secondary text |
| `--text-dim` | `#7b8492` | Tertiary/label text |
| `--accent` | `#7dd3fc` | Brand accent (replaces the old red `#e11d2e`) |
| `--accent-2` | `#38bdf8` | Accent hover/pressed state (slightly deeper blue) |
| `--accent-soft` | `#7dd3fc1a` (10% alpha) | Accent-tinted backgrounds (selected states) |
| `--good` | keep existing green | Success states (unchanged) |
| Gold/silver/bronze | keep existing | Podium ranks — universal convention, independent of brand accent |

Every existing usage of the red accent (`bg-accent`, `text-accent`,
`border-accent`, `text-accent-2`, gradients referencing it) gets re-pointed
to the new tokens via the existing CSS custom properties in
`src/app/globals.css` — component code doesn't need to change color
*values*, only the token definitions.

### Typography

Drop the `next/font/google` Inter + Space Grotesk setup. Replace with a
native system-font stack for both body and display text:

```css
font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
  "Helvetica Neue", Arial, sans-serif;
```

Rationale: this renders as real San Francisco on Apple devices (matching
the "Apple premium" brief) without embedding Apple's font files — SF Pro's
license does not permit third-party web embedding. On Windows/Android it
falls back to the platform's own native UI font, which keeps the
"OS-native, not a downloaded webfont" feel consistent, and there is zero
font-loading flash (no FOUT/FOIT) since nothing is fetched over the network.

JetBrains Mono (already installed, open license, self-hosted via
`next/font/google`) stays for numeric/label contexts: the `Odometer`
component, stat labels (ONLINE/VİZİT/OY/HASILAT), price tags.

Font-weight scale: keep using 500/600/700/800 as needed — system fonts
provide a full weight range on modern OSes so no change needed there.

### Logo — "C Monogram"

An open-arc "C" combined with a needle/pointer, rendered as inline SVG in
`--accent` (ice blue) on transparent background:

- Arc: ~270° open circle (`stroke`, ice blue, rounded caps)
- Needle: short line from center toward ~2 o'clock, capped with a small
  filled dot (represents a gauge/speedometer needle — ties into "ranking,
  live movement" without literally drawing a car)

Replaces the current car-silhouette icon in:
- `src/components/Header.tsx` (nav logo mark)
- `src/components/Footer.tsx` (if it repeats the mark — currently text-only,
  stays text-only unless the implementer wants to add the mark there too)
- `src/app/favicon.ico` — needs a new favicon generated from the same mark
  (multi-size .ico, produced from the SVG)

The `carsbid.lol` wordmark styling stays as-is structurally (bold
`carsbid` + accent-colored `.lol`), just re-colored to the new accent.

### Motion system (GSAP)

Built on the existing `@gsap/react` + `useGSAP` setup already in the
project (`src/lib/gsapConfig.ts`, `ScrollReveal.tsx`, `useMagnetic.ts`).
Extends rather than replaces:

1. **Hero headline reveal** — upgrade from the current per-line fade/slide
   (`[data-hero-line]`) to a word-level stagger with a clip-path mask
   (lines already clip via `overflow-hidden` on the wrapping `span`; add
   per-word spans and stagger the mask reveal instead of the whole line at
   once). Keep the existing sub/cta/stats stagger timeline structure.
2. **Scroll-triggered reveals** — `ScrollReveal.tsx` already does
   IntersectionObserver-driven GSAP fade/slide-up with stagger; keep the
   mechanism, tune easing/duration to feel closer to awwards-style
   (slightly slower, `power3.out`/`expo.out`, larger initial offset).
3. **Custom cursor** — new small component: a dot + trailing ring that
   follows the pointer (GSAP `quickTo` for smooth lag), scales up and
   inverts/tints on hover over links, buttons, and cards. Desktop-only
   (disabled on touch/coarse-pointer via `matchMedia`), and disabled under
   `prefers-reduced-motion`.
4. **Magnetic buttons** — `useMagnetic.ts` already implements this; keep,
   maybe extend to a couple more CTAs (e.g. "Devral" buttons on
   `PatronCard`) if it reads as premium rather than gimmicky.
5. **Reduced motion** — every new animation must check
   `window.matchMedia("(prefers-reduced-motion: reduce)")` and either skip
   or jump to end state, consistent with the existing pattern already used
   in `Hero.tsx`.

No new animation library is introduced (no Lenis/GSAP ScrollSmoother — the
latter is a paid Club GreenSock plugin and out of scope). Native CSS
`scroll-behavior: smooth` plus the above is sufficient.

### Remotion hero background video

A new Remotion composition (alongside the existing promo-video composition
in `remotion/`) that renders an **abstract "data pulse" animation**, not a
literal car render:

- Base layer: the existing `bg-grid-fade` grid pattern, animated
- At grid-line intersections, soft ice-blue "pulse" glows fire at
  randomized (seeded, deterministic) intervals and fade out — simulates
  live site activity without being literal
- 2–3 slow diagonal light-trail sweeps cross the frame over the loop
  duration
- 1920×1080, ~10 second seamless loop (last frame blends into first),
  rendered to MP4 (H.264, muted, no audio track needed)
- A static PNG poster frame is also exported (first frame) for the
  `<video poster>` attribute and as the fallback shown under
  `prefers-reduced-motion` or on slow connections (`<video>` simply isn't
  mounted; the poster's underlying gradient/grid CSS already exists as a
  fallback background)

Placed in `Hero.tsx` as an absolutely-positioned, low-opacity (~15-25%)
background video behind the existing `bg-grid-fade` div, with a dark
gradient overlay on top to keep headline/CTA contrast/legibility (WCAG AA
against the ice-blue accent and white text).

Build-time artifact: rendered once via `remotion render` (already scripted
as `npm run remotion:render` for the promo video — a second script/
composition id is added for this hero loop) and committed as a static
asset under `public/`, **not** rendered live in the browser. Remotion stays
a dev-time tool, matching the earlier decision that the live site never
runs Remotion itself.

## Component-by-component scope

All of the following get re-styled to the new tokens/typography and, where
noted, new motion. No prop/behavior changes.

- `Header.tsx` — new logo mark, re-colored nav, glass/blur backdrop tuned
  for the darker background
- `Footer.tsx` — re-colored, wordmark update
- `Hero.tsx` — headline word-stagger reveal, Remotion video background,
  re-colored CTAs
- `StatsBar.tsx` / `Odometer.tsx` — re-colored digits/accent, mono type
  confirmed
- `ShowcaseGrid.tsx` — hover lift/glow tuned to new accent
- `PatronPodium.tsx` — re-colored (podium medal colors unchanged)
- `PatronCarousel.tsx`, `RankingSection.tsx`, `RankingRow.tsx`,
  `SegmentTabs.tsx` — re-colored, hover states tuned
- `PatronCard.tsx`, `BidModal.tsx` — re-colored, form focus states use new
  accent
- `VoteButton.tsx`, `LanguageSwitcher.tsx` — re-colored
- `CarDetailClient.tsx` — re-colored, consistent with ranking page
- `[locale]/hakkinda/page.tsx`, `[locale]/kurallar/page.tsx`,
  `[locale]/patronlar/page.tsx` — re-colored, no structural change
- New: `CustomCursor.tsx` — mounted once in `[locale]/layout.tsx`
- New: Remotion composition file under `remotion/` for the hero loop

## Out of scope

- Any change to routing, i18n message keys/content, Supabase schema,
  Lemon Squeezy integration, voting/stats logic
- Light mode
- Literal 3D/photographic car renders in the Hero
- GSAP ScrollSmoother / Lenis smooth-scroll libraries
- Redesigning the car photo assets themselves (`CarPhoto.tsx` sourcing
  stays as-is)

## Testing / verification plan

- Visual pass on desktop + mobile viewport for every page listed above, in
  all three locales (tr/en/es), light-touch since there's no light/dark
  toggle to cross-test
- `prefers-reduced-motion: reduce` verified to disable: hero video, custom
  cursor, word-stagger reveal (jumps to end state), scroll reveals (jump to
  end state)
- Lighthouse/perf sanity check on the Hero video (file size, whether it
  delays LCP — poster frame must paint immediately, video can load async)
- `npm run build` must stay clean (it already is, from the i18n work)
