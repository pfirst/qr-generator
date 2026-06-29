import type { FrameStyle, StyleSettings } from './types'

// All geometry is a ratio of Q = the QR image width (incl. its quiet zone),
// measured from the qrcg reference SVGs via getBBox()+path parse. Tuned in the
// measure-compare loop (plan Task 5).
export type FramePreset = {
  label: string // UI label (gallery button)
  layout: 'border-banner' | 'tag-border' | 'outline-below' | 'banner-only'
  border: number // ×Q — frame/QR margin; 0 = none
  radiusOut: number // ×Q — outer corner radius
  radiusIn: number // ×Q — QR window corner radius (rounded corners on the QR)
  labelW: number // ×Q — max label width
  labelH: number // ×Q — label cap height → font size
  banner?: { height: number; pointer?: { w: number; h: number } } // ×Q (bottom banner)
  tag?: { height: number; pointer: { w: number; h: number } } // ×Q (top tag, bubble)
  gapBelow?: number // ×Q — gap between frame and below-label (basic)
}

export const FRAME_PRESETS: Record<Exclude<FrameStyle, 'none'>, FramePreset> = {
  classic: {
    label: 'Classic', layout: 'border-banner',
    border: 0.041, radiusOut: 0.053, radiusIn: 0.028,
    labelW: 0.758, labelH: 0.105, banner: { height: 0.297 },
  },
  bubble: {
    label: 'Bubble', layout: 'tag-border',
    border: 0.037, radiusOut: 0.053, radiusIn: 0.028,
    labelW: 0.758, labelH: 0.105, tag: { height: 0.34, pointer: { w: 0.12, h: 0.08 } },
  },
  basic: {
    label: 'Basic', layout: 'outline-below',
    border: 0.041, radiusOut: 0.053, radiusIn: 0.028,
    labelW: 1.0, labelH: 0.15, gapBelow: 0.095,
  },
  banner: {
    label: 'Banner', layout: 'banner-only',
    border: 0.025, radiusOut: 0.046, radiusIn: 0,
    labelW: 0.735, labelH: 0.1, banner: { height: 0.242, pointer: { w: 0.171, h: 0.064 } },
  },
}

let uid = 0 // unique clip-path ids so multiple framed SVGs on one page never collide

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

// label colour when it sits on the frameColor fill (banner / tag)
function onFill(frameColor: string): string {
  return relLuminance(frameColor) > 0.6 ? '#111111' : '#ffffff'
}

// Centred label. Shrinks the font (down to a floor) so long text never overflows maxW.
function labelSvg(text: string, cx: number, cy: number, cap: number, maxW: number, color: string): string {
  const t = esc((text || 'SCAN ME').toUpperCase())
  let fs = cap * 1.38 // cap height → font-size for a bold sans
  const est = t.length * fs * 0.62 // rough advance for bold uppercase sans
  if (est > maxW) fs = Math.max(fs * 0.45, (fs * maxW) / est)
  const ls = (fs * 0.06).toFixed(2)
  return (
    `<text x="${cx.toFixed(1)}" y="${cy.toFixed(1)}" text-anchor="middle" ` +
    `dominant-baseline="central" font-family="Arial, Helvetica, sans-serif" ` +
    `font-weight="700" font-size="${fs.toFixed(1)}" letter-spacing="${ls}" fill="${color}">${t}</text>`
  )
}

function rrect(x: number, y: number, w: number, h: number, r: number, attrs: string): string {
  return `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${w.toFixed(1)}" height="${h.toFixed(1)}" rx="${r.toFixed(1)}" ${attrs}/>`
}

// Place the (already-rendered) QR SVG at (x,y), clipped to a rounded square so its
// corners match the frame's inner window. Returns clipPath def + clipped group.
function placeQr(innerSvg: string, x: number, y: number, q: number, ri: number): string {
  const id = `qf-clip-${uid++}`
  const placed = innerSvg.replace(/<svg\b/, `<svg x="${x.toFixed(1)}" y="${y.toFixed(1)}"`)
  if (ri <= 0) return placed
  return (
    `<defs><clipPath id="${id}">${rrect(x, y, q, q, ri, '')}</clipPath></defs>` +
    `<g clip-path="url(#${id})">${placed}</g>`
  )
}

