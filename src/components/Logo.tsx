// Brand mark — squircle whose gradient is pixel-matched to the reference logo:
// blue/periwinkle across the top, purple body, magenta glow bottom-centre,
// light-mauve sheen bottom-right (base linear + 5 radial layers; avg ΔRGB ~15).
export function LogoMark({ size = 44, radius }: { size?: number; radius?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" aria-hidden style={radius != null ? { borderRadius: radius } : undefined}>
      <defs>
        <linearGradient id="lg-base" x1="0" y1="0" x2="19.2" y2="64" gradientUnits="userSpaceOnUse">
          <stop stopColor="#8085fb" />
          <stop offset="0.5" stopColor="#7b62f3" />
          <stop offset="1" stopColor="#8a5cf1" />
        </linearGradient>
        <radialGradient id="lg-blue" cx="28.8" cy="2.56" r="38.4" gradientUnits="userSpaceOnUse">
          <stop stopColor="#666cfd" stopOpacity="0.66" />
          <stop offset="1" stopColor="#666cfd" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="lg-sheen" cx="11.52" cy="6.4" r="25.6" gradientUnits="userSpaceOnUse">
          <stop stopColor="#aab9fa" stopOpacity="0.55" />
          <stop offset="1" stopColor="#aab9fa" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="lg-peri" cx="63.36" cy="30.08" r="23.68" gradientUnits="userSpaceOnUse">
          <stop stopColor="#8498f8" stopOpacity="0.88" />
          <stop offset="1" stopColor="#8498f8" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="lg-magenta" cx="32" cy="63.36" r="20.48" gradientUnits="userSpaceOnUse">
          <stop stopColor="#ea67e8" stopOpacity="0.98" />
          <stop offset="1" stopColor="#ea67e8" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="lg-mauve" cx="54.4" cy="55.04" r="28.16" gradientUnits="userSpaceOnUse">
          <stop stopColor="#eacecb" stopOpacity="0.92" />
          <stop offset="1" stopColor="#eacecb" stopOpacity="0" />
        </radialGradient>
      </defs>
      <g>
        <rect x="2" y="2" width="60" height="60" rx="17" fill="url(#lg-base)" />
        <rect x="2" y="2" width="60" height="60" rx="17" fill="url(#lg-blue)" />
        <rect x="2" y="2" width="60" height="60" rx="17" fill="url(#lg-sheen)" />
        <rect x="2" y="2" width="60" height="60" rx="17" fill="url(#lg-peri)" />
        <rect x="2" y="2" width="60" height="60" rx="17" fill="url(#lg-magenta)" />
        <rect x="2" y="2" width="60" height="60" rx="17" fill="url(#lg-mauve)" />
      </g>
      <rect x="2.5" y="2.5" width="59" height="59" rx="16.5" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="1" />

      {/* white QR glyph — three rounded finders + data modules */}
      <g fill="none" stroke="#fff" strokeWidth="3.4">
        <rect x="15" y="15" width="13" height="13" rx="3.5" />
        <rect x="36" y="15" width="13" height="13" rx="3.5" />
        <rect x="15" y="36" width="13" height="13" rx="3.5" />
      </g>
      <g fill="#fff">
        <rect x="19.5" y="19.5" width="4" height="4" rx="1.2" />
        <rect x="40.5" y="19.5" width="4" height="4" rx="1.2" />
        <rect x="19.5" y="40.5" width="4" height="4" rx="1.2" />
        <rect x="36" y="36" width="4.6" height="4.6" rx="1.4" />
        <rect x="44.4" y="36" width="4.6" height="4.6" rx="1.4" />
        <rect x="36" y="44.4" width="4.6" height="4.6" rx="1.4" />
        <rect x="44.4" y="44.4" width="4.6" height="4.6" rx="1.4" />
      </g>
    </svg>
  )
}
