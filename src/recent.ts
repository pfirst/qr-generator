// Recent-history list, persisted in localStorage (stays on the user's device).
import { TYPE_LABEL } from './constants'
import { socialMeta } from './core/social'
import { defaultStyle, type FieldData, type QRType, type StyleSettings } from './core/types'

export interface RecentItem {
  id: number
  type: QRType
  typeLabel: string
  preview: string
  data: FieldData
  style: StyleSettings // full appearance (colours, shapes, frame, logo, ECC…) so it restores 1:1
}

const KEY = 'qrstudio_recent'
const MAX = 6

export function loadRecent(): RecentItem[] {
  try {
    const r = JSON.parse(localStorage.getItem(KEY) || '[]')
    if (!Array.isArray(r)) return []
    // Migrate pre-style entries (older builds stored no `style`) so the app never
    // reads an undefined style when restoring or rendering a thumbnail.
    return r.map((x) => (x && x.style ? x : { ...x, style: defaultStyle() }))
  } catch {
    return []
  }
}

function persist(list: RecentItem[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(list))
    return
  } catch {
    /* fall through to quota-trim */
  }
  // Quota hit — embedded logos (base64) are the heavy part. Drop them from the OLDEST
  // entries first, retrying after each, so the newest QR keeps its full appearance.
  const trimmed = list.map((x) => ({ ...x }))
  for (let i = trimmed.length - 1; i >= 0; i--) {
    if (!trimmed[i].style.logo) continue
    trimmed[i] = { ...trimmed[i], style: { ...trimmed[i].style, logo: null } }
    try {
      localStorage.setItem(KEY, JSON.stringify(trimmed))
      return
    } catch {
      /* still too big — keep trimming */
    }
  }
  /* storage full / disabled even with no logos — give up silently */
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

export function pushRecent(list: RecentItem[], type: QRType, data: FieldData, style: StyleSettings): RecentItem[] {
  const snap: RecentItem = {
    id: Date.now(),
    type,
    typeLabel: TYPE_LABEL[type],
    preview: previewFor(type, data) || '(ว่าง)',
    data: structuredClone(data),
    style: structuredClone(style),
  }
  const next = [snap, ...list.filter((x) => !(x.type === snap.type && x.preview === snap.preview))].slice(0, MAX)
  persist(next)
  return next
}

export function clearRecent(): RecentItem[] {
  persist([])
  return []
}
