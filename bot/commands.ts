// Команди бота, спільні для локального режиму (long polling) і вебхука на Vercel.
import type { Bot, Context } from 'grammy'
import {
  evaluateAlerts,
  formatAlert,
  formatSnapshot,
  newAlerts,
  type Alert,
  type KpiSnapshot,
} from '../src/model/alerts.ts'
import { BOARD_ALERTS, DEFAULT_ASSUMPTIONS, DEFAULT_EVENTS, DISCLAIMER, FUND } from '../src/model/config.ts'
import { money, pct } from '../src/lib/format.ts'

export interface KpiFile {
  note?: string
  currentMonth: number
  months: KpiSnapshot[]
}

export interface CommandOptions {
  loadKpi: () => KpiFile
  replayDelayMs: number
  // локальний режим зберігає підписників і розсилає нові тригери; вебхук — лише відповідає на команди
  subscriptions?: { add: (chat: number) => void; remove: (chat: number) => void }
}

export const COMMAND_LIST = [
  { command: 'status', description: 'KPI поточного місяця і тригери' },
  { command: 'replay', description: `Прогнати ${FUND.horizonMonths} місяці` },
  { command: 'month', description: 'KPI місяця N' },
  { command: 'thresholds', description: 'Пороги тригерів' },
  { command: 'help', description: 'Довідка' },
]

export const snapshotAt = (kpi: KpiFile, month: number): KpiSnapshot | undefined =>
  kpi.months.find((m) => m.month === month)

function report(k: KpiSnapshot): string {
  const alerts = evaluateAlerts(k)
  const body = alerts.length ? alerts.map(formatAlert).join('\n') : '🟢 Тригерів немає'
  return `${formatSnapshot(k)}\n\n${body}`
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

export function registerCommands(bot: Bot, opts: CommandOptions) {
  const subs = opts.subscriptions
  const help = [
    'Board Alerts — демо моніторингу портфеля після угоди.',
    '',
    '/status — KPI поточного місяця і активні тригери',
    '/month N — KPI та тригери місяця N',
    `/replay — прогнати всі ${FUND.horizonMonths} міс. і показати, коли що спрацьовує`,
    '/thresholds — пороги тригерів',
    subs ? '/stop — відписатися від сповіщень' : '',
    '',
    `KPI — mock-дані. ${DISCLAIMER}`,
  ]
    .filter((line, i, all) => line !== '' || all[i - 1] !== '')
    .join('\n')

  bot.command('start', async (ctx) => {
    subs?.add(ctx.chat.id)
    await ctx.reply(`${subs ? 'Ви підписані на сповіщення ради.\n\n' : ''}${help}`)
  })

  bot.command('help', (ctx) => ctx.reply(help))

  if (subs) {
    bot.command('stop', async (ctx) => {
      subs.remove(ctx.chat.id)
      await ctx.reply('Відписано. /start — підписатися знову.')
    })
  }

  bot.command('status', async (ctx) => {
    const kpi = opts.loadKpi()
    const k = snapshotAt(kpi, kpi.currentMonth)
    await ctx.reply(k ? report(k) : `Немає KPI для місяця ${kpi.currentMonth}.`)
  })

  bot.command('month', async (ctx) => {
    const kpi = opts.loadKpi()
    const n = Number(ctx.match.trim())
    const k = Number.isInteger(n) ? snapshotAt(kpi, n) : undefined
    await ctx.reply(k ? report(k) : `Вкажіть місяць 1–${kpi.months.length}, наприклад: /month 12`)
  })

  bot.command('thresholds', async (ctx) => {
    const a = DEFAULT_ASSUMPTIONS
    const reserve = FUND.freeCapital - a.sec.investment - a.ecom.plan.bridge
    await ctx.reply(
      [
        'Пороги (з config.ts):',
        `• IT: утилізація < ${pct(BOARD_ALERTS.itUtilizationSell, 0)} → продаж`,
        `• Security: дозволи ЄС до міс. ${BOARD_ALERTS.exportPermitsMonth}`,
        `• Security: серійний випуск у ЄС до міс. ${BOARD_ALERTS.euSerialProductionMonth}, інакше заморозити транш 2`,
        `• Security: маржа < ${pct(a.sec.plan.margin - DEFAULT_EVENTS.euMargin.marginHit)}`,
        `• Security: витрати > ${money(a.sec.investment)} + резерв ${money(reserve)}`,
        `• E-com: відмова в мораторії або немає мораторію за ${BOARD_ALERTS.ecomLiquidityMonths} міс.`,
      ].join('\n'),
    )
  })

  const replaying = new Set<number>()
  bot.command('replay', async (ctx: Context) => {
    const chat = ctx.chat!.id
    if (replaying.has(chat)) return ctx.reply('Прогін уже йде.')
    replaying.add(chat)
    try {
      const kpi = opts.loadKpi()
      await ctx.reply(`▶️ Прогін ${kpi.months.length} міс. Показую лише нові тригери.`)
      let prev: Alert[] = []
      let fired = 0
      for (const k of kpi.months) {
        const cur = evaluateAlerts(k)
        const fresh = newAlerts(prev, cur)
        if (fresh.length) {
          fired += fresh.length
          await ctx.reply(`Міс. ${k.month}\n${fresh.map(formatAlert).join('\n')}`)
          await sleep(opts.replayDelayMs)
        }
        prev = cur
      }
      await ctx.reply(`⏹ Кінець горизонту. Спрацювало тригерів: ${fired}.`)
    } finally {
      replaying.delete(chat)
    }
  })
}
