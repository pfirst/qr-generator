# QR Frame Gallery — Design Spec

**Date:** 2026-06-29
**Status:** Approved (design) — pending spec review before implementation plan
**Owner:** พี่เฟิส / Aria

## 1. Summary

Replace the single on/off **CTA frame** with a **gallery of 5 frame choices** (`none` + 4 styles) chosen from the existing design toolbar's **"เฟรม"** tab. Each style reproduces — as closely as measurement allows — a real frame from `th.qr-code-generator.com`. The frame must show identically in the **live preview** and in **every export** (PNG/JPG/WEBP/PDF/SVG/clipboard/print).

The 4 styles (reference: `scratchpad/frames-reference.png`):

| key | based on qrcg `frame_name` | look |
|---|---|---|
| `classic` | `qrcg-scan-me-bottom-frame` | thick rounded border (3 sides) + solid bottom banner, white label |
| `bubble` | `qrcg-scan-me-bubble-frame` | top speech-bubble tag with down-pointer over a bordered QR, white label |
| `basic` | `qrcg-scan-me-basic-frame` | thin uniform rounded-rect outline + large label below (label = frame colour) |
| `banner` | `qrcg-scan-me-bottom-header-frame` | no border, solid bottom banner with an up-pointer, white label |

Default label text: **`SCAN ME`** (editable). Decided: copy-exact + reliable raster.

## 2. Goals / Non-goals

**Goals**
- 5-button gallery in the `cta` tab; selecting a style sets `frameStyle`.
- One rendering path for frame → preview == export, guaranteed.
- Geometry matched to the references via a measure-compare loop (copycat).
- Keep label text + colour user-editable.
- Fix existing gap: SVG export currently drops the frame entirely.

**Non-goals (YAGNI)**
- The decorative illustration frames (coffee cup, scooter, gift, etc.) — out of scope, off-brand.
- Multi-line labels, per-frame secondary colours, custom fonts for the label.
- Animating the frame.

## 3. Reference geometry (measured)

`Q` = rendered QR width incl. its quiet zone. All values ×Q. Source: reference SVGs read via `getBBox()` + path-command parse (`scratchpad/frame-geometry.md`). Common: outer corner radius **Rout = 0.053·Q**, border thickness **B = 0.041·Q**, inner-window radius **Rin = 0.028·Q**.

- **classic**: 3-side border B; solid bottom banner height **0.297·Q**; label white, W 0.758, H 0.140, centred in banner. Aspect H/W ≈ 1.242.
- **bubble**: QR border (sides/bottom) 0.037; top tag+pointer region **0.507·Q**; label white in tag, W 0.758, H 0.140; down-pointer bridges tag→QR. Aspect ≈ 1.438.
- **basic**: uniform ring B all sides, Rout/Rin as common; label BELOW frame, gap **0.095·Q**, W ≈ 1.07 (≈full), H 0.198, colour = frame colour. Aspect ≈ 1.272.
- **banner**: QR margin 0.025 (quiet zone only, **no border**); banner rect height **0.242·Q**, bottom radius 0.046; up-pointer width **0.171·Q** height **0.064·Q** centred on banner top; label white, W 0.735, H 0.136, centred in banner rect. Aspect ≈ 1.311.

These are starting values; the measure-compare loop (§9) tunes them until the rendered result matches the reference.

## 4. Architecture — compose the frame as SVG (single source of truth)

**Decision:** the frame is drawn **in the SVG layer**, wrapping the QR SVG. Rejected: keeping the export-canvas frame (logic would live in two places — the bug we are removing).

Pipeline today: `renderQrSvg` (qr-code-styling) → preview injects SVG **and** `export.ts` redraws a frame on canvas. The preview also draws its own CSS-div frame. Three frame implementations.

New pipeline:
```
renderQrSvg(payload, ecc, style, px, count)  →  inner QR SVG (unchanged)
        │
composeFramedSvg(innerSvg, qrPx, style)      ←  NEW (render.ts): wraps QR with frame SVG
        │
   ┌────┴───────────────┬───────────────────────┐
 preview            export.ts                 verify.ts
 inject framed SVG  SVG: return framed SVG     decode-check renders with
 (fonts via DOM)    raster: rasterise it       frameStyle:'none' (just the QR)
```

