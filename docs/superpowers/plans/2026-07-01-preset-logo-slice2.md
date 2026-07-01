# Preset (per-type) center logo — Slice 2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add real brand marks for the `social` type (17 platforms) + solid category glyphs for `email/sms/tel/wifi`, with a user-selectable backing (brand-colour chip / white halo-follows-logo / none), plus adjustable shape, halo thickness, and category-glyph colour.

**Architecture:** All artwork + backing is **composed into the preset image inside `core/logoPreset.ts`** (`composeMark`) and returned as a single data-URL from `resolveLogo`; the App forces `logoBg='none'` for an active preset so `render.ts`'s `postProcess` draws no extra plate. The render/export/verify **spine is not modified** — it already uses `hideBackgroundDots:false` and draws the plate only when `logoBg!=='none'` (`render.ts:97,138`), so a shape-hugging halo works for free.

**Tech Stack:** Vite + React 19 + TypeScript + Tailwind v4, `qr-code-styling`. Spec: `docs/superpowers/specs/2026-07-01-preset-logo-slice2-design.md`. Builds on Slice 1 (`2026-06-30-preset-logo.md`).

## Global Constraints

- **Client-only:** no network calls for QR generation. Preset marks are bundled assets imported `?raw` at build time. (CLAUDE.md product promise.) *(Fetching the source SVGs during Task 1 is a one-time build-asset step, not a runtime call.)*
- **Pipeline contract unchanged:** do NOT modify `core/render.ts`, `core/export.ts`, `core/verify.ts`, `core/payloads.ts`. Resolve/compose at the `logoPreset.ts` + App boundary only.
- **Precedence:** custom upload **>** preset **>** none. Uploading sets `presetLogo=false`; deleting restores `defaultPresetOn(type)`.
- **Defaults:** `presetLogo` on by default for `promptpay`, `bill`, **`social`**; opt-in (off) for `email/sms/tel/wifi`. Default `presetPlate='brand'`, `presetShape='rounded'`, `presetHalo=6`, `presetColor='#7c3aed'`.
- **`logoBg='none'` for any active preset** (no custom upload) — at the App boundary and in history thumbnails. Custom uploads keep the user's `logoBg`.
- **ECC:** any effective center image (custom OR preset) forces ECC = `H`.
- **Brand colour = the `SOCIAL_BRAND` map, NOT parsed from the asset.** `composeMark` recolours via `inner()` (strips the `<svg>` root incl. its `fill`), so the asset's own colour is irrelevant.
- **Styleable set for the new controls:** `STYLEABLE = {social, email, sms, tel, wifi}` — NOT `hasPreset(type)` (promptpay/bill ignore the new fields → keep their bare toggle).
- **UI text is Thai.**
- **No test runner exists** (`package.json` has no `test` script). Each task's gate is `npm run typecheck` (clean) **plus** the stated in-browser check. View in Chrome at Retina **DPR=2** via `npm run dev`.
- **Commits:** per CLAUDE.md, commit ONLY when พี่เฟิส asks. The `git commit` step documents the intended grouping — run it only after approval; otherwise leave the tree staged/unstaged and move on.

---

### Task 1: Assets — 17 social marks + 4 category glyphs

**Files:**
- Create: `src/assets/preset-logos/social/{facebook,instagram,x,tiktok,youtube,linkedin,line,whatsapp,telegram,threads,pinterest,snapchat,discord,github,twitch,spotify,wechat}.svg` (17)
- Create: `src/assets/preset-logos/category/{email,sms,tel,wifi}.svg` (4)

**Interfaces:**
- Produces: 21 `?raw`-importable SVG files. Only each file's `<path>`(s) are used (`composeMark`'s `inner()` strips the `<svg>` wrapper), so the root `fill`/colour does not matter.

- [ ] **Step 1: Fetch the 17 social marks (Simple Icons)**

```bash
mkdir -p /Users/pfirst/AI/qr-generator/src/assets/preset-logos/social
cd /Users/pfirst/AI/qr-generator/src/assets/preset-logos/social
for slug in facebook instagram x tiktok youtube linkedin line whatsapp telegram threads pinterest snapchat discord github twitch spotify wechat; do
  curl -sS -o "$slug.svg" "https://cdn.simpleicons.org/$slug"
done
```
(Needs network — run the Bash tool with `dangerouslyDisableSandbox: true`.) `cdn.simpleicons.org/<slug>` returns `<svg …><title>…</title><path …/></svg>`.

- [ ] **Step 2: Verify all 17 downloaded (non-empty, one `<path>`)**

