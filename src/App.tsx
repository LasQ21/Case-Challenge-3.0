import { lazy, Suspense, useLayoutEffect, useRef, useState } from 'react'
import { DISCLAIMER, DISCLAIMER_EN } from './model/config'
import { portfolio } from './model/valuation'
import { money } from './lib/format'
import type { TabId } from './lib/urlState'
import { LangProvider, useLang, type Lang } from './lib/i18n'
import { AppStateProvider } from './state/AppStateProvider'
import { useAppState } from './state/context'
import { Button, btnClass } from './components/ui'
import { Aurora } from './components/Aurora'
import { ThemeToggle } from './components/ThemeToggle'
import DecisionPage from './pages/DecisionPage'

// Вкладки з графіками вантажаться окремо — перше відображення лишається легким
const ScenariosPage = lazy(() => import('./pages/ScenariosPage'))
const RisksPage = lazy(() => import('./pages/RisksPage'))
const CapitalPage = lazy(() => import('./pages/CapitalPage'))
const AboutPage = lazy(() => import('./pages/AboutPage'))
const ShareDialog = lazy(() => import('./components/ShareDialog'))

const TABS: { id: TabId; label: string; labelEn: string }[] = [
  { id: 'decision', label: 'Рішення', labelEn: 'Decision' },
  { id: 'scenarios', label: 'Сценарії', labelEn: 'Scenarios' },
  { id: 'risks', label: 'Ризики', labelEn: 'Risks' },
  { id: 'capital', label: '$15m', labelEn: '$15m' },
  { id: 'about', label: 'Про модель', labelEn: 'About' },
]

