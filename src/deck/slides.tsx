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

// Палітра «креслення» — та сама, що в Moda-версії деку
const PAPER = '#F3F3EF'
const INK = '#15171C'
const ULTRA = '#2F45D8'
const STONE = '#A8A296'
const STONE_INK = '#6E6A61'
const SIGNAL = '#FF5B1F'
const SIGNAL_INK = '#C2410C'
const RULE = '#D9D8D1'
const TINT = '#E4E7FB'

const m0 = (v: number) => (Math.round(v) === 0 ? '$0' : `$${Math.round(v)}m`)
const plus0 = (v: number) => `+$${Math.round(v)}m`
const d = (ms: number) => ({ '--d': `${ms}ms` }) as CSSProperties

interface SlideProps {
  n: number
  total: number
}

// ── Примітиви: абсолютне позиціювання в пікселях сцени ─────────────────────

type Font = 'sans' | 'disp' | 'mono'

function T({
  x,
  y,
  w,
  h,
  s = 20,
  f = 'sans',
  wt,
  c = INK,
  lh = 1.3,
  al,
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
  f?: Font
  wt?: number
  c?: string
  lh?: number
  al?: 'left' | 'center' | 'right'
  ls?: number
  className?: string
  style?: CSSProperties
  children: ReactNode
}) {
  const fam = f === 'disp' ? 'f-disp' : f === 'mono' ? 'f-mono' : ''
  return (
    <div
      className={`${fam} ${className}`}
      style={{
        position: 'absolute',
        left: x,
        top: y,
        width: w,
        height: h,
        fontSize: s,
        fontWeight: wt,
        color: c,
        lineHeight: lh,
        textAlign: al,
        letterSpacing: ls,
        ...style,
      }}
    >
      {children}
    </div>
  )
}

function B({
  x,
  y,
  w,
  h,
  bg,
  className = '',
  style,
  children,
}: {
  x: number
  y: number
  w: number
  h: number
  bg?: string
  className?: string
  style?: CSSProperties
  children?: ReactNode
}) {
  return (
    <div className={className} style={{ position: 'absolute', left: x, top: y, width: w, height: h, background: bg, ...style }}>
      {children}
    </div>
  )
}

const HLine = ({ x, y, w, c = RULE, t = 1 }: { x: number; y: number; w: number; c?: string; t?: number }) => (
  <B x={x} y={y} w={w} h={t} bg={c} />
)
const VLine = ({ x, y, h, c = RULE, t = 1 }: { x: number; y: number; h: number; c?: string; t?: number }) => (
  <B x={x} y={y} w={t} h={h} bg={c} />
)

// Плашка з підписом по центру (сегменти, маркери)
function Chip({
  x,
  y,
  w,
  h,
  bg,
  c = PAPER,
  s = 30,
  className = '',
  style,
  children,
}: {
  x: number
  y: number
  w: number
  h: number
  bg: string
  c?: string
  s?: number
  className?: string
  style?: CSSProperties
  children?: ReactNode
}) {
  return (
    <B
      x={x}
      y={y}
      w={w}
      h={h}
      bg={bg}
      className={`f-disp ${className}`}
      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: s, color: c, ...style }}
    >
      {children}
    </B>
  )
}

// ── Аркуш: рамка, мітка, заголовок-твердження, висновок, примітка, штамп ───

function Sheet({
  n,
  total,
  kicker,
  title,
  titleW = 1500,
  bottom,
  bottomW = 1600,
  foot,
  stamp = 'small',
  stampTitle,
  stampText,
  children,
}: SlideProps & {
  kicker: string
  title: ReactNode
  titleW?: number
  bottom: ReactNode
  bottomW?: number
  foot?: ReactNode
  stamp?: 'small' | 'qr'
  stampTitle?: string
  stampText?: string
  children: ReactNode
}) {
  return (
    <>
      <B x={40} y={40} w={1840} h={1000} style={{ border: `2px solid ${INK}` }} />
      <T x={96} y={72} w={1200} h={28} f="mono" s={20} c={STONE_INK}>
        {kicker}
      </T>
      <T x={96} y={108} w={titleW} h={200} f="disp" s={82} lh={1.04} ls={-1.5} style={{ textWrap: 'balance' }}>
        {title}
      </T>
      <T x={96} y={318} w={bottomW} s={28} wt={500} lh={1.35}>
        {bottom}
      </T>
      {children}
      {foot && (
        <T x={96} y={992} w={1360} h={26} s={18} c={STONE_INK}>
          {foot}
        </T>
      )}
      {stamp === 'small' ? (
        <B x={1480} y={972} w={400} h={68} bg={PAPER} style={{ border: `2px solid ${INK}` }}>
          <VLine x={218} y={0} h={64} c={INK} />
          <T x={14} y={18} w={200} h={28} f="mono" s={18}>
            Case Challenge 3.0
          </T>
          <T x={234} y={18} w={148} h={28} f="mono" s={18} al="right">
            Лист {n}/{total}
          </T>
        </B>
      ) : (
        <B x={1324} y={812} w={556} h={228} bg={PAPER} style={{ border: `2px solid ${INK}` }}>
          <div style={{ position: 'absolute', left: 14, top: 14 }}>
            <QRCodeSVG value={SITE_URL} size={168} level="M" fgColor={INK} bgColor={PAPER} title={`QR-код: ${SITE_LABEL}`} />
          </div>
          <VLine x={198} y={0} h={224} c={INK} />
          <T x={214} y={12} w={326} h={32} f="disp" s={23}>
            {stampTitle}
          </T>
          <T x={214} y={48} w={326} h={26} f="mono" s={18} c={ULTRA}>
            {SITE_LABEL}
          </T>
          <T x={214} y={82} w={326} h={84} s={18}>
            {stampText}
          </T>
          <HLine x={198} y={178} w={354} c={INK} />
          <T x={214} y={188} w={200} h={28} f="mono" s={18}>
            Case Challenge 3.0
          </T>
          <T x={414} y={188} w={126} h={28} f="mono" s={18} al="right">
            Лист {n}/{total}
          </T>
        </B>
      )}
    </>
  )
}

