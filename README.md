# Onyx — Crypto Scroll-World

A premium, black/white/orange scroll-through landing page built with the `scroll-world`
scrub engine. As you scroll, a pre-rendered camera flies through three scenes — **The
Gateway** → **The Core** → **The Vault** — connected by two aerial transition clips, with
no cuts.

All visuals are the video/image assets you supplied (generated with Google Flow). No new
media was generated for this build.

## Run it locally

The page fetches its video clips as blobs, which browsers only allow over `http://`, not
`file://`. A tiny zero-dependency static server is included:

```bash
npm start
# → http://localhost:5173
```

(Or directly: `node serve.js [port]`.)

## Structure

```
index.html                          # page shell, theme, copy, mountScrollWorld() config
serve.js                            # zero-dependency local static server (supports byte ranges)
public/js/scrub-engine.js           # the portable scroll-world engine (from the skill)
public/assets/                      # your original Google Flow exports (untouched)
public/assets/scroll-world/         # web-ready copies actually served by the page:
  scene-0{1,2,3}.jpg                #   posters (first-load fallback / lazy placeholder)
  scene-0{1,2,3}.mp4                #   the three dive clips
  connector-01-02.mp4                #   Gateway → Core transition
  connector-02-03.mp4                #   Core → Vault transition (fixed the double .mp4.mp4
                                      #   extension from the source export)
```

### Why the videos in `public/assets/scroll-world/` differ from your originals

Your source clips each had a **single keyframe for the whole 8s clip**, which is fine for
straight-through playback but makes scroll-scrubbing (seeking to arbitrary frames every
frame) stutter. The copies in `public/assets/scroll-world/` are the same footage,
re-encoded **all-intra** (every frame is its own keyframe, `-g 1`) at `crf 22`, audio
stripped, `faststart`. Visual content is unchanged; nothing was regenerated.

All-intra was chosen over the skill's default `-g 8` after measuring actual seek latency
(`video.currentTime` → `seeked` event) at 1080p: `-g 8` averaged ~185ms/seek in this
sandbox — visibly "steppy," since anything above ~16ms can't keep up with scroll — vs
~60-85ms/seek all-intra, for roughly the same file size (all-intra needs more bits/frame,
which mostly offsets the saved keyframes). The remaining gap is inherent decode cost of
1080p H.264; a real browser with GPU-accelerated decode should do noticeably better than
the software-decode sandbox these numbers were measured in. If it still feels steppy on
your machine, the next lever is resolution (1080p → ~900p) rather than encode settings —
ask and I'll cut a lower-res pass to compare.

## Customizing

- **Copy / accent color / CTAs**: edit the `sections` array and top-level `cta`/`brand` in
  `index.html`'s `mountScrollWorld(...)` call.
- **Theme**: the `:root, .sw-root { --sw-bg; --sw-ink; --sw-accent; ... }` block at the top
  of `index.html` controls the black/white/orange palette.
- **Pacing**: each section supports `scroll` (dwell time) and `linger` (mid-scene camera
  settle) — see the comment header in `public/js/scrub-engine.js`.
- **Mobile**: the engine already hardens phone scrubbing (seek-coalescing, iOS priming,
  safe-area insets) by default. A native 9:16 mobile clip chain was not requested/generated,
  so phones play the same 16:9 clips (`object-fit: cover`), which the skill flags as an
  acceptable stopgap rather than a true mobile film.

## Known engine fix applied

The stock `scrub-engine.js` copy/parallax code overwrites the CSS `transform:
translateY(-50%)` that vertically centers each section's copy block, which clipped the
CTA row on the final ("Vault") section for longer copy. This is patched in
`public/js/scrub-engine.js` (see the comment above `c.style.transform =` in `read()`) to
keep the `-50%` centering while still applying the scroll-parallax nudge.
