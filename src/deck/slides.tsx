import { QRCodeSVG } from 'qrcode.react'
import type { CSSProperties, ReactNode } from 'react'
import {
  CASE_DATA,
  COMPANY_NAMES,
  CRITERIA,
  DEFAULT_ASSUMPTIONS as A,
  DEFAULT_LENS,
  FUND,
  LENS_LIMITS,
  MC_LIMITS,
  TEAM_ALLOCATION,
  type CompanyId,
} from '../model/config'
import { priorities, robustness } from '../model/lens'
import { portfolio, secPlan, secWaterfall } from '../model/valuation'
import { int, money, pct } from '../lib/format'

// Цифри деку беруться з тієї самої моделі, що й сайт, — дек і симулятор не можуть розійтися
const pf = portfolio(A)
const wf = secWaterfall(A)
const prio = priorities(DEFAULT_LENS)
const robust = robustness(DEFAULT_LENS, undefined)
const exitEbitda = secPlan(A).ebitda

const SITE_URL = 'https://case-challenge-3-0.vercel.app'
const SITE_LABEL = SITE_URL.replace('https://', '')
const TEAM = 'CC-146'

// Палітра сайту в діловому варіанті: фіолетовий — план, сірий — без дій, помаранчевий — точки рішень
const BG = '#F5F6FA'
const CARD = '#FFFFFF'
const LINE = '#DFE1EC'
const INK = '#10111C'
const MUTED = '#565A75'
const ACC = '#5B47FF'
const ACC_INK = '#4632F0'
const ACC_SOFT = '#EEEBFF'
const ACC_ON_DARK = '#A99BFF'
const SQ = '#9496AD'
const SQ_SOFT = '#E6E7EF'
const SQ_INK = '#6B6E87'
const SIG = '#FF5B1F'
const SIG_INK = '#C2410C'
const SIG_SOFT = '#FFE7DC'
const BLUE = '#0B84C6'

const m0 = (v: number) => (Math.round(v) === 0 ? '$0' : `$${Math.round(v)}m`)
const plus0 = (v: number) => `+$${Math.round(v)}m`
const d = (ms: number) => ({ '--d': `${ms}ms` }) as CSSProperties

interface SlideProps {
  n: number
  total: number
}

// ── Примітиви: координати в дюймах слайда 13.333 × 7.5 (як у PPTX-версії), шрифт у pt ──

const u = (v: number) => v * 144
const pt = (v: number) => v * 2

function T({
  x,
  y,
  w,
  h,
  s = 11,
  b,
  c = INK,
  lh = 1.25,
  al,
  anchor,
  disp,
  ls,
  className = '',
  style,
  children,
}: {
  x: number
  y: number
  w: number
  h?: number
  s?: number
  b?: boolean
  c?: string
  lh?: number
  al?: 'left' | 'center' | 'right'
  anchor?: 'middle' | 'bottom'
  disp?: boolean
  ls?: number
  className?: string
  style?: CSSProperties
  children: ReactNode
}) {
  return (
    <div
      className={`${disp ? 'f-disp' : ''} ${className}`}
      style={{
        position: 'absolute',
        left: u(x),
        top: u(y),
        width: u(w),
        height: h === undefined ? undefined : u(h),
        fontSize: pt(s),
        fontWeight: b ? 700 : 400,
        color: c,
        lineHeight: lh,
        textAlign: al,
        letterSpacing: ls,
        ...(anchor && {
          display: 'flex',
          flexDirection: 'column',
          justifyContent: anchor === 'middle' ? 'center' : 'flex-end',
        }),
        ...style,
      }}
    >
      {anchor ? <div>{children}</div> : children}
    </div>
  )
}

function B({
  x,
  y,
  w,
  h,
  bg,
  line,
  lw = 0.75,
  r,
  className = '',
  style,
  children,
}: {
  x: number
  y: number
  w: number
  h: number
  bg?: string
  line?: string
  lw?: number
  r?: number
  className?: string
  style?: CSSProperties
  children?: ReactNode
}) {
  return (
    <div
      className={className}
      style={{
        position: 'absolute',
        left: u(x),
        top: u(y),
        width: u(w),
        height: u(h),
        background: bg,
        border: line ? `${pt(lw)}px solid ${line}` : undefined,
        borderRadius: r,
        boxSizing: 'border-box',
        ...style,
      }}
    >
      {children}
    </div>
  )
}

// Горизонтальна чи вертикальна лінія; dash: пунктир або крапки
function Rule({
  x1,
  y1,
  x2 = x1,
  y2 = y1,
  c = LINE,
  w = 0.75,
  dash,
  className,
  style,
}: {
  x1: number
  y1: number
  x2?: number
  y2?: number
  c?: string
  w?: number
  dash?: 'dashed' | 'dotted'
  className?: string
  style?: CSSProperties
}) {
  const vertical = x1 === x2
  const t = pt(w)
  const b = `${t}px ${dash ?? 'solid'} ${c}`
  return (
    <div
      className={className}
      style={{
        position: 'absolute',
        left: u(Math.min(x1, x2)) - (vertical ? t / 2 : 0),
        top: u(Math.min(y1, y2)) - (vertical ? 0 : t / 2),
        width: vertical ? 0 : u(Math.abs(x2 - x1)),
        height: vertical ? u(Math.abs(y2 - y1)) : 0,
        [vertical ? 'borderLeft' : 'borderTop']: b,
        ...style,
      }}
    />
  )
}

// ── Рамка слайда: смуга, мітка, заголовок-твердження, підзаголовок, футер ─────

