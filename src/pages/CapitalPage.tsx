import { useMemo } from 'react'
import { CartesianGrid, Line, LineChart, ReferenceDot, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import {
  ALLOCATION_RULES,
  COMPANY_NAMES,
  DEFAULT_EVENTS,
  FUND,
  MC_LIMITS,
  TEAM_ALLOCATION,
  type Allocation,
} from '../model/config'
import { clampAllocation, evaluateAllocation, optimizeAllocation, reserveOf } from '../model/allocation'
import { money, mult, pct } from '../lib/format'
import { useAppState } from '../state/context'
import { Button, Card, H3, LegendItem, PageIntro, Stat } from '../components/ui'
import { Slider } from '../components/Slider'
import { C } from '../components/chartColors'

const KEYS: (keyof Allocation)[] = ['sec', 'ecom', 'it']

const fmtAlloc = (x: Allocation) => `${x.sec} / ${x.ecom} / ${x.it} / ${+reserveOf(x).toFixed(1)}`

export default function CapitalPage() {
  const { state, set } = useAppState()
  const x = state.alloc
  const r = evaluateAllocation(state.a, state.ev, x)
  const team = evaluateAllocation(state.a, state.ev, TEAM_ALLOCATION)
  const best = useMemo(() => optimizeAllocation(state.a, state.ev), [state.a, state.ev])
  const gap = (best.r.total - team.total) / best.r.total
  const isTeam = KEYS.every((k) => x[k] === TEAM_ALLOCATION[k])
  const isBest = KEYS.every((k) => x[k] === best.x[k])

  const setAlloc = (k: keyof Allocation, v: number) => {
    const next = clampAllocation({ ...x, [k]: v }, k)
    for (const key of KEYS) if (next[key] !== x[key]) set(`alloc.${key}`, next[key])
  }
  const apply = (y: Allocation) => KEYS.forEach((k) => set(`alloc.${k}`, y[k]))

  // Як змінюються гроші фонду від інвестиції в Security, якщо E-com та IT фіксовані
  const curve = useMemo(() => {
    const pts: { sec: number; total: number }[] = []
    const room = FUND.freeCapital - x.ecom - x.it
    for (let s = 0; s <= room + 1e-9; s += ALLOCATION_RULES.step) {
      pts.push({ sec: s, total: evaluateAllocation(state.a, state.ev, { ...x, sec: s }).total })
    }
    return pts
  }, [state.a, state.ev, x])

  const reserve = reserveOf(x)
  const shares = [
    { k: 'Security', v: x.sec, cls: 'bg-accent' },
    { k: 'E-com', v: x.ecom, cls: 'bg-ink' },
    { k: 'IT', v: x.it, cls: 'bg-sq' },
    { k: 'Резерв', v: reserve, cls: 'bg-surface-2' },
  ]

  return (
    <div className="space-y-4">
      <PageIntro title="$15m">
        Як розподілити {money(FUND.freeCapital)} вільного капіталу між компаніями та резервом, щоб отримати найбільше
        очікуваних грошей — і наскільки рішення команди близьке до найкращого.
      </PageIntro>

      <Card className="border-accent/40">
        <p className="text-xs uppercase tracking-wide text-muted">Висновок</p>
        <p className="mt-1 font-serif text-2xl font-semibold text-ink sm:text-3xl">
          {gap <= 1e-9 ? (
            <>Рішення команди збігається з оптимумом перебору</>
          ) : (
            <>
              Рішення команди в межах <span className="num text-accent-ink">{pct(gap, 1)}</span> від оптимуму
            </>
          )}
        </p>
        <p className="mt-2 text-sm text-muted">
          Перебір із кроком {money(ALLOCATION_RULES.step)}: найкраще — <span className="num text-ink">{fmtAlloc(best.x)}</span>{' '}
          (Security / E-com / IT / резерв) → {money(best.r.total)}. Команда: <span className="num text-ink">{fmtAlloc(TEAM_ALLOCATION)}</span> →{' '}
          {money(team.total)}.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button onClick={() => apply(TEAM_ALLOCATION)} disabled={isTeam}>
            ● Рішення команди
          </Button>
          <Button onClick={() => apply(best.x)} disabled={isBest}>
            {isBest ? '✓ Це оптимум' : 'Показати оптимум'}
          </Button>
        </div>
        <p className="num mt-2 text-xs text-muted" aria-live="polite">
          Зараз: {fmtAlloc(x)} → {money(r.total)}
          {isBest ? ' — це і є оптимум.' : ` — на ${pct((best.r.total - r.total) / best.r.total, 1)} нижче оптимуму.`}
        </p>
      </Card>

      <div className="grid gap-4 md:grid-cols-[1fr_1fr]">
        <Card>
          <H3>Розподіл</H3>
          <div className="mt-2 flex h-6 overflow-hidden rounded-md border border-line" aria-hidden>
            {shares.map((s) =>
              s.v > 0 ? <div key={s.k} className={s.cls} style={{ width: `${(s.v / FUND.freeCapital) * 100}%` }} /> : null,
            )}
          </div>
          <p className="num mt-1 text-xs text-muted">
            {shares.map((s) => `${s.k} ${money(s.v)}`).join(' · ')}
          </p>
          {KEYS.map((k) => (
            <Slider
              key={k}
              label={COMPANY_NAMES[k]}
              value={x[k]}
              base={TEAM_ALLOCATION[k]}
              min={0}
              max={ALLOCATION_RULES.maxBySlider[k]}
              step={ALLOCATION_RULES.step}
              format="money"
              onChange={(v) => setAlloc(k, v)}
            />
          ))}
          <p className="text-sm text-ink">
            Резерв: <strong className="num">{money(reserve)}</strong>{' '}
            <span className="text-xs text-muted">= {money(FUND.freeCapital)} − сума; більше {money(FUND.freeCapital)} розподілити не можна</span>
          </p>
        </Card>

        <Card>
          <H3>Очікуваний результат</H3>
          <div className="mt-2 grid grid-cols-2 gap-4">
            <Stat label="Гроші фонду" value={money(r.total)} sub={isTeam ? '● рішення команди' : `команда: ${money(team.total)}`} accent />
            <Stat
              label="MOIC на новий капітал"
              value={r.moic === null ? '—' : mult(r.moic)}
              sub={`(портфель − без дій) / ${money(r.deployed)}`}
            />
          </div>
          <table className="num mt-3 w-full text-sm">
            <tbody className="divide-y divide-line">
              <tr>
                <td className="py-1 text-ink">Security</td>
                <td className="py-1 text-right text-ink">{money(r.sec)}</td>
                <td className="py-1 pl-2 text-right text-xs text-muted">програма {pct(r.secProgramShare, 0)}</td>
              </tr>
              <tr>
                <td className="py-1 text-ink">E-commerce</td>
                <td className="py-1 text-right text-ink">{money(r.ecom)}</td>
                <td className="py-1 pl-2 text-right text-xs text-muted">виживання {pct(r.ecomSurvival, 0)}</td>
              </tr>
              <tr>
                <td className="py-1 text-ink">IT-інжиніринг</td>
                <td className="py-1 text-right text-ink">{money(r.it)}</td>
                <td className="py-1 pl-2 text-right text-xs text-muted">інвестиція 1:1</td>
              </tr>
              <tr>
                <td className="py-1 text-ink">Резерв</td>
                <td className="py-1 text-right text-ink">{money(r.reserveReturned)}</td>
                <td className="py-1 pl-2 text-right text-xs text-muted">мінус очікувані перевитрати</td>
              </tr>
            </tbody>
          </table>
        </Card>
      </div>

      <Card>
        <H3>Гроші фонду залежно від інвестиції в Security</H3>
        <p className="text-sm text-muted">
          E-com і IT зафіксовано на поточних значеннях, решта йде в резерв. Понад {money(ALLOCATION_RULES.secFullProgram)}{' '}
          мультиплікатор більше не росте — лише частка фонду, а резерв для перевитрат зникає.
        </p>
        <div className="mt-3 h-56" role="img" aria-label="Графік очікуваних грошей фонду від інвестиції в Security">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={curve} margin={{ top: 8, right: 12, left: -14, bottom: 0 }}>
              <CartesianGrid stroke={C.line} vertical={false} />
              <XAxis dataKey="sec" type="number" domain={[0, 'dataMax']} tick={{ fontSize: 11 }} tickFormatter={(v: number) => `$${v}m`} />
              <YAxis tick={{ fontSize: 11 }} domain={['auto', 'auto']} axisLine={false} tickFormatter={(v: number) => v.toFixed(0)} />
              <Tooltip
                content={({ active, payload }) =>
                  active && payload?.length ? (
                    <div className="num rounded-md border border-line bg-surface px-2 py-1 text-xs text-ink">
                      Security {money(payload[0].payload.sec)} → {money(payload[0].payload.total)}
                    </div>
                  ) : null
                }
              />
              <ReferenceLine x={TEAM_ALLOCATION.sec} stroke={C.ink} strokeDasharray="3 3" label={{ value: 'команда', fontSize: 11, position: 'insideTopLeft', fill: 'var(--ink)' }} />
              <Line type="monotone" dataKey="total" stroke={C.plan} strokeWidth={2} dot={false} isAnimationActive={false} />
              <ReferenceDot x={x.sec} y={r.total} r={5} fill={C.plan} stroke={C.surface} strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-2 flex flex-wrap gap-3">
          <LegendItem color={C.plan} label="Очікувані гроші фонду; точка — поточний розподіл" />
          <LegendItem color={C.ink} label="Пунктир — рішення команди" dashed />
        </div>
      </Card>

      <Card>
        <H3>Припущення розподілу</H3>
        <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-muted">
          <li>
            Security: приріст плану масштабується як min(I / {ALLOCATION_RULES.secFullProgram}, 1); частка — за pre-money оцінкою.
          </li>
          <li>
            E-com: бридж ≥ {money(ALLOCATION_RULES.ecomBridgeThreshold)} → виживання {pct(ALLOCATION_RULES.ecomSurvivalWithBridge, 0)}, інакше{' '}
            {pct(ALLOCATION_RULES.ecomSurvivalWithout, 0)}; гроші понад поріг повертаються за номіналом.
          </li>
          <li>IT: інвестиція повертається 1:1 і не створює вартості.</li>
          <li>Резерв повертається 1:1, але покриває перевитрати програми Security.</li>
        </ul>
        <div className="mt-2 grid gap-x-6 sm:grid-cols-2">
          <Slider
            label="Ймовірність перевитрат Security"
            value={state.ev.overrun.p}
            base={DEFAULT_EVENTS.overrun.p}
            min={0}
            max={1}
            step={MC_LIMITS.eventProbStep}
            format="pct"
            onChange={(v) => set('ev.overrun.p', v)}
          />
          <Slider
            label="Розмір перевитрат"
            value={state.ev.overrun.need}
            base={DEFAULT_EVENTS.overrun.need}
            min={0}
            max={ALLOCATION_RULES.maxBySlider.sec}
            step={ALLOCATION_RULES.step}
            format="money"
            onChange={(v) => set('ev.overrun.need', v)}
          />
        </div>
      </Card>
    </div>
  )
}
