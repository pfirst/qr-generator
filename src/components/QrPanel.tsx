import { useState, type ComponentType } from 'react'
import { BODY_SHAPES, BG_PRESETS, ECC_LEVELS, EYE_FRAMES, EYEBALLS, FG_PRESETS } from '../constants'
import { defaultStyle, type GradientType, type FrameStyle, type StyleSettings } from '../core/types'
import { composeFramedSvg, FRAME_TEMPLATES, frameThumb } from '../core/frames'
import { FRAME_GLYPHS } from '../ui/shapeGlyphs'
import { Card, SectionHead } from '../ui/surfaces'
import { ACCENT_GRAD, ColorRow, SectionLabel, SegGroup, ShapeMenu, Toggle } from '../ui/controls'
import {
  CellsIcon,
  FrameIcon,
  GradDiagonalIcon,
  GradLinearIcon,
  GradNoneIcon,
  GradRadialIcon,
  MarkerBorderIcon,
  MarkerCenterIcon,
  PaletteIcon,
  ResetIcon,
  SlidersIcon,
  WarnIcon,
} from '../ui/icons'

// Three separate shape pickers (กรอบตา / จุดตา / จุด) like Figma, plus colour,
// the CTA frame, and advanced settings.
type TabId = 'color' | 'border' | 'center' | 'cells' | 'cta' | 'adv'
const TABS: { id: TabId; label: string; Icon: ComponentType<{ size?: number }> }[] = [
  { id: 'color', label: 'สี', Icon: PaletteIcon },
  { id: 'border', label: 'กรอบตา', Icon: MarkerBorderIcon },
  { id: 'center', label: 'จุดตา', Icon: MarkerCenterIcon },
  { id: 'cells', label: 'จุด', Icon: CellsIcon },
  { id: 'cta', label: 'เฟรม', Icon: FrameIcon },
  { id: 'adv', label: 'ขั้นสูง', Icon: SlidersIcon },
]
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

function PopBody({ tab, style, patch }: { tab: TabId; style: StyleSettings; patch: (p: Partial<StyleSettings>) => void }) {
  const hasLogo = !!style.logo

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
      <div className="w-[286px]">
        <SectionLabel>กรอบ + ป้าย CTA</SectionLabel>
        <div className="grid grid-cols-4 gap-1.5">
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
        {style.frameStyle !== 'none' && (
          <div className="mt-3.5 flex items-center gap-3">
            <input
              value={style.frameText}
              onChange={(e) => patch({ frameText: e.target.value })}
              placeholder="SCAN ME"
              className="flex-1 rounded-[11px] border border-[#e6e7ee] bg-white px-3 py-2.5 text-[14px] font-bold text-[#111827] outline-none focus:border-[#7c3aed]"
            />
            <input type="color" value={style.frameColor} onChange={(e) => patch({ frameColor: e.target.value })} className="h-[42px] w-11 cursor-pointer rounded-[10px] border border-[#e6e7ee] bg-white p-1" />
          </div>
        )}
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
        <SegGroup options={ECC_LEVELS} value={hasLogo ? 'H' : style.ecc} onChange={(v) => !hasLogo && patch({ ecc: v })} />
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

export function QrPanel({ svg, hasData, style, patchStyle }: { svg: string | null; hasData: boolean; style: StyleSettings; patchStyle: (p: Partial<StyleSettings>) => void }) {
  const [open, setOpen] = useState<TabId | null>(null)

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
        <div className="relative mt-5 flex justify-center">
          <div className="relative z-50 inline-flex items-center gap-1.5 rounded-[18px] border border-[#eef0f5] bg-white p-1.5 shadow-[0_8px_24px_rgba(17,24,39,0.09)]">
            {TABS.map((t) => {
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
                      <PopBody tab={t.id} style={style} patch={patchStyle} />
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* settings popups (สี / เฟรม / ขั้นสูง) — centred above the toolbar */}
          {open && !SHAPE_TABS.includes(open) && (
            <div className="absolute bottom-full left-0 right-0 z-50 mb-3 flex justify-center">
              <div
                className="max-h-[64vh] w-max max-w-[340px] overflow-y-auto rounded-[22px] bg-white p-2.5 shadow-[0_20px_56px_rgba(17,24,39,0.22)]"
                style={{ animation: 'popIn .18s cubic-bezier(.2,.9,.3,1.2)' }}
              >
                <PopBody tab={open} style={style} patch={patchStyle} />
              </div>
            </div>
          )}

          {open && <div className="fixed inset-0 z-40" onClick={() => setOpen(null)} />}
        </div>
      </Card>
  )
}
