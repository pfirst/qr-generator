// CTA-label fonts for the frame's "SCAN ME" text.
//
// All entries are Thai-capable display faces so a Thai label (e.g. "สแกนเลย") renders
// correctly. The first is our bundled LINE Seed (no network); the rest come from Google
// Fonts. Two distinct paths use these:
//   • Preview (live DOM): we add ONE <link> to the Google Fonts CSS so the picker rows
//     and the on-screen preview can use each face. The DOM SVG inherits document fonts.
//   • Export (raster/SVG): an <img>-loaded SVG is sandboxed and CANNOT fetch external
//     fonts, so the chosen face must be EMBEDDED as a base64 @font-face inside the SVG —
//     otherwise the downloaded PNG/JPG/PDF would fall back to a default face. We fetch the
//     woff2 once, inline it, and cache the resulting CSS (see ensureFontCss / getFontCss).

export interface CtaFont {
  id: string // stable key persisted in style.frameFont
  label: string // display name (shown rendered in its own face in the picker)
  family: string // CSS font-family stack for the SVG <text> + preview
  weight: number // weight used for the label
  google?: { family: string; weight: number } // Google Fonts spec; absent = bundled
}

// ~14 curated faces. LINE Seed is bundled; the rest are Cadson Demak / Google Thai fonts.
export const CTA_FONTS: CtaFont[] = [
  { id: 'lineseed', label: 'LINE Seed', family: "'LINE Seed Sans TH','LINE Seed Sans',sans-serif", weight: 800 },
  { id: 'kanit', label: 'Kanit', family: "'Kanit',sans-serif", weight: 700, google: { family: 'Kanit', weight: 700 } },
  { id: 'prompt', label: 'Prompt', family: "'Prompt',sans-serif", weight: 700, google: { family: 'Prompt', weight: 700 } },
  { id: 'sarabun', label: 'Sarabun', family: "'Sarabun',sans-serif", weight: 700, google: { family: 'Sarabun', weight: 700 } },
  { id: 'mitr', label: 'Mitr', family: "'Mitr',sans-serif", weight: 600, google: { family: 'Mitr', weight: 600 } },
  { id: 'baijamjuree', label: 'Bai Jamjuree', family: "'Bai Jamjuree',sans-serif", weight: 700, google: { family: 'Bai Jamjuree', weight: 700 } },
  { id: 'chakrapetch', label: 'Chakra Petch', family: "'Chakra Petch',sans-serif", weight: 700, google: { family: 'Chakra Petch', weight: 700 } },
  { id: 'k2d', label: 'K2D', family: "'K2D',sans-serif", weight: 700, google: { family: 'K2D', weight: 700 } },
  { id: 'krub', label: 'Krub', family: "'Krub',sans-serif", weight: 700, google: { family: 'Krub', weight: 700 } },
  { id: 'mali', label: 'Mali', family: "'Mali',cursive", weight: 700, google: { family: 'Mali', weight: 700 } },
  { id: 'sriracha', label: 'Sriracha', family: "'Sriracha',cursive", weight: 400, google: { family: 'Sriracha', weight: 400 } },
  { id: 'charmonman', label: 'Charmonman', family: "'Charmonman',cursive", weight: 700, google: { family: 'Charmonman', weight: 700 } },
  { id: 'fahkwang', label: 'Fahkwang', family: "'Fahkwang',sans-serif", weight: 700, google: { family: 'Fahkwang', weight: 700 } },
  { id: 'trirong', label: 'Trirong', family: "'Trirong',serif", weight: 700, google: { family: 'Trirong', weight: 700 } },
]

const DEFAULT_FONT = CTA_FONTS[0]
const fontById = (id: string): CtaFont => CTA_FONTS.find((f) => f.id === id) ?? DEFAULT_FONT

export function fontFamilyOf(id: string): string {
  return fontById(id).family
}
export function fontWeightOf(id: string): number {
  return fontById(id).weight
}

const googleSpec = (g: { family: string; weight: number }): string =>
  `family=${g.family.replace(/ /g, '+')}:wght@${g.weight}`

// --- preview (live DOM): one stylesheet link covering every Google face -----------------
let previewLinkAdded = false
export function loadPreviewFonts(): void {
  if (previewLinkAdded || typeof document === 'undefined') return
  previewLinkAdded = true
  const specs = CTA_FONTS.filter((f) => f.google).map((f) => googleSpec(f.google!))
  const link = document.createElement('link')
  link.rel = 'stylesheet'
  link.href = `https://fonts.googleapis.com/css2?${specs.join('&')}&display=swap`
  document.head.appendChild(link)
}

// --- export embedding: fetch the woff2 once, inline as base64, cache the @font-face CSS ---
const cssCache = new Map<string, string>()

function base64FromBuffer(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf)
  let bin = ''
  const CHUNK = 0x8000 // chunk to dodge call-stack limits on String.fromCharCode(...big)
  for (let i = 0; i < bytes.length; i += CHUNK) {
    bin += String.fromCharCode(...bytes.subarray(i, i + CHUNK))
  }
  return btoa(bin)
}

// Ensure the chosen font's @font-face CSS (with every woff2 inlined as a data URL) is
// cached, ready for synchronous embedding into the export SVG. No-op for the bundled
// font, an already-cached font, or on any network error (export then falls back).
export async function ensureFontCss(id: string): Promise<void> {
  const f = fontById(id)
  if (!f.google || cssCache.has(id)) return
  try {
    const cssUrl = `https://fonts.googleapis.com/css2?${googleSpec(f.google)}&display=swap`
    let css = await (await fetch(cssUrl)).text()
    const urls = [...css.matchAll(/url\((https:\/\/[^)]+\.woff2)\)/g)].map((m) => m[1])
    const seen = new Set<string>()
    for (const u of urls) {
      if (seen.has(u)) continue
      seen.add(u)
      const buf = await (await fetch(u)).arrayBuffer()
      css = css.split(u).join(`data:font/woff2;base64,${base64FromBuffer(buf)}`)
    }
    cssCache.set(id, css)
  } catch {
    /* network/CORS issue — leave uncached; export falls back to the default face */
  }
}

// Synchronous accessor for composeFramedSvg. null = not embedded (bundled font, or not
// yet fetched — the live preview still shows it via the document stylesheet).
export function getFontCss(id: string): string | null {
  return cssCache.get(id) ?? null
}
