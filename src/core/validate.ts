// Per-field validation messages (Thai). Empty object = no errors.
import type { FieldData, QRType } from './types'

export type FieldErrors = Partial<
  Record<'url' | 'email' | 'smsPhone' | 'tel' | 'geo' | 'ppProxy' | 'ppAmount' | 'billId' | 'billAmount', string>
>

const phoneRe = /^[0-9+\-\s()]{6,}$/

export function fieldErrors(type: QRType, d: FieldData): FieldErrors {
  const e: FieldErrors = {}
  if (type === 'url' && d.url.trim() && !/^https?:\/\/.+/.test(d.url.trim()))
    e.url = 'URL ต้องขึ้นต้นด้วย http:// หรือ https://'
  if (type === 'email' && d.email.to.trim() && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(d.email.to.trim()))
    e.email = 'รูปแบบอีเมลไม่ถูกต้อง'
  if (type === 'sms' && d.sms.phone.trim() && !phoneRe.test(d.sms.phone.trim())) e.smsPhone = 'เบอร์โทรไม่ถูกต้อง'
  if (type === 'tel' && d.tel.trim() && !phoneRe.test(d.tel.trim())) e.tel = 'เบอร์โทรไม่ถูกต้อง'
  if (type === 'geo') {
    const { lat, lng } = d.geo
    if ((lat !== '' && isNaN(+lat)) || (lng !== '' && isNaN(+lng)))
      e.geo = 'พิกัดต้องเป็นตัวเลข (เช่น 13.7563, 100.5018)'
  }
  if (type === 'promptpay') {
    const p = d.promptpay
    const raw = (p.proxyValue || '').replace(/\D/g, '')
    if (raw) {
      if (p.proxyType === 'phone' && !(raw.length === 9 || raw.length === 10)) e.ppProxy = 'เบอร์มือถือควรมี 10 หลัก'
      if (p.proxyType === 'natid' && raw.length !== 13) e.ppProxy = 'เลขบัตรประชาชนต้องมี 13 หลัก'
      if (p.proxyType === 'ewallet' && raw.length < 10) e.ppProxy = 'e-Wallet ID ไม่ถูกต้อง'
    }
    if (p.amount.trim() && (isNaN(+p.amount) || +p.amount < 0)) e.ppAmount = 'จำนวนเงินไม่ถูกต้อง'
  }
  if (type === 'bill') {
    const b = d.bill
    if (b.billerId.trim() && !/^\d{5,}$/.test(b.billerId.replace(/\s/g, '')))
      e.billId = 'Biller ID ต้องเป็นตัวเลขอย่างน้อย 5 หลัก'
    if (b.amount.trim() && (isNaN(+b.amount) || +b.amount < 0)) e.billAmount = 'จำนวนเงินไม่ถูกต้อง'
  }
  return e
}
