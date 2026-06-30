// Recent-history list, persisted in localStorage (stays on the user's device).
import { TYPE_LABEL } from './constants'
import { socialMeta } from './core/social'
import type { FieldData, QRType } from './core/types'

export interface RecentItem {
  id: number
  type: QRType
  typeLabel: string
  preview: string
  data: FieldData
}

const KEY = 'qrstudio_recent'
const MAX = 6

export function loadRecent(): RecentItem[] {
  try {
    const r = JSON.parse(localStorage.getItem(KEY) || '[]')
    return Array.isArray(r) ? r : []
  } catch {
    return []
  }
}

function persist(list: RecentItem[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(list))
  } catch {
    /* storage full / disabled — ignore */
  }
}

function previewFor(type: QRType, d: FieldData): string {
  switch (type) {
    case 'url':
      return d.url
    case 'text':
      return d.text.slice(0, 40)
    case 'email':
      return d.email.to
    case 'sms':
      return d.sms.phone
    case 'tel':
      return d.tel
    case 'wifi':
      return d.wifi.ssid
    case 'vcard':
      return (d.vcard.first + ' ' + d.vcard.last).trim() || d.vcard.email
    case 'geo':
      return `${d.geo.lat}, ${d.geo.lng}`
    case 'social':
      return `${socialMeta(d.social.platform).label} · ${d.social.value}`
    case 'promptpay':
      return d.promptpay.proxyValue + (d.promptpay.amount ? ' · ฿' + d.promptpay.amount : '')
    case 'bill':
      return 'Biller ' + d.bill.billerId
  }
}

export function pushRecent(list: RecentItem[], type: QRType, data: FieldData): RecentItem[] {
  const snap: RecentItem = {
    id: Date.now(),
    type,
    typeLabel: TYPE_LABEL[type],
    preview: previewFor(type, data) || '(ว่าง)',
    data: structuredClone(data),
  }
  const next = [snap, ...list.filter((x) => !(x.type === snap.type && x.preview === snap.preview))].slice(0, MAX)
  persist(next)
  return next
}

export function clearRecent(): RecentItem[] {
  persist([])
  return []
}