// ── 1. Executive Summary ────────────────────────────────────────────────────

const ALLOC_ROWS = [
  { amount: TEAM_ALLOCATION.sec, c: ULTRA, text: 'Security Hardware: інтенсивна програма, 70% часу команди' },
  { amount: TEAM_ALLOCATION.ecom, c: INK, text: 'E-commerce: забезпечений бридж під умови, продаж до міс. 15' },
  { amount: TEAM_ALLOCATION.it, c: STONE_INK, text: 'IT-інжиніринг: оптимізація за власні кошти, продаж до міс. 16' },
  { amount: pf.reserve, c: STONE_INK, text: 'Резерв: перевитрати Security або продаж E-com, рішення IC' },
]

function S1(p: SlideProps) {
  // Водоспад частки фонду в Security: база 720, «За планом» = 320 px
  const base = 720
  const k = 320 / wf.plan
  const steps = [
    { label: 'Без плану', v: wf.sq, from: 0, bg: STONE, c: INK, text: m0(wf.sq) },
    { label: 'Швидший ріст', v: wf.growth, from: wf.sq, bg: ULTRA, c: ULTRA, text: plus0(wf.growth) },
    {
      label: `Переоцінка ${A.sec.sq.mult}x → ${A.sec.plan.mult}x`,
      v: wf.rerating,
      from: wf.sq + wf.growth,
      bg: ULTRA,
      c: ULTRA,
      text: plus0(wf.rerating),
    },
    {
      label: `Внесок ${m0(A.sec.investment)}`,
      v: wf.stake + wf.debt,
      from: wf.sq + wf.growth + wf.rerating,
      bg: ULTRA,
      c: ULTRA,
      text: plus0(wf.stake + wf.debt),
    },
    { label: 'За планом', v: wf.plan, from: 0, bg: INK, c: INK, text: m0(wf.plan) },
  ]
  const segW = 900 / FUND.freeCapital
  return (
    <Sheet
      {...p}
      kicker="Executive summary"
      title="Фокус на Security Hardware подвоює вартість портфеля"
      titleW={1320}
      bottom={`${m0(A.sec.investment)} і 70% часу команди йдуть у Security: хаб виробництва в ЄС переоцінює компанію з ${A.sec.sq.mult}x до ${A.sec.plan.mult}x EBITDA.`}
      bottomW={920}
      stamp="qr"
      stampTitle="QR: інтерактивна модель"
      stampText={`Exit Simulator: змініть будь-яке припущення й перевірте рішення на ${int(MC_LIMITS.defaultRuns)} сценаріях Монте-Карло.`}
    >
      <T x={96} y={424} w={900} h={26} f="mono" s={19} c={STONE_INK}>
        Розподіл {m0(FUND.freeCapital)} вільного капіталу
      </T>
      <Chip x={96} y={458} w={TEAM_ALLOCATION.sec * segW - 4} h={56} bg={ULTRA} className="a-grow-x" style={d(200)}>
        {m0(TEAM_ALLOCATION.sec)}
      </Chip>
      <Chip
        x={96 + TEAM_ALLOCATION.sec * segW}
        y={458}
        w={TEAM_ALLOCATION.ecom * segW - 4}
        h={56}
        bg={INK}
        className="a-grow-x"
        style={d(450)}
      >
        {m0(TEAM_ALLOCATION.ecom)}
      </Chip>
      <Chip
        x={96 + (TEAM_ALLOCATION.sec + TEAM_ALLOCATION.ecom) * segW}
        y={458}
        w={pf.reserve * segW}
        h={56}
        bg={STONE}
        c={INK}
        className="a-grow-x"
        style={d(650)}
      >
        {m0(pf.reserve)}
      </Chip>
      {ALLOC_ROWS.map((r, i) => (
        <div key={r.text}>
          {i > 0 && <HLine x={96} y={530 + i * 54} w={908} />}
          <T x={96} y={540 + i * 54} w={100} h={34} f="disp" s={28} c={r.c}>
            {m0(r.amount)}
          </T>
          <T x={200} y={543 + i * 54} w={804} h={34} s={23}>
            {r.text}
          </T>
        </div>
      ))}

      <T x={1110} y={318} w={714} h={26} f="mono" s={19} c={STONE_INK}>
        Частка фонду в Security на міс. {FUND.horizonMonths}
      </T>
      <HLine x={1110} y={base} w={714} c={INK} t={1.5} />
      {steps.map((s, i) => {
        const x = 1110 + i * 151
        const top = base - (s.from + s.v) * k
        return (
          <div key={s.label}>
            <B x={x} y={top} w={110} h={s.v * k} bg={s.bg} className="a-grow-y" style={d(300 + i * 380)} />
            {i < steps.length - 1 && (
              <B
                x={x + 110}
                y={top}
                w={41}
                h={1}
                className="a-fade"
                style={{ borderTop: `1px dashed ${INK}`, ...d(550 + i * 380) }}
              />
            )}
            <T x={x - 10} y={top - 42} w={130} h={36} f="disp" s={30} c={s.c} al="center" className="a-fade" style={d(550 + i * 380)}>
              {s.text}
            </T>
            <T x={x - 15} y={732} w={140} h={52} s={20} lh={1.2} al="center" c={i === 4 ? INK : STONE_INK} wt={i === 4 ? 600 : 400}>
              {s.label}
            </T>
          </div>
        )
      })}

      <HLine x={40} y={812} w={1284} c={INK} />
      {[
        { x: 96, w: 400, v: money(pf.plan), c: ULTRA, cap: 'портфель фонду на виході за планом' },
        { x: 520, w: 400, v: money(pf.sq), c: STONE, cap: 'без дій, тобто вдвічі менше' },
        { x: 944, w: 340, v: pct(robust.sec, 1), c: INK, cap: 'тестів лінзи, де Security лишається №1' },
      ].map((kp, i) => (
        <div key={kp.cap}>
          <T x={kp.x} y={834} w={kp.w} h={104} f="disp" s={86} ls={-2} c={kp.c} className="a-fade" style={d(2200 + i * 150)}>
            {kp.v}
          </T>
          <T x={kp.x} y={944} w={kp.w - 20} h={56} s={22}>
            {kp.cap}
          </T>
        </div>
      ))}
    </Sheet>
  )
}