```bash
cd /Users/pfirst/AI/qr-generator/src/assets/preset-logos/social
for f in *.svg; do printf "%-13s %sb\n" "${f%.svg}" "$(wc -c < "$f")"; done
find . -name '*.svg' -size 0            # 0-byte files (rate-limited)
grep -L '<path' *.svg                   # files with NO <path> (404/error body)
```
Expected: 17 files, each > 200 bytes; both the `find` and the `grep -L` print nothing. `cdn.simpleicons.org` occasionally rate-limits (0-byte file) or returns a non-SVG error body (no `<path>`). If any is 0 bytes or has no `<path>`, re-run its curl once; if `linkedin` still fails, write it by hand:

```bash
cat > /Users/pfirst/AI/qr-generator/src/assets/preset-logos/social/linkedin.svg <<'EOF'
<svg fill="#0A66C2" role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><title>LinkedIn</title><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
EOF
```

- [ ] **Step 3: Author the 4 category glyphs**

```bash
mkdir -p /Users/pfirst/AI/qr-generator/src/assets/preset-logos/category
```
Create each file with the Write tool (24×24 viewBox; the `fill` is cosmetic — `composeMark` recolours):

`src/assets/preset-logos/category/email.svg`
```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#7c3aed"><path d="M1.5 8.67v8.58a3 3 0 0 0 3 3h15a3 3 0 0 0 3-3V8.67l-8.928 5.493a3 3 0 0 1-3.144 0L1.5 8.67Z"/><path d="M22.5 6.908V6.75a3 3 0 0 0-3-3h-15a3 3 0 0 0-3 3v.158l9.714 5.978a1.5 1.5 0 0 0 1.572 0L22.5 6.908Z"/></svg>
```

`src/assets/preset-logos/category/sms.svg`
```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#7c3aed"><path d="M4.5 3.75a3 3 0 0 0-3 3v6a3 3 0 0 0 3 3h1.5v3.19a.75.75 0 0 0 1.28.53l3.72-3.72h6.75a3 3 0 0 0 3-3v-6a3 3 0 0 0-3-3H4.5Z"/></svg>
```

`src/assets/preset-logos/category/tel.svg`
```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#7c3aed"><path d="M1.5 4.5a3 3 0 0 1 3-3h1.372c.86 0 1.61.586 1.819 1.42l1.105 4.423a1.875 1.875 0 0 1-.694 1.955l-1.293.97c-.135.101-.164.249-.126.352a11.285 11.285 0 0 0 6.697 6.697c.103.038.25.009.352-.126l.97-1.293a1.875 1.875 0 0 1 1.955-.694l4.423 1.105c.834.209 1.42.959 1.42 1.82V19.5a3 3 0 0 1-3 3h-2.25C8.552 22.5 1.5 15.448 1.5 6.75V4.5Z"/></svg>
```

`src/assets/preset-logos/category/wifi.svg`
```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#7c3aed"><path d="M1 9l2 2c4.97-4.97 13.03-4.97 18 0l2-2C16.93 2.93 7.08 2.93 1 9zm8 8l3 3 3-3c-1.65-1.66-4.34-1.66-6 0zm-4-4l2 2c2.76-2.76 7.24-2.76 10 0l2-2C15.14 9.14 8.87 9.14 5 13z"/></svg>
```

- [ ] **Step 4: Confirm 21 files present**

```bash
ls /Users/pfirst/AI/qr-generator/src/assets/preset-logos/social/*.svg | wc -l   # 17
ls /Users/pfirst/AI/qr-generator/src/assets/preset-logos/category/*.svg | wc -l  # 4
```
Expected: `17` and `4`. No typecheck yet (files not imported until Task 3).

- [ ] **Step 5: Commit** *(only after พี่เฟิส approves)*

```bash
git add src/assets/preset-logos/social src/assets/preset-logos/category
git commit -m "feat: bundle 17 social brand marks + 4 category glyphs (slice 2 assets)"
```

---

### Task 2: State fields — `src/core/types.ts`

**Files:**
- Modify: `src/core/types.ts` (`StyleSettings` interface + `defaultStyle()`)

**Interfaces:**
- Produces: `StyleSettings.presetPlate: 'brand'|'halo'|'none'`, `.presetShape: 'square'|'rounded'|'circle'`, `.presetHalo: number`, `.presetColor: string`.

- [ ] **Step 1: Add the four fields to `StyleSettings`**

In `src/core/types.ts`, immediately after the existing `presetLogo` line (`:98`):

