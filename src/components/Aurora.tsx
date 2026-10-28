import { useEffect } from 'react'

// Жива аврора за склом + SVG-фільтр заломлення для «рідкого скла».
// Один слухач курсора на всю сторінку: паралакс фону і прожектор на скельці під курсором.
export function Aurora() {
  useEffect(() => {
    const html = document.documentElement
    // url() у backdrop-filter поки вміє лише Chromium; Safari/Firefox лишаються на звичайному блюрі
    const ua = (navigator as Navigator & { userAgentData?: { brands: { brand: string }[] } }).userAgentData
    if (ua?.brands.some((b) => b.brand === 'Chromium')) html.classList.add('lg-refract')

    let raf = 0
    const onMove = (e: PointerEvent) => {
      if (raf) return
      raf = requestAnimationFrame(() => {
        raf = 0
        html.style.setProperty('--px', ((e.clientX / innerWidth) * 2 - 1).toFixed(3))
        html.style.setProperty('--py', ((e.clientY / innerHeight) * 2 - 1).toFixed(3))
        const el = (e.target as Element | null)?.closest?.<HTMLElement>('.glass')
        if (!el) return
        const r = el.getBoundingClientRect()
        const x = e.clientX - r.left
        const y = e.clientY - r.top
        el.style.setProperty('--mx', `${x}px`)
        el.style.setProperty('--my', `${y}px`)
        // обідок «ловить» світло з боку курсора
        el.style.setProperty('--rim-angle', `${(Math.atan2(y - r.height / 2, x - r.width / 2) * 180) / Math.PI + 90}deg`)
      })
    }
    addEventListener('pointermove', onMove, { passive: true })
    return () => {
      removeEventListener('pointermove', onMove)
      cancelAnimationFrame(raf)
    }
  }, [])

  return (
    <>
      <div className="aurora" aria-hidden>
        <div className="layer">
          <div className="blob b1" />
          <div className="blob b2" />
          <div className="blob b3" />
          <div className="blob b4" />
        </div>
        <div className="grid" />
        <div className="grain" />
      </div>
      <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden>
        <filter id="liquid-glass" x="0%" y="0%" width="100%" height="100%" colorInterpolationFilters="sRGB">
          <feTurbulence type="fractalNoise" baseFrequency="0.008 0.012" numOctaves="2" seed="7" result="noise" />
          <feGaussianBlur in="noise" stdDeviation="2" result="soft" />
          <feDisplacementMap in="SourceGraphic" in2="soft" scale="70" xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </svg>
    </>
  )
}
