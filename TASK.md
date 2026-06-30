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

- [x] 2026-06-30 — Add "Social" data type — new `QRType` 'social': pick platform (17: FB/IG/X/TikTok/YT/LinkedIn/LINE/WhatsApp/Telegram/Threads/Pinterest/Snapchat/Discord/GitHub/Twitch/Spotify/WeChat) + username → auto-build profile URL; leading `@ ~ /` stripped, full-URL `http…` passthrough; bespoke builders for WhatsApp (wa.me phone), LINE (personal `~` vs OA `@`), WeChat (raw passthrough). New `src/core/social.ts` (platform registry + URL builders); `case 'social'` added to `buildPayload` (`core/payloads.ts`) + `previewFor` (`recent.ts`); `'social'` in `QRType` + `SocialPlatform` union + `FieldData.social` (`core/types.ts`); TYPES chip + share icon (`constants.ts`, `ui/icons.tsx`); new `Select` primitive (`ui/controls.tsx`); form case (`components/FormFields.tsx`). Verified: typecheck clean, all 17 builders unit-checked, in-browser decode of FB QR → `https://www.facebook.com/pfirst.design`.
- [x] 2026-06-30 — Framed export sizing: scale the frame so its **longest side = selected export size** (was pinned to the template's native ~280px regardless of the size dropdown). `composeFramedSvg` in `src/core/frames.ts`.
- [x] 2026-06-29 — Soft drop-shadow on the white card, replacing the stripped `#E6E6E6` outline. `composeFramedSvg` in `src/core/frames.ts`.
- [x] 2026-06-29 — Drop qrcg's `#E6E6E6` card-border "outline" path (fixes the DPR=2 grey hairline beside the QR). `OUTLINE_RE` in `src/core/frames.ts`.
- [x] 2026-06-29 — Inject QR via `<g transform>` instead of a nested `<svg>` (kills the edge seam, repairs raster export). `composeFramedSvg` in `src/core/frames.ts`.
- [x] 2026-06-29 — Per-render scoped frame `<style>` + larger arrow/script labels. `scopeStyle` / `labelText` in `src/core/frames.ts`.
- [x] 2026-06-29 — Real-SVG frame template engine + gallery picker (14 templates). `FRAME_TEMPLATES` in `src/core/frames.ts`, `src/components/QrPanel.tsx`.