```ts
  presetLogo: boolean // show the type's built-in preset logo (custom upload overrides it)
  presetPlate: 'brand' | 'halo' | 'none' // preset backing: brand-colour chip · white halo-follows-logo · none
  presetShape: 'square' | 'rounded' | 'circle' // chip shape when presetPlate === 'brand'
  presetHalo: number // halo stroke width in the mark's 24-unit space when presetPlate === 'halo'; floor 6
  presetColor: string // category-glyph colour (email/sms/tel/wifi); social uses the fixed brand colour
```

- [ ] **Step 2: Add their defaults to `defaultStyle()`**

In `defaultStyle()`, immediately after `presetLogo: false,` (`:137`):

```ts
  presetLogo: false,
  presetPlate: 'brand',
  presetShape: 'rounded',
  presetHalo: 6,
  presetColor: '#7c3aed',
```

- [ ] **Step 3: Typecheck**

Run: `npm run typecheck`
Expected: **PASS.** (`defaultStyle` is the only `StyleSettings` constructor; `patchStyle` takes `Partial`, so nothing else breaks.)

- [ ] **Step 4: Commit** *(only after approval)*

```bash
git add src/core/types.ts
git commit -m "feat: preset backing/shape/halo/colour style fields"
```

---

### Task 3: Core resolver + registry + `composeMark` — `src/core/logoPreset.ts`

**Files:**
- Modify: `src/core/logoPreset.ts` (rewrite)

**Interfaces:**
- Consumes: `FieldData`, `QRType`, `SocialPlatform`, `StyleSettings` from `./types`; the 21 assets from Task 1.
- Produces (used by Tasks 4–5):
  - `presetLogoUrl(type: QRType, platform: SocialPlatform | undefined, style: StyleSettings): string | null`
  - `hasPreset(type: QRType): boolean`
  - `defaultPresetOn(type: QRType): boolean`
  - `resolveLogo(type: QRType, data: FieldData, style: StyleSettings): string | null`
  - **`defaultPresetBg` is REMOVED** (Task 4 deletes its callers).

- [ ] **Step 1: Replace the whole file**

Replace the entire contents of `src/core/logoPreset.ts` with:

