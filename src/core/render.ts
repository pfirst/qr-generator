// QR renderer built on `qr-code-styling` — the same library Figma's QR
// generator uses — so the shape geometry (squircle, cornerflow, dots, …)
// matches Figma exactly. Produces an SVG string; everything downstream
// (preview, raster export, decode check, thumbnail) consumes that string.
import QRCodeStyling from 'qr-code-styling'
import type { CornerDotType, CornerSquareType, DotType, Gradient } from 'qr-code-styling'
import type { BodyShape, Ecc, EyeballShape, EyeFrameShape, StyleSettings } from './types'

// Figma UI shape → qr-code-styling type (extracted from Figma's own bundle).
const CELL_TYPE: Record<BodyShape, DotType> = {
  square: 'square',
  circle: 'dots',
  rounded: 'rounded',
  squircle: 'extra-rounded',
  cornerflow: 'classy-rounded',
}
const BORDER_TYPE: Record<EyeFrameShape, CornerSquareType> = {
  square: 'square',
  circle: 'dot',
  dots: 'dots',
  rounded: 'rounded',
  squircle: 'extra-rounded',
  cornerflow: 'classy-rounded',
}
const CENTER_TYPE: Record<EyeballShape, CornerDotType> = {
  square: 'square',
  circle: 'dot',
  dots: 'dots',
  rounded: 'rounded',
  squircle: 'extra-rounded',
  cornerflow: 'classy-rounded',
}

// Everything needed to render a QR, independent of pixel size / style.
export interface RenderInput {
  data: string // the encoded payload string
  ecc: Ecc
  count: number // module count (from the validated matrix) for exact quiet zone
}

