// SVG path generators for module bodies and eyes. All work in "module units"
// (1 unit = 1 QR module); the renderer scales the whole SVG to pixels.

import type { BodyShape, EyeballShape, EyeFrameShape } from './types'

const n = (x: number) => {
  const r = Math.round(x * 1000) / 1000
  return Object.is(r, -0) ? '0' : String(r)
}

// Rounded rectangle with per-corner radii [TL, TR, BR, BL].
export function roundedRectPath(
  x: number,
  y: number,
  w: number,
  h: number,
  radii: [number, number, number, number],
): string {
  const [tl, tr, br, bl] = radii.map((r) => Math.min(r, w / 2, h / 2)) as [number, number, number, number]
  if (tl === 0 && tr === 0 && br === 0 && bl === 0) {
    return `M${n(x)} ${n(y)}H${n(x + w)}V${n(y + h)}H${n(x)}Z`
  }
  return (
    `M${n(x + tl)} ${n(y)}` +
    `H${n(x + w - tr)}` +
    `A${n(tr)} ${n(tr)} 0 0 1 ${n(x + w)} ${n(y + tr)}` +
    `V${n(y + h - br)}` +
    `A${n(br)} ${n(br)} 0 0 1 ${n(x + w - br)} ${n(y + h)}` +
    `H${n(x + bl)}` +
    `A${n(bl)} ${n(bl)} 0 0 1 ${n(x)} ${n(y + h - bl)}` +
    `V${n(y + tl)}` +
    `A${n(tl)} ${n(tl)} 0 0 1 ${n(x + tl)} ${n(y)}` +
    `Z`
  )
}

function circlePath(cx: number, cy: number, r: number): string {
  return `M${n(cx)} ${n(cy - r)}a${n(r)} ${n(r)} 0 1 0 0 ${n(2 * r)}a${n(r)} ${n(r)} 0 1 0 0 ${n(-2 * r)}Z`
}

function polyPath(pts: Array<[number, number]>): string {
  return 'M' + pts.map(([px, py]) => `${n(px)} ${n(py)}`).join('L') + 'Z'
}

// One module body at cell (x,y) of size 1×1, drawn in the chosen shape.
export function bodyModulePath(shape: BodyShape, x: number, y: number): string {
  const cx = x + 0.5
  const cy = y + 0.5
  switch (shape) {
    case 'square':
      return roundedRectPath(x, y, 1, 1, [0, 0, 0, 0])
    case 'rounded':
      return roundedRectPath(x, y, 1, 1, [0.32, 0.32, 0.32, 0.32])
    case 'circle':
      return circlePath(cx, cy, 0.5)
    case 'dot':
      return circlePath(cx, cy, 0.4)
    case 'diamond':
      return polyPath([
        [cx, y + 0.04],
        [x + 0.96, cy],
        [cx, y + 0.96],
        [x + 0.04, cy],
      ])
    case 'triangle':
      return polyPath([
        [cx, y + 0.06],
        [x + 0.96, y + 0.94],
        [x + 0.04, y + 0.94],
      ])
    case 'leaf':
      // two opposite corners fully rounded, two sharp → petal/leaf
      return roundedRectPath(x + 0.04, y + 0.04, 0.92, 0.92, [0.46, 0, 0.46, 0])
    case 'hexagon': {
      const r = 0.52
      const pts: Array<[number, number]> = []
      for (let i = 0; i < 6; i++) {
        const a = (Math.PI / 3) * i - Math.PI / 2
        pts.push([cx + r * Math.cos(a), cy + r * Math.sin(a)])
      }
      return polyPath(pts)
    }
    case 'star': {
      const outer = 0.55
      const inner = 0.23
      const pts: Array<[number, number]> = []
      for (let i = 0; i < 10; i++) {
        const r = i % 2 === 0 ? outer : inner
        const a = (Math.PI / 5) * i - Math.PI / 2
        pts.push([cx + r * Math.cos(a), cy + r * Math.sin(a)])
      }
      return polyPath(pts)
    }
    case 'cross': {
      const t = 0.34 // half thickness of the arms
      return polyPath([
        [cx - t, y + 0.05],
        [cx + t, y + 0.05],
        [cx + t, cy - t],
        [x + 0.95, cy - t],
        [x + 0.95, cy + t],
        [cx + t, cy + t],
        [cx + t, y + 0.95],
        [cx - t, y + 0.95],
        [cx - t, cy + t],
        [x + 0.05, cy + t],
        [x + 0.05, cy - t],
        [cx - t, cy - t],
      ])
    }
  }
}

// Outer finder ring at module origin (ox,oy) spanning 7×7. Returned as a stroked
// path (the caller sets stroke = eye colour, fill = none).
export function eyeFramePath(shape: EyeFrameShape, ox: number, oy: number): { d: string; strokeWidth: number } {
  // centreline of a 1-module-thick ring sits 0.5 in from the outer edge
  const inset = shape === 'thick' ? 0.7 : 0.5
  const sw = shape === 'thick' ? 1.4 : 1
  const x = ox + inset
  const y = oy + inset
  const s = 7 - inset * 2
  let radii: [number, number, number, number]
  switch (shape) {
    case 'square':
      radii = [0, 0, 0, 0]
      break
    case 'rounded':
      radii = [1.9, 1.9, 1.9, 1.9]
      break
    case 'circle':
      radii = [s / 2, s / 2, s / 2, s / 2]
      break
    case 'thick':
      radii = [0.5, 0.5, 0.5, 0.5]
      break
    case 'leaf':
      radii = [s / 2, 0, s / 2, 0]
      break
  }
  return { d: roundedRectPath(x, y, s, s, radii), strokeWidth: sw }
}

// Inner finder eyeball at module origin (ox,oy); the 3×3 centre block.
export function eyeballPath(shape: EyeballShape, ox: number, oy: number): string {
  const x = ox + 2
  const y = oy + 2
  const cx = ox + 3.5
  const cy = oy + 3.5
  switch (shape) {
    case 'square':
      return roundedRectPath(x, y, 3, 3, [0, 0, 0, 0])
    case 'rounded':
      return roundedRectPath(x, y, 3, 3, [0.95, 0.95, 0.95, 0.95])
    case 'circle':
      return circlePath(cx, cy, 1.5)
    case 'diamond':
      return polyPath([
        [cx, y],
        [x + 3, cy],
        [cx, y + 3],
        [x, cy],
      ])
    case 'cross': {
      const t = 0.95
      return polyPath([
        [cx - t, y],
        [cx + t, y],
        [cx + t, cy - t],
        [x + 3, cy - t],
        [x + 3, cy + t],
        [cx + t, cy + t],
        [cx + t, y + 3],
        [cx - t, y + 3],
        [cx - t, cy + t],
        [x, cy + t],
        [x, cy - t],
        [cx - t, cy - t],
      ])
    }
  }
}
