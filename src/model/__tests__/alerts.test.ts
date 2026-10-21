import { describe, expect, it } from 'vitest'
import { evaluateAlerts, newAlerts, type KpiSnapshot } from '../alerts'

const ok: KpiSnapshot = {
  month: 5,
  it: { utilization: 0.72 },
  sec: { margin: 0.2, exportPermits: 'granted', euSerialProduction: true, programSpend: 4 },
  ecom: { moratorium: 'granted' },
}

const ids = (k: KpiSnapshot) => evaluateAlerts(k).map((a) => a.id)

describe('Board Alerts', () => {
  it('здорові KPI не дають тригерів', () => {
    expect(evaluateAlerts(ok)).toEqual([])
  })

  it('IT: утилізація 64% < 65% → продаж (текст як у PLAN.md)', () => {
    const a = evaluateAlerts({ ...ok, it: { utilization: 0.64 } })
    expect(a.map((x) => x.id)).toEqual(['itSell'])
    expect(a[0].text).toBe('IT: утилізація 64% < 65% → рекомендація: запускати продаж')
  })

  it('серійний випуск у ЄС перевіряється лише з міс. 12', () => {
    const sec = { ...ok.sec, euSerialProduction: false }
    expect(ids({ ...ok, month: 11, sec })).toEqual([])
    const a = evaluateAlerts({ ...ok, month: 12, sec })
    expect(a[0].text).toBe('Немає серійного випуску в ЄС на міс. 12 → заморозити транш 2')
  })

  it('маржа нижче плану мінус удар ЄС (18%)', () => {
    expect(ids({ ...ok, sec: { ...ok.sec, margin: 0.181 } })).toEqual([])
    expect(ids({ ...ok, sec: { ...ok.sec, margin: 0.175 } })).toEqual(['secMargin'])
  })

  it('перевитрати понад інвестицію + резерв ($12m)', () => {
    expect(ids({ ...ok, sec: { ...ok.sec, programSpend: 12 } })).toEqual([])
    expect(ids({ ...ok, sec: { ...ok.sec, programSpend: 12.5 } })).toEqual(['secOverrun'])
  })

  it('E-com: відмова кредиторів і спливання ліквідності', () => {
    expect(ids({ ...ok, ecom: { moratorium: 'refused' } })).toEqual(['ecomCreditors'])
    expect(ids({ ...ok, month: 5, ecom: { moratorium: 'pending' } })).toEqual([])
    expect(ids({ ...ok, month: 6, ecom: { moratorium: 'pending' } })).toEqual(['ecomLiquidity'])
  })

  it('newAlerts повертає лише нові тригери', () => {
    const prev = evaluateAlerts({ ...ok, it: { utilization: 0.6 } })
    const cur = evaluateAlerts({ ...ok, it: { utilization: 0.6 }, sec: { ...ok.sec, margin: 0.15 } })
    expect(newAlerts(prev, cur).map((a) => a.id)).toEqual(['secMargin'])
    expect(newAlerts(cur, cur)).toEqual([])
  })
})
