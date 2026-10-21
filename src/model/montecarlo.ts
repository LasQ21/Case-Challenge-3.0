// Монте-Карло (PLAN.md, розділ 7). Обидва режими — «План команди» і «Без дій» —
// рахуються на однакових випадкових числах (common random numbers).
import {
  CASE_DATA,
  DEFAULT_EVENTS,
  EVENT_META,
  FUND,
  MC_LIMITS,
  type Assumptions,
  type EventId,
  type NoiseParams,
  type RiskEvents,
} from './config'
import { mulberry32, standardNormal, triangular } from './rng'
import { equityValue, ownershipAfter, projectRevenue, secToday } from './valuation'

export interface McInput {
  a: Assumptions
  noise: NoiseParams
  events: RiskEvents
  runs: number
  seed: number
  // 1 — повний шум, 0 — без неперервного шуму (для перевірки)
  noiseScale?: number
}

export type TornadoParam = 'secGrowth' | 'secMargin' | 'secMult' | 'itEbitda' | 'itMult' | 'ecomEbitda'

export const TORNADO_PARAMS: readonly { id: TornadoParam; label: string; sd: keyof NoiseParams }[] = [
  { id: 'secGrowth', label: 'Ріст Security', sd: 'secGrowthSd' },
  { id: 'secMargin', label: 'Маржа Security', sd: 'secMarginSd' },
  { id: 'secMult', label: 'Мультиплікатор Security', sd: 'secMultSd' },
  { id: 'itEbitda', label: 'EBITDA IT', sd: 'itEbitdaSd' },
  { id: 'itMult', label: 'Мультиплікатор IT', sd: 'itMultSd' },
  { id: 'ecomEbitda', label: 'EBITDA E-com', sd: 'ecomEbitdaSd' },
]

export const EVENT_IDS = Object.keys(DEFAULT_EVENTS) as EventId[]

type Shift = Record<TornadoParam, number>
const NO_SHIFT: Shift = { secGrowth: 0, secMargin: 0, secMult: 0, itEbitda: 0, itMult: 0, ecomEbitda: 0 }

// Порядок випадкових величин в одній ітерації
const N_NORMALS = 6
const N_UNIFORMS = 1 + EVENT_IDS.length
const STRIDE = N_NORMALS + N_UNIFORMS

function drawAll(runs: number, seed: number): Float64Array {
  const rng = mulberry32(seed)
  const d = new Float64Array(runs * STRIDE)
  for (let i = 0; i < runs; i++) {
    const o = i * STRIDE
    for (let k = 0; k < N_NORMALS; k++) d[o + k] = standardNormal(rng)
    for (let k = 0; k < N_UNIFORMS; k++) d[o + N_NORMALS + k] = rng()
  }
  return d
}

interface ModeOut {
  plan: Float64Array
  sq: Float64Array
  byCompany: { plan: Record<'sec' | 'it' | 'ecom', number>; sq: Record<'sec' | 'it' | 'ecom', number> }
  fired: Record<EventId, number>
}

