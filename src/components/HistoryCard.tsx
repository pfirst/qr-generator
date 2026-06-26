import { useMemo, useRef } from 'react'
import { createMatrix } from '../core/qr'
import { buildPayload } from '../core/payloads'
import { renderSVG } from '../core/renderer'
import { defaultStyle } from '../core/types'
import type { RecentItem } from '../recent'
import { Card, SectionHead } from '../ui/surfaces'
import { ChevronLeftIcon, ChevronRightIcon } from '../ui/icons'

const THUMB = { ...defaultStyle(), fg: '#111827', bg: '#ffffff', gradient: 'none' as const, bodyShape: 'square' as const, eyeFrameShape: 'square' as const, eyeballShape: 'square' as const, logo: null, frameOn: false, margin: 2 }

function thumbSvg(item: RecentItem): string | null {
  try {
    const payload = buildPayload(item.type, item.data)
    if (!payload) return null
    const matrix = createMatrix(payload, 'M')
    return renderSVG(matrix, THUMB, 116).svg
  } catch {
    return null
  }
}

function fmtDate(ts: number): string {
  const d = new Date(ts)
  const day = d.toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })
  const time = d.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })
  return `${day} · ${time}`
}

export function HistoryCard({ recent, onLoad, onClear }: { recent: RecentItem[]; onLoad: (r: RecentItem) => void; onClear: () => void }) {
  const scroller = useRef<HTMLDivElement>(null)
  const thumbs = useMemo(() => recent.map(thumbSvg), [recent])
  const scroll = (dir: -1 | 1) => scroller.current?.scrollBy({ left: dir * 280, behavior: 'smooth' })

  return (
    <Card className="p-5 sm:p-6">
      <SectionHead
        n={4}
        title="ประวัติ QR"
        sub="เก็บในเครื่องนี้"
        right={
          recent.length > 0 ? (
            <div className="flex items-center gap-1">
              <button onClick={() => scroll(-1)} className="grid h-8 w-8 place-items-center rounded-full border border-[#e6e7ee] bg-white text-[#9ca3af] transition hover:text-[#7c3aed]">
                <ChevronLeftIcon size={16} />
              </button>
              <button onClick={() => scroll(1)} className="grid h-8 w-8 place-items-center rounded-full border border-[#e6e7ee] bg-white text-[#9ca3af] transition hover:text-[#7c3aed]">
                <ChevronRightIcon size={16} />
              </button>
              <button onClick={onClear} className="ml-1 rounded-md px-2 py-1 text-[12px] font-bold text-[#9ca3af] transition hover:text-[#ef4444]">
                ล้าง
              </button>
            </div>
          ) : undefined
        }
      />

      {recent.length === 0 ? (
        <div className="rounded-[16px] border border-dashed border-[#dcdee8] bg-[#fafbfd] px-6 py-8 text-center text-[13px] leading-[1.6] text-[#9ca3af]">
          ยังไม่มีประวัติ — QR ที่ดาวน์โหลดหรือคัดลอกจะมาเก็บไว้ที่นี่
        </div>
      ) : (
        <div ref={scroller} className="flex gap-3 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {recent.map((r, i) => (
            <button
              key={r.id}
              onClick={() => onLoad(r)}
              className="group flex w-[128px] shrink-0 flex-col gap-2 rounded-[16px] border border-[#eef0f5] bg-white p-2.5 text-left transition hover:border-[#c4b5fd] hover:shadow-[0_6px_20px_rgba(124,58,237,0.12)]"
            >
              <div className="aspect-square overflow-hidden rounded-[11px] border border-[#f0f1f6] bg-white p-1.5 leading-[0]">
                {thumbs[i] ? (
                  <div dangerouslySetInnerHTML={{ __html: thumbs[i]! }} />
                ) : (
                  <div className="h-full w-full rounded-md bg-[#f3f4f8]" />
                )}
              </div>
              <div className="px-0.5">
                <div className="flex items-center gap-1.5">
                  <span className="rounded-[6px] px-1.5 py-0.5 text-[9.5px] font-extrabold text-white" style={{ backgroundImage: 'var(--grad-brand)' }}>
                    {r.typeLabel}
                  </span>
                </div>
                <div className="mt-1 truncate text-[12px] font-bold text-[#374151]">{r.preview}</div>
                <div className="mt-0.5 text-[10.5px] text-[#9ca3af]">{fmtDate(r.id)}</div>
              </div>
            </button>
          ))}
        </div>
      )}
    </Card>
  )
}
