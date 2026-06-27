# Design — แกลเลอรีเลือกโลโก้กลาง QR (PromptPay & ชำระบิล)

วันที่: 2026-06-26
สถานะ: รออนุมัติ spec → ทำ implementation plan
Mockup กดเล่นได้: `docs/superpowers/mockups/logo-picker-mockup.html`

## 1. เป้าหมาย (Goal)

เพิ่ม "แกลเลอรีโลโก้แบรนด์สำเร็จรูป" ให้ผู้ใช้เลือกโลโก้กลาง QR ได้โดยไม่ต้องอัปโหลดเอง เฉพาะสองหมวดจ่ายเงิน:

- **หมวด `promptpay`** → Thai QR Payment, PromptPay, TrueMoney
- **หมวด `bill`** → ธนาคารไทยที่คนใช้บ่อย 16 แห่ง

หมวดอื่นยังใช้การอัปโหลดเองเหมือนเดิม งานเป็น **additive** — ป้อนค่าเข้า `style.logo` (data URL) เหมือน path การอัปโหลดเดิมทุกประการ จึง **ไม่แตะ render pipeline** (`render.ts` / `export.ts` / `verify.ts` / `qr.ts`)

## 2. การตัดสินใจที่ล็อกแล้ว (Locked decisions)

| หัวข้อ | สรุป | เหตุผล |
|---|---|---|
| แหล่งโลโก้ธนาคาร | `casperstack/thai-banks-logo` (PNG สี 200×200, license **ISC**) | เป็นแบงค์ไทยคัดมาแล้ว + เป็น badge สีพร้อมใช้ |
| โลโก้ Thai QR Payment | `QR_PP.svg` ที่พี่เฟิสส่ง (SVG, navy `#1A3763` + teal `#53A69A`) | ของจริง vector คมเสมอ |
| วิธีแสดง | วางโลโก้ลงกลาง QR **ตรงๆ** (data URL) ไม่มีพื้นรอง/compose/contrast-guard | โลโก้มีวงกลมสีแบรนด์ในตัวอยู่แล้ว |
| รายการแบงค์ | 16 แห่ง — ตัด CITI/HSBC/ICBC (ไม่มี retail ในไทย) | "เอาที่คนใช้บ่อย" |
| Thai QR Payment | ทับ QR ตรงๆ ไม่มีกรอบขาว | พี่เฟิสสั่ง "ทับลงไปเลย" |
| ECC | บังคับ `H` อัตโนมัติเมื่อมีโลโก้ | โค้ดเดิม (`effEcc = style.logo ? 'H' : style.ecc`) ทำให้แล้ว |

รายชื่อ 16 แบงค์ (เรียงแบงค์ใหญ่ก่อน): `SCB, KBANK, KTB, BBL, BAY, TTB, GSB, GHB, BAAC, KKP, TISCO, TCRB, LHB, IBANK, UOB, CIMB`

## 3. สถาปัตยกรรม / data flow

```
เลือก preset (grid)
        │  patchStyle({ logo: preset.url, logoPreset: key, logoBg:'none' })
        ▼
style.logo = "data:image/png;base64,…"  (หรือ svg ของ Thai QR Payment)
style.logoPreset = 'thaiqr' | 'pp:PromptPay' | 'pp:TrueMoney' | 'bank:SCB' | …
        │
        ▼  (App: effEcc = style.logo ? 'H' : style.ecc)
renderQrSvg(payload, ecc='H', style, …)        ← เดิม ไม่แก้
        │
preview · export.ts · verify.ts · HistoryCard  ← เดิม ไม่แก้
```

`style.logo` คือ data URL เสมอ → SVG export ฝังรูปในตัว (self-contained) เหมือน path อัปโหลดเดิม ไม่ต้องแก้ downstream

## 4. ไฟล์ที่เพิ่ม / แก้

### เพิ่ม (assets)
- `src/assets/logos/banks/*.png` — **18 ไฟล์** (16 แบงค์ + PromptPay + TrueMoney) จาก casperstack (ตัด CITI/HSBC/ICBC ที่ไม่ใช้)
- `src/assets/logos/thaiqr.svg` — จาก `QR_PP.svg`
- `src/assets/logos/banks.json` — metadata `{ SYMBOL: { name, nameEN } }` เฉพาะ 18 ตัวที่ใช้
- เครดิต casperstack/thai-banks-logo (ISC) ใน `README.md`

