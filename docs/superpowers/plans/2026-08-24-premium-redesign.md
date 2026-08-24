# carsbid.lol Premium Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Re-skin carsbid.lol's entire visual and motion language from the current red startup look to a dark "Obsidian & Ice" Apple-premium/awwards feel — new color tokens, system-font typography, a new logo mark, richer GSAP motion, and an abstract Remotion-rendered Hero background video. No functional/behavioral changes anywhere.

**Architecture:** The project already centralizes all color as CSS custom properties in one file (`src/app/globals.css`) consumed via Tailwind v4's `@theme inline`, and every component references them through Tailwind utility classes (`bg-accent`, `text-accent-2`, etc.) rather than hardcoded hex — confirmed by grep, only 2 files contain literal color values tied to the old red. This means the color reskin is almost entirely a token-file edit; the remaining work is additive (new Logo/CustomCursor components, a new Remotion composition, motion tuning) rather than a rewrite of existing components.

**Tech Stack:** Next.js 16 (App Router), Tailwind CSS v4, GSAP + `@gsap/react` (already installed), Remotion + `@remotion/cli` (already installed), next-intl (already installed). No new dependencies are needed for this plan.

## Global Constraints

- This project has **no test runner configured** (confirmed: no jest/vitest/playwright in `package.json`). Per the writing-plans skill this would normally call for TDD red/green steps — that doesn't apply to pure CSS/visual work in a codebase with no test infrastructure, and adding a test framework is out of scope (YAGNI — not requested, not needed for a styling change). Each task's steps substitute **verification steps** (`npx tsc --noEmit`, `npm run lint`, `npm run build`, and a concrete browser check) in place of automated test steps.
- Every new animation must respect `window.matchMedia("(prefers-reduced-motion: reduce)")` — skip straight to the end state, consistent with the existing pattern in `src/components/Hero.tsx` and `src/components/ScrollReveal.tsx`.
- No change to routing, i18n message content/keys, Supabase schema, Lemon Squeezy integration, or voting/stats logic (per spec "Out of scope").
- Color values below are exact — copy them verbatim, do not approximate.
- Design spec this plan implements: `docs/superpowers/specs/2026-08-24-premium-redesign-design.md`

---

## Task 1: Color tokens — Obsidian & Ice

**Files:**
- Modify: `src/app/globals.css:4-18` (root color tokens), `src/app/globals.css:131` (`.bg-grid-fade` radial gradient)
- Modify: `src/components/Hero.tsx:82` (hardcoded shadow color)

**Interfaces:**
- Consumes: nothing (pure CSS values)
- Produces: `--color-accent` etc. remain the same custom-property *names* consumed by every other component via Tailwind utilities (`bg-accent`, `text-accent`, `border-accent`, `text-accent-2`, `bg-accent-soft`) — no other file needs to change for the color swap to propagate.

- [ ] **Step 1: Replace the root token block**

In `src/app/globals.css`, replace lines 4–18:

```css
:root {
  --color-bg: #08090b;
  --color-bg-soft: #0d0f13;
  --color-surface: #111318;
  --color-surface-2: #171a20;
  --color-border: #2a2f3a;
  --color-border-soft: #1f232b;
  --color-text: #f4f6f8;
  --color-text-muted: #b6bec8;
  --color-text-dim: #7b8492;
  --color-accent: #7dd3fc;
  --color-accent-2: #38bdf8;
  --color-accent-soft: #7dd3fc1a;
  --color-gold: #d4af37;
  --color-good: #34d399;
}
```

- [ ] **Step 2: Update the grid-fade radial gradient's tint color**

In `src/app/globals.css:131`, the `.bg-grid-fade` rule currently starts its radial gradient with `rgba(225, 29, 46, 0.14)` (the old red, `#e11d2e` in rgb). Replace with the new accent's rgb equivalent of `#7dd3fc`:

