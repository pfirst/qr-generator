# QR Frame Gallery Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the single on/off CTA frame with a 5-choice gallery (`none` + classic/bubble/basic/banner) that renders identically in the live preview and every export, reproducing the real frames from th.qr-code-generator.com.

**Architecture:** The frame is composed **once, as SVG**, wrapping the QR SVG (`composeFramedSvg` in a new `core/frames.ts`). The preview injects that framed SVG; SVG export returns it; raster export rasterises it. This deletes the old duplicate frame code (CSS-div in preview + canvas in `export.ts`) and fixes the bug where SVG export dropped the frame. Geometry lives in `FRAME_PRESETS` (ratios ×Q measured from the reference SVGs) and is tuned to pixel-match in a measure-compare loop.

**Tech Stack:** Vite + React 19 + TypeScript + Tailwind v4; `qr-code-styling` (QR SVG), `qrcode` (matrix). No test runner — see Global Constraints.

## Global Constraints

- **No test framework** (per `CLAUDE.md`). Every task verifies with `npm run typecheck` (must pass clean) **plus** explicit browser checks on `npm run dev`. There is no `npm test`.
- **Client-only.** No network calls in shipped code for QR generation. The reference SVGs used in Task 5 are a **dev-only** tuning aid served from `public/` and deleted before commit — they must never be imported by app code.
- **Thai-first UI.** Gallery button labels and helper copy are Thai. Code/identifiers stay English.
- **Default frame label = `SCAN ME`** (exact string, editable by the user).
- **Frame must look identical in preview and in all exports** (PNG/JPG/WEBP/PDF/SVG/clipboard/print).
- **Keep the qr-code-styling shape mapping and logo `xlink:href` post-processing intact** — the QR SVG is nested untouched inside the frame.
- **Commit after every task.** On branch `main`: create a feature branch first (`git switch -c feat/frame-gallery`) before the Task 1 commit.

---

### Task 1: Migrate data model `frameOn` → `frameStyle` (app keeps working)

Introduce the `FrameStyle` union and switch every consumer off the boolean `frameOn`. The **existing** single-frame rendering (CSS-div preview + canvas export) is kept working for the intermediate state — selecting a frame shows the old look until Task 3 swaps in the SVG composer. This task is pure rename + default change; no visual feature yet.

**Files:**
- Modify: `src/core/types.ts` (add `FrameStyle`; `StyleSettings.frameStyle`; defaults)
- Modify: `src/core/export.ts:50`, `:66`, `:80`
- Modify: `src/core/verify.ts:72`
- Modify: `src/components/QrPanel.tsx:181`, `:230-234`, `:133-136`
- Modify: `src/components/HistoryPopover.tsx:9`

**Interfaces:**
- Produces: `type FrameStyle = 'none' | 'classic' | 'bubble' | 'basic' | 'banner'`; `StyleSettings.frameStyle: FrameStyle` (replaces `frameOn`).

- [ ] **Step 1: Add the `FrameStyle` union in `types.ts`**

After the existing `EyeFrameShape` line (~line 20), add:

```ts
export type FrameStyle = 'none' | 'classic' | 'bubble' | 'basic' | 'banner'
```

- [ ] **Step 2: Swap the field in `StyleSettings`**

In `types.ts`, replace the line `  frameOn: boolean` with:

```ts
  frameStyle: FrameStyle
```

- [ ] **Step 3: Update `defaultStyle()` in `types.ts`**

Replace `  frameOn: false,` with `  frameStyle: 'none',` and replace `  frameText: 'สแกนเลย',` with `  frameText: 'SCAN ME',`.

- [ ] **Step 4: Update `export.ts` (keep old rendering, new field)**

`src/core/export.ts` line 50 and line 66 — change both `if (style.frameOn) {` to:

```ts
  if (style.frameStyle !== 'none') {
```

Line 80 — change the fallback `style.frameText || 'สแกนเลย'` to `style.frameText || 'SCAN ME'`.

- [ ] **Step 5: Update `verify.ts`**

`src/core/verify.ts` line 72 — change `{ ...style, frameOn: false }` to:

```ts
  const canvas = await rasterCanvas(input, { ...style, frameStyle: 'none' }, 380)
```

