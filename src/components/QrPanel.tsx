import { useEffect, useRef, useState, type ComponentType, type CSSProperties, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { BODY_SHAPES, BG_PRESETS, ECC_LEVELS, EYE_FRAMES, EYEBALLS, FG_PRESETS } from '../constants'
import { defaultStyle, type GradientType, type FrameStyle, type QRType, type StyleSettings } from '../core/types'
import { composeFramedSvg, FRAME_TEMPLATES, frameThumb } from '../core/frames'
import { CTA_FONTS, loadPreviewFonts } from '../core/fonts'
import { FRAME_GLYPHS } from '../ui/shapeGlyphs'
import { Card, SectionHead } from '../ui/surfaces'
import { ACCENT_GRAD, ColorRow, SectionLabel, SegGroup, ShapeMenu, Toggle } from '../ui/controls'
import { LogoSettingsBody } from './LogoSettings'
import {
  CellsIcon,
  FrameIcon,
  GradDiagonalIcon,
  GradLinearIcon,
  GradNoneIcon,
  GradRadialIcon,
  CheckIcon,
  LogoCenterIcon,
  MarkerBorderIcon,
  MarkerCenterIcon,
  PaletteIcon,
  ResetIcon,
  SlidersIcon,
  WarnIcon,
} from '../ui/icons'

// Three separate shape pickers (กรอบตา / จุดตา / จุด) like Figma, plus colour,
// the logo, the CTA frame, and advanced settings.
type TabId = 'color' | 'border' | 'center' | 'cells' | 'logo' | 'cta' | 'adv'
type TabDef = { id: TabId; label: string; Icon: ComponentType<{ size?: number }> }
// Fixed tabs (always present). The `logo` tab is injected separately so it can animate
// in/out around the `cta` boundary — see the toolbar render below.
const TABS: TabDef[] = [
  { id: 'color', label: 'สี', Icon: PaletteIcon },
  { id: 'border', label: 'กรอบตา', Icon: MarkerBorderIcon },
  { id: 'center', label: 'จุดตา', Icon: MarkerCenterIcon },
  { id: 'cells', label: 'จุด', Icon: CellsIcon },
  { id: 'cta', label: 'กรอบ', Icon: FrameIcon },
  { id: 'adv', label: 'ขั้นสูง', Icon: SlidersIcon },
]
// The logo tab lives before `cta`; the animated slot is rendered between these two groups.
const CTA_INDEX = TABS.findIndex((t) => t.id === 'cta')
const TABS_LEFT = TABS.slice(0, CTA_INDEX)
const TABS_RIGHT = TABS.slice(CTA_INDEX)
const LOGO_TAB: TabDef = { id: 'logo', label: 'โลโก้', Icon: LogoCenterIcon }
// Shape pickers get Figma's anchored dropdown; the rest use a centred popup.
const SHAPE_TABS: TabId[] = ['border', 'center', 'cells']
const FRAME_CHOICES: { id: FrameStyle; label: string }[] = [
  { id: 'none', label: 'ไม่มี' },
  ...(Object.keys(FRAME_TEMPLATES) as Exclude<FrameStyle, 'none'>[]).map((id) => ({ id, label: FRAME_TEMPLATES[id].label })),
]
const GRADIENTS: { id: GradientType; label: string; Icon: ComponentType<{ size?: number }> }[] = [
  { id: 'none', label: 'ไม่มี', Icon: GradNoneIcon },
  { id: 'linear', label: 'เส้นตรง', Icon: GradLinearIcon },
  { id: 'diagonal', label: 'ทแยง', Icon: GradDiagonalIcon },
  { id: 'radial', label: 'รัศมี', Icon: GradRadialIcon },
]

// CTA label font picker: a collapsed dropdown (trigger shows the current font in its own
// face) that expands an in-flow list, each row previewed in its own face. In-flow (not
// absolutely positioned) so the parent popup's overflow-y-auto scrolls it instead of clipping.
function FontPicker({ value, onChange }: { value: string; onChange: (id: string) => void }) {
  const [open, setOpen] = useState(false)
  const [rect, setRect] = useState<DOMRect | null>(null)
  const btnRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const cur = CTA_FONTS.find((f) => f.id === value) ?? CTA_FONTS[0]

  const toggle = () => {
    setRect(btnRef.current?.getBoundingClientRect() ?? null)
    setOpen((o) => !o)
  }

  // While open: keep the floating panel pinned to the trigger (scroll/resize) and close on
  // outside click / Escape. The list lives in a portal so the parent popup's overflow-y can't
  // clip it — it floats above as a real popover instead of pushing the popup's content.
  useEffect(() => {
    if (!open) return
    const reposition = () => setRect(btnRef.current?.getBoundingClientRect() ?? null)
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node
      if (btnRef.current?.contains(t) || panelRef.current?.contains(t)) return
      setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    window.addEventListener('scroll', reposition, true)
    window.addEventListener('resize', reposition)
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('scroll', reposition, true)
      window.removeEventListener('resize', reposition)
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  let panelStyle: CSSProperties | null = null
  if (rect) {
    const gap = 6
    const spaceBelow = window.innerHeight - rect.bottom
    const spaceAbove = rect.top
    const up = spaceBelow < 260 && spaceAbove > spaceBelow // flip above when the bottom is cramped
    panelStyle = {
      position: 'fixed',
      left: rect.left,
      width: rect.width,
      maxHeight: Math.max(120, Math.min(260, (up ? spaceAbove : spaceBelow) - gap - 8)),
      ...(up ? { bottom: window.innerHeight - rect.top + gap } : { top: rect.bottom + gap }),
    }
  }

  return (
    <div>
      <button
        ref={btnRef}
        type="button"
        onClick={toggle}
        style={{ fontFamily: cur.family, fontWeight: cur.weight }}
        className="flex w-full cursor-pointer items-center justify-between rounded-[11px] border border-[#e6e7ee] bg-white px-3 py-2.5 text-left text-[15px] text-[#111827] outline-none transition hover:border-[#c4b5fd]"
      >
        <span className="truncate">{cur.label}</span>
        <svg
          width={16}
          height={16}
          viewBox="0 0 24 24"
          fill="none"
          stroke="#9ca3af"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          className={'ml-2 shrink-0 transition-transform ' + (open ? 'rotate-180' : '')}
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>
      {open &&
        panelStyle &&
        createPortal(
          <div
            ref={panelRef}
            data-qr-float
            style={panelStyle}
            className="z-[60] flex flex-col gap-1 overflow-y-auto rounded-[12px] border border-[#eef0f5] bg-white p-1.5 shadow-[0_16px_44px_rgba(17,24,39,0.20)]"
          >
            {CTA_FONTS.map((f) => {
              const on = value === f.id
              return (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => {
                    onChange(f.id)
                    setOpen(false)
                  }}
                  style={{ fontFamily: f.family, fontWeight: f.weight }}
                  className={
                    'flex shrink-0 items-center justify-between rounded-[10px] border px-3 py-2 text-left text-[15px] transition ' +
                    (on ? 'border-[#7c3aed] bg-[#ede9fe] text-[#7c3aed]' : 'border-transparent text-[#374151] hover:bg-[#f3f4f8]')
                  }
                >
                  {f.label}
                  {on && <CheckIcon size={15} />}
                </button>
              )
            })}
          </div>,
          document.body,
        )}
    </div>
  )
}

function Swatches({ colors, value, onChange }: { colors: readonly string[]; value: string; onChange: (c: string) => void }) {
  return (
    <div className="mt-2 flex flex-wrap gap-1.5">
      {colors.map((c) => (
        <button
          key={c}
          onClick={() => onChange(c)}
          title={c}
          className={'h-6 w-6 rounded-[7px] border transition ' + (value.toLowerCase() === c.toLowerCase() ? 'border-[#7c3aed] ring-2 ring-[#c4b5fd]' : 'border-[#e6e7ee] hover:scale-110')}
          style={{ background: c }}
        />
      ))}
    </div>
  )
}

// The CTA text/colour/font controls that appear once a frame is picked. They slide-down +
// fade IN on every frame pick — including switching frame→frame — by keying the wrapper on
// frameStyle so it remounts and replays. When the frame is cleared to 'none' they slide-up +
// fade OUT, staying mounted through the exit animation (then unmount on animationend).
function CtaControls({ frameStyle, children }: { frameStyle: FrameStyle; children: ReactNode }) {
  const show = frameStyle !== 'none'
  const [mounted, setMounted] = useState(show)
  const [phase, setPhase] = useState<'in' | 'out'>('in')
  const lastFrame = useRef(frameStyle) // remember the frame so exit keeps its content/key

  useEffect(() => {
    if (show) {
      lastFrame.current = frameStyle
      setMounted(true)
      setPhase('in')
    } else if (mounted) {
      setPhase('out')
    }
  }, [show, frameStyle, mounted])

  if (!mounted) return null
  // Enter: key by the live frame (remount → replay on each change). Exit: keep the last frame's
  // key so the fading-out content doesn't swap mid-animation.
  const animKey = phase === 'out' ? lastFrame.current : frameStyle
  return (
    <div
      key={animKey}
      onAnimationEnd={(e) => {
        if (e.target === e.currentTarget && phase === 'out') setMounted(false)
      }}
      style={{
        animation:
          phase === 'out'
            ? 'slideUpFadeOut .15s cubic-bezier(.4,0,.9,.4) both' // exit is snappier than the enter
            : 'slideDownFade .26s cubic-bezier(.2,.9,.3,1.2) both',
      }}
    >
      {children}
    </div>
  )
}

function PopBody({
  tab,
  style,
  patch,
  baseStyle,
  type,
}: {
  tab: TabId
  style: StyleSettings
  patch: (p: Partial<StyleSettings>) => void
  baseStyle: StyleSettings
  type: QRType
}) {
  const hasLogo = !!style.logo

  // Logo styling reads the REAL style (baseStyle) — renderStyle overrides logoSize/logoBg
  // for presets, so `style` here would show the wrong slider positions.
  if (tab === 'logo') return <LogoSettingsBody style={baseStyle} patch={patch} type={type} />

  if (tab === 'color') {
    return (
      <div className="flex w-[286px] flex-col gap-4">
        <div>
          <ColorRow label="สีจุด (Foreground)" value={style.fg} onChange={(v) => patch({ fg: v })} />
          <Swatches colors={FG_PRESETS} value={style.fg} onChange={(v) => patch({ fg: v })} />
        </div>
        <div>
          <ColorRow label="สีพื้นหลัง" value={style.bg} onChange={(v) => patch({ bg: v })} />
          <Swatches colors={BG_PRESETS} value={style.bg} onChange={(v) => patch({ bg: v })} />
        </div>
        <div className="border-t border-[#eef0f5] pt-3.5">
          <label className="flex cursor-pointer items-center justify-between">
            <span className="text-[13px] font-bold text-[#374151]">กำหนดสีดวงตาแยก</span>
            <Toggle on={style.useEyeColor} onChange={(v) => patch({ useEyeColor: v })} />
          </label>
          {style.useEyeColor && (
            <div className="mt-3">
              <ColorRow label="สีดวงตา" value={style.eyeColor} onChange={(v) => patch({ eyeColor: v })} />
            </div>
          )}
        </div>
        <div className="border-t border-[#eef0f5] pt-3.5">
          <SectionLabel>ไล่เฉดสีบนตัว QR</SectionLabel>
          <div className="grid grid-cols-4 gap-2">
            {GRADIENTS.map(({ id, label, Icon }) => {
              const on = style.gradient === id
              return (
                <button
                  key={id}
                  onClick={() => patch({ gradient: id })}
                  className={
                    'flex cursor-pointer flex-col items-center gap-1.5 rounded-[11px] border py-2.5 text-[11px] font-bold transition ' +
                    (on ? 'border-[#7c3aed] bg-[#ede9fe] text-[#7c3aed]' : 'border-[#e6e7ee] bg-white text-[#9ca3af] hover:border-[#c4b5fd]')
                  }
                >
                  <Icon size={18} />
                  {label}
                </button>
              )
            })}
          </div>
          {style.gradient !== 'none' && (
            <>
              <div className="mt-3.5 flex items-center gap-5">
                <ColorRow label="เริ่ม" value={style.gradFrom} onChange={(v) => patch({ gradFrom: v })} />
                <ColorRow label="จบ" value={style.gradTo} onChange={(v) => patch({ gradTo: v })} />
              </div>
              <div className="mt-3 flex items-start gap-2 rounded-[11px] border border-[#fdebc8] bg-[#fffaf0] px-3 py-2.5">
                <WarnIcon size={14} className="mt-px shrink-0 text-[#f59e0b]" />
                <span className="text-[11.5px] leading-[1.5] text-[#92733a]">ไล่เฉดอาจลดความคมชัด แนะนำทดสอบสแกนก่อนใช้จริง</span>
              </div>
            </>
          )}
        </div>
      </div>
    )
  }

  if (tab === 'border') {
    return <ShapeMenu kind="frame" options={EYE_FRAMES} value={style.eyeFrameShape} onChange={(v) => patch({ eyeFrameShape: v })} />
  }

  if (tab === 'center') {
    return <ShapeMenu kind="ball" options={EYEBALLS} value={style.eyeballShape} onChange={(v) => patch({ eyeballShape: v })} />
  }

  if (tab === 'cells') {
    return <ShapeMenu kind="body" options={BODY_SHAPES} value={style.bodyShape} onChange={(v) => patch({ bodyShape: v })} />
  }

  if (tab === 'cta') {
    return (
      <div className="w-[286px] sm:w-[330px]">
        <SectionLabel>กรอบ</SectionLabel>
        <div className="grid grid-cols-4 gap-1.5 sm:grid-cols-5">
          {FRAME_CHOICES.map(({ id, label }) => {
            const on = style.frameStyle === id
            return (
              <button
                key={id}
                onClick={() => patch({ frameStyle: id })}
                title={label}
                className={
                  'flex cursor-pointer flex-col items-center gap-1 rounded-[11px] border py-2 text-[10px] font-bold transition ' +
                  (on ? 'border-[#7c3aed] bg-[#ede9fe] text-[#7c3aed]' : 'border-[#e6e7ee] bg-white text-[#9ca3af] hover:border-[#c4b5fd]')
                }
              >
                {id === 'none' ? (
                  <span className="grid h-9 w-9 place-items-center text-[#9ca3af]" dangerouslySetInnerHTML={{ __html: FRAME_GLYPHS.none }} />
                ) : (
                  <span className="block h-9 [&>svg]:mx-auto [&>svg]:h-full [&>svg]:w-auto" dangerouslySetInnerHTML={{ __html: frameThumb(id) }} />
                )}
                {label}
              </button>
            )
          })}
        </div>
        <CtaControls frameStyle={style.frameStyle}>
          <div className="mt-3.5 flex items-center gap-3">
            <input
              value={style.frameText}
              onChange={(e) => patch({ frameText: e.target.value })}
              placeholder="SCAN ME"
              className="flex-1 rounded-[11px] border border-[#e6e7ee] bg-white px-3 py-2.5 text-[14px] font-bold text-[#111827] outline-none focus:border-[#7c3aed]"
            />
            <input type="color" value={style.frameColor} onChange={(e) => patch({ frameColor: e.target.value })} className="h-[42px] w-11 cursor-pointer rounded-[10px] border border-[#e6e7ee] bg-white p-1" />
          </div>
          <div className="mt-3.5">
            <SectionLabel>ฟอนต์ป้าย</SectionLabel>
            <FontPicker value={style.frameFont} onChange={(id) => patch({ frameFont: id })} />
          </div>
        </CtaControls>
      </div>
    )
  }

  // adv
  const d = defaultStyle()
  // Reset advanced settings to defaults. With a logo present, ECC is locked at H,
  // so only the preview size + quiet zone reset (leave ecc alone).
  const resetAdv = () =>
    patch(hasLogo ? { size: d.size, margin: d.margin } : { ecc: d.ecc, size: d.size, margin: d.margin })
  return (
    <div className="flex w-[286px] flex-col gap-4">
      <div>
        <div className="mb-2.5 flex items-center justify-between">
          <span className="text-[12.5px] font-bold text-[#6b7280]">ระดับการแก้ไขข้อผิดพลาด (ECC)</span>
          <button
            onClick={resetAdv}
            title="รีเซ็ตค่าขั้นสูงกลับค่าเริ่มต้น"
            className="grid h-[26px] w-[26px] place-items-center rounded-[8px] text-[#9ca3af] transition hover:bg-[#f3f4f8] hover:text-[#7c3aed]"
          >
            <ResetIcon size={14} />
          </button>
        </div>
        <SegGroup
          options={ECC_LEVELS}
          value={hasLogo ? 'H' : style.ecc}
          onChange={(v) => !hasLogo && patch({ ecc: v })}
          disabledIds={hasLogo ? (['L', 'M', 'Q'] as const) : undefined}
        />
        {hasLogo && <div className="mt-2 text-[11.5px] text-[#9ca3af]">ล็อกที่ระดับ H เพราะมีโลโก้</div>}
      </div>
      <div>
        <div className="mb-1.5 flex justify-between text-[12.5px] font-bold text-[#6b7280]">
          <span>ขนาดพรีวิว</span>
          <span className="font-mono text-[#9ca3af]">{style.size} px</span>
        </div>
        <input type="range" min={200} max={420} step={10} value={style.size} onChange={(e) => patch({ size: +e.target.value })} className="w-full" />
      </div>
      <div>
        <div className="mb-1.5 flex justify-between text-[12.5px] font-bold text-[#6b7280]">
          <span>ระยะขอบ (Quiet zone)</span>
          <span className="font-mono text-[#9ca3af]">{style.margin}</span>
        </div>
        <input type="range" min={0} max={10} step={1} value={style.margin} onChange={(e) => patch({ margin: +e.target.value })} className="w-full" />
      </div>
    </div>
  )
}

export function QrPanel({
  svg,
  hasData,
  style,
  baseStyle,
  type,
  patchStyle,
}: {
  svg: string | null
  hasData: boolean
  style: StyleSettings
  baseStyle: StyleSettings
  type: QRType
  patchStyle: (p: Partial<StyleSettings>) => void
}) {
  const [open, setOpen] = useState<TabId | null>(null)
  const barRef = useRef<HTMLDivElement>(null)

  // Close any open popup/dropdown when the user clicks outside the toolbar (or presses Escape).
  // A fixed full-screen backdrop can't be used here: the surrounding Card has `backdrop-blur`
  // (a backdrop-filter), which makes `position:fixed` descendants resolve against the Card's box
  // instead of the viewport — so a backdrop only covers the card and misses clicks elsewhere
  // (the "closes only in some areas" bug). A document listener keyed off a ref sidesteps all
  // stacking/containing-block issues.
  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      const t = e.target as Element | null
      if (barRef.current?.contains(t as Node | null)) return
      // Floating panels rendered in a portal (e.g. the CTA font list) live outside the bar —
      // clicking them must not close the popup that owns them.
      if (t?.closest?.('[data-qr-float]')) return
      setOpen(null)
    }
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(null)
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  // The logo tab shows only when an effective logo is present. `style` is renderStyle, so
  // `style.logo` === effLogo (custom upload OR a toggled-on preset).
  const logoOn = !!style.logo
  const [logoMounted, setLogoMounted] = useState(logoOn)
  const [logoClip, setLogoClip] = useState(true) // clip during the grow/collapse; drop it once open so the active glow isn't cut
  useEffect(() => {
    if (logoOn) {
      setLogoMounted(true)
      return
    }
    setLogoClip(true)
    const t = window.setTimeout(() => setLogoMounted(false), 220) // keep mounted for the collapse animation
    return () => clearTimeout(t)
  }, [logoOn])
  // If the logo disappears while its popup is open, close the popup.
  useEffect(() => {
    if (!logoOn && open === 'logo') setOpen(null)
  }, [logoOn, open])

  // Lazily fetch the Google preview fonts the first time the frame tab opens — keeps them
  // off the initial page load and fires no network request until the user wants fonts.
  useEffect(() => {
    if (open === 'cta') loadPreviewFonts()
  }, [open])

  // One tab button (+ its anchored shape dropdown). Shared by the fixed groups and the
  // animated logo slot.
  const renderTab = (t: TabDef) => {
    const on = open === t.id
    const isShape = SHAPE_TABS.includes(t.id)
    return (
      <div key={t.id} className="relative">
        <button
          title={t.label}
          onClick={() => setOpen(on ? null : t.id)}
          className={
            'grid h-11 w-11 cursor-pointer place-items-center rounded-[13px] transition ' +
            (on ? 'border border-transparent text-white shadow-[0_4px_14px_rgba(124,58,237,0.32)]' : 'text-[#6b7280] hover:bg-[#f3f4f8] hover:text-[#15161c]')
          }
          style={on ? { backgroundImage: ACCENT_GRAD } : undefined}
        >
          <t.Icon size={19} />
        </button>
        {/* shape pickers: dropdown anchored to the icon, Figma-style */}
        {on && isShape && (
          <div
            className="absolute bottom-full left-1/2 z-50 mb-3 -translate-x-1/2 rounded-[18px] bg-white p-1.5 shadow-[0_20px_56px_rgba(17,24,39,0.22)]"
            style={{ animation: 'popIn .18s cubic-bezier(.2,.9,.3,1.2)' }}
          >
            <PopBody tab={t.id} style={style} patch={patchStyle} baseStyle={baseStyle} type={type} />
          </div>
        )}
      </div>
    )
  }

  return (
    <Card className="relative p-5 sm:p-6">
        <SectionHead icon={<SlidersIcon size={20} />} title="ปรับแต่ง QR" sub="แสดงผลแบบเรียลไทม์" />

        {/* preview stage */}
        <div
          className="relative flex min-h-[300px] items-center justify-center overflow-hidden rounded-[20px] border border-[#eceef6] p-6"
          style={{
            background:
              'radial-gradient(30% 60% at 18% 50%,rgba(150,106,235,0.16),transparent 72%),radial-gradient(30% 62% at 82% 52%,rgba(106,148,246,0.17),transparent 72%),radial-gradient(20% 34% at 88% 14%,rgba(244,168,208,0.10),transparent 70%),#f8f9fe',
          }}
        >
          {/* purple halftone cloud — left */}
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              backgroundImage: 'radial-gradient(rgba(140,100,222,0.26) 1px,transparent 1.6px)',
              backgroundSize: '13px 13px',
              maskImage: 'radial-gradient(36% 64% at 18% 50%,#000 5%,transparent 74%)',
              WebkitMaskImage: 'radial-gradient(36% 64% at 18% 50%,#000 5%,transparent 74%)',
            }}
          />
          {/* blue halftone cloud — right */}
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              backgroundImage: 'radial-gradient(rgba(96,150,246,0.28) 1px,transparent 1.6px)',
              backgroundSize: '13px 13px',
              maskImage: 'radial-gradient(36% 66% at 82% 52%,#000 5%,transparent 74%)',
              WebkitMaskImage: 'radial-gradient(36% 66% at 82% 52%,#000 5%,transparent 74%)',
            }}
          />
          {hasData && svg ? (
            <div className="relative rounded-[26px] border border-[#eef1f8] bg-white p-4" style={{ boxShadow: 'var(--shadow-qr)' }}>
              <div
                key={svg.length}
                className="overflow-hidden rounded-[10px] leading-[0]"
                style={{ animation: 'qrpop .26s cubic-bezier(.2,.9,.3,1.3)' }}
                dangerouslySetInnerHTML={{ __html: composeFramedSvg(svg, style.size, style) }}
              />
            </div>
          ) : (
            <div className="relative flex flex-col items-center gap-3 rounded-[16px] border-[1.5px] border-dashed border-[#dcdee8] bg-white/60 px-10 py-12 text-center">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#c4b5fd" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="7" height="7" rx="1" />
                <rect x="14" y="3" width="7" height="7" rx="1" />
                <rect x="3" y="14" width="7" height="7" rx="1" />
                <path d="M14 14h3v3M21 21v.01M17 21h-3v-3M21 14v3" />
              </svg>
              <div className="max-w-[200px] text-[13px] text-[#9ca3af]">กรอกข้อมูลให้ครบเพื่อสร้าง QR</div>
            </div>
          )}
        </div>

        {/* toolbar — floating icon pill */}
        <div ref={barRef} className="relative mt-5 flex justify-center">
          <div className="relative z-50 inline-flex items-center gap-1.5 rounded-[18px] border border-[#eef0f5] bg-white p-1.5 shadow-[0_8px_24px_rgba(17,24,39,0.09)]">
            {TABS_LEFT.map(renderTab)}
            {/* logo slot — grows in / collapses out when an effective logo appears/disappears */}
            {logoMounted && (
              <div
                className={'shrink-0 ' + (logoClip ? 'overflow-hidden' : '')}
                onAnimationEnd={() => logoOn && setLogoClip(false)}
                style={{ animation: `${logoOn ? 'logoTabIn' : 'logoTabOut'} .22s cubic-bezier(.2,.9,.3,1.2) both` }}
              >
                {renderTab(LOGO_TAB)}
              </div>
            )}
            {TABS_RIGHT.map(renderTab)}
          </div>

          {/* settings popups (สี / กรอบ / ขั้นสูง) — centred above the toolbar */}
          {open && !SHAPE_TABS.includes(open) && (
            <div className="absolute bottom-full left-0 right-0 z-50 mb-3 flex justify-center">
              <div
                className="max-h-[64vh] w-max max-w-[356px] overflow-y-auto rounded-[22px] bg-white p-2.5 shadow-[0_20px_56px_rgba(17,24,39,0.22)]"
                style={{ animation: 'popIn .18s cubic-bezier(.2,.9,.3,1.2)' }}
              >
                <PopBody tab={open} style={style} patch={patchStyle} baseStyle={baseStyle} type={type} />
              </div>
            </div>
          )}
        </div>
      </Card>
  )
}
