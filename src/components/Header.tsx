import { LogoMark } from './Logo'
import { HistoryPopover } from './HistoryPopover'
import type { RecentItem } from '../recent'

export function Header({ recent, onLoad, onClear }: { recent: RecentItem[]; onLoad: (r: RecentItem) => void; onClear: () => void }) {
  return (
    <header className="mb-6 flex items-center gap-3.5 sm:mb-7">
      <LogoMark size={50} />
      <div className="min-w-0">
        <h1 className="text-[22px] font-extrabold leading-none tracking-[-0.02em] text-[#111827] sm:text-[25px]">QR Code Generator</h1>
        <p className="mt-2 text-[13px] text-[#6b7280] sm:text-[13.5px]">สร้าง QR Code สวย ๆ ปรับแต่งได้ครบ ใช้งานฟรี — ทุกอย่างทำในเครื่องคุณ</p>
      </div>
      <HistoryPopover recent={recent} onLoad={onLoad} onClear={onClear} />
    </header>
  )
}
