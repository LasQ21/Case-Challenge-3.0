import { lazy, Suspense, useState } from 'react'
import { DISCLAIMER } from './model/config'
import type { TabId } from './lib/urlState'
import { AppStateProvider } from './state/AppStateProvider'
import { useAppState } from './state/context'
import { Button } from './components/ui'
import { ThemeToggle } from './components/ThemeToggle'
import DecisionPage from './pages/DecisionPage'

// Вкладки з графіками вантажаться окремо — перше відображення лишається легким
const ScenariosPage = lazy(() => import('./pages/ScenariosPage'))
const RisksPage = lazy(() => import('./pages/RisksPage'))
const CapitalPage = lazy(() => import('./pages/CapitalPage'))
const AboutPage = lazy(() => import('./pages/AboutPage'))
const ShareDialog = lazy(() => import('./components/ShareDialog'))

const TABS: { id: TabId; label: string }[] = [
  { id: 'decision', label: 'Рішення' },
  { id: 'scenarios', label: 'Сценарії' },
  { id: 'risks', label: 'Ризики' },
  { id: 'capital', label: '$15m' },
  { id: 'about', label: 'Про модель' },
]

function Shell() {
  const { state, setTab, reset, isDefault } = useAppState()
  const [sharing, setSharing] = useState(false)

  return (
    <div className="mx-auto flex min-h-dvh max-w-5xl flex-col">
      <header className="px-4 pt-4 sm:px-6 sm:pt-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-widest text-muted">Case Challenge 3.0 · Horizon Capital</p>
            <h1 className="font-serif text-3xl font-semibold leading-tight text-ink sm:text-4xl">Exit Simulator</h1>
          </div>
          <ThemeToggle />
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button onClick={reset} disabled={isDefault}>
            ↺ Скинути до базового сценарію
          </Button>
          <Button onClick={() => setSharing(true)}>Поділитися · QR</Button>
        </div>
      </header>

      <nav
        className="no-scrollbar sticky top-0 z-20 mt-3 overflow-x-auto border-b border-line bg-bg/95 px-1.5 backdrop-blur sm:px-4"
        aria-label="Вкладки"
      >
        <div role="tablist" className="flex min-w-max">
          {TABS.map((t) => {
            const active = state.tab === t.id
            return (
              <button
                key={t.id}
                role="tab"
                aria-selected={active}
                onClick={() => setTab(t.id)}
                className={`relative min-h-11 px-2.5 text-[13px] font-semibold sm:px-4 sm:text-sm transition-colors ${
                  active ? 'text-ink' : 'text-muted hover:text-ink'
                }`}
              >
                {t.label}
                {active && <span className="absolute inset-x-2 bottom-0 h-0.5 rounded bg-accent" aria-hidden />}
              </button>
            )
          })}
        </div>
      </nav>

      <main className="flex-1 px-4 py-5 sm:px-6" role="tabpanel">
        <Suspense fallback={<p className="py-10 text-center text-sm text-muted">Завантаження…</p>}>
          {state.tab === 'decision' && <DecisionPage />}
          {state.tab === 'scenarios' && <ScenariosPage />}
          {state.tab === 'risks' && <RisksPage />}
          {state.tab === 'capital' && <CapitalPage />}
          {state.tab === 'about' && <AboutPage />}
        </Suspense>
      </main>

      <footer className="sticky bottom-0 z-20 border-t border-line bg-bg/95 px-4 py-2 text-center text-xs text-muted backdrop-blur">
        {DISCLAIMER}
      </footer>

      {sharing && (
        <Suspense fallback={null}>
          <ShareDialog onClose={() => setSharing(false)} />
        </Suspense>
      )}
    </div>
  )
}

export default function App() {
  return (
    <AppStateProvider>
      <Shell />
    </AppStateProvider>
  )
}
