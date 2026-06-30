# Preset (per-type) center logo — design

**Date:** 2026-06-30
**Status:** approved design, pre-plan
**Scope of THIS spec (Slice 1):** the full preset-logo *mechanism* + UI toggle, wired to
**promptpay & bill only** (asset = `QR_PP.svg`). The remaining preset types
(social/email/sms/tel/wifi) are designed-for but deferred to **Slice 2**, done together with
the separate "logo artwork" discussion.

---

## 1. Problem / intent

Some QR data types have an obvious brand/category mark that belongs in the center of the QR:

- **promptpay / bill** → the PromptPay / Thai-QR logo
- **social** → the selected platform's brand mark (FB, IG, …)
- **email / sms / tel / wifi** → a category glyph (envelope / bubble / phone / wi-fi)

Today the app has **one** center-image path: a user-uploaded image (`style.logo`, a data URL).
We want to add an opt-in/auto "preset logo per type", with one firm rule from the owner:

> If the user uploads their own image, the preset turns **off automatically** and is replaced
> by the upload.

The actual *artwork* for social/email/sms/tel/wifi is a separate discussion; this spec locks
the **behaviour + data model + UI mechanism** and ships it for promptpay/bill (real asset ready).

## 2. Decisions (locked)

| Question | Decision |
|---|---|
| Which types have a preset | promptpay, bill, social, email, sms, tel, wifi (7) |
| Default state | **ON** for promptpay & bill; **opt-in (off)** for the other 5 |
| social preset | follows `data.social.platform` (per-platform brand mark, 17) |
| bill asset | **same `QR_PP.svg` as promptpay** |
| Precedence | custom upload **>** preset **>** none |
| Upload behaviour | uploading sets `presetLogo = false` (switch visibly off) + ECC = H |
| Delete-custom behaviour | restores `presetLogo` to the type's default |
| Type switch | `presetLogo` resets to the new type's default (kept off if a custom upload exists) |
| ECC | any effective center image (custom OR preset) forces ECC = H (existing rule) |
| Sliders | preset reuses the existing logoSize / logoBg / logoPadding sliders |
| promptpay/bill plate | default `logoBg = 'none'` — the PromptPay mark carries its own white backing |
| Slice 1 build | mechanism + promptpay/bill only; the other 5 show **no toggle** until Slice 2 |

## 3. Architecture — chosen approach

**Approach A: one pure resolver, resolved at the App boundary; pipeline untouched.**

The render/export/verify pipeline already reads a single field, `style.logo` (the center image
data URL). We keep that contract intact and feed it the *resolved* image:

```
state:  style.logo      = custom upload only (UI truth, may be null)
        style.presetLogo = boolean toggle (new)

resolveLogo(type, data, style) -> string | null
        custom (style.logo)              if present          // custom wins
        else preset URL for (type[,platform])  if presetLogo on AND type has an asset
        else null

App:    effLogo     = resolveLogo(type, data, style)
        renderStyle = { ...style, logo: effLogo }            // derived; fed to the pipeline
        effEcc      = effLogo ? 'H' : style.ecc
```

Why A over the alternatives:

- **B (bake preset into `style.logo`)** — breaks the UI's `!!style.logo` "is there a custom
  upload?" test, and bloats every localStorage history entry with the preset's data URL. Rejected.
- **C (resolve inside the pipeline)** — changes the contract of the render/export/verify "spine"
  across 4 files (incl. `RenderInput`); spreads preset knowledge through `core/`. Rejected per the
  CLAUDE.md "keep the render pipeline clean" guidance.

The same `resolveLogo` is reused by the history thumbnails (they have `type`, `data`, `style`),
so preset logos render in the history popover with zero extra logic.

## 4. Data model

`src/core/types.ts`

- Add to `StyleSettings`: `presetLogo: boolean` — "show the type's preset center logo".
- `defaultStyle()`: `presetLogo: false` (default type is `url`, which has no preset).

Persistence: history stores the **raw** `style` (so `presetLogo` + custom-only `logo` round-trip).
Presets are **not** persisted as data URLs — they re-resolve from the registry, so localStorage
stays small and the existing quota-trim (drops `style.logo`) is unaffected.

## 5. New module — `src/core/logoPreset.ts`

