import { useId } from 'react'
import type { SliderSpec } from '../model/config'
import { formatBy, snap } from '../lib/format'

interface Props extends Omit<SliderSpec, 'path'> {
  value: number
  base?: number
  onChange: (v: number) => void
  hint?: string
}

// Повзунок із підписом, поточним значенням, позначкою бази та (опційно) орієнтиром.
export function Slider({ label, value, min, max, step, format, base, benchmark, onChange, hint }: Props) {
  const id = useId()
  const changed = base !== undefined && Math.abs(value - base) > step / 2
  const pos = (v: number) => `${((v - min) / (max - min)) * 100}%`
  return (
    <div className="py-2">
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={id} className="text-sm text-ink">
          {label}
        </label>
        <span className="num text-sm font-semibold text-ink">
          <span key={value} className="tick">{formatBy(format, value)}</span>
          {changed && (
            <span className="ml-1.5 text-xs font-normal text-muted">база {formatBy(format, base!)}</span>
          )}
        </span>
      </div>
      <div className="relative">
        <input
          id={id}
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          style={{ ['--fill' as string]: pos(value) }}
          aria-valuetext={formatBy(format, value)}
          onChange={(e) => onChange(snap(Number(e.target.value), step))}
        />
        {benchmark && benchmark.value >= min && benchmark.value <= max && (
          <div
            className="pointer-events-none absolute top-0 h-7 w-px bg-ink/60"
            style={{ left: pos(benchmark.value) }}
            aria-hidden
          />
        )}
      </div>
      {benchmark && (
        <p className="text-xs text-muted">
          ▏ орієнтир {formatBy(format, benchmark.value)} — {benchmark.label}
        </p>
      )}
      {hint && <p className="text-xs text-muted">{hint}</p>}
    </div>
  )
}