- [ ] **Step 6: Update `QrPanel.tsx` (preview + temporary toggle)**

Line 181 — `const frameWrap: CSSProperties = style.frameOn` → `const frameWrap: CSSProperties = style.frameStyle !== 'none'`.

Line 230 — `{style.frameOn && (` → `{style.frameStyle !== 'none' && (`; and the label fallback on line 233 `style.frameText || 'สแกนเลย'` → `style.frameText || 'SCAN ME'`.

Lines 133–136 (the `cta` toggle) — replace the `Toggle` so it maps boolean ↔ frameStyle, and update the placeholder on line 143:

```tsx
        <label className="flex cursor-pointer items-center justify-between">
          <span className="text-[13px] font-bold text-[#374151]">เปิดกรอบ + ป้าย CTA</span>
          <Toggle on={style.frameStyle !== 'none'} onChange={(v) => patch({ frameStyle: v ? 'classic' : 'none' })} />
        </label>
```

and the text input placeholder `placeholder="สแกนเลย"` → `placeholder="SCAN ME"`.

- [ ] **Step 7: Update `HistoryPopover.tsx`**

Line 9 — in the `THUMB` object, change `frameOn: false` to `frameStyle: 'none' as const`.

- [ ] **Step 8: Verify typecheck + no stragglers**

Run: `npm run typecheck`
Expected: exits 0, no errors.

Run: `grep -rn "frameOn" src/`
Expected: no output (every reference migrated).

- [ ] **Step 9: Verify in browser**

Run: `npm run dev`, open the app, enter a URL, open the **เฟรม** tab, toggle the frame on.
Expected: the old border + bottom banner appears in the preview reading **SCAN ME** (not "สแกนเลย"); downloading a PNG shows the same.

- [ ] **Step 10: Commit**

```bash
git switch -c feat/frame-gallery   # only if currently on main
git add src/core/types.ts src/core/export.ts src/core/verify.ts src/components/QrPanel.tsx src/components/HistoryPopover.tsx
git commit -m "refactor: replace frameOn boolean with frameStyle union"
```

---

### Task 2: Create `core/frames.ts` — presets, helpers, `composeFramedSvg`

Build the single frame renderer. Pure string-in → string-out, no DOM. All four layouts. Numbers are the measured starting ratios from the spec §3 (tuned in Task 5).

**Files:**
- Create: `src/core/frames.ts`

**Interfaces:**
- Consumes: `FrameStyle`, `StyleSettings` from `./types`.
- Produces:
  - `type FramePreset` (shape below)
  - `const FRAME_PRESETS: Record<Exclude<FrameStyle,'none'>, FramePreset>`
  - `function composeFramedSvg(innerSvg: string, qrPx: number, style: StyleSettings): string`

- [ ] **Step 1: Write `src/core/frames.ts`**

