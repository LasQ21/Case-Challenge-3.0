import { useState } from 'react'
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { DEFAULT_EVENTS, EVENT_META, MC_LIMITS } from '../model/config'
import { EVENT_IDS, type McResult, type TornadoParam } from '../model/montecarlo'
import { int, money, num1, pct } from '../lib/format'
import { useLang } from '../lib/i18n'
import { useAppState } from '../state/context'
import { useMonteCarlo } from '../state/useMonteCarlo'
import { btnClass, Card, H3, LegendItem, PageIntro, Stat } from '../components/ui'
import { Info } from '../components/Info'
import { Slider } from '../components/Slider'
import { C } from '../components/chartColors'

// Англійські назви параметрів tornado (українські приходять із моделі)
const TORNADO_LABELS_EN: Record<TornadoParam, string> = {
  secGrowth: 'Security growth',
  secMargin: 'Security margin',
  secMult: 'Security multiple',
  itEbitda: 'IT EBITDA',
  itMult: 'IT multiple',
  ecomEbitda: 'E-com EBITDA',
}

export default function RisksPage() {
  const { state, set } = useAppState()
  const { t, lang } = useLang()
  const { result, ms, running } = useMonteCarlo({
    a: state.a,
    noise: state.noise,
    events: state.ev,
    runs: state.mc.runs,
    seed: state.mc.seed,
  })
  // повзунки ймовірностей сховані, доки їх не відкрити
  const [editProbs, setEditProbs] = useState(false)

  return (
    <div className="space-y-4">
      <PageIntro title={t('Ризики', 'Risks')}>
        {lang === 'en' ? (
          <>
            Monte Carlo
            <Info label="Monte Carlo">
              We replay the next 24 months thousands of times. Each run draws random values for the key assumptions and
              rolls the dice on every risk event, so we see the spread of outcomes, not one forecast.
            </Info>
            : {int(state.mc.runs)} random worlds with noise in the key parameters and discrete risk events. The plan and
            “do nothing” are computed on the same random numbers.
          </>
        ) : (
          <>
            Монте-Карло
            <Info label="Монте-Карло">
              Ми тисячі разів «програємо» наступні 24 місяці. У кожному прогоні ключові припущення випадково
              відхиляються, а ризик-події або стаються, або ні — тож видно розкид результатів, а не один прогноз.
            </Info>
            : {int(state.mc.runs)} випадкових світів із шумом у ключових параметрах і дискретними ризик-подіями. План і
            «без дій» рахуються на однакових випадкових числах.
          </>
        )}
      </PageIntro>

      <Card>
        <p className="text-xs text-muted" aria-live="polite">
          {running || !result
            ? t('Рахую…', 'Computing…')
            : t(
                `Пораховано ${int(result.runs)} ітерацій + tornado за ${Math.round(ms ?? 0)} мс.`,
                `Computed ${int(result.runs)} runs + tornado in ${Math.round(ms ?? 0)} ms.`,
              )}
        </p>
      </Card>

      {result ? <Results result={result} /> : <Card>{t('Рахую перший прогін…', 'Computing the first run…')}</Card>}

      <Card>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <H3
            info={t(
              'Ймовірність — наше припущення, як часто подія станеться за 24 місяці. «Спрацювала» — у якій частці змодельованих сценаріїв вона справді сталася.',
              'Probability is our assumption of how likely the event is within 24 months. “Fired” is the share of simulated scenarios in which it actually happened.',
            )}
          >
            {t('Ризик-події: ймовірності та частота спрацювання', 'Risk events: probabilities and how often they fired')}
          </H3>
          <button
            type="button"
            className={btnClass()}
            aria-expanded={editProbs}
            aria-controls="risk-events"
            onClick={() => setEditProbs(!editProbs)}
          >
            {t('Змінити ймовірності', 'Edit probabilities')}
          </button>
        </div>
        <p className="text-sm text-muted">
          {t(
            'Події незалежні. Ймовірності — припущення команди зі слайда ризиків; їх можна змінити.',
            'Events are independent. Probabilities are the team’s assumptions from the risk slide; you can change them.',
          )}
        </p>
        <ul id="risk-events" className="mt-2 divide-y divide-line">
          {EVENT_IDS.map((id) => {
            const meta = EVENT_META[id]
            const fired = result?.triggers.find((tr) => tr.id === id)?.freq
            const scope = [meta.appliesPlan && t('план', 'plan'), meta.appliesSq && t('без дій', 'do nothing')]
              .filter(Boolean)
              .join(' + ')
            const trigger = lang === 'en' ? meta.triggerEn : meta.trigger
            return (
              <li key={id} className="py-2">
                <div className="flex items-baseline justify-between gap-3">
                  <span className="text-sm font-semibold text-ink">{t(meta.label, meta.labelEn)}</span>
                  <span className="num shrink-0 text-xs text-muted">
                    {t('спрацювала', 'fired')}: {fired === undefined ? '…' : pct(fired)}
                    {!editProbs && ` · ${t('ймовірність', 'probability')} ${pct(state.ev[id].p, 0)}`}
                  </span>
                </div>
                <p className="text-xs text-muted">
                  {t(meta.effect, meta.effectEn)} · {t('діє на', 'affects')}: {scope}
                  {trigger ? (lang === 'en' ? ` · trigger: “${trigger}”` : ` · тригер: «${trigger}»`) : ''}
                </p>
                {editProbs && (
                  <Slider
                    label={t('Ймовірність', 'Probability')}
                    value={state.ev[id].p}
                    base={DEFAULT_EVENTS[id].p}
                    min={0}
                    max={1}
                    step={MC_LIMITS.eventProbStep}
                    format="pct"
                    onChange={(v) => set(`ev.${id}.p`, v)}
                  />
                )}
              </li>
            )
          })}
        </ul>
      </Card>
    </div>
  )
}

