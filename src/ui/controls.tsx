import type { ReactNode } from 'react'
import { bodyModulePath, eyeballPath, eyeFramePath } from '../core/shapes'
import type { BodyShape, EyeballShape, EyeFrameShape } from '../core/types'

// Blue-violet → purple → lavender → light blue (pixel-matched to reference button #11).
export const ACCENT_GRAD = 'linear-gradient(100deg,#6c4af9 0%,#744ff8 15%,#8559f8 30%,#9d65fc 50%,#ae71fc 70%,#a089fc 85%,#8ea0fc 96%,#7eaefd 100%)'

const inputCls =
  'w-full rounded-[13px] border border-[#e6e7ee] bg-white px-3.5 py-3 text-[14px] text-[#111827] outline-none transition placeholder:text-[#9ca3af] focus:border-[#7c3aed] focus:shadow-[0_0_0_3px_rgba(124,58,237,0.14)]'

export function Label({ children }: { children: ReactNode }) {
  return <label className="mb-[7px] block text-[12.5px] font-bold text-[#6b7280]">{children}</label>
}

export function SectionLabel({ children }: { children: ReactNode }) {
  return <div className="mb-2.5 text-[12.5px] font-bold text-[#6b7280]">{children}</div>
}

export function ErrorText({ children }: { children: ReactNode }) {
  return <div className="mt-[7px] text-[12px] text-[#ef4444]">{children}</div>
}

interface FieldProps {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  mono?: boolean
  type?: string
  error?: string
  inputMode?: 'text' | 'decimal' | 'numeric'
}

export function Field({ label, value, onChange, placeholder, mono, type, error, inputMode }: FieldProps) {
  return (
    <div>
      <Label>{label}</Label>
      <input
        type={type ?? 'text'}
        value={value}
        inputMode={inputMode}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={inputCls + (mono ? ' font-mono tracking-[0.3px]' : '')}
      />
      {error && <ErrorText>{error}</ErrorText>}
    </div>
  )
}

export function TextArea({
  label,
  value,
  onChange,
  placeholder,
  rows = 4,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  rows?: number
}) {
  return (
    <div>
      <Label>{label}</Label>
      <textarea
        value={value}
        rows={rows}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={inputCls + ' resize-y leading-[1.55]'}
      />
    </div>
  )
}

interface SegOption<T extends string> {
  id: T
  label: string
}
export function SegGroup<T extends string>({
  options,
  value,
  onChange,
}: {
  options: readonly SegOption<T>[]
  value: T
  onChange: (v: T) => void
}) {
  return (
    <div className="flex gap-2">
      {options.map((o) => {
        const on = o.id === value
        return (
          <button
            key={o.id}
            onClick={() => onChange(o.id)}
            className={
              'flex-1 cursor-pointer whitespace-nowrap rounded-[11px] px-1.5 py-2.5 text-center text-[13px] font-bold transition ' +
              (on
                ? 'border border-transparent text-white shadow-[0_4px_14px_rgba(124,58,237,0.32)]'
                : 'border border-[#e6e7ee] bg-white text-[#6b7280] hover:border-[#c4b5fd] hover:text-[#111827]')
            }
            style={on ? { backgroundImage: ACCENT_GRAD } : undefined}
          >
            {o.label}
          </button>
        )
      })}
    </div>
  )
}

export function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!on)}
      className="relative h-[25px] w-11 shrink-0 cursor-pointer rounded-[20px] border-none p-0 transition"
      style={on ? { backgroundImage: ACCENT_GRAD, boxShadow: '0 3px 10px rgba(124,58,237,0.4)' } : { background: '#d8dae2' }}
      role="switch"
      aria-checked={on}
    >
      <span
        className="absolute top-[3px] h-[19px] w-[19px] rounded-full bg-white shadow-[0_1px_3px_rgba(17,24,39,0.3)] transition-all"
        style={{ left: on ? 22 : 3 }}
      />
    </button>
  )
}

