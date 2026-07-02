# TASK.md — Work board

> **Cross-session / cross-agent status board.** Read first when picking up the project. Tracks *status of work items*, not a function inventory (code + git history are truth). One short line per item; cite the main file(s) touched. Move old `✅ Done` to `TASK-archive.md` when long.

## 🔵 In Progress

- [ ] Mouse-following specular light on glass surfaces + parallax on the preview stage. New `ui/glassLight.ts`; `index.css`, `ui/controls.tsx`, `components/QrPanel.tsx`, `App.tsx`.

## 📋 To Do

_(none)_

## ⛔ Blocked

_(none)_

## ✅ Done

- [x] 2026-07-02 — Glass-look styling on all buttons (shared `GLASS_BTN`/`GLASS_BTN_ON`/`GLASS_ACTIVE_SHADOW`). `ui/controls.tsx`, `components/{TypeChips,CheckExport,QrPanel,HistoryPopover,LogoUploader}.tsx`.
- [x] 2026-07-02 — Frosted-glass (glassmorphism) on all floating popovers + toast via shared `GLASS_POPOVER`. `ui/controls.tsx`, `components/{QrPanel,HistoryPopover,Toast}.tsx`.
- [x] 2026-07-01 — CTA-frame controls animate in/out on every frame change. `index.css`, `components/QrPanel.tsx`.
- [x] 2026-07-01 — Frame picker: 4-col grid + fluid width on mobile (no overflow). `components/QrPanel.tsx`.
- [x] 2026-07-01 — Block search engines (noindex meta + robots.txt). `index.html`, `public/robots.txt`.
- [x] 2026-07-01 — ECC L/M/Q disabled-style when a logo locks ECC at H (new `disabledIds` on `SegGroup`). `ui/controls.tsx`, `components/QrPanel.tsx`.
- [x] 2026-07-01 — Toolbar popovers close on outside-click anywhere + Escape. `components/QrPanel.tsx`.
- [x] 2026-07-01 — Uploaded logo scales continuously (true linear %) instead of stepped snapping. `core/render.ts`.
- [x] 2026-07-01 — Preset center logos for vcard + geo (Heroicons glyphs). `assets/preset-logos/category/`, `core/logoPreset.ts`, `components/LogoSettings.tsx`.
- [x] 2026-07-01 — Shape-picker unselected options use the standard label gray. `ui/controls.tsx` (`ShapeMenu`).
- [x] 2026-07-01 — Logo-tab "สีไอคอน" uses `ColorRow` (shows #HEX). `components/LogoSettings.tsx`.
- [x] 2026-07-01 — Logo styling moved into an animated "โลโก้" toolbar tab. New `components/LogoSettings.tsx`; `components/{QrPanel,LogoUploader}.tsx`, `ui/icons.tsx`, `index.css`, `App.tsx`.
- [x] 2026-07-01 — Logo-bg + preset-shape pickers icon-only (per-option `Icon` on `SegGroup`). `ui/{controls,icons}.tsx`, `components/LogoSettings.tsx`.
- [x] 2026-07-01 — Preset-logo frame polish: frame grows outward (logo keeps size), white frame on brand chip, relabels. `core/logoPreset.ts`, `core/types.ts`, `App.tsx`, `components/{LogoUploader,HistoryPopover}.tsx`.
- [x] 2026-07-01 — Preset center logo Slice 2: brand marks for social (17) + email/sms/tel/wifi glyphs, backing/shape/colour controls. `assets/preset-logos/`, `core/logoPreset.ts`, `core/types.ts`, `App.tsx`, `components/{DataCard,LogoUploader,HistoryPopover}.tsx`.
- [x] 2026-06-30 — Preset PromptPay logo keeps its white bubble backing, inner mark square dead-centred. `assets/preset-logos/promptpay.svg`, `core/render.ts`, `App.tsx`, `components/LogoUploader.tsx`.
- [x] 2026-06-30 — Preset (per-type) center logo Slice 1: built-in PromptPay mark with default-on toggle; custom upload overrides. New `core/logoPreset.ts`; `App.tsx`, `components/{DataCard,LogoUploader,HistoryPopover}.tsx`.
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