Pure, UI-agnostic. Holds the registry + resolver.

```ts
import type { FieldData, LogoBg, QRType, StyleSettings, SocialPlatform } from './types'
import promptpayRaw from '../assets/preset-logos/promptpay.svg?raw'

// SVG string -> data URL (utf8-encoded; avoids btoa unicode pitfalls).
const svgUrl = (raw: string) => `data:image/svg+xml,${encodeURIComponent(raw)}`
const PROMPTPAY = svgUrl(promptpayRaw)

// Slice 1: only promptpay/bill have an asset. social/email/sms/tel/wifi -> null until Slice 2.
export function presetLogoUrl(type: QRType, _platform?: SocialPlatform): string | null {
  switch (type) {
    case 'promptpay':
    case 'bill':
      return PROMPTPAY
    default:
      return null // Slice 2: social (per _platform), email, sms, tel, wifi
  }
}

// Does this type expose a preset toggle at all? (Slice 1: only the two with an asset.)
export const hasPreset = (type: QRType): boolean => presetLogoUrl(type) !== null
//   ^ for social this will need the platform once Slice 2 lands; revisit then.

// Default toggle state when (re)entering a type.
export const defaultPresetOn = (type: QRType): boolean => type === 'promptpay' || type === 'bill'

// Default plate when a preset turns on (PromptPay mark has its own white backing).
export const defaultPresetBg = (type: QRType): LogoBg =>
  type === 'promptpay' || type === 'bill' ? 'none' : 'square'

// The single resolver: custom upload > preset > none.
export function resolveLogo(type: QRType, data: FieldData, style: StyleSettings): string | null {
  if (style.logo) return style.logo // custom wins
  if (style.presetLogo) return presetLogoUrl(type, data.social.platform)
  return null
}
```

Note: `hasPreset` currently ignores platform; when Slice 2 adds `social`, give every platform a
mark so `presetLogoUrl('social', p)` is always non-null, keeping `hasPreset('social')` true.

## 6. Asset

- Copy `QR_PP.svg` → `src/assets/preset-logos/promptpay.svg`, imported `?raw`.
- It is the full PromptPay mark: viewBox `0 0 740.4 492` (~1.5:1 landscape), colors `#1A3763`
  navy + `#53A69A` teal on a white speech-bubble (`.st0` fill `#FFFFFF`).
- The white speech-bubble is the logo's own backing → preset default `logoBg = 'none'`.
- It is an SVG data URL fed to `qr-code-styling`'s `image` option, exactly like an uploaded SVG
  (the uploader already accepts SVG), so the existing `postProcess` href→xlink:href + plate path
  applies unchanged. **Verify in-browser** that the SVG-in-SVG rasterises in `export.ts`
  (`rasterCanvas` draws the QR SVG to canvas); if any browser taints/skips it, fall back to
  rasterising the preset to a PNG data URL at module load.

## 7. App wiring — `src/App.tsx`

- Import `resolveLogo`, `defaultPresetOn`, `defaultPresetBg` from `core/logoPreset`.
- Derive:
  ```ts
  const effLogo = useMemo(() => resolveLogo(type, data, style), [type, data, style])
  const renderStyle = useMemo(() => ({ ...style, logo: effLogo }), [style, effLogo])
  const effEcc: Ecc = effLogo ? 'H' : style.ecc
  ```
- Pass **`renderStyle`** (not `style`) to: the `renderQrSvg` effect, `decodeRendered`,
  `downloadQR`, `copyQRToClipboard`, `printQR`, and the `<QrPanel style=… />` prop
  (so its `hasLogo` ECC-lock + reset see the preset too).
- `contrastScan(style)` and `recordRecent()`/`pushRecent(…, style)` keep the **raw** `style`.
- `renderInput` keeps using `effEcc` (already wired to `effLogo` via the line above).
- New `pickType` wrapper for `setType`:
  ```ts
  const pickType = useCallback((t: QRType) => {
    setType(t)
    if (!style.logo) {
      const on = defaultPresetOn(t)
      patchStyle({ presetLogo: on, ...(on ? { logoBg: defaultPresetBg(t) } : {}) })
    }
  }, [style.logo, patchStyle])
  ```
  Pass `pickType` to `DataCard onPickType` (replaces bare `setType`).
