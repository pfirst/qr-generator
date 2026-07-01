# Spec — Move logo styling into a "โลโก้" toolbar tab

**Date:** 2026-07-01
**Status:** Approved (design), ready for implementation

## Goal

Move the logo *styling* controls out of the left-hand `LogoUploader` card and into a
new **"โลโก้"** tab in the QR-customization toolbar (`QrPanel`). The tab icon appears
only when a logo is effectively present on the QR, animating in/out. The left card keeps
only the "add / remove / swap logo" affordances.

This is a UI reorganization. No change to the render/export/verify pipeline, payload
building, or preset compositing logic.

## Current state

- **Toolbar** (`src/components/QrPanel.tsx`): floating icon pill with tabs
  `สี · กรอบตา · จุดตา · จุด · กรอบ · ขั้นสูง` (`TabId = 'color' | 'border' | 'center' | 'cells' | 'cta' | 'adv'`).
  Shape tabs (`border/center/cells`) use an anchored dropdown; the rest use a centred popup.
  `QrPanel` receives `style={renderStyle}` (the *effective* style from `App`).
- **Logo styling** lives in `src/components/LogoUploader.tsx` (rendered inside `DataCard`,
  left column). It receives the **real** `style`, `patch`, `type`, `data`. Three control sets:
  - `LogoControls` (custom upload): ขนาดโลโก้ · พื้นหลังโลโก้ · ระยะขอบแผ่นรอง.
  - `PresetControls` (styleable preset — `social/email/sms/tel/wifi`): แผ่นรอง · รูปทรง · ความหนากรอบ · สีไอคอน (category only) · ขนาด.
  - `SizeSlider` (promptpay/bill preset): ขนาดโลโก้ only.
  Plus the upload/toggle/preview/delete affordances.

## Target behaviour

1. **New toolbar tab `logo`**, inserted **before `cta`**:
   order becomes `สี · กรอบตา · จุดตา · จุด · โลโก้ · กรอบ · ขั้นสูง`.
   Uses the **centred popup** (not the shape dropdown).
2. **Icon visibility:** shown only when an *effective* logo is present — i.e. a custom
   upload OR a preset toggled on. In `QrPanel` this is `!!style.logo` because `style` is
   `renderStyle` and `renderStyle.logo === effLogo`.
3. **Popup contents:** the same three control sets, chosen by context (moved verbatim):
   - custom upload (real `style.logo` truthy) → `LogoControls`
   - styleable preset → `PresetControls` (with `isCategory` for the สีไอคอน picker)
   - promptpay/bill preset → `SizeSlider` only
4. **Left card (`LogoUploader`) keeps only:** section label, preset toggle
   ("ใช้โลโก้ประจำชนิด"), embedded/preset preview, delete button, dropzone. The three
   styling control sets are removed from here.
5. **No auto-open:** adding a logo makes the icon appear only; it does not open the popup.
6. **Animation:** icon grows in / collapses out (width `0↔44px` + opacity + `scale .6↔1`).
   On disappear, keep it mounted ~220 ms so the exit plays, then unmount.
   If the logo popup is open when the logo is removed, close the popup.

## Architecture changes

### New file: `src/components/LogoSettings.tsx`
Owns the styling control sets and their context branching. Exports:
- `LogoSettingsBody({ style, patch, type, data })` — reads the **real** style, renders the
  correct control set (custom / styleable preset / promptpay-bill).

Move into it (from `LogoUploader.tsx`, verbatim): `PresetControls`, `SizeSlider`,
`LogoControls`, and the constants `PLATES`, `SHAPES`, `LOGO_BGS`, `STYLEABLE`,
`CATEGORY_TYPES`. Branch:
```
if (style.logo)                      → LogoControls              // custom upload
else if STYLEABLE.includes(type)     → PresetControls (isCategory = CATEGORY_TYPES.includes(type))
else                                 → SizeSlider                // promptpay / bill
```
(This is the exact branching `LogoUploader` does today, minus the upload UI.)

### `src/ui/icons.tsx`
Add `LogoCenterIcon` — an "image in a frame" glyph (rounded rect + small circle + a
horizon/mountain line), stroked, matching the existing `Svg` wrapper style.

### `src/index.css`
Add keyframes:
```
@keyframes logoTabIn  { from {width:0;opacity:0;transform:scale(.6)} to {width:44px;opacity:1;transform:scale(1)} }
@keyframes logoTabOut { from {width:44px;opacity:1;transform:scale(1)} to {width:0;opacity:0;transform:scale(.6)} }
```

### `src/components/QrPanel.tsx`
- Add `'logo'` to `TabId`.
- New props: `baseStyle: StyleSettings`, `type: QRType`, `data: FieldData`.
  (`svg`, `hasData`, `style`, `patchStyle` unchanged.)
