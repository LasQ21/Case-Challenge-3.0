import { describe, expect, it } from 'vitest'
import { DEFAULT_ASSUMPTIONS as A, DEFAULT_EVENTS as EV, FUND, TEAM_ALLOCATION } from '../config'
import { clampAllocation, evaluateAllocation, optimizeAllocation, reserveOf } from '../allocation'
import { mulberry32 } from '../rng'
import { portfolio, secPlan, secStatusQuo } from '../valuation'

describe('Розподіл $15m', () => {
  it('рішення команди: 10 / 3 / 0, резерв 2', () => {
    expect(reserveOf(TEAM_ALLOCATION)).toBe(2)
  })

  it('ніколи не перевищує $15m', () => {
    const rng = mulberry32(1)
    const keys = ['sec', 'ecom', 'it'] as const
    for (let i = 0; i < 2000; i++) {
      const x = { sec: rng() * 20 - 2, ecom: rng() * 12 - 1, it: rng() * 10 - 1 }
      const c = clampAllocation(x, keys[i % 3])
      expect(c.sec + c.ecom + c.it).toBeLessThanOrEqual(FUND.freeCapital + 1e-9)
      expect(Math.min(c.sec, c.ecom, c.it)).toBeGreaterThanOrEqual(0)
    }
  })

  it('Security: I = 10 дає рівно план, I = 0 — статус-кво (без перевитрат)', () => {
    const noOverrun = { ...EV, overrun: { ...EV.overrun, p: 0 } }
    const team = evaluateAllocation(A, noOverrun, { sec: 10, ecom: 0, it: 0 })
    expect(team.sec).toBeCloseTo(secPlan(A).fund, 9)
    const zero = evaluateAllocation(A, noOverrun, { sec: 0, ecom: 0, it: 0 })
    expect(zero.sec).toBeCloseTo(secStatusQuo(A).fund, 9)
  })

  it('IT і резерв повертаються 1:1', () => {
    const noOverrun = { ...EV, overrun: { ...EV.overrun, p: 0 } }
    const r = evaluateAllocation(A, noOverrun, { sec: 0, ecom: 0, it: 5 })
    expect(r.it - portfolio(A).it.plan).toBeCloseTo(5, 9)
    expect(r.reserveReturned).toBeCloseTo(10, 9)
  })

  it('E-com: бридж ≥ 3 → виживання 0.7, понад 3 — номінал', () => {
    const r3 = evaluateAllocation(A, EV, { sec: 0, ecom: 3, it: 0 })
    const r5 = evaluateAllocation(A, EV, { sec: 0, ecom: 5, it: 0 })
    expect(r3.ecomSurvival).toBe(0.7)
    expect(r3.ecom).toBeCloseTo(0.7 * 21.6, 6)
    expect(r5.ecom - r3.ecom).toBeCloseTo(2, 9)
    expect(evaluateAllocation(A, EV, { sec: 0, ecom: 2.5, it: 0 }).ecomSurvival).toBe(0.3)
  })

  it('оптимум не гірший за рішення команди і є допустимим', () => {
    const best = optimizeAllocation(A, EV)
    const team = evaluateAllocation(A, EV, TEAM_ALLOCATION)
    expect(best.r.total).toBeGreaterThanOrEqual(team.total - 1e-9)
    expect(reserveOf(best.x)).toBeGreaterThanOrEqual(-1e-9)
  })
})