function Frame({
  n,
  total,
  eyebrow,
  title,
  subtitle,
  foot,
  children,
}: SlideProps & { eyebrow: string; title: ReactNode; subtitle: ReactNode; foot?: ReactNode; children: ReactNode }) {
  return (
    <>
      <B x={0} y={0} w={13.333} h={0.07} style={{ background: `linear-gradient(90deg, ${ACC}, ${BLUE})` }} />
      <T x={0.6} y={0.38} w={9} h={0.25} s={10} b c={ACC_INK} ls={2.4} style={{ textTransform: 'uppercase' }}>
        {eyebrow}
      </T>
      <T x={0.6} y={0.62} w={12.1} h={0.6} s={28} b lh={1.15} ls={-0.5}>
        {title}
      </T>
      <T x={0.6} y={1.3} w={12.1} h={0.35} s={14} c={MUTED}>
        {subtitle}
      </T>
      {children}
      {foot && (
        <T x={0.6} y={6.6} w={12.1} h={0.35} s={9} c={MUTED}>
          {foot}
        </T>
      )}
      <Rule x1={0.6} x2={12.73} y1={7.0} />
      <T x={0.6} y={7.07} w={8} h={0.22} s={9} c={MUTED}>
        <b>Case Challenge 3.0 · {TEAM}</b>
        {'  ·  '}Exit Simulator: стратегія портфеля на {FUND.horizonMonths} місяці
      </T>
      <T x={10.73} y={7.07} w={2} h={0.22} s={9} c={MUTED} al="right">
        {n} / {total}
      </T>
    </>
  )
}

// QR лише на першому й останньому слайдах; підпис словами, щоб журі його помітило
function QrCard({ title, desc }: { title: string; desc: string }) {
  return (
    <>
      <B x={9.15} y={5.55} w={3.58} h={1.3} bg={CARD} line={LINE} r={15}>
        <div style={{ position: 'absolute', left: u(0.12) - 1.5, top: u(0.1) - 1.5 }}>
          <QRCodeSVG value={SITE_URL} size={u(1.1)} level="M" fgColor={INK} bgColor={CARD} title={`QR-код: ${SITE_LABEL}`} />
        </div>
      </B>
      <T x={10.5} y={5.66} w={2.13} h={1.12} s={8.5} c={MUTED}>
        <p style={{ fontSize: pt(11), fontWeight: 700, color: INK }}>{title}</p>
        <p style={{ fontSize: pt(9), margin: '3px 0' }}>
          <a href={SITE_URL} style={{ color: ACC_INK }}>
            {SITE_LABEL}
          </a>
        </p>
        <p>{desc}</p>
      </T>
    </>
  )
}

// ── 1. Executive summary ────────────────────────────────────────────────────

function S1(p: SlideProps) {
  const segs = [
    { v: TEAM_ALLOCATION.sec, bg: ACC, c: CARD },
    { v: TEAM_ALLOCATION.ecom, bg: INK, c: CARD },
    { v: pf.reserve, bg: SQ_SOFT, c: INK },
  ]
  let sx = 0.6
  const bar = segs.map((sg) => {
    const w = (sg.v / FUND.freeCapital) * 6.0 - 0.04
    const out = { ...sg, x: sx, w }
    sx += w + 0.04
    return out
  })
  const rows = [
    { amt: TEAM_ALLOCATION.sec, c: ACC_INK, text: 'Security Hardware: інтенсивна програма, 70% часу команди' },
    { amt: TEAM_ALLOCATION.ecom, c: INK, text: 'E-commerce: забезпечений бридж під умови, продаж до міс. 15' },
    { amt: TEAM_ALLOCATION.it, c: SQ_INK, text: 'IT-інжиніринг: оптимізація за власні кошти, продаж до міс. 16' },
    { amt: pf.reserve, c: SQ_INK, text: 'Резерв: перевитрати Security або продаж E-com, рішення IC' },
  ]

  // Водоспад частки фонду в Security: від «без плану» до «за планом»
  const base = 4.62
  const k = (base - 2.8) / wf.plan
  const contrib = wf.stake + wf.debt
  const steps = [
    { label: 'Без плану', from: 0, v: wf.sq, bg: SQ_SOFT, val: m0(wf.sq), vc: INK },
    { label: 'Швидший ріст', from: wf.sq, v: wf.growth, bg: ACC, val: plus0(wf.growth), vc: ACC_INK },
    {
      label: `Переоцінка\n${A.sec.sq.mult}x → ${A.sec.plan.mult}x`,
      from: wf.sq + wf.growth,
      v: wf.rerating,
      bg: ACC,
      val: plus0(wf.rerating),
      vc: ACC_INK,
    },
    {
      label: `Внесок ${m0(A.sec.investment)}`,
      from: wf.sq + wf.growth + wf.rerating,
      v: contrib,
      bg: ACC,
      val: plus0(contrib),
      vc: ACC_INK,
    },
    { label: 'За планом', from: 0, v: wf.plan, bg: INK, val: m0(wf.plan), vc: INK },
  ]

  const kpis = [
    { v: money(pf.plan), c: ACC_ON_DARK, cap: 'портфель фонду на виході за планом' },
    { v: money(pf.sq), c: SQ, cap: 'без дій, тобто вдвічі менше' },
    { v: pct(robust.sec, 1), c: CARD, cap: 'тестів лінзи, де Security лишається №1' },
  ]

  return (
    <Frame
      {...p}
      eyebrow="Executive summary"
      title="Фокус на Security Hardware подвоює вартість портфеля"
      subtitle={`${m0(A.sec.investment)} і 70% часу команди йдуть у Security: хаб виробництва в ЄС переоцінює компанію з ${A.sec.sq.mult}x до ${A.sec.plan.mult}x EBITDA.`}
    >
      <T x={0.6} y={1.98} w={6} h={0.25} s={10} b c={MUTED}>
        Розподіл {m0(FUND.freeCapital)} вільного капіталу
      </T>
      {bar.map((sg, i) => (
        <B key={i} x={sg.x} y={2.28} w={sg.w} h={0.5} bg={sg.bg} className="a-grow-x" style={d(200 + i * 220)}>
          <T x={0} y={0} w={sg.w} h={0.5} s={14} b c={sg.c} al="center" anchor="middle">
            {m0(sg.v)}
          </T>
        </B>
      ))}
      {rows.map((r, i) => {
        const y = 3.0 + i * 0.56
        return (
          <div key={r.text}>
            <T x={0.6} y={y} w={0.85} h={0.5} s={16} b c={r.c} anchor="middle">
              {m0(r.amt)}
            </T>
            <T x={1.5} y={y} w={5.1} h={0.5} s={11.5} anchor="middle">
              {r.text}
            </T>
            {i < 3 && <Rule x1={0.6} x2={6.6} y1={y + 0.53} />}
          </div>
        )
      })}

      <B x={7.0} y={1.95} w={5.73} h={3.35} bg={CARD} line={LINE} r={14} />
      <T x={7.25} y={2.08} w={5.3} h={0.25} s={10} b c={MUTED}>
        Частка фонду в Security на міс. {FUND.horizonMonths}
      </T>
      {steps.map((st, i) => {
        const bx = 7.35 + i * 1.07
        const y0 = base - (st.from + st.v) * k
        return (
          <div key={st.label}>
            <B x={bx} y={y0} w={0.8} h={st.v * k} bg={st.bg} className="a-grow-y" style={d(300 + i * 380)} />
            <T
              x={bx - 0.15}
              y={y0 - 0.32}
              w={1.1}
              h={0.28}
              s={13}
              b
              c={st.vc}
              al="center"
              anchor="bottom"
              className="a-fade"
              style={d(550 + i * 380)}
            >
              {st.val}
            </T>
            <T
              x={bx - 0.15}
              y={base + 0.08}
              w={1.1}
              h={0.5}
              s={9.5}
              b={i === 4}
              c={i === 4 ? INK : MUTED}
              al="center"
              style={{ whiteSpace: 'pre-line' }}
            >
              {st.label}
            </T>
            {i > 0 && i < 4 && (
              <Rule x1={bx - 0.27} x2={bx} y1={base - st.from * k} c={SQ} dash="dotted" className="a-fade" style={d(400 + i * 380)} />
            )}
          </div>
        )
      })}
      <Rule
        x1={7.35 + 3 * 1.07 + 0.8}
        x2={7.35 + 4 * 1.07}
        y1={base - wf.plan * k}
        c={SQ}
        dash="dotted"
        className="a-fade"
        style={d(1700)}
      />
      <Rule x1={7.25} x2={12.5} y1={base} c={SQ} />

      <B x={0.6} y={5.55} w={8.35} h={1.3} bg={INK} r={11} />
      {kpis.map((kp, i) => (
        <div key={kp.cap}>
          <T x={0.9 + i * 2.75} y={5.66} w={2.6} h={0.55} s={30} b c={kp.c} ls={-1} className="a-fade" style={d(2100 + i * 150)}>
            {kp.v}
          </T>
          <T x={0.9 + i * 2.75} y={6.27} w={2.45} h={0.45} s={10.5} c="#C9CBE0">
            {kp.cap}
          </T>
        </div>
      ))}
      <QrCard
        title="QR: інтерактивна модель"
        desc={`Змініть будь-яке припущення й перевірте рішення на ${int(MC_LIMITS.defaultRuns)} сценаріях Монте-Карло.`}
      />
    </Frame>
  )
}