function simulate(input: McInput, draws: Float64Array, shift: Shift): ModeOut {
  const { a, noise, events: ev, runs } = input
  const s = input.noiseScale ?? 1
  const sec = CASE_DATA.sec
  const it = CASE_DATA.it
  const ecom = CASE_DATA.ecom

  const ownNew = ownershipAfter(secToday(a).equity, sec.ownership, a.sec.investment)
  const uplift = a.sec.plan.mult - a.sec.sq.mult
  const reserve = Math.max(0, FUND.freeCapital - a.sec.investment - a.ecom.plan.bridge)
  const uncovered = ev.overrun.need > 0 ? Math.max(0, ev.overrun.need - reserve) / ev.overrun.need : 0

  const sqTri = a.ecom.sq
  const triMode = Math.min(sqTri.fundMax, Math.max(sqTri.fundMin, 3 * sqTri.fundValue - sqTri.fundMin - sqTri.fundMax))

  const clipMult = (x: number) => Math.min(noise.secMultMax, Math.max(noise.secMultMin, x))

  const plan = new Float64Array(runs)
  const sq = new Float64Array(runs)
  const sum = { plan: { sec: 0, it: 0, ecom: 0 }, sq: { sec: 0, it: 0, ecom: 0 } }
  const fired = Object.fromEntries(EVENT_IDS.map((id) => [id, 0])) as Record<EventId, number>
  const hit = {} as Record<EventId, boolean>

  for (let i = 0; i < runs; i++) {
    const o = i * STRIDE
    const zG = draws[o]
    const zM = draws[o + 1]
    const zX = draws[o + 2]
    const zItE = draws[o + 3]
    const zItX = draws[o + 4]
    const zEcE = draws[o + 5]
    const uEcSq = draws[o + N_NORMALS]
    for (let k = 0; k < EVENT_IDS.length; k++) {
      const id = EVENT_IDS[k]
      hit[id] = draws[o + N_NORMALS + 1 + k] < ev[id].p
      if (hit[id]) fired[id]++
    }

    // Security — план
    let g = a.sec.plan.growth + shift.secGrowth + s * noise.secGrowthSd * zG
    let m = a.sec.plan.margin + shift.secMargin + s * noise.secMarginSd * zM
    let x = a.sec.plan.mult + shift.secMult + s * noise.secMultSd * zX
    if (hit.exportDelay) {
      g -= ev.exportDelay.growthHit
      x -= uplift * (1 - ev.exportDelay.upliftKept)
    }
    if (hit.overrun) x -= uplift * (1 - ev.overrun.upliftKept) * uncovered
    if (hit.ceasefire) {
      g -= ev.ceasefire.growthHit
      x += ev.ceasefire.multBoost
    }
    if (hit.euMargin) m -= ev.euMargin.marginHit
    let e = projectRevenue(sec.revenueLast, Math.max(-1, g), a.sec.years) * Math.max(0, m)
    if (hit.siteStrike) e *= 1 - ev.siteStrike.ebitdaHitWithHub
    let secPlan = Math.max(0, equityValue(e, clipMult(x), a.sec.plan.netDebtExit)) * ownNew
    if (hit.founderConflict) secPlan *= 1 - ev.founderConflict.forcedSaleDiscount

    // Security — без дій
    g = a.sec.sq.growth + s * noise.secGrowthSd * zG
    m = a.sec.sq.margin + s * noise.secMarginSd * zM
    x = a.sec.sq.mult + s * noise.secMultSd * zX
    if (hit.ceasefire) {
      g -= ev.ceasefire.growthHit
      x += ev.ceasefire.multBoost
    }
    e = projectRevenue(sec.revenueLast, Math.max(-1, g), a.sec.years) * Math.max(0, m)
    if (hit.siteStrike) e *= 1 - ev.siteStrike.ebitdaHitNoHub
    let secSq = Math.max(0, equityValue(e, clipMult(x), a.sec.sq.netDebt)) * sec.ownership
    if (hit.founderConflict) secSq *= 1 - ev.founderConflict.forcedSaleDiscount

    // IT
    let itE = a.it.plan.ebitda + shift.itEbitda + s * noise.itEbitdaSd * zItE
    let itX = a.it.plan.mult + shift.itMult + s * noise.itMultSd * zItX
    let itDE = a.it.drift.ebitda + s * noise.itEbitdaSd * zItE
    let itDX = a.it.drift.mult + s * noise.itMultSd * zItX
    if (hit.itUtilization) {
      itE *= 1 - ev.itUtilization.ebitdaHit
      itDE *= 1 - ev.itUtilization.ebitdaHit
      itX = ev.itUtilization.mult
      itDX = ev.itUtilization.mult
    }
    const itPlan = Math.max(0, equityValue(Math.max(0, itE), itX, it.netDebt)) * it.ownership
    const itSq = Math.max(0, equityValue(Math.max(0, itDE), itDX, it.netDebt)) * it.ownership

    // E-commerce
    let ecPlan = 0
    if (!hit.ecomCreditors) {
      const ecE = a.ecom.plan.ebitda + shift.ecomEbitda + s * noise.ecomEbitdaSd * zEcE
      const bridge = a.ecom.plan.bridge
      ecPlan = Math.max(0, equityValue(ecE, a.ecom.plan.mult, ecom.netDebt + bridge)) * ecom.ownership + bridge
    }
    const tri = triangular(uEcSq, sqTri.fundMin, triMode, sqTri.fundMax)
    const ecSq = Math.max(0, sqTri.fundValue + s * (tri - sqTri.fundValue))

    plan[i] = secPlan + itPlan + ecPlan
    sq[i] = secSq + itSq + ecSq
    sum.plan.sec += secPlan
    sum.plan.it += itPlan
    sum.plan.ecom += ecPlan
    sum.sq.sec += secSq
    sum.sq.it += itSq
    sum.sq.ecom += ecSq
  }

  const avg = (r: { sec: number; it: number; ecom: number }) => ({
    sec: r.sec / runs,
    it: r.it / runs,
    ecom: r.ecom / runs,
  })
  return { plan, sq, byCompany: { plan: avg(sum.plan), sq: avg(sum.sq) }, fired }
}

