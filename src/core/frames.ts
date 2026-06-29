import type { FrameStyle, StyleSettings } from './types'
// Real frame chrome pulled from th.qr-code-generator.com (per พี่เฟิส's request), with
// the example QR and the outlined "SCAN ME" stripped out. We inject our own QR into the
// QR slot and overlay our own editable label (LINE Seed). `?raw` gives the file as a string.
import classicTpl from '../assets/frames/classic.svg?raw'
import bubbleTpl from '../assets/frames/bubble.svg?raw'
import basicTpl from '../assets/frames/basic.svg?raw'
import bannerTpl from '../assets/frames/banner.svg?raw'
import tooltipTpl from '../assets/frames/tooltip.svg?raw'
import letterTpl from '../assets/frames/letter.svg?raw'
import arrowTpl from '../assets/frames/arrow.svg?raw'
import ribbonTpl from '../assets/frames/ribbon.svg?raw'
import bagTpl from '../assets/frames/bag.svg?raw'
import coffeeTpl from '../assets/frames/coffee.svg?raw'
import giftTpl from '../assets/frames/gift.svg?raw'
import chefTpl from '../assets/frames/chef.svg?raw'
import phoneTpl from '../assets/frames/phone.svg?raw'
import scriptTpl from '../assets/frames/script.svg?raw'

export type FrameTemplate = {
  label: string // UI label
  svg: string // frame chrome (QR + CallToAction removed); uses class="frame-color" for the themeable parts
  vb: { w: number; h: number } // template viewBox
  slot: { x: number; y: number; w: number } // where our (square) QR is injected, template coords
  labelSlot: { x: number; y: number; w: number; h: number } // where the original SCAN ME sat → our text
  labelOnFill: boolean // true: label drawn in frameColor on a light area (coffee); false: label is contrast-on-fill (classic/chef)
}

// Metadata measured from the reference SVGs via getBBox() + nested-svg attributes.
// labelOnFill = the original label was the dark themeable colour on a light area
// (→ our label uses frameColor); false = it sat white on the coloured chrome (→ contrast).
export const FRAME_TEMPLATES: Record<Exclude<FrameStyle, 'none'>, FrameTemplate> = {
  classic: { label: 'คลาสสิก', svg: classicTpl, vb: { w: 279.1, h: 346.6 }, slot: { x: 9.7, y: 9.6, w: 259.9 }, labelSlot: { x: 41.1, y: 289.3, w: 196.9, h: 36.3 }, labelOnFill: false },
  bubble: { label: 'ป้ายบน', svg: bubbleTpl, vb: { w: 279, h: 401.2 }, slot: { x: 9.6, y: 131.7, w: 259.9 }, labelSlot: { x: 40.6, y: 20.8, w: 197, h: 36.3 }, labelOnFill: false },
  basic: { label: 'ขอบบาง', svg: basicTpl, vb: { w: 279.1, h: 355.1 }, slot: { x: 9.7, y: 9.6, w: 259.8 }, labelSlot: { x: 0.1, y: 303.8, w: 279, h: 51.4 }, labelOnFill: true },
  banner: { label: 'แถบล่าง', svg: bannerTpl, vb: { w: 281.1, h: 368.6 }, slot: { x: 6.8, y: 6.1, w: 267.7 }, labelSlot: { x: 42.1, y: 312.6, w: 196.9, h: 36.3 }, labelOnFill: false },
  tooltip: { label: 'ทูลทิป', svg: tooltipTpl, vb: { w: 279, h: 401.3 }, slot: { x: 9.7, y: 9.6, w: 259.9 }, labelSlot: { x: 41.5, y: 345.1, w: 197, h: 36.3 }, labelOnFill: false },
  letter: { label: 'ซองจดหมาย', svg: letterTpl, vb: { w: 337.1, h: 437.9 }, slot: { x: 35, y: 7.7, w: 267.1 }, labelSlot: { x: 70.1, y: 375.2, w: 196.9, h: 36.4 }, labelOnFill: false },
  arrow: { label: 'ลูกศร', svg: arrowTpl, vb: { w: 343.1, h: 395.1 }, slot: { x: 68, y: 6.1, w: 268 }, labelSlot: { x: 41.8, y: 305.9, w: 301.3, h: 90.2 }, labelOnFill: true },
  ribbon: { label: 'ริบบิ้น', svg: ribbonTpl, vb: { w: 405.2, h: 362.7 }, slot: { x: 68.9, y: 7.7, w: 267.7 }, labelSlot: { x: 104.2, y: 304, w: 197, h: 36.3 }, labelOnFill: false },
  bag: { label: 'ถุงช้อป', svg: bagTpl, vb: { w: 312.6, h: 448.8 }, slot: { x: 26.4, y: 95.7, w: 259.8 }, labelSlot: { x: 57.4, y: 378.4, w: 197, h: 36.3 }, labelOnFill: false },
  coffee: { label: 'กาแฟ', svg: coffeeTpl, vb: { w: 406.2, h: 514.3 }, slot: { x: 46.8, y: 108.6, w: 259.8 }, labelSlot: { x: 30.2, y: 461, w: 293.2, h: 54 }, labelOnFill: true },
  gift: { label: 'ของขวัญ', svg: giftTpl, vb: { w: 324.6, h: 467.9 }, slot: { x: 32.4, y: 198.5, w: 259.8 }, labelSlot: { x: 63.3, y: 117.2, w: 197.1, h: 36.3 }, labelOnFill: false },
  chef: { label: 'เชฟ', svg: chefTpl, vb: { w: 279.1, h: 538.4 }, slot: { x: 9.7, y: 201.4, w: 259.9 }, labelSlot: { x: 41.1, y: 481.1, w: 196.9, h: 36.3 }, labelOnFill: false },
  phone: { label: 'มือถือ', svg: phoneTpl, vb: { w: 281.1, h: 475.8 }, slot: { x: 6.7, y: 74.3, w: 267.7 }, labelSlot: { x: 41.9, y: 357.9, w: 197.1, h: 36.3 }, labelOnFill: false },
  script: { label: 'ลายมือ', svg: scriptTpl, vb: { w: 344, h: 422.3 }, slot: { x: 38.2, y: 6.7, w: 267.7 }, labelSlot: { x: -0.2, y: 297.5, w: 344.1, h: 124.8 }, labelOnFill: true },
}

