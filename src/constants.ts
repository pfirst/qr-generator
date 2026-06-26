import type { BodyShape, EyeballShape, EyeFrameShape, QRType } from './core/types'

export interface TypeMeta {
  id: QRType
  label: string
  group: 'basic' | 'pay'
  title: string
  desc: string
}

export const TYPES: TypeMeta[] = [
  { id: 'url', label: 'URL / ลิงก์', group: 'basic', title: 'URL / ลิงก์', desc: 'สร้าง QR สำหรับเปิดเว็บไซต์หรือลิงก์' },
  { id: 'text', label: 'ข้อความ', group: 'basic', title: 'ข้อความ', desc: 'ฝังข้อความธรรมดาลงใน QR' },
  { id: 'email', label: 'อีเมล', group: 'basic', title: 'อีเมล', desc: 'เปิดแอปอีเมลพร้อมกรอกผู้รับ หัวข้อ และข้อความ' },
  { id: 'sms', label: 'SMS', group: 'basic', title: 'SMS', desc: 'เปิดแอปข้อความพร้อมเบอร์และข้อความ' },
  { id: 'tel', label: 'โทร', group: 'basic', title: 'โทรศัพท์', desc: 'สแกนเพื่อโทรออกทันที' },
  { id: 'wifi', label: 'Wi-Fi', group: 'basic', title: 'Wi-Fi', desc: 'เชื่อมต่อเครือข่ายอัตโนมัติเมื่อสแกน' },
  { id: 'vcard', label: 'นามบัตร (vCard)', group: 'basic', title: 'นามบัตร (vCard)', desc: 'บันทึกข้อมูลติดต่อลงสมุดโทรศัพท์' },
  { id: 'geo', label: 'พิกัด', group: 'basic', title: 'พิกัดสถานที่', desc: 'เปิดแผนที่ไปยังพิกัดที่ระบุ' },
  { id: 'promptpay', label: 'PromptPay', group: 'pay', title: 'PromptPay', desc: 'รับเงินผ่าน QR มาตรฐาน EMVCo ของไทย' },
  { id: 'bill', label: 'ชำระบิล', group: 'pay', title: 'ชำระบิล (Bill Payment)', desc: 'QR สำหรับชำระบิลผ่านแอปธนาคาร' },
]

export const TYPE_LABEL: Record<QRType, string> = Object.fromEntries(
  TYPES.map((t) => [t.id, t.label]),
) as Record<QRType, string>

export const BODY_SHAPES: { id: BodyShape; label: string }[] = [
  { id: 'square', label: 'เหลี่ยม' },
  { id: 'rounded', label: 'มน' },
  { id: 'circle', label: 'วงกลม' },
  { id: 'dot', label: 'จุด' },
  { id: 'diamond', label: 'ข้าวหลามตัด' },
  { id: 'hexagon', label: 'หกเหลี่ยม' },
  { id: 'triangle', label: 'สามเหลี่ยม' },
  { id: 'star', label: 'ดาว' },
  { id: 'cross', label: 'กากบาท' },
  { id: 'leaf', label: 'ใบไม้' },
]

export const EYE_FRAMES: { id: EyeFrameShape; label: string }[] = [
  { id: 'square', label: 'เหลี่ยม' },
  { id: 'rounded', label: 'มน' },
  { id: 'circle', label: 'กลม' },
  { id: 'thick', label: 'หนา' },
  { id: 'leaf', label: 'ใบไม้' },
]

export const EYEBALLS: { id: EyeballShape; label: string }[] = [
  { id: 'square', label: 'เหลี่ยม' },
  { id: 'rounded', label: 'มน' },
  { id: 'circle', label: 'กลม' },
  { id: 'diamond', label: 'ข้าวหลามตัด' },
  { id: 'cross', label: 'กากบาท' },
]

export const ECC_LEVELS = [
  { id: 'L', label: 'L · 7%' },
  { id: 'M', label: 'M · 15%' },
  { id: 'Q', label: 'Q · 25%' },
  { id: 'H', label: 'H · 30%' },
] as const

export const EXPORT_SIZES = [512, 1024, 2048, 4096] as const

// Preset colour swatches (foreground / background) carried over from the original.
export const FG_PRESETS = ['#0a0a12', '#16213e', '#0f3460', '#533483', '#e94560', '#27ae60', '#2980b9', '#ffffff']
export const BG_PRESETS = ['#ffffff', '#fffde7', '#e8f5e9', '#e3f2fd', '#fce4ec', '#1a1a2e', '#0f3460', '#000000']
