# TASK.md — Work board

> **Cross-session / cross-agent status board.** Read first when picking up the project. Tracks *status of work items*, not a function inventory (code + git history are truth). One short line per item; cite the main file(s) touched. Move old `✅ Done` to `TASK-archive.md` when long.

## 🔵 In Progress

_(none)_

## 📋 To Do

_(none)_

## ⛔ Blocked

_(none)_

## ✅ Done

- [x] 2026-07-01 — Frame picker popover now uses **4 columns on mobile** (`grid-cols-4 sm:grid-cols-5`) with a fluid width (`w-[286px] sm:w-[330px]`) so it no longer overflows on narrow screens; desktop unchanged (5-col). Verified @500px viewport: 4 cols, container 286px, no horizontal overflow, 15 choices. `components/QrPanel.tsx`.
- [x] 2026-07-01 — Block search engines: `<meta name="robots" content="noindex, nofollow">` in `index.html` + new `public/robots.txt` (Disallow all). Verified served + in `dist/` build. `index.html`, `public/robots.txt`.
- [x] 2026-07-01 — ECC SegGroup shows a **disabled style** (dimmed + `cursor-not-allowed`, non-clickable) for L/M/Q when a logo locks ECC at H; H stays active. New optional `disabledIds` prop on `SegGroup`. `ui/controls.tsx`, `components/QrPanel.tsx`.
- [x] 2026-07-01 — Toolbar popover now **closes on outside-click anywhere** (+ Escape). Root cause: the `fixed inset-0` backdrop was trapped inside the `Card`'s `backdrop-filter` (backdrop-blur), so it only covered the card, not the viewport ("closes only in some areas"). Replaced with a document `mousedown`/`keydown` listener keyed off a `barRef`; portaled float panels marked `data-qr-float` so the CTA font list doesn't close its owner popup. `components/QrPanel.tsx`.
- [x] 2026-07-01 — Custom uploaded logo now scales **continuously** (true linear %: logo side = `logoSize` × QR module-area side) instead of qr-code-styling's stepped whole-odd-module snapping (the "ปรับเป็นระดับ" report). `postProcess` overrides the `<image>` width/height/x/y, keeping aspect + centre; gated on `style.logo && !style.presetLogo` so preset center logos are untouched; `renderQrSvg` passes the module-area side. Safe because `hideBackgroundDots:false` (no cleared region to sync). `core/render.ts`. Verified against live `renderQrSvg` (DPR=2): widths proportional (0.40→94.4, 0.44→103.84, ratio 1.10), centred at size/2, preset path still snapped (72=72), no console errors, typecheck green.
- [x] 2026-07-01 — Preset center logo for **vcard** (Heroicons `identification`) + **geo** (Heroicons `map-pin`): new `assets/preset-logos/category/{vcard,geo}.svg`, added to `CATEGORY_RAW` + `hasPreset` in `core/logoPreset.ts`, and to `STYLEABLE`/`CATEGORY_TYPES` in `components/LogoSettings.tsx` (full backing/shape/สีไอคอน controls). Default-off toggle like email/sms/tel/wifi. Verified DPR=2: both glyphs render centred, decode green, logo-tab controls present.
- [x] 2026-07-01 — Shape-picker (กรอบตา/จุดตา/จุด) popover: unselected option text + glyph now use the app's standard label gray (`#374151`/`#15161c` → `#6b7280`), matching SegGroup. `ui/controls.tsx` (`ShapeMenu`).
- [x] 2026-07-01 — Logo tab "สีไอคอน" now uses `ColorRow` (shows the `#HEX` under the label) instead of a bare color input. `components/LogoSettings.tsx`.
- [x] 2026-07-01 — Logo **styling** moved into a "โลโก้" toolbar tab (before "กรอบ"); the icon shows only when an effective logo is present (custom upload OR preset on) with a grow/fade/scale in-out animation, and its popup closes if the logo is removed. New `components/LogoSettings.tsx` (`LogoSettingsBody` + moved `PresetControls`/`SizeSlider`/`LogoControls`); `components/QrPanel.tsx` (new `baseStyle`/`type` props so controls read the real style not `renderStyle`, `renderTab` split + animated slot), `components/LogoUploader.tsx` (trimmed to add/remove/swap only), `ui/icons.tsx` (`LogoCenterIcon`), `index.css` (`logoTabIn`/`logoTabOut`), `App.tsx`. Verified DPR=2: preset-category/promptpay/custom-upload popups, size slider reads real `logoSize`, icon in/out anim, popup auto-closes on remove, decode green; build + typecheck green; no console errors. Opus spec/plan review incorporated (4 blockers). Spec/plan in `docs/superpowers/`.
- [x] 2026-07-01 — Follow-up: **พื้นหลังโลโก้** (none/square/rounded/circle) + preset **รูปทรง** (square/rounded/circle) pickers are now **icon-only** (label → tooltip). `SegGroup` gains an optional per-option `Icon`; new plate glyphs `PlateNone/Square/Rounded/CircleIcon` in `ui/icons.tsx`; wired in `components/LogoSettings.tsx`. Verified DPR=2 (both pickers, active/inactive states, distinct glyphs). `ui/controls.tsx`, `ui/icons.tsx`, `components/LogoSettings.tsx`.
- [x] 2026-07-01 — Preset-logo **frame system** (post-review, live feedback): renamed plate "halo→กรอบตามรูปโลโก้" + "ความหนากรอบ"; frame now grows OUTWARD (viewBox grows + `presetLogoSize` compensates imageSize) so the logo no longer shrinks; `brand` chip gains a white frame; thickness slider shows for brand+halo; thumbnail backfills defaults. `core/logoPreset.ts`, `App.tsx`, `components/{LogoUploader,HistoryPopover}.tsx`, `core/types.ts`. Verified DPR=2, decode green at frame 24.
- [x] 2026-07-01 — Preset (per-type) center logo — **Slice 2**: brand marks for `social` (17) + solid glyphs for email/sms/tel/wifi, user-selectable backing (brand chip / frame-follows-logo / none) + shape/thickness/colour controls. `assets/preset-logos/{social,category}/*.svg`, `core/logoPreset.ts` (`composeMark`), `core/types.ts`, `App.tsx`, `components/{DataCard,LogoUploader,HistoryPopover}.tsx`. Verified DPR=2 (all controls, custom override, history thumbnail); build green. Opus whole-branch review: ready-to-merge. Plan: `docs/superpowers/plans/2026-07-01-preset-logo-slice2.md`.
- [x] 2026-06-30 — Preset PromptPay logo now shows the full mark WITH its own white speech-bubble backing (no hard white square; matches owner reference), viewBox widened so the inner mark SQUARE — not the bubble+tail — is dead-centre. `assets/preset-logos/promptpay.svg` (restored `.st0` bubble from `QR_PP.svg` + `viewBox="-67 -8 815 508"`), `core/render.ts` (`hideBackgroundDots:false`), `App.tsx` (custom upload → `logoBg:'square'`), `components/LogoUploader.tsx` (logo size 5–60%).
- [x] 2026-06-30 — **Preset (per-type) center logo — Slice 1.** Built-in PromptPay mark for `promptpay`/`bill`, default-on with a "ใช้โลโก้ประจำชนิด" toggle; custom upload overrides + auto-disables it. New `core/logoPreset.ts` (`resolveLogo`/`presetLogoUrl`/`defaultPresetOn`/`defaultPresetBg`) + `StyleSettings.presetLogo`; App feeds an effective `renderStyle` so the render/export/verify pipeline stays untouched. Asset `assets/preset-logos/promptpay.svg` (white card removed, viewBox cropped to the mark; `logoBg='none'`). Touches `App.tsx`, `components/{DataCard,LogoUploader,HistoryPopover}.tsx`. Verified DPR=2: preset renders, decode green, SVG-in-SVG raster export not tainted. social/email/sms/tel/wifi → Slice 2. Spec/plan in `docs/superpowers/`.
- [x] 2026-06-30 — Trim promptpay amount label (drop the open-amount hint). `components/FormFields.tsx`.
- [x] 2026-06-30 — Sample-number placeholders for payment fields (neutral example digits). `components/FormFields.tsx`.
- [x] 2026-06-30 — Frame picker UI tweaks: relabel เฟรม→กรอบ, 5×3 grid, floating `FontPicker` popover. `components/QrPanel.tsx`.
- [x] 2026-06-30 — Transparent bg around frame on copy + PNG/WebP export. `core/export.ts` (`rasterCanvas` `transparent` flag).
- [x] 2026-06-30 — Unified gradient across body + eyes (`unifyGradient`). `core/render.ts`.
- [x] 2026-06-30 — CTA font picker with Google Fonts + inlined woff2 for export. `core/fonts.ts`, `core/frames.ts`.
- [x] 2026-06-30 — Advanced reset button (ECC/size/margin). `ui/icons.tsx`, `components/QrPanel.tsx`.
- [x] 2026-06-30 — Export-size labels (S/M/L/XL). `constants.ts`, `components/CheckExport.tsx`.
- [x] 2026-06-30 — History saves + restores full style. `App.tsx`, `components/HistoryPopover.tsx`, `recent.ts`.
- [x] 2026-06-30 — Logo plate fix (px-unit regex) + logo padding slider. `core/render.ts`, `core/types.ts`.
- [x] 2026-06-30 — New "Social" data type (17 platforms → profile URL). `core/social.ts`, `core/payloads.ts`.
- [x] 2026-06-30 — Framed export scales longest side to selected export size. `core/frames.ts`.
- [x] 2026-06-29 — Soft drop-shadow on white card (replaces stripped outline). `core/frames.ts`.
- [x] 2026-06-29 — Drop qrcg's `#E6E6E6` card-border (fixes DPR=2 grey hairline). `core/frames.ts` (`OUTLINE_RE`).
- [x] 2026-06-29 — Inject QR via `<g transform>` not nested `<svg>` (kills seam, fixes raster). `core/frames.ts`.
- [x] 2026-06-29 — Per-render scoped frame `<style>` + larger labels. `core/frames.ts`.
- [x] 2026-06-29 — Real-SVG frame template engine + gallery picker (14 templates). `core/frames.ts`, `components/QrPanel.tsx`.
