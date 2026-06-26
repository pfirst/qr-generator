import { useState } from 'react'
import { EXPORT_SIZES } from '../constants'
import type { ExportFormat } from '../core/export'
import type { ScanLevel } from '../core/verify'
import { Card, SectionHead } from '../ui/surfaces'
import { CheckIcon, CopyIcon, DownloadIcon, PrintIcon, ScanIcon, WarnIcon } from '../ui/icons'

type Tone = ScanLevel | 'pending' | 'idle'
const TONE: Record<Tone, { c: string; bg: string }> = {
  ok: { c: '#22c55e', bg: '#ecfdf3' },
  warn: { c: '#f59e0b', bg: '#fffaf0' },
  risk: { c: '#ef4444', bg: '#fef2f2' },
  pending: { c: '#9ca3af', bg: '#f3f4f8' },
  idle: { c: '#9ca3af', bg: '#f3f4f8' },
}

function StatusRow({ tone, label, sub }: { tone: Tone; label: string; sub: string }) {
  const t = TONE[tone]
  return (
    <div className="flex items-center gap-3">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full" style={{ background: t.bg, color: t.c }}>
        {tone === 'ok' ? <CheckIcon size={17} /> : tone === 'pending' || tone === 'idle' ? <ScanIcon size={16} /> : <WarnIcon size={16} />}
      </span>
      <div className="min-w-0">
        <div className="text-[13.5px] font-bold text-[#111827]">{label}</div>
        <div className="text-[12px]" style={{ color: t.c }}>
          {sub}
        </div>
      </div>
    </div>
  )
}

const FORMATS: { id: ExportFormat; label: string }[] = [
  { id: 'png', label: 'PNG' },
  { id: 'svg', label: 'SVG' },
  { id: 'jpg', label: 'JPG' },
  { id: 'webp', label: 'WEBP' },
  { id: 'pdf', label: 'PDF' },
]

