import { useEffect, useRef, useState } from 'react'
import { t } from '../i18n'

interface Props {
  text: string
  label?: string
  /** Accessible name when the visible label alone is ambiguous (e.g. one button per code in a list). */
  ariaLabel?: string
  className?: string
}

async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    return false
  }
}

/** Copy-to-clipboard button that flips to t.copied for a moment. */
export function CopyButton({ text, label = t.copy, ariaLabel, className = '' }: Props) {
  const [state, setState] = useState<'idle' | 'done' | 'failed'>('idle')
  const timer = useRef<number | undefined>(undefined)

  useEffect(() => () => window.clearTimeout(timer.current), [])

  async function handleClick() {
    const ok = await copyToClipboard(text)
    setState(ok ? 'done' : 'failed')
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => setState('idle'), 1500)
  }

  const message = state === 'done' ? t.copied : state === 'failed' ? t.copyFailed : ''

  // The result is announced from a separate live region: a live button would also
  // re-announce its own label, and screen readers handle live regions on controls poorly.
  return (
    <>
      <button
        type="button"
        onClick={() => void handleClick()}
        aria-label={ariaLabel}
        className={`min-h-11 shrink-0 rounded-full border border-line bg-card px-4 text-sm font-medium text-ink active:bg-paper-strong ${className}`}
      >
        {message || label}
      </button>
      <span role="status" className="sr-only">
        {message}
      </span>
    </>
  )
}
