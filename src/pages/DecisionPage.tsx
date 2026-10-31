import { useMemo } from 'react'
import {
  COMPANY_IDS,
  COMPANY_NAMES,
  COMPANY_NAMES_EN,
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
import { useLang } from '../lib/i18n'
import { useAppState } from '../state/context'
import { Card, H3, PageIntro, Stat } from '../components/ui'
import { Slider } from '../components/Slider'
import { Info } from '../components/Info'

const SCORES = Array.from(
  { length: LENS_LIMITS.scoreMax - LENS_LIMITS.scoreMin + 1 },
  (_, i) => LENS_LIMITS.scoreMin + i,
)

function ScorePicker({
  label,
  info,
  value,
  base,
  onChange,
}: {
  label: string
  // текст підказки (i) біля назви критерію
  info?: string
  value: number
  base: number
  onChange: (v: number) => void
}) {
  return (
    <div className="flex items-center justify-between gap-2 py-1">
      <span className="inline-flex items-center text-sm text-ink">
        {label}
        {info && <Info label={label}>{info}</Info>}
      </span>
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
  const { t, lang } = useLang()
  const names = lang === 'en' ? COMPANY_NAMES_EN : COMPANY_NAMES
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
      <PageIntro title={t('Рішення', 'Decision')}>
        {t(
          'Яку компанію фонд обирає для єдиної інтенсивної програми — за лінзою пріоритетів кейсу — і наскільки цей висновок стійкий до помилок в оцінках.',
          'Which company the fund picks for its single intensive programme — through the case’s priority lens — and how robust that call is to scoring errors.',
        )}
      </PageIntro>

      <Card className="sheet">
        <p className="text-sm font-semibold text-muted">{t('Головний висновок', 'Bottom line')}</p>
        <p className="mt-1 font-display text-4xl font-bold leading-none tracking-tight text-ink sm:text-5xl lg:text-6xl">
          {t('Фокус фонду —', 'Fund focus:')} <span className="text-grad">{names[top]}</span>
        </p>
        <p className="mt-2 text-base text-ink sm:text-lg">
          {lang === 'en' ? (
            <>
              Ranks #1 in <strong className="num">{pct(robust[top], 1)}</strong> of {int(LENS_LIMITS.robustnessRuns)}{' '}
              scenarios where every score is randomly shifted by ±{LENS_LIMITS.jitter}.
            </>
          ) : (
            <>
              №1 у <strong className="num">{pct(robust[top], 1)}</strong> з {int(LENS_LIMITS.robustnessRuns)} сценаріїв, де
              кожну оцінку зсунуто випадково на ±{LENS_LIMITS.jitter}.
            </>
          )}
        </p>
        <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Stat
            label={names.sec}
            value={money(state.a.sec.investment)}
            sub={t('програма створення вартості', 'value-creation programme')}
            info={t(
              'Нові гроші фонду в Security на розширення за кордон. Фонд купує нові акції компанії, тому його частка зростає.',
              'New fund money put into Security to expand abroad. The fund buys newly issued shares, so its stake goes up.',
            )}
            accent
          />
          <Stat
            label={names.ecom}
            value={money(state.a.ecom.plan.bridge)}
            sub={t('бридж, повертається першим', 'bridge loan, repaid first')}
            info={t(
              'Бридж — короткостроковий кредит, щоб компанія пережила брак грошей. Фонду його повертають раніше за інших власників.',
              'A bridge is a short-term loan that carries the company through a cash crunch. The fund gets it back before other owners are paid.',
            )}
          />
          <Stat
            label={names.it}
            value={money(TEAM_ALLOCATION.it)}
            sub={t(`самофінансування, −${state.a.it.plan.fteCut} FTE`, `self-funded, −${state.a.it.plan.fteCut} FTE`)}
            info={t(
              'Нових грошей фонду не треба: компанія скорочує штат і сама платить за зміни. FTE — одна штатна ставка (працівник на повний день).',
              'No new fund money needed: the company cuts headcount and pays for the changes itself. FTE = one full-time employee.',
            )}
          />
          <Stat
            label={t('Резерв', 'Reserve')}
            value={money(reserve)}
            sub={t(`з ${money(FUND.freeCapital)} вільного капіталу`, `of ${money(FUND.freeCapital)} free capital`)}
            info={t(
              'Частина вільних грошей фонду, яку не вкладають зараз і тримають на непередбачені випадки.',
              'The part of the fund’s free cash that is not invested now and is kept for surprises.',
            )}
          />
        </div>
        <p className="mt-4 border-t border-line pt-3 text-sm text-muted">
          {lang === 'en' ? (
            <>
              Fund value in {FUND.horizonMonths} months: <strong className="num text-ink">{money(pf.plan)}</strong> under
              the plan vs <strong className="num text-ink">{money(pf.sq)}</strong> with no action.
            </>
          ) : (
            <>
              Гроші фонду за {FUND.horizonMonths} міс.: <strong className="num text-ink">{money(pf.plan)}</strong> за планом
              проти <strong className="num text-ink">{money(pf.sq)}</strong> без дій.
            </>
          )}
        </p>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        {order.map((id, rank) => (
          <LensCard key={id} id={id} rank={rank + 1} product={prio[id]} share={robust[id]} set={set} />
        ))}
      </div>

      <Card>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <H3
            info={t(
              'Без ваг усі чотири критерії однаково важливі. Увімкніть, щоб зробити якийсь критерій важливішим за інші й подивитися, чи зміниться переможець.',
              'Without weights all four criteria count equally. Turn this on to make some criteria matter more and see whether the winner changes.',
            )}
          >
            {t('Режим «ваги»', 'Weights mode')}
          </H3>
          <label className="inline-flex min-h-11 cursor-pointer items-center gap-2 text-sm text-ink">
            <input
              type="checkbox"
              className="h-5 w-5 accent-[var(--accent)]"
              checked={!!state.mc.weighted}
              onChange={(e) => set('mc.weighted', e.target.checked ? 1 : 0)}
            />
            {t('Зважувати критерії', 'Weight the criteria')}
          </label>
        </div>
        <p className="text-sm text-muted">
          {lang === 'en' ? (
            <>
              Priority = ∏ score<sup>weight</sup>. Weight 1 is the plain product; 2 makes the criterion count twice as much.
            </>
          ) : (
            <>
              Пріоритет = ∏ оцінка<sup>вага</sup>. Вага 1 — звичайний добуток; 2 — критерій важить удвічі більше.
            </>
          )}
        </p>
        {state.mc.weighted ? (
          <div className="mt-2 grid gap-x-6 sm:grid-cols-2">
            {CRITERIA.map((c) => (
              <Slider
                key={c.id}
                label={lang === 'en' ? c.labelEn : c.label}
                info={lang === 'en' ? c.infoEn : c.info}
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
        <H3
          info={t(
            'Оцінки 1–5 — це судження, вони можуть бути неточні. Тест перевіряє, чи лишиться той самий переможець, якщо всі оцінки трохи помилкові.',
            'The 1–5 scores are judgement calls and may be off. The test checks whether the same company still wins if every score is slightly wrong.',
          )}
        >
          {t('Тест стійкості', 'Robustness test')}
        </H3>
        <p className="text-sm text-muted">
          {t(
            `${int(LENS_LIMITS.robustnessRuns)} разів до кожної з 12 оцінок додаємо −1, 0 або +1 (з обрізанням до 1–5) і дивимось, хто перший. Нічия ділить перше місце.`,
            `${int(LENS_LIMITS.robustnessRuns)} times we add −1, 0 or +1 to each of the 12 scores (clipped to 1–5) and see who comes first. Ties share first place.`,
          )}
        </p>
        <ul className="mt-3 space-y-2">
          {COMPANY_IDS.map((id, i) => (
            <li key={id}>
              <div className="flex justify-between text-sm">
                <span className="text-ink">{names[id]}</span>
                <span className="num font-semibold text-ink">
                  {pct(robust[id], 1)} {t('перших місць', 'first places')}
                </span>
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
  const { t, lang } = useLang()
  return (
    <Card className={rank === 1 ? 'card-top' : ''}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-xs font-semibold text-muted">№{rank}</p>
          <H3>{lang === 'en' ? COMPANY_NAMES_EN[id] : COMPANY_NAMES[id]}</H3>
        </div>
        <div className="text-right">
          <div className={`num font-display text-3xl font-semibold ${rank === 1 ? 'text-accent-ink' : 'text-ink'}`}>
            {Number.isInteger(product) ? product : product.toFixed(1)}
          </div>
          <div className="inline-flex items-center text-xs text-muted">
            {t('добуток', 'product')}
            <Info label={t('добуток', 'product')}>
              {t(
                'Пріоритет компанії: чотири оцінки перемножуються. Більше число — вища черга на увагу фонду; одна низька оцінка сильно тягне вниз.',
                'The company’s priority: the four scores multiplied together. Higher means it comes first for the fund’s attention; one low score drags it down a lot.',
              )}
            </Info>
          </div>
        </div>
      </div>
      <div className="mt-2 divide-y divide-line">
        {CRITERIA.map((c) => (
          <ScorePicker
            key={c.id}
            label={lang === 'en' ? c.labelEn : c.label}
            // (i) лише на першій картці — щоб не повторювати ті самі 4 пояснення тричі
            info={rank === 1 ? (lang === 'en' ? c.infoEn : c.info) : undefined}
            value={state.lens[id][c.id]}
            base={DEFAULT_LENS[id][c.id]}
            onChange={(v) => set(`lens.${id}.${c.id}`, v)}
          />
        ))}
      </div>
      <p className="mt-2 text-xs text-muted">
        {t('Перше місце в тесті стійкості:', 'First place in the robustness test:')} {pct(share, 1)}
      </p>
    </Card>
  )
}
