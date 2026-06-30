import { useRef, useState, type ReactNode } from 'react'
import type { LogoBg, QRType, StyleSettings } from '../core/types'
import { hasPreset, presetLogoUrl } from '../core/logoPreset'
import { SectionLabel, SegGroup, Toggle } from '../ui/controls'
import { TrashIcon, UploadIcon } from '../ui/icons'

const LOGO_BGS: { id: LogoBg; label: string }[] = [
  { id: 'none', label: 'ไม่มี' },
  { id: 'square', label: 'สี่เหลี่ยม' },
  { id: 'rounded', label: 'มน' },
  { id: 'circle', label: 'วงกลม' },
]

// Size / background / padding controls — shared by custom upload AND preset.
function LogoControls({ style, patch }: { style: StyleSettings; patch: (p: Partial<StyleSettings>) => void }) {
  return (
    <>
      <div className="mb-1.5 flex justify-between text-[12.5px] font-bold text-[#6b7280]">
        <span>ขนาดโลโก้</span>
        <span className="font-mono text-[#9ca3af]">{Math.round(style.logoSize * 100)}%</span>
      </div>
      <input type="range" min={10} max={45} value={Math.round(style.logoSize * 100)} onChange={(e) => patch({ logoSize: +e.target.value / 100 })} className="w-full" />

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

// Drag-and-drop / click file picker.
function Dropzone({ onLogoFile, label }: { onLogoFile: (f: File) => void; label?: ReactNode }) {
  const [drag, setDrag] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  function pick(files: FileList | null) {
    const f = files?.[0]
    if (f && f.type.startsWith('image/')) onLogoFile(f)
  }
  return (
    <label
      onDragOver={(e) => {
        e.preventDefault()
        setDrag(true)
      }}
      onDragLeave={() => setDrag(false)}
      onDrop={(e) => {
        e.preventDefault()
        setDrag(false)
        pick(e.dataTransfer.files)
      }}
      className={
        'flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-[16px] border-[1.5px] border-dashed px-4 py-7 text-center transition ' +
        (drag ? 'border-[#7c3aed] bg-[#ede9fe]/60' : 'border-[#d8dae2] bg-[#fafbfd] hover:border-[#c4b5fd] hover:bg-[#faf8ff]')
      }
    >
      <span className="grid h-10 w-10 place-items-center rounded-full bg-[#ede9fe] text-[#7c3aed]">
        <UploadIcon size={19} />
      </span>
      <span className="mt-1 text-[13.5px] font-bold text-[#374151]">
        {label ?? (
          <>
            ลากรูปมาวาง <span className="text-[#7c3aed]">หรือคลิกเลือก</span>
          </>
        )}
      </span>
      <span className="text-[11.5px] text-[#9ca3af]">PNG · JPG · SVG · WEBP</span>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          pick(e.target.files)
          e.target.value = ''
        }}
      />
    </label>
  )
}

export function LogoUploader({
  style,
  patch,
  onLogoFile,
  onRemoveLogo,
  type,
}: {
  style: StyleSettings
  patch: (p: Partial<StyleSettings>) => void
  onLogoFile: (f: File) => void
  onRemoveLogo: () => void
  type: QRType
}) {
  const hasLogo = !!style.logo
  const presetUrl = presetLogoUrl(type)

  // 1) Custom upload present — overrides any preset.
  if (hasLogo) {
    return (
      <div>
        <SectionLabel>โลโก้กลาง QR</SectionLabel>
        <div className="mb-4 flex items-center gap-3">
          <img src={style.logo!} alt="logo" className="h-14 w-14 rounded-[12px] border border-[#e6e7ee] bg-white object-contain p-1.5" />
          <div className="min-w-0 flex-1">
            <div className="text-[13px] font-bold text-[#111827]">โลโก้ถูกฝังแล้ว</div>
            <div className="text-[11.5px] text-[#9ca3af]">ระดับ EC ถูกตั้งเป็น H อัตโนมัติเพื่อความชัด</div>
          </div>
          <button
            onClick={onRemoveLogo}
            className="flex items-center gap-1.5 rounded-[11px] border border-[#fbd5d5] bg-[#fef2f2] px-3 py-2 text-[12.5px] font-bold text-[#ef4444] transition hover:bg-[#fee2e2]"
          >
            <TrashIcon size={14} />
            ลบ
          </button>
        </div>
        <LogoControls style={style} patch={patch} />
      </div>
    )
  }

  // 2) No custom upload, but this type has a preset — show the toggle.
  if (presetUrl && hasPreset(type)) {
    return (
      <div>
        <SectionLabel>โลโก้กลาง QR (ไม่บังคับ)</SectionLabel>
        <label className="mb-4 flex cursor-pointer items-center gap-3">
          <Toggle on={style.presetLogo} onChange={(v) => patch({ presetLogo: v })} />
          <span className="text-[13.5px] font-bold text-[#374151]">ใช้โลโก้ประจำชนิด</span>
        </label>

        {style.presetLogo ? (
          <>
            <div className="mb-4 flex items-center gap-3">
              <img src={presetUrl} alt="preset logo" className="h-14 w-14 rounded-[12px] border border-[#e6e7ee] bg-white object-contain p-1.5" />
              <div className="min-w-0 flex-1 text-[11.5px] text-[#9ca3af]">โลโก้ประจำชนิดถูกฝังไว้ · อัปโหลดรูปเองด้านล่างเพื่อใช้แทน</div>
            </div>
            <LogoControls style={style} patch={patch} />
            <div className="mt-4">
              <Dropzone onLogoFile={onLogoFile} label="อัปโหลดโลโก้เองแทน" />
            </div>
          </>
        ) : (
          <Dropzone onLogoFile={onLogoFile} />
        )}
      </div>
    )
  }

  // 3) No preset for this type — plain dropzone (unchanged behaviour).
  return (
    <div>
      <SectionLabel>โลโก้กลาง QR (ไม่บังคับ)</SectionLabel>
      <Dropzone onLogoFile={onLogoFile} />
    </div>
  )
}
