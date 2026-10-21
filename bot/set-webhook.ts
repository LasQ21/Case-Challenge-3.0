// Перемикає бота на Vercel: реєструє вебхук у Telegram.
//   npm run webhook            — https://case-challenge-3-0.vercel.app/api/bot
//   npm run webhook -- <url>   — інша адреса
// Якщо TELEGRAM_WEBHOOK_SECRET ще немає, генерує його і дописує у файл env. — це значення треба
// додати в змінні середовища проєкту на Vercel. Локальний `npm start` вимикає вебхук назад.
import { appendFileSync } from 'node:fs'
import { randomBytes } from 'node:crypto'
import { Api } from 'grammy'
import { COMMAND_LIST } from './commands.ts'
import { ENV_FILE, readSecret, readToken } from './env.ts'

const url = process.argv[2] ?? 'https://case-challenge-3-0.vercel.app/api/bot'
let secret = readSecret('TELEGRAM_WEBHOOK_SECRET')
if (!secret) {
  secret = randomBytes(24).toString('hex')
  appendFileSync(ENV_FILE, `\nTELEGRAM_WEBHOOK_SECRET=${secret}\n`)
  console.log(`Згенеровано TELEGRAM_WEBHOOK_SECRET і дописано в ${ENV_FILE}. Додайте його у Vercel.`)
}

const health = await fetch(url).then((r) => r.json() as Promise<{ configured?: boolean }>).catch(() => null)
if (!health?.configured) {
  console.error(`${url} не відповідає або на Vercel не задано TELEGRAM_BOT_TOKEN / TELEGRAM_WEBHOOK_SECRET. Вебхук не змінено.`)
  process.exit(1)
}

const api = new Api(readToken())
await api.setWebhook(url, { secret_token: secret, allowed_updates: ['message'], drop_pending_updates: true })
await api.setMyCommands(COMMAND_LIST)
const info = await api.getWebhookInfo()
console.log(`Вебхук: ${info.url}; помилок у черзі: ${info.pending_update_count}${info.last_error_message ? `; остання помилка: ${info.last_error_message}` : ''}`)
