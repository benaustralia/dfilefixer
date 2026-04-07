# 2026-04-08 — Bullseye background, tractor positioning, FilePond split

## Goal
Three visual fixes plus a structural cleanup of `index.html` (currently 459 lines).
Final state: SPA-style app with **at most 3 files** (index.html + filepond-init.js + filepond-init.css), no over-engineering, no functional regressions.

## Context (read first)

- **App is a single-page web app** for fixing files with wrong/missing extensions. Drops files in a circular FilePond drop zone, sniffs magic bytes client-side, downloads `<stem>_fixed.<ext>` with no upload. There is also an unrelated native macOS variant in `Main.swift` — **ignore it**, the web app is the active target.
- **Visual concept:** white circular "card" (max 520 px / 92 vmin) centered on a deep-red bullseye gradient background. Curved H1 "Diane's File Fixer" wraps the upper rim of the card like a vinyl-record label. A small red tractor SVG sits to the left of "Diane's" so the title visually reads `🚜 Diane's File Fixer`.
- **FilePond is third-party** (PQINA, MIT, loaded from `unpkg.com/filepond@^4`). What's custom is: the circular CSS overrides, dual default/success drop icons, and the `onaddfile` → `queueFile` batching hookup. Keep the CDN load. Extract the customisation.
- **Localhost dev server is already running** as background process `bhp102t4g` on `http://localhost:8000/` (python3 -m http.server). Reuse it; do not start another.

## Tasks (in order)

### 1. Card-anchored bullseye background — fixes scaling AND mobile engulf
**Why:** current SVG uses `viewBox=800` + `preserveAspectRatio=xMidYMid slice`, so ring scale = `max(viewportW, viewportH) / 800`. On half-screen the long axis shrinks and rings collapse 44%. On mobile portrait the inner rings disappear behind the card and only outer dark colors are visible in the side-strips → "inner ring engulfs everything" complaint.

**Fix:**
- Introduce CSS custom property `--card: min(520px, 92vmin)` on `:root`.
- Use it for `.card { width/height: var(--card) }` (replaces existing `520px` + `max-*: 92vmin`).
- Replace the `<svg class="bg">` element entirely with a CSS `radial-gradient` on `body` (or a `.bg` div). Hard color stops at `0`, `1`, `2`, `3`, `4`, `5` × `calc(var(--card) / 4)` using the existing palette `#e02418 → #a0140d → #6b0e0a → #3d0808 → #1a0303 → #000`. Background-color `#000` covers anything beyond the outermost stop.
- Bullseye becomes a fixed multiple of the card → resizing the window or going to half-screen leaves the visual ratio identical.

### 2. Elliptical bullseye for portrait viewports
**Why:** user explicitly asked to try a portrait-oriented variant for narrow/mobile screens.

**Fix:**
```css
@media (max-aspect-ratio: 1/1) {
  body { background-image: radial-gradient(ellipse 70% 50% at center, /* same stops */); }
}
```
Vertically elongates the rings on portrait so more concentric bands are visible top-to-bottom, matching the viewport's tall shape. Stops use the same palette; only the gradient *shape* changes.

### 3. Tractor positioning via measured text metrics
**Why:** current placement is hardcoded magic numbers (`translate(97.4 195.0) rotate(-68)` and `startOffset="55%"`). Gap to "Diane" is not equal to space gap inside "Diane's File Fixer". Tractor doesn't feel like word #0.

**Fix:** add a small JS positioner that runs after `document.fonts.ready`:
1. Get the title arc path (`#title-arc`) and its `getTotalLength()`.
2. Get the `<text>` element. `getComputedTextLength()` → text width along path.
3. `getStartPositionOfChar(7)` and `getStartPositionOfChar(8)` → measure the actual rendered space-width along the curved path between "s" and "F".
4. Tractor visual width: hardcoded `38` user units (artwork bbox is 14→54 with `scale(0.95)`). **Do not modify the artwork** — only its outer transform.
5. Compute:
   ```
   phraseLen   = tractorWidth + spaceWidth + textLen
   phraseStart = arcLen/2 - phraseLen/2
   tractorMid  = phraseStart + tractorWidth/2
   textStart   = phraseStart + tractorWidth + spaceWidth
   textMid     = textStart + textLen/2
   ```