```ts
import type { FrameStyle, StyleSettings } from './types'

// All geometry is a ratio of Q = the QR image width (incl. its quiet zone),
// measured from the qrcg reference SVGs via getBBox()+path parse. Tuned in the
// measure-compare loop (plan Task 5).
export type FramePreset = {
  label: string // UI label (gallery button)
  layout: 'border-banner' | 'tag-border' | 'outline-below' | 'banner-only'
  border: number // ×Q — frame/QR margin; 0 = none
  radiusOut: number // ×Q — outer corner radius
  radiusIn: number // ×Q — QR window corner radius (rounded corners on the QR)
  labelW: number // ×Q — max label width
  labelH: number // ×Q — label cap height → font size
  banner?: { height: number; pointer?: { w: number; h: number } } // ×Q (bottom banner)
  tag?: { height: number; pointer: { w: number; h: number } } // ×Q (top tag, bubble)
  gapBelow?: number // ×Q — gap between frame and below-label (basic)
}

export const FRAME_PRESETS: Record<Exclude<FrameStyle, 'none'>, FramePreset> = {
  classic: {
    label: 'Classic', layout: 'border-banner',
    border: 0.041, radiusOut: 0.053, radiusIn: 0.028,
    labelW: 0.758, labelH: 0.105, banner: { height: 0.297 },
  },
  bubble: {
    label: 'Bubble', layout: 'tag-border',
    border: 0.037, radiusOut: 0.053, radiusIn: 0.028,
    labelW: 0.758, labelH: 0.105, tag: { height: 0.34, pointer: { w: 0.12, h: 0.08 } },
  },
  basic: {
    label: 'Basic', layout: 'outline-below',
    border: 0.041, radiusOut: 0.053, radiusIn: 0.028,
    labelW: 1.0, labelH: 0.15, gapBelow: 0.095,
  },
  banner: {
    label: 'Banner', layout: 'banner-only',
    border: 0.025, radiusOut: 0.046, radiusIn: 0,
    labelW: 0.735, labelH: 0.1, banner: { height: 0.242, pointer: { w: 0.171, h: 0.064 } },
  },
}

let uid = 0 // unique clip-path ids so multiple framed SVGs on one page never collide

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

// Validate user-supplied colour to a hex literal before interpolating into SVG
// attributes (framed SVG is injected via dangerouslySetInnerHTML — prevents
// attribute breakout / XSS). frameColor is the only user value in an attribute.
function safeColor(c: string): string {
  return /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(c) ? c : '#000000'
}

function relLuminance(hex: string): number {
  const h = hex.replace('#', '')
  const n = h.length === 3 ? h.split('').map((c) => c + c).join('') : h
  const r = parseInt(n.slice(0, 2), 16) / 255
  const g = parseInt(n.slice(2, 4), 16) / 255
  const b = parseInt(n.slice(4, 6), 16) / 255
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

// label colour when it sits on the frameColor fill (banner / tag)
function onFill(frameColor: string): string {
  return relLuminance(frameColor) > 0.6 ? '#111111' : '#ffffff'
}

// Centred label. Shrinks the font (down to a floor) so long text never overflows maxW.
function labelSvg(text: string, cx: number, cy: number, cap: number, maxW: number, color: string): string {
  const t = esc((text || 'SCAN ME').toUpperCase())
  let fs = cap * 1.38 // cap height → font-size for a bold sans
  const est = t.length * fs * 0.62 // rough advance for bold uppercase sans
  if (est > maxW) fs = Math.max(fs * 0.45, (fs * maxW) / est)
  const ls = (fs * 0.06).toFixed(2)
  return (
    `<text x="${cx.toFixed(1)}" y="${cy.toFixed(1)}" text-anchor="middle" ` +
    `dominant-baseline="central" font-family="Arial, Helvetica, sans-serif" ` +
    `font-weight="700" font-size="${fs.toFixed(1)}" letter-spacing="${ls}" fill="${color}">${t}</text>`
  )
}

function rrect(x: number, y: number, w: number, h: number, r: number, attrs: string): string {
  return `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${w.toFixed(1)}" height="${h.toFixed(1)}" rx="${r.toFixed(1)}" ${attrs}/>`
}

// Place the (already-rendered) QR SVG at (x,y), clipped to a rounded square so its
// corners match the frame's inner window. Returns clipPath def + clipped group.
function placeQr(innerSvg: string, x: number, y: number, q: number, ri: number): string {
  const id = `qf-clip-${uid++}`
  const placed = innerSvg.replace(/<svg\b/, `<svg x="${x.toFixed(1)}" y="${y.toFixed(1)}"`)
  if (ri <= 0) return placed
  return (
    `<defs><clipPath id="${id}">${rrect(x, y, q, q, ri, '')}</clipPath></defs>` +
    `<g clip-path="url(#${id})">${placed}</g>`
  )
}

// solid bottom banner with rounded bottom corners + optional up-pointer (apex centred on top edge)
function bottomBanner(W: number, top: number, h: number, r: number, fill: string, pointer?: { w: number; h: number }): string {
  const bottom = top + h
  const cx = W / 2
  const point = pointer
    ? `M${(cx - pointer.w / 2).toFixed(1)},${top.toFixed(1)} L${cx.toFixed(1)},${(top - pointer.h).toFixed(1)} L${(cx + pointer.w / 2).toFixed(1)},${top.toFixed(1)} Z`
    : ''
  const rectPath =
    `M0,${top.toFixed(1)} H${W.toFixed(1)} V${(bottom - r).toFixed(1)} ` +
    `Q${W.toFixed(1)},${bottom.toFixed(1)} ${(W - r).toFixed(1)},${bottom.toFixed(1)} ` +
    `H${r.toFixed(1)} Q0,${bottom.toFixed(1)} 0,${(bottom - r).toFixed(1)} Z`
  return `<path d="${rectPath}" fill="${fill}"/>` + (point ? `<path d="${point}" fill="${fill}"/>` : '')
}