### เพิ่ม (โค้ด)
- `src/core/logoPresets.ts` — registry: โหลด asset เป็น data URL + export `PP_PRESETS`, `BANK_PRESETS`
- `src/components/LogoPresetPicker.tsx` — UI แกลเลอรี (grid + ช่องค้นหาสำหรับ bill)

### แก้
- `src/core/types.ts` — เพิ่มฟิลด์ `logoPreset: string | null` ใน `StyleSettings` + ค่า default `null`
- `src/components/DataCard.tsx` — ถ้า `type ∈ {promptpay, bill}` แสดง `<LogoPresetPicker type=… />` เหนือ `<LogoUploader>`
- `src/components/LogoUploader.tsx` — ปุ่มลบเคลียร์ `logoPreset` ด้วย (`patch({ logo:null, logoPreset:null })`); ซ่อน segment "พื้นหลังโลโก้" เมื่อมี `logoPreset` (preset เป็น badge มีพื้นในตัว)
- `src/App.tsx` — `onLogoFile` (อัปโหลดเอง) ตั้ง `logoPreset:null` เพิ่ม เพื่อให้ไฮไลต์ preset หายเมื่ออัปโหลดทับ

### ไม่แตะ
`render.ts` · `export.ts` · `verify.ts` · `qr.ts`

## 5. `src/core/logoPresets.ts` — โครงหลัก

```ts
// PNG → data URL ตอน build (Vite ?inline ฝัง base64 ในบันเดิล — ไม่มี network ตอนรัน)
const pngs = import.meta.glob('../assets/logos/banks/*.png',
  { query: '?inline', eager: true, import: 'default' }) as Record<string, string>
import meta from '../assets/logos/banks.json'      // { SYM: { name, nameEN } }
import thaiqrRaw from '../assets/logos/thaiqr.svg?raw'

export interface LogoPreset { key: string; id: string; name: string; nameEN: string; url: string }

const pngUrl = (sym: string) => pngs[`../assets/logos/banks/${sym}.png`]
const svgDataUrl = (svg: string) =>
  'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svg)))

// Thai QR Payment: ห่อใน viewBox จัตุรัสโปร่งใส (651×492 → จัตุรัส) วางทับ QR ตรงๆ ไม่มีพื้น
function squareWrap(raw: string): string {
  const vb = (raw.match(/viewBox="([^"]*)"/)?.[1]) ?? '0 0 100 100'
  const inner = raw.replace(/^[\s\S]*?<svg[^>]*>/i, '').replace(/<\/svg>\s*$/i, '')
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">` +
    `<svg x="4" y="4" width="92" height="92" viewBox="${vb}" preserveAspectRatio="xMidYMid meet">${inner}</svg></svg>`
}

const BILL_ORDER = ['SCB','KBANK','KTB','BBL','BAY','TTB','GSB','GHB','BAAC',
                    'KKP','TISCO','TCRB','LHB','IBANK','UOB','CIMB'] as const

export const BANK_PRESETS: LogoPreset[] = BILL_ORDER.map((s) => ({
  key: `bank:${s}`, id: s, name: meta[s].name, nameEN: meta[s].nameEN, url: pngUrl(s),
}))

export const PP_PRESETS: LogoPreset[] = [
  { key: 'thaiqr', id: 'thaiqr', name: 'Thai QR Payment', nameEN: 'Thai QR Payment',
    url: svgDataUrl(squareWrap(thaiqrRaw)) },
  { key: 'pp:PromptPay', id: 'PromptPay', name: meta.PromptPay.name, nameEN: meta.PromptPay.nameEN, url: pngUrl('PromptPay') },
  { key: 'pp:TrueMoney', id: 'TrueMoney', name: meta.TrueMoney.name, nameEN: meta.TrueMoney.nameEN, url: pngUrl('TrueMoney') },
]

export const presetsFor = (type: 'promptpay' | 'bill') =>
  type === 'promptpay' ? PP_PRESETS : BANK_PRESETS
