import type { ReactNode } from 'react'

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <section className={`rounded-xl border border-line bg-surface p-4 sm:p-5 ${className}`}>{children}</section>
}

export function PageIntro({ title, children }: { title: string; children: ReactNode }) {
  return (
    <header className="mb-4">
      <h2 className="font-serif text-2xl font-semibold text-ink sm:text-3xl">{title}</h2>
      <p className="mt-1 max-w-2xl text-sm text-muted sm:text-base">{children}</p>
    </header>
  )
}

export function H3({ children }: { children: ReactNode }) {
  return <h3 className="scroll-mt-16 font-serif text-lg font-semibold text-ink">{children}</h3>
}

export function Stat({
  label,
  value,
  sub,
  accent = false,
}: {
  label: string
  value: string
  sub?: ReactNode
  accent?: boolean
}) {
  return (
    <div>
      <div className="text-xs font-semibold text-muted">{label}</div>
      <div className={`num font-serif text-2xl font-semibold sm:text-3xl ${accent ? 'text-accent-ink' : 'text-ink'}`}>
        {value}
      </div>
      {sub && <div className="text-xs text-muted">{sub}</div>}
    </div>
  )
}

// Легенда з текстом і формою — колір ніколи не несе сенс сам по собі
export function LegendItem({ color, label, dashed = false }: { color: string; label: string; dashed?: boolean }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-muted">
      <span
        className="inline-block h-2.5 w-4 rounded-sm"
        style={dashed ? { border: `2px dashed ${color}` } : { background: color }}
        aria-hidden
      />
      {label}
    </span>
  )
}

export function Button({
  children,
  onClick,
  variant = 'ghost',
  ...rest
}: {
  children: ReactNode
  onClick?: () => void
  variant?: 'ghost' | 'solid'
  'aria-label'?: string
  title?: string
  disabled?: boolean
}) {
  const cls =
    variant === 'solid'
      ? 'bg-accent text-white hover:brightness-110'
      : 'border border-line bg-surface text-ink hover:bg-surface-2'
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex min-h-9 items-center gap-1.5 rounded-lg px-3 text-sm font-semibold disabled:opacity-50 ${cls}`}
      {...rest}
    >
      {children}
    </button>
  )
}
