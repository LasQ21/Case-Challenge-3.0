// Тригери «Board Alerts»: KPI місяця → рекомендації раді. Чисті функції; бот лише надсилає.
import { BOARD_ALERTS, DEFAULT_ASSUMPTIONS, DEFAULT_EVENTS, FUND, type Assumptions } from './config'
import { money, pct } from '../lib/format'

export type PermitStatus = 'pending' | 'granted'
export type MoratoriumStatus = 'pending' | 'granted' | 'refused'

export interface KpiSnapshot {
  month: number
  it: { utilization: number }
  sec: {
    margin: number
    exportPermits: PermitStatus
    euSerialProduction: boolean
    // накопичені витрати програми створення вартості, $m
    programSpend: number
  }
  ecom: { moratorium: MoratoriumStatus }
}

export type AlertId = 'itSell' | 'secExportPermits' | 'secEuSerial' | 'secMargin' | 'secOverrun' | 'ecomCreditors' | 'ecomLiquidity'

export interface Alert {
  id: AlertId
  severity: 'high' | 'medium'
  text: string
}

export function evaluateAlerts(k: KpiSnapshot, a: Assumptions = DEFAULT_ASSUMPTIONS): Alert[] {
  const out: Alert[] = []
  const t = BOARD_ALERTS

  if (k.it.utilization < t.itUtilizationSell) {
    out.push({
      id: 'itSell',
      severity: 'high',
      text: `IT: утилізація ${pct(k.it.utilization, 0)} < ${pct(t.itUtilizationSell, 0)} → рекомендація: запускати продаж`,
    })
  }

  if (k.month >= t.exportPermitsMonth && k.sec.exportPermits !== 'granted') {
    out.push({
      id: 'secExportPermits',
      severity: 'medium',
      text: `Security: немає експортних дозволів / сертифікації ЄС на міс. ${k.month} → приріст мультиплікатора під загрозою; пріоритет — сертифікація`,
    })
  }

  if (k.month >= t.euSerialProductionMonth && !k.sec.euSerialProduction) {
    out.push({
      id: 'secEuSerial',
      severity: 'high',
      text: `Немає серійного випуску в ЄС на міс. ${k.month} → заморозити транш 2`,
    })
  }

  const marginFloor = a.sec.plan.margin - DEFAULT_EVENTS.euMargin.marginHit
  if (k.sec.margin < marginFloor) {
    out.push({
      id: 'secMargin',
      severity: 'medium',
      text: `Security: маржа ${pct(k.sec.margin)} < ${pct(marginFloor)} → виробництво в ЄС з'їдає маржу; переглянути ціни й локалізацію`,
    })
  }

  const reserve = FUND.freeCapital - a.sec.investment - a.ecom.plan.bridge
  const budget = a.sec.investment + reserve
  if (k.sec.programSpend > budget) {
    out.push({
      id: 'secOverrun',
      severity: 'high',
      text: `Security: витрати програми ${money(k.sec.programSpend)} > ${money(a.sec.investment)} + резерв ${money(reserve)} → зупинити нові зобов'язання, переглянути план`,
    })
  }

  if (k.ecom.moratorium === 'refused') {
    out.push({
      id: 'ecomCreditors',
      severity: 'high',
      text: `E-com: кредитори відмовили в мораторії → бридж ${money(a.ecom.plan.bridge)} не видавати; готувати контрольований вихід`,
    })
  } else if (k.ecom.moratorium === 'pending' && k.month >= t.ecomLiquidityMonths) {
    out.push({
      id: 'ecomLiquidity',
      severity: 'high',
      text: `E-com: мораторій не погоджено за ${t.ecomLiquidityMonths} міс. ліквідності → рішення щодо бриджу потрібне негайно`,
    })
  }

  return out
}

// Лише ті тригери, що спрацювали зараз і не були активні раніше
export function newAlerts(prev: readonly Alert[], cur: readonly Alert[]): Alert[] {
  const was = new Set(prev.map((x) => x.id))
  return cur.filter((x) => !was.has(x.id))
}

export function formatAlert(x: Alert): string {
  return `${x.severity === 'high' ? '🔴' : '🟠'} ${x.text}`
}

export function formatSnapshot(k: KpiSnapshot): string {
  const yesNo = (v: boolean) => (v ? 'так' : 'ні')
  return [
    `Місяць ${k.month} з ${FUND.horizonMonths}`,
    `IT: утилізація ${pct(k.it.utilization, 0)}`,
    `Security: маржа ${pct(k.sec.margin)}, дозволи ЄС — ${k.sec.exportPermits === 'granted' ? 'є' : 'очікуються'}, серійний випуск у ЄС — ${yesNo(k.sec.euSerialProduction)}, витрачено ${money(k.sec.programSpend)}`,
    `E-com: мораторій — ${{ pending: 'на погодженні', granted: 'погоджено', refused: 'відмова' }[k.ecom.moratorium]}`,
  ].join('\n')
}
