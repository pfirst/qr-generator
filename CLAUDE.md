# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev        # Vite dev server (HMR)
npm run build      # tsc -b && vite build — typecheck THEN production build
npm run typecheck  # tsc -b --noEmit — fast type-only check
npm run preview    # serve the production build
```

No test framework is configured. Verify changes with `npm run typecheck` (or `npm run build`) plus running the app in the browser — there is no `npm test`.

## What this is

A **client-only** QR-code studio (Vite + React 19 + TypeScript + Tailwind v4). There is no backend: every QR is generated, rendered, exported, and decode-checked in the browser. "Data never leaves the device" is a product promise, so do **not** add network calls for QR generation. The UI is **Thai-first** — labels, validation messages, and toasts are written in Thai. Includes Thai payment QR (PromptPay + Bill Payment / EMVCo).

## Architecture — the render pipeline is the spine

Everything flows through one async pipeline. Understand this before touching rendering or export:

```
FieldData ──buildPayload(type,data)──▶ payload:string
                                         │
                  createMatrix(payload, ecc)   ← `qrcode` lib: VALIDATION + module
                  (qr.ts) → matrix.size          count only, NOT for drawing
                                         │
   renderQrSvg(payload, ecc, style, px, count)  ← `qr-code-styling` (ASYNC) → SVG string
                                         │
        ┌────────────────┬──────────────┼───────────────────┐
     preview         export.ts        verify.ts          HistoryCard
   (App state)   rasterCanvas/      decodeRendered      thumbnails
                 downloadQR         (re-decode)
```

- **`createMatrix` (qrcode) and `renderQrSvg` (qr-code-styling) encode independently.** The matrix exists only to (a) detect "data too long" / readiness and (b) compute the quiet-zone module count. The pixels you see come entirely from qr-code-styling.
- **The renderer is async** (`qr-code-styling`'s `getRawData('svg')`). `renderQrSvg` in `src/core/render.ts` returns a `Promise<string>`. There is no synchronous render function — the preview (`App.tsx`), raster/export (`export.ts`), decode check (`verify.ts`), and history thumbnails (`HistoryCard.tsx`) all `await` it.
- **`RenderInput = { data, ecc, count }`** (defined in `render.ts`) is the bundle App passes to export/verify so they can re-render the exact same QR.

### Shapes match Figma on purpose

`src/core/render.ts` maps the app's shape names to `qr-code-styling` option types (`CELL_TYPE` / `BORDER_TYPE` / `CENTER_TYPE`). Figma's QR generator uses the same library, so the geometry matches it 1:1 — keep that mapping intact when changing shapes. The dropdown's option glyphs in `src/ui/shapeGlyphs.ts` are Figma's exact SVGs (extracted, not hand-drawn). Cells have no "dots" option (5 shapes); border + center have all 6 (square/circle/dots/rounded/squircle/cornerflow).

### Non-obvious behaviours

- **Logo** uploads become a base64 data URL (FileReader) and **force ECC to `H`**. In the SVG, the logo `<image>` is post-processed to use `xlink:href` (Adobe Illustrator won't load a bare `href`), and the coloured logo-background shape is drawn by us — `qr-code-styling` doesn't draw one.
- **The CTA frame** (`style.frameStyle`, a `FrameStyle` union; `'none'` = off) is a **real qr-code-generator.com frame SVG** used as a template. `composeFramedSvg` (`src/core/frames.ts`) takes the frame chrome from `src/assets/frames/<id>.svg` (imported `?raw`; QR + outlined "SCAN ME" already stripped out), injects our QR into the measured slot (as a `<g transform="translate scale">` — **not** a nested `<svg>`: a nested-svg viewport clips at the fractional slot scale and some displays draw a hairline seam beside the QR; the unwrap also drops the QR's `<?xml>` prolog, which left mid-document makes the SVG invalid XML and breaks raster export), overlays our own editable label (`frameText`, LINE Seed) at the label slot, and recolors the themeable parts (`class="frame-color"` → `frameColor`) via a per-render id-scoped `<style>` (scopeStyle must match `<style type="text/css">` — the attribute, or every frame's CSS stays global and cross-contaminates). It also strips qrcg's `#E6E6E6` card-border paths (`OUTLINE_RE`: class `outline`/`show_on_white`) — on a hi-DPI (DPR=2) screen that border renders as a crisp grey hairline down the white card's sides and reads as a stray dark line beside the QR (the long-standing "เส้นดำ" report; only the six frames carrying it were ever affected). The SAME composed SVG feeds the preview (injected), SVG export (returned), and raster export (rasterised) — so preview == export. Per-frame geometry (slot, label slot, colour) lives in `FRAME_TEMPLATES`; the gallery + `frameThumb()` auto-derive from it. Frame assets are lifted from qrcg per the owner's decision (IP risk for a public release). To add/refresh a frame: fetch `…/create/extended?...&frame_name=qrcg-scan-me-<name>-frame` (curl needs `dangerouslyDisableSandbox`; CORS fetch works in-browser), strip the nested QR `<svg>` (depth-aware — it contains `Ebene_1` sub-svgs) + `#CallToAction`, save to `src/assets/frames/`, add a `FRAME_TEMPLATES` entry.
- **`buildPayload` returns `''`** when fields are incomplete/invalid; an empty payload means an empty preview and `ready === false`.
- **Scannability has two checks** (`verify.ts`): `contrastScan` is a cheap luminance estimate for instant feedback; `decodeRendered` actually rasterises and re-decodes via `BarcodeDetector` → `jsQR` fallback to confirm fancy shapes/gradients/logos didn't break readability.

## Layout

- `src/core/` — UI-agnostic domain logic: `types.ts` (`StyleSettings`, `FieldData`, shape unions, defaults), `payloads.ts` (per-type string builders incl. EMVCo PromptPay/Bill, vCard, Wi-Fi), `validate.ts` (Thai field errors), `qr.ts` (matrix), `render.ts` (SVG via qr-code-styling), `export.ts`, `verify.ts`.
- `src/components/` — feature components. `App.tsx` is the single state owner (type, data, style, exportSize, recent) and wires everything together.
- `src/ui/` — shared primitives (`controls.tsx`, `icons.tsx`, `surfaces.tsx`) plus `shapeGlyphs.ts`. `controls.tsx` exports `ACCENT_GRAD` (the brand gradient) and `ShapeMenu` (the shape-picker dropdown).
- `src/recent.ts` — QR history persisted in `localStorage`.

Styling is Tailwind utility classes with arbitrary hex values inline (no design-token layer); the brand gradient lives in `index.css` as `--grad-brand` and in `controls.tsx` as `ACCENT_GRAD`.
