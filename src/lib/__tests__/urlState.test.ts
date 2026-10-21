import { describe, expect, it } from 'vitest'
import { DEFAULT_STATE, decodeState, encodeState, flatten, setPath, type AppState } from '../urlState'
import { mulberry32 } from '../../model/rng'

describe('Стан у URL', () => {
  it('базовий сценарій кодується в порожній рядок', () => {
    expect(encodeState(DEFAULT_STATE)).toBe('')
    expect(decodeState('')).toEqual(DEFAULT_STATE)
  })

  it('кодування і декодування повертає той самий стан', () => {
    let s: AppState = { ...DEFAULT_STATE, tab: 'risks' }
    s = setPath(s, 'a.sec.plan.mult', 10.5)
    s = setPath(s, 'ev.ceasefire.p', 0.4)
    s = setPath(s, 'lens.ecom.urgency', 3)
    s = setPath(s, 'mc.seed', 7)
    s = setPath(s, 'alloc.it', 1.5)
    expect(decodeState(encodeState(s))).toEqual(s)
  })

  it('випадкові стани переживають round-trip', () => {
    const rng = mulberry32(3)
    const paths = flatten(DEFAULT_STATE).map(([p]) => p)
    for (let i = 0; i < 200; i++) {
      let s: AppState = DEFAULT_STATE
      for (let k = 0; k < 5; k++) {
        s = setPath(s, paths[Math.floor(rng() * paths.length)], Math.round(rng() * 1000) / 100)
      }
      expect(decodeState(encodeState(s))).toEqual(s)
    }
  })

  it('ігнорує сміття в URL', () => {
    const s = decodeState('?a.sec.plan.mult=abc&evil=1&tab=hack&a.sec=3')
    expect(s).toEqual(DEFAULT_STATE)
  })
})
