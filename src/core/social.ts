// Single source of truth for the "social" QR type: the platform list + how each
// platform turns a username/handle into a full profile URL. The form (labels +
// placeholders) and the payload builder both read from here.
//
// Input model: the user types a username/handle and we prepend the platform's
// URL prefix. Two universal escape hatches keep odd profiles working:
//   1. If the value already starts with http(s):// we use it verbatim.
//   2. Leading @ ~ / and whitespace are stripped before prefixing.
// A few platforms need bespoke logic (WhatsApp = phone number, LINE = add-friend
// link, WeChat = no public URL scheme) and override `build`.

import type { SocialPlatform } from './types'

export interface SocialMeta {
  id: SocialPlatform
  label: string
  placeholder: string
  build: (value: string) => string
}

const isUrl = (v: string) => /^https?:\/\//i.test(v)
const handle = (v: string) => v.trim().replace(/^[@~/\s]+/, '')

// Prepend a fixed prefix to the cleaned handle. Prefixes that themselves end in
// '@' (TikTok/YouTube/Threads) rely on `handle()` having stripped the user's @.
function prefixed(prefix: string): (value: string) => string {
  return (value) => {
    const t = value.trim()
    if (!t) return ''
    if (isUrl(t)) return t
    const h = handle(t)
    return h ? prefix + h : ''
  }
}

// WhatsApp click-to-chat needs a phone number with country code, no '+'.
function whatsapp(value: string): string {
  const t = value.trim()
  if (!t) return ''
  if (isUrl(t)) return t
  const digits = t.replace(/\D/g, '')
  return digits ? 'https://wa.me/' + digits : ''
}

// LINE add-friend link. Official accounts use an @-prefixed id (R/ti/p/@id);
// personal LINE IDs use the basic-id link (ti/p/~id).
function line(value: string): string {
  const t = value.trim()
  if (!t) return ''
  if (isUrl(t)) return t
  const id = handle(t)
  if (!id) return ''
  return t.startsWith('@') ? 'https://line.me/R/ti/p/@' + id : 'https://line.me/ti/p/~' + id
}

// WeChat has no public profile-URL scheme, so we pass the value through as-is:
// a pasted link works, a raw ID becomes a plain-text QR the user can read off.
const wechat = (value: string) => value.trim()

export const SOCIAL_PLATFORMS: SocialMeta[] = [
  { id: 'facebook', label: 'Facebook', placeholder: 'username หรือชื่อเพจ', build: prefixed('https://www.facebook.com/') },
  { id: 'instagram', label: 'Instagram', placeholder: 'username (ไม่ต้องใส่ @)', build: prefixed('https://www.instagram.com/') },
  { id: 'x', label: 'X (Twitter)', placeholder: 'username', build: prefixed('https://x.com/') },
  { id: 'tiktok', label: 'TikTok', placeholder: 'username', build: prefixed('https://www.tiktok.com/@') },
  { id: 'youtube', label: 'YouTube', placeholder: 'handle เช่น mychannel', build: prefixed('https://www.youtube.com/@') },
  { id: 'linkedin', label: 'LinkedIn', placeholder: 'username โปรไฟล์ (/in/)', build: prefixed('https://www.linkedin.com/in/') },
  { id: 'line', label: 'LINE', placeholder: 'LINE ID', build: line },
  { id: 'whatsapp', label: 'WhatsApp', placeholder: 'เบอร์พร้อมรหัสประเทศ เช่น 66812345678', build: whatsapp },
  { id: 'telegram', label: 'Telegram', placeholder: 'username', build: prefixed('https://t.me/') },
  { id: 'threads', label: 'Threads', placeholder: 'username', build: prefixed('https://www.threads.net/@') },
  { id: 'pinterest', label: 'Pinterest', placeholder: 'username', build: prefixed('https://www.pinterest.com/') },
  { id: 'snapchat', label: 'Snapchat', placeholder: 'username', build: prefixed('https://www.snapchat.com/add/') },
  { id: 'discord', label: 'Discord', placeholder: 'invite code เช่น aBcd123', build: prefixed('https://discord.gg/') },
  { id: 'github', label: 'GitHub', placeholder: 'username', build: prefixed('https://github.com/') },
  { id: 'twitch', label: 'Twitch', placeholder: 'username', build: prefixed('https://www.twitch.tv/') },
  { id: 'spotify', label: 'Spotify', placeholder: 'username หรือวางลิงก์โปรไฟล์', build: prefixed('https://open.spotify.com/user/') },
  { id: 'wechat', label: 'WeChat', placeholder: 'WeChat ID หรือวางลิงก์', build: wechat },
]

const SOCIAL_BY_ID: Record<SocialPlatform, SocialMeta> = Object.fromEntries(
  SOCIAL_PLATFORMS.map((p) => [p.id, p]),
) as Record<SocialPlatform, SocialMeta>

export const socialMeta = (id: SocialPlatform): SocialMeta => SOCIAL_BY_ID[id]

// Build the profile URL for a social field. Returns '' when the value is empty.
export function socialUrl(s: { platform: SocialPlatform; value: string }): string {
  return socialMeta(s.platform).build(s.value)
}