// ── 2. Лінза пріоритетів ────────────────────────────────────────────────────

const LENS_CARDS: { id: CompanyId; rank: string; role: string; det: string }[] = [
  {
    id: 'sec',
    rank: '№1',
    role: 'Фокус: інтенсивна програма, $10m і 70% часу',
    det: 'Частка ~$76m, +$81m з планом · хаб 12–18 міс., старт зараз · капітал, рада, партнери · +30% виручки, маржа 20%',
  },
  {
    id: 'it',
    rank: '№2',
    role: 'Підтримка: оптимізація і ранній продаж, $0, 15% часу',
    det: 'Частка ~$39m, −$16m при дрейфі · AI тисне на ціни щокварталу · витрати так, попит ні · без боргу, маржа 12%',
  },
  {
    id: 'ecom',
    rank: '№3',
    role: 'Тріаж, а не порятунок: $3m бридж під умови, 15% часу',
    det: 'Частка ~$7.5m, борг $35m попереду · ліквідність потрібна ≤6 міс. · зовнішні шоки, кредитори · маржа 2%, доставка 5 днів',
  },
]

const TABLE_COLS = [2.03, 0.8, 0.8, 0.8]
const colX = (j: number) => 8.3 + TABLE_COLS.slice(0, j).reduce((a, b) => a + b, 0)

