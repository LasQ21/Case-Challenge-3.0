// Секрети бота: змінні середовища або файл env. / .env у корені репозиторію (обидва в .gitignore)
import { existsSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

export const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
export const ENV_FILE = join(ROOT, 'env.')

export function readSecret(...keys: string[]): string | undefined {
  for (const k of keys) if (process.env[k]) return process.env[k]!.trim()
  for (const name of ['env.', '.env']) {
    const p = join(ROOT, name)
    if (!existsSync(p)) continue
    for (const line of readFileSync(p, 'utf8').split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Z_]+)\s*=\s*(.+?)\s*$/)
      if (m && keys.includes(m[1])) return m[2].replace(/^["']|["']$/g, '')
    }
  }
  return undefined
}

export function readToken(): string {
  const t = readSecret('TELEGRAM_BOT_TOKEN', 'API_TELEGRAM')
  if (!t) throw new Error('Немає токена: задайте TELEGRAM_BOT_TOKEN або API_TELEGRAM (у env. чи .env у корені).')
  return t
}
