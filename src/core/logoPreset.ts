// Preset (per-type) center logos. UI-agnostic. Composes the effective center image
// (backing + recoloured mark) for the render pipeline; custom upload always wins.
import type { FieldData, QRType, SocialPlatform, StyleSettings } from './types'
import promptpayRaw from '../assets/preset-logos/promptpay.svg?raw'
import facebookRaw from '../assets/preset-logos/social/facebook.svg?raw'
import instagramRaw from '../assets/preset-logos/social/instagram.svg?raw'
import xRaw from '../assets/preset-logos/social/x.svg?raw'
import tiktokRaw from '../assets/preset-logos/social/tiktok.svg?raw'
import youtubeRaw from '../assets/preset-logos/social/youtube.svg?raw'
import linkedinRaw from '../assets/preset-logos/social/linkedin.svg?raw'
import lineRaw from '../assets/preset-logos/social/line.svg?raw'
import whatsappRaw from '../assets/preset-logos/social/whatsapp.svg?raw'
import telegramRaw from '../assets/preset-logos/social/telegram.svg?raw'
import threadsRaw from '../assets/preset-logos/social/threads.svg?raw'
import pinterestRaw from '../assets/preset-logos/social/pinterest.svg?raw'
import snapchatRaw from '../assets/preset-logos/social/snapchat.svg?raw'
import discordRaw from '../assets/preset-logos/social/discord.svg?raw'
import githubRaw from '../assets/preset-logos/social/github.svg?raw'
import twitchRaw from '../assets/preset-logos/social/twitch.svg?raw'
import spotifyRaw from '../assets/preset-logos/social/spotify.svg?raw'
import wechatRaw from '../assets/preset-logos/social/wechat.svg?raw'
import emailRaw from '../assets/preset-logos/category/email.svg?raw'
import smsRaw from '../assets/preset-logos/category/sms.svg?raw'
import telRaw from '../assets/preset-logos/category/tel.svg?raw'
import wifiRaw from '../assets/preset-logos/category/wifi.svg?raw'
import vcardRaw from '../assets/preset-logos/category/vcard.svg?raw'
import geoRaw from '../assets/preset-logos/category/geo.svg?raw'

// SVG string -> data URL. utf8-encode (not btoa) to avoid unicode pitfalls.
const svgUrl = (raw: string): string => `data:image/svg+xml,${encodeURIComponent(raw)}`
const PROMPTPAY = svgUrl(promptpayRaw)

// Strip a mark down to its <path>(s): drop the <svg> wrapper (and its own fill) + any <title>.
const inner = (svg: string): string =>
  svg.replace(/<svg[^>]*>/, '').replace(/<\/svg>/, '').replace(/<title>[\s\S]*?<\/title>/, '')

// Raw SVGs keyed by platform (order mirrors core/social.ts).
const SOCIAL_RAW: Record<SocialPlatform, string> = {
  facebook: facebookRaw, instagram: instagramRaw, x: xRaw, tiktok: tiktokRaw, youtube: youtubeRaw,
  linkedin: linkedinRaw, line: lineRaw, whatsapp: whatsappRaw, telegram: telegramRaw, threads: threadsRaw,
  pinterest: pinterestRaw, snapchat: snapchatRaw, discord: discordRaw, github: githubRaw, twitch: twitchRaw,
  spotify: spotifyRaw, wechat: wechatRaw,
}

// Brand colours are the SOURCE OF TRUTH (Simple Icons stock may ship `currentColor`).
const SOCIAL_BRAND: Record<SocialPlatform, string> = {
  facebook: '#0866FF', instagram: '#FF0069', x: '#000000', tiktok: '#000000', youtube: '#FF0000',
  linkedin: '#0A66C2', line: '#00C300', whatsapp: '#25D366', telegram: '#26A5E4', threads: '#000000',
  pinterest: '#BD081C', snapchat: '#FFFC00', discord: '#5865F2', github: '#181717', twitch: '#9146FF',
  spotify: '#1ED760', wechat: '#07C160',
}

const CATEGORY_RAW: Partial<Record<QRType, string>> = { email: emailRaw, sms: smsRaw, tel: telRaw, wifi: wifiRaw, vcard: vcardRaw, geo: geoRaw }

