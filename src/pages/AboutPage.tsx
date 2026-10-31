import type { ReactNode } from 'react'
import {
  ALLOCATION_RULES,
  BENCHMARKS,
  CASE_DATA,
  COMPANY_IDS,
  COMPANY_NAMES,
  COMPANY_NAMES_EN,
  DEFAULT_ASSUMPTIONS as A,
  DEFAULT_NOISE as N,
  DISCLAIMER,
  DISCLAIMER_EN,
  EVENT_META,
  DEFAULT_EVENTS,
  FUND,
  LENS_LIMITS,
  MC_LIMITS,
  type CompanyId,
} from '../model/config'
import { EVENT_IDS } from '../model/montecarlo'
import { itRestructuring } from '../model/valuation'
import { int, money, mult, pct } from '../lib/format'
import { useLang } from '../lib/i18n'
import { Card, H3, PageIntro } from '../components/ui'
import { Info } from '../components/Info'

const F = ({ children }: { children: ReactNode }) => (
  <code className="block overflow-x-auto rounded-md bg-surface-2 px-3 py-2 text-[13px] text-ink">{children}</code>
)

// Факти кейсу англійською — у тому ж порядку, що й CASE_DATA[id].facts
const FACTS_EN: Record<CompanyId, readonly string[]> = {
  ecom: ['Lost 40% of warehouses', 'Delivery 2 → 5 days', 'Needs liquidity within 6 months'],
  it: ['~3,000 specialists', 'Utilisation 85% → 70%', 'Repositioning will take 12–18 months'],
  sec: ['95% of sales are international', '75% of production is in Ukraine', 'Expansion abroad will take 12–18 months'],
}

