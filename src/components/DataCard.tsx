import type { FieldData, QRType, StyleSettings } from '../core/types'
import type { FieldErrors } from '../core/validate'
import { Card, SectionHead } from '../ui/surfaces'
import { GridIcon, ScanQrIcon } from '../ui/icons'
import { GLASS_BTN } from '../ui/controls'
import { TypeChips } from './TypeChips'
import { FormFields } from './FormFields'
import { LogoUploader } from './LogoUploader'

// "Clone an existing QR": upload-only entry point — picks an image file and
// hands it to App to decode + route. Styled like a small header action but it
// is a <label> wrapping a hidden file input (same idiom as LogoUploader).
function ImportChip({ onFile }: { onFile: (f: File) => void }) {
  return (
    <label
      className={`flex cursor-pointer items-center gap-1.5 rounded-[11px] px-3 py-2 text-[12.5px] font-bold transition ${GLASS_BTN} text-[#7c3aed] hover:border-[#c4b5fd]`}
    >
      <ScanQrIcon size={15} />
      อ่านจากรูป QR
      <input
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0]
          if (f) onFile(f)
          e.target.value = ''
        }}
      />
    </label>
  )
}

export function DataCard({
  type,
  onPickType,
  data,
  errors,
  setData,
  setIn,
  style,
  patchStyle,
  onLogoFile,
  onRemoveLogo,
  onImportFile,
}: {
  type: QRType
  onPickType: (t: QRType) => void
  data: FieldData
  errors: FieldErrors
  setData: (partial: Partial<FieldData>) => void
  setIn: <K extends keyof FieldData>(key: K, value: FieldData[K]) => void
  style: StyleSettings
  patchStyle: (p: Partial<StyleSettings>) => void
  onLogoFile: (f: File) => void
  onRemoveLogo: () => void
  onImportFile: (f: File) => void
}) {
  return (
    <Card className="p-5 sm:p-6">
      <SectionHead icon={<GridIcon size={20} />} title="เลือกประเภทข้อมูล" right={<ImportChip onFile={onImportFile} />} />
      <TypeChips type={type} onPick={onPickType} />

      <div className="my-5 h-px bg-[#eef0f5]" />
      <FormFields type={type} data={data} errors={errors} setData={setData} setIn={setIn} />

      <div className="my-5 h-px bg-[#eef0f5]" />
      <LogoUploader style={style} patch={patchStyle} onLogoFile={onLogoFile} onRemoveLogo={onRemoveLogo} type={type} data={data} />
    </Card>
  )
}
