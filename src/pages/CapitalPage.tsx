import { useMemo } from 'react'
import { CartesianGrid, Line, LineChart, ReferenceDot, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { ALLOCATION_RULES, COMPANY_NAMES, COMPANY_NAMES_EN, FUND, TEAM_ALLOCATION, type Allocation } from '../model/config'
import { clampAllocation, evaluateAllocation, optimizeAllocation, reserveOf } from '../model/allocation'
import { money, mult, pct } from '../lib/format'
import { useLang } from '../lib/i18n'
import { useAppState } from '../state/context'
import { Button, Card, H3, LegendItem, PageIntro, Stat } from '../components/ui'
import { Info } from '../components/Info'
import { Slider } from '../components/Slider'
import { C } from '../components/chartColors'

const KEYS: (keyof Allocation)[] = ['sec', 'ecom', 'it']

const fmtAlloc = (x: Allocation) => `${x.sec} / ${x.ecom} / ${x.it} / ${+reserveOf(x).toFixed(1)}`

export default function CapitalPage() {
  const { state, set } = useAppState()
  const { t, lang } = useLang()
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
    { k: 'Security', v: x.sec, cls: 'bar-fill' },
    { k: 'E-com', v: x.ecom, cls: 'bg-ink' },
    { k: 'IT', v: x.it, cls: 'bg-sq' },
    { k: t('Резерв', 'Reserve'), v: reserve, cls: 'bg-surface-2' },
  ]

  // Що робить кожен долар у моделі — підказки (i) біля повзунків
  const R = ALLOCATION_RULES
  const sliderInfo: Record<keyof Allocation, string> = {
    sec: t(
      `Гроші на розширення Security за кордон. До ${money(R.secFullProgram)} кожен долар наближає компанію до плану (вищий ріст і мультиплікатор); понад це фонд лише купує більшу частку.`,
      `Funds Security’s expansion abroad. Up to ${money(R.secFullProgram)}, each dollar moves the company closer to the plan (higher growth and multiple); above that the fund only buys a bigger stake.`,
    ),
    ecom: t(
      `Бридж — короткий позиковий транш, що дає E-com дожити до виходу. Від ${money(R.ecomBridgeThreshold)} шанс вижити зростає з ${pct(R.ecomSurvivalWithout, 0)} до ${pct(R.ecomSurvivalWithBridge, 0)}; більше просто повертається.`,
      `A bridge is a short-term loan that keeps E-com alive until the exit. From ${money(R.ecomBridgeThreshold)} its survival chance rises from ${pct(R.ecomSurvivalWithout, 0)} to ${pct(R.ecomSurvivalWithBridge, 0)}; anything above that just comes back.`,
    ),
    it: t(
      'Гроші в IT-інжиніринг повертаються 1:1: вони не роблять компанію дорожчою, тож лише займають капітал.',
      'Money put into IT Engineering comes back 1:1: it doesn’t make the company worth more, so it only ties up capital.',
    ),
  }
  const names = lang === 'en' ? COMPANY_NAMES_EN : COMPANY_NAMES

  return (
    <div className="space-y-4">
      <PageIntro title="$15m">
        {t(
          `Як розподілити ${money(FUND.freeCapital)} вільного капіталу між компаніями та резервом, щоб отримати найбільше очікуваних грошей — і наскільки рішення команди близьке до найкращого.`,
          `How to split ${money(FUND.freeCapital)} of free capital between the companies and a reserve to get the most expected money back — and how close the team’s decision is to the best one.`,
        )}
      </PageIntro>

      <Card className="sheet">
        <p className="inline-flex items-center text-sm font-semibold text-muted">
          {t('Висновок', 'Verdict')}
          <Info label={t('Оптимум перебору', 'Brute-force optimum')}>
            {t(
              `Ми перебрали всі можливі розподіли з кроком ${money(ALLOCATION_RULES.step)} і взяли той, що дає фонду найбільше очікуваних грошей. Це і є «оптимум перебору».`,
              `We tried every possible split in ${money(ALLOCATION_RULES.step)} steps and took the one that returns the most expected money to the fund. That is the “brute-force optimum”.`,
            )}
          </Info>
        </p>
        <p className="mt-1 font-display text-2xl font-semibold text-ink sm:text-3xl">
          {gap <= 1e-9 ? (
            <>{t('Рішення команди збігається з оптимумом перебору', 'The team’s decision matches the brute-force optimum')}</>
          ) : lang === 'en' ? (
            <>
              The team’s decision is within <span className="num text-accent-ink">{pct(gap, 1)}</span> of the optimum
            </>
          ) : (
            <>
              Рішення команди в межах <span className="num text-accent-ink">{pct(gap, 1)}</span> від оптимуму
            </>
          )}
        </p>
        <p className="mt-2 text-sm text-muted">
          {lang === 'en' ? (
            <>
              Search in {money(ALLOCATION_RULES.step)} steps: best is <span className="num text-ink">{fmtAlloc(best.x)}</span>{' '}
              (Security / E-com / IT / reserve) → {money(best.r.total)}. Team:{' '}
              <span className="num text-ink">{fmtAlloc(TEAM_ALLOCATION)}</span> → {money(team.total)}.
            </>
          ) : (
            <>
              Перебір із кроком {money(ALLOCATION_RULES.step)}: найкраще — <span className="num text-ink">{fmtAlloc(best.x)}</span>{' '}
              (Security / E-com / IT / резерв) → {money(best.r.total)}. Команда:{' '}
              <span className="num text-ink">{fmtAlloc(TEAM_ALLOCATION)}</span> → {money(team.total)}.
            </>
          )}
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button onClick={() => apply(TEAM_ALLOCATION)} disabled={isTeam}>
            ● {t('Рішення команди', 'Team decision')}
          </Button>
          <Button onClick={() => apply(best.x)} disabled={isBest}>
            {isBest ? t('✓ Це оптимум', '✓ This is the optimum') : t('Показати оптимум', 'Show the optimum')}
          </Button>
        </div>
        <p className="num mt-2 text-xs text-muted" aria-live="polite">
          {t('Зараз', 'Now')}: {fmtAlloc(x)} → {money(r.total)}
          {isBest
            ? t(' — це і є оптимум.', ' — this is the optimum.')
            : t(
                ` — на ${pct((best.r.total - r.total) / best.r.total, 1)} нижче оптимуму.`,
                ` — ${pct((best.r.total - r.total) / best.r.total, 1)} below the optimum.`,
              )}
        </p>
      </Card>

      <div className="grid gap-4 md:grid-cols-[1fr_1fr]">
        <Card>
          <H3>{t('Розподіл', 'Allocation')}</H3>
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
              label={names[k]}
              info={sliderInfo[k]}
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
            <span className="inline-flex items-center">
              {t('Резерв', 'Reserve')}
              <Info label={t('Резерв', 'Reserve')}>
                {t(
                  'Гроші, які фонд не вкладає зараз. Вони повертаються 1:1, але спершу покривають можливі перевитрати програми Security — без резерву перевитрати б’ють по її вартості.',
                  'Money the fund does not invest now. It comes back 1:1, but first covers any cost overrun in the Security programme — without a reserve, an overrun hits Security’s value.',
                )}
              </Info>
              :
            </span>{' '}
            <strong className="num">{money(reserve)}</strong>{' '}
            <span className="text-xs text-muted">
              {t(
                `= ${money(FUND.freeCapital)} − сума; більше ${money(FUND.freeCapital)} розподілити не можна`,
                `= ${money(FUND.freeCapital)} − the total; you can’t allocate more than ${money(FUND.freeCapital)}`,
              )}
            </span>
          </p>
        </Card>

        <Card>
          <H3>{t('Очікуваний результат', 'Expected result')}</H3>
          <div className="mt-2 grid grid-cols-2 gap-4">
            <Stat
              label={t('Гроші фонду', 'Fund proceeds')}
              value={money(r.total)}
              sub={isTeam ? t('● рішення команди', '● team decision') : `${t('команда', 'team')}: ${money(team.total)}`}
              accent
            />
            <Stat
              label={t('MOIC на новий капітал', 'MOIC on new capital')}
              value={r.moic === null ? '—' : mult(r.moic)}
              sub={t(`(портфель − без дій) / ${money(r.deployed)}`, `(portfolio − do nothing) / ${money(r.deployed)}`)}
              info={t(
                'Скільки доларів приросту дає кожен вкладений новий долар: 2x означає, що $1 інвестиції додав $2 до вартості портфеля порівняно з «без дій».',
                'How many dollars of gain each new dollar invested produces: 2x means $1 invested added $2 to the portfolio’s value compared with doing nothing.',
              )}
            />
          </div>
          <table className="num mt-3 w-full text-sm">
            <tbody className="divide-y divide-line">
              <tr>
                <td className="py-1 text-ink">Security</td>
                <td className="py-1 text-right text-ink">{money(r.sec)}</td>
                <td className="py-1 pl-2 text-right text-xs text-muted">
                  {t('програма', 'programme')} {pct(r.secProgramShare, 0)}
                </td>
              </tr>
              <tr>
                <td className="py-1 text-ink">E-commerce</td>
                <td className="py-1 text-right text-ink">{money(r.ecom)}</td>
                <td className="py-1 pl-2 text-right text-xs text-muted">
                  {t('виживання', 'survival')} {pct(r.ecomSurvival, 0)}
                </td>
              </tr>
              <tr>
                <td className="py-1 text-ink">{names.it}</td>
                <td className="py-1 text-right text-ink">{money(r.it)}</td>
                <td className="py-1 pl-2 text-right text-xs text-muted">{t('інвестиція 1:1', 'investment 1:1')}</td>
              </tr>
              <tr>
                <td className="py-1 text-ink">{t('Резерв', 'Reserve')}</td>
                <td className="py-1 text-right text-ink">{money(r.reserveReturned)}</td>
                <td className="py-1 pl-2 text-right text-xs text-muted">
                  {t('мінус очікувані перевитрати', 'minus expected overruns')}
                </td>
              </tr>
            </tbody>
          </table>
        </Card>
      </div>

      <Card>
        <H3
          info={t(
            'Рухаємо лише суму в Security, решту лишаємо як є. Вершина кривої — найвигідніша сума; праворуч від неї гроші краще тримати в резерві.',
            'Only the amount in Security changes; everything else stays put. The peak of the curve is the best amount; to the right of it the money is better kept in reserve.',
          )}
        >
          {t('Гроші фонду залежно від інвестиції в Security', 'Fund proceeds vs. investment in Security')}
        </H3>
        <p className="text-sm text-muted">
          {t(
            `E-com і IT зафіксовано на поточних значеннях, решта йде в резерв. Понад ${money(ALLOCATION_RULES.secFullProgram)} мультиплікатор більше не росте — лише частка фонду, а резерв для перевитрат зникає.`,
            `E-com and IT are fixed at their current values; the rest goes to the reserve. Above ${money(ALLOCATION_RULES.secFullProgram)} the multiple stops rising — only the fund’s stake grows, while the reserve for overruns disappears.`,
          )}
        </p>
        <div
          className="mt-3 h-56"
          role="img"
          aria-label={t(
            'Графік очікуваних грошей фонду від інвестиції в Security',
            'Chart of expected fund proceeds vs. investment in Security',
          )}
        >
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
              <ReferenceLine
                x={TEAM_ALLOCATION.sec}
                stroke={C.ink}
                strokeDasharray="3 3"
                label={{ value: t('команда', 'team'), fontSize: 11, position: 'insideTopLeft', fill: 'var(--ink)' }}
              />
              <Line type="monotone" dataKey="total" stroke={C.plan} strokeWidth={2} dot={false} isAnimationActive={false} />
              <ReferenceDot x={x.sec} y={r.total} r={5} fill={C.plan} stroke={C.surface} strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-2 flex flex-wrap gap-3">
          <LegendItem
            color={C.plan}
            label={t('Очікувані гроші фонду; точка — поточний розподіл', 'Expected fund proceeds; dot = current allocation')}
          />
          <LegendItem color={C.ink} label={t('Пунктир — рішення команди', 'Dashed = team decision')} dashed />
        </div>
      </Card>

      <Card>
        <H3>{t('Припущення розподілу', 'Allocation assumptions')}</H3>
        <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-muted">
          {lang === 'en' ? (
            <>
              <li>
                Security: the plan’s uplift scales as min(I / {ALLOCATION_RULES.secFullProgram}, 1); the stake is priced at the
                pre-money valuation.
              </li>
              <li>
                E-com: a bridge ≥ {money(ALLOCATION_RULES.ecomBridgeThreshold)} → survival{' '}
                {pct(ALLOCATION_RULES.ecomSurvivalWithBridge, 0)}, otherwise {pct(ALLOCATION_RULES.ecomSurvivalWithout, 0)};
                money above the threshold is returned at face value.
              </li>
              <li>IT: the investment comes back 1:1 and creates no value.</li>
              <li>The reserve comes back 1:1 but covers cost overruns in the Security programme.</li>
            </>
          ) : (
            <>
              <li>
                Security: приріст плану масштабується як min(I / {ALLOCATION_RULES.secFullProgram}, 1); частка — за
                pre-money оцінкою.
              </li>
              <li>
                E-com: бридж ≥ {money(ALLOCATION_RULES.ecomBridgeThreshold)} → виживання{' '}
                {pct(ALLOCATION_RULES.ecomSurvivalWithBridge, 0)}, інакше {pct(ALLOCATION_RULES.ecomSurvivalWithout, 0)};
                гроші понад поріг повертаються за номіналом.
              </li>
              <li>IT: інвестиція повертається 1:1 і не створює вартості.</li>
              <li>Резерв повертається 1:1, але покриває перевитрати програми Security.</li>
            </>
          )}
        </ul>
      </Card>
    </div>
  )
}
