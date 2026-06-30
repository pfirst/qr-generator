import type { FieldData, QRType, StyleSettings } from '../core/types'
import type { FieldErrors } from '../core/validate'
import { Card, SectionHead } from '../ui/surfaces'
import { GridIcon } from '../ui/icons'
import { TypeChips } from './TypeChips'
import { FormFields } from './FormFields'
import { LogoUploader } from './LogoUploader'

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
}) {
  return (
    <Card className="p-5 sm:p-6">
      <SectionHead icon={<GridIcon size={20} />} title="เลือกประเภทข้อมูล" />
      <TypeChips type={type} onPick={onPickType} />

      <div className="my-5 h-px bg-[#eef0f5]" />
      <FormFields type={type} data={data} errors={errors} setData={setData} setIn={setIn} />

      <div className="my-5 h-px bg-[#eef0f5]" />
      <LogoUploader style={style} patch={patchStyle} onLogoFile={onLogoFile} onRemoveLogo={onRemoveLogo} type={type} />
    </Card>
  )
}
