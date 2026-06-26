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
  | 'promptpay'
  | 'bill'

// 10 body/module shapes (matches the original generator).
export type BodyShape =
  | 'square'
  | 'rounded'
  | 'circle'
  | 'diamond'
  | 'star'
  | 'triangle'
  | 'cross'
  | 'leaf'
  | 'hexagon'
  | 'dot'

// 5 finder-frame (the outer ring of each corner eye).
export type EyeFrameShape = 'square' | 'rounded' | 'circle' | 'thick' | 'leaf'

// 5 finder-center (the eyeball inside each corner).
export type EyeballShape = 'square' | 'rounded' | 'circle' | 'diamond' | 'cross'

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
  frameOn: boolean
  frameText: string
  frameColor: string
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
  frameOn: false,
  frameText: 'สแกนเลย',
  frameColor: '#7c3aed',
  ecc: 'M',
  size: 300,
  margin: 4,
})
