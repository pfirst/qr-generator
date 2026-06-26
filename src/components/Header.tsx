import { LogoMark } from './Logo'
import { ShieldIcon } from '../ui/icons'

export function Header() {
  return (
    <header className="mb-6 flex items-center gap-3.5 sm:mb-7">
      <LogoMark size={50} />
      <div className="min-w-0">
        <h1 className="text-[22px] font-extrabold leading-none tracking-[-0.02em] text-[#111827] sm:text-[25px]">QR Code Generator</h1>
        <p className="mt-2 text-[13px] text-[#6b7280] sm:text-[13.5px]">สร้าง QR Code สวย ๆ ปรับแต่งได้ครบ ใช้งานฟรี — ทุกอย่างทำในเครื่องคุณ</p>
      </div>
      <div className="ml-auto hidden items-center gap-2 rounded-full border border-[#e6e7ee] bg-white/70 px-3.5 py-2 backdrop-blur md:flex">
        <ShieldIcon size={15} className="text-[#22c55e]" />
        <span className="text-[12.5px] font-bold text-[#6b7280]">ข้อมูลไม่ออกจากเครื่อง</span>
      </div>
    </header>
  )
}
