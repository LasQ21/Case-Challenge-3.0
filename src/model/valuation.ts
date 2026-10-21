// Детермінована модель (PLAN.md, розділ 5). Усі функції чисті.
import { CASE_DATA, FUND, type Assumptions } from './config'

export interface Projection {
  revenue: number
  ebitda: number
  equity: number
}

export const projectRevenue = (revenue0: number, growth: number, years: number): number =>
  revenue0 * (1 + growth) ** years

export const equityValue = (ebitda: number, mult: number, netDebt: number): number =>
  ebitda * mult - netDebt

export function project(
  revenue0: number,
  growth: number,
  years: number,
  margin: number,
  mult: number,
  netDebt: number,
): Projection {
  const revenue = projectRevenue(revenue0, growth, years)
  const ebitda = revenue * margin
  return { revenue, ebitda, equity: equityValue(ebitda, mult, netDebt) }
}

// Нова частка фонду після інвестиції I за pre-money оцінкою equity0
export const ownershipAfter = (equity0: number, own0: number, investment: number): number =>
  (equity0 * own0 + investment) / (equity0 + investment)

// ── Security Hardware ───────────────────────────────────────────────────────

export function secToday(a: Assumptions) {
  const c = CASE_DATA.sec
  const equity = equityValue(c.ebitdaLast, a.sec.multToday, c.netDebt)
  return { equity, fund: equity * c.ownership }
}

export function secStatusQuo(a: Assumptions) {
  const s = a.sec.sq
  const p = project(CASE_DATA.sec.revenueLast, s.growth, a.sec.years, s.margin, s.mult, s.netDebt)
  return { ...p, ownership: CASE_DATA.sec.ownership, fund: p.equity * CASE_DATA.sec.ownership }
}

export function secPlan(a: Assumptions) {
  const s = a.sec.plan
  const today = secToday(a)
  const ownership = ownershipAfter(today.equity, CASE_DATA.sec.ownership, a.sec.investment)
  const p = project(CASE_DATA.sec.revenueLast, s.growth, a.sec.years, s.margin, s.mult, s.netDebtExit)
  return { ...p, ownership, fund: p.equity * ownership }
}

export interface Waterfall {
  sq: number
  growth: number
  rerating: number
  stake: number
  debt: number
  plan: number
}

// Розклад приросту частки фонду в Security (на новій частці, у порядку з розділу 5)
export function secWaterfall(a: Assumptions): Waterfall {
  const sq = secStatusQuo(a)
  const plan = secPlan(a)
  const own = plan.ownership
  return {
    sq: sq.fund,
    growth: (plan.ebitda - sq.ebitda) * a.sec.sq.mult * own,
    rerating: plan.ebitda * (a.sec.plan.mult - a.sec.sq.mult) * own,
    stake: sq.equity * (own - sq.ownership),
    debt: -(a.sec.plan.netDebtExit - a.sec.sq.netDebt) * own,
    plan: plan.fund,
  }
}

// ── IT-інжиніринг ───────────────────────────────────────────────────────────

export function itToday(a: Assumptions) {
  const c = CASE_DATA.it
  return { fund: equityValue(c.ebitdaLast, a.it.multToday, c.netDebt) * c.ownership }
}

export function itDrift(a: Assumptions) {
  const c = CASE_DATA.it
  return { fund: equityValue(a.it.drift.ebitda, a.it.drift.mult, c.netDebt) * c.ownership }
}

export function itPlan(a: Assumptions) {
  const c = CASE_DATA.it
  return { fund: equityValue(a.it.plan.ebitda, a.it.plan.mult, c.netDebt) * c.ownership }
}

// Довідкова арифметика плану скорочення (показується в UI, EBITDA плану задається окремо)
export function itRestructuring(a: Assumptions) {
  const c = CASE_DATA.it
  const p = a.it.plan
  const costPerFte = ((c.revenueLast - c.ebitdaLast) * p.costShareOfOpex) / c.headcount
  const savings = costPerFte * p.fteCut
  const billable = c.headcount * c.utilizationLast
  return {
    costPerFte,
    savings,
    computedEbitda: c.ebitdaLast + savings - p.reinvest,
    utilizationAfter: billable / (c.headcount - p.fteCut),
  }
}

// ── E-commerce ──────────────────────────────────────────────────────────────

export function ecomToday(a: Assumptions) {
  const c = CASE_DATA.ecom
  return { fund: equityValue(c.ebitdaLast, a.ecom.multToday, c.netDebt) * c.ownership }
}

export function ecomStatusQuo(a: Assumptions) {
  return { fund: a.ecom.sq.fundValue }
}

// Бридж стає боргом компанії й повертається фонду першочергово
export function ecomPlan(a: Assumptions) {
  const c = CASE_DATA.ecom
  const p = a.ecom.plan
  const equity = Math.max(0, equityValue(p.ebitda, p.mult, c.netDebt + p.bridge))
  return { equity, fund: equity * c.ownership + p.bridge }
}

// ── Портфель ────────────────────────────────────────────────────────────────

export function portfolio(a: Assumptions) {
  const sec = { sq: secStatusQuo(a).fund, plan: secPlan(a).fund, today: secToday(a).fund }
  const it = { sq: itDrift(a).fund, plan: itPlan(a).fund, today: itToday(a).fund }
  const ecom = { sq: ecomStatusQuo(a).fund, plan: ecomPlan(a).fund, today: ecomToday(a).fund }
  const plan = sec.plan + it.plan + ecom.plan
  const sq = sec.sq + it.sq + ecom.sq
  const newCapital = a.sec.investment + a.ecom.plan.bridge
  const reserve = FUND.freeCapital - newCapital
  return {
    sec,
    it,
    ecom,
    plan,
    sq,
    today: sec.today + it.today + ecom.today,
    newCapital,
    reserve,
    // QUESTION: приріст включає реструктуризацію IT, яка не потребує капіталу фонду.
    // Тут це «приріст вартості портфеля на $1 нового капіталу», як на слайді.
    moic: newCapital > 0 ? (plan - sq) / newCapital : null,
  }
}
