import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { t } from '../i18n'
import type { PushToast } from './useForegroundMessages'

const DISMISS_MS = 6000

/** Same-origin link → in-app path (pathname + search + hash); anything else → null. */
function inAppPath(link: string | undefined): string | null {
  if (!link) return null
  try {
    const url = new URL(link, window.location.origin)
    return url.origin === window.location.origin ? `${url.pathname}${url.search}${url.hash}` : null
  } catch {
    return null
  }
}

interface Props {
  toast: PushToast
  onDismiss: () => void
  /** CSS `bottom`; raise it above a bottom tab bar, e.g. 'calc(4.75rem + env(safe-area-inset-bottom))'. */
  bottom?: string
}

/** Foreground push toast; tap opens the in-app link; auto-dismisses after 6 s. */
export function Toast({ toast, onDismiss, bottom = 'calc(1rem + env(safe-area-inset-bottom))' }: Props) {
  const navigate = useNavigate()

  useEffect(() => {
    const timer = window.setTimeout(onDismiss, DISMISS_MS)
    return () => window.clearTimeout(timer)
  }, [toast, onDismiss])

  const open = () => {
    const path = inAppPath(toast.link)
    if (path) navigate(path)
    onDismiss()
  }

  return (
    <div
      role="status"
      style={{ bottom }}
      className="fixed inset-x-4 z-20 flex items-start gap-1 rounded-md border border-line-accent bg-card p-1 shadow-lg"
    >
      <button type="button" onClick={open} className="min-h-11 min-w-0 flex-1 rounded-sm p-2 text-left active:bg-paper-strong">
        {toast.title && <p className="text-sm font-semibold text-ink">{toast.title}</p>}
        {toast.body && <p className="truncate text-sm text-ink-secondary">{toast.body}</p>}
      </button>
      <button
        type="button"
        onClick={onDismiss}
        aria-label={t.dismissToast}
        className="flex size-11 shrink-0 items-center justify-center rounded-full text-lg text-ink-muted active:bg-paper-strong"
      >
        ×
      </button>
    </div>
  )
}
