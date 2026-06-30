# TASK.md — Work board

> **Cross-session / cross-agent status board.** Read this first when picking up the project: it shows what is in progress, queued, blocked, or recently done.
>
> **Scope:** tracks the *status of work items*, **not** a function-by-function inventory. The code + git history are truth for "does X exist". Entries cite the real file(s)/function(s) touched so they can be checked against the code.
>
> **History:** when `✅ Done` grows long, older entries move to `TASK-archive.md` to keep this board skimmable.

## 🔵 In Progress

_(none)_

## 📋 To Do

_(none)_

## ⛔ Blocked

_(none)_

## ✅ Done

- [x] 2026-06-30 — **Sample-number placeholders (payment fields).** Swapped two empty-field placeholders for neutral fixed example numbers that read as a sample, not real captured data. Biller ID (Bill Payment): `เช่น 010556012345601` → `เช่น 099400016939574`. รหัสร้านค้า / อ้างอิง (PromptPay storeLabel): `เช่น 223620406Y0858478ZM` → `เช่น 8052931746` (now digits-only, was alphanumeric). `src/components/FormFields.tsx` lines 143/151. Typecheck clean.
- [x] 2026-06-30 — **Frame picker UI tweaks (CTA tab).** (1) toolbar tab tooltip `เฟรม` → `กรอบ`; (2) section label `กรอบ + ป้าย CTA` → `กรอบ`; (3) frame buttons re-laid out 5×3 (`grid-cols-4` → `grid-cols-5`; 15 items incl. `ไม่มี` = exactly 3 rows; CTA popup widened `w-[286px]` → `w-[330px]` and shared popup `max-w-[340px]` → `max-w-[356px]` so 5 cols fit, labels stay one line); (4) replaced the always-open scrollable font list with a new `FontPicker` component — a collapsed trigger (current font shown in its own face) that opens a **floating popover** rendered via `createPortal` to `document.body` (escapes the CTA popup's `overflow-y-auto` clip), pinned to the trigger on scroll/resize, flips above when the bottom is cramped, closes on outside-click / Esc, each option previewed in its own face. `src/components/QrPanel.tsx`. Verified in-browser: tooltip now `กรอบ` (old `เฟรม` gone), 5×3 grid renders, popover floats over the grid (flips up near the bottom edge), font select updates trigger + closes.
- [x] 2026-06-30 — **Transparent background around frame on copy + PNG/WebP export.** A CTA frame card is non-rectangular, but `rasterCanvas` always filled the whole canvas with `style.bg`, so copy/export pasted as a coloured box around the card. Added an opt-in `transparent` flag to `rasterCanvas` (`core/export.ts`) that skips the bg fill; enabled in `copyQRToClipboard` (PNG) and in `downloadQR` for `png`/`webp` — gated on `style.frameStyle !== 'none'`. JPG/PDF/print keep the opaque `style.bg` fill (no alpha); SVG export was already transparent around the card. The QR keeps its own quiet-zone bg (qr-code-styling draws a `style.bg` rect in the slot). Verified in-browser (real export path, classic frame, 825×1024): Copy PNG + Save PNG → all four corners RGBA `[0,0,0,0]`, centre `[255,255,255,255]`; Save JPG control → corners `[~252,255,255,255]` (alpha 255, opaque). WebP rides the same `transparent:true` branch as Save PNG (mime-only difference). `core/export.ts`.
- [x] 2026-06-30 — **Studio polish (6-item batch)**. All verified in-browser (Chrome, dev server).
  - **(1) Unified gradient** — gradient was per-section (dots + one per eye) so it restarted inside each eye. `unifyGradient` (`core/render.ts`) repoints every eye fill (`url('#corners-square-color-…')` / `…corners-dot-color-…`) to the dots gradient, which already spans the full module area → one continuous sweep. Skipped when `useEyeColor` or no gradient. Verified: eyes follow the body sweep (pink→blue).
  - **(2) CTA font picker (Google Fonts)** — `core/fonts.ts` (new): 14 curated Thai-capable display faces (LINE Seed bundled + 13 Google). Dropdown previews each name in its own face (`components/QrPanel.tsx`); `loadPreviewFonts` adds one `<link>` on first frame-tab open. For export, `ensureFontCss` fetches the woff2 once and inlines it as a base64 `@font-face`, embedded by `composeFramedSvg` (`core/frames.ts`) — an `<img>`-loaded SVG can't fetch external fonts, so preview == raster. `frameFont` added to `StyleSettings`. Verified: preview renders Google faces; export fetched `fonts.googleapis.com/css2` + `fonts.gstatic.com` woff2 (all 200, CORS ok).
  - **(3) Advanced reset** — `ResetIcon` (`ui/icons.tsx`) at the ECC section header (`components/QrPanel.tsx`) resets ECC+size+margin to `defaultStyle()`; with a logo present it resets only size+margin (ECC stays locked H). Verified: Q→reset→M.
  - **(4) Export-size labels** — `EXPORT_SIZES` (`constants.ts`) now `{px,label}`; buttons show `S` / `M` / `L` / `XL` over the px count (`components/CheckExport.tsx`). Verified.
  - **(5) History saves style** — `RecentItem.style` (incl. logo); `pushRecent` snapshots style, `onLoadRecent` restores it (`App.tsx`); thumbnails render the saved style sans frame (`HistoryPopover.tsx`); footer "เก็บอัตโนมัติ 6 รายการล่าสุด"; MAX stays 6; `persist` quota-trims oldest logos on overflow. `loadRecent` migrates pre-style entries with `defaultStyle()`. Verified: thumbnail shows the gradient QR.
  - **(6) Logo plate fix + padding** — ROOT CAUSE: `postProcess` parsed the image size with `="([\d.]+)"` but qr-code-styling emits `width="56px"` (px unit) → `iw=0` → `if (iw && ih)` false → the plate was NEVER drawn. Fixed the regex to accept an optional `px`. Also `hideBackgroundDots` is now on only when there's no plate (the lib only ever clears a square, which hid the chosen shape), and added a `logoPadding` slider (`core/types.ts`, `components/LogoUploader.tsx`). `core/render.ts`. Verified: circle plate renders around the logo.
- [x] 2026-06-30 — Add "Social" data type — new `QRType` 'social': pick platform (17: FB/IG/X/TikTok/YT/LinkedIn/LINE/WhatsApp/Telegram/Threads/Pinterest/Snapchat/Discord/GitHub/Twitch/Spotify/WeChat) + username → auto-build profile URL; leading `@ ~ /` stripped, full-URL `http…` passthrough; bespoke builders for WhatsApp (wa.me phone), LINE (personal `~` vs OA `@`), WeChat (raw passthrough). New `src/core/social.ts` (platform registry + URL builders); `case 'social'` added to `buildPayload` (`core/payloads.ts`) + `previewFor` (`recent.ts`); `'social'` in `QRType` + `SocialPlatform` union + `FieldData.social` (`core/types.ts`); TYPES chip + share icon (`constants.ts`, `ui/icons.tsx`); new `Select` primitive (`ui/controls.tsx`); form case (`components/FormFields.tsx`). Verified: typecheck clean, all 17 builders unit-checked, in-browser decode of FB QR → `https://www.facebook.com/pfirst.design`.
- [x] 2026-06-30 — Framed export sizing: scale the frame so its **longest side = selected export size** (was pinned to the template's native ~280px regardless of the size dropdown). `composeFramedSvg` in `src/core/frames.ts`.
- [x] 2026-06-29 — Soft drop-shadow on the white card, replacing the stripped `#E6E6E6` outline. `composeFramedSvg` in `src/core/frames.ts`.
- [x] 2026-06-29 — Drop qrcg's `#E6E6E6` card-border "outline" path (fixes the DPR=2 grey hairline beside the QR). `OUTLINE_RE` in `src/core/frames.ts`.
- [x] 2026-06-29 — Inject QR via `<g transform>` instead of a nested `<svg>` (kills the edge seam, repairs raster export). `composeFramedSvg` in `src/core/frames.ts`.
- [x] 2026-06-29 — Per-render scoped frame `<style>` + larger arrow/script labels. `scopeStyle` / `labelText` in `src/core/frames.ts`.
- [x] 2026-06-29 — Real-SVG frame template engine + gallery picker (14 templates). `FRAME_TEMPLATES` in `src/core/frames.ts`, `src/components/QrPanel.tsx`.
