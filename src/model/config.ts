// УСІ припущення моделі в одному місці (PLAN.md, розділ 4).
// Суми — у $m, ставки — частки (0.15 = 15%), мультиплікатори — x EV/EBITDA.
// Компоненти не містять власних чисел: лише беруть їх звідси.

export type CompanyId = 'sec' | 'it' | 'ecom'

export const COMPANY_IDS: readonly CompanyId[] = ['sec', 'it', 'ecom']

export const COMPANY_NAMES: Record<CompanyId, string> = {
  sec: 'Security Hardware',
  it: 'IT-інжиніринг',
  ecom: 'E-commerce',
}

export const COMPANY_NAMES_EN: Record<CompanyId, string> = {
  sec: 'Security Hardware',
  it: 'IT Engineering',
  ecom: 'E-commerce',
}

// ── 4.1. Дані кейсу (незмінні) ──────────────────────────────────────────────

export const CASE_DATA = {
  ecom: {
    revenuePrev: 700,
    revenueLast: 600,
    ebitdaPrev: 35,
    ebitdaLast: 12,
    netDebt: 35,
    ownership: 0.3,
    request: 10,
    facts: [
      'Втрачено 40% складів',
      'Доставка 2 → 5 днів',
      'Ліквідність потрібна протягом 6 місяців',
    ],
  },
  it: {
    revenuePrev: 200,
    revenueLast: 180,
    ebitdaPrev: 36,
    ebitdaLast: 21.6,
    netDebt: 0,
    ownership: 0.3,
    request: 8,
    headcount: 3000,
    utilizationPrev: 0.85,
    utilizationLast: 0.7,
    facts: [
      '~3 000 спеціалістів',
      'Утилізація 85% → 70%',
      'Репозиціонування займе 12–18 місяців',
    ],
  },
  sec: {
    revenuePrev: 250,
    revenueLast: 325,
    ebitdaPrev: 50,
    ebitdaLast: 65,
    netDebt: 10,
    ownership: 0.2,
    request: 15,
    facts: [
      '95% продажів міжнародні',
      '75% виробництва в Україні',
      'Розширення за кордон займе 12–18 місяців',
    ],
  },
} as const

export const FUND = {
  freeCapital: 15,
  horizonMonths: 24,
} as const

// ── 4.2. Припущення команди (редаговані в UI) ───────────────────────────────

export interface Assumptions {
  sec: {
    multToday: number
    sq: { growth: number; margin: number; mult: number; netDebt: number }
    plan: { growth: number; margin: number; mult: number; netDebtExit: number }
    investment: number
    years: number
  }
  it: {
    multToday: number
    drift: { ebitda: number; mult: number }
    plan: {
      fteCut: number
      costShareOfOpex: number
      reinvest: number
      ebitda: number
      mult: number
    }
  }
  ecom: {
    multToday: number
    sq: { fundValue: number; fundMin: number; fundMax: number }
    plan: { ebitda: number; mult: number; bridge: number }
  }
}

export const DEFAULT_ASSUMPTIONS: Assumptions = {
  sec: {
    multToday: 6,
    sq: { growth: 0.15, margin: 0.2, mult: 6, netDebt: CASE_DATA.sec.netDebt },
    plan: { growth: 0.2, margin: 0.2, mult: 9, netDebtExit: 15 },
    investment: 10,
    years: 2,
  },
  it: {
    multToday: 6,
    drift: { ebitda: 15, mult: 5 },
    plan: {
      fteCut: 300,
      // частка витрат, що припадає на персонал: (виручка − EBITDA) × 0.8
      costShareOfOpex: 0.8,
      reinvest: 4.6,
      // консервативно, з дисконтом до розрахункових ~29.7
      ebitda: 28,
      mult: 6,
    },
  },
  ecom: {
    multToday: 5,
    sq: { fundValue: 2, fundMin: 0, fundMax: 5 },
    plan: { ebitda: 20, mult: 5, bridge: 3 },
  },
}

// Довідка на повзунку мультиплікатора Security
export const BENCHMARKS = {
  defenceDealMedianMult: 10.9,
  defenceDealSource: 'Cavendish, 2026',
} as const

// ── 6. Лінза пріоритетів ────────────────────────────────────────────────────

export type CriterionId = 'valueAtRisk' | 'urgency' | 'fundImpact' | 'exitReadiness'

