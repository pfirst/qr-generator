# Preset (per-type) center logo — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an opt-in/auto "preset center logo per QR type", wired (Slice 1) to promptpay & bill using the bundled PromptPay SVG, with a custom upload always overriding the preset.

**Architecture:** One pure resolver, `resolveLogo(type, data, style)`, picks the effective center image (custom upload > preset > none). The App computes a derived `renderStyle = { ...style, logo: effLogo }` and feeds it to the existing render/export/verify pipeline, so the "spine" (`core/render.ts`, `core/export.ts`, `core/verify.ts`) is **not modified** — its `style.logo` contract is preserved. State gains a single boolean `presetLogo`.

**Tech Stack:** Vite + React 19 + TypeScript + Tailwind v4, `qr-code-styling`. Spec: `docs/superpowers/specs/2026-06-30-preset-logo-design.md`.

## Global Constraints

- **Client-only:** no network calls for QR generation. Presets are bundled assets imported at build time (`?raw`). (CLAUDE.md product promise.)
- **Pipeline contract unchanged:** `core/render.ts`, `core/export.ts`, `core/verify.ts`, `core/payloads.ts`, `recent.ts` must NOT change their `style.logo` reads. Resolve at the App boundary only.
- **Precedence:** custom upload **>** preset **>** none. Uploading sets `presetLogo = false`; deleting the custom restores `presetLogo` to the type's default.
- **Defaults:** `presetLogo` default **ON** for `promptpay` & `bill`, **OFF** for everything else. promptpay/bill preset uses `logoBg = 'none'`.
- **ECC:** any effective center image (custom OR preset) forces ECC = `H`.
- **Slice 1 only:** wire `promptpay` & `bill` (asset `QR_PP.svg`). `social/email/sms/tel/wifi` have no asset yet → `presetLogoUrl` returns `null`, `hasPreset` is false, and the toggle does not appear for them. Do NOT add their artwork here (Slice 2, with the logo discussion).
- **UI text is Thai.**
- **No test runner exists** (`package.json` has no `test` script). Each task's gate is `npm run typecheck` (must be clean) **plus** the stated in-browser check. View in Chrome at Retina **DPR=2** (project convention) via `npm run dev`.
- **Commits:** per CLAUDE.md, commit ONLY when พี่เฟิส asks. The `git commit` step in each task documents the intended grouping — **run it only after พี่เฟิส approves committing** (otherwise just leave the working tree staged/unstaged and move on).

---

### Task 1: Asset + core resolver + state field

**Files:**
- Create: `src/assets/preset-logos/promptpay.svg` (copy of `/Users/pfirst/Downloads/QR_PP.svg`)
- Create: `src/core/logoPreset.ts`
- Modify: `src/core/types.ts` (`StyleSettings` + `defaultStyle()`)

**Interfaces:**
- Consumes: `FieldData`, `QRType`, `SocialPlatform`, `StyleSettings`, `LogoBg` from `./types`.
- Produces (used by Tasks 2–4):
  - `presetLogoUrl(type: QRType, platform?: SocialPlatform): string | null`
  - `hasPreset(type: QRType): boolean`
  - `defaultPresetOn(type: QRType): boolean`
  - `defaultPresetBg(type: QRType): LogoBg`
  - `resolveLogo(type: QRType, data: FieldData, style: StyleSettings): string | null`
  - `StyleSettings.presetLogo: boolean`

- [ ] **Step 1: Copy the asset**

```bash
mkdir -p /Users/pfirst/AI/qr-generator/src/assets/preset-logos
cp /Users/pfirst/Downloads/QR_PP.svg /Users/pfirst/AI/qr-generator/src/assets/preset-logos/promptpay.svg
```

- [ ] **Step 2: Add `presetLogo` to `StyleSettings`**

In `src/core/types.ts`, add the field right after `logoPadding` in the `StyleSettings` interface:

```ts
  logoPadding: number // white plate padding around the logo, fraction of logo side
  presetLogo: boolean // show the type's built-in preset logo (custom upload overrides it)
```

- [ ] **Step 3: Add `presetLogo` to `defaultStyle()`**

