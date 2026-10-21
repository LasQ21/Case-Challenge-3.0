import { describe, expect, it } from 'vitest'
import { DEFAULT_ASSUMPTIONS as A, DEFAULT_EVENTS, DEFAULT_NOISE, type RiskEvents } from '../config'
import { EVENT_IDS, runMonteCarlo } from '../montecarlo'
import { portfolio } from '../valuation'

const base = { a: A, noise: DEFAULT_NOISE, events: DEFAULT_EVENTS, runs: 5000, seed: 42 }

const noEvents = Object.fromEntries(
  EVENT_IDS.map((id) => [id, { ...DEFAULT_EVENTS[id], p: 0 }]),
) as unknown as RiskEvents

describe('Монте-Карло', () => {
  it('однаковий seed → однаковий результат', () => {
    expect(runMonteCarlo(base)).toEqual(runMonteCarlo(base))
  })

  it('інший seed → інший результат', () => {
    expect(runMonteCarlo(base, false).plan.mean).not.toBe(runMonteCarlo({ ...base, seed: 43 }, false).plan.mean)
  })

  it('нульовий шум і нульові ймовірності → середнє = детермінований план', () => {
    const r = runMonteCarlo({ ...base, events: noEvents, noiseScale: 0, runs: 1000 })
    const p = portfolio(A)
    expect(r.plan.mean).toBeCloseTo(p.plan, 9)
    expect(r.sq.mean).toBeCloseTo(p.sq, 9)
    expect(r.plan.p10).toBeCloseTo(p.plan, 9)
    expect(r.probPlanBetter).toBe(1)
    for (const t of r.triggers) expect(t.freq).toBe(0)
  })

  it('частоти тригерів близькі до ймовірностей', () => {
    const r = runMonteCarlo({ ...base, runs: 20000 }, false)
    for (const t of r.triggers) expect(Math.abs(t.freq - DEFAULT_EVENTS[t.id].p)).toBeLessThan(0.015)
  })

  it('гістограма нормована, квантилі впорядковані', () => {
    const r = runMonteCarlo(base, false)
    const sumPlan = r.histogram.reduce((s, b) => s + b.plan, 0)
    const sumSq = r.histogram.reduce((s, b) => s + b.sq, 0)
    expect(sumPlan).toBeCloseTo(1, 9)
    expect(sumSq).toBeCloseTo(1, 9)
    expect(r.plan.p10).toBeLessThanOrEqual(r.plan.p50)
    expect(r.plan.p50).toBeLessThanOrEqual(r.plan.p90)
  })

  it('tornado: зростання мультиплікатора Security підвищує очікуване значення', () => {
    const r = runMonteCarlo(base)
    const mult = r.tornado.find((t) => t.id === 'secMult')!
    expect(mult.high).toBeGreaterThan(0)
    expect(mult.low).toBeLessThan(0)
  })

  it('план кращий за статус-кво у переважній більшості сценаріїв', () => {
    expect(runMonteCarlo(base, false).probPlanBetter).toBeGreaterThan(0.9)
  })
})