export const CRITERIA: readonly { id: CriterionId; label: string; labelEn: string; info: string; infoEn: string }[] = [
  {
    id: 'valueAtRisk',
    label: 'Цінність під ризиком',
    labelEn: 'Value at risk',
    info: 'Скільки грошей фонду можна втратити або створити в цій компанії.',
    infoEn: 'How much of the fund’s money can be lost or created in this company.',
  },
  {
    id: 'urgency',
    label: 'Терміновість',
    labelEn: 'Urgency',
    info: 'Як швидко треба діяти, поки вікно можливостей не закрилося.',
    infoEn: 'How fast the fund must act before the window closes.',
  },
  {
    id: 'fundImpact',
    label: 'Вплив фонду',
    labelEn: 'Fund impact',
    info: 'Наскільки результат цієї компанії зрушує підсумок усього фонду.',
    infoEn: 'How much this company’s outcome moves the result of the whole fund.',
  },
  {
    id: 'exitReadiness',
    label: 'Готовність до виходу',
    labelEn: 'Exit readiness',
    info: 'Наскільки реально продати частку фонду за 24 місяці.',
    infoEn: 'How realistic it is to sell the fund’s stake within 24 months.',
  },
]

export type LensScores = Record<CompanyId, Record<CriterionId, number>>
export type LensWeights = Record<CriterionId, number>

export const DEFAULT_LENS: LensScores = {
  sec: { valueAtRisk: 5, urgency: 4, fundImpact: 5, exitReadiness: 4 },
  it: { valueAtRisk: 3, urgency: 3, fundImpact: 3, exitReadiness: 3 },
  ecom: { valueAtRisk: 2, urgency: 5, fundImpact: 2, exitReadiness: 1 },
}

export const DEFAULT_WEIGHTS: LensWeights = {
  valueAtRisk: 1,
  urgency: 1,
  fundImpact: 1,
  exitReadiness: 1,
}

export const LENS_LIMITS = {
  scoreMin: 1,
  scoreMax: 5,
  weightMin: 0.5,
  weightMax: 2,
  weightStep: 0.1,
  // шум тесту стійкості: до кожної оцінки додається ціле з [−jitter, +jitter]
  jitter: 1,
  robustnessRuns: 10_000,
} as const

// ── 7. Монте-Карло ──────────────────────────────────────────────────────────

// σ неперервного шуму. Середні беруться з поточного сценарію (Assumptions).
export interface NoiseParams {
  secGrowthSd: number
  secMarginSd: number
  secMultSd: number
  secMultMin: number
  secMultMax: number
  itEbitdaSd: number
  itMultSd: number
  ecomEbitdaSd: number
}

export const DEFAULT_NOISE: NoiseParams = {
  secGrowthSd: 0.03,
  secMarginSd: 0.015,
  secMultSd: 1,
  secMultMin: 4,
  secMultMax: 14,
  itEbitdaSd: 3,
  itMultSd: 0.7,
  ecomEbitdaSd: 4,
}

export interface RiskEvents {
  exportDelay: { p: number; growthHit: number; upliftKept: number }
  ceasefire: { p: number; growthHit: number; multBoost: number }
  siteStrike: { p: number; ebitdaHitNoHub: number; ebitdaHitWithHub: number }
  euMargin: { p: number; marginHit: number }
  founderConflict: { p: number; forcedSaleDiscount: number }
  ecomCreditors: { p: number }
  itUtilization: { p: number; ebitdaHit: number; mult: number }
  overrun: { p: number; need: number; upliftKept: number }
}

export type EventId = keyof RiskEvents

export const DEFAULT_EVENTS: RiskEvents = {
  exportDelay: { p: 0.35, growthHit: 0.02, upliftKept: 0.5 },
  ceasefire: { p: 0.25, growthHit: 0.05, multBoost: 1 },
  siteStrike: { p: 0.15, ebitdaHitNoHub: 0.15, ebitdaHitWithHub: 0.07 },
  euMargin: { p: 0.3, marginHit: 0.02 },
  founderConflict: { p: 0.1, forcedSaleDiscount: 0.1 },
  ecomCreditors: { p: 0.3 },
  itUtilization: { p: 0.2, ebitdaHit: 0.25, mult: 4.5 },
  // QUESTION: подія «перевитрати програми Security» відсутня у таблиці 7.2,
  // але розділ 8 каже, що резерв «знижує ризик перевитрат у Монте-Карло».
  // Параметри — заглушка команди: з імовірністю p програмі потрібно ще `need`;
  // непокрита резервом частка зрізає приріст мультиплікатора до `upliftKept`.
  overrun: { p: 0.25, need: 2, upliftKept: 0.5 },
}

export const EVENT_META: Record<
  EventId,
  {
    label: string
    labelEn: string
    effect: string
    effectEn: string
    appliesPlan: boolean
    appliesSq: boolean
    trigger?: string
    triggerEn?: string
  }