In `src/core/types.ts`, in `defaultStyle()`, add right after `logoPadding: 0.12,`:

```ts
  logoPadding: 0.12,
  presetLogo: false,
```

(Default type is `url`, which has no preset; the App sets it true when entering promptpay/bill — Task 2.)

- [ ] **Step 4: Create the resolver module**

Create `src/core/logoPreset.ts` with exactly:

```ts
// Preset (per-type) center logos. UI-agnostic. The resolver decides the
// effective center image for the render pipeline; custom upload always wins.
import type { FieldData, LogoBg, QRType, SocialPlatform, StyleSettings } from './types'
import promptpayRaw from '../assets/preset-logos/promptpay.svg?raw'

// SVG string -> data URL. utf8-encode (not btoa) to avoid unicode pitfalls.
const svgUrl = (raw: string): string => `data:image/svg+xml,${encodeURIComponent(raw)}`
const PROMPTPAY = svgUrl(promptpayRaw)

// Slice 1: only promptpay/bill have an asset. The other preset types
// (social/email/sms/tel/wifi) return null until Slice 2 supplies artwork.
export function presetLogoUrl(type: QRType, _platform?: SocialPlatform): string | null {
  switch (type) {
    case 'promptpay':
    case 'bill':
      return PROMPTPAY
    default:
      return null
  }
}

// Does this type expose a preset toggle at all? (Slice 1: promptpay/bill only.)
export const hasPreset = (type: QRType): boolean => presetLogoUrl(type) !== null

// Toggle default when (re)entering a type.
export const defaultPresetOn = (type: QRType): boolean => type === 'promptpay' || type === 'bill'

// Plate default when a preset turns on (the PromptPay mark has its own white backing).
export const defaultPresetBg = (type: QRType): LogoBg =>
  type === 'promptpay' || type === 'bill' ? 'none' : 'square'

// The single resolver: custom upload > preset > none.
export function resolveLogo(type: QRType, data: FieldData, style: StyleSettings): string | null {
  if (style.logo) return style.logo
  if (style.presetLogo) return presetLogoUrl(type, data.social.platform)
  return null
}
```

- [ ] **Step 5: Typecheck**

Run: `npm run typecheck`
Expected: PASS, no errors. (Confirms the `?raw` import resolves and the new field/type are consistent.)

- [ ] **Step 6: Sanity-check the resolver logic by reading it**

Confirm by inspection (no test runner): with `style.logo` set → returns it regardless of `presetLogo`; with `style.logo` null and `presetLogo` true and `type==='promptpay'` → returns the PromptPay data URL; with `type==='url'` → null. If any branch is wrong, fix and re-run Step 5.

- [ ] **Step 7: Commit** *(run only when พี่เฟิส approves committing)*

```bash
git add src/assets/preset-logos/promptpay.svg src/core/logoPreset.ts src/core/types.ts
git commit -m "feat: preset-logo resolver + promptpay asset (core)"
```

---

### Task 2: Wire the App boundary (effective logo into the pipeline)

**Files:**
- Modify: `src/App.tsx`

**Interfaces:**
- Consumes: `resolveLogo`, `defaultPresetOn`, `defaultPresetBg` from `./core/logoPreset`.
- Produces (used by Tasks 3–4): `onRemoveLogo: () => void` and `pickType: (t: QRType) => void` passed into `DataCard`; `renderStyle` fed to `QrPanel`.

- [ ] **Step 1: Import the resolver helpers**

In `src/App.tsx`, after the `./core/types` import (line ~7), add:

```ts
import { defaultPresetOn, defaultPresetBg, resolveLogo } from './core/logoPreset'
```

- [ ] **Step 2: Add `presetLogo: false` to the upload patch**

In `onLogoFile`, change the patch so the preset visibly switches off on upload:

```ts
        patchStyle({ logo: String(reader.result), ecc: 'H' as Ecc, presetLogo: false })
```

- [ ] **Step 3: Add `pickType` and `onRemoveLogo` callbacks**

In `src/App.tsx`, right after the `patchStyle` definition, add:

