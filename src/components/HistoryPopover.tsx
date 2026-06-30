import { useEffect, useRef, useState } from 'react'
import { createMatrix } from '../core/qr'
import { buildPayload } from '../core/payloads'
import { renderQrSvg } from '../core/render'
import type { RecentItem } from '../recent'
import { HistoryIcon, TrashIcon } from '../ui/icons'

async function thumbSvg(item: RecentItem): Promise<string | null> {
  try {
    const payload = buildPayload(item.type, item.data)
    if (!payload) return null
    // Render the saved appearance, but drop the CTA frame (illegible at 46px) and
    // tighten the quiet zone so the QR fills the thumbnail.
    const ecc = item.style.logo ? 'H' : item.style.ecc
    const st = { ...item.style, frameStyle: 'none' as const, size: 116, margin: 2 }
    const matrix = createMatrix(payload, ecc)
    return await renderQrSvg(payload, ecc, st, 116, matrix.size)
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

export function HistoryPopover({ recent, onLoad, onClear }: { recent: RecentItem[]; onLoad: (r: RecentItem) => void; onClear: () => void }) {
  const wrap = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)
  const [thumbs, setThumbs] = useState<(string | null)[]>([])

  // Render thumbnails only while the popover is open (lazy — no work when closed).
  useEffect(() => {
    if (!open) return
    let cancelled = false
    Promise.all(recent.map(thumbSvg)).then((t) => !cancelled && setThumbs(t))
    return () => {
      cancelled = true
    }
  }, [open, recent])

  // Close on outside click + Escape.
  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (wrap.current && !wrap.current.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <div ref={wrap} className="relative ml-auto">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="true"
        aria-expanded={open}
        className={
          'inline-flex items-center gap-2 rounded-full border px-3 py-2 backdrop-blur transition ' +
          (open ? 'border-[#7c3aed] bg-[#ede9fe]' : 'border-[#e6e7ee] bg-white/70 hover:border-[#c4b5fd]')
        }
      >
        <span className="text-[#7c3aed]">
          <HistoryIcon size={18} />
        </span>
        {recent.length > 0 && (
          <span className="grid h-5 min-w-[20px] place-items-center rounded-full px-1.5 text-[11px] font-extrabold leading-none text-white" style={{ backgroundImage: 'var(--grad-brand)' }}>
            {recent.length}
          </span>
        )}
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-[calc(100%+10px)] z-50 w-[328px] max-w-[calc(100vw-2rem)] overflow-hidden rounded-[20px] border border-[#eef0f5] bg-white"
          style={{ boxShadow: 'var(--shadow-pop)', transformOrigin: 'top right', animation: 'popIn .16s cubic-bezier(.22,.9,.3,1) both' }}
        >
          <div className="flex items-center justify-between border-b border-[#eef0f5] px-3.5 py-3">
            <div className="flex items-center gap-2.5">
              <span className="text-[#7c3aed]">
                <HistoryIcon size={19} />
              </span>
              <span className="text-[14px] font-extrabold tracking-[-0.01em] text-[#111827]">ประวัติ</span>
            </div>
            {recent.length > 0 && (
              <button onClick={onClear} title="ล้างประวัติ" className="grid h-[30px] w-[30px] place-items-center rounded-[9px] text-[#9ca3af] transition hover:bg-[#fdecec] hover:text-[#ef4444]">
                <TrashIcon size={17} />
              </button>
            )}
          </div>

          <div className="flex max-h-[344px] flex-col gap-[3px] overflow-y-auto p-[7px]">
            {recent.length === 0 ? (
              <div className="m-[9px] rounded-[16px] border border-dashed border-[#dcdee8] bg-[#fafbfd] px-5 py-7 text-center text-[13px] leading-[1.6] text-[#9ca3af]">
                ยังไม่มีประวัติ — QR ที่ดาวน์โหลดหรือคัดลอกจะมาเก็บไว้ที่นี่
              </div>
            ) : (
              recent.map((r, i) => (
                <button
                  key={r.id}
                  onClick={() => {
                    onLoad(r)
                    setOpen(false)
                  }}
                  className="flex w-full items-center gap-3 rounded-[14px] border border-transparent p-2 text-left transition hover:border-[#eef0f5] hover:bg-[#f7f7fb]"
                >
                  <div className="h-[46px] w-[46px] shrink-0 overflow-hidden rounded-[11px] border border-[#f0f1f6] bg-white p-[5px] leading-[0]">
                    {thumbs[i] ? (
                      <div className="h-full w-full [&>svg]:block [&>svg]:h-full [&>svg]:w-full" dangerouslySetInnerHTML={{ __html: thumbs[i]! }} />
                    ) : (
                      <div className="h-full w-full rounded bg-[#f3f4f8]" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="inline-block rounded-[6px] px-1.5 py-0.5 text-[9.5px] font-extrabold text-white" style={{ backgroundImage: 'var(--grad-brand)' }}>
                      {r.typeLabel}
                    </span>
                    <div className="mt-1 truncate text-[12.5px] font-bold text-[#374151]">{r.preview}</div>
                    <div className="mt-0.5 text-[10.5px] text-[#9ca3af]">{fmtDate(r.id)}</div>
                  </div>
                </button>
              ))
            )}
          </div>

          {recent.length > 0 && (
            <div className="border-t border-[#eef0f5] px-3.5 py-2 text-center text-[11px] text-[#9ca3af]">
              เก็บอัตโนมัติ 6 รายการล่าสุด
            </div>
          )}
        </div>
      )}
    </div>
  )
}