```

## 6. `src/components/LogoPresetPicker.tsx` — สเปก

Props: `{ type: 'promptpay' | 'bill'; style: StyleSettings; patchStyle: (p: Partial<StyleSettings>) => void }`

พฤติกรรม:
- เลือก preset ที่ active จาก `style.logoPreset` (ไฮไลต์)
- `promptpay` → grid 3 ช่อง (ไม่มีช่องค้นหา); `bill` → ช่องค้นหา + grid 16 ช่อง (ค้นจาก name/nameEN/id)
- คลิก preset:
  - ถ้ายังไม่เลือก → `patchStyle({ logo: preset.url, logoPreset: preset.key, logoBg: 'none' })`
  - ถ้าคลิกซ้ำตัวเดิม (toggle off) → `patchStyle({ logo: null, logoPreset: null })`
- ไม่มี tab ในของจริง (หมวดถูกกำหนดโดย QR type อยู่แล้ว) — ต่างจาก mockup ที่มี tab เพื่อ demo
- หลัง picker ยังมี `<LogoUploader>` เดิมต่อท้าย (แสดง preview/slider ขนาด/ปุ่มลบ ของโลโก้ปัจจุบัน ไม่ว่าจะมาจาก preset หรืออัปโหลด)

UI ยึดสไตล์ตาม mockup (`.cell` grid, การ์ด glass, accent ม่วง)

## 7. `DataCard.tsx` — การเชื่อม

```tsx
<FormFields … />
<div className="my-5 h-px bg-[#eef0f5]" />
{(type === 'promptpay' || type === 'bill') && (
  <>
    <LogoPresetPicker type={type} style={style} patchStyle={patchStyle} />
    <div className="my-5 h-px bg-[#eef0f5]" />
  </>
)}
<LogoUploader style={style} patch={patchStyle} onLogoFile={onLogoFile} />
```

## 8. Edge cases / trade-offs

- **PNG 200×200 เป็น raster** → export ใหญ่ (1024px, โลโก้ ~32% ≈ 328px) จะ upscale เล็กน้อย ยอมรับได้ (พี่เฟิส ✓) — Thai QR Payment เป็น SVG จึงคมเสมอ
- **โลโก้มีวงกลมสีแบรนด์ในตัว** → คอนทราสต์ดี วางตรงๆ ได้ `hideBackgroundDots:true` (ค่าเดิมใน render.ts) เคลียร์ dot ใต้โลโก้ให้สะอาด
- **เปลี่ยน QR type** ไม่เคลียร์ `style.logo`/`logoPreset` อัตโนมัติ (logo เป็น style อิสระจาก type ตามพฤติกรรมเดิม) — picker จะไฮไลต์เฉพาะเมื่อ `logoPreset` อยู่ในหมวดปัจจุบัน; ลบได้ที่ปุ่มลบใน LogoUploader
- **`onLogoFile` เดิม** ต้องตั้ง `logoPreset:null` ด้วย เมื่อผู้ใช้อัปโหลดทับ (ไฮไลต์ preset หาย) — ปรับใน `App.onLogoFile`
- **decode re-check (verify.ts)** ทำงานเหมือนเดิม โลโก้ใหญ่ไป/บังโมดูลมากไปจะเตือน "สแกนไม่ติด" อัตโนมัติ
- **`recent.ts`** เก็บแค่ `type` + `data` ไม่เก็บ `style` → ไม่ต้องแก้ (โลโก้ไม่ถูกกู้จากประวัติอยู่แล้ว)

## 9. แผนตรวจสอบ (Verification)

- `npm run typecheck` ผ่าน (ฟิลด์ใหม่ `logoPreset`, glob types)
- เปิดแอป: หมวด promptpay เห็น 3 preset, หมวด bill เห็น 16 แบงค์ + ค้นหาได้
- เลือกแล้วโลโก้ขึ้นกลาง QR + ECC pill = H + ลบได้
- decode check ยังเขียว (โลโก้ขนาดปกติ)
- export PNG/SVG → โลโก้ฝังในไฟล์ (เปิดไฟล์ SVG เห็น `<image>` มี data URL)
- หมวดอื่น (url ฯลฯ) ไม่เห็น picker ใช้อัปโหลดเองได้ปกติ
```