> = {
  exportDelay: {
    label: 'Затримка експортних дозволів / сертифікації в ЄС',
    labelEn: 'EU export permits / certification delayed',
    effect: 'Security: ріст −2 п.п.; приріст мультиплікатора вдвічі менший',
    effectEn: 'Security: growth −2 pp; multiple uplift halved',
    appliesPlan: true,
    appliesSq: false,
  },
  ceasefire: {
    label: "Перемир'я / зміна оборонних бюджетів",
    labelEn: 'Ceasefire / defence budgets change',
    effect: 'Security: ріст −5 п.п., але мультиплікатор +1x',
    effectEn: 'Security: growth −5 pp, but multiple +1x',
    appliesPlan: true,
    appliesSq: true,
  },
  siteStrike: {
    label: 'Удар по ключовому майданчику в Україні',
    labelEn: 'Strike on a key site in Ukraine',
    effect: 'Security: EBITDA −15% (з хабом у ЄС −7%)',
    effectEn: 'Security: EBITDA −15% (−7% with an EU hub)',
    appliesPlan: true,
    appliesSq: true,
  },
  euMargin: {
    label: 'Виробництво в ЄС з’їдає маржу',
    labelEn: 'EU production eats into margin',
    effect: 'Security: маржа −2 п.п.',
    effectEn: 'Security: margin −2 pp',
    appliesPlan: true,
    appliesSq: false,
  },
  founderConflict: {
    label: 'Конфлікт із засновниками / ключові люди',
    labelEn: 'Conflict with founders / key people',
    effect: 'Вихід після дедлайну → дисконт примусового продажу −10%',
    effectEn: 'Exit after the deadline → forced-sale discount −10%',
    appliesPlan: true,
    appliesSq: true,
  },
  ecomCreditors: {
    label: 'E-com: кредитори відмовили в мораторії',
    labelEn: 'E-com: creditors refuse a moratorium',
    effect: 'Бридж не видається; гроші фонду з E-com = 0',
    effectEn: 'No bridge is issued; fund proceeds from E-com = 0',
    appliesPlan: true,
    appliesSq: false,
  },
  itUtilization: {
    label: 'IT: утилізація < 65%',
    labelEn: 'IT: utilisation < 65%',
    effect: 'EBITDA IT −25%, мультиплікатор 4.5x',
    effectEn: 'IT EBITDA −25%, multiple 4.5x',
    appliesPlan: true,
    appliesSq: true,
    trigger: 'Продати IT негайно',
    triggerEn: 'Sell IT immediately',
  },
  overrun: {
    label: 'Перевитрати програми Security',
    labelEn: 'Security programme cost overrun',
    effect: 'Непокрита резервом частка зрізає приріст мультиплікатора вдвічі',
    effectEn: 'The share not covered by the reserve halves the multiple uplift',
    appliesPlan: true,
    appliesSq: false,
  },
}

export const MC_LIMITS = {
  defaultRuns: 10_000,
  minRuns: 1_000,
  maxRuns: 50_000,
  runsStep: 1_000,
  defaultSeed: 42,
  histogramBins: 40,
  eventProbStep: 0.05,
  // затримка перед перерахунком після руху повзунка, мс
  debounceMs: 250,
} as const

// ── 8. Розподіл $15m ────────────────────────────────────────────────────────

export interface Allocation {
  sec: number
  ecom: number
  it: number
}

export const TEAM_ALLOCATION: Allocation = {
  sec: DEFAULT_ASSUMPTIONS.sec.investment,
  ecom: DEFAULT_ASSUMPTIONS.ecom.plan.bridge,
  it: 0,
}

export const ALLOCATION_RULES = {
  maxBySlider: { sec: 15, ecom: 10, it: 8 } as Allocation,
  step: 0.5,
  // Інвестиція, за якої Security отримує повний приріст плану
  secFullProgram: 10,
  // Мінімальний бридж, що рятує E-com, і ймовірність виживання
  ecomBridgeThreshold: 3,
  ecomSurvivalWithBridge: 0.7,
  ecomSurvivalWithout: 0.3,
} as const

// ── Повзунки сценаріїв (діапазони — теж припущення, тому тут) ────────────────

export type SliderFormat = 'pct' | 'mult' | 'money' | 'int'

export interface SliderSpec {
  path: string
  label: string
  labelEn: string
  // текст підказки (i)
  info: string
  infoEn: string
  min: number
  max: number
  step: number
  format: SliderFormat
  benchmark?: { value: number; label: string; labelEn: string }
}

