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

export const CRITERIA: readonly { id: CriterionId; label: string }[] = [
  { id: 'valueAtRisk', label: 'Цінність під ризиком' },
  { id: 'urgency', label: 'Терміновість' },
  { id: 'fundImpact', label: 'Вплив фонду' },
  { id: 'exitReadiness', label: 'Готовність до виходу' },
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
  { label: string; effect: string; appliesPlan: boolean; appliesSq: boolean; trigger?: string }
> = {
  exportDelay: {
    label: 'Затримка експортних дозволів / сертифікації в ЄС',
    effect: 'Security: ріст −2 п.п.; приріст мультиплікатора вдвічі менший',
    appliesPlan: true,
    appliesSq: false,
  },
  ceasefire: {
    label: "Перемир'я / зміна оборонних бюджетів",
    effect: 'Security: ріст −5 п.п., але мультиплікатор +1x',
    appliesPlan: true,
    appliesSq: true,
  },
  siteStrike: {
    label: 'Удар по ключовому майданчику в Україні',
    effect: 'Security: EBITDA −15% (з хабом у ЄС −7%)',
    appliesPlan: true,
    appliesSq: true,
  },
  euMargin: {
    label: 'Виробництво в ЄС з’їдає маржу',
    effect: 'Security: маржа −2 п.п.',
    appliesPlan: true,
    appliesSq: false,
  },
  founderConflict: {
    label: 'Конфлікт із засновниками / ключові люди',
    effect: 'Вихід після дедлайну → дисконт примусового продажу −10%',
    appliesPlan: true,
    appliesSq: true,
  },
  ecomCreditors: {
    label: 'E-com: кредитори відмовили в мораторії',
    effect: 'Бридж не видається; гроші фонду з E-com = 0',
    appliesPlan: true,
    appliesSq: false,
  },
  itUtilization: {
    label: 'IT: утилізація < 65%',
    effect: 'EBITDA IT −25%, мультиплікатор 4.5x',
    appliesPlan: true,
    appliesSq: true,
    trigger: 'Продати IT негайно',
  },
  overrun: {
    label: 'Перевитрати програми Security',
    effect: 'Непокрита резервом частка зрізає приріст мультиплікатора вдвічі',
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
  min: number
  max: number
  step: number
  format: SliderFormat
  benchmark?: { value: number; label: string }
}

export const SCENARIO_SLIDERS: Record<CompanyId, SliderSpec[]> = {
  sec: [
    { path: 'sec.sq.growth', label: 'Ріст без дій, р/р', min: 0, max: 0.3, step: 0.005, format: 'pct' },
    { path: 'sec.plan.growth', label: 'Ріст за планом, р/р', min: 0, max: 0.4, step: 0.005, format: 'pct' },
    { path: 'sec.plan.margin', label: 'Маржа EBITDA за планом', min: 0.1, max: 0.3, step: 0.005, format: 'pct' },
    {
      path: 'sec.plan.mult',
      label: 'Мультиплікатор на виході за планом',
      min: 4,
      max: 14,
      step: 0.1,
      format: 'mult',
      benchmark: {
        value: BENCHMARKS.defenceDealMedianMult,
        label: `медіана угод в обороні (${BENCHMARKS.defenceDealSource})`,
      },
    },
    { path: 'sec.plan.netDebtExit', label: 'Чистий борг на виході', min: 0, max: 40, step: 0.5, format: 'money' },
    { path: 'sec.investment', label: 'Інвестиція фонду (pre-money)', min: 0, max: 15, step: 0.5, format: 'money' },
  ],
  it: [
    { path: 'it.drift.ebitda', label: 'EBITDA без дій', min: 5, max: 25, step: 0.5, format: 'money' },
    { path: 'it.drift.mult', label: 'Мультиплікатор без дій', min: 3, max: 8, step: 0.1, format: 'mult' },
    { path: 'it.plan.ebitda', label: 'EBITDA за планом', min: 15, max: 35, step: 0.5, format: 'money' },
    { path: 'it.plan.mult', label: 'Мультиплікатор за планом', min: 3, max: 9, step: 0.1, format: 'mult' },
  ],
  ecom: [
    { path: 'ecom.sq.fundValue', label: 'Гроші фонду без дій', min: 0, max: 5, step: 0.1, format: 'money' },
    { path: 'ecom.plan.ebitda', label: 'EBITDA за планом', min: 5, max: 35, step: 0.5, format: 'money' },
    { path: 'ecom.plan.mult', label: 'Мультиплікатор за планом', min: 3, max: 8, step: 0.1, format: 'mult' },
    { path: 'ecom.plan.bridge', label: 'Бридж від фонду', min: 0, max: 10, step: 0.5, format: 'money' },
  ],
}

export const DISCLAIMER = 'Дані кейсу ілюстративні; припущення — команди.'
