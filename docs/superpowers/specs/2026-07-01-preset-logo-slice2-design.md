# Preset (per-type) center logo — Slice 2 design

**Date:** 2026-07-01
**Status:** approved design (brainstormed with live mockups), pre-plan
**Builds on:** `2026-06-30-preset-logo-design.md` (Slice 1 — the mechanism, wired to promptpay/bill).
**Scope of THIS spec (Slice 2):** artwork + registry for the remaining 5 preset types
(**social** (17 platforms), **email, sms, tel, wifi**), plus a user-selectable **backing**
(brand chip / white halo-follows-logo / none) with adjustable shape, halo thickness, and
(for the 4 category glyphs) colour.

Design was validated against **live, real-QR mockups** (qr-code-styling, same lib as the app),
iterated with the owner. Mockup generators live in the session scratchpad
(`slice2-mockup/generate.mjs`, `generate-halo.mjs`) — not shipped.

---

## 1. Problem / intent

Slice 1 shipped the whole preset-logo *mechanism* (`resolveLogo` + `presetLogo` toggle +
custom-upload override), wired to promptpay/bill with the bundled PromptPay SVG. The other 5
preset types were deferred pending the **artwork discussion**. This slice supplies that artwork
and the controls to style it.

Two things a good center mark needs that a raw upload doesn't:
- **social** → the *selected platform's* real brand mark (Instagram, Facebook, LINE, …), so a
  scanner instantly knows where the QR points.
- **email/sms/tel/wifi** → a solid category glyph (envelope / speech-bubble / phone / wi-fi).

## 2. Decisions (locked with the owner)

| Question | Decision |
|---|---|
| Artwork approach | **Real brand marks** for social (17, Simple Icons single-path silhouettes) + **solid category glyphs** for email/sms/tel/wifi (authored). Not generic glyphs. |
| social default | **presetLogo ON by default** for `social` (like promptpay/bill). |
| email/sms/tel/wifi default | **opt-in (off)** — toggle appears, defaults off. |
| social mark source | follows `data.social.platform` (17 marks). Every platform has a mark → `hasPreset('social')` is always true. |
| Backing modes (`presetPlate`) | user-selectable: **`brand`** (brand-colour chip + white knockout mark) · **`halo`** (white backing that follows the logo silhouette) · **`none`** (raw mark). Default **`brand`** — see §7 open item. |
| Chip shape (`presetShape`) | for `brand` mode: **เหลี่ยม / มน / วงกลม** (square / rounded / circle). Default **rounded**. |
| Halo thickness (`presetHalo`) | for `halo` mode: adjustable, **floor 6**, expandable well beyond (slider to ~24). Default **6**. |
| Category glyph colour (`presetColor`) | adjustable, default app-purple `#7c3aed`. Applies to email/sms/tel/wifi only; **social uses the fixed brand colour**. |
| Size | reuse the existing `logoSize` slider (overall footprint). |
| Precedence / ECC / upload | unchanged from Slice 1: custom upload **>** preset **>** none; any center image forces ECC = H; uploading sets `presetLogo = false`. |
| promptpay/bill | unchanged (their bundled SVG already carries its own white bubble). |

### Why "brand chip" is the robust default (not "white plate + brand-colour mark")

Measured against real brand colours: a **white plate + brand-colour mark** breaks for
**Snapchat** (`#FFFC00`, invisible on white) and reads poorly for the near-black marks
(**GitHub** `#181717`, **X**/**TikTok**/**Threads** `#000000`). A **brand-colour chip + white
knockout mark** handles every brand uniformly (yellow Snapchat chip + white ghost, black X chip +
white X), and is the familiar "social button" look. So `brand` is the default; `halo` and `none`
are opt-in styles.

## 3. Architecture — unchanged spine, all composition in `logoPreset.ts`

Slice 1's rule holds: **the render/export/verify pipeline is not modified.** `resolveLogo` returns
a single data-URL string that becomes `renderStyle.logo`; the App forces `logoBg = 'none'` for an
active preset so the app draws no extra plate. The *backing* (chip rect / halo / nothing) is
**composed into the preset image itself** inside `logoPreset.ts`.

**This is already the established pattern** — `src/core/render.ts:92-97` sets
`hideBackgroundDots: false` (the library never clears its square block) and its comment states the
PromptPay preset "carries its own white halo so it still separates cleanly." Slice 2 composes that
same self-contained backing for the 17 + 4 marks. Confirmed against `render.ts:85-166`:

