# "StreetRace" Reel — Design Spec

**Date:** 2026-08-26
**Status:** Approved, ready for implementation planning

## Goal

Produce a new vertical (1080×1920) Remotion reel for carsbid.lol, separate
from the existing generic `Reels` composition. It tells a short story — two
guys in identical BMW 3 Series cars race at a red light and tie — then pivots
to carsbid.lol as the place where "who's on top" *is* settled, unlike the
street. This is a new, standalone composition; the existing `Reels`
composition is untouched.

## Constraints established during brainstorming

- Remotion cannot generate photorealistic footage or illustrated characters
  from scratch — it composites existing assets (images/video) with code-drawn
  (SVG/CSS) effects. No stock footage of people racing exists in this repo.
- Decision: use the **real BMW 3 Series photo already in the system**
  (`bmw-3-serisi` in `src/data/carImages.generated.ts`, hosted on Supabase
  storage) combined with code-driven cinematic effects (vignette, color
  grade, motion blur, light sweeps, film grain). No human faces/characters
  are shown — the story is told through the car, POV framing, and
  typography, matching how the rest of the site already treats car photos.
- Both racers drive the same model (BMW 3.20 vs BMW 3.20), so reusing one
  photo asset for "both cars" is narratively consistent, not a shortcut.
- No audio track — no audio assets exist in the repo. The video is silent;
  trending audio can be added on the platform (TikTok/Instagram) after
  upload.

## Narrative logic

The connecting twist (chosen over two alternatives — an ironic "lost the
race, won the bid" gag, and a competition→collaboration angle): **the street
race proves nothing, but carsbid.lol's ranking does.** No one can call a
winner at the red light; on carsbid.lol, the BMW 3 Series' popularity is a
visible, verifiable number, and one user has literally claimed the "patron"
(sponsor) slot on that model's entry. The ad's argument is: real-world
bragging rights are unresolvable, digital ones (backed by votes and a paid
patron slot) are not.

## Composition: `StreetRace`

New file `remotion/StreetRace.tsx`, registered in `remotion/Root.tsx` as a
new `<Composition id="StreetRace">` — 1080×1920, 30fps, **500 frames
(~16.7s)**. Visual language reuses the existing Reels palette exactly (no
new tokens):

- `BG` `#050506`, `INK` `#ede7da`, `INK_MUTED` `#9a9287`, `BEZEL` `#2a2621`,
  `AMBER` `#ffb020` / `AMBER_BRIGHT` `#ffc65a`, `GOLD`/`SILVER`/`BRONZE` for
  podium-style elements — same constants as `remotion/Reels.tsx`.
- Sans font stack: `Arial, Helvetica, sans-serif` (matches existing scenes).

### Scene breakdown

| Frames | Time | Scene | Content |
|---|---|---|---|
| 0–60 | 0:00–0:02 | **Red Light** (new) | Dark city backdrop, the real BMW 3 Series photo blurred/bokeh'd behind a tachometer-style glow pulsing red. No text. Pure atmosphere/tension build. |
| 60–90 | 0:02–0:03 | **Green / Launch** (new) | White→green light-flash wipe; screen splits in half, the same BMW photo mirrored left/right; **"3.20 VS 3.20"** slams in as bold type. |
| 90–150 | 0:03–0:05 | **Race** (new) | Speed-line streaks, motion blur pan on the photo (both halves moving outward), rhythmic flash/punch accents standing in for a beat since there's no audio. |
| 150–190 | 0:05–0:06.3 | **Photo Finish** (new) | Frame freezes: desaturate + film grain + a hard white flash; **"KAZANAN YOK"** stamps in like an impact title. |
| 190–230 | 0:06.3–0:07.7 | **Transition line** (new) | Cut to black, centered type: **"Sokakta kazanan belli olmaz."** |
| 230–340 | 0:07.7–0:11.3 | **Vote Ranking** (adapted from `VoteScene`) | Eyebrow re-copied to **"AMA CARSBID.LOL'DE BELLİ"**; BMW 3 Serisi card; vote counter animates 0 → real seeded count; "Ücretsiz Oy Ver" pill. Same card chrome/animation timing as the existing `VoteScene`. |
| 340–430 | 0:11.3–0:14.3 | **Patron Reveal** (adapted from `BidScene`) | Handle `@320.tribe` appears, bid amount climbs, closing line **"BMW 3 Serisi'nin Patronu Oldu"** (replaces the generic "En yüksek teklifi veren kazanır" copy — this scene is now specific to the model just raced, not generic). |
| 430–500 | 0:14.3–0:16.7 | **CTA** (reused verbatim) | Existing `CtaScene` unchanged: carsbid.lol logo + "Patron Ol · Zirveye Taşı". |

### Implementation notes

- `GridPulses`/`LightSweep` background helpers from `HeroPulse.tsx` are
  reused as the ambient background layer, same as `Reels.tsx` does, for
  visual continuity between compositions.
- `VoteScene`, `BidScene`, and `CtaScene` are not imported as-is from
  `Reels.tsx` (they're private, file-local functions, not exported) — they
  get **copied into `StreetRace.tsx` and edited in place** for the copy
  changes above (eyebrow text, closing line, handle/price values). This
  duplicates ~80 lines of scene code between the two files; acceptable
  since the two reels are independent marketing assets that will likely
  diverge further, not a shared component library. `PodiumBlock`/
  `PodiumScene` are not needed for this reel and are not copied.
- New scene components to write: `RedLightScene`, `LaunchScene`, `RaceScene`,
  `PhotoFinishScene`, `TransitionLineScene`.
- The BMW photo is fetched from the same Supabase-hosted URL already used
  by `CAR_IMAGES["bmw-3-serisi"]` — loaded via Remotion's `<Img>` (or
  `<OffthreadVideo>` is not applicable, it's a still image) with `crossOrigin`
  as needed for Remotion's rendering pipeline.
- Render script: add `"remotion:render:streetrace": "remotion render
  remotion/index.ts StreetRace out/streetrace.mp4"` to `package.json`,
  matching the existing `remotion:render:reels` pattern.

## Out of scope

- No audio/music track.
- No changes to the existing `Reels`, `HeroPulse`, or `Promo` compositions.
- No real second car photo — both "cars" are the same asset by design.
- No human characters/faces.
