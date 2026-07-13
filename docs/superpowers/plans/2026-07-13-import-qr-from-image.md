# Import QR from image ("อ่านจากรูป QR เดิม") Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upload a photo/screenshot of an existing QR, decode it in-browser, and route to the best-matching QR type with the exact original payload pre-filled.

**Architecture:** New `src/core/scan.ts` holds the pure logic: `decodeImageFile` (canvas → BarcodeDetector → jsQR, retried at several scales) and `detectImport` (payload → social/url/text route). UI is one new chip in `TypeChips` wrapping a hidden file input; `App.tsx` owns the async handler that decodes, switches type via the existing `pickType`, fills the field via `setIn`, and toasts.

**Tech Stack:** Vite + React 19 + TypeScript, `jsqr` (already a dependency), native `BarcodeDetector` (typed in `src/vite-env.d.ts`).

**Spec:** `docs/superpowers/specs/2026-07-13-import-qr-from-image-design.md`

## Global Constraints

- Client-only product promise: **no network calls** anywhere in this feature — decoding happens entirely in the browser.
- UI copy is **Thai-first** (labels/toasts in Thai; technical words like URL stay English).
- **No test framework exists.** Each task is verified with `npm run typecheck`; the final task verifies end-to-end in the browser. Do not add a test framework.
- **Do NOT `git commit`** — the user commits manually when they ask. TASK.md edits ride along with their commit.
- Non-social/non-URL payloads must be preserved **byte-for-byte** (route to the `text` type whose payload builder is identity); never parse-and-rebuild them.
- Match existing code style: Tailwind arbitrary hex classes, `useCallback` handlers in `App.tsx`, hidden-`<input type="file">`-inside-`<label>` idiom from `LogoUploader.tsx` (reset `e.target.value = ''` after pick).

---

### Task 1: Core decoder + router — `src/core/scan.ts`

**Files:**
- Create: `src/core/scan.ts`
- Modify: `TASK.md` (add In-Progress entry)

**Interfaces:**
- Consumes: `jsQR` from `jsqr`; `BarcodeDetector` global (declared in `src/vite-env.d.ts`); `SocialPlatform` from `./types`.
- Produces (used by Task 3):
  - `decodeImageFile(file: File): Promise<string | null>`
  - `detectImport(text: string): ImportRoute` where
    `type ImportRoute = { type: 'social'; platform: SocialPlatform; value: string } | { type: 'url'; url: string } | { type: 'text'; text: string }`

- [ ] **Step 1: Add the work item to `TASK.md`**

Under `## 🔵 In Progress` (replace the `_(none)_` line):

```markdown
- [ ] Import QR from image: decode uploaded photo → route to social/url/text. `core/scan.ts`, `components/TypeChips.tsx`, `App.tsx`.
```

- [ ] **Step 2: Create `src/core/scan.ts`**

```ts
// Import an existing QR from a photo/screenshot: decode the image entirely
// in-browser (BarcodeDetector → jsQR, mirroring verify.ts's order) and map the
// decoded payload to the best-matching QR type. Non-URL payloads route to the
// 'text' type on purpose — its payload builder is identity, which guarantees
// the recreated QR encodes the exact original bytes (EMVCo CRCs survive).
import jsQR from 'jsqr'
import type { SocialPlatform } from './types'

export type ImportRoute =
  | { type: 'social'; platform: SocialPlatform; value: string }
  | { type: 'url'; url: string }
  | { type: 'text'; text: string }

// Hostnames that identify a social platform's profile/invite links. Matching
// is host === h or host.endsWith('.' + h), so www./m./mobile. all match.
const SOCIAL_HOSTS: [SocialPlatform, string[]][] = [
  ['line', ['line.me']],
  ['facebook', ['facebook.com', 'fb.com', 'fb.me']],
  ['instagram', ['instagram.com', 'instagr.am']],
  ['x', ['x.com', 'twitter.com']],
  ['tiktok', ['tiktok.com']],
  ['youtube', ['youtube.com', 'youtu.be']],
  ['linkedin', ['linkedin.com', 'lnkd.in']],
  ['whatsapp', ['wa.me', 'whatsapp.com']],
  ['telegram', ['t.me', 'telegram.me']],
  ['threads', ['threads.net', 'threads.com']],
  ['pinterest', ['pinterest.com', 'pin.it']],
  ['snapchat', ['snapchat.com']],
  ['discord', ['discord.gg', 'discord.com']],
  ['github', ['github.com']],
  ['twitch', ['twitch.tv']],
  ['spotify', ['open.spotify.com', 'spotify.link']],
  ['wechat', ['weixin.qq.com', 'u.wechat.com']],
]

// Map a decoded payload to a QR type. Social URLs keep the full link verbatim
// (social.ts builders pass URLs through unchanged) so the payload is identical
// while the social type contributes its preset brand logo.
export function detectImport(text: string): ImportRoute {
  if (/^https?:\/\//i.test(text)) {
    try {
      const host = new URL(text).hostname.toLowerCase()
      for (const [platform, hosts] of SOCIAL_HOSTS) {
        if (hosts.some((h) => host === h || host.endsWith('.' + h))) {
          return { type: 'social', platform, value: text }
        }
      }
    } catch {
      /* unparsable but http-prefixed — treat as a plain link */
    }
    return { type: 'url', url: text }
  }
  return { type: 'text', text }
}

function loadImage(file: File): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => {
      URL.revokeObjectURL(url)
      resolve(null) // unreadable format (e.g. HEIC in Chrome)
    }
    img.src = url
  })
}

// Same decode order as verify.ts: native BarcodeDetector first, jsQR fallback.
async function decodeCanvas(canvas: HTMLCanvasElement): Promise<string | null> {
  if ('BarcodeDetector' in window) {
    try {
      const detector = new BarcodeDetector({ formats: ['qr_code'] })
      const found = await detector.detect(canvas)
      if (found.length) return found[0].rawValue
    } catch {
      /* fall through to jsQR */
    }
  }
  const ctx = canvas.getContext('2d')!
  const img = ctx.getImageData(0, 0, canvas.width, canvas.height)
  const res =
    jsQR(img.data, img.width, img.height, { inversionAttempts: 'dontInvert' }) ||
    jsQR(img.data, img.width, img.height, { inversionAttempts: 'attemptBoth' })
  return res ? res.data : null
}

// Decode a QR from an uploaded image. Real-world photos often decode at one
// scale but not another, so retry a few long-side sizes (never upscaling).
export async function decodeImageFile(file: File): Promise<string | null> {
  const img = await loadImage(file)
  if (!img) return null
  try {
    const long = Math.max(img.naturalWidth, img.naturalHeight)
    if (!long) return null
    const sides = [...new Set([Math.min(long, 1600), Math.min(long, 1024), Math.min(long, 600)])]
    for (const side of sides) {
      const scale = side / long
      const canvas = document.createElement('canvas')
      canvas.width = Math.max(1, Math.round(img.naturalWidth * scale))
      canvas.height = Math.max(1, Math.round(img.naturalHeight * scale))
      canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height)
      const text = await decodeCanvas(canvas)
      if (text) return text
    }
    return null
  } finally {
    URL.revokeObjectURL(img.src)
  }
}
```

