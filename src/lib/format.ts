// Форматування для інтерфейсу: $m з однією десятковою, мінус — справжній «−».
const MINUS = '−'

const sign = (v: number, plus: boolean) => (v < 0 ? MINUS : plus && v > 0 ? '+' : '')

export const money = (v: number, opts: { plus?: boolean } = {}) =>
  `${sign(v, !!opts.plus)}$${Math.abs(v).toFixed(1)}m`

export const num1 = (v: number, opts: { plus?: boolean } = {}) =>
  `${sign(v, !!opts.plus)}${Math.abs(v).toFixed(1)}`

export const pct = (v: number, digits = 1) => `${sign(v, false)}${Math.abs(v * 100).toFixed(digits)}%`

export const pp = (v: number) => `${sign(v, true)}${Math.abs(v * 100).toFixed(1)} п.п.`

export const mult = (v: number) => `${v.toFixed(1)}x`

// Розділювач тисяч за мовою сторінки: «10 000» / «10,000»
export const int = (v: number) =>
  Math.round(v).toLocaleString(typeof document !== 'undefined' && document.documentElement.lang === 'en' ? 'en-US' : 'uk-UA')

export function formatBy(format: 'pct' | 'mult' | 'money' | 'int', v: number): string {
  switch (format) {
    case 'pct':
      return pct(v)
    case 'mult':
      return mult(v)
    case 'money':
      return money(v)
    case 'int':
      return int(v)
  }
}

// Прибирає хвіст плаваючої коми після кроку повзунка (0.15000000000000002 → 0.15)
export function snap(v: number, step: number): number {
  const decimals = Math.max(0, -Math.floor(Math.log10(step)) + 1)
  return Number((Math.round(v / step) * step).toFixed(decimals))
}