```ts
// Preset (per-type) center logos. UI-agnostic. Composes the effective center image
// (backing + recoloured mark) for the render pipeline; custom upload always wins.
import type { FieldData, QRType, SocialPlatform, StyleSettings } from './types'
import promptpayRaw from '../assets/preset-logos/promptpay.svg?raw'
import facebookRaw from '../assets/preset-logos/social/facebook.svg?raw'
import instagramRaw from '../assets/preset-logos/social/instagram.svg?raw'
import xRaw from '../assets/preset-logos/social/x.svg?raw'
import tiktokRaw from '../assets/preset-logos/social/tiktok.svg?raw'
import youtubeRaw from '../assets/preset-logos/social/youtube.svg?raw'
import linkedinRaw from '../assets/preset-logos/social/linkedin.svg?raw'
import lineRaw from '../assets/preset-logos/social/line.svg?raw'
import whatsappRaw from '../assets/preset-logos/social/whatsapp.svg?raw'
import telegramRaw from '../assets/preset-logos/social/telegram.svg?raw'
import threadsRaw from '../assets/preset-logos/social/threads.svg?raw'
import pinterestRaw from '../assets/preset-logos/social/pinterest.svg?raw'
import snapchatRaw from '../assets/preset-logos/social/snapchat.svg?raw'
import discordRaw from '../assets/preset-logos/social/discord.svg?raw'
import githubRaw from '../assets/preset-logos/social/github.svg?raw'
import twitchRaw from '../assets/preset-logos/social/twitch.svg?raw'
import spotifyRaw from '../assets/preset-logos/social/spotify.svg?raw'
import wechatRaw from '../assets/preset-logos/social/wechat.svg?raw'
import emailRaw from '../assets/preset-logos/category/email.svg?raw'
import smsRaw from '../assets/preset-logos/category/sms.svg?raw'
import telRaw from '../assets/preset-logos/category/tel.svg?raw'
import wifiRaw from '../assets/preset-logos/category/wifi.svg?raw'

// SVG string -> data URL. utf8-encode (not btoa) to avoid unicode pitfalls.
const svgUrl = (raw: string): string => `data:image/svg+xml,${encodeURIComponent(raw)}`
const PROMPTPAY = svgUrl(promptpayRaw)

// Strip a mark down to its <path>(s): drop the <svg> wrapper (and its own fill) + any <title>.
const inner = (svg: string): string =>
  svg.replace(/<svg[^>]*>/, '').replace(/<\/svg>/, '').replace(/<title>[\s\S]*?<\/title>/, '')

// Raw SVGs keyed by platform (order mirrors core/social.ts).
const SOCIAL_RAW: Record<SocialPlatform, string> = {
  facebook: facebookRaw, instagram: instagramRaw, x: xRaw, tiktok: tiktokRaw, youtube: youtubeRaw,
  linkedin: linkedinRaw, line: lineRaw, whatsapp: whatsappRaw, telegram: telegramRaw, threads: threadsRaw,
  pinterest: pinterestRaw, snapchat: snapchatRaw, discord: discordRaw, github: githubRaw, twitch: twitchRaw,
  spotify: spotifyRaw, wechat: wechatRaw,
}

// Brand colours are the SOURCE OF TRUTH (Simple Icons stock may ship `currentColor`).
const SOCIAL_BRAND: Record<SocialPlatform, string> = {
  facebook: '#0866FF', instagram: '#FF0069', x: '#000000', tiktok: '#000000', youtube: '#FF0000',
  linkedin: '#0A66C2', line: '#00C300', whatsapp: '#25D366', telegram: '#26A5E4', threads: '#000000',
  pinterest: '#BD081C', snapchat: '#FFFC00', discord: '#5865F2', github: '#181717', twitch: '#9146FF',
  spotify: '#1ED760', wechat: '#07C160',
}

const CATEGORY_RAW: Partial<Record<QRType, string>> = { email: emailRaw, sms: smsRaw, tel: telRaw, wifi: wifiRaw }

// Compose backing + recoloured mark into one self-contained SVG data URL.
//   brand → colour chip (presetShape) + white knockout mark
//   halo  → white silhouette halo (stroke presetHalo) behind the colour mark (hugs the logo shape)
//   none  → colour mark only
// `color` = the brand colour (social) or style.presetColor (category).
function composeMark(markRaw: string, color: string, style: StyleSettings): string {
  const path = inner(markRaw)
  const S = 120
  const g = (pad: number, attrs: string): string =>
    `<g transform="translate(${pad} ${pad}) scale(${(S - 2 * pad) / 24})" ${attrs}>${path}</g>`

  let body: string
  if (style.presetPlate === 'halo') {
    const t = style.presetHalo
    const pad = 12 + t // mark insets as the halo thickens so the fattened silhouette never clips the box
    const halo = g(pad, `fill="#ffffff" stroke="#ffffff" stroke-width="${t}" stroke-linejoin="round" stroke-linecap="round"`)
    body = halo + g(pad, `fill="${color}"`)
  } else if (style.presetPlate === 'brand') {
    const r = style.presetShape === 'circle' ? S / 2 : style.presetShape === 'square' ? 8 : 26
    body = `<rect width="${S}" height="${S}" rx="${r}" fill="${color}"/>` + g(24, `fill="#ffffff"`)
  } else {
    body = g(8, `fill="${color}"`) // none
  }
  return svgUrl(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${S} ${S}">${body}</svg>`)
}

// The effective preset image for a type. promptpay/bill keep their bundled bubble (Slice 1);
// social composes per-platform; email/sms/tel/wifi compose the category glyph.
export function presetLogoUrl(type: QRType, platform: SocialPlatform | undefined, style: StyleSettings): string | null {
  if (type === 'promptpay' || type === 'bill') return PROMPTPAY
  if (type === 'social') {
    const p = platform ?? 'facebook' // never null while hasPreset('social') is true
    return composeMark(SOCIAL_RAW[p], SOCIAL_BRAND[p], style)
  }
  const g = CATEGORY_RAW[type]
  return g ? composeMark(g, style.presetColor, style) : null
}

// Does this type expose a preset toggle at all?
export const hasPreset = (type: QRType): boolean =>
  type === 'promptpay' || type === 'bill' || type === 'social' ||
  type === 'email' || type === 'sms' || type === 'tel' || type === 'wifi'

// Toggle default when (re)entering a type.
export const defaultPresetOn = (type: QRType): boolean =>
  type === 'promptpay' || type === 'bill' || type === 'social'