- `onLogoFile`: add `presetLogo: false` to the patch (preset visibly off on upload).
- New `onRemoveLogo` (used by the uploader's delete button):
  ```ts
  const onRemoveLogo = useCallback(() => {
    const on = defaultPresetOn(type)
    patchStyle({ logo: null, presetLogo: on, ...(on ? { logoBg: defaultPresetBg(type) } : {}) })
  }, [type, patchStyle])
  ```

## 8. UI — `src/components/LogoUploader.tsx` (+ `DataCard.tsx`)

`DataCard` passes `type` and `onRemoveLogo` down to `LogoUploader`.

`LogoUploader` states (for a type where `hasPreset(type)`):

1. **Custom upload present** (`style.logo`) → the existing "logo embedded" UI + size/bg/padding
   sliders. Delete button calls `onRemoveLogo`. A small note that the upload overrides the preset.
2. **No custom, preset toggle** → a switch **"ใช้โลโก้ประจำชนิด"**:
   - **on** → preview the preset image + the same size/bg/padding sliders + the dropzone (labelled
     "อัปโหลดโลโก้เองแทน") to override with a custom upload.
   - **off** → just the dropzone.
3. **Type has no preset** (`!hasPreset(type)`) → unchanged: dropzone only (no switch).

The switch patches `{ presetLogo }`; turning it on for promptpay/bill also sets
`logoBg: 'none'` if currently default. Slice 1 reality: the switch appears only for promptpay/bill.

## 9. History thumbnails — `src/components/HistoryPopover.tsx`

`thumbSvg(item)` resolves the effective logo the same way:

```ts
const logo = resolveLogo(item.type, item.data, item.style)
const ecc = logo ? 'H' : item.style.ecc
const st = { ...item.style, logo, frameStyle: 'none' as const, size: 116, margin: 2 }
```

So a saved promptpay QR with the preset shows the PromptPay mark in its 46px thumbnail.

## 10. Files touched (summary)

**Add**
- `src/assets/preset-logos/promptpay.svg` (copy of `QR_PP.svg`)
- `src/core/logoPreset.ts` (registry + `resolveLogo`/`hasPreset`/`defaultPresetOn`/`defaultPresetBg`)

**Modify**
- `src/core/types.ts` — `StyleSettings.presetLogo`, `defaultStyle().presetLogo = false`
- `src/App.tsx` — `effLogo`/`renderStyle`/`effEcc`, pass `renderStyle` to pipeline + QrPanel,
  `pickType`, `onLogoFile` (+`presetLogo:false`), `onRemoveLogo`
- `src/components/DataCard.tsx` — pass `type` + `onRemoveLogo` to `LogoUploader`
- `src/components/LogoUploader.tsx` — preset toggle UI + delete via `onRemoveLogo`
- `src/components/HistoryPopover.tsx` — `resolveLogo` in `thumbSvg`

**Unchanged (intentionally)** — `core/render.ts`, `core/export.ts`, `core/verify.ts`,
`core/payloads.ts`, `recent.ts` (still stores raw style). The "spine" keeps its `style.logo`
contract.

## 11. Verification

- `npm run typecheck` clean.
- In-browser (Retina DPR=2, per project convention):
  - Pick **promptpay** → PromptPay logo appears centered by default; ECC shows locked **H**.
  - Toggle the switch off → logo gone, ECC unlocks.
  - Pick **bill** → same PromptPay logo by default.
  - Upload a custom image on promptpay → preset switch flips **off**, custom shows, ECC = H.
  - Delete the custom → PromptPay preset returns (default-on type).
  - **Export PNG + decode**: the framed/preset QR still scans (`decodeRendered`), and raster
    export shows the logo (confirms SVG-in-SVG rasterises; else switch the asset to PNG).
  - History popover thumbnail of a preset QR shows the logo.
- Switch to **url/text** → no preset switch, behaviour unchanged.

## 12. Out of scope (Slice 2, with the logo discussion)

- Artwork + registry entries for social (17 platform marks, keyed by `data.social.platform`),
  email, sms, tel, wifi.
- Showing the preset switch for those 5 types (hidden until their assets exist).
- Any per-platform default-on policy for social (currently all opt-in).
