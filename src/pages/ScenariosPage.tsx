import { Bar, BarChart, Cell, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import {
  CASE_DATA,
  COMPANY_IDS,
  COMPANY_NAMES,
  DEFAULT_ASSUMPTIONS,
  FUND,
  SCENARIO_SLIDERS,
  type CompanyId,
} from '../model/config'
import { itRestructuring, portfolio, secPlan, secWaterfall } from '../model/valuation'
import { getPath } from '../lib/urlState'
import { int, money, mult, num1, pct } from '../lib/format'
import { useAppState } from '../state/context'
import { Card, H3, LegendItem, PageIntro, Stat } from '../components/ui'
import { Slider } from '../components/Slider'
import { C } from '../components/chartColors'

type Kind = 'total' | 'up' | 'down'

function waterfallData(w: ReturnType<typeof secWaterfall>) {
  const steps: { name: string; delta: number }[] = [
    { name: 'Ріст', delta: w.growth },
    { name: 'Переоц.', delta: w.rerating },
    { name: 'Частка', delta: w.stake },
    { name: 'Борг', delta: w.debt },
  ]
  const rows: { name: string; base: number; value: number; kind: Kind; label: string }[] = [
    { name: 'Без дій', base: 0, value: w.sq, kind: 'total', label: num1(w.sq) },
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
  rows.push({ name: 'План', base: 0, value: w.plan, kind: 'total', label: num1(w.plan) })
  return rows
}

const FILL: Record<Kind, string> = { total: C.ink, up: C.plan, down: C.sq }

export default function ScenariosPage() {
  const { state, set } = useAppState()
  const a = state.a
  const w = secWaterfall(a)
  const pf = portfolio(a)
  const data = waterfallData(w)
  const sec = secPlan(a)
  const it = itRestructuring(a)

  return (
    <div className="space-y-4">
      <PageIntro title="Сценарії">
        Звідки береться приріст частки фонду в Security і як змінюються гроші портфеля, якщо рухати припущення команди.
      </PageIntro>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <Stat
            label="Портфель: план vs без дій"
            value={`${money(pf.plan)} vs ${money(pf.sq)}`}
            sub={`Різниця ${money(pf.plan - pf.sq, { plus: true })} за ${FUND.horizonMonths} міс.`}
            accent
          />
        </Card>
        <Card>
          <Stat
            label={`MOIC на ${money(pf.newCapital)} нового капіталу`}
            value={pf.moic === null ? '—' : mult(pf.moic)}
            sub={`(план − без дій) / новий капітал; резерв ${money(pf.reserve)}`}
          />
        </Card>
      </div>

      <Card>
        <H3>Частка фонду в Security: без дій → план</H3>
        <p className="text-sm text-muted">
          Розклад на новій частці фонду {pct(sec.ownership, 2)}: ріст EBITDA, переоцінка мультиплікатора, більша частка
          після інвестиції та додатковий борг.
        </p>
        <div className="mt-3 h-64 sm:h-72" role="img" aria-label={`Waterfall: ${data.map((d) => `${d.name} ${d.label}`).join(', ')}`}>
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
          <LegendItem color={C.ink} label="Підсумок, $m" />
          <LegendItem color={C.plan} label="Додає вартість (+)" />
          <LegendItem color={C.sq} label="Забирає вартість (−)" />
        </div>
      </Card>

      <Card>
        <H3>Гроші фонду за компаніями, $m</H3>
        <div className="mt-2 overflow-x-auto">
          <table className="num w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-muted">
                <th className="py-1.5 font-normal">Компанія</th>
                <th className="py-1.5 text-right font-normal">Сьогодні</th>
                <th className="py-1.5 text-right font-normal">Без дій</th>
                <th className="py-1.5 text-right font-normal">План</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {COMPANY_IDS.map((id) => (
                <tr key={id}>
                  <td className="py-1.5 text-ink">{COMPANY_NAMES[id]}</td>
                  <td className="py-1.5 text-right text-muted">{num1(pf[id].today)}</td>
                  <td className="py-1.5 text-right text-ink">{num1(pf[id].sq)}</td>
                  <td className="py-1.5 text-right font-semibold text-ink">{num1(pf[id].plan)}</td>
                </tr>
              ))}
              <tr className="font-semibold">
                <td className="py-1.5 text-ink">Портфель</td>
                <td className="py-1.5 text-right text-muted">{num1(pf.today)}</td>
                <td className="py-1.5 text-right text-ink">{num1(pf.sq)}</td>
                <td className="py-1.5 text-right text-accent-ink">{num1(pf.plan)}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-xs text-muted">Для E-com план включає першочергове повернення бриджу.</p>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        {COMPANY_IDS.map((id) => (
          <Card key={id}>
            <H3>{COMPANY_NAMES[id]}</H3>
            <SliderGroup id={id} values={state} set={set} />
            {id === 'sec' && (
              <p className="mt-1 text-xs text-muted">
                Нова частка фонду: {pct(sec.ownership, 2)}; EBITDA на виході {money(sec.ebitda)}.
              </p>
            )}
            {id === 'it' && (
              <p className="mt-1 text-xs text-muted">
                Скорочення {int(a.it.plan.fteCut)} FTE × ≈${(it.costPerFte * 1000).toFixed(1)}k = економія{' '}
                {money(it.savings)}; мінус реінвестиції в AI і продажі {money(a.it.plan.reinvest)} → розрахунково{' '}
                {money(it.computedEbitda)}. Утилізація після плану ≈ {pct(it.utilizationAfter)}.
              </p>
            )}
            {id === 'ecom' && (
              <p className="mt-1 text-xs text-muted">
                Чистий борг за планом = {money(CASE_DATA.ecom.netDebt + a.ecom.plan.bridge)}{' '}
                (борг + бридж). Бридж повертається фонду першочергово.
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
  return (
    <div className="divide-y divide-line">
      {SCENARIO_SLIDERS[id].map((s) => (
        <Slider
          key={s.path}
          {...s}
          value={getPath(values, `a.${s.path}`) ?? 0}
          base={getPath(DEFAULT_ASSUMPTIONS, s.path)}
          onChange={(v) => set(`a.${s.path}`, v)}
        />
      ))}
    </div>
  )
}
