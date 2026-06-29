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

// Section heading with a plain brand-purple icon: "▦ เลือกประเภทข้อมูล  · sub".
export function SectionHead({ icon, title, sub, right }: { icon: ReactNode; title: string; sub?: string; right?: ReactNode }) {
  return (
    <div className="mb-5 flex items-center gap-2.5">
      <span className="shrink-0 text-[#7c3aed]">{icon}</span>
      <h2 className="text-[16px] font-extrabold tracking-[-0.01em] text-[#111827]">{title}</h2>
      {sub && <span className="text-[12.5px] text-[#9ca3af]">{sub}</span>}
      {right && <div className="ml-auto">{right}</div>}
    </div>
  )
}
