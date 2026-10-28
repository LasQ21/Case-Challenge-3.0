import type { ReactNode } from 'react'

// Картка — скельце над авророю: блюр, обідок-блік і прожектор за курсором
export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  const hero = className.includes('sheet')
  return (
    <section className={`glass card p-4 sm:p-6 ${className}`}>
      {hero && (
        <>
          <span className="sheet-glow" aria-hidden />
          <span className="sheet-rim" aria-hidden />
        </>
      )}
      {children}
    </section>
  )
}

export function PageIntro({ title, children }: { title: string; children: ReactNode }) {
  return (
    <header className="mb-5">
      <h2 className="font-display text-3xl font-bold tracking-tight text-ink sm:text-5xl">{title}</h2>
      <p className="mt-2 max-w-2xl text-sm text-muted sm:text-base">{children}</p>
    </header>
  )
}

export function H3({ children }: { children: ReactNode }) {
  return <h3 className="scroll-mt-20 font-display text-lg font-semibold text-ink">{children}</h3>
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
      <div className="text-xs font-semibold uppercase tracking-wider text-muted">{label}</div>
      <div className={`num font-display text-2xl font-semibold sm:text-3xl ${accent ? 'text-grad' : 'text-ink'}`}>
        {/* key перезапускає анімацію щоразу, як змінюється значення */}
        <span key={value} className="tick">
          {value}
        </span>
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
        className="inline-block h-2.5 w-4 rounded-full"
        style={dashed ? { border: `2px dashed ${color}` } : { background: color }}
        aria-hidden
      />
      {label}
    </span>
  )
}

export const btnClass = (variant: 'ghost' | 'solid' = 'ghost') =>
  `btn pill inline-flex min-h-10 items-center gap-1.5 px-4 text-sm font-semibold disabled:opacity-40 ${
    variant === 'solid' ? 'btn-solid' : 'glass glass-refract text-ink'
  }`

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
  return (
    <button type="button" onClick={onClick} className={btnClass(variant)} {...rest}>
      {children}
    </button>
  )
}
