# Exit Simulator

Інтерактивний симулятор рішення PE-фонду для **Case Challenge 3.0** (SKELAR × Horizon Capital × Mastercard):
вихід із трьох компаній за 24 місяці, $15m вільного капіталу, одна інтенсивна програма.
Рішення команди: фокус на **Security Hardware** — $10m у Security, $3m бридж у E-commerce, $0 в IT, $2m резерву.

Сайт робить припущення «живими», перевіряє стійкість рішення Монте-Карло і зберігає будь-який сценарій у посиланні.

> Дані кейсу ілюстративні; припущення — команди.

## Запуск

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # Vitest: еталонні цифри, МК, URL-стан
npm run lint
npm run build      # статичний сайт у dist/
```

## Структура

| Шлях | Що там |
| --- | --- |
| `src/model/config.ts` | **Усі** припущення й діапазони повзунків. Компоненти чисел не містять. |
| `src/model/valuation.ts` | Детермінована модель і розклад приросту Security |
| `src/model/lens.ts` | Лінза пріоритетів, ваги, тест стійкості |
| `src/model/montecarlo.ts` | Монте-Карло (common random numbers, tornado) |
| `src/model/allocation.ts` | Розподіл $15m і перебір оптимуму |
| `src/workers/mc.worker.ts` | Монте-Карло у Web Worker |
| `src/lib/urlState.ts` | Стан ⇄ query params (лише відмінності від бази) |
| `src/pages/` | Вкладки: Рішення, Сценарії, Ризики, $15m, Про модель |

Місця, де специфікація допускала кілька прочитань, позначені `// QUESTION:` у коді й перелічені на вкладці «Про модель».

## Деплой

Сайт статичний (`base: './'`), працює і з кореня домену, і з підшляху.

- **Vercel:** імпортувати репозиторій, фреймворк Vite, build `npm run build`, output `dist`.
- **GitHub Pages:** `npm run build` і опублікувати `dist/`.

На Vercel `og:image` автоматично отримує абсолютну адресу production-домену (`VERCEL_PROJECT_PRODUCTION_URL`).
Для іншого хостингу або власного домену задайте `SITE_URL=https://<домен>` у змінних середовища збірки. Картинка лежить у `public/og.png`, джерело — `scripts/og.svg`.

## Telegram-бот «Board Alerts» (демо)

Наступний крок після угоди: бот стежить за KPI і надсилає раді рекомендацію, коли спрацьовує тригер.
Пороги беруться з `src/model/config.ts` (`BOARD_ALERTS` + припущення сценарію), логіка — `src/model/alerts.ts` (покрита тестами),
KPI — mock-дані в `bot/kpi.mock.json`.

```bash
cd bot
npm install
npm start
```

Токен бот бере з `TELEGRAM_BOT_TOKEN` / `API_TELEGRAM` у змінних середовища або з файлу `env.` чи `.env` у корені
(обидва в `.gitignore`).

Команди: `/start` (підписка), `/status`, `/month N`, `/replay` (прогін 24 місяців), `/thresholds`, `/stop`.

Живе демо (локальний режим): поки бот працює, змініть `currentMonth` у `bot/kpi.mock.json` (наприклад, 8 → 9 або 12) —
усі підписники отримають нові тригери, напр. «IT: утилізація 64% < 65% → рекомендація: запускати продаж»
чи «Немає серійного випуску в ЄС на міс. 12 → заморозити транш 2».

### Бот на Vercel (вебхук)

На Vercel той самий набір команд працює як функція `api/bot.js` у проєкті сайту — без локального процесу.
Підписки й розсилки за зміною файлу KPI є лише в локальному режимі (serverless не зберігає стан);
поточний місяць на Vercel можна змінити змінною `KPI_MONTH`.

1. У Vercel → Project Settings → Environment Variables (Production) додайте `TELEGRAM_BOT_TOKEN` (або `API_TELEGRAM`)
   і `TELEGRAM_WEBHOOK_SECRET` (секрет генерує `npm run webhook` у файл `env.`).
2. Після зміни `bot/*.ts` перезберіть функцію: `cd bot && npm run bundle` і закомітьте `api/bot.js`.
3. Після деплою: `cd bot && npm run webhook` — реєструє вебхук `https://case-challenge-3-0.vercel.app/api/bot`.

`npm start` (локальний режим) вимикає вебхук; щоб повернути бота на Vercel — знову `npm run webhook`.
