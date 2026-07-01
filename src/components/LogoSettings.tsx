// Logo *styling* controls, surfaced as the "โลโก้" tab in QrPanel's toolbar.
// These read the REAL style (App's `style`, passed to QrPanel as `baseStyle`) — NOT the
// effective `renderStyle`, which overrides logoSize/logoBg for presets. Writes go through
// `patch` (real style). The upload/toggle/preview/delete affordances stay in LogoUploader.
import type { ComponentType } from 'react'
import type { LogoBg, QRType, StyleSettings } from '../core/types'
import { ColorRow, SectionLabel, SegGroup } from '../ui/controls'
import { PlateCircleIcon, PlateNoneIcon, PlateRoundedIcon, PlateSquareIcon } from '../ui/icons'

const STYLEABLE: QRType[] = ['social', 'email', 'sms', 'tel', 'wifi', 'vcard', 'geo']
const CATEGORY_TYPES: QRType[] = ['email', 'sms', 'tel', 'wifi', 'vcard', 'geo']

type Ico = ComponentType<{ size?: number }>

const PLATES: { id: StyleSettings['presetPlate']; label: string }[] = [
  { id: 'brand', label: 'สีแบรนด์' },
  { id: 'halo', label: 'กรอบตามรูปโลโก้' },
  { id: 'none', label: 'ไม่มี' },
]
// รูปทรง (brand chip) + พื้นหลังโลโก้ show the shape as an icon (label → tooltip).
const SHAPES: { id: StyleSettings['presetShape']; label: string; Icon: Ico }[] = [
  { id: 'square', label: 'เหลี่ยม', Icon: PlateSquareIcon },
  { id: 'rounded', label: 'มน', Icon: PlateRoundedIcon },
  { id: 'circle', label: 'วงกลม', Icon: PlateCircleIcon },
]
const LOGO_BGS: { id: LogoBg; label: string; Icon: Ico }[] = [
  { id: 'none', label: 'ไม่มี', Icon: PlateNoneIcon },
  { id: 'square', label: 'สี่เหลี่ยม', Icon: PlateSquareIcon },
  { id: 'rounded', label: 'มน', Icon: PlateRoundedIcon },
  { id: 'circle', label: 'วงกลม', Icon: PlateCircleIcon },
]

// Logo-size slider — shared by styleable presets AND promptpay/bill (whose only styling is size).
function SizeSlider({ style, patch }: { style: StyleSettings; patch: (p: Partial<StyleSettings>) => void }) {
  return (
    <div className="mt-4">
      <div className="mb-1.5 flex justify-between text-[12.5px] font-bold text-[#6b7280]">
        <span>ขนาดโลโก้</span>
        <span className="font-mono text-[#9ca3af]">{Math.round(style.logoSize * 100)}%</span>
      </div>
      <input type="range" min={5} max={60} value={Math.round(style.logoSize * 100)} onChange={(e) => patch({ logoSize: +e.target.value / 100 })} className="w-full" />
    </div>
  )
}

// Backing controls for a styleable preset (social / email / sms / tel / wifi).
function PresetControls({ style, patch, isCategory }: { style: StyleSettings; patch: (p: Partial<StyleSettings>) => void; isCategory: boolean }) {
  return (
    <>
      <div className="mt-4">
        <SectionLabel>แผ่นรอง</SectionLabel>
        <SegGroup options={PLATES} value={style.presetPlate} onChange={(v) => patch({ presetPlate: v })} />
      </div>

      {style.presetPlate === 'brand' && (
        <div className="mt-4">
          <SectionLabel>รูปทรง</SectionLabel>
          <SegGroup options={SHAPES} value={style.presetShape} onChange={(v) => patch({ presetShape: v })} />
        </div>
      )}

      {style.presetPlate !== 'none' && (
        <div className="mt-4">
          <div className="mb-1.5 flex justify-between text-[12.5px] font-bold text-[#6b7280]">
            <span>ความหนากรอบ</span>
            <span className="font-mono text-[#9ca3af]">{style.presetHalo}</span>
          </div>
          <input type="range" min={6} max={24} step={1} value={style.presetHalo} onChange={(e) => patch({ presetHalo: +e.target.value })} className="w-full" />
        </div>
      )}

      {isCategory && (
        <div className="mt-4">
          <ColorRow label="สีไอคอน" value={style.presetColor} onChange={(v) => patch({ presetColor: v })} />
        </div>
      )}

      <SizeSlider style={style} patch={patch} />
    </>
  )
}

// Size / background / padding controls for a custom upload.
function LogoControls({ style, patch }: { style: StyleSettings; patch: (p: Partial<StyleSettings>) => void }) {
  return (
    <>
      <div className="mb-1.5 flex justify-between text-[12.5px] font-bold text-[#6b7280]">
        <span>ขนาดโลโก้</span>
        <span className="font-mono text-[#9ca3af]">{Math.round(style.logoSize * 100)}%</span>
      </div>
      <input type="range" min={5} max={60} value={Math.round(style.logoSize * 100)} onChange={(e) => patch({ logoSize: +e.target.value / 100 })} className="w-full" />

      <div className="mt-4">
        <SectionLabel>พื้นหลังโลโก้</SectionLabel>
        <SegGroup options={LOGO_BGS} value={style.logoBg} onChange={(v) => patch({ logoBg: v })} />
      </div>

      {style.logoBg !== 'none' && (
        <div className="mt-4">
          <div className="mb-1.5 flex justify-between text-[12.5px] font-bold text-[#6b7280]">
            <span>ระยะขอบแผ่นรอง</span>
            <span className="font-mono text-[#9ca3af]">{Math.round(style.logoPadding * 100)}%</span>
          </div>
          <input type="range" min={0} max={40} value={Math.round(style.logoPadding * 100)} onChange={(e) => patch({ logoPadding: +e.target.value / 100 })} className="w-full" />
        </div>
      )}
    </>
  )
}

// The logo-tab popup body. Picks the control set by context (custom upload > styleable
// preset > promptpay/bill). Only rendered when an effective logo is present.
export function LogoSettingsBody({ style, patch, type }: { style: StyleSettings; patch: (p: Partial<StyleSettings>) => void; type: QRType }) {
  const body = style.logo ? (
    <LogoControls style={style} patch={patch} /> // custom upload
  ) : STYLEABLE.includes(type) ? (
    <PresetControls style={style} patch={patch} isCategory={CATEGORY_TYPES.includes(type)} />
  ) : (
    <SizeSlider style={style} patch={patch} /> // promptpay / bill
  )
  return <div className="w-[286px]">{body}</div>
}
