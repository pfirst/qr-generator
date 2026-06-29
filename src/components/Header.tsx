import { LogoMark } from './Logo'
import { HistoryPopover } from './HistoryPopover'
import type { RecentItem } from '../recent'

export function Header({ recent, onLoad, onClear }: { recent: RecentItem[]; onLoad: (r: RecentItem) => void; onClear: () => void }) {
  return (
    <header className="mb-6 flex items-center gap-3.5 sm:mb-7">
      <span className="block shrink-0 leading-none" style={{ transform: 'translateY(-1.4px)' }}>
        <LogoMark size={48} />
      </span>
      <div className="min-w-0">
        <h1 className="text-[22px] font-extrabold leading-none tracking-[-0.02em] text-[#111827] sm:text-[25px]">
          <span className="bg-clip-text text-transparent" style={{ backgroundImage: 'var(--grad-brand)' }}>QR Code</span> Generator
        </h1>
        <p className="mt-2 text-[13px] text-[#6b7280] sm:text-[13.5px]">สร้าง QR Code ได้ง่าย รวดเร็ว และพร้อมใช้งานทันที</p>
      </div>
      <HistoryPopover recent={recent} onLoad={onLoad} onClear={onClear} />
    </header>
  )
}
