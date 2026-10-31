import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'

// Дві мови сайту. Український текст лишається в коді поруч з англійським: t('Рішення', 'Decision').
export type Lang = 'uk' | 'en'

function readInitial(): Lang {
  const q = new URLSearchParams(window.location.search).get('lang')
  const urlLang = q === 'en' || q === 'uk' ? q : null
  try {
    // мова з поділеного посилання запам'ятовується, бо ?lang= одразу зникає з адреси
    if (urlLang) localStorage.setItem('lang', urlLang)
    else {
      const s = localStorage.getItem('lang')
      if (s === 'en' || s === 'uk') return s
    }
  } catch {
    // приватний режим — мова просто не запам'ятається
  }
  return urlLang ?? 'uk'
}

interface LangApi {
  lang: Lang
  setLang: (l: Lang) => void
  t: (uk: string, en: string) => string
}

const LangContext = createContext<LangApi | null>(null)

export function LangProvider({ children }: { children: ReactNode }) {
  // <html lang> ставимо до рендеру: від нього залежить форматування чисел (int)
  const [lang, setLangState] = useState<Lang>(() => {
    const l = readInitial()
    document.documentElement.lang = l
    return l
  })

  useEffect(() => {
    // ?lang= лише для першого відкриття; далі мова живе в localStorage
    const url = new URL(window.location.href)
    if (url.searchParams.has('lang')) {
      url.searchParams.delete('lang')
      window.history.replaceState(null, '', url)
    }
  }, [])

  const setLang = useCallback((l: Lang) => {
    document.documentElement.lang = l
    setLangState(l)
    try {
      localStorage.setItem('lang', l)
    } catch {
      // див. вище
    }
  }, [])

  const api = useMemo<LangApi>(
    () => ({ lang, setLang, t: (uk, en) => (lang === 'en' ? en : uk) }),
    [lang, setLang],
  )
  return <LangContext.Provider value={api}>{children}</LangContext.Provider>
}

export function useLang(): LangApi {
  const ctx = useContext(LangContext)
  if (!ctx) throw new Error('useLang поза LangProvider')
  return ctx
}