// ── 2. Лінза пріоритетів ────────────────────────────────────────────────────

const LENS_ROWS: { id: CompanyId; role: string; note: string; bar: string; roleC: string }[] = [
  {
    id: 'sec',
    role: '№1 фокус: інтенсивна програма, $10m і 70% часу',
    note: 'частка ~$76m, +$81m з планом; хаб 12–18 міс., старт зараз; капітал, рада, партнери; +30% виручки, маржа 20%',
    bar: ULTRA,
    roleC: ULTRA,
  },
  {
    id: 'it',
    role: '№2 підтримка: оптимізація і ранній продаж, $0, 15% часу',
    note: '~$39m, −$16m, якщо дрейф; AI тисне на ціни щокварталу; витрати так, попит ні; без боргу, маржа 12%',
    bar: STONE,
    roleC: INK,
  },
  {
    id: 'ecom',
    role: '№3 тріаж, а не порятунок: $3m бридж під умови, 15% часу',
    note: '~$7.5m, борг $35m попереду; ліквідність потрібна ≤6 міс.; зовнішні шоки, кредитори; маржа 2%, доставка 5 днів',
    bar: STONE,
    roleC: INK,
  },
]

const TABLE_COLS = [241, 107, 82, 82]
const colX = (j: number) => TABLE_COLS.slice(0, j).reduce((a, b) => a + b, 0)

function S2(p: SlideProps) {
  const ids: CompanyId[] = ['sec', 'it', 'ecom']
  const rows = [
    ...CRITERIA.map((c) => ({ label: c.label, vals: ids.map((id) => String(DEFAULT_LENS[id][c.id])), bold: false })),
    { label: 'Лінза', vals: ids.map((id) => String(prio[id])), bold: true },
  ]
  return (
    <Sheet
      {...p}
      kicker="Етап 1. Пріоритет портфеля"
      title={`Лінза кейсу ставить Security першою: ${prio.sec} балів проти ${prio.it} і ${prio.ecom}`}
      bottom="Security отримує фокус: найбільша частка фонду і проблема, яку фонд реально вирішує за 24 місяці."
      bottomW={1160}
      foot={`Частка фонду = (EBITDA × 6x, E-com 5x − чистий борг) × % володіння. Стійкість: Security №1 у ${pct(robust.sec, 1)} з ${int(LENS_LIMITS.robustnessRuns)} тестів, де кожну оцінку зсунуто на ±${LENS_LIMITS.jitter}.`}
    >
      {LENS_ROWS.map((r, i) => {
        const y = 440 + i * 184
        const w = (prio[r.id] / prio.sec) * 860
        const s = DEFAULT_LENS[r.id]
        return (
          <div key={r.id}>
            {i > 0 && <HLine x={96} y={y - 20} w={1164} />}
            <T x={96} y={y} w={640} h={44} f="disp" s={36}>
              {COMPANY_NAMES[r.id]}
            </T>
            <T x={700} y={y + 8} w={560} h={30} s={20} al="right" c={r.roleC}>
              {r.role}
            </T>
            <B x={96} y={y + 54} w={w} h={46} bg={r.bar} className="a-grow-x" style={d(250 + i * 300)} />
            <T x={96 + w + 20} y={y + 50} w={290} h={56} f="disp" s={46} className="a-fade" style={d(800 + i * 300)}>
              {prio[r.id]}
              <span style={{ fontFamily: 'var(--font-sans)', fontSize: 21, fontWeight: 400, color: STONE_INK }}>
                {'  '}
                {CRITERIA.map((c) => s[c.id]).join('×')}
              </span>
            </T>
            <T x={96} y={y + 112} w={1164} h={30} s={20} c={STONE_INK}>
              {r.note}
            </T>
          </div>
        )
      })}

      <T x={1316} y={440} w={512} h={28} f="mono" s={19} c={STONE_INK}>
        Оцінки 1–5, лінза = добуток
      </T>
      <B x={1316} y={478} w={512} h={300}>
        {['', 'Security', 'IT', 'E-com'].map((hd, j) => (
          <T
            key={hd || 'h'}
            x={colX(j)}
            y={0}
            w={TABLE_COLS[j]}
            h={50}
            s={20}
            wt={600}
            al={j ? 'center' : 'left'}
            c={j === 1 ? ULTRA : STONE_INK}
            style={{ lineHeight: '50px', paddingLeft: j ? 0 : 8, background: j === 1 ? TINT : undefined }}
          >
            {hd}
          </T>
        ))}
        {rows.map((r, i) => (
          <div key={r.label}>
            {[r.label, ...r.vals].map((v, j) => (
              <T
                key={j}
                x={colX(j)}
                y={50 + i * 50}
                w={TABLE_COLS[j]}
                h={50}
                s={20}
                wt={r.bold ? 700 : 400}
                al={j ? 'center' : 'left'}
                c={r.bold && j === 1 ? ULTRA : INK}
                style={{ lineHeight: '50px', paddingLeft: j ? 0 : 8, background: j === 1 ? TINT : undefined }}
              >
                {v}
              </T>
            ))}
            <HLine x={0} y={50 + i * 50} w={512} c={INK} />
          </div>
        ))}
      </B>
      <T x={1340} y={800} w={484} h={150} s={21} lh={1.4}>
        <b>Чому не найбільша криза?</b> E-commerce горить найсильніше, але при чистому боргу ${CASE_DATA.ecom.netDebt}m частка
        фонду коштує ~$7.5m. $10m «порятунку» захищали б передусім кредиторів.
      </T>
    </Sheet>
  )
}