function S2(p: SlideProps) {
  const ids: CompanyId[] = ['sec', 'it', 'ecom']
  const rows = [
    ['', 'Security', 'IT', 'E-com'],
    ...CRITERIA.map((c) => [c.label, ...ids.map((id) => String(DEFAULT_LENS[id][c.id]))]),
    ['Лінза', ...ids.map((id) => String(prio[id]))],
  ]
  return (
    <Frame
      {...p}
      eyebrow="Етап 1 · Пріоритет портфеля"
      title={`Лінза кейсу ставить Security першою: ${prio.sec} балів проти ${prio.it} і ${prio.ecom}`}
      subtitle="Security отримує фокус: найбільша частка фонду і проблема, яку фонд реально вирішує за 24 місяці."
      foot={`Частка фонду = (EBITDA × 6x, E-com 5x − чистий борг) × % володіння. Стійкість: Security №1 у ${pct(robust.sec, 1)} з ${int(LENS_LIMITS.robustnessRuns)} тестів, де кожну оцінку зсунуто на ±${LENS_LIMITS.jitter}.`}
    >
      {LENS_CARDS.map((cd, i) => {
        const cy = 1.98 + i * 1.5
        const hi = i === 0
        return (
          <div key={cd.id}>
            <B
              x={0.6}
              y={cy}
              w={7.4}
              h={1.38}
              bg={hi ? ACC_SOFT : CARD}
              line={hi ? ACC : LINE}
              lw={hi ? 1.25 : 0.75}
              r={14}
              className="a-fade"
              style={d(150 + i * 200)}
            />
            <B x={0.8} y={cy + 0.2} w={0.5} h={0.3} bg={hi ? ACC : SQ_SOFT} r={22}>
              <T x={0} y={0} w={0.5} h={0.3} s={10} b c={hi ? CARD : INK} al="center" anchor="middle">
                {cd.rank}
              </T>
            </B>
            <T x={1.42} y={cy + 0.15} w={4.5} h={0.4} s={16} b anchor="middle">
              {COMPANY_NAMES[cd.id]}
            </T>
            <T x={0.8} y={cy + 0.6} w={5.5} h={0.28} s={11.5} b={hi} c={hi ? ACC_INK : INK}>
              {cd.role}
            </T>
            <T x={0.8} y={cy + 0.9} w={5.6} h={0.42} s={9.5} c={MUTED}>
              {cd.det}
            </T>
            <T
              x={6.4}
              y={cy + 0.1}
              w={1.4}
              h={0.6}
              s={32}
              b
              ls={-1}
              c={hi ? ACC_INK : i === 1 ? INK : SQ_INK}
              al="right"
              className="a-fade"
              style={d(600 + i * 250)}
            >
              {prio[cd.id]}
            </T>
            <T x={6.4} y={cy + 0.78} w={1.4} h={0.25} s={10} c={MUTED} al="right">
              {CRITERIA.map((c) => DEFAULT_LENS[cd.id][c.id]).join('×')}
            </T>
          </div>
        )
      })}

      <T x={8.3} y={1.98} w={4.4} h={0.25} s={10} b c={MUTED}>
        Оцінки 1–5, лінза = добуток
      </T>
      {rows.map((row, r) => {
        const head = r === 0
        const last = r === rows.length - 1
        return row.map((v, c) => {
          let color = last ? CARD : head ? MUTED : INK
          if (c === 1 && !last) color = ACC_INK
          if (c === 1 && last) color = ACC_ON_DARK
          return (
            <B
              key={`${r}-${c}`}
              x={colX(c)}
              y={2.28 + r * 0.36}
              w={TABLE_COLS[c]}
              h={0.36}
              bg={last ? INK : c === 1 && !head ? ACC_SOFT : CARD}
              style={{ borderTop: `1.5px solid ${LINE}`, borderBottom: last ? `1.5px solid ${LINE}` : undefined }}
            >
              <T
                x={0.1}
                y={0}
                w={TABLE_COLS[c] - 0.2}
                h={0.34}
                s={head ? 10 : 11}
                b={last || head || c === 1}
                c={color}
                al={c ? 'center' : 'left'}
                anchor="middle"
              >
                {v}
              </T>
            </B>
          )
        })
      })}

      <B x={8.3} y={4.68} w={4.43} h={1.68} bg={CARD} line={LINE} r={14} style={{ overflow: 'hidden' }}>
        <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: u(0.07), background: SIG }} />
      </B>
      <T x={8.55} y={4.82} w={4.0} h={1.45} s={10.5}>
        <p style={{ fontSize: pt(12), fontWeight: 700, marginBottom: 10 }}>Чому не найбільша криза?</p>
        <p style={{ marginBottom: 10 }}>
          E-commerce горить найсильніше, але при чистому боргу ${CASE_DATA.ecom.netDebt}m частка фонду коштує ~$7.5m. $10m
          «порятунку» захищали б передусім кредиторів.
        </p>
        <p style={{ fontWeight: 700 }}>Тому E-commerce отримує тріаж і бридж під жорсткі умови, а не порятунок.</p>
      </T>
    </Frame>
  )
}

// ── 3. Розподіл капіталу ────────────────────────────────────────────────────

function S3(p: SlideProps) {
  const base = 6.25
  const totalAsk = CASE_DATA.sec.request + CASE_DATA.ecom.request + CASE_DATA.it.request
  const k = 3.6 / totalAsk
  const stack = <X,>(items: (X & { v: number })[]) => {
    let y = base
    return items.map((it) => {
      const h = it.v * k
      y -= h
      return { ...it, y, h }
    })
  }
  const asks = stack([
    { v: CASE_DATA.sec.request, label: `Security ${m0(CASE_DATA.sec.request)}` },
    { v: CASE_DATA.ecom.request, label: `E-com ${m0(CASE_DATA.ecom.request)}` },
    { v: CASE_DATA.it.request, label: `IT ${m0(CASE_DATA.it.request)}` },
  ])
  const gives = stack([
    { v: TEAM_ALLOCATION.sec, bg: ACC, label: `${m0(TEAM_ALLOCATION.sec)} Security`, c: ACC_INK },
    { v: TEAM_ALLOCATION.ecom, bg: INK, label: `${m0(TEAM_ALLOCATION.ecom)} E-com`, c: INK },
    { v: pf.reserve, bg: SQ, label: `${m0(pf.reserve)} резерв`, c: SQ_INK },
  ])
  const top = base - FUND.freeCapital * k

  const alloc = [
    {
      bar: ACC,
      c: ACC_INK,
      h: 0.92,
      head: `Security Hardware · ${m0(TEAM_ALLOCATION.sec)} · 70% часу команди`,
      body: 'Два транші під віхи: $4m при підписанні СП (міс. 2–3), $6m при запуску пілотної лінії (міс. 8–9). Ще ~$5m дають FCF компанії та партнер СП.',
    },
    {
      bar: INK,
      c: INK,
      h: 1.2,
      head: `E-commerce · ${m0(TEAM_ALLOCATION.ecom)} · 15% часу`,
      body: 'Забезпечений бридж із першочерговим погашенням, лише після мораторію кредиторів і внеску засновника. Тріаж: 13-тижневий cash-план, 3PL замість відбудови складів, вужчий асортимент (вивільняє $4–5m оборотного капіталу), M&A-радник з міс. 2, продаж до міс. 15.',
    },
    {
      bar: SQ,
      c: INK,
      h: 1.05,
      head: `IT-інжиніринг · ${m0(TEAM_ALLOCATION.it)} · 15% часу`,
      body: `Без боргу, EBITDA $${CASE_DATA.it.ebitdaLast}m: вихідні допомоги (~$2m) з власного cash flow. −${A.it.plan.fteCut} FTE з бенчу (утилізація 70% → ~78%), ціни й AI-assisted delivery дають EBITDA ~$${A.it.plan.ebitda}m (16%). Продаж консолідатору чи PE з міс. 9.`,
    },
    {
      bar: SQ,
      c: SQ_INK,
      h: 0.62,
      head: `Резерв · ${m0(pf.reserve)}`,
      body: 'Перевитрати Security або витрати на продаж E-com; кожне використання вирішує інвесткомітет.',
    },
  ]
  let ay = 1.98
  const blocks = alloc.map((a) => {
    const out = { ...a, y: ay }
    ay += a.h
    return out
  })
  const strike = { textDecoration: 'line-through', color: MUTED, marginLeft: 22 }

  return (
    <Frame
      {...p}
      eyebrow="Етап 1 · Розподіл капіталу"
      title={`${m0(FUND.freeCapital)} проти запитів на ${m0(totalAsk)}: гроші туди, де вони множаться`}
      subtitle={`Security отримує ${m0(TEAM_ALLOCATION.sec)} двома траншами під віхи, E-commerce лише бридж ${m0(TEAM_ALLOCATION.ecom)}, IT нуль.`}
      foot="Припущення: решту потреб E-com закриває вивільнення оборотного капіталу; IT: ~$42k повних витрат на спеціаліста."
    >
      <T x={0.75} y={2.05} w={1.8} h={0.25} s={10} b c={MUTED} al="center">
        Запити, {m0(totalAsk)}
      </T>
      {asks.map((a) => (
        <B key={a.label} x={0.9} y={a.y} w={1.5} h={a.h} bg={SQ_SOFT} line={CARD} lw={1.5}>
          <T x={0} y={0} w={1.5 - 0.04} h={a.h - 0.04} s={11} al="center" anchor="middle">
            {a.label}
          </T>
        </B>
      ))}
      <T x={2.75} y={top - 0.62} w={1.8} h={0.25} s={10} b c={MUTED} al="center">
        Даємо, {m0(FUND.freeCapital)}
      </T>
      {gives.map((g, i) => (
        <div key={g.label}>
          <B x={2.9} y={g.y} w={1.5} h={g.h} bg={g.bg} line={CARD} lw={1.5} className="a-grow-y" style={d(300 + i * 300)} />
          <T x={4.5} y={g.y + g.h / 2 - 0.13} w={1.3} h={0.26} s={11.5} b c={g.c} anchor="middle" className="a-fade" style={d(500 + i * 300)}>
            {g.label}
          </T>
        </div>
      ))}
      <T x={4.5} y={top - 0.32} w={1.3} h={0.26} s={11.5} b c={SQ_INK} anchor="middle">
        IT: {m0(TEAM_ALLOCATION.it)}
      </T>
      <Rule x1={0.75} x2={5.5} y1={base} c={SQ} w={1} />

      {blocks.map((bl) => (
        <div key={bl.head}>
          <B x={6.0} y={bl.y} w={0.07} h={bl.h - 0.14} bg={bl.bar} />
          <T x={6.25} y={bl.y - 0.02} w={6.45} h={bl.h - 0.1} s={10.5}>
            <p style={{ fontSize: pt(13), fontWeight: 700, color: bl.c, marginBottom: 4 }}>{bl.head}</p>
            <p>{bl.body}</p>
          </T>
        </div>
      ))}
      <B x={6.0} y={ay + 0.02} w={6.73} h={0.42} bg={SQ_SOFT} r={9} />
      <T x={6.2} y={ay + 0.02} w={6.45} h={0.42} s={10.5} anchor="middle">
        <b>Не робимо:</b>
        <span style={strike}>відбудову складів E-com</span>
        <span style={strike}>AI-M&amp;A в IT</span>
        <span style={strike}>«чек» Security без віх</span>
        <span style={strike}>завод з нуля</span>
      </T>
    </Frame>
  )
}