```ts
  // Switching type resets the preset toggle to that type's default — unless a
  // custom upload is present (custom wins, preset stays off).
  const pickType = useCallback(
    (t: QRType) => {
      setType(t)
      if (!style.logo) {
        const on = defaultPresetOn(t)
        patchStyle({ presetLogo: on, ...(on ? { logoBg: defaultPresetBg(t) } : {}) })
      }
    },
    [style.logo, patchStyle],
  )

  // Deleting the custom upload restores the type's default preset.
  const onRemoveLogo = useCallback(() => {
    const on = defaultPresetOn(type)
    patchStyle({ logo: null, presetLogo: on, ...(on ? { logoBg: defaultPresetBg(type) } : {}) })
  }, [type, patchStyle])
```

(`type` is referenced before its `useState` in source order? No — `type`/`setType`/`style`/`patchStyle` are all declared above the patch helpers, so this is fine.)

- [ ] **Step 4: Replace the `effEcc` line with the effective-logo derivation**

In `src/App.tsx`, replace the single line:

```ts
  const effEcc: Ecc = style.logo ? 'H' : style.ecc
```

with:

```ts
  const effLogo = useMemo(() => resolveLogo(type, data, style), [type, data, style])
  const renderStyle = useMemo(() => ({ ...style, logo: effLogo }), [style, effLogo])
  const effEcc: Ecc = effLogo ? 'H' : style.ecc
```

- [ ] **Step 5: Feed `renderStyle` to the render effect**

In the `useEffect` that calls `renderQrSvg`, change the call and its dep array:

```ts
    renderQrSvg(renderInput.data, renderInput.ecc, renderStyle, renderStyle.size, renderInput.count)
      .then((s) => !cancelled && setSvg(s))
      .catch(() => !cancelled && setSvg(null))
    return () => {
      cancelled = true
    }
  }, [renderInput, renderStyle])
```

- [ ] **Step 6: Feed `renderStyle` to the decode check**

In the decode `useEffect`, change the call and dep array:

```ts
      decodeRendered(renderInput, renderStyle)
        .then((res) => !cancelled && setDecodeOk(res !== null))
        .catch(() => !cancelled && setDecodeOk(null))
```
and the dep array of that effect to `[renderInput, renderStyle]`.

- [ ] **Step 7: Feed `renderStyle` to export / copy / print**

- `runExport`: `await downloadQR(renderInput, renderStyle, exportSize, fmt, type)` — and change `style` → `renderStyle` in its `useCallback` dep array.
- `onCopy`: `await copyQRToClipboard(renderInput, renderStyle, exportSize)` — dep `style` → `renderStyle`.
- `onPrint`: `await printQR(renderInput, renderStyle, exportSize)` — dep `style` → `renderStyle`.

Leave `recordRecent`/`pushRecent(r, type, data, style)` and `contrastScan(style)` on the **raw** `style` (unchanged).

- [ ] **Step 8: Pass `pickType`, `renderStyle`, and `onRemoveLogo` to children**

- In the `<DataCard … />`: change `onPickType={setType}` → `onPickType={pickType}`, and add `onRemoveLogo={onRemoveLogo}`.
- In the `<QrPanel … />`: change `style={style}` → `style={renderStyle}` (so its `hasLogo` ECC-lock + reset see the preset).

