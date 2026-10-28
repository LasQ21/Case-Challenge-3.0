import { useMemo } from 'react'
import {
  COMPANY_IDS,
  COMPANY_NAMES,
  CRITERIA,
  DEFAULT_LENS,
  DEFAULT_WEIGHTS,
  FUND,
  LENS_LIMITS,
  TEAM_ALLOCATION,
  type CompanyId,
} from '../model/config'
import { priorities, ranking, robustness } from '../model/lens'
import { portfolio } from '../model/valuation'
import { int, money, pct } from '../lib/format'
import { useAppState } from '../state/context'
import { Card, H3, PageIntro, Stat } from '../components/ui'
import { Slider } from '../components/Slider'

const SCORES = Array.from(
  { length: LENS_LIMITS.scoreMax - LENS_LIMITS.scoreMin + 1 },
  (_, i) => LENS_LIMITS.scoreMin + i,
)

function ScorePicker({
  label,
  value,
  base,
  onChange,
}: {
  label: string
  value: number
  base: number
  onChange: (v: number) => void
}) {
  return (
    <div className="flex items-center justify-between gap-2 py-1">
      <span className="text-sm text-ink">{label}</span>
      <div role="radiogroup" aria-label={label} className="flex gap-1">
        {SCORES.map((s) => {
          const on = s === value
          return (
            <button
              key={s}
              type="button"
              role="radio"
              aria-checked={on}
              onClick={() => onChange(s)}
              className={`btn num h-8 w-8 rounded-full text-sm font-semibold ${
                on ? 'btn-solid' : 'bg-surface-2 text-muted hover:text-ink'
              } ${s === base && !on ? 'ring-1 ring-inset ring-muted/50' : ''}`}
            >
              {s}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default function DecisionPage() {
  const { state, set } = useAppState()
  const weights = state.mc.weighted ? state.w : undefined
  const prio = priorities(state.lens, weights)
  const order = ranking(state.lens, weights)
  const robust = useMemo(
    () => robustness(state.lens, weights, LENS_LIMITS.robustnessRuns, state.mc.seed),
    [state.lens, weights, state.mc.seed],
  )
  const top = order[0]
  const pf = portfolio(state.a)
  const reserve = pf.reserve

  return (
    <div className="space-y-4">
      <PageIntro title="Рішення">
        Яку компанію фонд обирає для єдиної інтенсивної програми — за лінзою пріоритетів кейсу — і наскільки цей висновок
        стійкий до помилок в оцінках.
      </PageIntro>

      <Card className="sheet">
        <p className="text-sm font-semibold text-muted">Головний висновок</p>
        <p className="mt-1 font-display text-4xl font-bold leading-none tracking-tight text-ink sm:text-5xl lg:text-6xl">
          Фокус фонду — <span className="text-grad">{COMPANY_NAMES[top]}</span>
        </p>
        <p className="mt-2 text-base text-ink sm:text-lg">
          №1 у <strong className="num">{pct(robust[top], 1)}</strong> з {int(LENS_LIMITS.robustnessRuns)} сценаріїв, де кожну
          оцінку зсунуто випадково на ±{LENS_LIMITS.jitter}.
        </p>
        <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Stat label="Security" value={money(state.a.sec.investment)} sub="програма створення вартості" accent />
          <Stat label="E-commerce" value={money(state.a.ecom.plan.bridge)} sub="бридж, повертається першим" />
          <Stat label="IT-інжиніринг" value={money(TEAM_ALLOCATION.it)} sub={`самофінансування, −${state.a.it.plan.fteCut} FTE`} />
          <Stat label="Резерв" value={money(reserve)} sub={`з ${money(FUND.freeCapital)} вільного капіталу`} />
        </div>
        <p className="mt-4 border-t border-line pt-3 text-sm text-muted">
          Гроші фонду за {FUND.horizonMonths} міс.: <strong className="num text-ink">{money(pf.plan)}</strong> за планом
          проти <strong className="num text-ink">{money(pf.sq)}</strong> без дій.
        </p>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        {order.map((id, rank) => (
          <LensCard key={id} id={id} rank={rank + 1} product={prio[id]} share={robust[id]} set={set} />
        ))}
      </div>

      <Card>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <H3>Режим «ваги»</H3>
          <label className="inline-flex min-h-11 cursor-pointer items-center gap-2 text-sm text-ink">
            <input
              type="checkbox"
              className="h-5 w-5 accent-[var(--accent)]"
              checked={!!state.mc.weighted}
              onChange={(e) => set('mc.weighted', e.target.checked ? 1 : 0)}
            />
            Зважувати критерії
          </label>
        </div>
        <p className="text-sm text-muted">
          Пріоритет = ∏ оцінка<sup>вага</sup>. Вага 1 — звичайний добуток; 2 — критерій важить удвічі більше.
        </p>
        {state.mc.weighted ? (
          <div className="mt-2 grid gap-x-6 sm:grid-cols-2">
            {CRITERIA.map((c) => (
              <Slider
                key={c.id}
                label={c.label}
                value={state.w[c.id]}
                base={DEFAULT_WEIGHTS[c.id]}
                min={LENS_LIMITS.weightMin}
                max={LENS_LIMITS.weightMax}
                step={LENS_LIMITS.weightStep}
                format="mult"
                onChange={(v) => set(`w.${c.id}`, v)}
              />
            ))}
          </div>
        ) : null}
      </Card>

      <Card>
        <H3>Тест стійкості</H3>
        <p className="text-sm text-muted">
          {int(LENS_LIMITS.robustnessRuns)} разів до кожної з 12 оцінок додаємо −1, 0 або +1 (з обрізанням до 1–5) і
          дивимось, хто перший. Нічия ділить перше місце.
        </p>
        <ul className="mt-3 space-y-2">
          {COMPANY_IDS.map((id, i) => (
            <li key={id}>
              <div className="flex justify-between text-sm">
                <span className="text-ink">{COMPANY_NAMES[id]}</span>
                <span className="num font-semibold text-ink">{pct(robust[id], 1)} перших місць</span>
              </div>
              <div className="mt-1 h-2.5 rounded-full bg-surface-2">
                <div
                  className={`grow-x h-2.5 rounded-full ${id === top ? 'bar-fill' : 'bg-sq'}`}
                  style={{ width: `${robust[id] * 100}%`, ['--d' as string]: `${i * 150}ms` }}
                />
              </div>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  )
}

function LensCard({
  id,
  rank,
  product,
  share,
  set,
}: {
  id: CompanyId
  rank: number
  product: number
  share: number
  set: (path: string, v: number) => void
}) {
  const { state } = useAppState()
  return (
    <Card className={rank === 1 ? 'card-top' : ''}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-xs font-semibold text-muted">№{rank}</p>
          <H3>{COMPANY_NAMES[id]}</H3>
        </div>
        <div className="text-right">
          <div className={`num font-display text-3xl font-semibold ${rank === 1 ? 'text-accent-ink' : 'text-ink'}`}>
            {Number.isInteger(product) ? product : product.toFixed(1)}
          </div>
          <div className="text-xs text-muted">добуток</div>
        </div>
      </div>
      <div className="mt-2 divide-y divide-line">
        {CRITERIA.map((c) => (
          <ScorePicker
            key={c.id}
            label={c.label}
            value={state.lens[id][c.id]}
            base={DEFAULT_LENS[id][c.id]}
            onChange={(v) => set(`lens.${id}.${c.id}`, v)}
          />
        ))}
      </div>
      <p className="mt-2 text-xs text-muted">Перше місце в тесті стійкості: {pct(share, 1)}</p>
    </Card>
  )
}