// solid bottom banner with rounded bottom corners + optional up-pointer (apex centred on top edge)
function bottomBanner(W: number, top: number, h: number, r: number, fill: string, pointer?: { w: number; h: number }): string {
  const bottom = top + h
  const cx = W / 2
  const point = pointer
    ? `M${(cx - pointer.w / 2).toFixed(1)},${top.toFixed(1)} L${cx.toFixed(1)},${(top - pointer.h).toFixed(1)} L${(cx + pointer.w / 2).toFixed(1)},${top.toFixed(1)} Z`
    : ''
  const rectPath =
    `M0,${top.toFixed(1)} H${W.toFixed(1)} V${(bottom - r).toFixed(1)} ` +
    `Q${W.toFixed(1)},${bottom.toFixed(1)} ${(W - r).toFixed(1)},${bottom.toFixed(1)} ` +
    `H${r.toFixed(1)} Q0,${bottom.toFixed(1)} 0,${(bottom - r).toFixed(1)} Z`
  return `<path d="${rectPath}" fill="${fill}"/>` + (point ? `<path d="${point}" fill="${fill}"/>` : '')
}

export function composeFramedSvg(innerSvg: string, qrPx: number, style: StyleSettings): string {
  if (style.frameStyle === 'none') return innerSvg
  const p = FRAME_PRESETS[style.frameStyle]
  const Q = qrPx
  const B = p.border * Q
  const Ro = p.radiusOut * Q
  const Ri = p.radiusIn * Q
  const fc = style.frameColor
  const cap = p.labelH * Q
  const maxLabel = p.labelW * Q
  const open = (W: number, H: number) =>
    `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${W.toFixed(1)}" height="${H.toFixed(1)}" viewBox="0 0 ${W.toFixed(1)} ${H.toFixed(1)}">`

  if (p.layout === 'border-banner') {
    const bannerH = p.banner!.height * Q
    const W = Q + 2 * B
    const H = B + Q + bannerH
    const behind = rrect(0, 0, W, H, Ro, `fill="${fc}"`)
    const qr = placeQr(innerSvg, B, B, Q, Ri)
    const label = labelSvg(style.frameText, W / 2, B + Q + bannerH / 2, cap, maxLabel, onFill(fc))
    return open(W, H) + behind + qr + label + '</svg>'
  }

  if (p.layout === 'tag-border') {
    const tagH = p.tag!.height * Q
    const pt = p.tag!.pointer
    const tagRegion = tagH + pt.h * Q
    const W = Q + 2 * B
    const H = tagRegion + B + Q + B
    const borderRect = rrect(0, tagRegion, W, B + Q + B, Ro, `fill="${fc}"`)
    const qr = placeQr(innerSvg, B, tagRegion + B, Q, Ri)
    const tag = rrect(0, 0, W, tagH, Ro, `fill="${fc}"`)
    const cx = W / 2
    const pointer = `<path d="M${(cx - (pt.w * Q) / 2).toFixed(1)},${tagH.toFixed(1)} L${cx.toFixed(1)},${tagRegion.toFixed(1)} L${(cx + (pt.w * Q) / 2).toFixed(1)},${tagH.toFixed(1)} Z" fill="${fc}"/>`
    const label = labelSvg(style.frameText, cx, tagH / 2, cap, maxLabel, onFill(fc))
    return open(W, H) + borderRect + qr + tag + pointer + label + '</svg>'
  }

  if (p.layout === 'outline-below') {
    const gap = (p.gapBelow ?? 0.095) * Q
    const ringBox = B + Q + B
    const W = Q + 2 * B
    const H = ringBox + gap + cap * 1.6
    const ring = rrect(B / 2, B / 2, Q + B, Q + B, Ro, `fill="none" stroke="${fc}" stroke-width="${B.toFixed(1)}"`)
    const qr = placeQr(innerSvg, B, B, Q, Ri)
    const label = labelSvg(style.frameText, W / 2, ringBox + gap + cap * 0.8, cap, maxLabel, fc)
    return open(W, H) + ring + qr + label + '</svg>'
  }

  // banner-only
  const m = B // tiny margin (quiet zone only)
  const bannerH = p.banner!.height * Q
  const pt = p.banner!.pointer!
  const W = Q + 2 * m
  const bannerTop = m + Q + pt.h * Q
  const H = bannerTop + bannerH
  const qr = placeQr(innerSvg, m, m, Q, Ri)
  const banner = bottomBanner(W, bannerTop, bannerH, Ro, fc, { w: pt.w * Q, h: pt.h * Q })
  const label = labelSvg(style.frameText, W / 2, bannerTop + bannerH / 2, cap, maxLabel * 1, onFill(fc))
  return open(W, H) + qr + banner + label + '</svg>'
}