- **`composeFramedSvg(innerSvg, qrPx, style)` → `string`** (new, `core/frames.ts`):
  - When `style.frameStyle === 'none'` → return `innerSvg` unchanged.
  - Else build an outer `<svg>` sized to the preset's overall box; place the QR via a nested `<svg x y width height>` (the inner QR SVG nests cleanly — preserves logo `xlink:href` post-processing);
    draw frame shapes (rounded-rect border / banner / pointer triangle) filled with `frameColor`,
    and the label as a centred `<text>` (web-safe bold sans, e.g. `font-family="Arial, Helvetica, sans-serif"`, `font-weight="700"`, uppercase letter-spacing) coloured per §6.
  - Geometry comes from `FRAME_PRESETS[frameStyle]` scaled by `qrPx` (= Q).
- **Preview (`QrPanel.tsx`)**: inject the framed SVG; **remove** the CSS `frameWrap` border + the banner `<div>`.
- **Export (`export.ts`)**:
  - `format === 'svg'` → return `composeFramedSvg(...)` (was: bare QR — **fixes dropped-frame bug**).
  - raster (`rasterCanvas`) → rasterise the framed SVG straight to canvas; **delete** the bespoke `roundRect`/banner/`fillText` frame block (~lines 50–81) and the `frameWrap` math.
- **`verify.ts`**: change `{ ...style, frameOn: false }` → `{ ...style, frameStyle: 'none' }` so the decoder still sees only the QR.

**Trade-off accepted:** a Thai label in a *rasterised* SVG relies on a system Thai font. Mitigated by the `SCAN ME` default (Latin). Latin web-safe sans rasterises reliably and matches the reference (which is a generic sans, not LINE Seed). If a user types Thai, preview + SVG export are exact; PNG is decode-checked.

## 5. Data model (`core/types.ts`, `constants.ts`)

- New union: `export type FrameStyle = 'none' | 'classic' | 'bubble' | 'basic' | 'banner'`.
- `StyleSettings`: **replace** `frameOn: boolean` with `frameStyle: FrameStyle`. Keep `frameText`, `frameColor`.
- `defaultStyle()`: `frameStyle: 'none'`, `frameText: 'SCAN ME'` (was `'สแกนเลย'`), `frameColor` unchanged.
- **File split (decided):** the `FrameStyle` union stays in `core/types.ts` (next to the other shape unions, since `StyleSettings` uses it). The `FramePreset` type, the `FRAME_PRESETS` data, the SVG shape helpers, and `composeFramedSvg()` all live in a **new `core/frames.ts`** (which imports `FrameStyle`/`StyleSettings` from `types.ts` — one-way dependency, no cycle). This keeps `types.ts` lean and all frame logic in one place.
- `FRAME_PRESETS: Record<Exclude<FrameStyle,'none'>, FramePreset>` (`core/frames.ts`). `FramePreset` holds the §3 ratios + structural flags:
  ```ts
  type FramePreset = {
    label: string                 // Thai UI label
    layout: 'border-banner' | 'tag-border' | 'outline-below' | 'banner-only'
    border: number                // ×Q, 0 = none
    radiusOut: number; radiusIn: number
    banner?: { side: 'top'|'bottom'; height: number; pointer?: { w: number; h: number } }
    labelPos: 'banner' | 'below'  // where the text sits
    labelColor: 'auto-on-fill' | 'frame'  // white/black vs frameColor
    labelH: number; labelW: number
  }
  ```
  `layout` removes ambiguity between structurally different styles that share numbers:
  - `border-banner` (classic): one rounded rect, QR window cut at top (border on top+sides), bottom is the solid banner.
  - `tag-border` (bubble): full ring around the QR + a separate rounded tag above with a down-pointer.
  - `outline-below` (basic): uniform ring only; label drawn below the frame.
  - `banner-only` (banner): no ring; solid bottom banner with an up-pointer.
  `composeFramedSvg` switches on `layout` and builds each with shared helpers (`roundRectPath`, `bannerPath(pointer?)`, `centeredLabel`), reading the numbers from the preset.

**Backward-compat:** `recent.ts` does not persist full `StyleSettings` (verified by grep; re-confirm in build). If any persisted style carries `frameOn`, map `true→'classic'`, `false→'none'` on read. `HistoryPopover.tsx` `THUMB` and `verify.ts` switch to `frameStyle`.

## 6. Label colour rule

- `labelPos: 'banner'` (classic/bubble/banner): label sits on the `frameColor` fill → colour = **auto-contrast** (white if fill is dark, near-black if fill is light) so it stays readable when the user picks a light `frameColor`. References use white (default `frameColor` is dark purple → white, matches).
- `labelPos: 'below'` (basic): label sits on the page background → colour = **`frameColor`** (matches reference, where the outline and text share one colour).

