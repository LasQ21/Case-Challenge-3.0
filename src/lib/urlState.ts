// Стан сценарію ⇄ URL query params. У посилання потрапляють лише значення,
// що відрізняються від базового сценарію, тому базове посилання — чисте.
import {
  DEFAULT_ASSUMPTIONS,
  DEFAULT_EVENTS,
  DEFAULT_LENS,
  DEFAULT_NOISE,
  DEFAULT_WEIGHTS,
  MC_LIMITS,
  TEAM_ALLOCATION,
  type Allocation,
  type Assumptions,
  type LensScores,
  type LensWeights,
  type NoiseParams,
  type RiskEvents,
} from '../model/config'

export const TAB_IDS = ['decision', 'scenarios', 'risks', 'capital', 'about'] as const
export type TabId = (typeof TAB_IDS)[number]

export interface NumericState {
  a: Assumptions
  noise: NoiseParams
  ev: RiskEvents
  lens: LensScores
  w: LensWeights
  mc: { runs: number; seed: number; weighted: number }
  alloc: Allocation
}

export interface AppState extends NumericState {
  tab: TabId
}

export const DEFAULT_NUMERIC: NumericState = {
  a: DEFAULT_ASSUMPTIONS,
  noise: DEFAULT_NOISE,
  ev: DEFAULT_EVENTS,
  lens: DEFAULT_LENS,
  w: DEFAULT_WEIGHTS,
  mc: { runs: MC_LIMITS.defaultRuns, seed: MC_LIMITS.defaultSeed, weighted: 0 },
  alloc: TEAM_ALLOCATION,
}

export const DEFAULT_STATE: AppState = { tab: 'decision', ...DEFAULT_NUMERIC }

type Tree = { [k: string]: number | Tree }

function walk(node: Tree, prefix: string, out: [string, number][]) {
  for (const [k, v] of Object.entries(node)) {
    const path = prefix ? `${prefix}.${k}` : k
    if (typeof v === 'number') out.push([path, v])
    else if (v !== null && typeof v === 'object') walk(v, path, out)
  }
}

export function flatten(obj: object): [string, number][] {
  const out: [string, number][] = []
  walk(obj as Tree, '', out)
  return out
}

export function getPath(obj: object, path: string): number | undefined {
  let cur: unknown = obj
  for (const k of path.split('.')) {
    if (cur === null || typeof cur !== 'object' || !(k in cur)) return undefined
    cur = (cur as Record<string, unknown>)[k]
  }
  return typeof cur === 'number' ? cur : undefined
}

// Іммутабельно оновлює числовий лист за шляхом "a.sec.plan.mult"
export function setPath<T extends object>(obj: T, path: string, value: number): T {
  const [head, ...rest] = path.split('.')
  const src = obj as Record<string, unknown>
  if (!(head in src)) return obj
  const next = rest.length === 0 ? value : setPath(src[head] as object, rest.join('.'), value)
  return { ...obj, [head]: next } as T
}

const DEFAULT_FLAT = new Map(flatten(DEFAULT_NUMERIC))

export function encodeState(state: AppState): string {
  const params = new URLSearchParams()
  if (state.tab !== DEFAULT_STATE.tab) params.set('tab', state.tab)
  const { tab: _tab, ...numeric } = state
  void _tab
  for (const [path, v] of flatten(numeric)) {
    if (DEFAULT_FLAT.get(path) !== v) params.set(path, String(v))
  }
  return params.toString()
}

export function decodeState(search: string): AppState {
  const params = new URLSearchParams(search)
  let numeric: NumericState = DEFAULT_NUMERIC
  for (const [key, raw] of params) {
    if (!DEFAULT_FLAT.has(key)) continue
    const v = Number(raw)
    if (raw.trim() === '' || !Number.isFinite(v)) continue
    numeric = setPath(numeric, key, v)
  }
  const tab = params.get('tab')
  return {
    tab: (TAB_IDS as readonly string[]).includes(tab ?? '') ? (tab as TabId) : DEFAULT_STATE.tab,
    ...numeric,
  }
}
