// Board Alerts на Vercel: Telegram надсилає оновлення на /api/bot (вебхук).
// Збирається в один файл api/bot.js командою `npm run bundle` (у папці bot/).
// Змінні середовища проєкту на Vercel:
//   TELEGRAM_BOT_TOKEN       — токен бота
//   TELEGRAM_WEBHOOK_SECRET  — секрет, яким Telegram підписує запити (той самий, що в setWebhook)
//   KPI_MONTH (необов'язково) — поточний місяць замість currentMonth з kpi.mock.json
import { Bot, webhookCallback } from 'grammy'
import { COMMAND_LIST, registerCommands, type KpiFile } from './commands.ts'
import kpiData from './kpi.mock.json' with { type: 'json' }

const token = process.env.TELEGRAM_BOT_TOKEN ?? ''
const secret = process.env.TELEGRAM_WEBHOOK_SECRET

const kpi = kpiData as KpiFile
const month = Number(process.env.KPI_MONTH)
const loadKpi = (): KpiFile => (Number.isInteger(month) && month > 0 ? { ...kpi, currentMonth: month } : kpi)

// Бот створюється лише за наявності токена: new Bot('') кидає помилку ще під час завантаження модуля,
// і тоді вся функція падає з FUNCTION_INVOCATION_FAILED замість зрозумілої відповіді.
let bot: Bot | undefined
let handle: ((request: Request) => Promise<Response>) | undefined

function getBot(): Bot {
  if (!bot) {
    bot = new Bot(token)
    // Без збереження стану: підписки й розсилки — лише в локальному режимі
    registerCommands(bot, { loadKpi, replayDelayMs: 800 })
    bot.catch((err) => console.error('Помилка бота:', err.error))
    handle = webhookCallback(bot, 'std/http', { secretToken: secret, timeoutMilliseconds: 25_000 })
  }
  return bot
}

export async function POST(request: Request): Promise<Response> {
  if (!token) return new Response('TELEGRAM_BOT_TOKEN не задано', { status: 500 })
  if (!secret) return new Response('TELEGRAM_WEBHOOK_SECRET не задано', { status: 500 })
  getBot()
  try {
    return await handle!(request)
  } catch (err) {
    // 200, щоб Telegram не повторював той самий апдейт безкінечно (напр., користувач заблокував бота)
    console.error('Помилка обробки апдейту:', err)
    return new Response('ok')
  }
}

// Перевірка стану; ?setup=1 оновлює меню команд у Telegram
export async function GET(request: Request): Promise<Response> {
  if (token && new URL(request.url).searchParams.get('setup') === '1') {
    await getBot().api.setMyCommands(COMMAND_LIST)
  }
  return Response.json({ ok: true, configured: Boolean(token && secret) })
}