```css
.bg-grid-fade {
  background-image:
    radial-gradient(60% 50% at 50% 0%, rgba(125, 211, 252, 0.14), transparent 70%),
    linear-gradient(to bottom, transparent, var(--color-bg) 92%),
    repeating-linear-gradient(90deg, rgba(255, 255, 255, 0.035) 0 1px, transparent 1px 64px),
    repeating-linear-gradient(0deg, rgba(255, 255, 255, 0.035) 0 1px, transparent 1px 64px);
}
```

- [ ] **Step 3: Update the hardcoded shadow color in Hero.tsx**

In `src/components/Hero.tsx:82`, the "Oy Vermeye Başla" button has a hardcoded red glow shadow. Replace:

```tsx
className="rounded-full bg-accent px-6 py-3 text-sm font-semibold text-white shadow-[0_8px_30px_-8px_rgba(125,211,252,0.45)] transition-colors hover:bg-accent-2"
```

- [ ] **Step 4: Verify no old color values remain**

Run:
```bash
grep -rn "#e11d2e\|#ff5a4e\|rgba(225" src
```
Expected: no output (zero matches).

- [ ] **Step 5: Build and visual check**

Run: `npm run build` — expect a clean build (same page/route list as before, no new errors).

Start the dev server and open the homepage in the browser tool. Confirm: background reads as near-black, the "Oy Vermeye Başla" button and "Araba Modeli" headline word are ice-blue (not red), the podium medal colors (gold/silver/bronze on `/patronlar` and the homepage podium section) are unchanged.

- [ ] **Step 6: Commit**

```bash
git add src/app/globals.css src/components/Hero.tsx
git commit -m "style: swap color tokens from red to Obsidian & Ice palette"
```

---

## Task 2: Typography — system font stack

**Files:**
- Modify: `src/app/[locale]/layout.tsx:1-23` (remove Inter/Space_Grotesk, keep JetBrains Mono)
- Modify: `src/app/globals.css:4-18` (add `--font-sans`/`--font-display` as literal system stacks)

**Interfaces:**
- Consumes: nothing new
- Produces: `--font-sans` / `--font-display` custom properties remain the names every component's `font-display` / default body text relies on (via `.font-display` class in `globals.css:97-99` and the `body` rule at `globals.css:47`) — no component file needs to change.

- [ ] **Step 1: Remove Inter and Space_Grotesk from the locale layout**

In `src/app/[locale]/layout.tsx`, replace the font import and the `bodyFont`/`displayFont` declarations:

```tsx
import type { Metadata } from "next";
import { JetBrains_Mono } from "next/font/google";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import "../globals.css";
import { routing } from "@/i18n/routing";
import { CarsProvider } from "@/lib/store";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { CustomCursor } from "@/components/CustomCursor";

const monoFont = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});
```

