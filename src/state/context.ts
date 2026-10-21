import { createContext, useContext } from 'react'
import type { AppState, TabId } from '../lib/urlState'

export interface AppStateApi {
  state: AppState
  set: (path: string, value: number) => void
  setTab: (tab: TabId) => void
  reset: () => void
  isDefault: boolean
}

export const AppStateContext = createContext<AppStateApi | null>(null)

export function useAppState(): AppStateApi {
  const ctx = useContext(AppStateContext)
  if (!ctx) throw new Error('useAppState поза AppStateProvider')
  return ctx
}
