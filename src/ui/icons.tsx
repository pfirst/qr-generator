import type { ReactNode } from 'react'
import type { QRType } from '../core/types'

interface IconProps {
  size?: number
  className?: string
}

// Generic stroked-icon wrapper (feather/lucide style).
function Svg({ size = 18, className, children }: IconProps & { children: ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {children}
    </svg>
  )
}

export const TYPE_ICON: Record<QRType, ReactNode> = {
  url: (
    <>
      <path d="M10 13a5 5 0 0 0 7.07 0l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.07 0l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </>
  ),
  text: <path d="M17 6.1H3M21 12.1H3M15.1 18H3" />,
  email: (
    <>
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </>
  ),
  sms: <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" />,
  tel: <path d="M13.83 19.5a17.9 17.9 0 0 1-7.83-7.83 2 2 0 0 1 .4-2.2l1.4-1.4a1.5 1.5 0 0 0 .3-1.6L7 3.5A1.5 1.5 0 0 0 5.6 2.6H3.1A1.5 1.5 0 0 0 1.6 4.3 16.9 16.9 0 0 0 19.7 22.4a1.5 1.5 0 0 0 1.7-1.5v-2.5a1.5 1.5 0 0 0-.9-1.4l-2.97-1.27a1.5 1.5 0 0 0-1.6.3l-1.4 1.4Z" />,
  wifi: (
    <>
      <path d="M5 12.55a11 11 0 0 1 14 0M1.42 9a16 16 0 0 1 21.16 0M8.53 16.11a6 6 0 0 1 6.95 0" />
      <line x1="12" y1="20" x2="12.01" y2="20" />
    </>
  ),
  vcard: (
    <>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
    </>
  ),
  geo: (
    <>
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
      <circle cx="12" cy="10" r="3" />
    </>
  ),
  social: (
    <>
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <path d="m8.6 13.5 6.8 4M15.4 6.5l-6.8 4" />
    </>
  ),
  promptpay: (
    <>
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <path d="M14 14h3v3M21 21v.01M17 21h-3v-3M21 14v3" />
    </>
  ),
  bill: (
    <>
      <path d="M4 2v20l2-1.5L8 22l2-1.5L12 22l2-1.5L16 22l2-1.5L20 22V2l-2 1.5L16 2l-2 1.5L12 2l-2 1.5L8 2 6 3.5 4 2Z" />
      <path d="M8 7h8M8 11h8M8 15h5" />
    </>
  ),
}

export function TypeIcon({ type, size }: { type: QRType; size?: number }) {
  return <Svg size={size}>{TYPE_ICON[type]}</Svg>
}

export const DownloadIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
  </Svg>
)
export const CopyIcon = (p: IconProps) => (
  <Svg {...p}>
    <rect x="9" y="9" width="13" height="13" rx="2" />
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
  </Svg>
)
export const PrintIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
    <rect x="6" y="14" width="12" height="8" rx="1" />
  </Svg>
)
export const UploadIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" />
  </Svg>
)
export const SettingsIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M12 20a8 8 0 1 0 0-16 8 8 0 0 0 0 16Z" />
    <path d="M12 2v2M12 20v2M2 12h2M20 12h2" />
    <circle cx="12" cy="12" r="3" />
  </Svg>
)
export const ChevronIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="m6 9 6 6 6-6" />
  </Svg>
)
export const ShieldIcon = (p: IconProps) => (
  <Svg {...p}>
    <rect x="3" y="11" width="18" height="11" rx="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </Svg>
)
export const CheckIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M20 6 9 17l-5-5" />
  </Svg>
)
export const WarnIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
    <path d="M12 9v4M12 17h.01" />
  </Svg>
)
export const TrashIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
  </Svg>
)
// Counter-clockwise rotate — "reset to default" (feather rotate-ccw).
export const ResetIcon = (p: IconProps) => (
  <Svg {...p}>
    <polyline points="1 4 1 10 7 10" />
    <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
  </Svg>
)

