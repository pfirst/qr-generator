# Import QR from image ("อ่านจากรูป QR เดิม") — Design

**Date:** 2026-07-13 · **Status:** approved (brainstorm 2026-07-13)

## Problem

Users often have only a *photo or screenshot* of an existing QR (e.g. the LINE
add-friend QR printed on a card) — no original file and no way to retype the
payload (LINE ticket links are random tokens, not the LINE ID; PromptPay
payloads carry a CRC). They want to recreate that QR in this app: same content,
byte-for-byte, but clean and restyleable (colors, shapes, logo, frame).

## Solution overview

A single app-wide entry point: a **"📷 อ่านจากรูป QR"** button at the top-right
of the data card's header (moved there from the type-chip row after a visual
pass — the in-row chip read as just another data type). Clicking opens a file picker (`accept="image/*"`,
upload only — no paste-URL field). The image is decoded **entirely in the
browser** (product promise: data never leaves the device), then the app routes
to the best-matching QR type with the field pre-filled and the preview updates
through the existing pipeline.

## Components

### 1. Decoder — new `src/core/scan.ts`

`decodeImageFile(file: File): Promise<string | null>`

- Load the file via object URL / `createImageBitmap` into a canvas.
- Try `BarcodeDetector` (`formats: ['qr_code']`) first; fall back to `jsQR`
  (`attemptBoth`), mirroring `verify.ts`'s decode order.
- Real-world photos (lighting, slight perspective) often fail at one scale:
  retry across a small set of canvas sizes (e.g. natural size capped at ~1600px,
  then ~1024px, then ~600px) before giving up.
- Returns the decoded string, or `null` when unreadable (blurry photo or a
  format the browser can't even rasterise, e.g. HEIC in Chrome — the image
  `load` error also resolves to `null`).

### 2. Router — `detectImport(text: string)` (same file)

Maps the decoded payload to `{ type: QRType, ... }`:

1. **Known social profile URL** → `type: 'social'` with
   `{ platform, value: <full decoded URL> }`. Detection is by hostname/path
   prefix per platform (line.me, facebook.com, instagram.com, x.com /
   twitter.com, tiktok.com, youtube.com, linkedin.com, wa.me, t.me,
   threads.net, pinterest.com, snapchat.com, discord.gg, github.com,
   twitch.tv, open.spotify.com). `social.ts` builders pass full URLs through
   verbatim, so the payload is unchanged; the social type also brings its
   preset brand logo (e.g. LINE icon in the QR center).
2. **Any other `http(s)://` URL** → `type: 'url'`, `url = text`.
3. **Everything else** (WIFI:, vCard, EMVCo/PromptPay, mailto:, plain text…)
   → `type: 'text'`, `text = text`. Deliberately *not* parsed into form
   fields: the text payload builder is identity, which guarantees the new QR
   encodes the exact original bytes (critical for EMVCo CRC).

### 3. UI wiring

- `components/TypeChips.tsx`: import chip after the basic row (visually
  separated), with a hidden `<input type="file" accept="image/*">`. New
  `onImportFile(file)` prop threaded from `DataCard` → `App`.
- `ui/icons.tsx`: small camera/scan icon for the chip.
- `App.tsx`: `onImportQr(file)` — `await decodeImageFile`, on success
  `detectImport` → switch type (`pickType`) + `setIn(...)` + toast
  ("อ่าน QR สำเร็จ — ลิงก์ LINE" / generic per route); on `null` an error toast
  advising to crop to the QR or use a sharper photo. Preview, validation and
  the scannability re-decode all follow from existing state flow.

## Error handling

- Undecodable image → Thai toast, state untouched.
- Oversized images are downscaled before decoding (also bounds jsQR cost).
- No new network calls anywhere.

## Testing

No test framework — verify with `npm run typecheck` plus manual browser checks:
the attached LINE photo (real photo → social/LINE + preset logo), a clean URL
QR screenshot, a PromptPay QR (routes to text, re-decodes to identical string),
and a non-QR image (error toast). Confirm the re-rendered QR's decoded value
equals the imported payload via the existing ตรวจสแกน panel.

## Out of scope

- Paste-URL input, camera capture, drag-and-drop (upload picker only).
- Parsing wifi/vcard/promptpay payloads into their forms.
- Multi-QR images (first detected code wins).
