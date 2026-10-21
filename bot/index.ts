// Board Alerts — локальний режим (long polling): команди + стеження за файлом KPI.
// Коли в kpi.mock.json змінюється поточний місяць і спрацьовує новий тригер, бот розсилає його підписникам.
// На Vercel працює той самий набір команд через вебхук (bot/webhook.ts → api/bot.js).
import { mkdirSync, readFileSync, watchFile, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { Bot } from 'grammy'
import { evaluateAlerts, formatAlert, newAlerts, type Alert } from '../src/model/alerts.ts'
import { COMMAND_LIST, registerCommands, snapshotAt, type KpiFile } from './commands.ts'
import { readToken } from './env.ts'

const here = dirname(fileURLToPath(import.meta.url))
const KPI_PATH = process.env.KPI_PATH ?? join(here, 'kpi.mock.json')
const DATA_DIR = join(here, '.data')
const SUBSCRIBERS_PATH = join(DATA_DIR, 'subscribers.json')
const REPLAY_MS = Number(process.env.REPLAY_MS ?? 1200)

const loadKpi = (): KpiFile => JSON.parse(readFileSync(KPI_PATH, 'utf8')) as KpiFile

// ── Підписники ──────────────────────────────────────────────────────────────

function loadSubscribers(): Set<number> {
  try {
    return new Set(JSON.parse(readFileSync(SUBSCRIBERS_PATH, 'utf8')) as number[])
  } catch {
    return new Set()
  }
}

const subscribers = loadSubscribers()

function saveSubscribers() {
  mkdirSync(DATA_DIR, { recursive: true })
  writeFileSync(SUBSCRIBERS_PATH, JSON.stringify([...subscribers]))
}

// ── Бот ─────────────────────────────────────────────────────────────────────

const bot = new Bot(readToken())

registerCommands(bot, {
  loadKpi,
  replayDelayMs: REPLAY_MS,
  subscriptions: {
    add: (chat) => {
      subscribers.add(chat)
      saveSubscribers()
    },
    remove: (chat) => {
      subscribers.delete(chat)
      saveSubscribers()
    },
  },
})

// ── Стеження за файлом KPI: нові тригери поточного місяця → усім підписникам ─

let lastActive: Alert[] = (() => {
  const kpi = loadKpi()
  const k = snapshotAt(kpi, kpi.currentMonth)
  return k ? evaluateAlerts(k) : []
})()

watchFile(KPI_PATH, { interval: 1000 }, async () => {
  let kpi: KpiFile
  try {
    kpi = loadKpi()
  } catch {
    return // файл редагується і тимчасово невалідний
  }
  const k = snapshotAt(kpi, kpi.currentMonth)
  if (!k) return
  const cur = evaluateAlerts(k)
  const fresh = newAlerts(lastActive, cur)
  lastActive = cur
  if (!fresh.length) return
  const text = `Міс. ${k.month}: новий тригер\n${fresh.map(formatAlert).join('\n')}`
  for (const chat of subscribers) {
    await bot.api.sendMessage(chat, text).catch((e: unknown) => console.error(`Не вдалося надіслати в ${chat}:`, e))
  }
  console.log(`Надіслано ${fresh.length} тригер(и) ${subscribers.size} підписникам`)
})

bot.catch((err) => console.error('Помилка бота:', err.error))

// Long polling вимикає вебхук Vercel (інакше Telegram повертає 409). Повернути: npm run webhook
await bot.api.deleteWebhook()
await bot.api.setMyCommands([...COMMAND_LIST, { command: 'stop', description: 'Відписатися' }])

await bot.start({
  onStart: (me) =>
    console.log(`@${me.username} запущено локально. KPI: ${KPI_PATH}. Підписників: ${subscribers.size}. Ctrl+C — зупинити.`),
})