- `hideBackgroundDots: false` → all QR modules render; only the shape WE paint covers them.
- `postProcess` draws the `logoBg` plate (circle/rounded/square) **only when `logoBg !== 'none'`**.
  With `logoBg='none'` (preset), it draws nothing → the composed image's own backing shows.

So a `halo` backing works in the app *for free*: dots render behind, the white halo (a fattened
silhouette baked into the SVG) covers them in the logo's shape → white follows the logo, corners
show QR. (The "why is it still a white square" dead-end during design was a *mockup-only* artifact
from the mockup setting `hideBackgroundDots:true`; the real app already uses `false`.)

```
state:  style.logo        = custom upload only (unchanged)
        style.presetLogo   = boolean toggle (Slice 1)
        style.presetPlate  = 'brand' | 'halo' | 'none'   (new)
        style.presetShape  = 'square' | 'rounded' | 'circle'  (new; brand mode)
        style.presetHalo   = number (halo stroke width; new; halo mode)
        style.presetColor  = string hex  (new; category glyph colour)

logoPreset.presetLogoUrl(type, platform, style) -> composed data URL | null
        composes {mark SVG, colour, presetPlate, presetShape, presetHalo} into one SVG

App:    effLogo     = resolveLogo(type, data, style)   // custom > preset(composed) > none
        renderStyle = { ...style, logo: effLogo, logoBg: effLogo && !style.logo ? 'none' : style.logoBg }
        effEcc      = effLogo ? 'H' : style.ecc
```

## 4. Data model — `src/core/types.ts`

