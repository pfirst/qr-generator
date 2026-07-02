import { TYPES } from '../constants'
import type { QRType } from '../core/types'
import { TypeIcon } from '../ui/icons'
import { GLASS_BTN, GLASS_BTN_ON } from '../ui/controls'

function Chip({ id, label, active, onPick }: { id: QRType; label: string; active: boolean; onPick: (t: QRType) => void }) {
  return (
    <button
      onClick={() => onPick(id)}
      className={
        'flex items-center gap-2 rounded-[13px] px-3.5 py-2.5 text-[13px] font-bold transition ' +
        (active
          ? `${GLASS_BTN_ON} text-[#7c3aed]`
          : `${GLASS_BTN} text-[#6b7280] hover:border-[#c4b5fd] hover:text-[#111827]`)
      }
    >
      <TypeIcon type={id} size={16} />
      {label}
    </button>
  )
}

export function TypeChips({ type, onPick }: { type: QRType; onPick: (t: QRType) => void }) {
  const basic = TYPES.filter((t) => t.group === 'basic')
  const pay = TYPES.filter((t) => t.group === 'pay')
  return (
    <div>
      <div className="flex flex-wrap gap-2.5">
        {basic.map((t) => (
          <Chip key={t.id} id={t.id} label={t.label} active={type === t.id} onPick={onPick} />
        ))}
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2.5">
        <span className="mr-0.5 text-[10.5px] font-extrabold uppercase tracking-[0.08em] text-[#b0b4c0]">ชำระเงินไทย</span>
        {pay.map((t) => (
          <Chip key={t.id} id={t.id} label={t.label} active={type === t.id} onPick={onPick} />
        ))}
      </div>
    </div>
  )
}
