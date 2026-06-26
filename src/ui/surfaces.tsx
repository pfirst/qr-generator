import type { CSSProperties, ReactNode } from 'react'

// Glass card — translucent white, hairline border, soft layered shadow.
export function Card({ children, className = '', style }: { children: ReactNode; className?: string; style?: CSSProperties }) {
  return (
    <div
      className={'rounded-[24px] border border-[#eef0f5] bg-white/75 backdrop-blur-xl ' + className}
      style={{ boxShadow: 'var(--shadow-card)', ...style }}
    >
      {children}
    </div>
  )
}

// Numbered section heading: "① เลือกประเภทข้อมูล  · sub".
export function SectionHead({ n, title, sub, right }: { n: number; title: string; sub?: string; right?: ReactNode }) {
  return (
    <div className="mb-5 flex items-center gap-2.5">
      <span
        className="grid h-7 w-7 shrink-0 place-items-center rounded-[9px] text-[13px] font-extrabold text-white"
        style={{ backgroundImage: 'var(--grad-brand)', boxShadow: '0 4px 12px rgba(124,58,237,0.32)' }}
      >
        {n}
      </span>
      <h2 className="text-[16px] font-extrabold tracking-[-0.01em] text-[#111827]">{title}</h2>
      {sub && <span className="text-[12.5px] text-[#9ca3af]">{sub}</span>}
      {right && <div className="ml-auto">{right}</div>}
    </div>
  )
}
