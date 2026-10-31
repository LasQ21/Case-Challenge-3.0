import { Bar, BarChart, Cell, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import {
  CASE_DATA,
  COMPANY_IDS,
  COMPANY_NAMES,
  COMPANY_NAMES_EN,
  DEFAULT_ASSUMPTIONS,
  FUND,
  SCENARIO_SLIDERS,
  type CompanyId,
} from '../model/config'
import { itRestructuring, portfolio, secPlan, secWaterfall } from '../model/valuation'
import { getPath } from '../lib/urlState'
import { int, money, mult, num1, pct } from '../lib/format'
import { useLang } from '../lib/i18n'
import { useAppState } from '../state/context'
import { Card, H3, LegendItem, PageIntro, Stat } from '../components/ui'
import { Slider } from '../components/Slider'
import { C } from '../components/chartColors'

type Kind = 'total' | 'up' | 'down'

type T = (uk: string, en: string) => string

function waterfallData(w: ReturnType<typeof secWaterfall>, t: T) {
  const steps: { name: string; delta: number }[] = [
    { name: t('Ріст', 'Growth'), delta: w.growth },
    { name: t('Переоц.', 'Re-rating'), delta: w.rerating },
    { name: t('Частка', 'Stake'), delta: w.stake },
    { name: t('Борг', 'Debt'), delta: w.debt },
  ]
  const rows: { name: string; base: number; value: number; kind: Kind; label: string }[] = [
    { name: t('Без дій', 'No action'), base: 0, value: w.sq, kind: 'total', label: num1(w.sq) },
  ]
  let run = w.sq
  for (const s of steps) {
    const next = run + s.delta
    rows.push({
      name: s.name,
      base: Math.min(run, next),
      value: Math.abs(s.delta),
      kind: s.delta >= 0 ? 'up' : 'down',
      label: num1(s.delta, { plus: true }),
    })
    run = next
  }
  rows.push({ name: t('План', 'Plan'), base: 0, value: w.plan, kind: 'total', label: num1(w.plan) })
  return rows
}

const FILL: Record<Kind, string> = { total: C.ink, up: C.plan, down: C.sq }

export default function ScenariosPage() {
  const { state, set } = useAppState()
  const { t, lang } = useLang()
  const names = lang === 'en' ? COMPANY_NAMES_EN : COMPANY_NAMES
  const a = state.a
  const w = secWaterfall(a)
  const pf = portfolio(a)
  const data = waterfallData(w, t)
  const sec = secPlan(a)
  const it = itRestructuring(a)

  return (
    <div className="space-y-4">
      <PageIntro title={t('Сценарії', 'Scenarios')}>
        {t(
          'Звідки береться приріст частки фонду в Security і як змінюються гроші портфеля, якщо рухати припущення команди.',
          'Where the gain in the fund’s Security stake comes from, and how portfolio value moves as you change the team’s assumptions.',
        )}
      </PageIntro>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <Stat
            label={t('Портфель: план vs без дій', 'Portfolio: plan vs no action')}
            value={`${money(pf.plan)} vs ${money(pf.sq)}`}
            sub={t(
              `Різниця ${money(pf.plan - pf.sq, { plus: true })} за ${FUND.horizonMonths} міс.`,
              `Difference ${money(pf.plan - pf.sq, { plus: true })} over ${FUND.horizonMonths} months`,
            )}
            info={t(
              'Скільки коштуватимуть частки фонду в трьох компаніях через 24 міс., якщо виконати план, і скільки — якщо нічого не робити.',
              'What the fund’s stakes in the three companies will be worth in 24 months if the plan is carried out, versus if nothing is done.',
            )}
            accent
          />
        </Card>
        <Card>
          <Stat
            label={t(`MOIC на ${money(pf.newCapital)} нового капіталу`, `MOIC on ${money(pf.newCapital)} of new capital`)}
            value={pf.moic === null ? '—' : mult(pf.moic)}
            sub={t(
              `(план − без дій) / новий капітал; резерв ${money(pf.reserve)}`,
              `(plan − no action) / new capital; reserve ${money(pf.reserve)}`,
            )}
            info={t(
              'MOIC — у скільки разів зростають вкладені гроші. Тут: скільки вартості додає план на кожен новий долар фонду; 3.0x — $3 на $1.',
              'MOIC (multiple on invested capital) shows how many times the money invested grows. Here: value the plan adds per new fund dollar; 3.0x means $3 per $1.',
            )}
          />
        </Card>
      </div>

      <Card>
        <H3
          info={
            lang === 'en' ? (
              <>
                How the stake value gets from “no action” to “plan”, step by step:
                <br />
                <strong>Growth</strong> — the company earns more (higher EBITDA, i.e. operating profit).
                <br />
                <strong>Re-rating</strong> — a buyer pays a higher multiple for each dollar of profit.
                <br />
                <strong>Stake</strong> — after investing, the fund owns a bigger share.
                <br />
                <strong>Debt</strong> — extra borrowing belongs to the lenders, so it lowers the owners’ part.
              </>
            ) : (
              <>
                Як вартість частки доходить від «без дій» до «плану», крок за кроком:
                <br />
                <strong>Ріст</strong> — компанія заробляє більше (вища EBITDA, тобто операційний прибуток).
                <br />
                <strong>Переоц.</strong> — покупець платить вищий мультиплікатор за кожен долар прибутку.
                <br />
                <strong>Частка</strong> — після інвестиції фонду належить більша частина компанії.
                <br />
                <strong>Борг</strong> — додатковий борг належить кредиторам, тож зменшує частину власників.
              </>
            )
          }
        >
          {t('Частка фонду в Security: без дій → план', 'Fund’s stake in Security: no action → plan')}
        </H3>
        <p className="text-sm text-muted">
          {t(
            `Розклад на новій частці фонду ${pct(sec.ownership, 2)}: ріст EBITDA, переоцінка мультиплікатора, більша частка після інвестиції та додатковий борг.`,
            `Breakdown at the fund’s new ${pct(sec.ownership, 2)} stake: EBITDA growth, multiple re-rating, a larger stake after the investment, and additional debt.`,
          )}
        </p>
        <div
          className="mt-3 h-64 sm:h-72"
          role="img"
          aria-label={`${t('Водоспад', 'Waterfall')}: ${data.map((d) => `${d.name} ${d.label}`).join(', ')}`}
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 22, right: 4, left: -18, bottom: 0 }}>
              <XAxis dataKey="name" interval={0} tick={{ fontSize: 11 }} tickLine={false} />
              <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
              <Tooltip
                cursor={{ fill: 'var(--accent-soft)' }}
                content={({ active, payload }) =>
                  active && payload?.length ? (
                    <div className="rounded-md border border-line bg-surface px-2 py-1 text-xs text-ink">
                      {payload[0].payload.name}: {payload[0].payload.label} $m
                    </div>
                  ) : null
                }
              />
              <Bar dataKey="base" stackId="w" fill="transparent" isAnimationActive={false} />
              <Bar dataKey="value" stackId="w" isAnimationActive={false} radius={[3, 3, 0, 0]}>
                {data.map((d) => (
                  <Cell key={d.name} fill={FILL[d.kind]} />
                ))}
                <LabelList dataKey="label" position="top" style={{ fontSize: 11, fill: 'var(--ink)', fontWeight: 600 }} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-2 flex flex-wrap gap-3">
          <LegendItem color={C.ink} label={t('Підсумок, $m', 'Total, $m')} />
          <LegendItem color={C.plan} label={t('Додає вартість (+)', 'Adds value (+)')} />
          <LegendItem color={C.sq} label={t('Забирає вартість (−)', 'Takes value (−)')} />
        </div>
      </Card>

      <Card>
        <H3>{t('Гроші фонду за компаніями, $m', 'Fund value by company, $m')}</H3>
        <div className="mt-2 overflow-x-auto">
          <table className="num w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-muted">
                <th className="py-1.5 font-normal">{t('Компанія', 'Company')}</th>
                <th className="py-1.5 text-right font-normal">{t('Сьогодні', 'Today')}</th>
                <th className="py-1.5 text-right font-normal">{t('Без дій', 'No action')}</th>
                <th className="py-1.5 text-right font-normal">{t('План', 'Plan')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {COMPANY_IDS.map((id) => (
                <tr key={id}>
                  <td className="py-1.5 text-ink">{names[id]}</td>
                  <td className="py-1.5 text-right text-muted">{num1(pf[id].today)}</td>
                  <td className="py-1.5 text-right text-ink">{num1(pf[id].sq)}</td>
                  <td className="py-1.5 text-right font-semibold text-ink">{num1(pf[id].plan)}</td>
                </tr>
              ))}
              <tr className="font-semibold">
                <td className="py-1.5 text-ink">{t('Портфель', 'Portfolio')}</td>
                <td className="py-1.5 text-right text-muted">{num1(pf.today)}</td>
                <td className="py-1.5 text-right text-ink">{num1(pf.sq)}</td>
                <td className="py-1.5 text-right text-accent-ink">{num1(pf.plan)}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-xs text-muted">
          {t(
            'Для E-com план включає першочергове повернення бриджу.',
            'For E-com, the plan includes repaying the bridge loan first.',
          )}
        </p>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        {COMPANY_IDS.map((id) => (
          <Card key={id}>
            <H3>{names[id]}</H3>
            <SliderGroup id={id} values={state} set={set} />
            {id === 'sec' && (
              <p className="mt-1 text-xs text-muted">
                {t(
                  `Нова частка фонду: ${pct(sec.ownership, 2)}; EBITDA на виході ${money(sec.ebitda)}.`,
                  `Fund’s new stake: ${pct(sec.ownership, 2)}; exit EBITDA ${money(sec.ebitda)}.`,
                )}
              </p>
            )}
            {id === 'it' && (
              <p className="mt-1 text-xs text-muted">
                {t(
                  `Скорочення ${int(a.it.plan.fteCut)} FTE × ≈$${(it.costPerFte * 1000).toFixed(1)}k = економія ${money(it.savings)}; мінус реінвестиції в AI і продажі ${money(a.it.plan.reinvest)} → розрахунково ${money(it.computedEbitda)}. Утилізація після плану ≈ ${pct(it.utilizationAfter)}.`,
                  `Cutting ${int(a.it.plan.fteCut)} FTE × ≈$${(it.costPerFte * 1000).toFixed(1)}k = ${money(it.savings)} saved; minus ${money(a.it.plan.reinvest)} reinvested in AI and sales → implied EBITDA ${money(it.computedEbitda)}. Utilisation after the plan ≈ ${pct(it.utilizationAfter)}.`,
                )}
              </p>
            )}
            {id === 'ecom' && (
              <p className="mt-1 text-xs text-muted">
                {t(
                  `Чистий борг за планом = ${money(CASE_DATA.ecom.netDebt + a.ecom.plan.bridge)} (борг + бридж). Бридж повертається фонду першочергово.`,
                  `Net debt under the plan = ${money(CASE_DATA.ecom.netDebt + a.ecom.plan.bridge)} (debt + bridge). The bridge is repaid to the fund first.`,
                )}
              </p>
            )}
          </Card>
        ))}
      </div>
    </div>
  )
}

function SliderGroup({
  id,
  values,
  set,
}: {
  id: CompanyId
  values: object
  set: (path: string, v: number) => void
}) {
  const { lang } = useLang()
  const en = lang === 'en'
  return (
    <div className="divide-y divide-line">
      {SCENARIO_SLIDERS[id].map((s) => (
        <Slider
          key={s.path}
          label={en ? s.labelEn : s.label}
          info={en ? s.infoEn : s.info}
          min={s.min}
          max={s.max}
          step={s.step}
          format={s.format}
          benchmark={s.benchmark && { value: s.benchmark.value, label: en ? s.benchmark.labelEn : s.benchmark.label }}
          value={getPath(values, `a.${s.path}`) ?? 0}
          base={getPath(DEFAULT_ASSUMPTIONS, s.path)}
          onChange={(v) => set(`a.${s.path}`, v)}
        />
      ))}
    </div>
  )
}