(`DataCard` will not accept `onRemoveLogo` until Task 3 adds the prop — typecheck will flag it. That is expected; finish Task 3 before the Step-9 gate, or temporarily expect the error here. To keep this task independently green, add the `onRemoveLogo` prop to `DataCard`'s type in Task 3 Step 1 first if executing strictly task-by-task — see note below.)

> **Execution note:** Tasks 2 and 3 share the `DataCard`↔`LogoUploader` prop seam. If running strictly one task at a time with a typecheck gate, do Task 3 Step 1 (DataCard prop) immediately before Task 2 Step 8, or run Tasks 2 and 3 together and typecheck once. The committed grouping below assumes they land together.

- [ ] **Step 9: Typecheck + browser**

Run: `npm run typecheck` — expected PASS (after Task 3's DataCard prop exists).
Browser (`npm run dev`, DPR=2): pick **promptpay** → the PromptPay logo appears centered automatically; the ECC control in QrPanel shows locked **H**. Pick **url** → no logo, ECC unlocked.

- [ ] **Step 10: Commit** *(run only when พี่เฟิส approves committing)*

```bash
git add src/App.tsx
git commit -m "feat: resolve effective center logo at the App boundary"
```

---

### Task 3: LogoUploader preset toggle + DataCard pass-through

**Files:**
- Modify: `src/components/DataCard.tsx`
- Modify: `src/components/LogoUploader.tsx` (rewrite)

**Interfaces:**
- Consumes: `hasPreset`, `presetLogoUrl` from `../core/logoPreset`; `Toggle` from `../ui/controls`; `onRemoveLogo`, `type` from props.
- Produces: a `LogoUploader` that shows the preset switch for `hasPreset(type)` types.

- [ ] **Step 1: Thread `onRemoveLogo` + `type` through `DataCard`**

In `src/components/DataCard.tsx`, add `onRemoveLogo` to the prop type and destructure, then pass `type` + `onRemoveLogo` into `LogoUploader`:

```tsx
export function DataCard({
  type,
  onPickType,
  data,
  errors,
  setData,
  setIn,
  style,
  patchStyle,
  onLogoFile,
  onRemoveLogo,
}: {
  type: QRType
  onPickType: (t: QRType) => void
  data: FieldData
  errors: FieldErrors
  setData: (partial: Partial<FieldData>) => void
  setIn: <K extends keyof FieldData>(key: K, value: FieldData[K]) => void
  style: StyleSettings
  patchStyle: (p: Partial<StyleSettings>) => void
  onLogoFile: (f: File) => void
  onRemoveLogo: () => void
}) {
```

and the JSX line:

```tsx
      <LogoUploader style={style} patch={patchStyle} onLogoFile={onLogoFile} onRemoveLogo={onRemoveLogo} type={type} />
```

- [ ] **Step 2: Rewrite `LogoUploader.tsx`**

Replace the entire contents of `src/components/LogoUploader.tsx` with:

```tsx
import { useRef, useState, type ReactNode } from 'react'
import type { LogoBg, QRType, StyleSettings } from '../core/types'
import { hasPreset, presetLogoUrl } from '../core/logoPreset'
import { SectionLabel, SegGroup, Toggle } from '../ui/controls'
import { TrashIcon, UploadIcon } from '../ui/icons'

const LOGO_BGS: { id: LogoBg; label: string }[] = [
  { id: 'none', label: 'ไม่มี' },
  { id: 'square', label: 'สี่เหลี่ยม' },
  { id: 'rounded', label: 'มน' },
  { id: 'circle', label: 'วงกลม' },
]

// Size / background / padding controls — shared by custom upload AND preset.
function LogoControls({ style, patch }: { style: StyleSettings; patch: (p: Partial<StyleSettings>) => void }) {
  return (
    <>
      <div className="mb-1.5 flex justify-between text-[12.5px] font-bold text-[#6b7280]">
        <span>ขนาดโลโก้</span>
        <span className="font-mono text-[#9ca3af]">{Math.round(style.logoSize * 100)}%</span>
      </div>
      <input type="range" min={10} max={45} value={Math.round(style.logoSize * 100)} onChange={(e) => patch({ logoSize: +e.target.value / 100 })} className="w-full" />

      <div className="mt-4">
        <SectionLabel>พื้นหลังโลโก้</SectionLabel>
        <SegGroup options={LOGO_BGS} value={style.logoBg} onChange={(v) => patch({ logoBg: v })} />
      </div>

      {style.logoBg !== 'none' && (
        <div className="mt-4">
          <div className="mb-1.5 flex justify-between text-[12.5px] font-bold text-[#6b7280]">
            <span>ระยะขอบแผ่นรอง</span>
            <span className="font-mono text-[#9ca3af]">{Math.round(style.logoPadding * 100)}%</span>
          </div>
          <input type="range" min={0} max={40} value={Math.round(style.logoPadding * 100)} onChange={(e) => patch({ logoPadding: +e.target.value / 100 })} className="w-full" />
        </div>
      )}
    </>
  )
}

// Drag-and-drop / click file picker.
function Dropzone({ onLogoFile, label }: { onLogoFile: (f: File) => void; label?: ReactNode }) {
  const [drag, setDrag] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  function pick(files: FileList | null) {
    const f = files?.[0]
    if (f && f.type.startsWith('image/')) onLogoFile(f)
  }
  return (
    <label
      onDragOver={(e) => {
        e.preventDefault()
        setDrag(true)
      }}
      onDragLeave={() => setDrag(false)}
      onDrop={(e) => {
        e.preventDefault()
        setDrag(false)
        pick(e.dataTransfer.files)
      }}
      className={
        'flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-[16px] border-[1.5px] border-dashed px-4 py-7 text-center transition ' +
        (drag ? 'border-[#7c3aed] bg-[#ede9fe]/60' : 'border-[#d8dae2] bg-[#fafbfd] hover:border-[#c4b5fd] hover:bg-[#faf8ff]')
      }
    >
      <span className="grid h-10 w-10 place-items-center rounded-full bg-[#ede9fe] text-[#7c3aed]">
        <UploadIcon size={19} />
      </span>
      <span className="mt-1 text-[13.5px] font-bold text-[#374151]">
        {label ?? (
          <>
            ลากรูปมาวาง <span className="text-[#7c3aed]">หรือคลิกเลือก</span>
          </>
        )}
      </span>
      <span className="text-[11.5px] text-[#9ca3af]">PNG · JPG · SVG · WEBP</span>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          pick(e.target.files)
          e.target.value = ''
        }}
      />
    </label>
  )
}

export function LogoUploader({
  style,
  patch,
  onLogoFile,
  onRemoveLogo,
  type,
}: {
  style: StyleSettings
  patch: (p: Partial<StyleSettings>) => void
  onLogoFile: (f: File) => void
  onRemoveLogo: () => void
  type: QRType
}) {
  const hasLogo = !!style.logo
  const presetUrl = presetLogoUrl(type)

  // 1) Custom upload present — overrides any preset.
  if (hasLogo) {
    return (
      <div>
        <SectionLabel>โลโก้กลาง QR</SectionLabel>
        <div className="mb-4 flex items-center gap-3">
          <img src={style.logo!} alt="logo" className="h-14 w-14 rounded-[12px] border border-[#e6e7ee] bg-white object-contain p-1.5" />
          <div className="min-w-0 flex-1">
            <div className="text-[13px] font-bold text-[#111827]">โลโก้ถูกฝังแล้ว</div>
            <div className="text-[11.5px] text-[#9ca3af]">ระดับ EC ถูกตั้งเป็น H อัตโนมัติเพื่อความชัด</div>
          </div>
          <button
            onClick={onRemoveLogo}
            className="flex items-center gap-1.5 rounded-[11px] border border-[#fbd5d5] bg-[#fef2f2] px-3 py-2 text-[12.5px] font-bold text-[#ef4444] transition hover:bg-[#fee2e2]"
          >
            <TrashIcon size={14} />
            ลบ
          </button>
        </div>
        <LogoControls style={style} patch={patch} />
      </div>
    )
  }

  // 2) No custom upload, but this type has a preset — show the toggle.
  if (presetUrl && hasPreset(type)) {
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
              <img src={presetUrl} alt="preset logo" className="h-14 w-14 rounded-[12px] border border-[#e6e7ee] bg-white object-contain p-1.5" />
              <div className="min-w-0 flex-1 text-[11.5px] text-[#9ca3af]">โลโก้ประจำชนิดถูกฝังไว้ · อัปโหลดรูปเองด้านล่างเพื่อใช้แทน</div>
            </div>
            <LogoControls style={style} patch={patch} />
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

  // 3) No preset for this type — plain dropzone (unchanged behaviour).
  return (
    <div>
      <SectionLabel>โลโก้กลาง QR (ไม่บังคับ)</SectionLabel>
      <Dropzone onLogoFile={onLogoFile} />
    </div>
  )
}
```

- [ ] **Step 3: Typecheck**

Run: `npm run typecheck`
Expected: PASS (Task 2's `<DataCard onRemoveLogo=… />` now resolves).

- [ ] **Step 4: Browser verification**

`npm run dev`, DPR=2:
1. **promptpay**: switch "ใช้โลโก้ประจำชนิด" is ON by default; PromptPay logo shows; size/bg/padding sliders work.
2. Toggle OFF → logo disappears, dropzone shows, ECC unlocks.
3. **bill**: same default-ON PromptPay logo.
4. Upload a custom image on promptpay → preset switch flips OFF, custom logo shows, ECC = H.
5. Click ลบ on the custom → PromptPay preset returns (default-on type).
6. **url / text / vcard / geo**: no switch, plain dropzone (unchanged).

- [ ] **Step 5: Commit** *(run only when พี่เฟิส approves committing)*

```bash
git add src/components/DataCard.tsx src/components/LogoUploader.tsx
git commit -m "feat: preset-logo toggle in the logo uploader"
```

---

### Task 4: History thumbnails resolve the preset

**Files:**
- Modify: `src/components/HistoryPopover.tsx` (`thumbSvg`)

**Interfaces:**
- Consumes: `resolveLogo` from `../core/logoPreset`.

- [ ] **Step 1: Import the resolver**

In `src/components/HistoryPopover.tsx`, add to the imports:

```ts
import { resolveLogo } from '../core/logoPreset'
```

- [ ] **Step 2: Resolve the effective logo in `thumbSvg`**

Replace the body of `thumbSvg` between `if (!payload) return null` and the `try`'s `return` with:

```ts
    const payload = buildPayload(item.type, item.data)
    if (!payload) return null
    // Render the saved appearance, but drop the CTA frame (illegible at 46px) and
    // tighten the quiet zone so the QR fills the thumbnail. Resolve the preset the
    // same way the live preview does, so preset logos show in the thumbnail too.
    const logo = resolveLogo(item.type, item.data, item.style)
    const ecc = logo ? 'H' : item.style.ecc
    const st = { ...item.style, logo, frameStyle: 'none' as const, size: 116, margin: 2 }
    const matrix = createMatrix(payload, ecc)
    return await renderQrSvg(payload, ecc, st, 116, matrix.size)
```

- [ ] **Step 3: Typecheck**

Run: `npm run typecheck`
Expected: PASS.

- [ ] **Step 4: Browser verification**

`npm run dev`, DPR=2: make a promptpay QR (preset on) → Save/Copy so it enters history → open the history popover → its 46px thumbnail shows the PromptPay logo. Make a plain url QR → its thumbnail has no logo.

- [ ] **Step 5: Commit** *(run only when พี่เฟิส approves committing)*

```bash
git add src/components/HistoryPopover.tsx
git commit -m "feat: resolve preset logo in history thumbnails"
```

---

## Final verification (after all tasks)

- [ ] `npm run build` (runs `tsc -b` then `vite build`) — clean.
- [ ] **Export + decode** (the one flagged risk — SVG-in-SVG rasterisation): on a promptpay QR with the preset, **Save PNG** and confirm (a) the downloaded PNG shows the PromptPay logo, and (b) the on-screen "scan check" stays green (`decodeRendered` re-decodes the rasterised QR). If the PNG is missing the logo on any browser, switch the asset path: rasterise `promptpayRaw` to a PNG data URL once at module load in `logoPreset.ts` and return that from `presetLogoUrl` instead of the SVG data URL. (Re-verify after.)
- [ ] Switch through all types once — no console errors; non-preset types behave exactly as before.

## Spec coverage check

- Data model (`presetLogo`, defaultStyle) → Task 1. ✅
- Resolver + registry + defaults → Task 1. ✅
- Asset bundling → Task 1. ✅
- App boundary (renderStyle, effEcc, pickType, onLogoFile, onRemoveLogo, pass-through) → Task 2. ✅
- Pipeline unchanged (render/export/verify/payloads/recent) → enforced by Global Constraints; no task modifies them. ✅
- UI toggle (3 states; switch only for hasPreset types) → Task 3. ✅
- History thumbnails → Task 4. ✅
- Export-rasterisation risk → Final verification. ✅
- Slice-2 scope (social/email/sms/tel/wifi artwork) → explicitly out of scope. ✅
