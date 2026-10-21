import { describe, expect, it } from 'vitest'
import { DEFAULT_LENS, DEFAULT_WEIGHTS } from '../config'
import { priorities, ranking, robustness } from '../lens'

describe('Лінза пріоритетів', () => {
  it('без шуму дає рівно 400 / 81 / 20', () => {
    expect(priorities(DEFAULT_LENS)).toEqual({ sec: 400, it: 81, ecom: 20 })
    expect(priorities(DEFAULT_LENS, DEFAULT_WEIGHTS)).toEqual({ sec: 400, it: 81, ecom: 20 })
  })

  it('ранжування: Security → IT → E-com', () => {
    expect(ranking(DEFAULT_LENS)).toEqual(['sec', 'it', 'ecom'])
  })

  it('ваги змінюють добуток як ∏ score^w', () => {
    const w = { ...DEFAULT_WEIGHTS, urgency: 2 }
    expect(priorities(DEFAULT_LENS, w).ecom).toBe(2 * 25 * 2 * 1)
  })

  it('тест стійкості відтворюваний і частки сумуються в 1', () => {
    const r1 = robustness(DEFAULT_LENS, undefined, 2000, 7)
    const r2 = robustness(DEFAULT_LENS, undefined, 2000, 7)
    expect(r1).toEqual(r2)
    expect(r1.sec + r1.it + r1.ecom).toBeCloseTo(1, 9)
    expect(r1.sec).toBeGreaterThan(0.9)
  })
})