- Derive `logoOn = !!style.logo` (effLogo, from `renderStyle`).
- Mount/unmount state for the animated slot:
  ```
  const [logoMounted, setLogoMounted] = useState(logoOn)
  useEffect(() => {
    if (logoOn) { setLogoMounted(true); return }
    const t = window.setTimeout(() => setLogoMounted(false), 220)
    return () => clearTimeout(t)
  }, [logoOn])
  ```
- Close the popup if the logo disappears while open:
  ```
  useEffect(() => { if (!logoOn && open === 'logo') setOpen(null) }, [logoOn, open])
  ```
- Toolbar render: split the fixed tabs into a left group (`color/border/center/cells`) and
  a right group (`cta/adv`); render the animated logo slot between them when `logoMounted`:
  ```
  <div className="overflow-hidden" style={{ animation: `${logoOn ? 'logoTabIn' : 'logoTabOut'} .22s cubic-bezier(.2,.9,.3,1.2) both` }}>
    {renderTab(LOGO_TAB)}
  </div>
  ```
  Extract the existing per-tab button markup into a local `renderTab(t)` helper so both
  groups and the logo slot share it. The `logo` tab is not a shape tab, so it needs no
  anchored dropdown branch.
- `PopBody` gains `baseStyle`, `type`, `data`; add `if (tab === 'logo') return <LogoSettingsBody style={baseStyle} patch={patch} type={type} data={data} />`.
  The centred-popup block already handles any non-shape tab, so `logo` routes there
  automatically.

### `src/components/LogoUploader.tsx`
- Remove `PresetControls`, `SizeSlider`, `LogoControls`, `PLATES`, `SHAPES`, `LOGO_BGS`,
  `STYLEABLE`, `CATEGORY_TYPES` (moved to `LogoSettings.tsx`).
- Custom-upload branch: keep label + preview + delete; drop `<LogoControls>`.
- Preset branch: keep label + toggle + preset preview + "อัปโหลดโลโก้เองแทน" dropzone;
  drop the `styleable ? PresetControls : SizeSlider` block.
- No-preset branch: unchanged.

### `src/App.tsx`
Pass the real style + type + data to `QrPanel`:
```
<QrPanel svg={svg} hasData={ready} style={renderStyle} baseStyle={style} type={type} data={data} patchStyle={patchStyle} />
```

## Data-flow rationale (why `baseStyle`)

`renderStyle` overrides `logoSize` (→ `presetLogoSize(...)`) and `logoBg` (→ `'none'`) for
presets, and sets `logo = effLogo`. The styling controls must read the **user's real**
values, and must distinguish custom-vs-preset (real `style.logo`). So the popup reads
`baseStyle` (App's real `style`). Writes go through `patchStyle`, which already patches the
real style in `App`. Icon *visibility* intentionally keys off `renderStyle.logo` (effLogo),
matching how the `adv` tab already detects an effective logo to lock ECC at H.

## Edge cases

- **Preset-on-by-default types** (promptpay/bill/social via `defaultPresetOn`): icon is
  present on load; a one-time entrance animation on mount is acceptable.
- **Removing a custom logo** restores the type's default preset (`onRemoveLogo`), which may
  keep `effLogo` truthy → the icon stays (now showing preset controls). Correct.
- **Toggling preset off** with no custom upload → `effLogo` null → icon animates out; popup
  closes if open.
- **Switching type** while the popup is open: content re-derives from the new `type/data`.
  If the new type has no effective logo, the icon animates out and the popup closes.

## Testing

- `npm run typecheck` (and `npm run build`) green.
- App in browser on **Retina DPR=2** (per project convention):
  - Custom upload: icon appears; popup shows size/bg/padding; sliders reflect real values.
  - Preset category (e.g. email): icon appears; popup shows plate/shape/thickness/colour/size;
    **size slider reads the real `logoSize`, not the preset-boosted value.**
  - PromptPay: icon appears; popup shows size only.
  - Toggle preset off / remove logo: icon animates out smoothly; popup closes.
  - Decode check stays green after adjustments.
- Left card no longer shows styling sliders; still adds/removes/swaps logo.

## Addendum (2026-07-01) — icon shape pickers

Follow-up request: the **พื้นหลังโลโก้** (custom upload: none/square/rounded/circle) and
preset **รูปทรง** (square/rounded/circle) pickers now render **icon-only** (the text label
becomes the button tooltip). `SegGroup` gained an optional per-option `Icon`; when present
the button shows the icon and sets `title` to the label. New plate glyphs
`PlateNoneIcon/PlateSquareIcon/PlateRoundedIcon/PlateCircleIcon` (`ui/icons.tsx`) — filled
shapes read as a solid backing plate, `none` is an outlined square with a slash. `แผ่นรอง`
and the ECC segmented control are unchanged (still text; `Icon` is optional/backward-compatible).