// ── 4. Важелі Security ──────────────────────────────────────────────────────

const LEVERS = [
  {
    n: '01',
    name: 'Хаб виробництва в ЄС',
    what: 'Серія в ЄС/НАТО через СП чи контрактного виробника, не завод з нуля: 25% → ≥50% потужностей поза Україною',
    how: `Знімає головне заперечення покупців (${A.sec.sq.mult}x → ${A.sec.plan.mult}x) і відкриває тендери з локалізацією`,
    need: '$10m фонду + ~$5m компанії й партнера · COO International, PMO · 9–12 міс.',
    kpi: '≥50%',
    kpiText: 'потужностей поза Україною до міс. 18; перша серія в ЄС на міс. 10',
  },
  {
    n: '02',
    name: 'Довгострокові контракти',
    what: 'Ріст у 2–3-річні рамкові контракти з урядами ЄС/НАТО та інтеграторами; передоплати під локальне виробництво',
    how: 'Видимість виручки: головний драйвер мультиплікатора в обороні; передоплати фінансують оборотку',
    need: '~$1m опексу (BD, тендери) · CEO + комерційний директор · 6–15 міс.',
    kpi: '≥1,5x',
    kpiText: 'портфель замовлень до виручки NTM; ≥2 рамкові угоди до міс. 15',
  },
  {
    n: '03',
    name: 'Стійкість бази в Україні',
    what: '≥3 майданчики (≤35% випуску на одному), запас критичних компонентів на 90 днів, другі постачальники, страхування воєнних ризиків',
    how: 'Захищає EBITDA від ударів і зменшує дисконт за ризик у DD покупця',
    need: '~$3m компанії (capex + запаси) · COO · 3–9 міс.',
    kpi: '≤35%',
    kpiText: 'випуску на одному майданчику; ≥90 днів запасу до міс. 9',
  },
  {
    n: '04',
    name: 'Готовність до продажу',
    what: 'Аудит IFRS (Big4) за 2026–27, комплаєнс експортного контролю й санкцій, чисте IP, CFO з M&A-досвідом, MIP під вихід, VDD',
    how: 'Ширше коло покупців, менше знижок ціни на DD, швидше закриття угоди',
    need: '~$1.5m компанії (аудит, радники) · CFO + команда фонду · 12–15 міс.',
    kpi: '≥8',
    kpiText: 'покупців у першому раунді; аудит IFRS + VDD до міс. 15',
  },
]

