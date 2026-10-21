import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { DEFAULT_STATE, decodeState, encodeState, setPath, type AppState, type TabId } from '../lib/urlState'
import { AppStateContext } from './context'

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(() => decodeState(window.location.search))

  // Стан → URL (replaceState, щоб повзунки не засмічували історію)
  const query = encodeState(state)
  useEffect(() => {
    const url = `${window.location.pathname}${query ? `?${query}` : ''}${window.location.hash}`
    window.history.replaceState(null, '', url)
  }, [query])

  const set = useCallback((path: string, value: number) => setState((s) => setPath(s, path, value)), [])
  const setTab = useCallback((tab: TabId) => {
    setState((s) => ({ ...s, tab }))
    window.scrollTo({ top: 0 })
  }, [])
  const reset = useCallback(() => setState((s) => ({ ...DEFAULT_STATE, tab: s.tab })), [])

  const isDefault = encodeState({ ...state, tab: DEFAULT_STATE.tab }) === ''
  const api = useMemo(() => ({ state, set, setTab, reset, isDefault }), [state, set, setTab, reset, isDefault])
  return <AppStateContext.Provider value={api}>{children}</AppStateContext.Provider>
}