- [ ] **Step 3: Typecheck**

Run: `npm run typecheck`
Expected: exits 0, no errors.

---

### Task 2: UI — scan icon, import chip in `TypeChips`, prop threading in `DataCard`

**Files:**
- Modify: `src/ui/icons.tsx` (append one icon near the other small icons, e.g. after `UploadIcon`)
- Modify: `src/components/TypeChips.tsx`
- Modify: `src/components/DataCard.tsx`

**Interfaces:**
- Consumes: `GLASS_BTN` from `../ui/controls` (already imported in TypeChips).
- Produces (used by Task 3): `TypeChips` and `DataCard` each gain a required prop `onImportFile: (f: File) => void`.

- [ ] **Step 1: Add `ScanQrIcon` to `src/ui/icons.tsx`** (after the `UploadIcon` export)

```tsx
export const ScanQrIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2" />
    <path d="M7 12h10" />
  </Svg>
)
```

- [ ] **Step 2: Add the import chip to `src/components/TypeChips.tsx`**

Replace the whole file with:

```tsx
import { TYPES } from '../constants'
import type { QRType } from '../core/types'
import { ScanQrIcon, TypeIcon } from '../ui/icons'
import { GLASS_BTN, GLASS_BTN_ON } from '../ui/controls'

function Chip({ id, label, active, onPick }: { id: QRType; label: string; active: boolean; onPick: (t: QRType) => void }) {
  return (
    <button
      onClick={() => onPick(id)}
      className={
        'flex items-center gap-2 rounded-[13px] px-3.5 py-2.5 text-[13px] font-bold transition ' +
        (active
          ? `${GLASS_BTN_ON} text-[#7c3aed]`
          : `${GLASS_BTN} text-[#6b7280] hover:border-[#c4b5fd] hover:text-[#111827]`)
      }
    >
      <TypeIcon type={id} size={16} />
      {label}
    </button>
  )
}

// "Clone an existing QR": upload-only entry point — picks an image file and
// hands it to App to decode + route. Styled like a chip but it is a <label>
// wrapping a hidden file input (same idiom as LogoUploader).
function ImportChip({ onFile }: { onFile: (f: File) => void }) {
  return (
    <label
      className={
        `flex cursor-pointer items-center gap-2 rounded-[13px] px-3.5 py-2.5 text-[13px] font-bold transition ${GLASS_BTN} text-[#7c3aed] hover:border-[#c4b5fd]`
      }
    >
      <ScanQrIcon size={16} />
      อ่านจากรูป QR
      <input
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0]
          if (f) onFile(f)
          e.target.value = ''
        }}
      />
    </label>
  )
}

