import { useState, type MouseEvent } from 'react'
import { t } from '../i18n'

interface Props {
  /** Current state (e.g. `isPosted(item.status)`). The toggle never flips itself: the live snapshot does. */
  on: boolean
  /** Performs the write for the requested state; a rejection is shown as an error. See setPosted() in ./status. */
  onToggle: (next: boolean) => Promise<unknown>
  /** When given, failures go here (e.g. to show under a list card) instead of inline. */
  onError?: (message: string | null) => void
  /** Visible + accessible labels; default t.statusOn / t.statusOff. */
  labels?: { on: string; off: string }
}

/**
 * Two-state switch (default 未發 ⇄ 已發). Safe inside a card <Link>: the click
 * never reaches the link. Disabled while onToggle runs.
 */
export function StatusToggle({ on, onToggle, onError, labels }: Props) {
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const label = on ? (labels?.on ?? t.statusOn) : (labels?.off ?? t.statusOff)

  function report(message: string | null) {
    if (onError) onError(message)
    else setError(message)
  }

  async function toggle(e: MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    if (saving) return
    setSaving(true)
    report(null)
    try {
      await onToggle(!on)
    } catch (err) {
      report(err instanceof Error ? err.message : String(err))
    } finally {
      setSaving(false)
    }
  }

  return (
    <span className="inline-flex flex-col items-end">
      <button
        type="button"
        role="switch"
        aria-checked={on}
        aria-label={label}
        disabled={saving}
        onClick={(e) => void toggle(e)}
        className="-my-2 inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full px-1 disabled:opacity-45"
      >
        <span aria-hidden="true" className={`text-xs font-bold tracking-[0.4px] ${on ? 'text-primary-dark' : 'text-ink-secondary'}`}>
          {label}
        </span>
        <span
          aria-hidden="true"
          className={`relative inline-flex h-7 w-12 items-center rounded-full border transition-colors ${
            on ? 'border-primary bg-primary' : 'border-line bg-paper-strong'
          }`}
        >
          <span className={`absolute left-0.5 size-6 rounded-full bg-card shadow-sm transition-transform ${on ? 'translate-x-5' : ''}`} />
        </span>
      </button>
      {error && (
        <span role="alert" className="mt-1 text-xs break-words text-danger-text">
          {t.updateFailed(error)}
        </span>
      )}
    </span>
  )
}
