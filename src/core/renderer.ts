// Assembles a full QR as an SVG string from a matrix + style settings.
// Supports 20 shapes, 4 gradient modes, separate eye colour, logo + logo background.
import { finderOrigins, isFinder, type QRMatrix } from './qr'
import { bodyModulePath, eyeballPath, eyeFramePath } from './shapes'
import type { StyleSettings } from './types'

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

// Colours come from <input type="color"> but we validate before interpolating
// into SVG markup so the output is never an injection vector.
const safeColor = (c: string): string => (/^#[0-9a-fA-F]{3,8}$/.test(c) ? c : '#000000')

export interface RenderResult {
  svg: string
  moduleCount: number
}

export function renderSVG(matrix: QRMatrix, style: StyleSettings, sizePx: number): RenderResult {
  const N = matrix.size
  const M = style.margin
  const total = N + M * 2
  const off = M // top-left offset of QR content, in module units

  const fg = safeColor(style.fg)
  const bg = safeColor(style.bg)
  const eyeColor = safeColor(style.eyeColor)
  const gradFrom = safeColor(style.gradFrom)
  const gradTo = safeColor(style.gradTo)

  const useGrad = style.gradient !== 'none'
  const fgFill = useGrad ? 'url(#fg-grad)' : fg
  const eyeFill = style.useEyeColor ? eyeColor : fgFill

  // ----- gradient def (continuous across body + eyes, userSpaceOnUse) -----
  let defs = ''
  if (useGrad) {
    const stops = `<stop offset="0" stop-color="${gradFrom}"/><stop offset="1" stop-color="${gradTo}"/>`
    if (style.gradient === 'radial') {
      defs += `<radialGradient id="fg-grad" gradientUnits="userSpaceOnUse" cx="${off + N / 2}" cy="${
        off + N / 2
      }" r="${N * 0.66}">${stops}</radialGradient>`
    } else {
      // linear ↘ vs diagonal ↗
      const [x1, y1, x2, y2] =
        style.gradient === 'diagonal' ? [off, off + N, off + N, off] : [off, off, off + N, off + N]
      defs += `<linearGradient id="fg-grad" gradientUnits="userSpaceOnUse" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}">${stops}</linearGradient>`
    }
  }

  // ----- logo clear zone (skip body modules under the logo) -----
  let clearHalf = 0
  if (style.logo) {
    const logoUnits = style.logoSize * N
    clearHalf = logoUnits / 2 + 0.6 // small padding so dots don't touch the logo
  }
  const center = off + N / 2
  const inClearZone = (cx: number, cy: number) =>
    clearHalf > 0 && Math.abs(cx - center) < clearHalf && Math.abs(cy - center) < clearHalf

  // ----- body modules (everything that isn't a finder) -----
  let bodyD = ''
  for (let r = 0; r < N; r++) {
    for (let c = 0; c < N; c++) {
      if (!matrix.get(r, c) || isFinder(N, r, c)) continue
      const x = c + off
      const y = r + off
      if (inClearZone(x + 0.5, y + 0.5)) continue
      bodyD += bodyModulePath(style.bodyShape, x, y)
    }
  }

  // ----- eyes -----
  let framesD = ''
  let frameSW = 1
  let ballsD = ''
  for (const [or, oc] of finderOrigins(N)) {
    const f = eyeFramePath(style.eyeFrameShape, oc + off, or + off)
    framesD += f.d
    frameSW = f.strokeWidth
    ballsD += eyeballPath(style.eyeballShape, oc + off, or + off)
  }

  // ----- logo -----
  let logoMarkup = ''
  if (style.logo) {
    const lUnits = style.logoSize * N
    const lx = center - lUnits / 2
    const ly = center - lUnits / 2
    const padUnits = 0.5
    const bx = lx - padUnits
    const by = ly - padUnits
    const bSize = lUnits + padUnits * 2
    if (style.logoBg !== 'none') {
      if (style.logoBg === 'circle') {
        logoMarkup += `<circle cx="${center}" cy="${center}" r="${bSize / 2}" fill="${bg}"/>`
      } else {
        const rx = style.logoBg === 'rounded' ? bSize * 0.22 : 0
        logoMarkup += `<rect x="${bx}" y="${by}" width="${bSize}" height="${bSize}" rx="${rx}" fill="${bg}"/>`
      }
    }
    logoMarkup += `<image href="${esc(
      style.logo,
    )}" x="${lx}" y="${ly}" width="${lUnits}" height="${lUnits}" preserveAspectRatio="xMidYMid meet"/>`
  }

  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="${sizePx}" height="${sizePx}" viewBox="0 0 ${total} ${total}">` +
    `<defs>${defs}</defs>` +
    `<rect width="${total}" height="${total}" fill="${bg}"/>` +
    (bodyD ? `<path d="${bodyD}" fill="${fgFill}"/>` : '') +
    (framesD ? `<path d="${framesD}" fill="none" stroke="${eyeFill}" stroke-width="${frameSW}"/>` : '') +
    (ballsD ? `<path d="${ballsD}" fill="${eyeFill}"/>` : '') +
    logoMarkup +
    `</svg>`

  return { svg, moduleCount: N }
}