const safeColor = (c: string): string => (/^#[0-9a-fA-F]{3,8}$/.test(c) ? c : '#000000')

function gradientOf(style: StyleSettings): Gradient | undefined {
  if (style.gradient === 'none') return undefined
  return {
    type: style.gradient === 'radial' ? 'radial' : 'linear',
    rotation: style.gradient === 'diagonal' ? Math.PI / 4 : 0,
    colorStops: [
      { offset: 0, color: safeColor(style.gradFrom) },
      { offset: 1, color: safeColor(style.gradTo) },
    ],
  }
}

// Colour block for a section: solid colour or gradient.
function paint(color: string, grad: Gradient | undefined) {
  return grad ? { gradient: grad } : { color: safeColor(color) }
}

// Convert a module-unit quiet zone to the px margin qr-code-styling expects.
// marginPx = M * size / (count + 2M) keeps the quiet zone exactly M modules wide.
function marginPx(style: StyleSettings, sizePx: number, count: number): number {
  const M = style.margin
  if (!count) return Math.round((M * sizePx) / 33)
  return Math.round((M * sizePx) / (count + 2 * M))
}

function buildOptions(data: string, ecc: Ecc, style: StyleSettings, sizePx: number, count: number) {
  const grad = gradientOf(style)
  const dotPaint = paint(style.fg, grad)
  // Eyes follow the body unless a separate eye colour is enabled (then solid).
  const eyePaint = style.useEyeColor ? { color: safeColor(style.eyeColor) } : dotPaint

  return {
    type: 'svg' as const,
    width: sizePx,
    height: sizePx,
    margin: marginPx(style, sizePx, count),
    data,
    qrOptions: { errorCorrectionLevel: ecc },
    dotsOptions: { type: CELL_TYPE[style.bodyShape], ...dotPaint },
    cornersSquareOptions: { type: BORDER_TYPE[style.eyeFrameShape], ...eyePaint },
    cornersDotOptions: { type: CENTER_TYPE[style.eyeballShape], ...eyePaint },
    backgroundOptions: { color: safeColor(style.bg) },
    ...(style.logo
      ? {
          image: style.logo,
          imageOptions: {
            crossOrigin: 'anonymous' as const,
            margin: 0,
            imageSize: style.logoSize,
            // Never let the library clear its default SQUARE behind the logo — it only ever
            // clears a square, which reads as a hard white box around the mark. Modules always
            // render; the backing is whatever WE draw: a circle/rounded/square plate (logoBg),
            // or nothing for 'none' (the logo overlays the modules directly — the PromptPay
            // preset SVG carries its own white halo so it still separates cleanly).
            hideBackgroundDots: false,
            saveAsBlob: false,
          },
        }
      : {}),
  }
}

// qr-code-styling builds a SEPARATE gradient per section — one for the dots, plus one
// for EACH corner eye — each scoped to that section's own bounding box. So the gradient
// "restarts" inside every eye and the sweep looks chopped up ("แยกส่วน"). The dots
// gradient already spans the full module area, so we point every eye fill at it →
// one continuous sweep across the whole QR. Skipped when the eyes use their own solid
// colour (useEyeColor) or there's no gradient at all.
function unifyGradient(svg: string, style: StyleSettings): string {
  if (style.gradient === 'none' || style.useEyeColor) return svg
  const dotId = svg.match(/id="(dot-color-[^"]+)"/)?.[1]
  if (!dotId) return svg
  // Repoint eye fills (`url('#corners-square-color-…')` / `…corners-dot-color-…`) to the
  // dots gradient. The leading `clip-path-…` ids are untouched (regex anchors on `#corners-`).
  return svg.replace(/url\((['"]?)#corners-(?:square|dot)-color-[^'")]+\1\)/g, `url('#${dotId}')`)
}

// qr-code-styling emits the logo <image> with a bare `href`; Adobe Illustrator
// and some tools only honour `xlink:href`. Add the namespace + xlink:href, and
// draw the optional coloured logo background (which the library doesn't do).
function postProcess(svg: string, style: StyleSettings): string {
  let out = unifyGradient(svg, style)

  if (!/xmlns:xlink=/.test(out)) {
    out = out.replace('<svg ', '<svg xmlns:xlink="http://www.w3.org/1999/xlink" ')
  }

  const img = out.match(/<image\b[^>]*\bhref="([^"]+)"[^>]*>/)
  if (img) {
    const tag = img[0]
    // mirror href → xlink:href so legacy/design tools load the embedded logo
    if (!/xlink:href=/.test(tag)) {
      out = out.replace(tag, tag.replace(/\bhref="/, 'xlink:href="').replace('<image ', '<image href="' + img[1] + '" '))
    }
    // coloured background behind the logo (circle / rounded / square)
    if (style.logoBg !== 'none') {
      // qr-code-styling emits the image width/height WITH a unit ("56px"), so a regex that
      // demands a bare number before the closing quote matched nothing → iw/ih were 0 and
      // the plate was never drawn. Accept an optional `px` suffix.
      const num = (a: string) => {
        const m = img[0].match(new RegExp(a + '="([\\d.]+)(?:px)?"'))
        return m ? parseFloat(m[1]) : 0
      }
      const ix = num('x')
      const iy = num('y')
      const iw = num('width')
      const ih = num('height')
      if (iw && ih) {
        const pad = Math.max(iw, ih) * style.logoPadding
        const bx = ix - pad
        const by = iy - pad
        const bw = iw + pad * 2
        const bh = ih + pad * 2
        const bg = safeColor(style.bg)
        const shape =
          style.logoBg === 'circle'
            ? `<circle cx="${ix + iw / 2}" cy="${iy + ih / 2}" r="${Math.max(bw, bh) / 2}" fill="${bg}"/>`
            : `<rect x="${bx}" y="${by}" width="${bw}" height="${bh}" rx="${
                style.logoBg === 'rounded' ? bw * 0.22 : 0
              }" fill="${bg}"/>`
        const imgTag = out.match(/<image\b[^>]*>/)![0]
        out = out.replace(imgTag, shape + imgTag)
      }
    }
  }

  return out
}

// Render the QR for `data` to an SVG string. `count` is the module count
// (from the validated matrix) so the quiet zone maps to exact module widths.
export async function renderQrSvg(
  data: string,
  ecc: Ecc,
  style: StyleSettings,
  sizePx: number,
  count: number,
): Promise<string> {
  const qr = new QRCodeStyling(buildOptions(data, ecc, style, sizePx, count))
  const raw = await qr.getRawData('svg')
  if (!raw) throw new Error('qr-code-styling produced no SVG')
  const svg = typeof raw === 'string' ? raw : 'text' in raw ? await raw.text() : new TextDecoder().decode(raw)
  return postProcess(svg, style)
}