6. Set `textPath.setAttribute('startOffset', textMid)`.
7. `path.getPointAtLength(tractorMid)` → (x,y); same +1 unit ahead → tangent angle.
8. Set tractor `<g transform="translate(x y) rotate(angleDeg) translate(-32 -32) scale(0.95)">`.

Phrase becomes mathematically centered as `[tractor][space]Diane's File Fixer`, gaps are exact, self-corrects if the font ever loads slowly. No resize listener needed (SVG uses viewBox coordinates).

### 4. Centered, visible attribution
**Why:** keeping the SVGBackgrounds.com credit per user request, but it must be centered and clearly visible.

**Fix:**
- Move `.credit` from `position: fixed; bottom: 10px; right: 14px` to `position: fixed; bottom: 10px; left: 50%; transform: translateX(-50%)`.
- Bump opacity from `0.45` to `0.65` for visibility on the dark background.
- Keep hover state.

### 5. Split FilePond customisation into its own files
**Why:** user wants fewer lines in `index.html` without over-engineering.

**Files after the split:**
- `index.html` — markup, the radial-gradient bg CSS, the H1 SVG with the tractor `<g class="tractor">`, the tractor positioner JS, the `SIGS` array + `detect()`/`processBatch()`, FilePond CDN `<link>` and `<script>` tags.
- `filepond-init.css` — every `.filepond--*` rule, the `.drop-icons`/`.drop-icon`/`.icon-success` rules, the success state transitions. ~50 lines.
- `filepond-init.js` — the `FilePond.create(...)` call, the dual SVG icons inlined as the `labelIdle` template, the `onaddfile` hookup. Exposes `window._pond`. Expects `queueFile` and `flashSuccess` to be defined by `index.html` before this script runs (or expose them on `window`).

**Loading order in index.html:**
```html
<link rel="stylesheet" href="filepond-init.css">
...
<script src="https://unpkg.com/filepond@^4/dist/filepond.min.js"></script>
<script>/* SIGS + detect + queueFile + flashSuccess + tractor positioner */</script>
<script src="filepond-init.js" defer></script>
```

**Do NOT** create `detect.js`, `tractor.js`, `bg.css`, etc. The split is **only** the FilePond customisation, because that's the part the user explicitly singled out.

## Verification (use the running localhost server)
- Navigate Playwright to `http://localhost:8000/` at three viewport sizes:
  1. `1920 × 1080` (full landscape)
  2. `960 × 1080` (half-screen)
  3. `390 × 844` (mobile portrait)
- For each: take a snapshot, confirm:
  - All concentric ring colors are visible around the card
  - Bullseye scales proportionally between #1 and #2 (no jolt)
  - On #3, the elliptical variant kicks in (rings vertically elongated)
  - Tractor sits one space-width left of "Diane's" with matching radial offset
  - Credit link is centered at bottom and legible
- Drop a file from `fixtest/` (e.g. `jpeg_no_ext`) and confirm download still happens.

## Out of scope
- Native macOS app (`Main.swift`)
- Detection logic (`SIGS`/`detect`) — leave alone
- The tractor SVG artwork — only the *outer* transform changes
- Adding new file format detectors
- Replacing Orbitron with a self-hosted font
- Service worker / PWA install flow

## Risk notes
- `getComputedTextLength()` returns 0 if Orbitron hasn't loaded. **Always** await `document.fonts.ready` before running the positioner. Fall back to a sensible default tractor transform if fonts somehow fail.
- `radial-gradient` hard stops with `calc()` are well-supported in evergreen browsers (Safari 16+, Chrome 88+) — no fallback needed for the user's macOS target.
- Removing the `<svg class="bg">` removes the SVGBackgrounds.com markup, but the credit *link* stays per user instruction.
- Splitting JS into a separate file means `filepond-init.js` runs after the inline `<script>`. Ensure `queueFile` and `flashSuccess` are declared on `window` (not just inside an IIFE) so the second file can find them.
