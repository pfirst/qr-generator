import { CheckIcon } from '../ui/icons'
import { GLASS_POPOVER } from '../ui/controls'

export function Toast({ message }: { message: string }) {
  // transform: translateX(-50%) centres the toast in its resting state — `left-1/2` only
  // pins the left edge to centre. The toastIn keyframes override transform while animating,
  // then revert to this, so it stays centred instead of snapping right when the anim ends.
  return (
    <div
      className={`fixed bottom-7 left-1/2 z-[90] flex items-center gap-2.5 rounded-[14px] border border-[#eaecf2] ${GLASS_POPOVER} px-5 py-3 text-[14px] font-bold text-[#111827]`}
      style={{ transform: 'translateX(-50%)', boxShadow: '0 16px 44px rgba(17,24,39,0.16)', animation: 'toastIn .28s cubic-bezier(.2,.9,.3,1.3)' }}
    >
      <span className="flex h-[22px] w-[22px] items-center justify-center rounded-full" style={{ background: 'linear-gradient(135deg,#22c55e,#16a34a)' }}>
        <CheckIcon size={13} className="text-white" />
      </span>
      {message}
    </div>
  )
}
