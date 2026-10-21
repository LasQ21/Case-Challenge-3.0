import { describe, expect, it } from 'vitest'
import { DEFAULT_ASSUMPTIONS as A } from '../config'
import {
  ecomPlan,
  ecomToday,
  itDrift,
  itPlan,
  itRestructuring,
  itToday,
  portfolio,
  secPlan,
  secStatusQuo,
  secToday,
  secWaterfall,
} from '../valuation'

// Еталонні результати з PLAN.md 4.3, допуск ±0.5
const near = (actual: number, expected: number) => expect(Math.abs(actual - expected)).toBeLessThanOrEqual(0.5)

describe('Security Hardware', () => {
  it('сьогодні: акції 380, частка фонду 76.0', () => {
    const t = secToday(A)
    near(t.equity, 380)
    near(t.fund, 76)
  })

  it('статус-кво: 429.8 / 86.0 / 505.7 / 101.1', () => {
    const s = secStatusQuo(A)
    near(s.revenue, 429.8)
    near(s.ebitda, 86)
    near(s.equity, 505.7)
    near(s.fund, 101.1)
  })

  it('план: нова частка 22.05%', () => {
    expect(secPlan(A).ownership).toBeCloseTo(86 / 390, 6)
    near(secPlan(A).ownership * 100, 22.05)
  })

  it('план: 468.0 / 93.6 / 827.4 / 182.5', () => {
    const p = secPlan(A)
    near(p.revenue, 468)
    near(p.ebitda, 93.6)
    near(p.equity, 827.4)
    near(p.fund, 182.5)
  })

  it('розклад приросту: +10.1 · +61.9 · +10.4 · −1.1 = +81.3', () => {
    const w = secWaterfall(A)
    near(w.growth, 10.1)
    near(w.rerating, 61.9)
    near(w.stake, 10.4)
    near(w.debt, -1.1)
    near(w.growth + w.rerating + w.stake + w.debt, 81.3)
  })

  it('сума компонентів waterfall = fund_plan − fund_sq (і для інших припущень)', () => {
    const variants = [
      A,
      { ...A, sec: { ...A.sec, plan: { ...A.sec.plan, mult: 11, growth: 0.27, netDebtExit: 30 }, investment: 4 } },
      { ...A, sec: { ...A.sec, sq: { ...A.sec.sq, growth: 0.05 }, plan: { ...A.sec.plan, margin: 0.17 } } },
    ]
    for (const v of variants) {
      const w = secWaterfall(v)
      expect(w.growth + w.rerating + w.stake + w.debt).toBeCloseTo(w.plan - w.sq, 9)
    }
  })
})

describe('IT-інжиніринг', () => {
  it('сьогодні / дрейф / план: 38.9 / 22.5 / 50.4', () => {
    near(itToday(A).fund, 38.9)
    near(itDrift(A).fund, 22.5)
    near(itPlan(A).fund, 50.4)
  })

  it('арифметика скорочення 300 FTE', () => {
    const r = itRestructuring(A)
    near(r.costPerFte * 1000, 42.2) // $k на FTE
    near(r.savings, 12.7)
    near(r.computedEbitda, 29.7)
    expect(r.utilizationAfter).toBeCloseTo(2100 / 2700, 6)
  })
})

describe('E-commerce', () => {
  it('сьогодні / план (з поверненням бриджу): 7.5 / 21.6', () => {
    near(ecomToday(A).fund, 7.5)
    near(ecomPlan(A).fund, 21.6)
  })
})

describe('Портфель', () => {
  it('план ~254.5, статус-кво ~125.6, новий капітал 13 + резерв 2', () => {
    const p = portfolio(A)
    near(p.plan, 254.5)
    near(p.sq, 125.6)
    expect(p.newCapital).toBe(13)
    expect(p.reserve).toBe(2)
  })
})