let uid = 0 // unique root id per render so each framed SVG's <style> stays scoped to itself

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function relLuminance(hex: string): number {
  const h = hex.replace('#', '')
  const n = h.length === 3 ? h.split('').map((c) => c + c).join('') : h
  const r = parseInt(n.slice(0, 2), 16) / 255
  const g = parseInt(n.slice(2, 4), 16) / 255
  const b = parseInt(n.slice(4, 6), 16) / 255
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

// Validate a user colour to a hex literal before it goes into SVG attributes / CSS
// (the framed SVG is injected via dangerouslySetInnerHTML — blocks attribute/CSS breakout).
function safeColor(c: string): string {
  return /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(c) ? c : '#000000'
}

function contrast(hex: string): string {
  return relLuminance(hex) > 0.6 ? '#111111' : '#ffffff'
}

const LABEL_FONT = "'LINE Seed Sans TH','LINE Seed Sans',Arial,Helvetica,sans-serif"

// Scope a template's <style> to a single root id so its class rules (frame-color, shadows,
// hat-background, …) can't leak to the page or collide between two framed SVGs.
function scopeStyle(svg: string, id: string): string {
  return svg.replace(/<style>([\s\S]*?)<\/style>/i, (_m, css: string) => {
    const scoped = css.replace(/(^|[},])\s*\.([a-zA-Z0-9_-]+)/g, (_x, pre: string, cls: string) => `${pre}#${id} .${cls}`)
    return `<style>${scoped}</style>`
  })
}

// Centred label that shrinks to fit the slot width.
function labelText(text: string, slot: FrameTemplate['labelSlot'], color: string): string {
  const t = esc((text || 'SCAN ME').toUpperCase())
  let fs = slot.h * 0.92
  const est = t.length * fs * 0.62
  if (est > slot.w) fs = Math.max(fs * 0.45, (fs * slot.w) / est)
  const cx = slot.x + slot.w / 2
  const cy = slot.y + slot.h / 2
  return (
    `<text x="${cx.toFixed(1)}" y="${cy.toFixed(1)}" text-anchor="middle" dominant-baseline="central" ` +
    `font-family="${LABEL_FONT}" font-weight="800" font-size="${fs.toFixed(1)}" letter-spacing="${(fs * 0.04).toFixed(2)}" fill="${color}">${t}</text>`
  )
}

export function composeFramedSvg(innerSvg: string, _qrPx: number, style: StyleSettings): string {
  if (style.frameStyle === 'none') return innerSvg
  const t = FRAME_TEMPLATES[style.frameStyle]
  const fc = safeColor(style.frameColor)
  const id = `qf${uid++}`

  // 1) take the chrome, give the root a unique id + explicit pixel size (so raster export
  //    can read naturalWidth/Height), inline the themeable colour, scope the rest.
  let out = t.svg
    .replace(/<svg\b/, `<svg id="${id}" width="${t.vb.w}" height="${t.vb.h}"`)
    .replace(/\sclass="frame-color"/g, ` fill="${fc}"`)
  out = scopeStyle(out, id)

  // 2) inject our QR into the slot — strip the QR root's own width/height/x/y first so
  //    ours win, then size it to the square slot (its viewBox scales the content in).
  const qr = innerSvg.replace(/<svg\b[^>]*?>/, (m) =>
    m.replace(/\s(?:width|height|x|y)="[^"]*"/g, '').replace(/^<svg/, `<svg x="${t.slot.x}" y="${t.slot.y}" width="${t.slot.w}" height="${t.slot.w}"`),
  )

  // 3) overlay our editable label where the original SCAN ME sat
  const label = labelText(style.frameText, t.labelSlot, t.labelOnFill ? fc : contrast(fc))

  // QR + label go on top (end of the root), in the QR window / label slot
  return out.replace(/<\/svg>\s*$/i, `${qr}${label}</svg>`)
}

// Small chrome-only preview for the gallery buttons (no QR data, neutral colour + a
// placeholder square where the QR would sit).
export function frameThumb(id: Exclude<FrameStyle, 'none'>): string {
  const t = FRAME_TEMPLATES[id]
  const rid = `qt${uid++}`
  let out = t.svg
    .replace(/<svg\b/, `<svg id="${rid}"`)
    .replace(/\sclass="frame-color"/g, ` fill="#9ca3af"`)
  out = scopeStyle(out, rid)
  const ph = `<rect x="${t.slot.x}" y="${t.slot.y}" width="${t.slot.w}" height="${t.slot.w}" rx="14" fill="#e5e7eb"/>`
  return out.replace(/<\/svg>\s*$/i, `${ph}</svg>`)
}