// Лише ключові важелі кожної компанії; решта припущень лишається з DEFAULT_ASSUMPTIONS
// (і досі читається з посилання, якщо її там змінено).
export const SCENARIO_SLIDERS: Record<CompanyId, SliderSpec[]> = {
  sec: [
    {
      path: 'sec.plan.growth',
      label: 'Ріст виручки за планом, р/р',
      labelEn: 'Revenue growth under the plan, YoY',
      info: 'На скільки відсотків щороку зростає виручка Security, якщо фонд інвестує в розширення за кордон. За останній рік було +30% (250 → 325).',
      infoEn: 'How fast Security’s revenue grows each year if the fund invests in expansion abroad. Last year it was +30% (250 → 325).',
      min: 0,
      max: 0.4,
      step: 0.005,
      format: 'pct',
    },
    {
      path: 'sec.plan.mult',
      label: 'Мультиплікатор на виході',
      labelEn: 'Exit multiple',
      info: 'У скільки разів покупець оцінить компанію відносно її річного операційного прибутку (EV/EBITDA). Вартість = EBITDA × мультиплікатор. Риска — медіана угод в обороні.',
      infoEn: 'How many times its annual operating profit a buyer pays for the company (EV/EBITDA). Value = EBITDA × multiple. The tick marks the defence-deal median.',
      min: 4,
      max: 14,
      step: 0.1,
      format: 'mult',
      benchmark: {
        value: BENCHMARKS.defenceDealMedianMult,
        label: `медіана угод в обороні (${BENCHMARKS.defenceDealSource})`,
        labelEn: `defence deal median (${BENCHMARKS.defenceDealSource})`,
      },
    },
  ],
  it: [
    {
      path: 'it.plan.ebitda',
      label: 'EBITDA за планом',
      labelEn: 'EBITDA under the plan',
      info: 'Річний операційний прибуток IT-інжинірингу через 2 роки: після скорочення ~300 спеціалістів і реінвестицій в AI та продажі. Зараз $21.6m.',
      infoEn: 'IT Engineering’s annual operating profit in 2 years, after cutting ~300 staff and reinvesting in AI and sales. Today it is $21.6m.',
      min: 15,
      max: 35,
      step: 0.5,
      format: 'money',
    },
    {
      path: 'it.plan.mult',
      label: 'Мультиплікатор на виході',
      labelEn: 'Exit multiple',
      info: 'У скільки разів річного прибутку (EBITDA) покупець оцінить IT-бізнес на виході. Вартість = EBITDA × мультиплікатор.',
      infoEn: 'How many times its annual profit (EBITDA) a buyer pays for the IT business at exit. Value = EBITDA × multiple.',
      min: 3,
      max: 9,
      step: 0.1,
      format: 'mult',
    },
  ],
  ecom: [
    {
      path: 'ecom.plan.ebitda',
      label: 'EBITDA за планом',
      labelEn: 'EBITDA under the plan',
      info: 'Річний операційний прибуток E-commerce після стабілізації, якщо бридж від фонду допоможе пережити 6 місяців без ліквідності. Зараз $12m.',
      infoEn: 'E-commerce’s annual operating profit after it stabilises, if the fund’s bridge loan carries it through 6 months without liquidity. Today it is $12m.',
      min: 5,
      max: 35,
      step: 0.5,
      format: 'money',
    },
    {
      path: 'ecom.plan.mult',
      label: 'Мультиплікатор на виході',
      labelEn: 'Exit multiple',
      info: 'У скільки разів річного прибутку (EBITDA) покупець оцінить E-commerce на виході. Вартість = EBITDA × мультиплікатор.',
      infoEn: 'How many times its annual profit (EBITDA) a buyer pays for E-commerce at exit. Value = EBITDA × multiple.',
      min: 3,
      max: 8,
      step: 0.1,
      format: 'mult',
    },
  ],
}

export const DISCLAIMER = 'Дані кейсу ілюстративні; припущення — команди.'
export const DISCLAIMER_EN = 'Case data is illustrative; assumptions are the team’s.'

// ── 13. Board Alerts (Telegram-бот) ─────────────────────────────────────────

// Пороги тригерів для ради директорів. Решта порогів виводиться з припущень вище:
// мінімальна маржа Security = маржа плану − удар «ЄС з'їдає маржу»,
// ліміт витрат програми = інвестиція Security + резерв.
export const BOARD_ALERTS = {
  // утилізація IT, нижче якої — «продати негайно» (подія itUtilization у 7.2)
  itUtilizationSell: 0.65,
  // місяць, до якого має бути серійний випуск у ЄС; інакше — заморозити транш 2
  // QUESTION: транші Security на слайдах не описані; «транш 2» взято з прикладу в PLAN.md, розділ 13.
  euSerialProductionMonth: 12,
  // місяць, до якого мають бути експортні дозволи / сертифікація ЄС
  exportPermitsMonth: 9,
  // ліквідності E-com вистачає на 6 місяців (дані кейсу)
  ecomLiquidityMonths: 6,
} as const
