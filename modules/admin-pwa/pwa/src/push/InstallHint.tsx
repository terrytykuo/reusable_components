import { useState } from 'react'
import { brand } from '../brand'
import { t } from '../i18n'
import { isStandalone } from './standalone'

const STORAGE_KEY = `${brand.storageKey}.installHintDismissed`

function wasDismissed(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === '1'
  } catch {
    return false
  }
}

/** "Add to Home Screen" card, hidden in the installed PWA and once dismissed. */
export function InstallHint() {
  const [hidden, setHidden] = useState(() => isStandalone() || wasDismissed())
  if (hidden) return null

  const dismiss = () => {
    setHidden(true)
    try {
      localStorage.setItem(STORAGE_KEY, '1')
    } catch {
      // Storage unavailable (private mode); the hint just reappears next visit.
    }
  }

  return (
    <aside className="mx-4 mt-3 flex items-start gap-3 rounded-md border border-line-accent bg-primary-soft p-4 text-sm text-ink-secondary">
      <p className="flex-1">{t.installHint}</p>
      <button
        type="button"
        onClick={dismiss}
        aria-label={t.dismissHint}
        className="-m-2 flex size-11 shrink-0 items-center justify-center rounded-full text-lg text-ink-muted active:bg-paper-strong"
      >
        ×
      </button>
    </aside>
  )
}