(The `CustomCursor` import is added now so Task 4 only needs to add the component file and mount it below — leave the JSX mount for Task 4's step so this task stays focused on fonts. Do not add `<CustomCursor />` yet in this task.)

- [ ] **Step 2: Update the `<html>` className to drop the removed font variables**

Still in `src/app/[locale]/layout.tsx`, find the `<html>` tag (currently `className={\`${bodyFont.variable} ${displayFont.variable} ${monoFont.variable} h-full antialiased\`}`) and replace with:

```tsx
    <html
      lang={locale}
      className={`${monoFont.variable} h-full antialiased`}
    >
```

- [ ] **Step 3: Add the system font stack as CSS tokens**

In `src/app/globals.css`, inside the `:root` block written in Task 1, add two more lines (after `--color-good`):

```css
  --font-sans: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  --font-display: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
```

- [ ] **Step 4: Type-check and build**

Run: `npx tsc --noEmit` — expect no errors (confirms `bodyFont`/`displayFont` aren't referenced anywhere else).

Run: `npm run build` — expect a clean build.

- [ ] **Step 5: Visual check**

Open the homepage in the browser tool. Confirm headings and body text render in the OS's native UI font (no visible font-swap flash on load), and numeric stats (ONLINE/ZİYARET/OY/HASILAT and the odometer digits) still render in the monospace font.

- [ ] **Step 6: Commit**

```bash
git add "src/app/[locale]/layout.tsx" src/app/globals.css
git commit -m "style: replace Inter/Space Grotesk with native system font stack"
```

---

## Task 3: Logo — C Monogram

**Files:**
- Create: `src/components/Logo.tsx`
- Modify: `src/components/Header.tsx:46-58` (swap the inline car SVG for `<Logo />`)
- Create: `src/app/favicon.ico` (replace existing)

**Interfaces:**
- Produces: `Logo({ className }: { className?: string })` — a React component rendering the monogram SVG with `stroke`/`fill` set to `currentColor`, so the wrapping element's text color controls its color.

- [ ] **Step 1: Create the Logo component**

Create `src/components/Logo.tsx`:

```tsx
export function Logo({ className = "h-4.5 w-4.5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 44 44" fill="none" className={className} aria-hidden>
      <path
        d="M30 14.5A13 13 0 1 0 30 29.5"
        stroke="currentColor"
        strokeWidth="3.2"
        strokeLinecap="round"
      />
      <circle cx="30.5" cy="22" r="2.6" fill="currentColor" />
    </svg>
  );
}
```

- [ ] **Step 2: Use it in the Header**

In `src/components/Header.tsx`, replace lines 46–58 (the `<span className="grid h-8 w-8 ... bg-accent text-white">` wrapper containing the car-shaped `<svg>`) with:

```tsx
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-accent text-white">
            <Logo />
          </span>
```

Add the import at the top of `src/components/Header.tsx` alongside the other component imports:

```tsx
import { Logo } from "@/components/Logo";
```

- [ ] **Step 3: Generate a matching favicon**

The favicon needs to be regenerated from the new mark so the browser tab matches the new brand. Render the SVG to a PNG and convert to `.ico` using a local script (no new dependency — Node's `child_process` isn't needed; use an online-free approach isn't available offline, so instead hand-roll a minimal multi-size ICO is out of scope for a single agent step). Use the `resvg`/`sharp`-free path already available via the `remotion` toolchain is overkill — instead, do this with a plain Node script using the `canvas`-free approach:

Create a temporary SVG file matching the Logo, colored for a dark tab background (ice blue on transparent), and use `npx` to invoke an already-available converter. Since no ICO/PNG conversion tool is currently installed, add this as a one-off dev step rather than a code file:

```bash
cat > /tmp/logo-favicon.svg << 'EOF'
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 44 44" fill="none">
  <rect width="44" height="44" rx="10" fill="#08090b"/>
  <path d="M30 14.5A13 13 0 1 0 30 29.5" stroke="#7dd3fc" stroke-width="3.2" stroke-linecap="round"/>
  <circle cx="30.5" cy="22" r="2.6" fill="#7dd3fc"/>
</svg>
EOF
npx --yes svg2png-cli /tmp/logo-favicon.svg --output=/tmp/logo-favicon.png --width=64 --height=64
npx --yes png-to-ico /tmp/logo-favicon.png > src/app/favicon.ico
```

If either `npx` package fails to resolve (network-restricted environment), skip this step and leave the existing `favicon.ico` in place — flag it in the task's commit message as a follow-up (`# TODO favicon` is not acceptable in source, so instead note it in the PR/commit description, not in code).

- [ ] **Step 4: Build and visual check**

Run: `npm run build` — expect a clean build.

Open the homepage in the browser tool. Confirm the header logo badge now shows the C-monogram mark (an open ring with a needle/dot) instead of the car silhouette, in the accent-colored square badge. Check the browser tab icon if the favicon step succeeded.

- [ ] **Step 5: Commit**

```bash
git add src/components/Logo.tsx src/components/Header.tsx src/app/favicon.ico
git commit -m "feat: replace car-icon logo with C Monogram mark"
```

---

## Task 4: Custom cursor

**Files:**
- Create: `src/components/CustomCursor.tsx`
- Modify: `src/app/[locale]/layout.tsx` (mount `<CustomCursor />`)

**Interfaces:**
- Consumes: `gsap` from `@/lib/gsapConfig` (already used by `Hero.tsx`/`ScrollReveal.tsx` — same import path)
- Produces: `CustomCursor()` — a client component with no props, self-contained, renders `null` when disabled (touch devices or `prefers-reduced-motion: reduce`).

- [ ] **Step 1: Create the CustomCursor component**

Create `src/components/CustomCursor.tsx`:

```tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "@/lib/gsapConfig";

export function CustomCursor() {
  const [active, setActive] = useState(false);
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const fine = window.matchMedia("(pointer: fine)").matches;
    if (!reduced && fine) setActive(true);
  }, []);

  useEffect(() => {
    if (!active || !dotRef.current || !ringRef.current) return;

    const dot = dotRef.current;
    const ring = ringRef.current;
    const prevCursor = document.body.style.cursor;
    document.body.style.cursor = "none";

    const moveDotX = gsap.quickTo(dot, "x", { duration: 0.1, ease: "power3.out" });
    const moveDotY = gsap.quickTo(dot, "y", { duration: 0.1, ease: "power3.out" });
    const moveRingX = gsap.quickTo(ring, "x", { duration: 0.35, ease: "power3.out" });
    const moveRingY = gsap.quickTo(ring, "y", { duration: 0.35, ease: "power3.out" });

    function onMove(e: MouseEvent) {
      moveDotX(e.clientX);
      moveDotY(e.clientY);
      moveRingX(e.clientX);
      moveRingY(e.clientY);
    }

    function onOver(e: MouseEvent) {
      const target = e.target as HTMLElement;
      const interactive = Boolean(target.closest("a, button, [role='button'], input, textarea"));
      gsap.to(ring, { scale: interactive ? 1.8 : 1, duration: 0.25, ease: "power3.out" });
    }

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseover", onOver);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseover", onOver);
      document.body.style.cursor = prevCursor;
    };
  }, [active]);

  if (!active) return null;

  return (
    <>
      <div
        ref={dotRef}
        className="pointer-events-none fixed left-0 top-0 z-[100] h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent"
      />
      <div
        ref={ringRef}
        className="pointer-events-none fixed left-0 top-0 z-[100] h-8 w-8 -translate-x-1/2 -translate-y-1/2 rounded-full border border-accent"
      />
    </>
  );
}
```

- [ ] **Step 2: Mount it in the locale layout**

In `src/app/[locale]/layout.tsx`, inside the `<body>`, add `<CustomCursor />` as a sibling before `<CarsProvider>` (it doesn't need any app state):

```tsx
      <body className="min-h-full flex flex-col bg-bg text-text">
        <CustomCursor />
        <NextIntlClientProvider>
```

(The import was already added in Task 2 Step 1.)

- [ ] **Step 3: Type-check and build**

Run: `npx tsc --noEmit` — expect no errors.
Run: `npm run build` — expect a clean build.

- [ ] **Step 4: Manual verification in the browser tool**

Open the homepage with the browser tool at desktop viewport size. Move the mouse (via the `computer` tool's `mouse_move`/hover if available, or click-drag) and confirm a small dot + trailing ring follow the cursor, and the ring visibly grows when hovering over a link or button (e.g. "Oy Vermeye Başla"). Then use `resize_window` to switch to the mobile preset and confirm no cursor elements are injected (touch device — `pointer: fine` is false).

- [ ] **Step 5: Commit**

```bash
git add src/components/CustomCursor.tsx "src/app/[locale]/layout.tsx"
git commit -m "feat: add custom cursor for desktop pointer devices"
```

---

## Task 5: Hero headline word-stagger reveal

**Files:**
- Modify: `src/components/Hero.tsx` (full file — headline markup and GSAP timeline)

**Interfaces:**
- Consumes: `t("titleLine1")`, `t("titleLine2")`, `t("titleLine3")` (existing `next-intl` keys, unchanged)
- Produces: nothing consumed elsewhere — `Hero.tsx` is a leaf component

- [ ] **Step 1: Replace the headline markup with a word-reveal helper**

In `src/components/Hero.tsx`, add a small local component above `Hero` and replace the three `<span data-hero-line>` blocks. Full replacement of the file:

```tsx
"use client";

import { useRef } from "react";
import { useTranslations } from "next-intl";
import { useGSAP } from "@gsap/react";
import { gsap } from "@/lib/gsapConfig";
import { StatsBar } from "@/components/StatsBar";
import { useMagnetic } from "@/lib/useMagnetic";
import { Link } from "@/i18n/navigation";

function RevealWords({ text, className = "" }: { text: string; className?: string }) {
  const words = text.split(" ");
  return (
    <span className={`block ${className}`}>
      {words.map((word, i) => (
        <span key={i} className="inline-block overflow-hidden align-top pb-[0.08em]">
          <span data-hero-word className="inline-block">
            {word}
            {i < words.length - 1 ? " " : ""}
          </span>
        </span>
      ))}
    </span>
  );
}

export function Hero() {
  const root = useRef<HTMLDivElement>(null);
  const ctaRef = useMagnetic<HTMLAnchorElement>(0.3);
  const t = useTranslations("hero");

  useGSAP(
    () => {
      const reduced =
        window.matchMedia("(prefers-reduced-motion: reduce)").matches || document.hidden;
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
      if (reduced) {
        gsap.set(
          "[data-hero-word], [data-hero-sub], [data-hero-cta], [data-hero-stats]",
          { opacity: 1, y: 0, yPercent: 0, scale: 1 }
        );
        return;
      }
      tl.fromTo(
        "[data-hero-word]",
        { yPercent: 110 },
        { yPercent: 0, duration: 0.9, stagger: 0.035, ease: "expo.out" }
      )
        .fromTo(
          "[data-hero-sub]",
          { opacity: 0, y: 16 },
          { opacity: 1, y: 0, duration: 0.6 },
          "-=0.5"
        )
        .fromTo(
          "[data-hero-cta]",
          { opacity: 0, y: 16 },
          { opacity: 1, y: 0, duration: 0.5, stagger: 0.08 },
          "-=0.35"
        )
        .fromTo(
          "[data-hero-stats]",
          { opacity: 0, y: 20, scale: 0.98 },
          { opacity: 1, y: 0, scale: 1, duration: 0.7 },
          "-=0.25"
        );
    },
    { scope: root }
  );

  return (
    <section ref={root} className="relative overflow-hidden bg-grid-fade">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 pt-16 sm:pt-24 pb-12 text-center">
        <h1 className="text-balance font-display text-4xl sm:text-6xl md:text-7xl font-bold tracking-tight leading-[1.04]">
          <RevealWords text={t("titleLine1")} />
          <RevealWords text={t("titleLine2")} className="text-accent" />
          <RevealWords text={t("titleLine3")} />
        </h1>

        <p
          data-hero-sub
          className="mx-auto mt-6 max-w-xl text-balance text-base sm:text-lg text-text-muted"
        >
          {t("subtitle")}
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <a
            ref={ctaRef}
            data-hero-cta
            href="#siralama"
            className="rounded-full bg-accent px-6 py-3 text-sm font-semibold text-white shadow-[0_8px_30px_-8px_rgba(125,211,252,0.45)] transition-colors hover:bg-accent-2"
          >
            {t("ctaVote")}
          </a>
          <Link
            data-hero-cta
            href="/patronlar"
            className="rounded-full border border-border px-6 py-3 text-sm font-semibold text-text-muted transition-colors hover:border-gold hover:text-gold"
          >
            {t("ctaPatron")}
          </Link>
        </div>

        <div data-hero-stats className="mt-12 flex justify-center">
          <StatsBar />
        </div>
      </div>
    </section>
  );
}
```

(Note: Task 1 Step 3's shadow color change is already folded into this full-file replacement — if Task 1 already landed, this is a no-op for that line.)

- [ ] **Step 2: Type-check and build**

Run: `npx tsc --noEmit` — expect no errors.
Run: `npm run build` — expect a clean build.

- [ ] **Step 3: Visual check**

Open the homepage in the browser tool and reload. Confirm the headline words rise into place word-by-word (not the whole line fading as one block), the middle line ("Araba Modeli" / "Turkey's Most Popular" / etc. depending on locale) is ice-blue, and layout/wrapping still looks correct at both desktop and mobile widths (use `resize_window`).

Also verify `prefers-reduced-motion`: use `resize_window` with `colorScheme` unaffected — instead set the emulation via the browser tool if available, or confirm code-review-only that the `reduced` branch sets `yPercent: 0` on `[data-hero-word]` (already covered by Step 1's code).

- [ ] **Step 4: Commit**

```bash
git add src/components/Hero.tsx
git commit -m "feat: word-stagger reveal for Hero headline"
```

---

## Task 6: Tune ScrollReveal easing for a slower, more premium feel

**Files:**
- Modify: `src/components/ScrollReveal.tsx:36-37`

**Interfaces:**
- Consumes: nothing new
- Produces: same `ScrollReveal({ children, className, y, stagger })` signature — no caller changes needed (used by `ShowcaseGrid.tsx`, `PatronPodium.tsx`, `PatronCarousel.tsx`, `patronlar/page.tsx`)

- [ ] **Step 1: Increase duration and switch easing**

In `src/components/ScrollReveal.tsx`, lines 36–37 currently read:

```tsx
          duration: 0.7,
          ease: "power3.out",
```

Replace with:

```tsx
          duration: 0.9,
          ease: "expo.out",
```

- [ ] **Step 2: Increase the default vertical offset for more travel**

Still in `src/components/ScrollReveal.tsx`, line 10, change the default prop from `y = 22` to `y = 32` — a larger starting offset reads as more deliberate at the slower duration:

```tsx
  y = 32,
```

- [ ] **Step 3: Build and visual check**

Run: `npm run build` — expect a clean build.

Open the homepage in the browser tool, scroll down through "Canlı Vitrin" (ShowcaseGrid) and "En Yüksek Teklifi Verenler" (PatronPodium). Confirm cards animate in with a noticeably slower, smoother rise than before (compare by eye — no numeric assertion needed).

- [ ] **Step 4: Commit**

```bash
git add src/components/ScrollReveal.tsx
git commit -m "style: slow down ScrollReveal easing for a more premium feel"
```

---

## Task 7: Remotion HeroPulse composition

**Files:**
- Create: `remotion/HeroPulse.tsx`
- Modify: `remotion/Root.tsx` (register the new composition)
- Modify: `package.json` (add render/still scripts)

**Interfaces:**
- Produces: a Remotion composition registered under id `"HeroPulse"`, 1920×1080, 30fps, 300 frames (10s), which Task 8 renders to `public/hero-pulse.mp4` and `public/hero-pulse-poster.png`.

- [ ] **Step 1: Write the HeroPulse composition**

Create `remotion/HeroPulse.tsx`:

```tsx
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";

const BG = "#08090b";
const ACCENT = "#7dd3fc";
const CELL = 64;
const PULSE_PERIODS = [60, 90, 150, 180]; // frame counts, all divisors of the 300-frame loop

function hash(n: number): number {
  const x = Math.sin(n * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

function GridPulses({
  width,
  height,
  frame,
}: {
  width: number;
  height: number;
  frame: number;
}) {
  const cols = Math.ceil(width / CELL) + 1;
  const rows = Math.ceil(height / CELL) + 1;
  const nodes: React.ReactNode[] = [];

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const id = row * cols + col;
      if (hash(id) > 0.08) continue; // sparse — ~8% of intersections pulse

      const period = PULSE_PERIODS[Math.floor(hash(id + 100) * PULSE_PERIODS.length)];
      const offset = Math.floor(hash(id + 200) * period);
      const local = ((frame + offset) % period) / period;
      const pulse = Math.sin(local * Math.PI); // 0 -> 1 -> 0, seamless per-period loop
      const opacity = interpolate(pulse, [0, 1], [0, 0.85]);
      const scale = interpolate(pulse, [0, 1], [0.4, 1.6]);

      nodes.push(
        <circle key={id} cx={col * CELL} cy={row * CELL} r={3 * scale} fill={ACCENT} opacity={opacity} />
      );
    }
  }

  return (
    <svg width={width} height={height} style={{ position: "absolute", inset: 0 }}>
      {nodes}
    </svg>
  );
}

function LightSweep({
  width,
  height,
  frame,
  durationInFrames,
  index,
}: {
  width: number;
  height: number;
  frame: number;
  durationInFrames: number;
  index: number;
}) {
  const period = durationInFrames; // exactly one sweep per full loop — inherently seamless
  const phase = (index / 3) * period;
  const local = ((frame + phase) % period) / period;
  const diagonal = width + height;
  const pos = interpolate(local, [0, 1], [-diagonal * 0.3, diagonal * 1.1]);
  const opacity = interpolate(local, [0, 0.1, 0.5, 0.9, 1], [0, 0.5, 0.5, 0, 0]);

  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        left: pos - height,
        width: 2,
        height: height * 2.4,
        background: `linear-gradient(180deg, transparent, ${ACCENT}, transparent)`,
        transform: "rotate(35deg)",
        transformOrigin: "top left",
        opacity,
        filter: "blur(1px)",
      }}
    />
  );
}

export function HeroPulse() {
  const frame = useCurrentFrame();
  const { width, height, durationInFrames } = useVideoConfig();

  return (
    <AbsoluteFill style={{ backgroundColor: BG }}>
      <GridPulses width={width} height={height} frame={frame} />
      {[0, 1, 2].map((i) => (
        <LightSweep
          key={i}
          width={width}
          height={height}
          frame={frame}
          durationInFrames={durationInFrames}
          index={i}
        />
      ))}
    </AbsoluteFill>
  );
}
```

- [ ] **Step 2: Register the composition**

In `remotion/Root.tsx`, add a second `<Composition>` alongside the existing `Promo` one:

```tsx
import { Composition } from "remotion";
import { Promo } from "./Promo";
import { HeroPulse } from "./HeroPulse";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="Promo"
        component={Promo}
        durationInFrames={150}
        fps={30}
        width={1080}
        height={1080}
      />
      <Composition
        id="HeroPulse"
        component={HeroPulse}
        durationInFrames={300}
        fps={30}
        width={1920}
        height={1080}
      />
    </>
  );
};
```

- [ ] **Step 3: Add render/still scripts**

In `package.json`, in the `"scripts"` block, add two entries alongside the existing `remotion:render`:

```json
    "remotion:render:hero": "remotion render remotion/index.ts HeroPulse public/hero-pulse.mp4",
    "remotion:still:hero": "remotion still remotion/index.ts HeroPulse public/hero-pulse-poster.png --frame=0"
```

- [ ] **Step 4: Verify the composition loads in Remotion Studio**

Run: `npm run remotion:studio` (this starts a local Remotion Studio dev server — it does not block like a normal build command, so run it, confirm it starts without a compile error in its output, then stop it).

Expected: the studio starts and lists both `Promo` and `HeroPulse` compositions in its sidebar with no TypeScript/React errors in the terminal output.

- [ ] **Step 5: Commit**

```bash
git add remotion/HeroPulse.tsx remotion/Root.tsx package.json
git commit -m "feat: add HeroPulse Remotion composition for the Hero background"
```

---

## Task 8: Render the Hero video and wire it into the Hero component

**Files:**
- Create (generated, not hand-written): `public/hero-pulse.mp4`, `public/hero-pulse-poster.png`
- Modify: `src/components/Hero.tsx` (add the video background element)

**Interfaces:**
- Consumes: `public/hero-pulse.mp4` and `public/hero-pulse-poster.png` produced by Task 7's scripts
- Produces: nothing consumed elsewhere

- [ ] **Step 1: Render the video and poster**

Run:
```bash
npm run remotion:render:hero
npm run remotion:still:hero
```

Expected: `public/hero-pulse.mp4` and `public/hero-pulse-poster.png` are created. Run `ls -la public/hero-pulse.mp4 public/hero-pulse-poster.png` to confirm both exist and are non-zero size.

- [ ] **Step 2: Add the video element behind the existing grid background**

In `src/components/Hero.tsx`, change the outer `<section>` to hold the video as its first child, absolutely positioned behind the existing content, and gate it behind a reduced-motion check computed at module scope isn't possible (server/client mismatch), so gate it with a small client-only mount flag. Replace:

```tsx
  return (
    <section ref={root} className="relative overflow-hidden bg-grid-fade">
```

with:

```tsx
  return (
    <section ref={root} className="relative overflow-hidden bg-grid-fade">
      <HeroVideoBackground />
```

Add the `HeroVideoBackground` component above `Hero` (below `RevealWords`):

```tsx
function HeroVideoBackground() {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!reduced) setEnabled(true);
  }, []);

  if (!enabled) return null;

  return (
    <video
      className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-20"
      src="/hero-pulse.mp4"
      poster="/hero-pulse-poster.png"
      autoPlay
      muted
      loop
      playsInline
    />
  );
}
```

Add `useEffect, useState` to the existing `useRef` import at the top of the file:

```tsx
import { useEffect, useRef, useState } from "react";
```

- [ ] **Step 3: Type-check and build**

Run: `npx tsc --noEmit` — expect no errors.
Run: `npm run build` — expect a clean build.

- [ ] **Step 4: Visual and perf check**

Open the homepage in the browser tool. Confirm a faint animated grid-pulse video plays behind the Hero content without obscuring text (headline/CTA remain fully legible against it — the `opacity-20` plus existing dark gradient overlay from `bg-grid-fade` should keep contrast well within readable range). Check `read_network_requests` for the `hero-pulse.mp4` request to confirm it loads successfully (200) and note its size — if it's larger than ~2MB, that's worth flagging to the user (out of scope to auto-compress further in this plan, but worth a note in the final report).

Then verify the reduced-motion path: since `resize_window` doesn't toggle `prefers-reduced-motion` directly, verify by code review that `HeroVideoBackground` returns `null` when `matchMedia("(prefers-reduced-motion: reduce)").matches` is true (already covered by Step 2's code) — this is acceptable as a code-review-only check given the browser tool has no reduced-motion emulation control.

- [ ] **Step 5: Commit**

```bash
git add public/hero-pulse.mp4 public/hero-pulse-poster.png src/components/Hero.tsx
git commit -m "feat: add Remotion-rendered background video to Hero"
```

---

## Task 9: Full-site verification pass

**Files:** none (verification only)

**Interfaces:** none

- [ ] **Step 1: Clean build**

```bash
rm -rf .next
npx tsc --noEmit
npm run lint
npm run build
```

Expected: all three commands exit cleanly with no errors/warnings beyond what already existed before this plan (compare against the route list from the last known-good build in this session — same set of static/dynamic routes, no new errors).

- [ ] **Step 2: Browse every page in all three locales**

Start the dev server and, using the browser tool, visit each of the following in `/tr`, `/en`, and `/es` (9 page loads total minimum): homepage (`/`), `/patronlar`, `/hakkinda`, `/kurallar`, and one car detail page (`/araba/fiat-egea`). For each, take a screenshot and confirm:
- Background is near-black (`#08090b`), not the old very-dark-but-different `#07080a` mixed with any leftover red
- All accent-colored elements (buttons, links, active states, focus rings) are ice-blue, not red
- Podium medal colors (gold/silver/bronze) are unchanged
- The header logo shows the new C-monogram mark
- Text renders without a visible font-swap flash

- [ ] **Step 3: Interaction check**

On the homepage: cast a vote (or note it's already cast in this browser's `localStorage` from earlier testing) and confirm the button/hover states use the new accent. Open the "Patron Ol" modal (`BidModal`) via any `PatronCard` and confirm its form fields, platform buttons, and submit button use the new accent, with no leftover red anywhere (input focus ring, error text color if triggered by leaving required fields blank).

- [ ] **Step 4: Report findings**

Summarize in the final message to the user: confirmation that all pages/locales were checked, the hero video file size (from Task 8 Step 4), and any visual issue spotted that wasn't covered by an earlier task's fix (if any — file it as a fast follow-up rather than blocking).

- [ ] **Step 5: Final commit (if anything was fixed during verification)**

```bash
git add -A
git commit -m "fix: address visual issues found in redesign verification pass"
```

(Skip this step if verification found nothing to fix.)