export function composeFramedSvg(innerSvg: string, qrPx: number, style: StyleSettings): string {
  if (style.frameStyle === 'none') return innerSvg
  const p = FRAME_PRESETS[style.frameStyle]
  const Q = qrPx
  const B = p.border * Q
  const Ro = p.radiusOut * Q
  const Ri = p.radiusIn * Q
  const fc = safeColor(style.frameColor)
  const cap = p.labelH * Q
  const maxLabel = p.labelW * Q
  const open = (W: number, H: number) =>
    `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${W.toFixed(1)}" height="${H.toFixed(1)}" viewBox="0 0 ${W.toFixed(1)} ${H.toFixed(1)}">`

  if (p.layout === 'border-banner') {
    const bannerH = p.banner!.height * Q
    const W = Q + 2 * B
    const H = B + Q + bannerH
    const behind = rrect(0, 0, W, H, Ro, `fill="${fc}"`)
    const qr = placeQr(innerSvg, B, B, Q, Ri)
    const label = labelSvg(style.frameText, W / 2, B + Q + bannerH / 2, cap, maxLabel, onFill(fc))
    return open(W, H) + behind + qr + label + '</svg>'
  }

  if (p.layout === 'tag-border') {
    const tagH = p.tag!.height * Q
    const pt = p.tag!.pointer
    const tagRegion = tagH + pt.h * Q
    const W = Q + 2 * B
    const H = tagRegion + B + Q + B
    const borderRect = rrect(0, tagRegion, W, B + Q + B, Ro, `fill="${fc}"`)
    const qr = placeQr(innerSvg, B, tagRegion + B, Q, Ri)
    const tag = rrect(0, 0, W, tagH, Ro, `fill="${fc}"`)
    const cx = W / 2
    const pointer = `<path d="M${(cx - (pt.w * Q) / 2).toFixed(1)},${tagH.toFixed(1)} L${cx.toFixed(1)},${tagRegion.toFixed(1)} L${(cx + (pt.w * Q) / 2).toFixed(1)},${tagH.toFixed(1)} Z" fill="${fc}"/>`
    const label = labelSvg(style.frameText, cx, tagH / 2, cap, maxLabel, onFill(fc))
    return open(W, H) + borderRect + qr + tag + pointer + label + '</svg>'
  }

  if (p.layout === 'outline-below') {
    const gap = (p.gapBelow ?? 0.095) * Q
    const ringBox = B + Q + B
    const W = Q + 2 * B
    const H = ringBox + gap + cap * 1.6
    const ring = rrect(B / 2, B / 2, Q + B, Q + B, Ro, `fill="none" stroke="${fc}" stroke-width="${B.toFixed(1)}"`)
    const qr = placeQr(innerSvg, B, B, Q, Ri)
    const label = labelSvg(style.frameText, W / 2, ringBox + gap + cap * 0.8, cap, maxLabel, fc)
    return open(W, H) + ring + qr + label + '</svg>'
  }

  // banner-only
  const m = B // tiny margin (quiet zone only)
  const bannerH = p.banner!.height * Q
  const pt = p.banner!.pointer!
  const W = Q + 2 * m
  const bannerTop = m + Q + pt.h * Q
  const H = bannerTop + bannerH
  const qr = placeQr(innerSvg, m, m, Q, Ri)
  const banner = bottomBanner(W, bannerTop, bannerH, Ro, fc, { w: pt.w * Q, h: pt.h * Q })
  const label = labelSvg(style.frameText, W / 2, bannerTop + bannerH / 2, cap, maxLabel * 1, onFill(fc))
  return open(W, H) + qr + banner + label + '</svg>'
}
```

- [ ] **Step 2: Verify typecheck**

Run: `npm run typecheck`
Expected: exits 0. (No runtime check yet — `composeFramedSvg` is exercised in the browser in Task 3.)

- [ ] **Step 3: Commit**

```bash
git add src/core/frames.ts
git commit -m "feat: add core/frames.ts frame presets and composeFramedSvg"
```

---

### Task 3: Wire `composeFramedSvg` into preview + exports; delete old frame code

Swap the QR-rendering sites to the single composer and remove the duplicate CSS-div and canvas frame implementations. After this, the **classic** frame (the only style reachable via the temporary toggle from Task 1) renders through SVG in both preview and export.

**Files:**
- Modify: `src/components/QrPanel.tsx` (preview injection; remove `frameWrap` + banner `<div>`)
- Modify: `src/core/export.ts` (import composer; SVG path; `rasterCanvas`; remove frame canvas block + `roundRect`)

**Interfaces:**
- Consumes: `composeFramedSvg(innerSvg, qrPx, style)` from `../core/frames` / `./frames`.

- [ ] **Step 1: QrPanel — inject the framed SVG, drop the CSS frame**

In `src/components/QrPanel.tsx`, add the import:

```tsx
import { composeFramedSvg } from '../core/frames'
```

Delete the `frameWrap` constant (lines ~181–192). Replace the preview body (the `hasData && svg ?` branch, lines ~226–236) so the inner card holds just the framed SVG:

```tsx
          {hasData && svg ? (
            <div className="relative rounded-[26px] border border-[#eef1f8] bg-white p-4" style={{ boxShadow: 'var(--shadow-qr)' }}>
              <div
                key={svg.length}
                className="overflow-hidden rounded-[10px] leading-[0]"
                style={{ animation: 'qrpop .26s cubic-bezier(.2,.9,.3,1.3)' }}
                dangerouslySetInnerHTML={{ __html: composeFramedSvg(svg, style.size, style) }}
              />
            </div>
          ) : (
```

(The `style.frameOn && <div>banner</div>` block is removed — the banner now lives inside the SVG.)

- [ ] **Step 2: export.ts — import + SVG path returns framed SVG**

In `src/core/export.ts`, add to the top imports:

```ts
import { composeFramedSvg } from './frames'
```

In `downloadQR`, the `format === 'svg'` branch — wrap the rendered SVG:

```ts
  if (format === 'svg') {
    const inner = await renderQrSvg(input.data, input.ecc, style, px, input.count)
    saveBlob(new Blob([composeFramedSvg(inner, px, style)], { type: 'image/svg+xml;charset=utf-8' }), fname(typeLabel, 'svg'))
    return
  }
```

- [ ] **Step 3: export.ts — rasterCanvas uses the framed SVG**

Replace the whole body of `rasterCanvas` (lines ~35–85) with:

```ts
export async function rasterCanvas(
  input: RenderInput,
  style: StyleSettings,
  px: number,
): Promise<HTMLCanvasElement> {
  const inner = await renderQrSvg(input.data, input.ecc, style, px, input.count)
  const framed = composeFramedSvg(inner, px, style)
  const img = await svgToImage(framed)
  const w = img.naturalWidth || px
  const h = img.naturalHeight || px
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  const ctx = c.getContext('2d')!
  ctx.fillStyle = style.bg // fill first so rounded-corner gaps aren't black on JPG
  ctx.fillRect(0, 0, w, h)
  ctx.drawImage(img, 0, 0, w, h)
  return c
}
```

Then delete the now-unused `roundRect` helper (lines ~24–32).

- [ ] **Step 4: Verify typecheck**

Run: `npm run typecheck`
Expected: exits 0 (no unused-symbol errors — confirm `roundRect` is fully removed).

- [ ] **Step 5: Verify in browser (classic via toggle)**

Run: `npm run dev`. Enter a URL, open **เฟรม**, toggle on.
Expected: preview shows the classic border + **SCAN ME** banner, now from the SVG. Download **PNG** and **SVG** — both contain the frame and look identical to the preview. Toggle off → bare QR, exports have no frame.

- [ ] **Step 6: Commit**

```bash
git add src/components/QrPanel.tsx src/core/export.ts
git commit -m "feat: render CTA frame via composeFramedSvg in preview and exports"
```

---

### Task 4: Gallery UI in the `cta` tab + frame glyphs

Replace the temporary toggle with a 5-button gallery so all four styles are selectable. Keep the text + colour controls below it.

**Files:**
- Modify: `src/ui/shapeGlyphs.ts` (add `FRAME_GLYPHS`)
- Modify: `src/components/QrPanel.tsx` (`cta` branch of `PopBody`)

**Interfaces:**
- Consumes: `FRAME_PRESETS` (`../core/frames`), `FrameStyle` (`../core/types`), `FRAME_GLYPHS` (`../ui/shapeGlyphs`).

- [ ] **Step 1: Add `FRAME_GLYPHS` to `shapeGlyphs.ts`**

Append to `src/ui/shapeGlyphs.ts` (small inline SVGs, 24×24 viewBox, `currentColor`):

```ts
// Mini glyphs for the CTA frame gallery (none + 4 styles). Schematic, not exact.
export const FRAME_GLYPHS: Record<string, string> = {
  none: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="4" y="4" width="16" height="16" rx="3"/><path d="M8 8l8 8M16 8l-8 8"/></svg>',
  classic: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="4" y="3" width="16" height="13" rx="2.5"/><rect x="4" y="17" width="16" height="4" rx="1.5" fill="currentColor" stroke="none"/></svg>',
  bubble: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="5" y="2" width="14" height="5" rx="1.5" fill="currentColor" stroke="none"/><path d="M12 7l2 2h-4z" fill="currentColor" stroke="none"/><rect x="4" y="10" width="16" height="12" rx="2.5"/></svg>',
  basic: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="4" y="3" width="16" height="13" rx="2.5"/><path d="M6 20h12" stroke-width="2.4"/></svg>',
  banner: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="5" y="3" width="14" height="13" rx="2"/><path d="M12 16l2 2h-4z" fill="currentColor" stroke="none"/><rect x="4" y="18" width="16" height="4" rx="1.5" fill="currentColor" stroke="none"/></svg>',
}
```

- [ ] **Step 2: Replace the `cta` branch of `PopBody` in `QrPanel.tsx`**

Add imports near the top of `QrPanel.tsx`:

```tsx
import { FRAME_PRESETS } from '../core/frames'
import type { FrameStyle } from '../core/types'
import { FRAME_GLYPHS } from '../ui/shapeGlyphs'
```

Define the gallery order once (module scope, near `TABS`):

```tsx
const FRAME_CHOICES: { id: FrameStyle; label: string }[] = [
  { id: 'none', label: 'ไม่มี' },
  { id: 'classic', label: FRAME_PRESETS.classic.label },
  { id: 'bubble', label: FRAME_PRESETS.bubble.label },
  { id: 'basic', label: FRAME_PRESETS.basic.label },
  { id: 'banner', label: FRAME_PRESETS.banner.label },
]
```

Replace the entire `if (tab === 'cta') { ... }` block with:

```tsx
  if (tab === 'cta') {
    return (
      <div className="w-[286px]">
        <SectionLabel>กรอบ + ป้าย CTA</SectionLabel>
        <div className="grid grid-cols-5 gap-1.5">
          {FRAME_CHOICES.map(({ id, label }) => {
            const on = style.frameStyle === id
            return (
              <button
                key={id}
                onClick={() => patch({ frameStyle: id })}
                title={label}
                className={
                  'flex cursor-pointer flex-col items-center gap-1 rounded-[11px] border py-2 text-[10px] font-bold transition ' +
                  (on ? 'border-[#7c3aed] bg-[#ede9fe] text-[#7c3aed]' : 'border-[#e6e7ee] bg-white text-[#9ca3af] hover:border-[#c4b5fd]')
                }
              >
                <span className="h-5 w-5" dangerouslySetInnerHTML={{ __html: FRAME_GLYPHS[id] }} />
                {label}
              </button>
            )
          })}
        </div>
        {style.frameStyle !== 'none' && (
          <div className="mt-3.5 flex items-center gap-3">
            <input
              value={style.frameText}
              onChange={(e) => patch({ frameText: e.target.value })}
              placeholder="SCAN ME"
              className="flex-1 rounded-[11px] border border-[#e6e7ee] bg-white px-3 py-2.5 text-[14px] font-bold text-[#111827] outline-none focus:border-[#7c3aed]"
            />
            <input type="color" value={style.frameColor} onChange={(e) => patch({ frameColor: e.target.value })} className="h-[42px] w-11 cursor-pointer rounded-[10px] border border-[#e6e7ee] bg-white p-1" />
          </div>
        )}
      </div>
    )
  }
```

- [ ] **Step 3: Verify typecheck**

Run: `npm run typecheck`
Expected: exits 0.

- [ ] **Step 4: Verify in browser**

Run: `npm run dev`. Open **เฟรม**: five buttons (`ไม่มี Classic Bubble Basic Banner`) with glyphs; selecting each updates the preview to that frame; editing text + colour applies; `ไม่มี` removes the frame. Confirm each of the 4 styles renders without overlapping the QR's quiet zone.

- [ ] **Step 5: Commit**

```bash
git add src/ui/shapeGlyphs.ts src/components/QrPanel.tsx
git commit -m "feat: frame gallery picker in the เฟรม toolbar tab"
```

---

### Task 5: Copy-exact measure-compare loop — tune `FRAME_PRESETS`

Pixel-match each style to its reference by overlaying the rendered frame on the real reference SVG and adjusting **only the numbers** in `FRAME_PRESETS` (and, if needed, the constants in `labelSvg`). Structure does not change here.

**Files:**
- Modify: `src/core/frames.ts` (`FRAME_PRESETS` values; label tuning constants)
- Dev-only (deleted before commit): `public/__ref/*.svg`

**Interfaces:** none new.

- [ ] **Step 1: Stage the references same-origin**

```bash
mkdir -p public/__ref
cp "/private/tmp/claude-501/-Users-pfirst-AI-qr-generator/b2c3e1ff-edbe-465e-9b4b-f10de3b017e6/scratchpad/ref-classic.svg" public/__ref/classic.svg
cp "/private/tmp/claude-501/-Users-pfirst-AI-qr-generator/b2c3e1ff-edbe-465e-9b4b-f10de3b017e6/scratchpad/ref-bubble.svg" public/__ref/bubble.svg
cp "/private/tmp/claude-501/-Users-pfirst-AI-qr-generator/b2c3e1ff-edbe-465e-9b4b-f10de3b017e6/scratchpad/ref-basic.svg" public/__ref/basic.svg
cp "/private/tmp/claude-501/-Users-pfirst-AI-qr-generator/b2c3e1ff-edbe-465e-9b4b-f10de3b017e6/scratchpad/ref-bannerOnly.svg" public/__ref/banner.svg
```

(If the scratchpad is gone, re-fetch via the frame_names in `docs/.../2026-06-29-qr-frame-gallery-design.md` §1: `curl "https://public-api.qr-code-generator.com/v1/create/extended?background_color=%23FFFFFF&foreground_color=%23000000&frame_name=<name>&image_format=SVG&image_width=1000&qr_code_text=example.com" -o public/__ref/<style>.svg`.)

- [ ] **Step 2: Compare each style against its reference (browser console, dev server)**

With `npm run dev` running, in the page console, render the app's framed QR for a style and overlay it on the reference at equal size. Use this harness (paste per style, swap `STYLE`):

```js
// In the running app: set frameColor to #000000 and the style under test in the UI first.
const STYLE = 'classic' // classic | bubble | basic | banner
const ref = new Image(); ref.src = '/__ref/' + STYLE + '.svg'; await ref.decode()
const mine = document.querySelector('[class*="rounded-[26px]"] > div svg') // the preview framed svg
const box = mine.getBoundingClientRect()
console.log(STYLE, 'mine aspect', (box.width/box.height).toFixed(3), 'ref aspect', (ref.naturalWidth/ref.naturalHeight).toFixed(3))
// Visually: open /__ref/<style>.svg in a tab at the same height as the preview and flip between them.
```

Compare aspect ratio (frame H/W) and, by eye at matched size, border thickness, corner radius, banner height, pointer size, and label size/position.

- [ ] **Step 3: Tune `FRAME_PRESETS` until matched**

Adjust the offending ratio(s) in `src/core/frames.ts` and let HMR refresh. Target aspect-ratio within ±0.02 of the reference and no visible difference in border/banner/label at matched size. Reference aspects (H/W): classic ≈ 1.242, bubble ≈ 1.438, basic ≈ 1.272, banner ≈ 1.311. Iterate per style.

- [ ] **Step 4: Confirm scannability survived the tuning**

For each style, with a real payload, confirm the preview's green "สแกนได้" / scannable state holds (the `decodeRendered` check in `verify.ts`). If a banner/border crowds the quiet zone, nudge `border`/`banner.height` back. Quiet zone must stay intact.

- [ ] **Step 5: Remove the dev references**

```bash
rm -rf public/__ref
git status --porcelain public/   # expect: no output (nothing staged from public/)
```

- [ ] **Step 6: Commit the tuned numbers**

```bash
git add src/core/frames.ts
git commit -m "fix: tune FRAME_PRESETS to match qrcg reference frames"
```

---

### Task 6: Final verification + docs

**Files:**
- Modify: `CLAUDE.md` (frame architecture notes)

- [ ] **Step 1: Full typecheck + build**

Run: `npm run build`
Expected: typecheck + production build succeed.

- [ ] **Step 2: Export matrix check**

Run `npm run dev`. For each of the 4 styles: export **PNG** and **SVG**, open both, confirm the frame is present and identical to preview; run a copy-to-clipboard and a print preview — all carry the frame. Confirm history thumbnails still render (open the history popover).

- [ ] **Step 3: No stragglers**

Run: `grep -rn "frameOn" src/`
Expected: no output.

Run: `grep -rn "__ref" src/ public/ 2>/dev/null`
Expected: no output (dev refs gone; app code never imports them).

- [ ] **Step 4: Update `CLAUDE.md`**

In `CLAUDE.md`, update the two notes that describe the old behaviour:
- The render-pipeline section: the CTA frame is now composed in `core/frames.ts` (`composeFramedSvg`) wrapping the QR SVG, used by preview **and** all exports — it is **no longer** drawn separately on the export canvas.
- The "Non-obvious behaviours" bullet about the CTA frame being drawn in `rasterCanvas`: replace with the `composeFramedSvg` description and note SVG export now includes the frame.

```bash
git add CLAUDE.md
git commit -m "docs: update CLAUDE.md for SVG-composed frame gallery"
```

- [ ] **Step 5: Finish the branch**

Use the `superpowers:finishing-a-development-branch` skill to choose merge / PR / cleanup.

---

## Self-Review

**Spec coverage:**
- 5-choice gallery in `cta` tab → Task 4. ✓
- One render path, preview == export → Tasks 2–3. ✓
- SVG export includes frame (bug fix) → Task 3 Step 2. ✓
- `frameStyle` replaces `frameOn`, default `SCAN ME` → Task 1. ✓
- `FRAME_PRESETS` in `core/frames.ts` → Task 2. ✓
- Label auto-contrast (banner/tag) + frame-colour (basic) → Task 2 `onFill`/`labelSvg` calls. ✓
- Long-text auto-shrink → Task 2 `labelSvg` font shrink. ✓
- Decode-check renders `frameStyle:'none'`; quiet zone preserved → Task 1 Step 5 + Task 5 Step 4. ✓
- History thumbnail + backward-compat → Task 1 Step 7 + Task 6 Step 2. ✓
- Copy-exact geometry → Task 5. ✓
- CLAUDE.md updated → Task 6 Step 4. ✓

**Placeholder scan:** No TBD/TODO; every code step shows full code. Task 5 numbers are explicitly "tuned via loop", not placeholders.

**Type consistency:** `FrameStyle`, `StyleSettings.frameStyle`, `FramePreset`, `FRAME_PRESETS`, `composeFramedSvg(innerSvg, qrPx, style)`, `FRAME_GLYPHS`, `FRAME_CHOICES` are used identically across tasks. `composeFramedSvg` imported from `./frames` (core) / `../core/frames` (components) — same module. ✓

**Note on TDD:** this repo has no test runner (Global Constraints), so the usual red-green test cycle is replaced by `npm run typecheck` + scripted browser verification + the Task 5 measure-compare loop. This is intentional and matches `CLAUDE.md`.
