// QR matrix generation. Encoding/Reed-Solomon/masking handled by the `qrcode`
// library (we never reinvent that). The matrix is used for validation and the
// quiet-zone module count only — the visual QR is drawn by render.ts.
import QRCode from 'qrcode'
import type { Ecc } from './types'

export interface QRMatrix {
  size: number // module count per side
  get(row: number, col: number): boolean // true = dark module
}

export function createMatrix(text: string, ecc: Ecc): QRMatrix {
  const qr = QRCode.create(text, { errorCorrectionLevel: ecc })
  const size = qr.modules.size
  const data = qr.modules.data
  return {
    size,
    get: (r, c) => r >= 0 && c >= 0 && r < size && c < size && !!data[r * size + c],
  }
}

// Is this module part of one of the three 7×7 finder patterns (the corner "eyes")?
export function isFinder(size: number, r: number, c: number): boolean {
  return (r < 7 && c < 7) || (r < 7 && c >= size - 7) || (r >= size - 7 && c < 7)
}

// Top-left module coords of the three finders.
export function finderOrigins(size: number): Array<[number, number]> {
  return [
    [0, 0],
    [0, size - 7],
    [size - 7, 0],
  ]
}
