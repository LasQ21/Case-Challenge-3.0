import type { ReactNode } from 'react'
import {
  ALLOCATION_RULES,
  BENCHMARKS,
  CASE_DATA,
  COMPANY_IDS,
  COMPANY_NAMES,
  DEFAULT_ASSUMPTIONS as A,
  DEFAULT_NOISE as N,
  DISCLAIMER,
  EVENT_META,
  DEFAULT_EVENTS,
  FUND,
  LENS_LIMITS,
  MC_LIMITS,
} from '../model/config'
import { EVENT_IDS } from '../model/montecarlo'
import { itRestructuring } from '../model/valuation'
import { int, money, mult, pct } from '../lib/format'
import { Card, H3, PageIntro } from '../components/ui'

const F = ({ children }: { children: ReactNode }) => (
  <code className="block overflow-x-auto rounded-md bg-surface-2 px-3 py-2 text-[13px] text-ink">{children}</code>
)

export default function AboutPage() {
  const it = itRestructuring(A)
  return (
    <div className="space-y-4 text-sm leading-relaxed text-ink">
      <PageIntro title="Про модель">
        Усі формули й припущення простим текстом: що рахує сайт, звідки цифри і де команда робила інтерпретації.
      </PageIntro>

      <Card>
        <H3>Задача</H3>
        <p className="mt-1">
          PE-фонд має вийти з трьох компаній за {FUND.horizonMonths} місяці. Вільного капіталу — {money(FUND.freeCapital)} при
          запитах на {money(COMPANY_IDS.reduce((s, id) => s + CASE_DATA[id].request, 0))}; інтенсивну програму створення
          вартості можна вести лише одну. Мета — максимізувати гроші, повернені фонду, з урахуванням ризику виконання.
        </p>
      </Card>

      <Card>
        <H3>Дані кейсу, $m</H3>
        <div className="mt-2 overflow-x-auto">
          <table className="num w-full min-w-[480px]">
            <thead className="text-left text-xs text-muted">
              <tr>
                <th className="py-1 font-normal">Компанія</th>
                <th className="py-1 font-normal">Виручка</th>
                <th className="py-1 font-normal">EBITDA</th>
                <th className="py-1 font-normal">Чистий борг</th>
                <th className="py-1 font-normal">Частка</th>
                <th className="py-1 font-normal">Запит</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {COMPANY_IDS.map((id) => {
                const c = CASE_DATA[id]
                return (
                  <tr key={id}>
                    <td className="py-1">{COMPANY_NAMES[id]}</td>
                    <td className="py-1">
                      {c.revenuePrev} → {c.revenueLast}
                    </td>
                    <td className="py-1">
                      {c.ebitdaPrev} → {c.ebitdaLast}
                    </td>
                    <td className="py-1">{c.netDebt}</td>
                    <td className="py-1">{pct(c.ownership, 0)}</td>
                    <td className="py-1">{c.request}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <ul className="mt-2 list-disc pl-5 text-muted">
          {COMPANY_IDS.map((id) => (
            <li key={id}>
              {COMPANY_NAMES[id]}: {CASE_DATA[id].facts.join('; ')}.
            </li>
          ))}
        </ul>
      </Card>

      <Card>
        <H3>Детермінована модель</H3>
        <div className="mt-2 space-y-2">
          <F>виручка_T = виручка_0 × (1 + ріст)^роки</F>
          <F>EBITDA_T = виручка_T × маржа</F>
          <F>акції_T = EBITDA_T × мультиплікатор − чистий борг_T</F>
          <F>нова частка = (акції_0 × частка_0 + I) / (акції_0 + I) — інвестиція I за pre-money</F>
          <F>гроші фонду = акції_T × частка (+ повернення бриджу для E-com)</F>
        </div>
        <p className="mt-3">
          <strong>Security:</strong> сьогодні {mult(A.sec.multToday)}; без дій — ріст {pct(A.sec.sq.growth, 0)}, маржа{' '}
          {pct(A.sec.sq.margin, 0)}, {mult(A.sec.sq.mult)}; за планом — ріст {pct(A.sec.plan.growth, 0)}, {mult(A.sec.plan.mult)}, чистий
          борг на виході {money(A.sec.plan.netDebtExit)}; інвестиція {money(A.sec.investment)}, горизонт {A.sec.years} роки.
          Орієнтир: медіана мультиплікаторів угод в обороні ~{mult(BENCHMARKS.defenceDealMedianMult)} ({BENCHMARKS.defenceDealSource}).
        </p>
        <p className="mt-2">
          <strong>Розклад приросту Security</strong> (на новій частці): ріст = (EBITDA_план − EBITDA_без дій) × мульт_без дій × частка;
          переоцінка = EBITDA_план × (мульт_план − мульт_без дій) × частка; частка = акції_без дій × (нова − стара частка); борг = −(борг_план −
          борг_без дій) × частка. Сума чотирьох компонентів точно дорівнює різниці план − без дій.
        </p>
        <p className="mt-2">
          <strong>IT:</strong> повні витрати на FTE = (виручка − EBITDA) × {A.it.plan.costShareOfOpex} / {int(CASE_DATA.it.headcount)}.
          Скорочення {A.it.plan.fteCut} FTE дає ≈{money(it.savings)} економії, мінус {money(A.it.plan.reinvest)} реінвестицій в AI і продажі ≈{' '}
          {money(it.computedEbitda)}; утилізація після плану ≈ {pct(it.utilizationAfter)};
          за планом беремо консервативно {money(A.it.plan.ebitda)} × {mult(A.it.plan.mult)}. Без дій — EBITDA {money(A.it.drift.ebitda)} ×{' '}
          {mult(A.it.drift.mult)}.
        </p>
        <p className="mt-2">
          <strong>E-com:</strong> без дій — висока ймовірність неплатоспроможності, гроші фонду ≈ {money(A.ecom.sq.fundValue)} (діапазон{' '}
          {A.ecom.sq.fundMin}–{A.ecom.sq.fundMax}). За планом — EBITDA {money(A.ecom.plan.ebitda)} × {mult(A.ecom.plan.mult)}, чистий борг{' '}
          {money(CASE_DATA.ecom.netDebt)} + бридж {money(A.ecom.plan.bridge)}; бридж повертається фонду першочергово.
        </p>
        <p className="mt-2">
          <strong>MOIC на новий капітал</strong> = (гроші портфеля за планом − без дій) / новий капітал. Приріст включає і
          реструктуризацію IT, яка капіталу фонду не потребує.
        </p>
      </Card>

      <Card>
        <H3>Лінза пріоритетів</H3>
        <p className="mt-1">
          Чотири критерії з оцінками {LENS_LIMITS.scoreMin}–{LENS_LIMITS.scoreMax}; пріоритет = добуток оцінок (у режимі ваг — ∏ оцінка^вага,
          ваги {LENS_LIMITS.weightMin}–{LENS_LIMITS.weightMax}). Тест стійкості: {int(LENS_LIMITS.robustnessRuns)} разів до кожної оцінки
          додається випадкове ціле з [−{LENS_LIMITS.jitter}, +{LENS_LIMITS.jitter}] з обрізанням до меж.
        </p>
      </Card>

      <Card>
        <H3>Монте-Карло</H3>
        <p className="mt-1">
          За замовчуванням {int(MC_LIMITS.defaultRuns)} ітерацій, seed {MC_LIMITS.defaultSeed} (генератор mulberry32 — результати
          відтворювані). Обидва режими рахуються на однакових випадкових числах.
        </p>
        <p className="mt-2">
          Нормальний шум (σ): ріст Security {pct(N.secGrowthSd, 1)}, маржа {pct(N.secMarginSd, 1)}, мультиплікатор {mult(N.secMultSd)} з
          обрізанням до [{mult(N.secMultMin)}, {mult(N.secMultMax)}]; EBITDA IT {money(N.itEbitdaSd)}, мультиплікатор IT {mult(N.itMultSd)};
          EBITDA E-com {money(N.ecomEbitdaSd)}. «Без дій» для E-com — трикутний розподіл на [{A.ecom.sq.fundMin}, {A.ecom.sq.fundMax}] із
          середнім {A.ecom.sq.fundValue}.
        </p>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          {EVENT_IDS.map((id) => (
            <li key={id}>
              <strong>{EVENT_META[id].label}</strong> — P {pct(DEFAULT_EVENTS[id].p, 0)}: {EVENT_META[id].effect}.
            </li>
          ))}
        </ul>
        <p className="mt-2">Tornado: середнє кожного параметра зсувається на ±1σ, решта — без змін, на тих самих випадкових числах.</p>
      </Card>

      <Card>
        <H3>Розподіл $15m</H3>
        <p className="mt-1">
          Security: приріст плану × min(I / {ALLOCATION_RULES.secFullProgram}, 1), понад це — лише більша частка. E-com: бридж ≥{' '}
          {money(ALLOCATION_RULES.ecomBridgeThreshold)} → виживання {pct(ALLOCATION_RULES.ecomSurvivalWithBridge, 0)}, інакше{' '}
          {pct(ALLOCATION_RULES.ecomSurvivalWithout, 0)}. IT і резерв — 1:1. Оптимум шукається перебором із кроком{' '}
          {money(ALLOCATION_RULES.step)}.
        </p>
      </Card>

      <Card>
        <H3>Інтерпретації, які варто підтвердити</H3>
        <ul className="mt-1 list-disc space-y-1 pl-5 text-muted">
          <li>
            Подія «перевитрати програми Security» (P {pct(DEFAULT_EVENTS.overrun.p, 0)}, {money(DEFAULT_EVENTS.overrun.need)}) додана, бо
            резерв має «знижувати ризик перевитрат»; цифри — заглушка, їх можна змінити на вкладці «$15m».
          </li>
          <li>
            На вкладці «$15m» разом із мультиплікатором масштабуються також ріст і борг Security — щоб $0 давало «без дій», а $10m — рівно
            план зі слайдів.
          </li>
          <li>E-com без бриджу у вкладці «$15m» оцінюється як 30% × вартість плану (≈$5.9m), що вище за «≈$2m» статус-кво.</li>
          <li>
            Розподіл подій між режимами: затримка дозволів, маржа ЄС, кредитори E-com і перевитрати — лише план; решта — обидва. Удар по
            майданчику: план (з хабом у ЄС) −7%, без дій −15%.
          </li>
        </ul>
      </Card>

      <Card>
        <H3>Джерела</H3>
        <ul className="mt-1 list-disc pl-5 text-muted">
          <li>Case Challenge 3.0 (SKELAR × Horizon Capital × Mastercard): «Portfolio management under distress & uncertainty».</li>
          <li>{BENCHMARKS.defenceDealSource}: медіана мультиплікаторів угод в обороні.</li>
          <li>Решта — припущення команди (вкладки «Сценарії», «Ризики», «$15m»).</li>
        </ul>
        <p className="mt-3 font-semibold">{DISCLAIMER}</p>
      </Card>
    </div>
  )
}
