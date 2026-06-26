// Payload builders for all 10 QR types.
// Returns '' when the data is incomplete/invalid (preview stays empty).
// PromptPay / Bill follow the EMVCo (Thai) standard with a CRC16 checksum.

import type { FieldData, QRType } from './types'

// --- EMVCo helpers ---
function crc16(str: string): string {
  let crc = 0xffff
  for (let i = 0; i < str.length; i++) {
    crc ^= str.charCodeAt(i) << 8
    for (let j = 0; j < 8; j++) {
      crc = crc & 0x8000 ? (crc << 1) ^ 0x1021 : crc << 1
      crc &= 0xffff
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0')
}

// Tag-Length-Value field: 2-digit id + 2-digit length + value.
function tlv(id: string, value: string): string {
  const v = String(value)
  return id + String(v.length).padStart(2, '0') + v
}

function promptPay(p: FieldData['promptpay']): string {
  const raw = (p.proxyValue || '').replace(/\D/g, '')
  if (!raw) return ''

  let merchant: string
  if (p.proxyType === 'phone') {
    if (raw.length < 9) return ''
    const ph = ('0000000000000' + raw.replace(/^0/, '66')).slice(-13)
    merchant = tlv('00', 'A000000677010111') + tlv('01', ph)
  } else if (p.proxyType === 'natid') {
    if (raw.length !== 13) return ''
    merchant = tlv('00', 'A000000677010111') + tlv('02', raw)
  } else {
    if (raw.length < 10) return ''
    merchant = tlv('00', 'A000000677010111') + tlv('03', raw)
  }

  const amt = (p.amount || '').trim()
  const hasAmt = amt !== '' && !isNaN(+amt) && +amt > 0

  let out = tlv('00', '01') + tlv('01', hasAmt ? '12' : '11') + tlv('29', merchant) + tlv('53', '764')
  if (hasAmt) out += tlv('54', (+amt).toFixed(2))
  out += tlv('58', 'TH')

  // Store label → tag 62 (Additional Data Field), sub-tag 03.
  const store = (p.storeLabel || '').trim().slice(0, 25)
  if (store) out += tlv('62', tlv('03', store))

  out += '6304' + crc16(out + '6304')
  return out
}

function billPay(b: FieldData['bill']): string {
  const id = (b.billerId || '').replace(/\s/g, '')
  if (!id) return ''
  let acct = tlv('00', 'A000000677010112') + tlv('01', id)
  if ((b.ref1 || '').trim()) acct += tlv('02', b.ref1.trim())
  if ((b.ref2 || '').trim()) acct += tlv('03', b.ref2.trim())

  const amt = (b.amount || '').trim()
  const hasAmt = amt !== '' && !isNaN(+amt) && +amt > 0

  let out = tlv('00', '01') + tlv('01', hasAmt ? '12' : '11') + tlv('30', acct) + tlv('53', '764')
  if (hasAmt) out += tlv('54', (+amt).toFixed(2))
  out += tlv('58', 'TH')
  out += '6304' + crc16(out + '6304')
  return out
}

const escWifi = (v: string) => String(v).replace(/([\\;,:"])/g, '\\$1')

// Pull "lat,lng" out of a pasted Google Maps URL / text.
export function extractLatLng(text: string): { lat: string; lng: string } | null {
  const m = text.match(/(-?\d{1,3}\.\d+)[,\s]+(-?\d{1,3}\.\d+)/)
  return m ? { lat: m[1], lng: m[2] } : null
}

export function buildPayload(type: QRType, d: FieldData): string {
  switch (type) {
    case 'url': {
      const v = d.url.trim()
      return /^https?:\/\/.+/.test(v) ? v : ''
    }
    case 'text':
      return d.text.trim() ? d.text : ''
    case 'email': {
      const { to, subject, body } = d.email
      if (!to.trim()) return ''
      const q: string[] = []
      if (subject) q.push('subject=' + encodeURIComponent(subject))
      if (body) q.push('body=' + encodeURIComponent(body))
      return 'mailto:' + to.trim() + (q.length ? '?' + q.join('&') : '')
    }
    case 'sms': {
      const { phone, message } = d.sms
      if (!phone.trim()) return ''
      return 'SMSTO:' + phone.trim() + ':' + message
    }
    case 'tel':
      return d.tel.trim() ? 'tel:' + d.tel.trim() : ''
    case 'wifi': {
      const { ssid, password, encryption, hidden } = d.wifi
      if (!ssid.trim()) return ''
      const T = encryption === 'nopass' ? 'nopass' : encryption
      return `WIFI:T:${T};S:${escWifi(ssid)};${
        encryption === 'nopass' ? '' : 'P:' + escWifi(password) + ';'
      }${hidden ? 'H:true;' : ''};`
    }
    case 'vcard': {
      const v = d.vcard
      if (!(v.first || v.last || v.phone || v.email)) return ''
      const L = ['BEGIN:VCARD', 'VERSION:3.0', `N:${v.last};${v.first};;;`, `FN:${(v.first + ' ' + v.last).trim()}`]
      if (v.org) L.push('ORG:' + v.org)
      if (v.title) L.push('TITLE:' + v.title)
      if (v.phone) L.push('TEL;TYPE=CELL:' + v.phone)
      if (v.email) L.push('EMAIL:' + v.email)
      if (v.url) L.push('URL:' + v.url)
      if (v.address) L.push(`ADR:;;${v.address};;;;`)
      L.push('END:VCARD')
      return L.join('\n')
    }
    case 'geo': {
      const { lat, lng } = d.geo
      if (lat === '' || lng === '' || isNaN(+lat) || isNaN(+lng)) return ''
      return `geo:${lat},${lng}`
    }
    case 'promptpay':
      return promptPay(d.promptpay)
    case 'bill':
      return billPay(d.bill)
    default:
      return ''
  }
}