function S4(p: SlideProps) {
  // Шкала EV/EBITDA 0…12x
  const X0 = 1.75
  const PX = 0.9
  const LY = 2.5
  const xm = (m: number) => X0 + m * PX
  const sq = A.sec.sq.mult
  const plan = A.sec.plan.mult
  const dot = (m: number, dia: number, bg: string, extra?: CSSProperties, className?: string) => (
    <B
      x={xm(m) - dia / 2}
      y={LY - dia / 2}
      w={dia}
      h={dia}
      bg={bg}
      r={999}
      className={className}
      style={extra}
    />
  )
  return (
    <Frame
      {...p}
      eyebrow="Етап 2 · Security Hardware: важелі"
      title={`Чотири важелі переводять Security з ${sq}x у ${plan}x EBITDA`}
      subtitle="Історія для покупця: бойово перевірена технологія з виробництвом у НАТО, а не «завод в Україні»."
      foot="Модель СП відповідає «Build with Ukraine»: європейський партнер фінансує й дає потужності, українська компанія дає технологію."
    >
      <T x={0.6} y={LY - 0.12} w={1.1} h={0.25} s={10} b c={MUTED}>
        EV/EBITDA
      </T>
      <Rule x1={X0} x2={xm(12)} y1={LY} c={SQ} w={1} />
      {Array.from({ length: 13 }, (_, m) => (
        <Rule key={m} x1={xm(m)} y1={LY - 0.05} y2={LY + 0.05} c={SQ} />
      ))}
      <T x={X0 - 0.2} y={LY + 0.1} w={0.4} h={0.22} s={9} c={MUTED} al="center">
        0x
      </T>
      <T x={xm(12) - 0.2} y={LY + 0.1} w={0.4} h={0.22} s={9} c={MUTED} al="center">
        12x
      </T>
      {/* Розмірна лінія 6x → 9x малюється зліва направо: це і є переоцінка */}
      <Rule x1={xm(sq)} x2={xm(plan)} y1={LY - 0.22} c={ACC} w={1.5} className="a-grow-x" style={d(500)} />
      <Rule x1={xm(sq)} y1={LY - 0.3} y2={LY - 0.14} c={ACC} w={1.5} />
      <Rule x1={xm(plan)} y1={LY - 0.3} y2={LY - 0.14} c={ACC} w={1.5} className="a-fade" style={d(1200)} />
      <T
        x={xm((sq + plan) / 2) - 2}
        y={LY - 0.55}
        w={4}
        h={0.25}
        s={11}
        b
        c={ACC_INK}
        al="center"
        className="a-fade"
        style={d(1300)}
      >
        +{plan - sq}x: головне джерело вартості, {plus0(wf.rerating)}
      </T>
      {dot(sq, 0.18, SQ)}
      {dot(plan, 0.22, ACC, d(1350), 'a-pop')}
      {dot(11, 0.16, BG, { border: `2.5px solid ${INK}` })}
      <T x={xm(sq) - 0.9} y={LY + 0.12} w={1.8} h={0.25} s={10} c={MUTED} al="center">
        {sq}x без плану
      </T>
      <T x={xm(plan) - 1.6} y={LY + 0.12} w={3.2} h={0.25} s={10} b c={ACC_INK} al="center">
        {plan}x за планом, EBITDA LTM ~{m0(exitEbitda)}
      </T>
      <T x={xm(11) - 1.0} y={LY - 0.4} w={2.0} h={0.25} s={9} c={MUTED} al="center">
        ~11x медіана, Cavendish 2026
      </T>

      {LEVERS.map((l, i) => {
        const cx = 0.6 + i * 3.05
        const cy = 3.0
        const w = 2.93
        const ix = cx + 0.18
        const iw = w - 0.36
        return (
          <div key={l.n}>
            <B x={cx} y={cy} w={w} h={3.48} bg={CARD} line={LINE} r={14} className="a-fade" style={d(200 + i * 150)} />
            <T x={ix} y={cy + 0.16} w={iw} h={0.22} s={10} b c={ACC_INK}>
              {l.n}
            </T>
            <T x={ix} y={cy + 0.38} w={iw} h={0.3} s={13} b>
              {l.name}
            </T>
            <T x={ix} y={cy + 0.74} w={iw} h={0.8} s={9.5} lh={1.2}>
              {l.what}
            </T>
            <T x={ix} y={cy + 1.56} w={iw} h={0.55} s={9.5} lh={1.2} c={MUTED}>
              {l.how}
            </T>
            <T x={ix} y={cy + 2.12} w={iw} h={0.38} s={8.5} c={SQ_INK}>
              {l.need}
            </T>
            <Rule x1={ix} x2={ix + iw} y1={cy + 2.55} />
            <T x={ix} y={cy + 2.58} w={iw} h={0.42} s={24} b c={ACC_INK} ls={-0.5} className="a-fade" style={d(1600 + i * 180)}>
              {l.kpi}
            </T>
            <T x={ix} y={cy + 3.0} w={iw} h={0.42} s={9}>
              {l.kpiText}
            </T>
          </div>
        )
      })}
    </Frame>
  )
}

// ── 5. Ризики й тригери ─────────────────────────────────────────────────────

const RISKS = [
  {
    title: '1. Затримка експортних дозволів і сертифікації в ЄС',
    resp: '2 країни × 2 партнери паралельно; транші під віхи; запасний план: ліцензування технології',
  },
  {
    title: '2. Перемир’я чи зміна бюджетів знижують попит',
    resp: 'Диверсифікація в критичну інфраструктуру й dual-use; індексація цін у контрактах',
  },
  {
    title: '3. Удар по ключовому майданчику в Україні',
    resp: 'Розосередження, запаси на 90 днів, страхування; хаб у ЄС як резервна потужність',
  },
  {
    title: '4. Виробництво в ЄС «з’їдає» маржу',
    resp: 'Контрактний виробник замість власного заводу; ліміт надбавки до собівартості +10%',
  },
  {
    title: '5. Засновники не згодні з ціною; відтік ключових людей',
    resp: 'Нижня межа ціни та MIP у перші 100 днів; ретеншн для топ-20 інженерів',
  },
]

// Ризики на матриці «ймовірність × вплив»: колонка, рядок, позиція в клітинці, діаметр
const DOTS = [
  { c: 1, r: 0, fx: 0.5, fy: 0.5, dia: 0.5, bg: INK },
  { c: 0, r: 0, fx: 0.33, fy: 0.32, dia: 0.38, bg: INK },
  { c: 0, r: 0, fx: 0.68, fy: 0.7, dia: 0.38, bg: INK },
  { c: 0, r: 1, fx: 0.33, fy: 0.32, dia: 0.32, bg: SQ_INK },
  { c: 0, r: 1, fx: 0.68, fy: 0.7, dia: 0.32, bg: SQ_INK },
]