// The single resolver: custom upload > preset > none.
export function resolveLogo(type: QRType, data: FieldData, style: StyleSettings): string | null {
  if (style.logo) return style.logo
  if (style.presetLogo) return presetLogoUrl(type, data.social.platform, style)
  return null
}
```

- [ ] **Step 2: Typecheck (expected RED at the callers — that is fine)**

Run: `npm run typecheck`
Expected: **FAIL**, only at `src/App.tsx` (imports/uses removed `defaultPresetBg`) and `src/components/LogoUploader.tsx` (calls `presetLogoUrl(type)` with the old 1-arg signature). Those are fixed in Task 4. No other file should error. If any *other* file errors, the registry/exports are wrong — fix before continuing.

- [ ] **Step 3: Read-check `composeMark`**

Confirm by inspection: `brand` → `<rect fill=color>` + white mark; `halo` → white fill+stroke path behind, colour path on top, `pad=12+presetHalo`; `none` → colour mark only. Social passes `SOCIAL_BRAND[p]`; category passes `style.presetColor`. If any branch is wrong, fix and re-check.

- [ ] **Step 4: Commit** *(only after approval; groups with Task 4 — see note)*

```bash
git add src/core/logoPreset.ts
git commit -m "feat: compose per-type preset marks (registry + composeMark)"
```

> **Execution note:** Task 3 leaves `typecheck` red on purpose (the `presetLogoUrl` signature + `defaultPresetBg` removal). **Task 4 makes it green.** If executing task-by-task with a hard green gate, run Tasks 3 and 4 back-to-back and typecheck once at the end of Task 4.

---

### Task 4: Wire the render path — App + DataCard + LogoUploader

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/components/DataCard.tsx`
- Modify: `src/components/LogoUploader.tsx`

**Interfaces:**
- Consumes: `resolveLogo`, `defaultPresetOn`, `hasPreset`, `presetLogoUrl` from `../core/logoPreset`.
- Produces: preset backing controls in the uploader; `renderStyle` forcing `logoBg='none'` for presets; history backfill.

- [ ] **Step 1: App — swap the `logoPreset` import (drop `defaultPresetBg`)**

`src/App.tsx:8` — replace:
```ts
import { defaultPresetOn, defaultPresetBg, resolveLogo } from './core/logoPreset'
```
with:
```ts
import { defaultPresetOn, resolveLogo } from './core/logoPreset'
```

- [ ] **Step 2: App — drop the `defaultPresetBg` spreads in `pickType` and `onRemoveLogo`**

`src/App.tsx:41-58` — replace both callbacks **including their leading comments** (lines 41-42 and 54) so nothing duplicates; the preset no longer needs a `logoBg` (the boundary forces `'none'`):
```ts
  // Switching type resets the preset toggle to that type's default — unless a
  // custom upload is present (custom wins, preset stays off).
  const pickType = useCallback(
    (t: QRType) => {
      setType(t)
      if (!style.logo) patchStyle({ presetLogo: defaultPresetOn(t) })
    },
    [style.logo, patchStyle],
  )

  // Deleting the custom upload restores the type's default preset.
  const onRemoveLogo = useCallback(() => {
    patchStyle({ logo: null, presetLogo: defaultPresetOn(type) })
  }, [type, patchStyle])
```

- [ ] **Step 3: App — force `logoBg='none'` for an active preset in `renderStyle`**

`src/App.tsx:77-78` — replace:
```ts
  const effLogo = useMemo(() => resolveLogo(type, data, style), [type, data, style])
  const renderStyle = useMemo(() => ({ ...style, logo: effLogo }), [style, effLogo])
```
with:
```ts
  const effLogo = useMemo(() => resolveLogo(type, data, style), [type, data, style])
  // A preset composes its own backing; force logoBg='none' so postProcess draws no extra plate.
  // A custom upload keeps the user's logoBg.
  const presetActive = !!effLogo && !style.logo
  const renderStyle = useMemo(
    () => ({ ...style, logo: effLogo, logoBg: presetActive ? ('none' as const) : style.logoBg }),
    [style, effLogo, presetActive],
  )
```

- [ ] **Step 4: App — backfill defaults when loading history (G1)**

`src/App.tsx:177-185` — in `onLoadRecent`, replace `setStyle(r.style)` with a defaults-merge so pre-Slice-2 entries gain the new fields:
```ts
  const onLoadRecent = useCallback(
    (r: RecentItem) => {
      setType(r.type)
      setData(r.data)
      setStyle({ ...defaultStyle(), ...r.style })
      showToast('โหลดค่าจากประวัติแล้ว')
    },
    [showToast],
  )
```
(`defaultStyle` is already imported at `src/App.tsx:7`.)

- [ ] **Step 5: DataCard — pass `data` to `LogoUploader`**

`src/components/DataCard.tsx:41` — replace:
```tsx
      <LogoUploader style={style} patch={patchStyle} onLogoFile={onLogoFile} onRemoveLogo={onRemoveLogo} type={type} />
```
with:
```tsx
      <LogoUploader style={style} patch={patchStyle} onLogoFile={onLogoFile} onRemoveLogo={onRemoveLogo} type={type} data={data} />
```
(`data` is already a `DataCard` prop.)

