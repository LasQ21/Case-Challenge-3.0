import { QRCodeSVG } from 'qrcode.react'
import { useEffect, useRef, useState } from 'react'
import { Button } from './ui'

// Посилання на поточний сценарій + QR-код для журі
export default function ShareDialog({ onClose }: { onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null)
  const [copied, setCopied] = useState(false)
  const url = window.location.href

  useEffect(() => {
    const d = ref.current
    d?.showModal()
    return () => d?.close()
  }, [])

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
    } catch {
      setCopied(false)
    }
  }

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => e.target === ref.current && onClose()}
      className="m-auto w-[min(92vw,380px)] rounded-2xl border border-line bg-surface p-5 text-ink backdrop:bg-black/50"
      aria-labelledby="share-title"
    >
      <h2 id="share-title" className="font-serif text-xl font-semibold">
        Поділитися сценарієм
      </h2>
      <p className="mt-1 text-sm text-muted">Посилання містить усі змінені припущення — відкриється рівно цей сценарій.</p>
      <div className="mt-4 flex justify-center rounded-xl bg-white p-4">
        <QRCodeSVG value={url} size={220} level="M" fgColor="#0E1525" bgColor="#FFFFFF" title="QR-код поточного сценарію" />
      </div>
      <input
        readOnly
        value={url}
        aria-label="Посилання на сценарій"
        className="mt-4 w-full rounded-lg border border-line bg-bg px-3 py-2 text-xs text-ink"
        onFocus={(e) => e.target.select()}
      />
      <div className="mt-3 flex justify-between gap-2">
        <Button variant="solid" onClick={copy}>
          {copied ? 'Скопійовано ✓' : 'Скопіювати посилання'}
        </Button>
        <Button onClick={onClose}>Закрити</Button>
      </div>
    </dialog>
  )
}
