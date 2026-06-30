// Preset (per-type) center logos. UI-agnostic. The resolver decides the
// effective center image for the render pipeline; custom upload always wins.
import type { FieldData, LogoBg, QRType, SocialPlatform, StyleSettings } from './types'
import promptpayRaw from '../assets/preset-logos/promptpay.svg?raw'

// SVG string -> data URL. utf8-encode (not btoa) to avoid unicode pitfalls.
const svgUrl = (raw: string): string => `data:image/svg+xml,${encodeURIComponent(raw)}`
const PROMPTPAY = svgUrl(promptpayRaw)

// Slice 1: only promptpay/bill have an asset. The other preset types
// (social/email/sms/tel/wifi) return null until Slice 2 supplies artwork.
export function presetLogoUrl(type: QRType, _platform?: SocialPlatform): string | null {
  switch (type) {
    case 'promptpay':
    case 'bill':
      return PROMPTPAY
    default:
      return null
  }
}

// Does this type expose a preset toggle at all? (Slice 1: promptpay/bill only.)
export const hasPreset = (type: QRType): boolean => presetLogoUrl(type) !== null

// Toggle default when (re)entering a type.
export const defaultPresetOn = (type: QRType): boolean => type === 'promptpay' || type === 'bill'

// Plate default when a preset turns on (the PromptPay mark has its own white backing).
export const defaultPresetBg = (type: QRType): LogoBg =>
  type === 'promptpay' || type === 'bill' ? 'none' : 'square'

// The single resolver: custom upload > preset > none.
export function resolveLogo(type: QRType, data: FieldData, style: StyleSettings): string | null {
  if (style.logo) return style.logo
  if (style.presetLogo) return presetLogoUrl(type, data.social.platform)
  return null
}