export function CheckExport({
  ready,
  contrastLevel,
  scanOk,
  warn,
  exportSize,
  setExportSize,
  onDownload,
  onCopy,
  onPrint,
  onTestScan,
}: {
  ready: boolean
  contrastLevel: ScanLevel
  scanOk: boolean | null
  warn: string | null
  exportSize: number
  setExportSize: (n: number) => void
  onDownload: (fmt: ExportFormat) => void
  onCopy: () => void
  onPrint: () => void
  onTestScan: () => void
}) {
  const [fmt, setFmt] = useState<ExportFormat>('png')

  const contrastTone: Tone = !ready ? 'idle' : contrastLevel
  const contrastSub = !ready ? 'รอข้อมูล' : contrastLevel === 'ok' ? 'ความต่างสีคมชัดดี' : contrastLevel === 'warn' ? 'ควรเพิ่มความต่างของสี' : 'ความต่างสีต่ำเกินไป'
  const scanTone: Tone = !ready ? 'idle' : scanOk === null ? 'pending' : scanOk ? 'ok' : 'risk'
  const scanSub = !ready ? 'รอข้อมูล' : scanOk === null ? 'กำลังตรวจสอบ…' : scanOk ? 'ยืนยันสแกนได้จริง' : 'ตรวจแล้วสแกนไม่ติด'

  return (
    <Card className="p-5 sm:p-6">
      <SectionHead n={3} title="ตรวจสอบ & ส่งออก" />

      {/* check */}
      <div className="rounded-[16px] border border-[#eef0f5] bg-[#fafbfd] p-4">
        <div className="mb-3 flex items-center justify-between">
          <div className="text-[12.5px] font-extrabold uppercase tracking-[0.06em] text-[#9ca3af]">ตรวจสอบความพร้อม</div>
          <button
            onClick={onTestScan}
            disabled={!ready}
            className="flex items-center gap-1.5 rounded-[10px] border border-[#e6e7ee] bg-white px-3 py-1.5 text-[12px] font-bold text-[#6b7280] transition enabled:hover:border-[#c4b5fd] enabled:hover:text-[#7c3aed] disabled:opacity-50"
          >
            <ScanIcon size={14} />
            ทดสอบสแกน
          </button>
        </div>
        <div className="grid gap-3.5 sm:grid-cols-2">
          <StatusRow tone={contrastTone} label="ความเปรียบต่างสี" sub={contrastSub} />
          <StatusRow tone={scanTone} label="สแกนได้จริง" sub={scanSub} />
        </div>
        {warn && (
          <div className="mt-3.5 flex items-start gap-2 rounded-[12px] border border-[#fdebc8] bg-[#fffaf0] px-3 py-2.5">
            <WarnIcon size={14} className="mt-px shrink-0 text-[#f59e0b]" />
            <span className="text-[11.5px] leading-[1.5] text-[#92733a]">{warn}</span>
          </div>
        )}
      </div>

      {/* export */}
      <div className="mt-5">
        <div className="mb-2.5 flex flex-wrap items-center gap-3">
          <span className="text-[12.5px] font-bold text-[#6b7280]">ขนาดไฟล์</span>
          <div className="relative">
            <select
              value={exportSize}
              onChange={(e) => setExportSize(+e.target.value)}
              className="cursor-pointer appearance-none rounded-[11px] border border-[#e6e7ee] bg-white py-2 pl-3.5 pr-9 text-[13px] font-bold text-[#111827] outline-none focus:border-[#7c3aed]"
            >
              {EXPORT_SIZES.map((s) => (
                <option key={s} value={s}>
                  {s} × {s} px
                </option>
              ))}
            </select>
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#9ca3af]">▾</span>
          </div>
        </div>

        <div className="mb-3 grid grid-cols-5 gap-2">
          {FORMATS.map((f) => {
            const on = fmt === f.id
            return (
              <button
                key={f.id}
                onClick={() => setFmt(f.id)}
                className={
                  'cursor-pointer rounded-[11px] border py-2.5 text-[12.5px] font-bold transition ' +
                  (on ? 'border-[#7c3aed] bg-[#ede9fe] text-[#7c3aed]' : 'border-[#e6e7ee] bg-white text-[#6b7280] hover:border-[#c4b5fd]')
                }
              >
                {f.label}
              </button>
            )
          })}
        </div>

        <button
          onClick={() => onDownload(fmt)}
          disabled={!ready}
          className="flex w-full items-center justify-center gap-2 rounded-[14px] py-3.5 text-[14.5px] font-extrabold text-white transition disabled:cursor-not-allowed disabled:opacity-50"
          style={{ backgroundImage: 'var(--grad-brand)', boxShadow: 'var(--shadow-accent)' }}
        >
          <DownloadIcon size={17} />
          ดาวน์โหลด {fmt.toUpperCase()}
        </button>
        <div className="mt-2.5 grid grid-cols-2 gap-2.5">
          <button
            onClick={onCopy}
            disabled={!ready}
            className="flex items-center justify-center gap-1.5 rounded-[13px] border border-[#e6e7ee] bg-white px-3 py-3 text-[13.5px] font-bold text-[#374151] transition enabled:hover:border-[#c4b5fd] enabled:hover:text-[#7c3aed] disabled:opacity-50"
          >
            <CopyIcon size={15} />
            คัดลอกไปคลิปบอร์ด
          </button>
          <button
            onClick={onPrint}
            disabled={!ready}
            className="flex items-center justify-center gap-1.5 rounded-[13px] border border-[#e6e7ee] bg-white px-3 py-3 text-[13.5px] font-bold text-[#374151] transition enabled:hover:border-[#c4b5fd] enabled:hover:text-[#7c3aed] disabled:opacity-50"
          >
            <PrintIcon size={15} />
            พิมพ์
          </button>
        </div>
      </div>
    </Card>
  )
}
