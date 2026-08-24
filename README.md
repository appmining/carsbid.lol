# carsbid.lol

A for-fun popularity contest between car models. Vote for free; buy the "patron"
ad slot on any model for a dollar more than the current holder.

## Development

```bash
npm install
npm run dev
```

Needs a `.env.local` with Supabase and Lemon Squeezy credentials — see
`src/lib/supabase/` and `src/lib/lemonsqueezy.ts` for the variables read.

## The car catalogue

`src/data/cars.ts` is the hand-edited source: it holds the identity of every
model and the curated Turkish-market ordering of the first few hundred entries.
Nothing else can reconstruct those, so edit models there.

Everything else is generated. The scripts in `scripts/` enrich that list and
emit `src/data/cars.generated.ts` (what the app imports) and
`src/data/carImages.generated.ts`:

| Command | What it does | Source |
|---|---|---|
| `npm run data:catalog` | body type, production years, generation count | auto-data.net |
| `npm run data:powertrain` | electric / hybrid tagging | auto-data.net search filters |
| `npm run data:prominence` | how well known each model is | Wikipedia pageviews (en + tr) |
| `npm run data:images` | photos → two derivatives → Supabase Storage | Wikipedia / Wikimedia Commons |
| `npm run data:build` | merges the above into the generated files | local caches |

Each script writes its cache to `scripts/data/` and resumes from it, so an
interrupted run costs nothing. All of them take `--limit N` to process only the
first N models. Requests are spaced at least a second apart and identify
themselves; `scripts/lib/http.mjs` holds that policy.

Photos are CC-licensed and carry their attribution through to the model pages.

## Video

Remotion compositions live in `remotion/`. `npm run remotion:studio` to preview,
`npm run remotion:render:hero` to regenerate the hero background.