export function TypeChips({
  type,
  onPick,
  onImportFile,
}: {
  type: QRType
  onPick: (t: QRType) => void
  onImportFile: (f: File) => void
}) {
  const basic = TYPES.filter((t) => t.group === 'basic')
  const pay = TYPES.filter((t) => t.group === 'pay')
  return (
    <div>
      <div className="flex flex-wrap items-center gap-2.5">
        {basic.map((t) => (
          <Chip key={t.id} id={t.id} label={t.label} active={type === t.id} onPick={onPick} />
        ))}
        <span className="mx-0.5 h-6 w-px bg-[#e5e7eb]" />
        <ImportChip onFile={onImportFile} />
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2.5">
        <span className="mr-0.5 text-[10.5px] font-extrabold uppercase tracking-[0.08em] text-[#b0b4c0]">ชำระเงินไทย</span>
        {pay.map((t) => (
          <Chip key={t.id} id={t.id} label={t.label} active={type === t.id} onPick={onPick} />
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Thread the prop through `src/components/DataCard.tsx`**

Add to the props destructuring and type:

```tsx
  onImportFile,   // ← add alongside onLogoFile etc.
```
```tsx
  onImportFile: (f: File) => void   // ← add to the prop type
```

and pass it down:

```tsx
      <TypeChips type={type} onPick={onPickType} onImportFile={onImportFile} />
```

- [ ] **Step 4: Typecheck**

Run: `npm run typecheck`
Expected: FAILS with exactly one error — `App.tsx`: property `onImportFile` missing on `<DataCard>`. (Confirms threading is wired; Task 3 supplies it.)

---

### Task 3: App handler — decode, route, toast

**Files:**
- Modify: `src/App.tsx`

**Interfaces:**
- Consumes: `decodeImageFile` / `detectImport` from `./core/scan` (Task 1); `socialMeta` from `./core/social`; existing `pickType`, `setIn`, `showToast`.
- Produces: `onImportQr(f: File)` passed as `onImportFile` to `DataCard`.

- [ ] **Step 1: Add imports at the top of `src/App.tsx`**

```ts
import { decodeImageFile, detectImport } from './core/scan'
import { socialMeta } from './core/social'
```

- [ ] **Step 2: Add the handler** (after `onLogoFile`, before the `--- derived QR ---` block)

```ts
  // "อ่านจากรูป QR เดิม": decode an uploaded photo of an existing QR, then jump
  // to the matching type with the exact decoded payload filled in.
  const onImportQr = useCallback(
    async (f: File) => {
      const decoded = await decodeImageFile(f)
      if (!decoded) {
        return showToast('อ่าน QR จากรูปไม่สำเร็จ — ลองครอปเฉพาะตัว QR หรือใช้รูปที่คมชัดขึ้น')
      }
      const route = detectImport(decoded)
      if (route.type === 'social') {
        setIn('social', { platform: route.platform, value: route.value })
        showToast('อ่าน QR สำเร็จ — ลิงก์ ' + socialMeta(route.platform).label)
      } else if (route.type === 'url') {
        setIn('url', route.url)
        showToast('อ่าน QR สำเร็จ — ได้ลิงก์เว็บไซต์')
      } else {
        setIn('text', route.text)
        showToast('อ่าน QR สำเร็จ — เก็บเนื้อหาเดิมไว้เป็นข้อความ')
      }
      pickType(route.type)
    },
    [pickType, setIn, showToast],
  )
```

- [ ] **Step 3: Pass it to `DataCard`** (in the JSX, alongside `onLogoFile`)

```tsx
              onImportFile={onImportQr}
```

- [ ] **Step 4: Typecheck + production build**

Run: `npm run build`
Expected: `tsc -b` clean, Vite build succeeds.

---

### Task 4: End-to-end browser verification + close TASK.md

**Files:**
- Modify: `TASK.md` (move entry to ✅ Done)

- [ ] **Step 1: Run the app**

Run: `npm run dev` and open the printed localhost URL in Chrome.

- [ ] **Step 2: Verify the four routes**

1. **Social (the motivating case):** upload the LINE add-friend QR photo (session copy at `/Users/pfirst/.claude/image-cache/2b89f3ac-90b4-49c7-9946-406af690c642/1.png`; a real photo, not a screenshot). Expected: app switches to Social with platform LINE, the field holds the full `https://line.me/...` link, the preset LINE brand logo appears, toast "อ่าน QR สำเร็จ — ลิงก์ LINE", and the ตรวจสแกน panel reports scannable.
2. **URL:** export any URL QR from the app as PNG, re-import it. Expected: switches to URL type with the same link.
3. **Byte-exact text route:** create a PromptPay QR (any phone number), export PNG, re-import. Expected: switches to ข้อความ with the raw EMVCo string; the preview QR re-decodes OK (ตรวจสแกน ok) — same payload, CRC intact.
4. **Failure:** upload any non-QR photo. Expected: error toast, state unchanged.

- [ ] **Step 3: Close the board entry**

Move the Task 1 line to `## ✅ Done` as:

```markdown
- [x] 2026-07-13 — Import QR from a photo (decode → route to social/url/text, upload chip). `core/scan.ts`, `components/TypeChips.tsx`, `App.tsx`.
```

(Restore `_(none)_` under In Progress if it becomes empty. Do not commit — the user commits when they ask.)