// Перемикач мови UA / EN — капсула поруч із перемикачем теми
function LangSwitch() {
  const { lang, setLang } = useLang()
  const opts: { id: Lang; label: string; aria: string }[] = [
    { id: 'uk', label: 'UA', aria: 'Українська' },
    { id: 'en', label: 'EN', aria: 'English' },
  ]
  return (
    <div role="group" aria-label="Мова / Language" className="lang-switch glass glass-refract pill inline-flex h-12 items-center p-1">
      {opts.map((o) => (
        <button
          key={o.id}
          type="button"
          aria-pressed={lang === o.id}
          aria-label={o.aria}
          onClick={() => setLang(o.id)}
          className="h-10 min-w-10 rounded-full px-2.5 text-xs font-semibold text-muted transition-colors hover:text-ink"
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

// Заголовок розсипається на літери, що злітаються з розмиття
function SplitTitle({ text }: { text: string }) {
  let i = 0
  return (
    <span aria-hidden style={{ perspective: '600px' }}>
      {text.split(' ').map((w, wi) => (
        <span key={wi}>
          {wi > 0 && ' '}
          <span className="word">
            {[...w].map((ch) => (
              <span key={i} className="char" style={{ ['--i' as string]: i++ }}>
                {ch}
              </span>
            ))}
          </span>
        </span>
      ))}
    </span>
  )
}

// Вкладки — плаваюча скляна капсула; підсвітка перетікає між ними, як крапля
function Tabs({ tab, onSelect }: { tab: TabId; onSelect: (t: TabId) => void }) {
  const { lang, t } = useLang()
  const refs = useRef<Partial<Record<TabId, HTMLButtonElement | null>>>({})
  const ind = useRef<HTMLSpanElement>(null)
  const first = useRef(true)

  useLayoutEffect(() => {
    const place = () => {
      const b = refs.current[tab]
      const i = ind.current
      if (!b || !i) return
      i.style.left = `${b.offsetLeft}px`
      i.style.width = `${b.offsetWidth}px`
      b.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: first.current ? 'auto' : 'smooth' })
    }
    place()
    if (!first.current && ind.current) {
      const i = ind.current
      i.classList.remove('jelly')
      void i.offsetWidth
      i.classList.add('jelly')
    }
    first.current = false
    addEventListener('resize', place)
    document.fonts?.ready.then(place)
    return () => removeEventListener('resize', place)
  }, [tab, lang])

  return (
    <nav className="sticky top-3 z-30 mt-6 flex justify-center px-3" aria-label={t('Вкладки', 'Tabs')}>
      <div className="glass glass-strong glass-refract pill no-scrollbar max-w-full overflow-x-auto p-1">
        <div role="tablist" className="relative flex min-w-max">
          <span ref={ind} className="tab-ind" aria-hidden />
          {TABS.map((tab_) => {
            const active = tab === tab_.id
            return (
              <button
                key={tab_.id}
                ref={(el) => {
                  refs.current[tab_.id] = el
                }}
                role="tab"
                aria-selected={active}
                onClick={() => onSelect(tab_.id)}
                className={`relative z-10 min-h-10 rounded-full px-3.5 text-[13px] font-semibold transition-colors duration-300 sm:px-5 sm:text-sm ${
                  active ? 'text-white' : 'text-muted hover:text-ink'
                }`}
              >
                {lang === 'en' ? tab_.labelEn : tab_.label}
              </button>
            )
          })}
        </div>
      </div>
    </nav>
  )
}

function Shell() {
  const { state, setTab, reset, isDefault } = useAppState()
  const { t } = useLang()
  const [sharing, setSharing] = useState(false)
  const pf = portfolio(state.a)

  return (
    <>
      <Aurora />
      <div className="mx-auto flex min-h-dvh max-w-5xl flex-col">
        <header className="px-4 pt-6 sm:px-6 sm:pt-10">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="rise glass pill inline-flex items-center gap-2 px-3 py-1 font-mono text-[11px] text-muted sm:text-xs">
                <span className="relative flex h-2 w-2" aria-hidden>
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-60" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-accent" />
                </span>
                <span>
                  Case Challenge 3.0 · <span className="text-ink">SKELAR × Horizon Capital × Mastercard</span>
                </span>
              </p>
              <h1
                data-text="Exit Simulator"
                aria-label="Exit Simulator"
                className="text-shine mt-3 pb-1 font-display text-5xl font-bold leading-[0.95] tracking-tight sm:text-7xl lg:text-8xl">
                <SplitTitle text="Exit Simulator" />
              </h1>
            </div>
            <div className="rise flex shrink-0 flex-col items-end gap-2 sm:flex-row sm:items-center" style={{ ['--d' as string]: '300ms' }}>
              <LangSwitch />
              <ThemeToggle />
            </div>
          </div>
          <p
            className="rise mt-4 max-w-3xl text-base font-semibold leading-snug text-ink sm:text-xl"
            style={{ ['--d' as string]: '500ms' }}
          >
            {t('Фокус на Security Hardware:', 'Focus on Security Hardware:')}{' '}
            <span key={pf.plan} className="num tick text-grad">
              {money(pf.plan)}
            </span>{' '}
            {t('на виході проти', 'at exit vs')} <span className="num">{money(pf.sq)}</span> {t('без дій', 'with no action')}
            {isDefault ? '' : t(' — у вашому сценарії', ' — in your scenario')}.
          </p>
          <div className="rise mt-5 flex flex-wrap gap-2" style={{ ['--d' as string]: '650ms' }}>
            <a href="./deck.html" className={btnClass('solid')}>
              {t('Презентація', 'Deck')} ↗
            </a>
            <a href="./deck.pdf" download="CC-146 — Exit Simulator.pdf" className={btnClass()}>
              PDF
            </a>
            <Button onClick={() => setSharing(true)}>{t('Поділитися · QR', 'Share · QR')}</Button>
            <Button onClick={reset} disabled={isDefault}>
              ↺ {t('Скинути до базового сценарію', 'Reset to base case')}
            </Button>
          </div>
        </header>

        <Tabs tab={state.tab} onSelect={setTab} />

        <main key={state.tab} className="panel flex-1 px-4 py-6 sm:px-6" role="tabpanel">
          <Suspense
            fallback={
              <div className="space-y-4" aria-label={t('Завантаження…', 'Loading…')}>
                {[0, 1, 2].map((i) => (
                  <div key={i} className="glass card h-40 animate-pulse" />
                ))}
              </div>
            }
          >
            {state.tab === 'decision' && <DecisionPage />}
            {state.tab === 'scenarios' && <ScenariosPage />}
            {state.tab === 'risks' && <RisksPage />}
            {state.tab === 'capital' && <CapitalPage />}
            {state.tab === 'about' && <AboutPage />}
          </Suspense>
        </main>

        <footer className="sticky bottom-3 z-20 mx-3 mb-3 flex justify-center">
          <p className="glass glass-strong rounded-2xl px-4 py-2 text-center sm:rounded-full font-mono text-[11px] text-muted sm:text-xs">{t(DISCLAIMER, DISCLAIMER_EN)}</p>
        </footer>

        {sharing && (
          <Suspense fallback={null}>
            <ShareDialog onClose={() => setSharing(false)} />
          </Suspense>
        )}
      </div>
    </>
  )
}

export default function App() {
  return (
    <LangProvider>
      <AppStateProvider>
        <Shell />
      </AppStateProvider>
    </LangProvider>
  )
}
