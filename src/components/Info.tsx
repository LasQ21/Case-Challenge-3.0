import { useEffect, useId, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { useLang } from '../lib/i18n'

// Кружечок (i): підказка з'являється при наведенні, фокусі або тапі.
// Бульбашка рендериться в body — у .glass є backdrop-filter, який ламає position: fixed.
export function Info({ children, label }: { children: ReactNode; label?: string }) {
  const { t } = useLang()
  const id = useId()
  const btn = useRef<HTMLButtonElement>(null)
  const tip = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)
  const [pinned, setPinned] = useState(false)
  const [pos, setPos] = useState<{ left: number; top: number } | null>(null)

  useLayoutEffect(() => {
    if (!open || !btn.current || !tip.current) return
    const b = btn.current.getBoundingClientRect()
    const w = tip.current.offsetWidth
    const h = tip.current.offsetHeight
    const gutter = 12
    const left = Math.min(Math.max(b.left + b.width / 2 - w / 2, gutter), innerWidth - w - gutter)
    const above = b.top - h - 8
    setPos({ left, top: above >= gutter ? above : b.bottom + 8 })
  }, [open])

  useEffect(() => {
    if (!open) return
    const close = () => {
      setOpen(false)
      setPinned(false)
    }
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && close()
    const onDown = (e: PointerEvent) => {
      if (!btn.current?.contains(e.target as Node) && !tip.current?.contains(e.target as Node)) close()
    }
    addEventListener('keydown', onKey)
    addEventListener('pointerdown', onDown)
    addEventListener('scroll', close, { passive: true, capture: true })
    addEventListener('resize', close)
    return () => {
      removeEventListener('keydown', onKey)
      removeEventListener('pointerdown', onDown)
      removeEventListener('scroll', close, { capture: true })
      removeEventListener('resize', close)
    }
  }, [open])

  const show = () => setOpen(true)
  const hide = () => {
    if (!pinned) setOpen(false)
  }

  return (
    <>
      <button
        ref={btn}
        type="button"
        className="info-btn"
        aria-label={label ? `${t('Пояснення', 'Explanation')}: ${label}` : t('Пояснення', 'Explanation')}
        aria-describedby={open ? id : undefined}
        aria-expanded={open}
        onMouseEnter={show}
        onMouseLeave={hide}
        onFocus={show}
        onBlur={hide}
        onClick={(e) => {
          // клік (або тап) закріплює підказку; повторний — ховає
          e.preventDefault()
          setPinned(!pinned)
          setOpen(!pinned)
        }}
      >
        i
      </button>
      {open &&
        createPortal(
          <div
            ref={tip}
            id={id}
            role="tooltip"
            className="info-tip"
            style={pos ? { left: pos.left, top: pos.top } : { left: -9999, top: 0, visibility: 'hidden' }}
          >
            {children}
          </div>,
          document.body,
        )}
    </>
  )
}
