import { useRef, useState } from 'react'
import type { LogoBg, StyleSettings } from '../core/types'
import { SectionLabel, SegGroup } from '../ui/controls'
import { TrashIcon, UploadIcon } from '../ui/icons'

const LOGO_BGS: { id: LogoBg; label: string }[] = [
  { id: 'none', label: 'ไม่มี' },
  { id: 'square', label: 'สี่เหลี่ยม' },
  { id: 'rounded', label: 'มน' },
  { id: 'circle', label: 'วงกลม' },
]

export function LogoUploader({
  style,
  patch,
  onLogoFile,
}: {
  style: StyleSettings
  patch: (p: Partial<StyleSettings>) => void
  onLogoFile: (f: File) => void
}) {
  const [drag, setDrag] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const hasLogo = !!style.logo

  function pick(files: FileList | null) {
    const f = files?.[0]
    if (f && f.type.startsWith('image/')) onLogoFile(f)
  }

  if (!hasLogo) {
    return (
      <div>
        <SectionLabel>โลโก้กลาง QR (ไม่บังคับ)</SectionLabel>
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
            ลากรูปมาวาง <span className="text-[#7c3aed]">หรือคลิกเลือก</span>
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
      </div>
    )
  }

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
          onClick={() => patch({ logo: null })}
          className="flex items-center gap-1.5 rounded-[11px] border border-[#fbd5d5] bg-[#fef2f2] px-3 py-2 text-[12.5px] font-bold text-[#ef4444] transition hover:bg-[#fee2e2]"
        >
          <TrashIcon size={14} />
          ลบ
        </button>
      </div>

      <div className="mb-1.5 flex justify-between text-[12.5px] font-bold text-[#6b7280]">
        <span>ขนาดโลโก้</span>
        <span className="font-mono text-[#9ca3af]">{Math.round(style.logoSize * 100)}%</span>
      </div>
      <input type="range" min={10} max={45} value={Math.round(style.logoSize * 100)} onChange={(e) => patch({ logoSize: +e.target.value / 100 })} className="w-full" />

      <div className="mt-4">
        <SectionLabel>พื้นหลังโลโก้</SectionLabel>
        <SegGroup options={LOGO_BGS} value={style.logoBg} onChange={(v) => patch({ logoBg: v })} />
      </div>
    </div>
  )
}
