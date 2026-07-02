import { useState, type ReactNode } from 'react'
import type { FieldData, QRType, StyleSettings } from '../core/types'
import { hasPreset, presetLogoUrl } from '../core/logoPreset'
import { SectionLabel, Toggle } from '../ui/controls'
import { TrashIcon, UploadIcon } from '../ui/icons'

// The logo *styling* controls (size / backing / shape / thickness / colour) now live in
// QrPanel's "โลโก้" toolbar tab (src/components/LogoSettings.tsx). This card only handles
// adding / removing / swapping the logo.

// Drag-and-drop / click file picker.
function Dropzone({ onLogoFile, label }: { onLogoFile: (f: File) => void; label?: ReactNode }) {
  const [drag, setDrag] = useState(false)
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
  data,
}: {
  style: StyleSettings
  patch: (p: Partial<StyleSettings>) => void
  onLogoFile: (f: File) => void
  onRemoveLogo: () => void
  type: QRType
  data: FieldData
}) {
  const hasLogo = !!style.logo
  const presetUrl = presetLogoUrl(type, data.social.platform, style) // promptpay/bill ignore the platform

  // 1) Custom upload present — overrides any preset.
  if (hasLogo) {
    return (
      <div>
        <SectionLabel>โลโก้กลาง QR</SectionLabel>
        <div className="mb-4 flex items-center gap-3">
          <img src={style.logo!} alt="logo" className="h-14 w-14 rounded-[12px] border border-[#e6e7ee] bg-white object-contain p-1.5" />
          <div className="min-w-0 flex-1">
            <div className="text-[13px] font-bold text-[#111827]">โลโก้ถูกฝังแล้ว</div>
            <div className="text-[11.5px] text-[#9ca3af]">ระดับ EC ตั้งเป็น H อัตโนมัติ · ปรับขนาด/พื้นหลังได้ที่แถบ "โลโก้" ในพรีวิว</div>
          </div>
          <button
            onClick={onRemoveLogo}
            className="flex items-center gap-1.5 rounded-[11px] border border-[#fbd5d5]/80 bg-gradient-to-b from-[#fef2f2]/90 to-[#fde4e4]/60 px-3 py-2 text-[12.5px] font-bold text-[#ef4444] shadow-[0_2px_8px_rgba(239,68,68,0.10),inset_0_1px_0_rgba(255,255,255,0.9)] transition hover:border-[#ef4444]/50"
          >
            <TrashIcon size={14} />
            ลบ
          </button>
        </div>
      </div>
    )
  }

  // 2) No custom upload, but this type has a preset — show the toggle.
  if (hasPreset(type)) {
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
              <img src={presetUrl!} alt="preset logo" className="h-14 w-14 rounded-[12px] border border-[#e6e7ee] bg-white object-contain p-1.5" />
              <div className="min-w-0 flex-1 text-[11.5px] text-[#9ca3af]">โลโก้ประจำชนิดถูกฝังไว้ · ปรับแต่งได้ที่แถบ "โลโก้" ในพรีวิว · อัปโหลดรูปเองด้านล่างเพื่อใช้แทน</div>
            </div>
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