- [ ] **Step 6: LogoUploader — new imports + `PresetControls`**

`src/components/LogoUploader.tsx:1-5` — replace the import block with:
```tsx
import { useState, type ReactNode } from 'react'
import type { FieldData, LogoBg, QRType, StyleSettings } from '../core/types'
import { hasPreset, presetLogoUrl } from '../core/logoPreset'
import { SectionLabel, SegGroup, Toggle } from '../ui/controls'
import { TrashIcon, UploadIcon } from '../ui/icons'

const STYLEABLE: QRType[] = ['social', 'email', 'sms', 'tel', 'wifi']
const CATEGORY_TYPES: QRType[] = ['email', 'sms', 'tel', 'wifi']

const PLATES: { id: StyleSettings['presetPlate']; label: string }[] = [
  { id: 'brand', label: 'สีแบรนด์' },
  { id: 'halo', label: 'halo ตามรูปโลโก้' },
  { id: 'none', label: 'ไม่มี' },
]
const SHAPES: { id: StyleSettings['presetShape']; label: string }[] = [
  { id: 'square', label: 'เหลี่ยม' },
  { id: 'rounded', label: 'มน' },
  { id: 'circle', label: 'วงกลม' },
]

// Logo-size slider — shared by styleable presets AND promptpay/bill (whose only
// styling is size). Kept separate from LogoControls, which also renders the now-dead
// logoBg/padding pickers (an active preset forces logoBg='none' at the App boundary).
function SizeSlider({ style, patch }: { style: StyleSettings; patch: (p: Partial<StyleSettings>) => void }) {
  return (
    <div className="mt-4">
      <div className="mb-1.5 flex justify-between text-[12.5px] font-bold text-[#6b7280]">
        <span>ขนาดโลโก้</span>
        <span className="font-mono text-[#9ca3af]">{Math.round(style.logoSize * 100)}%</span>
      </div>
      <input type="range" min={5} max={60} value={Math.round(style.logoSize * 100)} onChange={(e) => patch({ logoSize: +e.target.value / 100 })} className="w-full" />
    </div>
  )
}

// Backing controls for a styleable preset (social / email / sms / tel / wifi).
function PresetControls({ style, patch, isCategory }: { style: StyleSettings; patch: (p: Partial<StyleSettings>) => void; isCategory: boolean }) {
  return (
    <>
      <div className="mt-4">
        <SectionLabel>แผ่นรอง</SectionLabel>
        <SegGroup options={PLATES} value={style.presetPlate} onChange={(v) => patch({ presetPlate: v })} />
      </div>

      {style.presetPlate === 'brand' && (
        <div className="mt-4">
          <SectionLabel>รูปทรง</SectionLabel>
          <SegGroup options={SHAPES} value={style.presetShape} onChange={(v) => patch({ presetShape: v })} />
        </div>
      )}

      {style.presetPlate === 'halo' && (
        <div className="mt-4">
          <div className="mb-1.5 flex justify-between text-[12.5px] font-bold text-[#6b7280]">
            <span>ความหนา halo</span>
            <span className="font-mono text-[#9ca3af]">{style.presetHalo}</span>
          </div>
          <input type="range" min={6} max={24} step={0.5} value={style.presetHalo} onChange={(e) => patch({ presetHalo: +e.target.value })} className="w-full" />
        </div>
      )}

      {isCategory && (
        <div className="mt-4">
          <div className="mb-2 text-[12.5px] font-bold text-[#6b7280]">สีไอคอน</div>
          <input type="color" value={style.presetColor} onChange={(e) => patch({ presetColor: e.target.value })} className="h-9 w-16 cursor-pointer rounded-[8px] border border-[#e6e7ee] bg-white" />
        </div>
      )}

      <SizeSlider style={style} patch={patch} />
    </>
  )
}
```
(`LogoControls` stays as-is — it's still used by the custom-upload branch.)

- [ ] **Step 7: LogoUploader — accept `data`, thread the platform, gate on `STYLEABLE`**

`src/components/LogoUploader.tsx:90-104` — replace the component signature + the two derived lines with:
```tsx
export function LogoUploader({
  style,
  patch,
  onLogoFile,
  onRemoveLogo,
  type,
  data,
}: {
  style: StyleSettings
  patch: (p: Partial<StyleSettings>) => void
  onLogoFile: (f: File) => void
  onRemoveLogo: () => void
  type: QRType
  data: FieldData
}) {
  const hasLogo = !!style.logo
  const styleable = STYLEABLE.includes(type)
  const presetUrl = presetLogoUrl(type, data.social.platform, style) // promptpay/bill ignore the platform
```

- [ ] **Step 8: LogoUploader — branch 2 uses `hasPreset` + `PresetControls` for styleable types**

`src/components/LogoUploader.tsx:130-156` — replace the `if (presetUrl) { … }` block (branch 2) with:
```tsx
  // 2) No custom upload, but this type has a preset — show the toggle.
  if (hasPreset(type)) {
    return (
      <div>
        <SectionLabel>โลโก้กลาง QR (ไม่บังคับ)</SectionLabel>
        <label className="mb-4 flex cursor-pointer items-center gap-3">
          <Toggle on={style.presetLogo} onChange={(v) => patch({ presetLogo: v })} />
          <span className="text-[13.5px] font-bold text-[#374151]">ใช้โลโก้ประจำชนิด</span>
        </label>

        {style.presetLogo ? (
          <>
            <div className="mb-4 flex items-center gap-3">
              <img src={presetUrl!} alt="preset logo" className="h-14 w-14 rounded-[12px] border border-[#e6e7ee] bg-white object-contain p-1.5" />
              <div className="min-w-0 flex-1 text-[11.5px] text-[#9ca3af]">โลโก้ประจำชนิดถูกฝังไว้ · อัปโหลดรูปเองด้านล่างเพื่อใช้แทน</div>
            </div>
            {styleable ? (
              <PresetControls style={style} patch={patch} isCategory={CATEGORY_TYPES.includes(type)} />
            ) : (
              <SizeSlider style={style} patch={patch} /> /* promptpay/bill: size only (spec §8) */
            )}
            <div className="mt-4">
              <Dropzone onLogoFile={onLogoFile} label="อัปโหลดโลโก้เองแทน" />
            </div>
          </>
        ) : (
          <Dropzone onLogoFile={onLogoFile} />
        )}
      </div>
    )
  }
```
(promptpay/bill are `hasPreset` but NOT `styleable` → they show the toggle + preview + dropzone only, no `PresetControls`. Branches 1 (custom upload) and 3 (no preset) are unchanged.)

- [ ] **Step 9: Typecheck**

Run: `npm run typecheck`
Expected: **PASS** (Task 3's red is now resolved — `presetLogoUrl` 3-arg calls, `data` prop threaded, `defaultPresetBg` gone).

- [ ] **Step 10: Browser (`npm run dev`, DPR=2)**

1. **social**: pick "โซเชียล" → PromptPay-style mark is OFF; toggle "ใช้โลโก้ประจำชนิด" is **ON by default**, the platform's brand mark shows centered (brand chip, rounded). Change platform (Instagram→X→LINE→Snapchat) → mark + chip colour update; Snapchat = yellow chip + white ghost (readable). ECC in QrPanel locked **H**.
2. Switch **แผ่นรอง** → `halo`: white halo hugs the mark; drag **ความหนา halo** 6→24 → halo grows, never a square. → `ไม่มี`: raw mark, no backing.
3. **รูปทรง** (brand mode): เหลี่ยม / มน / วงกลม change the chip.
4. **email/sms/tel/wifi**: toggle is **OFF** by default; turn on → category glyph shows; **สีไอคอน** picker recolours it (social has no colour picker).
5. **custom override**: on social, upload an image → preset toggle flips off, custom shows, ECC H; click **ลบ** → social preset returns (default-on).
6. **promptpay / bill**: toggle + PromptPay preview + size + dropzone only — **no** แผ่นรอง/รูปทรง/halo/สี controls.
7. **url / text / vcard / geo**: plain dropzone, unchanged.

- [ ] **Step 11: Commit** *(only after approval)*

```bash
git add src/App.tsx src/components/DataCard.tsx src/components/LogoUploader.tsx
git commit -m "feat: wire preset backing controls + logoBg='none' boundary + history backfill"
```

---

### Task 5: History thumbnails — `src/components/HistoryPopover.tsx`

**Files:**
- Modify: `src/components/HistoryPopover.tsx` (`thumbSvg`)

**Interfaces:**
- Consumes: `resolveLogo` (already imported).

- [ ] **Step 1: Force `logoBg='none'` + backfill fields in `thumbSvg`**

`src/components/HistoryPopover.tsx:16-18` — replace:
```ts
    const logo = resolveLogo(item.type, item.data, item.style)
    const ecc = logo ? 'H' : item.style.ecc
    const st = { ...item.style, logo, frameStyle: 'none' as const, size: 116, margin: 2 }
```
with:
```ts
    const logo = resolveLogo(item.type, item.data, item.style)
    const presetActive = !!logo && !item.style.logo
    const ecc = logo ? 'H' : item.style.ecc
    // Presets compose their own backing → force logoBg='none' (else a second plate boxes the mark).
    const st = { ...item.style, logo, logoBg: presetActive ? ('none' as const) : item.style.logoBg, frameStyle: 'none' as const, size: 116, margin: 2 }
```
(The `createMatrix(payload, ecc)` + `renderQrSvg(payload, ecc, st, 116, matrix.size)` tail is unchanged. Old entries are safe without a field backfill here: pre-Slice-2 the only preset that ever saved `presetLogo:true` was promptpay/bill, and `presetLogoUrl` returns the fixed PROMPTPAY for those — it never reads the new fields. Any social/category preset entry is necessarily new and carries the fields.)

- [ ] **Step 2: Typecheck**

Run: `npm run typecheck`
Expected: **PASS.**

- [ ] **Step 3: Browser (`npm run dev`, DPR=2)**

Make a social QR (preset on) → Save/Copy so it enters history → open the history popover → its 46px thumbnail shows the brand mark cleanly (no boxed white). A plain `url` QR thumbnail has no logo.

- [ ] **Step 4: Commit** *(only after approval)*

```bash
git add src/components/HistoryPopover.tsx
git commit -m "feat: resolve preset marks in history thumbnails (logoBg='none')"
```

---

### Task 6: Final verification + scannability cap

**Files:** none (verification), unless the cap needs lowering.

- [ ] **Step 1: Build**

Run: `npm run build`
Expected: `tsc -b` + `vite build` clean.

- [ ] **Step 2: Worst-case export + decode (the flagged risk, spec §11 / G4)**

`npm run dev`, DPR=2. On a **social** QR with a realistic value:
- Set `presetPlate='halo'`, **`ความหนา halo = 24`**, and drag **ขนาดโลโก้ to 60%**.
- Confirm the on-screen scan-check ("ตรวจแล้วสแกน…") stays **green** (`decodeRendered` re-decodes `renderStyle`).
- **Save PNG** and confirm the downloaded PNG shows the mark + is not blank/tainted.
- Repeat with `presetPlate='brand'` at size 60%.

- [ ] **Step 3: If worst-case decode FAILS, lower the halo cap**

If step 2's scan-check goes red at halo 24 + size 60%, reduce the slider `max` in `LogoUploader.tsx` `PresetControls` (`max={24}`) to the largest value that decodes at 60% (e.g. 16), and re-verify step 2. Note the chosen cap here: `presetHalo` max = **____**.

- [ ] **Step 4: Regression sweep**

Switch through **every** type once (url/text/email/sms/tel/wifi/vcard/geo/social/promptpay/bill): no console errors; non-preset types behave exactly as before; promptpay/bill still show their PromptPay bubble (Slice 1 look intact).

- [ ] **Step 5: Commit** *(only after approval; if step 3 changed the cap)*

```bash
git add src/components/LogoUploader.tsx
git commit -m "fix: cap preset halo thickness to the scannable maximum"
```

---

## Final verification (after all tasks)

- [ ] `npm run build` clean.
- [ ] All 17 social platforms render a non-blank mark; all 4 category glyphs render; each `presetPlate`/`presetShape`/halo/colour control behaves per Task 4 Step 10.
- [ ] Worst-case (size 60% + halo max) decodes green and PNG-exports with the mark (Task 6).
- [ ] promptpay/bill + url/text/vcard/geo unchanged.
- [ ] Update `TASK.md`: move the Slice 2 item to `✅ Done` with the touched files.

## Spec coverage check

- Data model (`presetPlate/presetShape/presetHalo/presetColor` + defaults) → Task 2. ✅
- Assets (17 social + 4 category) → Task 1. ✅
- Registry + `composeMark` (brand/halo/none) + `presetLogoUrl(type,platform,style)` + `hasPreset`/`defaultPresetOn` + retire `defaultPresetBg` → Task 3. ✅
- App boundary (`logoBg='none'` for presets, social default-on via `defaultPresetOn`, history backfill) → Task 4. ✅
- UI controls gated on `STYLEABLE`; promptpay/bill bare toggle → Task 4. ✅
- `DataCard` passes `data` (B1) → Task 4. ✅
- History thumbnails force `logoBg='none'` (§9) → Task 5. ✅
- Scannability cap (G4) → Task 6. ✅
- Pipeline unchanged (render/export/verify/payloads) → enforced by Global Constraints; no task touches them. ✅