const GATES: { when: string; body: ReactNode }[] = [
  {
    when: 'День 60 · Зупинити',
    body: (
      <>
        E-com: немає мораторію кредиторів → <b>бриджу немає, pre-pack продаж</b>
      </>
    ),
  },
  {
    when: 'Міс. 12 · Зупинити',
    body: (
      <>
        Немає серії в ЄС або capex +30% → <b>заморожуємо транш 2, ліцензування</b>
      </>
    ),
  },
  {
    when: 'До міс. 15 · Прискорити',
    body: (
      <>
        Пропозиція ≥{A.sec.plan.mult}x LTM EBITDA → <b>прискорений процес на 3 міс.</b>
      </>
    ),
  },
  {
    when: 'Будь-коли · Прискорити',
    body: (
      <>
        Перемир’я з гарантіями безпеки → <b>продаж раніше, на піку попиту</b>
      </>
    ),
  },
  {
    when: 'Щокварталу · Змінити пріоритет',
    body: (
      <>
        Ріст Security &lt;10% р/р два квартали або втрата топ-клієнта → <b>перегляд фокусу й резерву</b>. IT: утилізація
        &lt;65% чи маржа &lt;8% → <b>продаємо негайно</b>
      </>
    ),
  },
]

function S5(p: SlideProps) {
  const MX = 0.98
  const MY = 2.4
  const C = 1.35
  const fills = [
    [SQ_SOFT, SIG_SOFT],
    ['#F0F1F6', SQ_SOFT],
  ]
  return (
    <Frame
      {...p}
      eyebrow="Етап 2 · Ризики та умови перемикання"
      title="Кожен ризик має готову відповідь і тригер перемикання"
      subtitle="Транш 2 ($6m) виходить лише після серії в ЄС, інакше з міс. 12 переходимо на ліцензування."
      foot="Тригери переглядає рада щокварталу; ті самі пороги відстежує Telegram-бот Board Alerts (@case_challenge_bot)."
    >
      <T x={MX} y={MY - 0.32} w={2 * C} h={0.22} s={9} b c={MUTED}>
        Ймовірність →
      </T>
      {['середня', 'висока'].map((lab, j) => (
        <T key={lab} x={MX + j * C} y={MY + 2 * C + 0.06} w={C} h={0.22} s={9} c={MUTED} al="center">
          {lab}
        </T>
      ))}
      {['вплив високий', 'вплив середній'].map((lab, r) => (
        <T
          key={lab}
          x={MX - 0.22 - C / 2}
          y={MY + r * C + C / 2 - 0.12}
          w={C}
          h={0.24}
          s={9}
          c={MUTED}
          al="center"
          style={{ transform: 'rotate(-90deg)' }}
        >
          {lab}
        </T>
      ))}
      {fills.map((row, r) =>
        row.map((bg, c) => <B key={`${r}-${c}`} x={MX + c * C} y={MY + r * C} w={C} h={C} bg={bg} line={CARD} lw={1.5} />),
      )}
      {DOTS.map((dt, i) => {
        const cx = MX + dt.c * C + dt.fx * C
        const cy = MY + dt.r * C + dt.fy * C
        return (
          <B
            key={i}
            x={cx - dt.dia / 2}
            y={cy - dt.dia / 2}
            w={dt.dia}
            h={dt.dia}
            bg={dt.bg}
            r={999}
            className="a-pop"
            style={d(300 + i * 160)}
          >
            <T x={0} y={0} w={dt.dia} h={dt.dia} s={dt.dia > 0.4 ? 13 : 11} b c={CARD} al="center" anchor="middle">
              {i + 1}
            </T>
          </B>
        )
      })}
      <T x={MX - 0.4} y={MY + 2 * C + 0.4} w={3.1} h={0.6} s={9} c={MUTED}>
        Ризик 1 — критичний: його закриває умова траншу 2 і запасний план із ліцензуванням.
      </T>

      <T x={4.0} y={2.0} w={4.5} h={0.25} s={10} b c={MUTED}>
        Ризик і відповідь
      </T>
      {RISKS.map((rk, i) => {
        const y = 2.32 + i * 0.84
        return (
          <div key={rk.title}>
            <T x={4.0} y={y} w={4.55} h={0.8} s={10} c={MUTED}>
              <p style={{ fontSize: pt(10.5), fontWeight: 700, color: INK, marginBottom: 3 }}>{rk.title}</p>
              <p>{rk.resp}</p>
            </T>
            {i < 4 && <Rule x1={4.0} x2={8.55} y1={y + 0.76} />}
          </div>
        )
      })}

      <T x={8.9} y={2.0} w={3.8} h={0.25} s={10} b c={MUTED}>
        Тригери перемикання, у порядку часу
      </T>
      {/* Вісь часу проростає вниз, точки рішень з'являються по черзі */}
      <Rule x1={9.0} y1={2.42} y2={6.2} c={SQ} w={1} className="a-drop" style={d(200)} />
      {GATES.map((g, i) => {
        const y = 2.32 + i * 0.8
        return (
          <div key={g.when}>
            <B
              x={9.0 - 0.07}
              y={y + 0.06}
              w={0.14}
              h={0.14}
              bg={SIG}
              className="a-pop"
              style={{ transform: 'rotate(45deg)', ...d(500 + i * 220) }}
            />
            <T x={9.25} y={y} w={3.48} h={0.8} s={10}>
              <p style={{ fontWeight: 700, color: SIG_INK, marginBottom: 3 }}>{g.when}</p>
              <p>{g.body}</p>
            </T>
          </div>
        )
      })}
    </Frame>
  )
}

// ── 6. Роудмап ──────────────────────────────────────────────────────────────

const MONTHS = FUND.horizonMonths
const SALE_START = 15
const GX = 2.65
const GW = 10.05
// Місяць m займає відрізок [m−1, m] на осі 0…24
const mx = (m: number) => GX + ((m - 1) / MONTHS) * GW
const mw = (a: number, b: number) => ((b - a + 1) / MONTHS) * GW
const GT = 1.9
const RH = 0.29

