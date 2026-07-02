import type { ComponentType, CSSProperties, ReactNode } from 'react'
import type { BodyShape, EyeballShape, EyeFrameShape } from '../core/types'
import { SHAPE_GLYPHS, type GlyphKind } from './shapeGlyphs'

// Blue-violet → purple → lavender → light blue (pixel-matched to reference button #11).
export const ACCENT_GRAD = 'linear-gradient(100deg,#6c4af9 0%,#744ff8 15%,#8559f8 30%,#9d65fc 50%,#ae71fc 70%,#a089fc 85%,#8ea0fc 96%,#7eaefd 100%)'

// ACCENT_GRAD for SMALL squares (toolbar tabs, SegGroup, toggle, badges): on tiny elements
// the gradient's blue tail (96–100%) compresses into a ~2px strip that reads as a colour
// "cut" at the right edge. Enlarging the background and centring it samples the smooth
// middle band instead; wide elements (download button, header) keep the full sweep.
export const ACCENT_GRAD_SMALL: CSSProperties = {
  backgroundImage: ACCENT_GRAD,
  backgroundSize: '280% 100%',
  backgroundPosition: 'center',
}

// iOS-material frosted glass for every floating surface (popovers + toast). Recipe
// pixel-measured from an iMessage reference (white tint + heavy backdrop blur + saturation
// boost). Single source of truth — tune the frost here and all glass surfaces follow.
// `glass-lit` = mouse-following specular highlight (ui/glassLight.ts + index.css). It needs
// the element to be positioned: GLASS_BTN carries `relative` (all button consumers are
// static); GLASS_POPOVER consumers are already absolute/fixed — except the settings panel,
// which adds `relative` itself.
export const GLASS_POPOVER = 'glass-lit bg-white/60 backdrop-blur-[20px] backdrop-saturate-[1.8]'

// Glass-look buttons. Buttons mostly sit on white cards where backdrop-filter has nothing
// to blur, so the glass reads through styling instead: a translucent vertical-gradient fill,
// an inset top highlight (the glass edge catching light — the key cue), a translucent border,
// and a soft lift shadow. Single source of truth like GLASS_POPOVER.
export const GLASS_BTN =
  'relative glass-lit border border-white/70 bg-gradient-to-b from-white/85 to-[#eef0f8]/60 shadow-[0_2px_8px_rgba(17,24,39,0.07),inset_0_1px_0_rgba(255,255,255,0.95)] backdrop-blur-[8px]'
// selected state for light-purple (tinted) actives — same recipe, purple glass
export const GLASS_BTN_ON =
  'relative glass-lit border border-[#7c3aed]/60 bg-gradient-to-b from-[#ede9fe]/85 to-[#e2d9fd]/60 shadow-[0_2px_10px_rgba(124,58,237,0.16),inset_0_1px_0_rgba(255,255,255,0.85)] backdrop-blur-[8px]'
// brand-gradient actives keep ACCENT_GRAD; this shadow adds the inset top highlight so the
// solid purple reads as tinted glass instead of flat plastic
export const GLASS_ACTIVE_SHADOW = 'shadow-[0_4px_14px_rgba(124,58,237,0.32),inset_0_1px_0_rgba(255,255,255,0.38)]'

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
  type?: string
  error?: string
  inputMode?: 'text' | 'decimal' | 'numeric'
}

export function Field({ label, value, onChange, placeholder, type, error, inputMode }: FieldProps) {
  return (
    <div>
      <Label>{label}</Label>
      <input
        type={type ?? 'text'}
        value={value}
        inputMode={inputMode}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={inputCls}
      />
      {error && <ErrorText>{error}</ErrorText>}
    </div>
  )
}

