// Розподіл $15m (PLAN.md, розділ 8). Очікувані гроші фонду для довільного розподілу.
import {
  ALLOCATION_RULES,
  CASE_DATA,
  FUND,
  type Allocation,
  type Assumptions,
  type RiskEvents,
} from './config'
import { equityValue, itPlan, ownershipAfter, project, secToday, portfolio } from './valuation'

export const reserveOf = (x: Allocation): number => FUND.freeCapital - x.sec - x.ecom - x.it

export const isFeasible = (x: Allocation): boolean =>
  x.sec >= 0 && x.ecom >= 0 && x.it >= 0 && reserveOf(x) >= -1e-9

// Обрізає розподіл так, щоб сума ніколи не перевищувала $15m.
// Змінена компанія `changed` зберігає своє значення в межах доступного.
export function clampAllocation(x: Allocation, changed?: keyof Allocation): Allocation {
  const max = ALLOCATION_RULES.maxBySlider
  const out: Allocation = {
    sec: Math.min(max.sec, Math.max(0, x.sec)),
    ecom: Math.min(max.ecom, Math.max(0, x.ecom)),
    it: Math.min(max.it, Math.max(0, x.it)),
  }
  const keys: (keyof Allocation)[] = ['sec', 'ecom', 'it']
  if (changed) {
    const others = keys.filter((k) => k !== changed).reduce((t, k) => t + out[k], 0)
    out[changed] = Math.max(0, Math.min(out[changed], FUND.freeCapital - others))
  }
  // Якщо все ще забагато — зменшуємо інші по черзі
  let excess = -reserveOf(out)
  for (const k of keys) {
    if (excess <= 1e-9) break
    if (k === changed) continue
    const cut = Math.min(out[k], excess)
    out[k] -= cut
    excess -= cut
  }
  return out
}

export interface AllocationResult {
  sec: number
  ecom: number
  it: number
  reserve: number
  reserveReturned: number
  portfolio: number
  total: number
  deployed: number
  moic: number | null
  ecomSurvival: number
  secProgramShare: number
}

// Security: приріст плану (мультиплікатор, а також ріст і борг — QUESTION нижче)
// масштабується часткою s = min(I / 10, 1). Понад 10 — лише більша частка за pre-money.
function secValue(a: Assumptions, investment: number, multCut: number): number {
  const s = Math.min(investment / ALLOCATION_RULES.secFullProgram, 1)
  const sq = a.sec.sq
  const pl = a.sec.plan
  // QUESTION: розділ 8 описує лише масштабування мультиплікатора. Ріст, маржу й борг
  // інтерполюємо так само, щоб I = 0 давало статус-кво, а I = 10 — рівно план зі слайдів.
  const lerp = (from: number, to: number) => from + (to - from) * s
  const mult = lerp(sq.mult, pl.mult) - multCut * s
  const p = project(
    CASE_DATA.sec.revenueLast,
    lerp(sq.growth, pl.growth),
    a.sec.years,
    lerp(sq.margin, pl.margin),
    mult,
    lerp(sq.netDebt, pl.netDebtExit),
  )
  const own = ownershipAfter(secToday(a).equity, CASE_DATA.sec.ownership, investment)
  return Math.max(0, p.equity) * own
}

export function evaluateAllocation(a: Assumptions, ev: RiskEvents, x: Allocation): AllocationResult {
  const rules = ALLOCATION_RULES
  const reserve = Math.max(0, reserveOf(x))
  const s = Math.min(x.sec / rules.secFullProgram, 1)

  // Перевитрати: з імовірністю p програмі потрібно ще need × s; резерв покриває, скільки може
  const need = ev.overrun.need * s
  const covered = Math.min(reserve, need)
  const uncovered = need > 0 ? (need - covered) / need : 0
  const uplift = a.sec.plan.mult - a.sec.sq.mult
  const multCut = uplift * (1 - ev.overrun.upliftKept) * uncovered
  const sec = (1 - ev.overrun.p) * secValue(a, x.sec, 0) + ev.overrun.p * secValue(a, x.sec, multCut)
  const reserveReturned = reserve - ev.overrun.p * covered

  // E-com: бридж ≥ порогу → виживання 0.7, інакше 0.3. Понад поріг — лише номінал.
  // QUESTION: за I = 0 це дає 0.3 × 19.5 ≈ 5.9, а не «≈ 2» статус-кво з розділу 4.2.
  const c = CASE_DATA.ecom
  const bridge = Math.min(x.ecom, rules.ecomBridgeThreshold)
  const excess = x.ecom - bridge
  const ecomSurvival =
    x.ecom >= rules.ecomBridgeThreshold ? rules.ecomSurvivalWithBridge : rules.ecomSurvivalWithout
  const ecomIfSurvives =
    Math.max(0, equityValue(a.ecom.plan.ebitda, a.ecom.plan.mult, c.netDebt + bridge)) * c.ownership + bridge
  const ecom = ecomSurvival * ecomIfSurvives + excess

  // IT: інвестиція повертається 1:1 і вартості не створює
  const it = itPlan(a).fund + x.it

  const portfolioValue = sec + ecom + it
  const deployed = x.sec + x.ecom + x.it
  const sqPortfolio = portfolio(a).sq
  return {
    sec,
    ecom,
    it,
    reserve,
    reserveReturned,
    portfolio: portfolioValue,
    total: portfolioValue + reserveReturned,
    deployed,
    moic: deployed > 0 ? (portfolioValue - sqPortfolio) / deployed : null,
    ecomSurvival,
    secProgramShare: s,
  }
}

// Перебір із кроком $0.5m: найкращий розподіл за очікуваними грошима фонду
export function optimizeAllocation(a: Assumptions, ev: RiskEvents) {
  const { step, maxBySlider: max } = ALLOCATION_RULES
  let best: { x: Allocation; r: AllocationResult } | null = null
  const n = (v: number) => Math.round(v / step)
  for (let i = 0; i <= n(max.sec); i++) {
    for (let j = 0; j <= n(max.ecom); j++) {
      for (let k = 0; k <= n(max.it); k++) {
        const x = { sec: i * step, ecom: j * step, it: k * step }
        if (!isFeasible(x)) break
        const r = evaluateAllocation(a, ev, x)
        if (!best || r.total > best.r.total + 1e-9) best = { x, r }
      }
    }
  }
  return best!
}
