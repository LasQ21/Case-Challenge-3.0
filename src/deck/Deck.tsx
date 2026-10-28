import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { S1, S2, S3, S4, S5, S6 } from './slides'

const SLIDES = [S1, S2, S3, S4, S5, S6]

const W = 1920
const H = 1080

// Номер слайда в адресі (#3), щоб можна було відкрити дек одразу на потрібному місці
const fromHash = () => {
  const n = Number(window.location.hash.slice(1))
  return Number.isInteger(n) && n >= 1 && n <= SLIDES.length ? n - 1 : 0
}

export default function Deck() {
  const [index, setIndex] = useState(fromHash)
  const [scale, setScale] = useState(1)
  const stageRef = useRef<HTMLDivElement>(null)

  const go = useCallback((to: number) => {
    setIndex((cur) => {
      const next = Math.max(0, Math.min(SLIDES.length - 1, to))
      if (next !== cur) history.replaceState(null, '', `#${next + 1}`)
      return next
    })
  }, [])

  useLayoutEffect(() => {
    const fit = () => setScale(Math.min(window.innerWidth / W, window.innerHeight / H))
    fit()
    window.addEventListener('resize', fit)
    return () => window.removeEventListener('resize', fit)
  }, [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return
      if (['ArrowRight', 'ArrowDown', 'PageDown', ' ', 'Enter'].includes(e.key)) {
        e.preventDefault()
        go(index + 1)
      } else if (['ArrowLeft', 'ArrowUp', 'PageUp', 'Backspace'].includes(e.key)) {
        e.preventDefault()
        go(index - 1)
      } else if (e.key === 'Home') go(0)
      else if (e.key === 'End') go(SLIDES.length - 1)
      else if (e.key === 'f' || e.key === 'F') toggleFullscreen()
      else if (/^[1-9]$/.test(e.key)) go(Number(e.key) - 1)
    }
    const onHash = () => setIndex(fromHash())
    window.addEventListener('keydown', onKey)
    window.addEventListener('hashchange', onHash)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('hashchange', onHash)
    }
  }, [go, index])

  // Клік по правій частині — вперед, по лівій — назад (як у пульті)
  const onStageClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('a, button')) return
    const rect = stageRef.current!.getBoundingClientRect()
    go(e.clientX - rect.left > rect.width * 0.3 ? index + 1 : index - 1)
  }

  return (
    <div className="deck-viewport">
      <div
        ref={stageRef}
        className="deck-stage"
        style={{ transform: `translate(-50%, -50%) scale(${scale})` }}
        onClick={onStageClick}
      >
        {SLIDES.map((Slide, i) => (
          <section
            key={i}
            className={`slide ${i === index ? 'is-active' : ''}`}
            aria-hidden={i !== index}
            aria-roledescription="слайд"
            aria-label={`${i + 1} з ${SLIDES.length}`}
          >
            <Slide n={i + 1} total={SLIDES.length} />
          </section>
        ))}
      </div>

      <nav className="deck-controls" aria-label="Навігація презентацією">
        <button type="button" onClick={() => go(index - 1)} disabled={index === 0} aria-label="Попередній слайд">
          ‹
        </button>
        <span className="num" aria-live="polite">
          {index + 1} / {SLIDES.length}
        </span>
        <button
          type="button"
          onClick={() => go(index + 1)}
          disabled={index === SLIDES.length - 1}
          aria-label="Наступний слайд"
        >
          ›
        </button>
        <button type="button" onClick={toggleFullscreen} aria-label="На весь екран (F)" title="На весь екран (F)">
          ⛶
        </button>
        <a href="./" title="Інтерактивна модель">
          Exit Simulator
        </a>
      </nav>
    </div>
  )
}

function toggleFullscreen() {
  if (document.fullscreenElement) void document.exitFullscreen()
  else void document.documentElement.requestFullscreen().catch(() => undefined)
}
