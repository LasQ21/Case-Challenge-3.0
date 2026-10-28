import { useId } from 'react'
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { DEFAULT_EVENTS, EVENT_META, MC_LIMITS } from '../model/config'
import { EVENT_IDS, type McResult } from '../model/montecarlo'
import { int, money, num1, pct } from '../lib/format'
import { useAppState } from '../state/context'
import { useMonteCarlo } from '../state/useMonteCarlo'
import { Card, H3, LegendItem, PageIntro, Stat } from '../components/ui'
import { Slider } from '../components/Slider'
import { C } from '../components/chartColors'

export default function RisksPage() {
  const { state, set } = useAppState()
  const { result, ms, running } = useMonteCarlo({
    a: state.a,
    noise: state.noise,
    events: state.ev,
    runs: state.mc.runs,
    seed: state.mc.seed,
  })
  const seedId = useId()

  return (
    <div className="space-y-4">
      <PageIntro title="Ризики">
        Монте-Карло: {int(state.mc.runs)} випадкових світів із шумом у ключових параметрах і дискретними ризик-подіями.
        План і «без дій» рахуються на однакових випадкових числах.
      </PageIntro>

      <Card>
        <div className="grid gap-x-6 sm:grid-cols-[1fr_auto] sm:items-end">
          <Slider
            label="Кількість ітерацій"
            value={state.mc.runs}
            base={MC_LIMITS.defaultRuns}
            min={MC_LIMITS.minRuns}
            max={MC_LIMITS.maxRuns}
            step={MC_LIMITS.runsStep}
            format="int"
            onChange={(v) => set('mc.runs', v)}
          />
          <div className="flex items-center gap-2 py-2">
            <label htmlFor={seedId} className="text-sm text-ink">
              Seed
            </label>
            <input
              id={seedId}
              type="number"
              inputMode="numeric"
              value={state.mc.seed}
              onChange={(e) => {
                const v = Math.trunc(Number(e.target.value))
                if (Number.isFinite(v)) set('mc.seed', v)
              }}
              className="num h-9 w-24 rounded-xl border border-line bg-surface-2 px-3 text-sm text-ink"
            />
          </div>
        </div>
        <p className="text-xs text-muted" aria-live="polite">
          {running || !result ? 'Рахую…' : `Пораховано ${int(result.runs)} ітерацій + tornado за ${Math.round(ms ?? 0)} мс.`}
        </p>
      </Card>

      {result ? <Results result={result} /> : <Card>Рахую перший прогін…</Card>}

      <Card>
        <H3>Ризик-події: ймовірності та частота спрацювання</H3>
        <p className="text-sm text-muted">Події незалежні. Ймовірності — припущення команди зі слайда ризиків; їх можна змінити.</p>
        <ul className="mt-2 divide-y divide-line">
          {EVENT_IDS.map((id) => {
            const meta = EVENT_META[id]
            const fired = result?.triggers.find((t) => t.id === id)?.freq
            const scope = [meta.appliesPlan && 'план', meta.appliesSq && 'без дій'].filter(Boolean).join(' + ')
            return (
              <li key={id} className="py-2">
                <div className="flex items-baseline justify-between gap-3">
                  <span className="text-sm font-semibold text-ink">{meta.label}</span>
                  <span className="num shrink-0 text-xs text-muted">
                    спрацювала: {fired === undefined ? '…' : pct(fired)}
                  </span>
                </div>
                <p className="text-xs text-muted">
                  {meta.effect} · діє на: {scope}
                  {meta.trigger ? ` · тригер: «${meta.trigger}»` : ''}
                </p>
                <Slider
                  label="Ймовірність"
                  value={state.ev[id].p}
                  base={DEFAULT_EVENTS[id].p}
                  min={0}
                  max={1}
                  step={MC_LIMITS.eventProbStep}
                  format="pct"
                  onChange={(v) => set(`ev.${id}.p`, v)}
                />
              </li>
            )
          })}
        </ul>
      </Card>
    </div>
  )
}

function Results({ result }: { result: McResult }) {
  const rows = [
    { label: 'План команди', s: result.plan, accent: true },
    { label: 'Без дій', s: result.sq, accent: false },
  ]
  const hist = result.histogram.map((b) => ({ x: (b.from + b.to) / 2, plan: b.plan * 100, sq: b.sq * 100 }))
  const maxSwing = Math.max(...result.tornado.map((t) => Math.max(Math.abs(t.low), Math.abs(t.high))), 1e-9)

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <Stat label="План кращий за «без дій»" value={pct(result.probPlanBetter)} sub="частка сценаріїв" accent />
        </Card>
        <Card>
          <Stat label="Очікувано, план" value={money(result.plan.mean)} sub={`P10 ${money(result.plan.p10)}`} />
        </Card>
        <Card>
          <Stat
            label="Очікуваний приріст"
            value={money(result.plan.mean - result.sq.mean, { plus: true })}
            sub={`без дій: ${money(result.sq.mean)}`}
          />
        </Card>
      </div>

      <Card>
        <H3>Розподіл грошей фонду, $m</H3>
        <div
          className="mt-3 h-56 sm:h-64"
          role="img"
          aria-label={`Гістограма: план P50 ${num1(result.plan.p50)}, без дій P50 ${num1(result.sq.p50)}`}
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
                      ≈{money(payload[0].payload.x)}: план {payload[0].payload.plan.toFixed(1)}%, без дій{' '}
                      {payload[0].payload.sq.toFixed(1)}%
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
          <LegendItem color={C.plan} label="План команди" />
          <LegendItem color={C.sq} label="Без дій (пунктир)" dashed />
        </div>
        <div className="mt-3 overflow-x-auto">
          <table className="num w-full min-w-[300px] text-sm">
            <thead>
              <tr className="text-left text-xs text-muted">
                <th className="py-1 font-normal">Режим</th>
                <th className="py-1 text-right font-normal">P10</th>
                <th className="py-1 text-right font-normal">P50</th>
                <th className="py-1 text-right font-normal">P90</th>
                <th className="py-1 text-right font-normal">Середнє</th>
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
        <H3>Tornado: що найбільше рухає очікуваний результат плану</H3>
        <p className="text-sm text-muted">Зсув середнього параметра на ±1σ (на тих самих випадкових числах), зміна очікуваних грошей, $m.</p>
        <ul className="mt-3 space-y-3">
          {result.tornado.map((t) => (
            <li key={t.id}>
              <div className="flex justify-between text-xs">
                <span className="text-ink">{t.label}</span>
                <span className="num text-muted">
                  −1σ: {num1(t.low, { plus: true })} · +1σ: {num1(t.high, { plus: true })}
                </span>
              </div>
              <div className="relative mt-1 h-3 rounded-full bg-surface-2" aria-hidden>
                <div className="absolute inset-y-0 left-1/2 w-px bg-ink/40" />
                {[t.low, t.high].map((v, k) => (
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
          <LegendItem color={C.plan} label="Збільшує (+)" />
          <LegendItem color={C.sq} label="Зменшує (−)" />
        </div>
      </Card>
    </>
  )
}
