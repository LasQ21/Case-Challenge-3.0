import { useRef, useState } from 'react'
import { flushSync } from 'react-dom'

type Theme = 'light' | 'dark'

function readStored(): Theme | null {
  try {
    const t = localStorage.getItem('theme')
    return t === 'light' || t === 'dark' ? t : null
  } catch {
    return null
  }
}

export function ThemeToggle() {
  const ref = useRef<HTMLButtonElement>(null)
  const [theme, setTheme] = useState<Theme>(() =>
    document.documentElement.classList.contains('dark') ? 'dark' : (readStored() ?? 'light'),
  )
  const next: Theme = theme === 'dark' ? 'light' : 'dark'

  const apply = () => {
    document.documentElement.classList.toggle('dark', next === 'dark')
    try {
      localStorage.setItem('theme', next)
    } catch {
      // приватний режим — тема просто не запам'ятається
    }
    flushSync(() => setTheme(next))
  }

  // Нова тема розливається колом від кнопки
  const toggle = () => {
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches
    if (!document.startViewTransition || reduce) return apply()
    const r = ref.current!.getBoundingClientRect()
    const x = r.left + r.width / 2
    const y = r.top + r.height / 2
    const root = document.documentElement.style
    root.setProperty('--vx', `${x}px`)
    root.setProperty('--vy', `${y}px`)
    root.setProperty('--vr', `${Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y))}px`)
    document.startViewTransition(apply)
  }

  const dark = theme === 'dark'
  return (
    <button
      ref={ref}
      type="button"
      onClick={toggle}
      className="btn glass glass-refract pill inline-flex h-12 w-12 items-center justify-center text-ink"
      aria-label={next === 'dark' ? 'Увімкнути темну тему' : 'Увімкнути світлу тему'}
      title={next === 'dark' ? 'Темна тема' : 'Світла тема'}
    >
      {/* Сонце, що «з'їдається» місяцем */}
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        aria-hidden
        className="transition-transform duration-700 [transition-timing-function:cubic-bezier(.3,1.5,.5,1)]"
        style={{ transform: dark ? 'rotate(40deg)' : 'rotate(90deg)' }}
      >
        <mask id="moon-cut">
          <rect width="24" height="24" fill="white" />
          <circle
            cx={dark ? 17 : 30}
            cy={dark ? 7 : 0}
            r="7"
            fill="black"
            style={{ transition: 'cx .6s cubic-bezier(.3,1.5,.5,1), cy .6s cubic-bezier(.3,1.5,.5,1)' }}
          />
        </mask>
        <circle
          cx="12"
          cy="12"
          r={dark ? 8 : 5}
          fill="currentColor"
          mask="url(#moon-cut)"
          style={{ transition: 'r .6s cubic-bezier(.3,1.5,.5,1)' }}
        />
        <g
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          style={{
            opacity: dark ? 0 : 1,
            transform: dark ? 'scale(.4)' : 'scale(1)',
            transformOrigin: 'center',
            transition: 'all .5s cubic-bezier(.3,1.5,.5,1)',
          }}
        >
          {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => (
            <line key={a} x1="12" y1="1.5" x2="12" y2="3.5" transform={`rotate(${a} 12 12)`} />
          ))}
        </g>
      </svg>
    </button>
  )
}