const GANTT: { who: string; what: string; from: number; to: number; bg: string; text: string }[] = [
  { who: 'Security', what: 'хаб у ЄС', from: 1, to: 18, bg: ACC, text: 'Партнер → пілотна лінія → серія (міс. 10) → ≥50% поза Україною' },
  { who: 'Security', what: 'контракти', from: 3, to: 15, bg: ACC, text: '≥2 рамкові контракти, портфель ≥1,5x виручки' },
  { who: 'Security', what: 'стійкість УА', from: 1, to: 9, bg: ACC, text: 'Розосередження, запаси 90 днів' },
  { who: 'Security', what: 'готовність', from: 1, to: 15, bg: ACC, text: 'Аудит IFRS, CFO, комплаєнс, VDD (міс. 15)' },
  { who: 'Security', what: 'продаж', from: SALE_START, to: 24, bg: INK, text: 'Продаж: запуск → підпис → закриття' },
  { who: 'E-com', what: 'тріаж', from: 1, to: 4, bg: SQ, text: 'Тріаж + бридж' },
  { who: 'E-com', what: 'продаж', from: 6, to: 15, bg: INK, text: 'Продаж стратегу, закриття ≤ міс. 15' },
  { who: 'IT', what: 'оптимізація', from: 1, to: 8, bg: SQ, text: `−${A.it.plan.fteCut} FTE бенчу, ціни, AI` },
  { who: 'IT', what: 'продаж', from: 9, to: 16, bg: INK, text: 'Продаж, закриття ≤ міс. 16' },
]
const GB = GT + 0.5 + GANTT.length * RH

function S6(p: SlideProps) {
  const ly = GB + 0.1
  const legend = [
    { bg: ACC, label: 'створення вартості' },
    { bg: INK, label: 'продаж' },
    { bg: SQ, label: 'підтримка' },
  ]
  return (
    <Frame
      {...p}
      eyebrow="Етап 2 · Роудмап і вихід"
      title="24 місяці: три послідовні виходи, Security останній"
      subtitle="E-commerce продаємо до міс. 15, IT до міс. 16, Security на міс. 23–24, коли хаб у ЄС уже випускає серію."
    >
      {[
        { a: 1, b: 3, bg: '#ECEDF4', label: 'Перші 100 днів' },
        { a: 4, b: 12, bg: CARD, label: 'Міс. 4–12 · лют – жов 2027' },
        { a: 13, b: 24, bg: '#ECEDF4', label: 'Міс. 13–24 · лис 2027 – жов 2028' },
      ].map((ph) => (
        <div key={ph.label}>
          <B x={mx(ph.a)} y={GT} w={mw(ph.a, ph.b)} h={GB - GT} bg={ph.bg} />
          <T x={mx(ph.a) + 0.08} y={GT + 0.04} w={mw(ph.a, ph.b) - 0.1} h={0.22} s={9} b c={MUTED}>
            {ph.label}
          </T>
        </div>
      ))}
      <T x={0.6} y={GT + 0.26} w={1.9} h={0.22} s={9} c={MUTED}>
        Місяць
      </T>
      {[1, 3, 6, 9, 12, 15, 18, 21, 24].map((m) => (
        <T
          key={m}
          x={mx(m)}
          y={GT + 0.26}
          w={mw(m, m)}
          h={0.22}
          s={9}
          b={m === SALE_START}
          c={m === SALE_START ? SIG_INK : MUTED}
          al="center"
        >
          {m}
        </T>
      ))}
      {GANTT.map((g, i) => {
        const y = GT + 0.5 + i * RH
        return (
          <div key={`${g.who}-${g.what}`}>
            <T x={0.6} y={y} w={2.0} h={RH} s={10} anchor="middle">
              <b>{g.who}</b> <span style={{ color: MUTED }}>{g.what}</span>
            </T>
            <B
              x={mx(g.from)}
              y={y + 0.04}
              w={mw(g.from, g.to)}
              h={RH - 0.08}
              bg={g.bg}
              className="a-sweep"
              style={{
                display: 'flex',
                alignItems: 'center',
                paddingLeft: u(0.08),
                overflow: 'hidden',
                whiteSpace: 'nowrap',
                fontSize: pt(9),
                fontWeight: 700,
                color: CARD,
                ...d(200 + (g.from - 1) * 70 + i * 60),
              }}
            >
              {g.text}
            </B>
            {(i === 4 || i === 6) && <Rule x1={0.6} x2={GX + GW} y1={y + RH} c={SQ} w={0.5} />}
          </div>
        )
      })}
      <Rule x1={mx(SALE_START)} y1={GT + 0.48} y2={GB} c={SIG} w={1.5} dash="dashed" className="a-drop" style={d(1900)} />

      {legend.map((l, i) => (
        <div key={l.label}>
          <B x={0.6 + i * 1.75} y={ly + 0.05} w={0.22} h={0.12} bg={l.bg} />
          <T x={0.9 + i * 1.75} y={ly} w={1.6} h={0.22} s={9} c={MUTED}>
            {l.label}
          </T>
        </div>
      ))}
      <Rule x1={0.6 + 3 * 1.75 + 0.1} y1={ly} y2={ly + 0.22} c={SIG} w={1.5} dash="dashed" />
      <T x={0.6 + 3 * 1.75 + 0.25} y={ly} w={3} h={0.22} s={9} c={MUTED}>
        старт продажу Security, міс. {SALE_START}
      </T>

      <T x={0.6} y={5.62} w={8.3} h={1.25} s={10}>
        <p style={{ marginBottom: 12 }}>
          <b>Віхи Security:</b> міс. 3 транш $4m; міс. 9 транш $6m; міс. 10 перша серія в ЄС; міс. 15 запуск продажу (січ
          2028); міс. 17 індикативні пропозиції; міс. 20 підписання; міс. 23–24 дозволи FDI й закриття.
        </p>
        <p>
          <b>Найімовірніший покупець.</b> <b style={{ color: ACC_INK }}>Security:</b> європейський оборонний стратег (prime чи
          mid-cap консолідатор), технологія + виробництво в НАТО. <b>IT:</b> сервісний консолідатор чи PE. <b>E-com:</b>{' '}
          рітейлер або маркетплейс.
        </p>
      </T>
      <QrCard
        title="QR: перевірте план самі"
        desc="Усі цифри деку: кожне припущення можна змінити, сценарій зберігається в посиланні."
      />
    </Frame>
  )
}

export { S1, S2, S3, S4, S5, S6 }
