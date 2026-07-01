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

const CATEGORY_RAW: Partial<Record<QRType, string>> = { email: emailRaw, sms: smsRaw, tel: telRaw, wifi: wifiRaw }

// ---- Preset geometry -------------------------------------------------------
// The mark path is authored in a 24-unit box. On screen the mark spans MARK
// units; 'brand' wraps it in a chip CHIP_PAD bigger. Every plate except 'none'
// adds a white FRAME that grows OUTWARD by `presetHalo` viewBox units — so
// thickening the frame never shrinks the logo, it grows the composed viewBox.
// App/History then compensate imageSize (presetLogoSize) so the logo core stays
// a constant fraction of the QR while the white frame expands around it.
const MARK = 72 // mark span (scale 3 over the 24-unit path)
const CHIP_PAD = 14 // 'brand' chip extends this far beyond the mark on each side
const MARGIN = 3 // gap so a round-joined frame never touches the viewBox edge

const frameWidth = (style: StyleSettings): number => (style.presetPlate === 'none' ? 0 : style.presetHalo)
// The "core" is what ขนาดโลโก้ pins to a constant on-QR size: the chip for
// 'brand', otherwise the mark itself.
const coreSpan = (style: StyleSettings): number => (style.presetPlate === 'brand' ? MARK + 2 * CHIP_PAD : MARK)
const vbSide = (style: StyleSettings): number => coreSpan(style) + 2 * frameWidth(style) + 2 * MARGIN

// Compose backing + recoloured mark into one self-contained SVG data URL.
//   brand → white frame + colour chip (presetShape) + white knockout mark
//   halo  → white silhouette frame (hugs the logo shape) behind the colour mark
//   none  → colour mark only
// `color` = the brand colour (social) or style.presetColor (category).
function composeMark(markRaw: string, color: string, style: StyleSettings): string {
  const path = inner(markRaw)
  const V = vbSide(style)
  const f = frameWidth(style)
  const markPad = (V - MARK) / 2
  const mark = (attrs: string): string =>
    `<g transform="translate(${markPad} ${markPad}) scale(${MARK / 24})" ${attrs}>${path}</g>`

  let body: string
  if (style.presetPlate === 'brand') {
    const chip = MARK + 2 * CHIP_PAD
    const chipXY = (V - chip) / 2
    const r = style.presetShape === 'circle' ? chip / 2 : style.presetShape === 'square' ? 8 : 22
    const frame = f > 0
      ? `<rect x="${chipXY - f}" y="${chipXY - f}" width="${chip + 2 * f}" height="${chip + 2 * f}" rx="${r + f}" fill="#ffffff"/>`
      : ''
    body = frame + `<rect x="${chipXY}" y="${chipXY}" width="${chip}" height="${chip}" rx="${r}" fill="${color}"/>` + mark('fill="#ffffff"')
  } else if (style.presetPlate === 'halo') {
    // White frame hugging the mark silhouette. The mark is scaled MARK/24, so a
    // path-space stroke renders that much wider; half of it must equal f → sw = 2f·24/MARK.
    const sw = (2 * f * 24) / MARK
    const frame = f > 0
      ? mark(`fill="#ffffff" stroke="#ffffff" stroke-width="${sw}" stroke-linejoin="round" stroke-linecap="round"`)
      : mark('fill="#ffffff"')
    body = frame + mark(`fill="${color}"`)
  } else {
    body = mark(`fill="${color}"`) // none
  }
  return svgUrl(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${V} ${V}">${body}</svg>`)
}

// Effective imageSize for the render pipeline: keeps the logo core a constant
// fraction of the QR (= style.logoSize) while the frame grows the footprint.
// promptpay/bill use a bundled asset with its own viewBox → no compensation.
// Clamped so a very large logo + thick frame can't swallow the QR (the decode
// check still warns beyond what actually scans).
export function presetLogoSize(type: QRType, style: StyleSettings): number {
  if (type === 'promptpay' || type === 'bill' || !hasPreset(type)) return style.logoSize
  return Math.min(0.62, (style.logoSize * vbSide(style)) / coreSpan(style))
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
  type === 'email' || type === 'sms' || type === 'tel' || type === 'wifi'

// Toggle default when (re)entering a type.
export const defaultPresetOn = (type: QRType): boolean =>
  type === 'promptpay' || type === 'bill' || type === 'social'

// The single resolver: custom upload > preset > none.
export function resolveLogo(type: QRType, data: FieldData, style: StyleSettings): string | null {
  if (style.logo) return style.logo
  if (style.presetLogo) return presetLogoUrl(type, data.social.platform, style)
  return null
}