export interface Summary {
  mean: number
  p10: number
  p50: number
  p90: number
}

function quantile(sorted: Float64Array, q: number): number {
  const pos = (sorted.length - 1) * q
  const lo = Math.floor(pos)
  const hi = Math.ceil(pos)
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (pos - lo)
}

export function summarize(values: Float64Array): Summary {
  const sorted = Float64Array.from(values).sort()
  let total = 0
  for (const v of values) total += v
  return {
    mean: total / values.length,
    p10: quantile(sorted, 0.1),
    p50: quantile(sorted, 0.5),
    p90: quantile(sorted, 0.9),
  }
}

export interface HistogramBin {
  from: number
  to: number
  plan: number
  sq: number
}

export function histogram(plan: Float64Array, sq: Float64Array, bins: number): HistogramBin[] {
  let lo = Infinity
  let hi = -Infinity
  for (const arr of [plan, sq]) {
    for (const v of arr) {
      if (v < lo) lo = v
      if (v > hi) hi = v
    }
  }
  if (!(hi > lo)) hi = lo + 1
  const width = (hi - lo) / bins
  const out: HistogramBin[] = Array.from({ length: bins }, (_, k) => ({
    from: lo + k * width,
    to: lo + (k + 1) * width,
    plan: 0,
    sq: 0,
  }))
  const idx = (v: number) => Math.min(bins - 1, Math.floor((v - lo) / width))
  for (const v of plan) out[idx(v)].plan++
  for (const v of sq) out[idx(v)].sq++
  for (const b of out) {
    b.plan /= plan.length
    b.sq /= sq.length
  }
  return out
}

export interface TornadoRow {
  id: TornadoParam
  label: string
  low: number
  high: number
}

export interface McResult {
  runs: number
  seed: number
  plan: Summary
  sq: Summary
  byCompany: ModeOut['byCompany']
  probPlanBetter: number
  triggers: { id: EventId; label: string; freq: number }[]
  histogram: HistogramBin[]
  tornado: TornadoRow[]
}

export function runMonteCarlo(input: McInput, withTornado = true): McResult {
  const draws = drawAll(input.runs, input.seed)
  const base = simulate(input, draws, NO_SHIFT)
  const plan = summarize(base.plan)

  let better = 0
  for (let i = 0; i < input.runs; i++) if (base.plan[i] > base.sq[i]) better++

  const meanOf = (arr: Float64Array) => {
    let t = 0
    for (const v of arr) t += v
    return t / arr.length
  }

  const tornado: TornadoRow[] = withTornado
    ? TORNADO_PARAMS.map((p) => {
        const sd = input.noise[p.sd]
        const up = simulate(input, draws, { ...NO_SHIFT, [p.id]: sd }).plan
        const down = simulate(input, draws, { ...NO_SHIFT, [p.id]: -sd }).plan
        return { id: p.id, label: p.label, low: meanOf(down) - plan.mean, high: meanOf(up) - plan.mean }
      }).sort((x, y) => Math.abs(y.high - y.low) - Math.abs(x.high - x.low))
    : []

  return {
    runs: input.runs,
    seed: input.seed,
    plan,
    sq: summarize(base.sq),
    byCompany: base.byCompany,
    probPlanBetter: better / input.runs,
    triggers: EVENT_IDS.map((id) => ({ id, label: EVENT_META[id].label, freq: base.fired[id] / input.runs })),
    histogram: histogram(base.plan, base.sq, MC_LIMITS.histogramBins),
    tornado,
  }
}
