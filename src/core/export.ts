// Rasterise the QR SVG and export as PNG / JPG / SVG / PDF, copy, or print.
import { renderQrSvg, type RenderInput } from './render'
import type { StyleSettings } from './types'
import { composeFramedSvg } from './frames'
import { ensureFontCss } from './fonts'

export type ExportFormat = 'png' | 'jpg' | 'webp' | 'svg' | 'pdf'

function svgToImage(svg: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(url)
      resolve(img)
    }
    img.onerror = (e) => {
      URL.revokeObjectURL(url)
      reject(e)
    }
    img.src = url
  })
}

export async function rasterCanvas(
  input: RenderInput,
  style: StyleSettings,
  px: number,
  opts?: { transparent?: boolean },
): Promise<HTMLCanvasElement> {
  // Embed the CTA font before composing so the rasterised SVG carries its glyphs (an
  // <img>-loaded SVG can't fetch fonts → the label would otherwise fall back).
  if (style.frameStyle !== 'none') await ensureFontCss(style.frameFont)
  const inner = await renderQrSvg(input.data, input.ecc, style, px, input.count)
  const framed = composeFramedSvg(inner, px, style)
  const img = await svgToImage(framed)
  const w = img.naturalWidth || px
  const h = img.naturalHeight || px
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  const ctx = c.getContext('2d')!
  // Fill first so rounded-corner / outside-the-card gaps aren't black on JPG. Skipped when
  // the caller wants alpha (PNG/WebP copy + export of a framed QR) — then the area around the
  // non-rectangular frame card stays transparent so it pastes cleanly onto any surface. The QR
  // itself keeps its own background (qr-code-styling draws a style.bg rect in the slot).
  if (!opts?.transparent) {
    ctx.fillStyle = style.bg
    ctx.fillRect(0, 0, w, h)
  }
  ctx.drawImage(img, 0, 0, w, h)
  return c
}

function canvasToBlob(c: HTMLCanvasElement, type: string, quality?: number): Promise<Blob> {
  return new Promise((resolve, reject) =>
    c.toBlob((b) => (b ? resolve(b) : reject(new Error('toBlob failed'))), type, quality),
  )
}

function saveBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1500)
}

const fname = (type: string, ext: string) => `qr-${type}-${Date.now()}.${ext}`

export async function downloadQR(
  input: RenderInput,
  style: StyleSettings,
  px: number,
  format: ExportFormat,
  typeLabel: string,
): Promise<void> {
  if (format === 'svg') {
    // Embed the CTA font so the exported SVG is self-contained + portable (opens with the
    // right label face anywhere, not just where the Google font happens to be installed).
    if (style.frameStyle !== 'none') await ensureFontCss(style.frameFont)
    const inner = await renderQrSvg(input.data, input.ecc, style, px, input.count)
    saveBlob(new Blob([composeFramedSvg(inner, px, style)], { type: 'image/svg+xml;charset=utf-8' }), fname(typeLabel, 'svg'))
    return
  }
  // PNG/WebP carry alpha, so a framed QR exports with a clear area around the card (matches
  // copy-to-clipboard). JPG/PDF have no alpha → keep the opaque style.bg fill.
  const transparent = (format === 'png' || format === 'webp') && style.frameStyle !== 'none'
  const canvas = await rasterCanvas(input, style, px, { transparent })
  if (format === 'pdf') {
    const dataUrl = canvas.toDataURL('image/png')
    const { jsPDF } = await import('jspdf') // lazy: keeps jspdf out of the initial bundle
    const pdf = new jsPDF({ unit: 'pt', format: 'a4' })
    const pageW = 595
    const side = 320
    const x = (pageW - side) / 2
    const aspect = canvas.height / canvas.width
    pdf.addImage(dataUrl, 'PNG', x, 150, side, side * aspect)
    pdf.setFontSize(11)
    pdf.setTextColor(120)
    pdf.text('Generated with QR Studio', x, 150 + side * aspect + 28)
    pdf.save(fname(typeLabel, 'pdf'))
    return
  }
  const mime = format === 'jpg' ? 'image/jpeg' : format === 'webp' ? 'image/webp' : 'image/png'
  const blob = await canvasToBlob(canvas, mime, 0.95)
  saveBlob(blob, fname(typeLabel, format))
}

export async function copyQRToClipboard(input: RenderInput, style: StyleSettings, px: number): Promise<void> {
  // Safari only allows clipboard.write() while the click's user-activation is still
  // live, so we must call it synchronously and hand it a Promise<Blob> — awaiting the
  // raster before the write would expire the gesture and throw NotAllowedError.
  // PNG carries alpha: with a frame, leave the area around the card transparent so it
  // pastes cleanly onto any surface (no coloured box).
  const transparent = style.frameStyle !== 'none'
  const blob = rasterCanvas(input, style, px, { transparent }).then((canvas) => canvasToBlob(canvas, 'image/png'))
  await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })])
}

export async function printQR(input: RenderInput, style: StyleSettings, px: number): Promise<void> {
  // Open the window synchronously while the click's user-activation is still live —
  // Safari blocks window.open() if we await the raster first (same gesture expiry that
  // affects clipboard.write above). Render after the window exists, closing it on error.
  const w = window.open('', '_blank')
  if (!w) throw new Error('popup blocked')
  try {
    const canvas = await rasterCanvas(input, style, px)
    const doc = w.document
    doc.title = 'QR Code'
    const styleEl = doc.createElement('style')
    styleEl.textContent =
      '*{margin:0;padding:0}body{display:flex;align-items:center;justify-content:center;min-height:100vh;background:#fff}img{width:80vmin;height:auto}'
    doc.head.appendChild(styleEl)
    const img = doc.createElement('img')
    img.src = canvas.toDataURL('image/png') // canvas-generated base64 PNG — no external/user HTML
    img.onload = () => {
      w.print()
      setTimeout(() => w.close(), 500)
    }
    doc.body.appendChild(img)
  } catch (e) {
    w.close()
    throw e
  }
}
