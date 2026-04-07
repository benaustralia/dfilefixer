# Diane's File Fixer

A single-page web app that detects files with wrong/missing extensions by sniffing magic bytes client-side, then downloads `<stem>_fixed.<ext>` next to the original. **No upload, no server.** Drag-drop UI only.

## Files
- `index.html` — the SPA. Markup, all CSS, FilePond CDN load, `SIGS` magic-byte table, `detect()` / `processBatch()`, the H1 SVG with curved title text + tractor `<g>`, the tractor positioner JS.
- `filepond-init.css` — circular drop zone styling, default/success drop icons, hopper-active/success transitions. Split out from `index.html`. (See active plan in `plans/`.)
- `filepond-init.js` — `FilePond.create(...)` config + custom `labelIdle` SVG icons + `onaddfile` hook into `window.queueFile`. Split out from `index.html`.
- `icon.svg`, `icon-192.png`, `icon-512.png`, `manifest.webmanifest` — PWA install assets. PNGs exist because Chrome PWA install on macOS rasterizes SVG icons at a small size and caches them, making the dock icon look low-res; explicit 192/512 PNGs fix that.
- `tests/fixtures/` — sample files with stripped extensions for manual QA (`jpeg_no_ext`, `pdf_no_ext`, etc.). Excluded from the Netlify publish.
- `plans/` — dated active plans. Always check for the most recent file before starting work. Excluded from the Netlify publish.
- `netlify.toml` — Netlify deploy config. No build step; publishes the repo root minus dev-only paths.

## Architecture (web app)
- **No build step.** Plain HTML/CSS/JS. Latest evergreen-browser features OK (CSS `min()`, `calc()`, custom properties, `aspect-ratio`, `radial-gradient` hard stops, `document.fonts.ready`, `getComputedTextLength`/`getStartPositionOfChar` on SVG text).
- **Single visual element:** a circular white "card" sized `min(520px, 92vmin)` centered on a dark-red bullseye background. The drop zone is the geometric center of the card. The H1 wraps the upper rim like a vinyl record label. A tractor SVG sits to the left of the title so it reads `🚜 Diane's File Fixer`.
- **One library only:** [FilePond](https://pqina.nl/filepond/) (PQINA, MIT) loaded from `unpkg.com/filepond@^4`. Custom configuration lives in `filepond-init.{css,js}`.
- **Font:** Orbitron from Google Fonts. The tractor positioner **must** await `document.fonts.ready` before measuring.

## Coding rules
- Keep total file count low. The split is **only** FilePond config — do **not** create `detect.js`, `tractor.js`, `bg.css`, etc.
- Use latest CSS for layout. No flex/grid hacks where `aspect-ratio`, `vmin`, or `min()` would be cleaner.
- The bullseye background is anchored to the card via a CSS variable `--card`, so resizing the window keeps the visual ratio constant.
- Detection logic in `SIGS` is battle-tested — do not refactor unless adding a new format or fixing a real bug.
- Tractor SVG **artwork** is locked. Only its outer `transform` may be modified by the JS positioner.
- Credit link to SVGBackgrounds.com stays, centered at bottom.

## Dev loop
- Local server is run with `python3 -m http.server 8000` from the project root. There may already be a background instance running — check before starting another.
- Manual QA: drop files from `tests/fixtures/`, verify a `*_fixed.*` download happens.
- Visual QA: Playwright at `1920×1080`, `960×1080` (half-screen), `390×844` (mobile portrait).

## Active work
See `plans/` for the most recent dated plan. As of 2026-04-08 the active plan is `2026-04-08-bullseye-tractor-filepond-split.md` covering: card-anchored bullseye, elliptical portrait variant, measured tractor positioning, centered attribution, and the FilePond config split.