Add to `StyleSettings` (after Slice 1's `presetLogo`):

```ts
  presetLogo: boolean           // (Slice 1) show the type's preset center logo
  presetPlate: 'brand' | 'halo' | 'none'   // backing style for the preset mark
  presetShape: 'square' | 'rounded' | 'circle'  // chip shape (presetPlate==='brand')
  presetHalo: number            // halo stroke width in the mark's 24-unit space (presetPlate==='halo'); floor 6
  presetColor: string           // category-glyph colour (email/sms/tel/wifi); social ignores it
```

`defaultStyle()`: `presetPlate: 'brand'`, `presetShape: 'rounded'`, `presetHalo: 6`,
`presetColor: '#7c3aed'`. (`presetLogo` default stays `false`; the App turns it on when entering
`social`.)

Persistence: newly-saved history stores the raw `style` with the new fields, so they round-trip.
Presets are still **not** stored as data URLs — they re-compose from the registry (localStorage stays
small, Slice-1 quota-trim unaffected).

**G1 — backfill old entries.** `onLoadRecent` does a whole-object `setStyle(r.style)` (`App.tsx:182`),
and `recent.ts` only backfills entries missing `style` *entirely*. A pre-Slice-2 entry therefore has
`presetPlate/presetShape/presetHalo/presetColor === undefined`; switching to `social`/category then
turns `presetLogo` on and calls `composeMark` with `undefined` → `fill="undefined"` (renders black)
and `pad = 12 + undefined = NaN`. **Fix:** merge defaults on load —
`setStyle({ ...defaultStyle(), ...r.style })` (and/or field-level backfill in `recent.ts`'s load path
so thumbnails are safe too).

## 5. Assets — `src/assets/preset-logos/`

```
src/assets/preset-logos/
  promptpay.svg                 (Slice 1, unchanged)
  social/<platform>.svg   × 17  (Simple Icons, single path, brand colour in fill=)
  category/{email,sms,tel,wifi}.svg   × 4  (authored solid glyphs, 24×24 viewBox)
```

- **social** marks: Simple Icons (CC0 SVG files). Each is `<svg fill="#BRAND" viewBox="0 0 24 24"><path…/></svg>`.
  17 platforms mirror `SOCIAL_PLATFORMS` order in `core/social.ts`.
- **category** glyphs: authored here (envelope / speech-bubble / phone / wi-fi bands), single
  colour set at compose time (default `presetColor`).
- Imported `?raw` and bundled at build time — **no network calls** (CLAUDE.md client-only promise).

### Brand colour registry — a **hardcoded map is the source of truth**

Do **not** rely on parsing `fill="#…"` out of the asset: Simple Icons' stock files use
`fill="currentColor"` (no hex), so a regex-only `colorOf` would silently grey every mark. Ship an
explicit `SOCIAL_BRAND: Record<SocialPlatform, string>` (captured during design), and use it as the
colour source; asset `fill` parsing is at most a fallback:

```ts
const SOCIAL_BRAND: Record<SocialPlatform, string> = {
  facebook: '#0866FF', instagram: '#FF0069', x: '#000000', tiktok: '#000000', youtube: '#FF0000',
  linkedin: '#0A66C2', line: '#00C300', whatsapp: '#25D366', telegram: '#26A5E4', threads: '#000000',
  pinterest: '#BD081C', snapchat: '#FFFC00', discord: '#5865F2', github: '#181717', twitch: '#9146FF',
  spotify: '#1ED760', wechat: '#07C160',
}
```

The asset files must also be authored/normalised to `fill="#BRAND"` (not `currentColor`) so the raw
SVG renders in its brand colour even without recolouring — the design mockups fetched exactly this
form from `cdn.simpleicons.org/<slug>`.

## 6. `src/core/logoPreset.ts` — extend

Add the mark registry + a pure `composeMark` helper (ported from the validated mockup), and extend
the existing exports.

```ts
import socialFacebook from '../assets/preset-logos/social/facebook.svg?raw'
// … 16 more social + 4 category imports …

const inner = (svg: string) => svg.replace(/<svg[^>]*>/, '').replace(/<\/svg>/, '').replace(/<title>[\s\S]*?<\/title>/, '')

// colour comes from SOCIAL_BRAND (above), NOT from parsing the asset (§5).
const SOCIAL_RAW: Record<SocialPlatform, string> = { facebook: socialFacebook, /* …16 more… */ }
const CATEGORY: Partial<Record<QRType, string>> = { email: emailRaw, sms: smsRaw, tel: telRaw, wifi: wifiRaw }

// Compose backing + recoloured mark into one self-contained SVG data URL.
// brand → colour chip (shape) + white mark. halo → white silhouette halo (stroke t) + colour mark.
// none  → colour mark only. category types use `style.presetColor` as the mark colour.
function composeMark(markRaw: string, brandColor: string, style: StyleSettings): string { /* … */ }

export function presetLogoUrl(type: QRType, platform: SocialPlatform | undefined, style: StyleSettings): string | null {
  if (type === 'promptpay' || type === 'bill') return PROMPTPAY          // Slice 1 (unstyled bubble)
  if (type === 'social') {
    const p = platform ?? 'facebook'   // G3: never null while hasPreset('social') is true
    return composeMark(SOCIAL_RAW[p], SOCIAL_BRAND[p], style)
  }
  const g = CATEGORY[type]; return g ? composeMark(g, style.presetColor, style) : null
}

export const hasPreset = (type: QRType): boolean =>
  type === 'promptpay' || type === 'bill' || type === 'social' ||
  type === 'email' || type === 'sms' || type === 'tel' || type === 'wifi'

export const defaultPresetOn = (type: QRType): boolean =>
  type === 'promptpay' || type === 'bill' || type === 'social'

export function resolveLogo(type: QRType, data: FieldData, style: StyleSettings): string | null {
  if (style.logo) return style.logo                                       // custom wins
  if (style.presetLogo) return presetLogoUrl(type, data.social.platform, style)
  return null
}
```

`resolveLogo` keeps its `(type, data, style)` signature (already has `style`) and just passes `style`
into `presetLogoUrl`. The Slice-1 `defaultPresetBg` helper is **retired**: preset backing is now
`presetPlate`, and `logoBg` is forced `'none'` at the App boundary for any active preset (§3).

**Explicit deletions (or it won't compile / leaves stale writes):** remove the `defaultPresetBg`
export from `logoPreset.ts`, its import at `App.tsx:8`, and the
`...(on ? { logoBg: defaultPresetBg(t) } : {})` spread from **both** `pickType` (`App.tsx:48`) and
`onRemoveLogo` (`App.tsx:57`). promptpay/bill keep Slice-1 behaviour (their SVG carries its own bubble;
they render with `logoBg='none'` via the same boundary rule).

### `composeMark` geometry (validated in mockups)

viewBox `0 0 120 120`; `inner()` strips the mark to its path, redrawn via
`<g transform="translate(pad pad) scale(sc)">` where `sc = (120 - 2·pad)/24`.

- **brand:** `<rect width=120 height=120 rx=R fill=brandColor/>` (R: square 8 · rounded 26 · circle 60)
  + mark `fill="#fff"`, `pad = 24`.
- **halo:** two draws of the path — back `fill="#fff" stroke="#fff" stroke-width=presetHalo
  stroke-linejoin/​linecap="round"`, then top `fill=markColor`. `pad = 12 + presetHalo` (mark insets
  as the halo thickens so the fattened silhouette never clips the box → stays shape-hugging, never
  a square). markColor = brandColor (social) or `presetColor` (category).
- **none:** mark only, `pad = 8`, no backing.

Note (intentional): the halo back-layer fills the mark path solid white, so a mark's interior holes
(e.g. Instagram's lens) read white too — that solid-silhouette white backing is the desired look, not
a bug to "fix". Category glyphs with multiple subpaths (envelope) stroke/fill correctly as one group.

"Expand the halo more" = increase `presetHalo` (thicker white margin, mark stays put within its
footprint); overall footprint is the existing `logoSize`. Two independent levers.

## 7. App wiring — `src/App.tsx`

- `pickType` is **unchanged** (`App.tsx:43-52`): it already sets `presetLogo = defaultPresetOn(t)`, so
  extending `defaultPresetOn` to include `'social'` (§6) makes social default-on with no special-case.
- Derive `renderStyle` forcing `logoBg='none'` when an effective preset is active with **no** custom
  upload (custom uploads keep the user's `logoBg`):
  ```ts
  const effLogo = useMemo(() => resolveLogo(type, data, style), [type, data, style])
  const presetActive = !!effLogo && !style.logo
  const renderStyle = useMemo(() => ({ ...style, logo: effLogo, logoBg: presetActive ? 'none' : style.logoBg }), [style, effLogo, presetActive])
  const effEcc: Ecc = effLogo ? 'H' : style.ecc
  ```
  (Feeds render/decode/export/print/QrPanel exactly as Slice 1.)
- `onLogoFile` still adds `presetLogo:false`. `onRemoveLogo` restores `defaultPresetOn(type)`.

> **Confirmed (2026-07-01):** default `presetPlate = 'brand'` (chip) — the robust, recognisable
> default. `halo` / `none` remain one click away.

## 8. UI — `src/components/LogoUploader.tsx` (+ `DataCard.tsx`)

**B1 — thread the social platform in.** `LogoUploader`'s current props are
`{ style, patch, onLogoFile, onRemoveLogo, type }` (`LogoUploader.tsx:90-102`) and it calls
`presetLogoUrl(type)` with one arg (`:104`). The new signature needs the platform, and the social
*preview* `<img>` (`:143`) needs the right mark. So `DataCard` (which already holds `data`,
`DataCard.tsx:12,22`) must pass `data` (or just `data.social.platform`) into `LogoUploader`, and the
uploader builds its preview with `presetLogoUrl(type, data.social.platform, style)`.

**B2 — the styleable set is NOT `hasPreset`.** promptpay/bill ignore `presetPlate`/`presetShape`/
`presetHalo`/`presetColor` (their mark is the fixed bundled SVG), so their controls would be dead.
Gate the backing controls on `STYLEABLE = {social, email, sms, tel, wifi}`, not `hasPreset(type)`.
promptpay/bill keep only the bare "ใช้โลโก้ประจำชนิด" toggle (Slice-1 behaviour).

When a preset is active (no custom upload) **and `type ∈ STYLEABLE`**, below the
"ใช้โลโก้ประจำชนิด" toggle show:

1. **แผ่นรอง (`presetPlate`)** — segmented: `สีแบรนด์ · halo ตามรูปโลโก้ · ไม่มี`.
2. If `brand` → **รูปทรง (`presetShape`)** segmented: `เหลี่ยม · มน · วงกลม`.
   If `halo` → **ความหนา halo (`presetHalo`)** slider (min 6, max 24 — see §11 cap).
3. If type ∈ {email,sms,tel,wifi} → **สีไอคอน (`presetColor`)** colour picker (default purple).
4. **ขนาด (`logoSize`)** slider (shared; existing `min=5 max=60`).
5. Dropzone "อัปโหลดโลโก้เองแทน" (custom override, as Slice 1).

For promptpay/bill (preset active, not in `STYLEABLE`): show the toggle + preset preview + `logoSize`
+ dropzone only — no plate/shape/halo/colour controls.

`DataCard` already passes `type` + `onRemoveLogo` (Slice 1); this slice adds **`data`** (for the
social platform, B1). Non-preset types (url/text/vcard/geo) are unchanged: plain dropzone.

## 9. History thumbnails — `src/components/HistoryPopover.tsx`

`thumbSvg` already calls `resolveLogo(item.type, item.data, item.style)` (Slice 1). One fix: it must
mirror the App boundary and force `logoBg='none'` when the resolved logo came from a **preset** (no
custom upload) — otherwise `postProcess` draws an extra square/circle plate around the composed
image (which already carries its own backing) → a double/boxed backing in the thumbnail.

```ts
const logo = resolveLogo(item.type, item.data, item.style)
const presetActive = !!logo && !item.style.logo
const ecc = logo ? 'H' : item.style.ecc                       // keep — do not drop (N2)
const st = { ...item.style, logo, logoBg: presetActive ? 'none' : item.style.logoBg,
             frameStyle: 'none' as const, size: 116, margin: 2 }
// …then the existing createMatrix(payload, ecc) + renderQrSvg(payload, ecc, st, 116, matrix.size) tail.
```

Only the `logo`/`logoBg`/`ecc` derivation changes; the `createMatrix`/`renderQrSvg` tail
(`HistoryPopover.tsx:16-20`) stays. (If G1's backfill lives only in `onLoadRecent`, also guard
`thumbSvg` against undefined new fields — either backfill in `recent.ts`'s load or read them through
`{ ...defaultStyle(), ...item.style }`.) So a saved social/category preset shows its mark cleanly in
the 46px thumbnail.

## 10. Files touched

**Add** — `src/assets/preset-logos/social/*.svg` (17), `…/category/*.svg` (4), + the `SOCIAL_BRAND`
colour map (in `logoPreset.ts`).
**Modify** — `core/types.ts` (4 fields + defaults), `core/logoPreset.ts` (registry + `composeMark` +
extended `presetLogoUrl`/`hasPreset`/`defaultPresetOn`; **remove `defaultPresetBg`**), `App.tsx`
(`logoBg='none'` for presets; drop `defaultPresetBg` import + its 2 spreads; **history backfill**
`{ ...defaultStyle(), ...r.style }` in `onLoadRecent` — G1), `components/DataCard.tsx` (pass `data`
to `LogoUploader` — B1), `components/LogoUploader.tsx` (accept `data`; plate/shape/halo/colour
controls gated on `STYLEABLE` — B1/B2), `components/HistoryPopover.tsx` (`thumbSvg` forces
`logoBg='none'` for presets + field-safety — §9).
**Maybe** — `recent.ts` (field-level backfill on load, if not done in `onLoadRecent` — G1).
**Unchanged (intentionally)** — `core/render.ts`, `core/export.ts`, `core/verify.ts`,
`core/payloads.ts`. Spine keeps its `style.logo` contract.

## 11. Verification (Retina DPR=2, per project convention)

- `npm run typecheck` clean; `npm run build` clean.
- **social**: pick `social` → mark ON by default; switch platform → mark changes (all 17 non-null);
  ECC locked H. Try each `presetPlate` (brand chip / halo / none), each `presetShape`, drag
  `presetHalo` — halo hugs the silhouette (esp. X / Telegram), never a square box.
- **category**: email/sms/tel/wifi → toggle off by default; turning on shows the glyph; the colour
  picker recolours it; social's picker is absent.
- **custom override**: upload on `social` → preset flips off, custom shows, ECC H; delete → social
  preset returns.
- **⚠ Export + decode (flagged risk — G4)**: coverage compounds from **three** levers — `logoSize`
  (actual range `min=5 max=60`, `LogoUploader.tsx:22`), `presetHalo`, and `hideBackgroundDots:false`
  (modules stay behind the mark). Test the **worst case**: `logoSize=60` + `presetHalo=24` + a busy
  payload. Save PNG and confirm (a) the logo shows and (b) the on-screen scan-check stays green
  (`decodeRendered`, `verify.ts:70`, already fed `renderStyle` at `App.tsx:123`). Set the
  `presetHalo` slider **max to a concrete value that still decodes at `logoSize=60`** (start at 24;
  lower it if worst-case decode fails) — do not ship an open-ended slider. State the chosen cap in
  the plan.
- History popover thumbnail of a saved social preset shows the mark.
- url/text/vcard/geo unchanged.

## 12. Out of scope

- Per-platform default-on nuance beyond "social on / categories off".
- Animated or multi-colour (gradient) brand marks — single-colour silhouettes only.
- Editing/uploading custom preset artwork from the UI.

## 13. IP note

Brand marks are trademarks of their owners; Simple Icons **SVG files** are CC0 but the marks are
not. Showing a platform's mark to indicate the QR's destination is nominative/descriptive use (the
same basis as a "share on X" button) and is lower-risk than the qrcg frame chrome the owner already
accepted for release. Category glyphs are original. Flagged, owner-accepted direction.
