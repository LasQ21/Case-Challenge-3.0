import { QRCodeSVG } from 'qrcode.react'
import { useEffect, useRef, useState } from 'react'
import { useLang } from '../lib/i18n'
import { Button } from './ui'

// Посилання на поточний сценарій + QR-код для журі
export default function ShareDialog({ onClose }: { onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null)
  const { t, lang } = useLang()
  const [copied, setCopied] = useState(false)
  // Англійське посилання відкривається англійською: i18n читає ?lang= при першому завантаженні
  const link = new URL(window.location.href)
  if (lang === 'en') link.searchParams.set('lang', 'en')
  else link.searchParams.delete('lang')
  const url = link.toString()

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
      className="glass m-auto w-[min(92vw,380px)] rounded-[28px] p-6 text-ink backdrop:bg-black/40"
      aria-labelledby="share-title"
    >
      <h2 id="share-title" className="font-display text-xl font-semibold">
        {t('Поділитися сценарієм', 'Share this scenario')}
      </h2>
      <p className="mt-1 text-sm text-muted">
        {t(
          'Посилання містить усі змінені припущення — відкриється рівно цей сценарій.',
          'The link carries every changed assumption, so it opens exactly this scenario.',
        )}
      </p>
      <div className="mt-4 flex justify-center rounded-2xl bg-white p-4 shadow-[0_10px_40px_-10px_var(--accent)]">
        <QRCodeSVG value={url} size={220} level="M" fgColor="#15171C" bgColor="#FFFFFF" title={t('QR-код поточного сценарію', 'QR code for the current scenario')} />
      </div>
      <input
        readOnly
        value={url}
        aria-label={t('Посилання на сценарій', 'Scenario link')}
        className="mt-4 w-full rounded-xl border border-line bg-surface-2 px-3 py-2 text-xs text-ink"
        onFocus={(e) => e.target.select()}
      />
      <div className="mt-3 flex justify-between gap-2">
        <Button variant="solid" onClick={copy}>
          {copied ? t('Скопійовано ✓', 'Copied ✓') : t('Скопіювати посилання', 'Copy link')}
        </Button>
        <Button onClick={onClose}>{t('Закрити', 'Close')}</Button>
      </div>
    </dialog>
  )
}
