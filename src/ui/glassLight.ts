// Mouse-following specular highlight for glass surfaces.
//
// One document-level mousemove listener. Any element carrying the `glass-lit` marker
// class (baked into the GLASS_* recipes in controls.tsx) gets its `--mx` / `--my` CSS
// vars updated while hovered; index.css paints the light as a radial-gradient ::before
// that fades in on :hover. Nested glass (a button inside a glass popover) updates the
// whole ancestor chain so the popover's light tracks too.
//
// Throttled by timestamp instead of requestAnimationFrame on purpose: rAF pauses in
// occluded/background tabs, which silently freezes the light. The per-event work
// (closest + rect + two setProperty) is cheap enough to run at pointer rate.
export function initGlassLight(): () => void {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return () => {}

  let lastT = 0
  const onMove = (e: MouseEvent) => {
    const now = performance.now()
    if (now - lastT < 16) return
    lastT = now
    let el = (e.target as Element | null)?.closest?.('.glass-lit') as HTMLElement | null
    while (el) {
      const r = el.getBoundingClientRect()
      el.style.setProperty('--mx', `${(((e.clientX - r.left) / r.width) * 100).toFixed(2)}%`)
      el.style.setProperty('--my', `${(((e.clientY - r.top) / r.height) * 100).toFixed(2)}%`)
      el = el.parentElement?.closest('.glass-lit') as HTMLElement | null
    }
  }

  document.addEventListener('mousemove', onMove, { passive: true })
  return () => document.removeEventListener('mousemove', onMove)
}
