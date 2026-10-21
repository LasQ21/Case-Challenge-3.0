import { useState } from 'react'

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
  const [theme, setTheme] = useState<Theme>(() =>
    document.documentElement.classList.contains('dark') ? 'dark' : (readStored() ?? 'light'),
  )
  const next: Theme = theme === 'dark' ? 'light' : 'dark'
  const toggle = () => {
    document.documentElement.classList.toggle('dark', next === 'dark')
    try {
      localStorage.setItem('theme', next)
    } catch {
      // приватний режим — тема просто не запам'ятається
    }
    setTheme(next)
  }
  return (
    <button
      type="button"
      onClick={toggle}
      className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg border border-line bg-surface text-ink"
      aria-label={next === 'dark' ? 'Увімкнути темну тему' : 'Увімкнути світлу тему'}
      title={next === 'dark' ? 'Темна тема' : 'Світла тема'}
    >
      <span aria-hidden>{theme === 'dark' ? '☀' : '☾'}</span>
    </button>
  )
}
