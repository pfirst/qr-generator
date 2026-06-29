// Scannability checks: (1) a cheap colour-contrast estimate for live feedback,
// (2) a real decode of the rendered QR (BarcodeDetector → jsQR fallback) to
// confirm that shapes/logo/gradient didn't break readability.
import jsQR from 'jsqr'
import { rasterCanvas } from './export'
import type { RenderInput } from './render'
import type { StyleSettings } from './types'

export type ScanLevel = 'ok' | 'warn' | 'risk'
export interface ContrastResult {
  level: ScanLevel
  label: string
  color: string
  warn: string | null
}

function lum(hex: string): number {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex) || /^#?([0-9a-f]{3})$/i.exec(hex)
  if (!m) return 1
  let h = m[1]
  if (h.length === 3)
    h = h
      .split('')
      .map((c) => c + c)
      .join('')
  const v = [0, 2, 4].map((i) => {
    const c = parseInt(h.slice(i, i + 2), 16) / 255
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
  })
  return 0.2126 * v[0] + 0.7152 * v[1] + 0.0722 * v[2]
}

function ratio(a: string, b: string): number {
  const l1 = lum(a)
  const l2 = lum(b)
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05)
}

const COLORS: Record<ScanLevel, string> = { ok: '#5ee6a8', warn: '#ffb020', risk: '#ff6b9d' }

export function contrastScan(style: StyleSettings): ContrastResult {
  const fg = style.gradient !== 'none' ? style.gradTo : style.fg // worst-case end
  const r = ratio(fg, style.bg)
  const dark = lum(fg) < lum(style.bg)
  let level: ScanLevel
  let warn: string | null = null

  if (!dark) {
    level = 'risk'
    warn = 'สีจุดสว่างกว่าพื้นหลัง — เครื่องสแกนต้องการจุดเข้มบนพื้นสว่าง อาจสแกนไม่ติด'
  } else if (r >= 4) {
    level = 'ok'
  } else if (r >= 2.6) {
    level = 'warn'
    warn = 'ความต่างของสี (contrast) ค่อนข้างต่ำ — แนะนำเพิ่มความเข้มของสีจุดเพื่อให้สแกนง่ายขึ้น'
  } else {
    level = 'risk'
    warn = 'ความต่างของสีต่ำมาก เสี่ยงสแกนไม่ติด — ควรใช้สีจุดเข้มบนพื้นหลังสว่าง'
  }
  if (style.gradient !== 'none' && level === 'ok') {
    level = 'warn'
    warn = warn || 'ใช้ gradient บนตัว QR — ทดสอบสแกนก่อนนำไปใช้จริง'
  }

  const label = level === 'ok' ? 'สแกนได้' : level === 'warn' ? 'เสี่ยง' : 'เสี่ยงสูง'
  return { level, label, color: COLORS[level], warn }
}

// Decode the actual rendered QR. Returns the decoded text, or null if unreadable.
export async function decodeRendered(input: RenderInput, style: StyleSettings): Promise<string | null> {
  // render without the CTA frame so the decoder sees just the code
  const canvas = await rasterCanvas(input, { ...style, frameStyle: 'none' }, 380)

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