// ── 3. Розподіл капіталу ────────────────────────────────────────────────────

function S3(p: SlideProps) {
  const base = 960
  const totalAsk = CASE_DATA.sec.request + CASE_DATA.ecom.request + CASE_DATA.it.request
  const k = 530 / totalAsk
  // Запити — пунктирна колона; виділене — суцільна, з'єднані смугами потоку
  const req = {
    sec: [base - CASE_DATA.sec.request * k, base],
    ecom: [base - (CASE_DATA.sec.request + CASE_DATA.ecom.request) * k, base - CASE_DATA.sec.request * k],
    it: [base - totalAsk * k, base - (CASE_DATA.sec.request + CASE_DATA.ecom.request) * k],
  }
  const give = {
    sec: [base - TEAM_ALLOCATION.sec * k, base],
    ecom: [base - (TEAM_ALLOCATION.sec + TEAM_ALLOCATION.ecom) * k, base - TEAM_ALLOCATION.sec * k],
    res: [base - FUND.freeCapital * k, base - (TEAM_ALLOCATION.sec + TEAM_ALLOCATION.ecom) * k],
  }
  const reqBox = (y0: number, y1: number, label: string) => (
    <B
      x={96}
      y={y0}
      w={180}
      h={y1 - y0}
      style={{
        border: `1.5px dashed ${INK}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 20,
      }}
    >
      {label}
    </B>
  )
  const band = (l: number[], r: number[]) => `M0,${l[0]} L164,${r[0]} L164,${r[1]} L0,${l[1]} Z`
  const blocks = [
    {
      y: 444,
      h: 98,
      title: `Security Hardware: ${m0(TEAM_ALLOCATION.sec)}, 70% часу команди`,
      c: ULTRA,
      body: '2 транші під віхи: $4m при підписанні СП (міс. 2–3), $6m при запуску пілотної лінії (міс. 8–9). Ще ~$5m дають FCF компанії та партнер СП.',
    },
    {
      y: 570,
      h: 152,
      title: `E-commerce: ${m0(TEAM_ALLOCATION.ecom)}, 15% часу`,
      c: INK,
      body: 'Забезпечений бридж із першочерговим погашенням, лише після мораторію кредиторів і внеску засновника. Тріаж: 13-тижневий cash-план, 3PL замість відбудови складів, вужчий асортимент (+$4–5m оборотного капіталу), M&A-радник з міс. 2, продаж до міс. 15.',
    },
    {
      y: 750,
      h: 126,
      title: `IT-інжиніринг: ${m0(TEAM_ALLOCATION.it)}, 15% часу`,
      c: INK,
      body: `Без боргу, EBITDA $${CASE_DATA.it.ebitdaLast}m: вихідні допомоги (~$2m) з власного cash flow. −${A.it.plan.fteCut} FTE з бенчу (утилізація 70% → ~78%), ціни й AI-assisted delivery дають EBITDA ~$${A.it.plan.ebitda}m (16%). Продаж консолідатору чи PE з міс. 9.`,
    },
  ]
  return (
    <Sheet
      {...p}
      kicker="Етап 1. Розподіл капіталу"
      title={`${m0(FUND.freeCapital)} проти запитів на ${m0(totalAsk)}: гроші туди, де вони множаться`}
      bottom={`Security отримує ${m0(TEAM_ALLOCATION.sec)} двома траншами під віхи, E-commerce лише бридж ${m0(TEAM_ALLOCATION.ecom)}, IT нуль.`}
      foot="Припущення: решту потреб E-com закриває вивільнення оборотного капіталу; IT: ~$42k повних витрат на спеціаліста."
    >
      <T x={96} y={392} w={300} h={30} f="mono" s={19} c={STONE_INK}>
        Запити, {m0(totalAsk)}
      </T>
      {reqBox(req.it[0], req.it[1], `IT ${m0(CASE_DATA.it.request)}`)}
      {reqBox(req.ecom[0], req.ecom[1], `E-com ${m0(CASE_DATA.ecom.request)}`)}
      {reqBox(req.sec[0], req.sec[1], `Security ${m0(CASE_DATA.sec.request)}`)}

      <svg
        className="a-fade"
        style={{ position: 'absolute', left: 276, top: 0, ...d(1300) }}
        width={164}
        height={base}
        viewBox={`0 0 164 ${base}`}
        aria-hidden
      >
        <path d={band(req.sec, give.sec)} fill={ULTRA} opacity={0.14} />
        <path d={band(req.ecom, give.ecom)} fill={INK} opacity={0.1} />
        <path d={`M0,${req.it[0]} L164,${req.it[0] + 64} L0,${req.it[1]} Z`} fill={STONE} opacity={0.25} />
      </svg>

      <T x={440} y={give.res[0] - 42} w={300} h={30} f="mono" s={19} c={STONE_INK}>
        Даємо, {m0(FUND.freeCapital)}
      </T>
      <B x={440} y={give.sec[0]} w={180} h={give.sec[1] - give.sec[0]} bg={ULTRA} className="a-grow-y" style={d(400)} />
      <B x={440} y={give.ecom[0]} w={180} h={give.ecom[1] - give.ecom[0]} bg={INK} className="a-grow-y" style={d(750)} />
      <B x={440} y={give.res[0]} w={180} h={give.res[1] - give.res[0]} bg={STONE} className="a-grow-y" style={d(1000)} />
      <HLine x={96} y={base} w={544} c={INK} t={1.5} />
      <T x={636} y={give.res[0] - 6} w={180} h={34} f="disp" s={25}>
        {m0(pf.reserve)} резерв
      </T>
      <T x={636} y={give.ecom[0] + 6} w={180} h={34} f="disp" s={25}>
        {m0(TEAM_ALLOCATION.ecom)} E-com
      </T>
      <T x={636} y={(give.sec[0] + give.sec[1]) / 2 - 17} w={230} h={34} f="disp" s={25} c={ULTRA}>
        {m0(TEAM_ALLOCATION.sec)} Security
      </T>
      <T x={452} y={req.it[0] + 46} w={300} h={34} f="disp" s={26} c={STONE_INK}>
        IT: {m0(TEAM_ALLOCATION.it)}
      </T>

      <VLine x={820} y={392} h={568} />
      <T x={860} y={392} w={964} h={34} s={22}>
        <b>Не робимо:</b> <s>відбудову складів E-com</s>, <s>AI-M&amp;A в IT</s>, <s>«чек» Security без віх</s>,{' '}
        <s>завод з нуля</s>
      </T>
      {blocks.map((b, i) => (
        <div key={b.title}>
          {i > 0 && <HLine x={860} y={b.y - 14} w={964} />}
          <T x={860} y={b.y} w={964} h={b.h} s={20} lh={1.38}>
            <p className="f-disp" style={{ fontSize: 28, color: b.c }}>
              {b.title}
            </p>
            <p>{b.body}</p>
          </T>
        </div>
      ))}
      <HLine x={860} y={890} w={964} />
      <T x={860} y={904} w={964} h={58} s={20} lh={1.38}>
        <span className="f-disp" style={{ fontSize: 24, color: STONE_INK }}>
          Резерв: {m0(pf.reserve)}.
        </span>{' '}
        Перевитрати Security або витрати на продаж E-com; кожне використання вирішує інвесткомітет.
      </T>
    </Sheet>
  )
}

// ── 4. Важелі Security ──────────────────────────────────────────────────────

const LEVERS = [
  {
    n: '01',
    name: 'Хаб виробництва в ЄС',
    what: 'Серія в ЄС/НАТО через СП чи контрактного виробника, не завод з нуля: 25% → ≥50% потужностей поза Україною',
    how: `Знімає головне заперечення покупців (${A.sec.sq.mult}x → ${A.sec.plan.mult}x) і відкриває тендери з локалізацією`,
    need: '$10m фонду + ~$5m компанії й партнера; COO International, PMO; 9–12 міс.',
    kpi: '≥50%',
    kpiText: 'потужностей поза Україною до міс. 18; перша серія в ЄС на міс. 10',
  },
  {
    n: '02',
    name: 'Довгострокові контракти',
    what: 'Ріст у 2–3-річні рамкові контракти з урядами ЄС/НАТО та інтеграторами; передоплати під локальне виробництво',
    how: 'Видимість виручки: головний драйвер мультиплікатора в обороні; передоплати фінансують оборотку',
    need: '~$1m опексу (BD, тендери); CEO + комерційний директор; 6–15 міс.',
    kpi: '≥1,5x',
    kpiText: 'портфель замовлень до виручки NTM; ≥2 рамкові угоди до міс. 15',
  },
  {
    n: '03',
    name: 'Стійкість бази в Україні',
    what: '≥3 майданчики (≤35% випуску на одному), запас критичних компонентів на 90 днів, другі постачальники, страхування воєнних ризиків',
    how: 'Захищає EBITDA від ударів і зменшує дисконт за ризик у DD покупця',
    need: '~$3m компанії (capex + запаси); COO; 3–9 міс.',
    kpi: '≤35%',
    kpiText: 'випуску на одному майданчику; ≥90 днів запасу до міс. 9',
  },
  {
    n: '04',
    name: 'Готовність до продажу',
    what: 'Аудит IFRS (Big4) за 2026–27, комплаєнс експортного контролю й санкцій, чисте IP, CFO з M&A-досвідом, MIP під вихід, VDD',
    how: 'Ширше коло покупців, менше знижок ціни на DD, швидше закриття угоди',
    need: '~$1.5m компанії (аудит, радники); CFO + команда фонду; 12–15 міс.',
    kpi: '≥8',
    kpiText: 'покупців у першому раунді; аудит IFRS + VDD до міс. 15',
  },
]

function S4(p: SlideProps) {
  // Шкала EV/EBITDA 0…12x
  const x0 = 300
  const kx = 127
  const at = (m: number) => x0 + m * kx
  const sq = at(A.sec.sq.mult)
  const plan = at(A.sec.plan.mult)
  return (
    <Sheet
      {...p}
      kicker="Етап 2. Security Hardware: важелі"
      title={`Чотири важелі переводять Security з ${A.sec.sq.mult}x у ${A.sec.plan.mult}x EBITDA`}
      bottom="Історія для покупця: бойово перевірена технологія з виробництвом у НАТО, а не «завод в Україні»."
      foot="Модель СП відповідає «Build with Ukraine»: європейський партнер фінансує й дає потужності, українська компанія дає технологію."
    >
      <T x={96} y={428} w={190} h={26} f="mono" s={19} c={STONE_INK}>
        EV/EBITDA
      </T>
      <HLine x={x0} y={440} w={1524} c={INK} t={1.5} />
      {Array.from({ length: 13 }, (_, i) => (
        <VLine key={i} x={at(i)} y={433} h={14} c={INK} />
      ))}
      <T x={x0 - 14} y={456} w={40} h={24} f="mono" s={18} al="center" c={STONE_INK}>
        0
      </T>
      <VLine x={sq} y={402} h={38} c={INK} />
      <VLine x={plan} y={402} h={38} c={INK} />
      {/* Розмірна лінія 6x → 9x малюється зліва направо: це і є переоцінка */}
      <B x={sq} y={409} w={plan - sq} h={2} bg={ULTRA} className="a-grow-x" style={d(500)}>
        <svg style={{ position: 'absolute', left: -1, top: -7 }} width={12} height={16} aria-hidden>
          <path d="M0,8 L12,1 L12,15 Z" fill={ULTRA} />
        </svg>
        <svg style={{ position: 'absolute', right: -1, top: -7 }} width={12} height={16} aria-hidden>
          <path d="M12,8 L0,1 L0,15 Z" fill={ULTRA} />
        </svg>
      </B>
      <T x={(sq + plan) / 2 - 240} y={372} w={480} h={30} f="disp" s={22} al="center" c={ULTRA} className="a-fade" style={d(1300)}>
        +3x: головне джерело вартості, +{m0(wf.rerating)}
      </T>
      <B x={sq - 11} y={429} w={22} h={22} bg={STONE} style={{ borderRadius: '50%' }} />
      <B x={plan - 13} y={427} w={26} h={26} bg={ULTRA} className="a-pop" style={{ borderRadius: '50%', ...d(1350) }} />
      <B x={1684 - 9} y={431} w={18} h={18} bg={PAPER} style={{ borderRadius: '50%', border: `2px solid ${INK}` }} />
      <T x={sq - 150} y={458} w={300} h={28} s={20} al="center">
        {A.sec.sq.mult}x без плану
      </T>
      <T x={plan - 190} y={458} w={380} h={28} s={20} wt={600} al="center" c={ULTRA}>
        {A.sec.plan.mult}x за планом, EBITDA LTM ~{m0(exitEbitda)}
      </T>
      <T x={1510} y={378} w={314} h={24} f="mono" s={18} al="right" c={STONE_INK}>
        ~11x медіана, Cavendish 2026
      </T>

      {[516, 952, 1388].map((x) => (
        <VLine key={x} x={x} y={500} h={438} />
      ))}
      {LEVERS.map((l, i) => {
        const x = 96 + i * 436
        const w = i === 3 ? 420 : 400
        return (
          <div key={l.n}>
            <T x={x} y={500} w={w + 10} h={38} f="disp" s={27}>
              <span className="f-mono" style={{ fontSize: 22, fontWeight: 400, color: ULTRA }}>
                {l.n}{' '}
              </span>
              {l.name}
            </T>
            <T x={x} y={548} w={w} h={112} s={20} lh={1.38}>
              {l.what}
            </T>
            <T x={x} y={666} w={w} h={84} s={20} lh={1.38} c={STONE_INK}>
              {l.how}
            </T>
            <T x={x} y={756} w={w} h={52} f="mono" s={17} lh={1.4} c={STONE_INK}>
              {l.need}
            </T>
            <T x={x} y={814} w={w} h={70} f="disp" s={58} ls={-1} c={ULTRA} className="a-fade" style={d(1600 + i * 180)}>
              {l.kpi}
            </T>
            <T x={x} y={886} w={w} h={54} s={19} lh={1.35}>
              {l.kpiText}
            </T>
          </div>
        )
      })}
    </Sheet>
  )
}

// ── 5. Ризики й тригери ─────────────────────────────────────────────────────

const RISKS = [
  {
    title: 'Затримка експортних дозволів і сертифікації в ЄС',
    resp: '2 країни × 2 партнери паралельно; транші під віхи; запасний план: ліцензування технології',
  },
  { title: 'Перемир’я чи зміна бюджетів знижують попит', resp: 'Диверсифікація в критичну інфраструктуру й dual-use; індексація цін у контрактах' },
  { title: 'Удар по ключовому майданчику в Україні', resp: 'Розосередження, запаси на 90 днів, страхування; хаб у ЄС як резервна потужність' },
  { title: 'Виробництво в ЄС «з’їдає» маржу', resp: 'Контрактний виробник замість власного заводу; ліміт надбавки до собівартості +10%' },
  { title: 'Засновники не згодні з ціною; відтік ключових людей', resp: 'Нижня межа ціни та MIP у перші 100 днів; ретеншн для топ-20 інженерів' },
]

// Позиції ризиків на матриці «ймовірність × вплив» (центр, радіус)
const MARKERS = [
  { cx: 495, cy: 540, r: 40, bg: INK, s: 34 },
  { cx: 225, cy: 500, r: 30, bg: INK, s: 26 },
  { cx: 305, cy: 580, r: 30, bg: INK, s: 26 },
  { cx: 225, cy: 740, r: 24, bg: STONE_INK, s: 20 },
  { cx: 305, cy: 820, r: 24, bg: STONE_INK, s: 20 },
]

const GATES: { when: string; cond: string; act: string; extra?: [string, string] }[] = [
  { when: 'День 60. Зупинити', cond: 'E-com: немає мораторію кредиторів', act: 'бриджу немає, pre-pack продаж' },
  { when: 'Міс. 12. Зупинити', cond: 'Немає серії в ЄС або capex +30%', act: 'заморожуємо транш 2, ліцензування' },
  { when: 'До міс. 15. Прискорити', cond: `Пропозиція ≥${A.sec.plan.mult}x LTM EBITDA`, act: 'прискорений процес на 3 міс.' },
  { when: 'Будь-коли. Прискорити', cond: 'Перемир’я з гарантіями безпеки', act: 'продаж раніше, на піку попиту' },
  {
    when: 'Щокварталу. Змінити пріоритет',
    cond: 'Ріст Security <10% р/р два квартали або втрата топ-клієнта',
    act: 'перегляд фокусу й резерву',
    extra: ['IT: утилізація <65% чи маржа <8%', 'продаємо негайно'],
  },
]

function S5(p: SlideProps) {
  return (
    <Sheet
      {...p}
      kicker="Етап 2. Ризики та умови перемикання"
      title="Кожен ризик має готову відповідь і тригер перемикання"
      bottom="Транш 2 ($6m) виходить лише після серії в ЄС, інакше з міс. 12 переходимо на ліцензування."
      foot="Тригери переглядає рада щокварталу; ті самі пороги відстежує Telegram-бот Board Alerts (@case_challenge_bot)."
    >
      <T x={150} y={388} w={230} h={24} f="mono" s={18} al="center" c={STONE_INK}>
        ймов. середня
      </T>
      <T x={380} y={388} w={230} h={24} f="mono" s={18} al="center" c={STONE_INK}>
        ймов. висока
      </T>
      <T x={-15} y={528} w={240} h={24} f="mono" s={18} al="center" c={STONE_INK} style={{ transform: 'rotate(-90deg)' }}>
        вплив високий
      </T>
      <T x={-15} y={768} w={240} h={24} f="mono" s={18} al="center" c={STONE_INK} style={{ transform: 'rotate(-90deg)' }}>
        вплив середній
      </T>
      {[
        { x: 150, y: 420, bg: '#E6E5DF' },
        { x: 380, y: 420, bg: '#D4D2C9' },
        { x: 150, y: 660, bg: PAPER },
        { x: 380, y: 660, bg: '#E6E5DF' },
      ].map((c) => (
        <B key={`${c.x}-${c.y}`} x={c.x} y={c.y} w={231} h={241} bg={c.bg} style={{ border: `1px solid ${INK}` }} />
      ))}
      {MARKERS.map((m, i) => (
        <Chip
          key={i}
          x={m.cx - m.r}
          y={m.cy - m.r}
          w={m.r * 2}
          h={m.r * 2}
          bg={m.bg}
          s={m.s}
          className="a-pop"
          style={{ borderRadius: '50%', ...d(300 + i * 160) }}
        >
          {i + 1}
        </Chip>
      ))}

      <T x={660} y={388} w={540} h={24} f="mono" s={18} c={STONE_INK}>
        Ризик і відповідь
      </T>
      {RISKS.map((r, i) => (
        <T key={r.title} x={660} y={420 + i * 100} w={570} h={98} s={19} lh={1.35}>
          <p style={{ fontSize: 20, fontWeight: 700 }}>
            {i + 1}. {r.title}
          </p>
          <p>{r.resp}</p>
        </T>
      ))}

      <T x={1260} y={388} w={564} h={24} f="mono" s={18} c={STONE_INK}>
        Тригери перемикання, у порядку часу
      </T>
      {/* Вісь часу проростає вниз, точки рішень з'являються по черзі */}
      <B x={1275} y={428} w={1.5} h={502} bg={INK} className="a-drop" style={d(200)} />
      {GATES.map((g, i) => (
        <div key={g.when}>
          <B
            x={1267}
            y={426 + i * 100}
            w={18}
            h={18}
            bg={SIGNAL}
            className="a-pop"
            style={{ transform: 'rotate(45deg)', ...d(500 + i * 220) }}
          />
          <T x={1308} y={420 + i * 100} w={516} h={i === 4 ? 124 : 96} s={19} lh={1.35}>
            <p className="f-mono" style={{ fontSize: 18, color: SIGNAL_INK }}>
              {g.when}
            </p>
            <p>
              {g.cond} → <b>{g.act}</b>
              {g.extra && (
                <>
                  . {g.extra[0]} → <b>{g.extra[1]}</b>
                </>
              )}
            </p>
          </T>
        </div>
      ))}
    </Sheet>
  )
}

// ── 6. Роудмап ──────────────────────────────────────────────────────────────

const MONTHS = FUND.horizonMonths
const SALE_START = 15
const GX = 380
const GW = 1444
// Місяць m займає відрізок [m−1, m] на осі 0…24
const mx = (m: number) => GX + ((m - 1) / MONTHS) * GW
const mw = (a: number, b: number) => ((b - a + 1) / MONTHS) * GW
const ROW0 = 452
const ROW_H = 38

const GANTT: { who: string; what: string; from: number; to: number; bg: string; c: string; text: string }[] = [
  { who: 'Security', what: 'хаб у ЄС', from: 1, to: 18, bg: ULTRA, c: PAPER, text: 'Партнер → пілотна лінія → серія (міс. 10) → ≥50% поза Україною' },
  { who: 'Security', what: 'контракти', from: 3, to: 15, bg: ULTRA, c: PAPER, text: '≥2 рамкові контракти, портфель ≥1,5x виручки' },
  { who: 'Security', what: 'стійкість УА', from: 1, to: 9, bg: ULTRA, c: PAPER, text: 'Розосередження, запаси 90 днів' },
  { who: 'Security', what: 'готовність', from: 1, to: 15, bg: ULTRA, c: PAPER, text: 'Аудит IFRS, CFO, комплаєнс, VDD (міс. 15)' },
  { who: 'Security', what: 'продаж', from: SALE_START, to: 24, bg: INK, c: PAPER, text: 'Продаж: запуск → підпис → закриття' },
  { who: 'E-com', what: 'тріаж', from: 1, to: 4, bg: STONE, c: INK, text: 'Тріаж + бридж' },
  { who: 'E-com', what: 'продаж', from: 6, to: 15, bg: INK, c: PAPER, text: 'Продаж стратегу, закриття ≤ міс. 15' },
  { who: 'IT', what: 'оптимізація', from: 1, to: 8, bg: STONE, c: INK, text: `−${A.it.plan.fteCut} FTE бенчу, ціни, AI` },
  { who: 'IT', what: 'продаж', from: 9, to: 16, bg: INK, c: PAPER, text: 'Продаж, закриття ≤ міс. 16' },
]
const G_BOTTOM = ROW0 + GANTT.length * ROW_H - 4
const dashed = (c: string, on: number, off: number) =>
  `repeating-linear-gradient(to bottom, ${c} 0 ${on}px, transparent ${on}px ${on + off}px)`

function S6(p: SlideProps) {
  return (
    <Sheet
      {...p}
      kicker="Етап 2. Роудмап і вихід"
      title="24 місяці: три послідовні виходи, Security останній"
      bottom="E-commerce продаємо до міс. 15, IT до міс. 16, Security на міс. 23–24, коли хаб у ЄС уже випускає серію."
      bottomW={1700}
      stamp="qr"
      stampTitle="QR: перевірте план самі"
      stampText="Exit Simulator: усі цифри деку, кожне припущення можна змінити, сценарій зберігається в посиланні."
    >
      <B x={mx(1)} y={376} w={mw(1, 3)} h={G_BOTTOM - 376} bg="#E6E5DF" />
      <B x={mx(13)} y={376} w={mw(13, 24)} h={G_BOTTOM - 376} bg="#E6E5DF" />
      <T x={mx(1) + 8} y={382} w={172} h={24} f="mono" s={18}>
        Перші 100 днів
      </T>
      <T x={mx(4) + 8} y={382} w={530} h={24} f="mono" s={18}>
        Міс. 4–12, лют – жов 2027
      </T>
      <T x={mx(13) + 8} y={382} w={700} h={24} f="mono" s={18}>
        Міс. 13–24, лис 2027 – жов 2028
      </T>
      <T x={96} y={424} w={200} h={24} f="mono" s={18} c={STONE_INK}>
        Місяць
      </T>
      {[1, 3, 6, 9, 12, 15, 18, 21, 24].map((m) => (
        <T
          key={m}
          x={mx(m) + 4}
          y={424}
          w={40}
          h={24}
          f="mono"
          s={18}
          wt={m === SALE_START ? 700 : 400}
          c={m === SALE_START ? SIGNAL_INK : STONE_INK}
        >
          {m}
        </T>
      ))}
      {GANTT.map((g, i) => {
        const y = ROW0 + i * ROW_H
        return (
          <div key={`${g.who}-${g.what}`}>
            {(i === 5 || i === 7) && <HLine x={96} y={y - 10} w={1728} c="#C9C7BE" />}
            <T x={96} y={y + 6} w={280} h={28} s={19}>
              <b>{g.who}</b> <span style={{ color: STONE_INK }}>{g.what}</span>
            </T>
            <B
              x={mx(g.from)}
              y={y + 6}
              w={mw(g.from, g.to)}
              h={26}
              bg={g.bg}
              className="a-sweep"
              style={{
                display: 'flex',
                alignItems: 'center',
                paddingLeft: 12,
                overflow: 'hidden',
                whiteSpace: 'nowrap',
                fontSize: 18,
                fontWeight: 600,
                color: g.c,
                ...d(200 + (g.from - 1) * 70 + i * 60),
              }}
            >
              {g.text}
            </B>
          </div>
        )
      })}
      <B x={mx(SALE_START) - 1.5} y={420} w={3} h={G_BOTTOM - 420} className="a-drop" style={{ background: dashed(SIGNAL, 8, 6), ...d(1900) }} />

      <T x={96} y={812} w={1200} h={60} s={19} lh={1.4}>
        <b>Віхи Security:</b> міс. 3 транш $4m; міс. 9 транш $6m; міс. 10 перша серія в ЄС; міс. 15 запуск продажу (січ 2028);
        міс. 17 індикативні пропозиції; міс. 20 підписання; міс. 23–24 дозволи FDI й закриття.
      </T>
      <T x={96} y={884} w={1200} h={84} s={19} lh={1.4}>
        <b>Найімовірніший покупець.</b> Security: європейський оборонний стратег (prime чи mid-cap консолідатор), технологія +
        виробництво в НАТО. IT: сервісний консолідатор чи PE. E-com: рітейлер або маркетплейс.
      </T>

      {[
        { x: 96, bg: ULTRA, label: 'створення вартості', w: 210 },
        { x: 340, bg: INK, label: 'продаж', w: 100 },
        { x: 480, bg: STONE, label: 'підтримка', w: 130 },
      ].map((l) => (
        <div key={l.label}>
          <B x={l.x} y={1000} w={26} h={14} bg={l.bg} />
          <T x={l.x + 34} y={994} w={l.w} h={26} s={18} c={STONE_INK}>
            {l.label}
          </T>
        </div>
      ))}
      <B x={659} y={996} w={3} h={22} style={{ background: dashed(SIGNAL, 5, 4) }} />
      <T x={674} y={994} w={460} h={26} s={18} c={STONE_INK}>
        старт продажу Security, міс. {SALE_START}
      </T>
    </Sheet>
  )
}

export { S1, S2, S3, S4, S5, S6 }