export default function AboutPage() {
  const { t, lang } = useLang()
  const en = lang === 'en'
  const it = itRestructuring(A)
  const requested = money(COMPANY_IDS.reduce((s, id) => s + CASE_DATA[id].request, 0))
  return (
    <div className="space-y-4 text-sm leading-relaxed text-ink">
      <PageIntro title={t('Про модель', 'About the model')}>
        {t(
          'Усі формули й припущення простим текстом: що рахує сайт, звідки цифри і де команда робила інтерпретації.',
          'All formulas and assumptions in plain text: what the site calculates, where the numbers come from and where the team made interpretations.',
        )}
      </PageIntro>

      <Card>
        <H3>{t('Задача', 'The problem')}</H3>
        <p className="mt-1">
          {en ? (
            <>
              A PE fund has to exit three companies within {FUND.horizonMonths} months. It has {money(FUND.freeCapital)} of free
              capital against requests for {requested}, and can run only one intensive value-creation programme. The goal is to
              maximise the money returned to the fund, adjusted for execution risk.
            </>
          ) : (
            <>
              PE-фонд має вийти з трьох компаній за {FUND.horizonMonths} місяці. Вільного капіталу — {money(FUND.freeCapital)} при
              запитах на {requested}; інтенсивну програму створення вартості можна вести лише одну. Мета — максимізувати гроші,
              повернені фонду, з урахуванням ризику виконання.
            </>
          )}
        </p>
      </Card>

      <Card>
        <H3>{t('Дані кейсу, $m', 'Case data, $m')}</H3>
        <div className="mt-2 overflow-x-auto">
          <table className="num w-full min-w-[480px]">
            <thead className="text-left text-xs text-muted">
              <tr>
                <th className="py-1 font-normal">{t('Компанія', 'Company')}</th>
                <th className="py-1 font-normal">{t('Виручка', 'Revenue')}</th>
                <th className="py-1 font-normal">
                  EBITDA
                  <Info label="EBITDA">
                    {t(
                      'Операційний прибуток до відсотків, податків і амортизації. Показує, скільки грошей заробляє сам бізнес, і є базою для оцінки компанії.',
                      'Operating profit before interest, taxes, depreciation and amortisation. It shows how much cash the business itself earns and is the base for valuing it.',
                    )}
                  </Info>
                </th>
                <th className="py-1 font-normal">{t('Чистий борг', 'Net debt')}</th>
                <th className="py-1 font-normal">{t('Частка', 'Stake')}</th>
                <th className="py-1 font-normal">{t('Запит', 'Request')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {COMPANY_IDS.map((id) => {
                const c = CASE_DATA[id]
                return (
                  <tr key={id}>
                    <td className="py-1">{en ? COMPANY_NAMES_EN[id] : COMPANY_NAMES[id]}</td>
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
              {en ? COMPANY_NAMES_EN[id] : COMPANY_NAMES[id]}: {(en ? FACTS_EN[id] : CASE_DATA[id].facts).join('; ')}.
            </li>
          ))}
        </ul>
      </Card>

      <Card>
        <H3>{t('Детермінована модель', 'Deterministic model')}</H3>
        {en ? (
          <div className="mt-2 space-y-2">
            <F>revenue_T = revenue_0 × (1 + growth)^years</F>
            <F>EBITDA_T = revenue_T × margin</F>
            <F>equity_T = EBITDA_T × multiple − net debt_T</F>
            <F>
              new stake = (equity_0 × stake_0 + I) / (equity_0 + I) — investment I at pre-money
              <PreMoneyInfo />
            </F>
            <F>fund proceeds = equity_T × stake (+ bridge repayment for E-com)</F>
          </div>
        ) : (
          <div className="mt-2 space-y-2">
            <F>виручка_T = виручка_0 × (1 + ріст)^роки</F>
            <F>EBITDA_T = виручка_T × маржа</F>
            <F>акції_T = EBITDA_T × мультиплікатор − чистий борг_T</F>
            <F>
              нова частка = (акції_0 × частка_0 + I) / (акції_0 + I) — інвестиція I за pre-money
              <PreMoneyInfo />
            </F>
            <F>гроші фонду = акції_T × частка (+ повернення бриджу для E-com)</F>
          </div>
        )}
        <p className="mt-3">
          {en ? (
            <>
              <strong>Security:</strong> today {mult(A.sec.multToday)}
              <MultipleInfo />; no action — growth {pct(A.sec.sq.growth, 0)}, margin {pct(A.sec.sq.margin, 0)},{' '}
              {mult(A.sec.sq.mult)}; under the plan — growth {pct(A.sec.plan.growth, 0)}, {mult(A.sec.plan.mult)}, net debt at exit{' '}
              {money(A.sec.plan.netDebtExit)}; investment {money(A.sec.investment)}, horizon {A.sec.years} years. Benchmark: median
              defence deal multiple ~{mult(BENCHMARKS.defenceDealMedianMult)} ({BENCHMARKS.defenceDealSource}).
            </>
          ) : (
            <>
              <strong>Security:</strong> сьогодні {mult(A.sec.multToday)}
              <MultipleInfo />; без дій — ріст {pct(A.sec.sq.growth, 0)}, маржа{' '}
              {pct(A.sec.sq.margin, 0)}, {mult(A.sec.sq.mult)}; за планом — ріст {pct(A.sec.plan.growth, 0)}, {mult(A.sec.plan.mult)}, чистий
              борг на виході {money(A.sec.plan.netDebtExit)}; інвестиція {money(A.sec.investment)}, горизонт {A.sec.years} роки.
              Орієнтир: медіана мультиплікаторів угод в обороні ~{mult(BENCHMARKS.defenceDealMedianMult)} ({BENCHMARKS.defenceDealSource}).
            </>
          )}
        </p>
        <p className="mt-2">
          {en ? (
            <>
              <strong>Security uplift breakdown</strong> (on the new stake): growth = (EBITDA_plan − EBITDA_no action) × mult_no action ×
              stake; re-rating = EBITDA_plan × (mult_plan − mult_no action) × stake; stake = equity_no action × (new − old stake); debt =
              −(debt_plan − debt_no action) × stake. The four components add up exactly to the plan − no action difference.
            </>
          ) : (
            <>
              <strong>Розклад приросту Security</strong> (на новій частці): ріст = (EBITDA_план − EBITDA_без дій) × мульт_без дій × частка;
              переоцінка = EBITDA_план × (мульт_план − мульт_без дій) × частка; частка = акції_без дій × (нова − стара частка); борг = −(борг_план −
              борг_без дій) × частка. Сума чотирьох компонентів точно дорівнює різниці план − без дій.
            </>
          )}
        </p>
        <p className="mt-2">
          {en ? (
            <>
              <strong>IT:</strong> fully loaded cost per FTE = (revenue − EBITDA) × {A.it.plan.costShareOfOpex} /{' '}
              {int(CASE_DATA.it.headcount)}. Cutting {A.it.plan.fteCut} FTE saves ≈{money(it.savings)}, minus{' '}
              {money(A.it.plan.reinvest)} reinvested in AI and sales ≈ {money(it.computedEbitda)}; utilisation after the plan ≈{' '}
              {pct(it.utilizationAfter)}; for the plan we conservatively take {money(A.it.plan.ebitda)} × {mult(A.it.plan.mult)}. No
              action — EBITDA {money(A.it.drift.ebitda)} × {mult(A.it.drift.mult)}.
            </>
          ) : (
            <>
              <strong>IT:</strong> повні витрати на FTE = (виручка − EBITDA) × {A.it.plan.costShareOfOpex} / {int(CASE_DATA.it.headcount)}.
              Скорочення {A.it.plan.fteCut} FTE дає ≈{money(it.savings)} економії, мінус {money(A.it.plan.reinvest)} реінвестицій в AI і продажі ≈{' '}
              {money(it.computedEbitda)}; утилізація після плану ≈ {pct(it.utilizationAfter)};
              за планом беремо консервативно {money(A.it.plan.ebitda)} × {mult(A.it.plan.mult)}. Без дій — EBITDA {money(A.it.drift.ebitda)} ×{' '}
              {mult(A.it.drift.mult)}.
            </>
          )}
        </p>
        <p className="mt-2">
          {en ? (
            <>
              <strong>E-com:</strong> no action — high probability of insolvency, fund proceeds ≈ {money(A.ecom.sq.fundValue)} (range{' '}
              {A.ecom.sq.fundMin}–{A.ecom.sq.fundMax}). Under the plan — EBITDA {money(A.ecom.plan.ebitda)} × {mult(A.ecom.plan.mult)}, net
              debt {money(CASE_DATA.ecom.netDebt)} + bridge {money(A.ecom.plan.bridge)}
              <BridgeInfo />; the bridge is repaid to the fund first.
            </>
          ) : (
            <>
              <strong>E-com:</strong> без дій — висока ймовірність неплатоспроможності, гроші фонду ≈ {money(A.ecom.sq.fundValue)} (діапазон{' '}
              {A.ecom.sq.fundMin}–{A.ecom.sq.fundMax}). За планом — EBITDA {money(A.ecom.plan.ebitda)} × {mult(A.ecom.plan.mult)}, чистий борг{' '}
              {money(CASE_DATA.ecom.netDebt)} + бридж {money(A.ecom.plan.bridge)}
              <BridgeInfo />; бридж повертається фонду першочергово.
            </>
          )}
        </p>
        <p className="mt-2">
          {en ? (
            <>
              <strong>MOIC on new capital</strong>
              <MoicInfo /> = (portfolio proceeds under the plan − no action) / new capital. The uplift also includes the IT
              restructuring, which needs no capital from the fund.
            </>
          ) : (
            <>
              <strong>MOIC на новий капітал</strong>
              <MoicInfo /> = (гроші портфеля за планом − без дій) / новий капітал. Приріст включає і
              реструктуризацію IT, яка капіталу фонду не потребує.
            </>
          )}
        </p>
      </Card>

      <Card>
        <H3>{t('Лінза пріоритетів', 'Priority lens')}</H3>
        <p className="mt-1">
          {en ? (
            <>
              Four criteria scored {LENS_LIMITS.scoreMin}–{LENS_LIMITS.scoreMax}; priority = product of the scores (in weighted mode — ∏
              score^weight, weights {LENS_LIMITS.weightMin}–{LENS_LIMITS.weightMax}). Robustness test: {int(LENS_LIMITS.robustnessRuns)}{' '}
              times, a random integer from [−{LENS_LIMITS.jitter}, +{LENS_LIMITS.jitter}] is added to every score, clipped to the bounds.
            </>
          ) : (
            <>
              Чотири критерії з оцінками {LENS_LIMITS.scoreMin}–{LENS_LIMITS.scoreMax}; пріоритет = добуток оцінок (у режимі ваг — ∏ оцінка^вага,
              ваги {LENS_LIMITS.weightMin}–{LENS_LIMITS.weightMax}). Тест стійкості: {int(LENS_LIMITS.robustnessRuns)} разів до кожної оцінки
              додається випадкове ціле з [−{LENS_LIMITS.jitter}, +{LENS_LIMITS.jitter}] з обрізанням до меж.
            </>
          )}
        </p>
      </Card>

      <Card>
        <H3
          info={t(
            'Метод, що тисячі разів прокручує модель із випадковими значеннями припущень і подіями ризику. Замість однієї цифри видно розподіл можливих результатів.',
            'A method that runs the model thousands of times with random assumption values and risk events. Instead of a single number you see the distribution of possible outcomes.',
          )}
        >
          {t('Монте-Карло', 'Monte Carlo')}
        </H3>
        <p className="mt-1">
          {en ? (
            <>
              By default {int(MC_LIMITS.defaultRuns)} iterations, seed {MC_LIMITS.defaultSeed} (mulberry32 generator — results are
              reproducible). Both modes run on the same random numbers.
            </>
          ) : (
            <>
              За замовчуванням {int(MC_LIMITS.defaultRuns)} ітерацій, seed {MC_LIMITS.defaultSeed} (генератор mulberry32 — результати
              відтворювані). Обидва режими рахуються на однакових випадкових числах.
            </>
          )}
        </p>
        <p className="mt-2">
          {en ? (
            <>
              Normal noise (σ): Security growth {pct(N.secGrowthSd, 1)}, margin {pct(N.secMarginSd, 1)}, multiple {mult(N.secMultSd)},
              clipped to [{mult(N.secMultMin)}, {mult(N.secMultMax)}]; IT EBITDA {money(N.itEbitdaSd)}, IT multiple {mult(N.itMultSd)};
              E-com EBITDA {money(N.ecomEbitdaSd)}. The E-com “no action” case is a triangular distribution on [{A.ecom.sq.fundMin},{' '}
              {A.ecom.sq.fundMax}] with mean {A.ecom.sq.fundValue}.
            </>
          ) : (
            <>
              Нормальний шум (σ): ріст Security {pct(N.secGrowthSd, 1)}, маржа {pct(N.secMarginSd, 1)}, мультиплікатор {mult(N.secMultSd)} з
              обрізанням до [{mult(N.secMultMin)}, {mult(N.secMultMax)}]; EBITDA IT {money(N.itEbitdaSd)}, мультиплікатор IT {mult(N.itMultSd)};
              EBITDA E-com {money(N.ecomEbitdaSd)}. «Без дій» для E-com — трикутний розподіл на [{A.ecom.sq.fundMin}, {A.ecom.sq.fundMax}] із
              середнім {A.ecom.sq.fundValue}.
            </>
          )}
        </p>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          {EVENT_IDS.map((id) => (
            <li key={id}>
              <strong>{en ? EVENT_META[id].labelEn : EVENT_META[id].label}</strong> — P {pct(DEFAULT_EVENTS[id].p, 0)}:{' '}
              {en ? EVENT_META[id].effectEn : EVENT_META[id].effect}.
            </li>
          ))}
        </ul>
        <p className="mt-2">
          Tornado
          <Info label="Tornado">
            {t(
              'Діаграма чутливості: показує, наскільки змінюється результат, якщо зсунути одне припущення. Найвпливовіші параметри — найдовші смуги вгорі.',
              'A sensitivity chart: it shows how much the result moves when a single assumption is shifted. The most influential parameters are the longest bars at the top.',
            )}
          </Info>
          {t(
            ': середнє кожного параметра зсувається на ±1σ, решта — без змін, на тих самих випадкових числах.',
            ': the mean of each parameter is shifted by ±1σ, everything else stays unchanged, on the same random numbers.',
          )}
        </p>
      </Card>

      <Card>
        <H3>{t('Розподіл $15m', 'Allocating $15m')}</H3>
        <p className="mt-1">
          {en ? (
            <>
              Security: plan uplift × min(I / {ALLOCATION_RULES.secFullProgram}, 1); beyond that, only a larger stake. E-com: bridge ≥{' '}
              {money(ALLOCATION_RULES.ecomBridgeThreshold)} → survival {pct(ALLOCATION_RULES.ecomSurvivalWithBridge, 0)}, otherwise{' '}
              {pct(ALLOCATION_RULES.ecomSurvivalWithout, 0)}. IT and the reserve — 1:1. The optimum is found by brute-force search in steps
              of {money(ALLOCATION_RULES.step)}.
            </>
          ) : (
            <>
              Security: приріст плану × min(I / {ALLOCATION_RULES.secFullProgram}, 1), понад це — лише більша частка. E-com: бридж ≥{' '}
              {money(ALLOCATION_RULES.ecomBridgeThreshold)} → виживання {pct(ALLOCATION_RULES.ecomSurvivalWithBridge, 0)}, інакше{' '}
              {pct(ALLOCATION_RULES.ecomSurvivalWithout, 0)}. IT і резерв — 1:1. Оптимум шукається перебором із кроком{' '}
              {money(ALLOCATION_RULES.step)}.
            </>
          )}
        </p>
      </Card>

      <Card>
        <H3>{t('Інтерпретації, які варто підтвердити', 'Interpretations to confirm')}</H3>
        {en ? (
          <ul className="mt-1 list-disc space-y-1 pl-5 text-muted">
            <li>
              The “Security programme cost overrun” event (P {pct(DEFAULT_EVENTS.overrun.p, 0)}, {money(DEFAULT_EVENTS.overrun.need)}) was
              added because the reserve is meant to “reduce overrun risk”; the figures are placeholders and can be changed on the “$15m”
              tab.
            </li>
            <li>
              On the “$15m” tab, Security growth and debt are scaled together with the multiple, so that $0 gives “no action” and $10m
              gives exactly the plan from the slides.
            </li>
            <li>On the “$15m” tab, E-com without a bridge is valued at 30% × plan value (≈$5.9m), which is above the “≈$2m” status quo.</li>
            <li>
              Events by mode: permit delays, EU margin, E-com creditors and the overrun apply to the plan only; the rest apply to both.
              Strike on a site: plan (with an EU hub) −7%, no action −15%.
            </li>
          </ul>
        ) : (
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
        )}
      </Card>

      <Card>
        <H3>{t('Джерела', 'Sources')}</H3>
        <ul className="mt-1 list-disc pl-5 text-muted">
          <li>
            Case Challenge 3.0 (SKELAR × Horizon Capital × Mastercard):{' '}
            {t('«Portfolio management under distress & uncertainty».', '“Portfolio management under distress & uncertainty”.')}
          </li>
          <li>
            {BENCHMARKS.defenceDealSource}: {t('медіана мультиплікаторів угод в обороні.', 'median defence deal multiple.')}
          </li>
          <li>
            {t(
              'Решта — припущення команди (вкладки «Сценарії», «Ризики», «$15m»).',
              'Everything else is the team’s assumptions (the “Scenarios”, “Risks” and “$15m” tabs).',
            )}
          </li>
        </ul>
        <p className="mt-3 font-semibold">{t(DISCLAIMER, DISCLAIMER_EN)}</p>
      </Card>
    </div>
  )
}

// Підказки до термінів — однакові для обох гілок тексту
function PreMoneyInfo() {
  const { t } = useLang()
  return (
    <Info label="pre-money">
      {t(
        'Оцінка компанії до вкладення нових грошей. Нова частка фонду залежить від того, скільки компанія коштує до інвестиції.',
        'The company’s valuation before the new money comes in. The fund’s new stake depends on what the company is worth before the investment.',
      )}
    </Info>
  )
}

function MultipleInfo() {
  const { t } = useLang()
  return (
    <Info label={t('мультиплікатор EV/EBITDA', 'EV/EBITDA multiple')}>
      {t(
        'У скільки разів вартість бізнесу (EV — акції плюс чистий борг) перевищує річну EBITDA. 6x означає, що покупець платить 6 річних EBITDA.',
        'How many times annual EBITDA a buyer pays for the business (EV — equity plus net debt). 6x means the buyer pays 6 years of EBITDA.',
      )}
    </Info>
  )
}

function BridgeInfo() {
  const { t } = useLang()
  return (
    <Info label={t('бридж', 'bridge')}>
      {t(
        'Короткострокова позика від фонду, яка дає компанії дожити до реструктуризації або продажу. Повертається раніше, ніж гроші отримують акціонери.',
        'A short-term loan from the fund that keeps the company alive until a restructuring or sale. It is repaid before shareholders receive anything.',
      )}
    </Info>
  )
}

function MoicInfo() {
  const { t } = useLang()
  return (
    <Info label="MOIC">
      {t(
        'Multiple on invested capital — скільки доларів повертається на кожен вкладений долар. 2.0x означає, що вкладене подвоїлося.',
        'Multiple on invested capital: how many dollars come back for each dollar invested. 2.0x means the money invested has doubled.',
      )}
    </Info>
  )
}
