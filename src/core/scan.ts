// Import an existing QR from a photo/screenshot: decode the image entirely
// in-browser (BarcodeDetector → jsQR, mirroring verify.ts's order) and map the
// decoded payload to the best-matching QR type. Non-URL payloads route to the
// 'text' type on purpose — its payload builder is identity, which guarantees
// the recreated QR encodes the exact original bytes (EMVCo CRCs survive).
import jsQR from 'jsqr'
import type { SocialPlatform } from './types'

export type ImportRoute =
  | { type: 'social'; platform: SocialPlatform; value: string }
  | { type: 'url'; url: string }
  | { type: 'text'; text: string }

// Hostnames that identify a social platform's profile/invite links. Matching
// is host === h or host.endsWith('.' + h), so www./m./mobile. all match.
const SOCIAL_HOSTS: [SocialPlatform, string[]][] = [
  ['line', ['line.me']],
  ['facebook', ['facebook.com', 'fb.com', 'fb.me']],
  ['instagram', ['instagram.com', 'instagr.am']],
  ['x', ['x.com', 'twitter.com']],
  ['tiktok', ['tiktok.com']],
  ['youtube', ['youtube.com', 'youtu.be']],
  ['linkedin', ['linkedin.com', 'lnkd.in']],
  ['whatsapp', ['wa.me', 'whatsapp.com']],
  ['telegram', ['t.me', 'telegram.me']],
  ['threads', ['threads.net', 'threads.com']],
  ['pinterest', ['pinterest.com', 'pin.it']],
  ['snapchat', ['snapchat.com']],
  ['discord', ['discord.gg', 'discord.com']],
  ['github', ['github.com']],
  ['twitch', ['twitch.tv']],
  ['spotify', ['open.spotify.com', 'spotify.link']],
  ['wechat', ['weixin.qq.com', 'u.wechat.com']],
]

// Map a decoded payload to a QR type. Social URLs keep the full link verbatim
// (social.ts builders pass URLs through unchanged) so the payload is identical
// while the social type contributes its preset brand logo.
export function detectImport(text: string): ImportRoute {
  if (/^https?:\/\//i.test(text)) {
    try {
      const host = new URL(text).hostname.toLowerCase()
      for (const [platform, hosts] of SOCIAL_HOSTS) {
        if (hosts.some((h) => host === h || host.endsWith('.' + h))) {
          return { type: 'social', platform, value: text }
        }
      }
    } catch {
      /* unparsable but http-prefixed — treat as a plain link */
    }
    return { type: 'url', url: text }
  }
  return { type: 'text', text }
}

function loadImage(file: File): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => {
      URL.revokeObjectURL(url)
      resolve(null) // unreadable format (e.g. HEIC in Chrome)
    }
    img.src = url
  })
}

// Same decode order as verify.ts: native BarcodeDetector first, jsQR fallback.
async function decodeCanvas(canvas: HTMLCanvasElement): Promise<string | null> {
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

// Decode a QR from an uploaded image. Real-world photos often decode at one
// scale but not another, so retry a few long-side sizes (never upscaling).
export async function decodeImageFile(file: File): Promise<string | null> {
  const img = await loadImage(file)
  if (!img) return null
  try {
    const long = Math.max(img.naturalWidth, img.naturalHeight)
    if (!long) return null
    const sides = [...new Set([Math.min(long, 1600), Math.min(long, 1024), Math.min(long, 600)])]
    for (const side of sides) {
      const scale = side / long
      const canvas = document.createElement('canvas')
      canvas.width = Math.max(1, Math.round(img.naturalWidth * scale))
      canvas.height = Math.max(1, Math.round(img.naturalHeight * scale))
      canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height)
      const text = await decodeCanvas(canvas)
      if (text) return text
    }
    return null
  } finally {
    URL.revokeObjectURL(img.src)
  }
}