// ---- Preset geometry -------------------------------------------------------
// CRITICAL: the composed SVG uses a CONSTANT viewBox and draws the mark at a
// CONSTANT scale/position — only the white FRAME's stroke/rect width tracks
// presetHalo. qr-code-styling sizes the <image> from imageSize + ECC (NOT the
// SVG's internal geometry), so a constant viewBox + constant imageSize means the
// mark's on-QR size NEVER changes with frame thickness. (An earlier version grew
// the viewBox and scaled imageSize to compensate, but the library maps
// imageSize→drawn-size NON-linearly, so the compensation under-shot and the mark
// shrank as the frame thickened — the reported bug.) The frame grows inward from
// a reserved margin; ขนาดโลโก้ scales the whole thing via a constant boost.
const VB = 120 // constant composed viewBox
const MAXF = 24 // frame room reserved on each side (matches the slider max)
const CORE = VB - 2 * MAXF // 72 — centred region: the mark (halo/none) or chip (brand)
const COREXY = MAXF // core top-left; core spans [MAXF, VB-MAXF]
const PRESET_SIZE_K = 2.0 // constant (frame-INDEPENDENT) imageSize boost so the core stays usable inside the reserved box

// Compose backing + recoloured mark into one self-contained SVG data URL.
//   brand → white frame + colour chip (presetShape) + white knockout mark
//   halo  → white silhouette frame (hugs the logo shape) behind the colour mark
//   none  → colour mark only
// `color` = the brand colour (social) or style.presetColor (category).
function composeMark(markRaw: string, color: string, style: StyleSettings): string {
  const path = inner(markRaw)
  const f = style.presetPlate === 'none' ? 0 : Math.min(style.presetHalo, MAXF)
  // Draw the mark centred at a given span (px in the 120 viewBox).
  const markGroup = (span: number, attrs: string): string => {
    const xy = (VB - span) / 2
    return `<g transform="translate(${xy} ${xy}) scale(${span / 24})" ${attrs}>${path}</g>`
  }

  let body: string
  if (style.presetPlate === 'brand') {
    const r = style.presetShape === 'circle' ? CORE / 2 : style.presetShape === 'square' ? 8 : 22
    const frame = f > 0
      ? `<rect x="${COREXY - f}" y="${COREXY - f}" width="${CORE + 2 * f}" height="${CORE + 2 * f}" rx="${r + f}" fill="#ffffff"/>`
      : ''
    body = frame + `<rect x="${COREXY}" y="${COREXY}" width="${CORE}" height="${CORE}" rx="${r}" fill="${color}"/>` + markGroup(CORE * 0.6, 'fill="#ffffff"')
  } else if (style.presetPlate === 'halo') {
    // White frame hugging the mark. The mark is scaled CORE/24, so a path-space
    // stroke renders that much wider; half of it must equal f → sw = 2f·24/CORE.
    const sw = (2 * f * 24) / CORE
    const frame = f > 0
      ? markGroup(CORE, `fill="#ffffff" stroke="#ffffff" stroke-width="${sw}" stroke-linejoin="round" stroke-linecap="round"`)
      : markGroup(CORE, 'fill="#ffffff"')
    body = frame + markGroup(CORE, `fill="${color}"`)
  } else {
    body = markGroup(CORE, `fill="${color}"`) // none
  }
  return svgUrl(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${VB} ${VB}">${body}</svg>`)
}

// Effective imageSize for the render pipeline. A CONSTANT (frame-independent)
// boost so the reserved box stays a usable size — because it does not depend on
// presetHalo, the mark's rendered size is invariant to frame thickness.
// promptpay/bill use a bundled asset with its own viewBox → no boost. Clamped so
// a very large logo can't swallow the QR (the decode check still warns).
export function presetLogoSize(type: QRType, style: StyleSettings): number {
  if (type === 'promptpay' || type === 'bill' || !hasPreset(type)) return style.logoSize
  return Math.min(0.62, style.logoSize * PRESET_SIZE_K)
}

// The effective preset image for a type. promptpay/bill keep their bundled bubble (Slice 1);
// social composes per-platform; email/sms/tel/wifi compose the category glyph.
export function presetLogoUrl(type: QRType, platform: SocialPlatform | undefined, style: StyleSettings): string | null {
  if (type === 'promptpay' || type === 'bill') return PROMPTPAY
  if (type === 'social') {
    const p = platform ?? 'facebook' // never null while hasPreset('social') is true
    return composeMark(SOCIAL_RAW[p], SOCIAL_BRAND[p], style)
  }
  const g = CATEGORY_RAW[type]
  return g ? composeMark(g, style.presetColor, style) : null
}

// Does this type expose a preset toggle at all?
export const hasPreset = (type: QRType): boolean =>
  type === 'promptpay' || type === 'bill' || type === 'social' ||
  type === 'email' || type === 'sms' || type === 'tel' || type === 'wifi' ||
  type === 'vcard' || type === 'geo'

// Toggle default when (re)entering a type.
export const defaultPresetOn = (type: QRType): boolean =>
  type === 'promptpay' || type === 'bill' || type === 'social'

// The single resolver: custom upload > preset > none.
export function resolveLogo(type: QRType, data: FieldData, style: StyleSettings): string | null {
  if (style.logo) return style.logo
  if (style.presetLogo) return presetLogoUrl(type, data.social.platform, style)
  return null
}