// --- shape glyph (renders the real shape from the core renderer) ---
function ShapeGlyph({ kind, id }: { kind: 'body'; id: BodyShape } | { kind: 'frame'; id: EyeFrameShape } | { kind: 'ball'; id: EyeballShape }) {
  if (kind === 'body') {
    return (
      <svg viewBox="-0.12 -0.12 1.24 1.24" width="18" height="18">
        <path d={bodyModulePath(id, 0, 0)} fill="currentColor" />
      </svg>
    )
  }
  if (kind === 'frame') {
    const f = eyeFramePath(id, 0, 0)
    return (
      <svg viewBox="-0.3 -0.3 7.6 7.6" width="20" height="20">
        <path d={f.d} fill="none" stroke="currentColor" strokeWidth={f.strokeWidth} />
      </svg>
    )
  }
  return (
    <svg viewBox="0 0 7 7" width="20" height="20">
      <path d={eyeballPath(id, 0, 0)} fill="currentColor" />
    </svg>
  )
}

type ShapeGridProps =
  | { kind: 'body'; options: { id: BodyShape; label: string }[]; value: BodyShape; onChange: (v: BodyShape) => void }
  | { kind: 'frame'; options: { id: EyeFrameShape; label: string }[]; value: EyeFrameShape; onChange: (v: EyeFrameShape) => void }
  | { kind: 'ball'; options: { id: EyeballShape; label: string }[]; value: EyeballShape; onChange: (v: EyeballShape) => void }

export function ShapeGrid(props: ShapeGridProps) {
  const { kind, options, value } = props
  return (
    <div className="grid grid-cols-5 gap-2">
      {options.map((o) => {
        const on = o.id === value
        return (
          <button
            key={o.id}
            title={o.label}
            onClick={() => (props.onChange as (v: string) => void)(o.id)}
            className={
              'flex aspect-square cursor-pointer flex-col items-center justify-center gap-1 rounded-[11px] border text-[9px] transition ' +
              (on
                ? 'border-[#7c3aed] bg-[#ede9fe] text-[#7c3aed]'
                : 'border-[#e6e7ee] bg-white text-[#9ca3af] hover:border-[#c4b5fd] hover:text-[#6b7280]')
            }
          >
            <ShapeGlyph kind={kind} id={o.id as never} />
            <span className="leading-none">{o.label}</span>
          </button>
        )
      })}
    </div>
  )
}

// Dropdown-menu style shape picker (icon + label rows, dark-highlight selected).
export function ShapeMenu(props: ShapeGridProps) {
  const { kind, options, value } = props
  return (
    <div className="flex flex-col gap-1">
      {options.map((o) => {
        const on = o.id === value
        return (
          <button
            key={o.id}
            onClick={() => (props.onChange as (v: string) => void)(o.id)}
            className={
              'flex items-center gap-3 whitespace-nowrap rounded-[14px] px-4 py-3 text-left text-[15px] font-bold transition ' +
              (on ? 'bg-[#15161c] text-white' : 'text-[#374151] hover:bg-[#f3f4f8]')
            }
          >
            <span className={'grid h-7 w-7 shrink-0 place-items-center ' + (on ? 'text-white' : 'text-[#15161c]')}>
              <ShapeGlyph kind={kind} id={o.id as never} />
            </span>
            {o.label}
          </button>
        )
      })}
    </div>
  )
}

export function ColorRow({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (v: string) => void
}) {
  return (
    <div className="flex items-center gap-2.5">
      <input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-[38px] w-11 cursor-pointer rounded-[10px] border border-[#e6e7ee] bg-white p-1"
      />
      <div>
        <div className="text-[13px] font-bold text-[#111827]">{label}</div>
        <div className="font-mono text-[11px] uppercase text-[#9ca3af]">{value}</div>
      </div>
    </div>
  )
}
