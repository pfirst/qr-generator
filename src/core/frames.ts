import type { FrameStyle, StyleSettings } from './types'
// Real frame chrome pulled from th.qr-code-generator.com (per พี่เฟิส's request), with
// the example QR and the outlined "SCAN ME" stripped out. We inject our own QR into the
// QR slot and overlay our own editable label (LINE Seed). `?raw` gives the file as a string.
import classicTpl from '../assets/frames/classic.svg?raw'
import coffeeTpl from '../assets/frames/coffee.svg?raw'
import chefTpl from '../assets/frames/chef.svg?raw'

export type FrameTemplate = {
  label: string // UI label
  svg: string // frame chrome (QR + CallToAction removed); uses class="frame-color" for the themeable parts
  vb: { w: number; h: number } // template viewBox
  slot: { x: number; y: number; w: number } // where our (square) QR is injected, template coords
  labelSlot: { x: number; y: number; w: number; h: number } // where the original SCAN ME sat → our text
  labelOnFill: boolean // true: label drawn in frameColor on a light area (coffee); false: label is contrast-on-fill (classic/chef)
}

// Metadata measured from the reference SVGs via getBBox() + nested-svg attributes.
export const FRAME_TEMPLATES: Record<Exclude<FrameStyle, 'none'>, FrameTemplate> = {
  classic: { label: 'Classic', svg: classicTpl, vb: { w: 279.1, h: 346.6 }, slot: { x: 9.7, y: 9.6, w: 259.9 }, labelSlot: { x: 41.1, y: 289.3, w: 196.9, h: 36.3 }, labelOnFill: false },
  coffee: { label: 'Coffee', svg: coffeeTpl, vb: { w: 406.2, h: 514.3 }, slot: { x: 46.8, y: 108.6, w: 259.8 }, labelSlot: { x: 30.2, y: 461, w: 293.2, h: 54 }, labelOnFill: true },
  chef: { label: 'Chef', svg: chefTpl, vb: { w: 279.1, h: 538.4 }, slot: { x: 9.7, y: 201.4, w: 259.9 }, labelSlot: { x: 41.1, y: 481.1, w: 196.9, h: 36.3 }, labelOnFill: false },
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