export const PaletteIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M12 2a10 10 0 0 0 0 20 2.5 2.5 0 0 0 2.5-2.5c0-.7-.3-1.3-.7-1.7-.4-.4-.7-1-.7-1.6a2 2 0 0 1 2-2H17a5 5 0 0 0 5-5c0-4.4-4.5-7.2-10-7.2Z" />
    <circle cx="7.5" cy="10.5" r="1.2" fill="currentColor" stroke="none" />
    <circle cx="12" cy="7.5" r="1.2" fill="currentColor" stroke="none" />
    <circle cx="16.5" cy="10.5" r="1.2" fill="currentColor" stroke="none" />
  </Svg>
)
export const EyeIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
    <circle cx="12" cy="12" r="3" />
  </Svg>
)
export const DotsGridIcon = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="6" cy="6" r="1.3" fill="currentColor" stroke="none" />
    <circle cx="12" cy="6" r="1.3" fill="currentColor" stroke="none" />
    <circle cx="18" cy="6" r="1.3" fill="currentColor" stroke="none" />
    <circle cx="6" cy="12" r="1.3" fill="currentColor" stroke="none" />
    <circle cx="12" cy="12" r="1.3" fill="currentColor" stroke="none" />
    <circle cx="18" cy="12" r="1.3" fill="currentColor" stroke="none" />
    <circle cx="6" cy="18" r="1.3" fill="currentColor" stroke="none" />
    <circle cx="12" cy="18" r="1.3" fill="currentColor" stroke="none" />
    <circle cx="18" cy="18" r="1.3" fill="currentColor" stroke="none" />
  </Svg>
)
export const FrameIcon = (p: IconProps) => (
  <Svg {...p}>
    <rect x="3" y="3" width="18" height="18" rx="3" />
    <rect x="8" y="15" width="8" height="3" rx="1" fill="currentColor" stroke="none" />
  </Svg>
)
// Marker-border (กรอบตา) and marker-center (จุดตา) keep the app's rounded
// style. Only the cells icon (จุด) is lifted from Figma, per request.
export const MarkerBorderIcon = (p: IconProps) => (
  <Svg {...p}>
    <rect x="4" y="4" width="16" height="16" rx="3" />
  </Svg>
)
export const MarkerCenterIcon = (p: IconProps) => (
  <Svg {...p}>
    <rect x="5" y="5" width="14" height="14" rx="3" fill="currentColor" stroke="none" />
  </Svg>
)
// Cells (จุด): Figma's exact pixel-grid glyph.
export const CellsIcon = ({ size = 18, className }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <path
      fill="currentColor"
      d="M9 3h3v3H9zM9 6h3v3H9zM6 6h3v3H6zM6 9h3v3H6zM3 3h3v3H3zM15 18h3v3h-3zM18 15h3v3h-3zM9 18h3v3H9zM9 15h3v3H9zM6 15h3v3H6zM3 18h3v3H3zM3 12h3v3H3zM9 9h3v3H9zM12 9h3v3h-3zM15 9h3v3h-3zM15 12h3v3h-3zM18 9h3v3h-3zM12 3h3v3h-3zM18 3h3v3h-3zM15 6h3v3h-3z"
    />
  </svg>
)
export const SlidersIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6" />
  </Svg>
)
export const ScanIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2" />
    <path d="M3 12h18" />
  </Svg>
)
// 2×2 grid — "เลือกประเภทข้อมูล" section heading.
export const GridIcon = (p: IconProps) => (
  <Svg {...p}>
    <rect x="3" y="3" width="7" height="7" rx="1.5" />
    <rect x="14" y="3" width="7" height="7" rx="1.5" />
    <rect x="3" y="14" width="7" height="7" rx="1.5" />
    <rect x="14" y="14" width="7" height="7" rx="1.5" />
  </Svg>
)
// Clock + rewind arrow — "ประวัติ QR" section heading.
export const HistoryIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
    <path d="M3 3v5h5" />
    <path d="M12 7v5l3 2" />
  </Svg>
)
export const ChevronLeftIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="m15 18-6-6 6-6" />
  </Svg>
)
export const ChevronRightIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="m9 18 6-6-6-6" />
  </Svg>
)
export const CloseIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M18 6 6 18M6 6l12 12" />
  </Svg>
)

// Gradient-direction symbols (SVG, not text glyphs).
export const GradNoneIcon = (p: IconProps) => (
  <Svg {...p}>
    <rect x="4" y="4" width="16" height="16" rx="3" />
    <path d="M5 19 19 5" />
  </Svg>
)
export const GradLinearIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M5 5 18 18" />
    <path d="M18 11v7h-7" />
  </Svg>
)
export const GradDiagonalIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M5 19 18 6" />
    <path d="M11 6h7v7" />
  </Svg>
)
export const GradRadialIcon = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="8" />
    <circle cx="12" cy="12" r="3" />
  </Svg>
)
