// Rasterise the QR SVG and export as PNG / JPG / SVG / PDF, copy, or print.
import { renderQrSvg, type RenderInput } from './render'
import type { StyleSettings } from './types'

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

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

// Render QR to a canvas at `px` resolution, adding the CTA frame when enabled.
export async function rasterCanvas(
  input: RenderInput,
  style: StyleSettings,
  px: number,
): Promise<HTMLCanvasElement> {
  const svg = await renderQrSvg(input.data, input.ecc, style, px, input.count)
  const img = await svgToImage(svg)
  const W = px

  let cw = W
  let ch = W
  let qx = 0
  let qy = 0
  let labelH = 0
  let pad = 0
  if (style.frameStyle !== 'none') {
    pad = Math.round(W * 0.05)
    labelH = Math.round(W * 0.15)
    cw = W + pad * 2
    ch = W + pad * 2 + labelH
    qx = pad
    qy = pad
  }

  const c = document.createElement('canvas')
  c.width = cw
  c.height = ch
  const ctx = c.getContext('2d')!
  ctx.fillStyle = style.bg
  ctx.fillRect(0, 0, cw, ch)

  if (style.frameStyle !== 'none') {
    const lw = Math.max(6, Math.round(W * 0.018))
    const radius = Math.round(W * 0.05)
    ctx.strokeStyle = style.frameColor
    ctx.lineWidth = lw
    roundRect(ctx, lw / 2, lw / 2, cw - lw, ch - lw, radius)
    ctx.stroke()
    ctx.fillStyle = style.frameColor
    roundRect(ctx, lw / 2, W + pad * 2 - radius, cw - lw, labelH + radius - lw / 2, radius)
    ctx.fill()
    ctx.fillStyle = '#ffffff'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.font = `800 ${Math.round(labelH * 0.42)}px 'LINE Seed Sans TH', sans-serif`
    ctx.fillText(style.frameText || 'SCAN ME', cw / 2, W + pad * 2 + labelH / 2)
  }

  ctx.drawImage(img, qx, qy, W, W)
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
    const svg = await renderQrSvg(input.data, input.ecc, style, px, input.count)
    saveBlob(new Blob([svg], { type: 'image/svg+xml;charset=utf-8' }), fname(typeLabel, 'svg'))
    return
  }
  const canvas = await rasterCanvas(input, style, px)
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
  const blob = rasterCanvas(input, style, px).then((canvas) => canvasToBlob(canvas, 'image/png'))
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