function Results({ result }: { result: McResult }) {
  const { t, lang } = useLang()
  const rows = [
    { label: t('План команди', 'Team plan'), s: result.plan, accent: true },
    { label: t('Без дій', 'Do nothing'), s: result.sq, accent: false },
  ]
  const hist = result.histogram.map((b) => ({ x: (b.from + b.to) / 2, plan: b.plan * 100, sq: b.sq * 100 }))
  const maxSwing = Math.max(...result.tornado.map((tr) => Math.max(Math.abs(tr.low), Math.abs(tr.high))), 1e-9)

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <Stat
            label={t('План кращий за «без дій»', 'Plan beats “do nothing”')}
            value={pct(result.probPlanBetter)}
            sub={t('частка сценаріїв', 'share of scenarios')}
            info={t(
              'У скількох змодельованих сценаріях план команди приносить фонду більше грошей, ніж якщо нічого не робити.',
              'In what share of simulated scenarios the team’s plan returns more money to the fund than doing nothing.',
            )}
            accent
          />
        </Card>
        <Card>
          <Stat
            label={t('Очікувано, план', 'Expected, plan')}
            value={money(result.plan.mean)}
            sub={`P10 ${money(result.plan.p10)}`}
            info={t(
              'Середні гроші фонду за планом по всіх сценаріях. P10 — поганий випадок: лише в 10% сценаріїв виходить менше.',
              'Average money returned to the fund under the plan across all scenarios. P10 is the bad case: only 10% of scenarios end lower.',
            )}
          />
        </Card>
        <Card>
          <Stat
            label={t('Очікуваний приріст', 'Expected gain')}
            value={money(result.plan.mean - result.sq.mean, { plus: true })}
            sub={`${t('без дій', 'do nothing')}: ${money(result.sq.mean)}`}
          />
        </Card>
      </div>

      <Card>
        <H3
          info={t(
            'Як часто трапляється кожен результат. Що вища смуга над сумою, то частіше фонд отримує приблизно стільки; зсув праворуч — краще.',
            'How often each outcome occurs. The taller the band above an amount, the more often the fund ends up with about that much; further right is better.',
          )}
        >
          {t('Розподіл грошей фонду, $m', 'Distribution of fund proceeds, $m')}
        </H3>
        <div
          className="mt-3 h-56 sm:h-64"
          role="img"
          aria-label={t(
            `Гістограма: план P50 ${num1(result.plan.p50)}, без дій P50 ${num1(result.sq.p50)}`,
            `Histogram: plan P50 ${num1(result.plan.p50)}, do nothing P50 ${num1(result.sq.p50)}`,
          )}
        >
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={hist} margin={{ top: 8, right: 8, left: -22, bottom: 0 }}>
              <XAxis
                dataKey="x"
                type="number"
                domain={['dataMin', 'dataMax']}
                tick={{ fontSize: 11 }}
                tickFormatter={(v: number) => v.toFixed(0)}
                tickCount={6}
              />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={(v: number) => `${v.toFixed(0)}%`} axisLine={false} />
              <Tooltip
                content={({ active, payload }) =>
                  active && payload?.length ? (
                    <div className="num rounded-md border border-line bg-surface px-2 py-1 text-xs text-ink">
                      ≈{money(payload[0].payload.x)}: {t('план', 'plan')} {payload[0].payload.plan.toFixed(1)}%,{' '}
                      {t('без дій', 'do nothing')} {payload[0].payload.sq.toFixed(1)}%
                    </div>
                  ) : null
                }
              />
              <Area
                type="step"
                dataKey="sq"
                stroke={C.sq}
                strokeDasharray="4 3"
                fill={C.sq}
                fillOpacity={0.3}
                isAnimationActive={false}
              />
              <Area type="step" dataKey="plan" stroke={C.plan} fill={C.plan} fillOpacity={0.35} isAnimationActive={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-2 flex flex-wrap gap-3">
          <LegendItem color={C.plan} label={t('План команди', 'Team plan')} />
          <LegendItem color={C.sq} label={t('Без дій (пунктир)', 'Do nothing (dashed)')} dashed />
        </div>
        <div className="mt-3 overflow-x-auto">
          <table className="num w-full min-w-[300px] text-sm">
            <thead>
              <tr className="text-left text-xs text-muted">
                <th className="py-1 font-normal">{t('Режим', 'Scenario')}</th>
                <th className="py-1 text-right font-normal">
                  <span className="inline-flex items-center">
                    P10
                    <Info label="P10 / P50 / P90">
                      {t(
                        'P10 — поганий випадок (90% сценаріїв кращі), P50 — типовий (середина), P90 — добрий (лише 10% сценаріїв кращі).',
                        'P10 is the bad case (90% of scenarios do better), P50 the typical one (the middle), P90 the good case (only 10% do better).',
                      )}
                    </Info>
                  </span>
                </th>
                <th className="py-1 text-right font-normal">P50</th>
                <th className="py-1 text-right font-normal">P90</th>
                <th className="py-1 text-right font-normal">{t('Середнє', 'Mean')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {rows.map((r) => (
                <tr key={r.label} className={r.accent ? 'font-semibold' : ''}>
                  <td className="py-1.5 text-ink">{r.label}</td>
                  <td className="py-1.5 text-right text-ink">{num1(r.s.p10)}</td>
                  <td className="py-1.5 text-right text-ink">{num1(r.s.p50)}</td>
                  <td className="py-1.5 text-right text-ink">{num1(r.s.p90)}</td>
                  <td className={`py-1.5 text-right ${r.accent ? 'text-accent-ink' : 'text-ink'}`}>{num1(r.s.mean)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card>
        <H3
          info={t(
            'Кожен рядок — одне припущення. Смуга показує, на скільки зміняться очікувані гроші фонду, якщо припущення виявиться трохи гіршим (−) або кращим (+) за базу. Довша смуга — важливіше припущення.',
            'Each row is one assumption. The bar shows how much the fund’s expected money moves if that assumption turns out somewhat worse (−) or better (+) than the base. A longer bar means a more important assumption.',
          )}
        >
          {t('Tornado: що найбільше рухає очікуваний результат плану', 'Tornado: what moves the plan’s expected result the most')}
        </H3>
        <p className="text-sm text-muted">
          {t(
            'Зсув середнього параметра на ±1σ (на тих самих випадкових числах), зміна очікуваних грошей, $m.',
            'Shift of the parameter’s mean by ±1σ (on the same random numbers); change in expected proceeds, $m.',
          )}
        </p>
        <ul className="mt-3 space-y-3">
          {result.tornado.map((tr) => (
            <li key={tr.id}>
              <div className="flex justify-between text-xs">
                <span className="text-ink">{lang === 'en' ? TORNADO_LABELS_EN[tr.id] : tr.label}</span>
                <span className="num text-muted">
                  −1σ: {num1(tr.low, { plus: true })} · +1σ: {num1(tr.high, { plus: true })}
                </span>
              </div>
              <div className="relative mt-1 h-3 rounded-full bg-surface-2" aria-hidden>
                <div className="absolute inset-y-0 left-1/2 w-px bg-ink/40" />
                {[tr.low, tr.high].map((v, k) => (
                  <div
                    key={k}
                    className={`absolute inset-y-0 rounded-full ${v >= 0 ? 'bar-fill' : 'bg-sq'}`}
                    style={{
                      left: v >= 0 ? '50%' : `${50 - (Math.abs(v) / maxSwing) * 50}%`,
                      width: `${(Math.abs(v) / maxSwing) * 50}%`,
                    }}
                  />
                ))}
              </div>
            </li>
          ))}
        </ul>
        <div className="mt-2 flex flex-wrap gap-3">
          <LegendItem color={C.plan} label={t('Збільшує (+)', 'Increases (+)')} />
          <LegendItem color={C.sq} label={t('Зменшує (−)', 'Decreases (−)')} />
        </div>
      </Card>
    </>
  )
}