// Native <select> styled to match the text inputs. Best fit for long option
// lists (e.g. the social-platform picker) — scrollable + type-to-search for free.
export function Select<T extends string>({
  label,
  value,
  onChange,
  options,
}: {
  label?: string
  value: T
  onChange: (v: T) => void
  options: readonly { id: T; label: string }[]
}) {
  return (
    <div>
      {label && <Label>{label}</Label>}
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value as T)}
          className={inputCls + ' cursor-pointer appearance-none pr-10'}
        >
          {options.map((o) => (
            <option key={o.id} value={o.id}>
              {o.label}
            </option>
          ))}
        </select>
        <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-[#9ca3af]">
          <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <path d="m6 9 6 6 6-6" />
          </svg>
        </span>
      </div>
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
  // When present, the button shows this icon only (label becomes the tooltip).
  Icon?: ComponentType<{ size?: number }>
}
export function SegGroup<T extends string>({
  options,
  value,
  onChange,
  disabledIds,
}: {
  options: readonly SegOption<T>[]
  value: T
  onChange: (v: T) => void
  // Options rendered in a locked/disabled style (dimmed, not-clickable). The current
  // `value` still shows as active even if listed here.
  disabledIds?: readonly T[]
}) {
  return (
    <div className="flex gap-2">
      {options.map((o) => {
        const on = o.id === value
        const disabled = !on && !!disabledIds?.includes(o.id)
        return (
          <button
            key={o.id}
            onClick={() => !disabled && onChange(o.id)}
            disabled={disabled}
            aria-disabled={disabled}
            title={o.Icon ? o.label : undefined}
            className={
              'relative flex flex-1 items-center justify-center whitespace-nowrap rounded-[11px] px-1.5 py-2.5 text-center text-[13px] font-bold transition ' +
              (on
                ? `glass-lit border border-transparent text-white ${GLASS_ACTIVE_SHADOW}`
                : disabled
                  ? 'cursor-not-allowed border border-[#eef0f5] bg-[#f7f8fb]/70 text-[#c7cbd6]'
                  : `${GLASS_BTN} text-[#6b7280] hover:border-[#c4b5fd] hover:text-[#111827]`)
            }
            style={on ? ACCENT_GRAD_SMALL : undefined}
          >
            {o.Icon ? <o.Icon size={20} /> : o.label}
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
      style={on ? { ...ACCENT_GRAD_SMALL, boxShadow: '0 3px 10px rgba(124,58,237,0.4)' } : { background: '#d8dae2' }}
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

// Dropdown glyphs are Figma's exact picker glyphs (see shapeGlyphs.ts); rendered
// with currentColor so each takes its row's text colour.
function ShapeGlyph({ kind, id }: { kind: GlyphKind; id: string }) {
  const inner = SHAPE_GLYPHS[kind][id]
  if (!inner) return null
  return <svg width={20} height={20} viewBox="0 0 24 24" fill="none" dangerouslySetInnerHTML={{ __html: inner }} />
}

type ShapeGridProps =
  | { kind: 'body'; options: { id: BodyShape; label: string }[]; value: BodyShape; onChange: (v: BodyShape) => void }
  | { kind: 'frame'; options: { id: EyeFrameShape; label: string }[]; value: EyeFrameShape; onChange: (v: EyeFrameShape) => void }
  | { kind: 'ball'; options: { id: EyeballShape; label: string }[]; value: EyeballShape; onChange: (v: EyeballShape) => void }

// Dropdown shape picker (Figma glyphs); selected row uses the app's purple chip
// style (same as the active export-format button).
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
              'flex items-center gap-3 whitespace-nowrap rounded-[12px] px-3.5 py-2.5 text-left text-[14.5px] font-bold transition ' +
              (on ? `${GLASS_BTN_ON} text-[#7c3aed]` : 'border border-transparent text-[#6b7280] hover:bg-white/60')
            }
          >
            <span className={'grid h-6 w-6 shrink-0 place-items-center ' + (on ? 'text-[#7c3aed]' : 'text-[#6b7280]')}>
              <ShapeGlyph kind={kind} id={o.id} />
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
        <div className="text-[13px] font-bold text-[#6b7280]">{label}</div>
        <div className="font-mono text-[11px] uppercase text-[#9ca3af]">{value}</div>
      </div>
    </div>
  )
}
