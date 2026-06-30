# TASK.md — Work board

> **Cross-session / cross-agent status board.** Read first when picking up the project. Tracks *status of work items*, not a function inventory (code + git history are truth). One short line per item; cite the main file(s) touched. Move old `✅ Done` to `TASK-archive.md` when long.

## 🔵 In Progress

_(none)_

## 📋 To Do

_(none)_

## ⛔ Blocked

_(none)_

## ✅ Done

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