Auto-contrast: reuse/extend the luminance helper already in `verify.ts` (`contrastScan`) or a small inline `relativeLuminance(hex)`.

## 7. UI — gallery in the `cta` tab (`QrPanel.tsx`)

`PopBody` `tab === 'cta'` becomes:
- A row/grid of **5 buttons**: `ไม่มี` (none) + `Classic` `Bubble` `Basic` `Banner`. Each button shows a **mini glyph** of the frame (small inline SVG, same spirit as `ui/shapeGlyphs.ts`) so the choice is visual. Selected button uses the accent style already used by the gradient picker (`border-[#7c3aed] bg-[#ede9fe]`).
- Below the gallery, shown when `frameStyle !== 'none'`: the existing **text input** (placeholder `SCAN ME`) + **colour picker** (unchanged controls).
- Glyphs: add `FRAME_GLYPHS` (a small inline-SVG per style) to `ui/shapeGlyphs.ts` or inline in `QrPanel.tsx`.

Toolbar icon for the tab stays `FrameIcon`; label stays "เฟรม".

## 8. Edge cases

- **Empty payload** → `innerSvg` empty / not ready → no frame (preview shows placeholder as today).
- **Logo** → forces ECC `H` (unchanged); QR nests as-is so logo `xlink:href` fix still applies.
- **Long `frameText`** → label `<text>` is centred; cap displayed width (e.g. `textLength`/auto-shrink or truncate) so it never overflows the banner. Spec: shrink font to fit banner width, min size floor.
- **Scannability** (`verify.ts`) → decode-check renders `frameStyle:'none'`; the frame never blocks the decoder. Still run `decodeRendered` per style during build to confirm the quiet zone is preserved (banner/border must not crowd the QR's quiet zone — references keep QR margin ≥ quiet zone).
- **Light `frameColor`** → label auto-contrast keeps it readable (§6).
- **Untrusted style values** → the framed SVG is injected via `dangerouslySetInnerHTML`, so user-controlled values interpolated into it must be sanitised. `frameColor` is validated to a hex literal (`safeColor()`, fallback `#000000`) before going into any SVG attribute; `frameText` is text content only and escaped via `esc()` (`& < >`). Low real-world risk (client-only, single-user) but a real hardening — flagged by automated security review.

## 9. Verification & the copy-exact loop

1. `npm run typecheck` clean.
2. Save references to the dev server `public/` (`ref-classic.svg` … or PNG), load **same-origin**, render MY framed QR for each style at the same size, overlay/diff, and tune `FRAME_PRESETS` until the difference is visually negligible (copycat measure loop). Clean up `public/` refs after.
3. Run the app: toggle each of the 5 choices, confirm preview updates and matches the reference image; edit text + colour.
4. Export each style as PNG **and** SVG; confirm the frame is present and identical to preview; confirm `decodeRendered` passes for all 4.
5. Confirm history thumbnails and the decode-check still work (no `frameOn` references remain: `grep -rn frameOn src/` returns nothing).

## 10. Files touched

- `src/core/types.ts` — `FrameStyle` union; `StyleSettings.frameStyle` (replaces `frameOn`); defaults (`frameStyle:'none'`, `frameText:'SCAN ME'`).
- `src/core/frames.ts` — **new**: `FramePreset` type, `FRAME_PRESETS`, SVG shape/label helpers, `composeFramedSvg()`.
- `src/core/export.ts` — import `composeFramedSvg`; SVG path returns framed SVG; remove canvas frame block; raster uses framed SVG.
- `src/core/verify.ts` — `frameStyle:'none'` for decode render.
- `src/components/QrPanel.tsx` — gallery UI; remove CSS-div preview frame; inject framed SVG.
- `src/components/HistoryPopover.tsx` — `THUMB.frameStyle:'none'`.
- `src/ui/shapeGlyphs.ts` (or inline) — `FRAME_GLYPHS`.
- `CLAUDE.md` — update the two notes that say the CTA frame is canvas-only / drawn in `rasterCanvas`.

## 11. Open items for the plan
- Exact label auto-shrink strategy for long text (e.g. SVG `textLength` + `lengthAdjust`, or measure-and-scale font with a min floor).
- Final tuned preset numbers come out of the §9 loop, not guessed up front.

_Resolved: presets live in a new `core/frames.ts` (§5)._
