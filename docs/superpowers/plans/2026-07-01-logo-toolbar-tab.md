# Plan — "โลโก้" toolbar tab (move logo styling into QrPanel)

Spec: `docs/superpowers/specs/2026-07-01-logo-toolbar-tab-design.md`

Ordered, each step compiles on its own where practical. Verify with `npm run typecheck`
after the code steps, then browser QA on DPR=2.

## Step 1 — `src/components/LogoSettings.tsx` (new)
Create the file and move, **verbatim**, from `LogoUploader.tsx`:
- constants `PLATES`, `SHAPES`, `LOGO_BGS`, `STYLEABLE`, `CATEGORY_TYPES`
- components `SizeSlider`, `PresetControls`, `LogoControls`
Add the public brancher:
```tsx
export function LogoSettingsBody({ style, patch, type, data }: {
  style: StyleSettings; patch: (p: Partial<StyleSettings>) => void; type: QRType; data: FieldData
}) {
  if (style.logo) return <LogoControls style={style} patch={patch} />           // custom upload
  if (STYLEABLE.includes(type))
    return <PresetControls style={style} patch={patch} isCategory={CATEGORY_TYPES.includes(type)} />
  return <SizeSlider style={style} patch={patch} />                              // promptpay / bill
}
```
Wrap the returned body in a fixed-width container matching the other popups
(`<div className="flex w-[286px] flex-col gap-1">…`) so the centred popup sizes nicely.
Imports: `SectionLabel, SegGroup` from `../ui/controls`; types from `../core/types`.
`data` is currently unused by the control sets but is part of the interface for parity with
`LogoUploader` and future needs — reference it or omit from the destructure to avoid a lint
error (omit if unused).

## Step 2 — `src/ui/icons.tsx`
Add `LogoCenterIcon` using the shared `Svg` wrapper:
```tsx
export const LogoCenterIcon = (p: IconProps) => (
  <Svg {...p}>
    <rect x="3" y="3" width="18" height="18" rx="4" />
    <circle cx="8.5" cy="9" r="1.6" />
    <path d="M20 15l-4.5-4.5L7 19" />
  </Svg>
)
```
(An "image in frame" glyph — reads as a logo centred in the QR.)

## Step 3 — `src/index.css`
Append after the existing keyframes:
```css
@keyframes logoTabIn  { from { width: 0; opacity: 0; transform: scale(.6); } to { width: 44px; opacity: 1; transform: scale(1); } }
@keyframes logoTabOut { from { width: 44px; opacity: 1; transform: scale(1); } to { width: 0; opacity: 0; transform: scale(.6); } }
```

## Step 4 — `src/components/QrPanel.tsx`
- Import `LogoCenterIcon` and `LogoSettingsBody`; import types `QRType`, `FieldData`.
- `TabId` += `'logo'`.
- Keep the `TABS` array for the fixed tabs but split for rendering:
  `LEFT = color/border/center/cells`, `RIGHT = cta/adv`, and a standalone
  `LOGO_TAB = { id:'logo', label:'โลโก้', Icon: LogoCenterIcon }`.
- `PopBody` signature gains `baseStyle`, `type`, `data`; add:
  `if (tab === 'logo') return <LogoSettingsBody style={baseStyle} patch={patch} type={type} data={data} />`
- `QrPanel` signature gains `baseStyle: StyleSettings`, `type: QRType`, `data: FieldData`.
- Add `logoOn = !!style.logo`, the `logoMounted` mount/unmount effect (220 ms), and the
  close-on-remove effect (per spec).
- Refactor the toolbar `TABS.map(...)` into a `renderTab(t)` local returning the existing
  `<div className="relative">…button…{shape dropdown}…</div>`. Render:
  `LEFT.map(renderTab)`, then the animated logo slot (when `logoMounted`), then `RIGHT.map(renderTab)`.
- Route the centred popup for `open === 'logo'` (already covered by the `!SHAPE_TABS.includes(open)`
  block; pass `baseStyle/type/data` into that `<PopBody>`).

## Step 5 — `src/components/LogoUploader.tsx`
- Delete the moved constants/components (now in `LogoSettings.tsx`).
- Custom-upload branch: drop `<LogoControls>` (keep label + preview + delete).
- Preset branch: drop the `styleable ? <PresetControls…/> : <SizeSlider…/>` block
  (keep label + toggle + preset preview + "อัปโหลดโลโก้เองแทน" dropzone).
- Prune now-unused imports (`SegGroup`, `SectionLabel` may still be used by the label; verify).

## Step 6 — `src/App.tsx`
Update the `QrPanel` usage:
```tsx
<QrPanel svg={svg} hasData={ready} style={renderStyle} baseStyle={style} type={type} data={data} patchStyle={patchStyle} />
```

## Step 7 — Verify
- `npm run typecheck` → clean.
- `npm run build` → clean.
- Browser QA (DPR=2): custom upload, preset category (email — size slider must read real
  `logoSize`), promptpay; icon show/hide animation; popup closes on logo removal; decode green;
  left card no longer shows styling sliders.

## Step 8 — TASK.md
Move the item to ✅ Done with today's date and the touched files. (Edit only; do not commit.)

## Rollback
All changes are additive/relocating within the UI layer; reverting the 6 touched files
restores prior behaviour. No data-model or pipeline changes.
