// QR Studio — core domain types. UI-agnostic.

export type QRType =
  | 'url'
  | 'text'
  | 'email'
  | 'sms'
  | 'tel'
  | 'wifi'
  | 'vcard'
  | 'geo'
  | 'social'
  | 'promptpay'
  | 'bill'

// Social platforms for the 'social' type — order here = dropdown order.
// Full metadata + URL builders live in core/social.ts.
export type SocialPlatform =
  | 'facebook'
  | 'instagram'
  | 'x'
  | 'tiktok'
  | 'youtube'
  | 'linkedin'
  | 'line'
  | 'whatsapp'
  | 'telegram'
  | 'threads'
  | 'pinterest'
  | 'snapchat'
  | 'discord'
  | 'github'
  | 'twitch'
  | 'spotify'
  | 'wechat'

// Shape sets mirror Figma's QR generator (which renders via qr-code-styling).
// Cells (body modules): no "dots" option — 5 choices.
export type BodyShape = 'square' | 'circle' | 'rounded' | 'squircle' | 'cornerflow'

// Marker border (the outer ring of each corner eye) — 6 choices.
export type EyeFrameShape = 'square' | 'circle' | 'dots' | 'rounded' | 'squircle' | 'cornerflow'

// Marker center (the eyeball inside each corner) — 6 choices.
export type EyeballShape = 'square' | 'circle' | 'dots' | 'rounded' | 'squircle' | 'cornerflow'

// Real-SVG frame templates (chrome lifted from qr-code-generator.com). 'none' = no frame.
export type FrameStyle =
  | 'none'
  | 'classic' | 'bubble' | 'basic' | 'banner' | 'tooltip'
  | 'letter' | 'arrow' | 'ribbon'
  | 'bag' | 'coffee' | 'gift' | 'chef' | 'phone' | 'script'

export type GradientType = 'none' | 'linear' | 'radial' | 'diagonal'
export type Ecc = 'L' | 'M' | 'Q' | 'H'
export type LogoBg = 'none' | 'square' | 'rounded' | 'circle'
export type ProxyType = 'phone' | 'natid' | 'ewallet'
export type WifiEnc = 'WPA' | 'WEP' | 'nopass'

export interface FieldData {
  url: string
  text: string
  email: { to: string; subject: string; body: string }
  sms: { phone: string; message: string }
  tel: string
  wifi: { ssid: string; password: string; encryption: WifiEnc; hidden: boolean }
  vcard: {
    first: string
    last: string
    phone: string
    email: string
    org: string
    title: string
    url: string
    address: string
  }
  geo: { lat: string; lng: string; maps: string }
  social: { platform: SocialPlatform; value: string }
  promptpay: { proxyType: ProxyType; proxyValue: string; amount: string; storeLabel: string }
  bill: { billerId: string; ref1: string; ref2: string; amount: string }
}

export interface StyleSettings {
  fg: string
  bg: string
  useEyeColor: boolean
  eyeColor: string
  gradient: GradientType
  gradFrom: string
  gradTo: string
  bodyShape: BodyShape
  eyeFrameShape: EyeFrameShape
  eyeballShape: EyeballShape
  logo: string | null // data URL of uploaded image
  logoSize: number // fraction of QR side, 0..1
  logoBg: LogoBg
  logoPadding: number // white plate padding around the logo, fraction of logo side
  presetLogo: boolean // show the type's built-in preset logo (custom upload overrides it)
  presetPlate: 'brand' | 'halo' | 'none' // preset backing: brand-colour chip · white frame-follows-logo · none
  presetShape: 'square' | 'rounded' | 'circle' // chip shape when presetPlate === 'brand'
  presetHalo: number // white-frame thickness on 'brand' & 'halo' (6..24); only the frame grows, the logo stays a fixed size
  presetColor: string // category-glyph colour (email/sms/tel/wifi); social uses the fixed brand colour
  frameStyle: FrameStyle
  frameText: string
  frameColor: string
  frameFont: string // CtaFont id — the label typeface (see core/fonts.ts)
  ecc: Ecc
  size: number // preview side, px
  margin: number // quiet zone, in modules
}

export const defaultFieldData = (): FieldData => ({
  url: 'https://www.example.com',
  text: '',
  email: { to: '', subject: '', body: '' },
  sms: { phone: '', message: '' },
  tel: '',
  wifi: { ssid: '', password: '', encryption: 'WPA', hidden: false },
  vcard: { first: '', last: '', phone: '', email: '', org: '', title: '', url: '', address: '' },
  geo: { lat: '', lng: '', maps: '' },
  social: { platform: 'facebook', value: '' },
  promptpay: { proxyType: 'phone', proxyValue: '', amount: '', storeLabel: '' },
  bill: { billerId: '', ref1: '', ref2: '', amount: '' },
})

export const defaultStyle = (): StyleSettings => ({
  fg: '#0a0a12',
  bg: '#ffffff',
  useEyeColor: false,
  eyeColor: '#7c3aed',
  gradient: 'none',
  gradFrom: '#ff2db8',
  gradTo: '#3b82f6',
  bodyShape: 'square',
  eyeFrameShape: 'square',
  eyeballShape: 'square',
  logo: null,
  logoSize: 0.24,
  logoBg: 'none',
  logoPadding: 0.12,
  presetLogo: false,
  presetPlate: 'brand',
  presetShape: 'rounded',
  presetHalo: 6,
  presetColor: '#7c3aed',
  frameStyle: 'none',
  frameText: 'SCAN ME',
  frameColor: '#7c3aed',
  frameFont: 'lineseed',
  ecc: 'M',
  size: 300,
  margin: 4,
})
