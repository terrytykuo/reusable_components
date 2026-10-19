import { Component, type ErrorInfo, type ReactNode } from 'react'
import { t } from '../i18n'

/** Top-level boundary so a render error shows a recoverable screen instead of a blank PWA. */
export class ErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  componentDidCatch(error: unknown, info: ErrorInfo) {
    console.error('[admin-pwa] render error', error, info.componentStack)
  }

  render() {
    if (!this.state.failed) return this.props.children
    return (
      <div role="alert" className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-paper px-4 text-center">
        <p className="font-display text-xl font-semibold text-ink">{t.crashed}</p>
        <button
          type="button"
          // Go home rather than reload: a crash tied to this route would reload into itself.
          onClick={() => window.location.assign('/')}
          className="min-h-11 rounded-full bg-primary px-6 text-sm font-semibold text-card active:bg-primary-dark"
        >
          {t.goHome}
        </button>
      </div>
    )
  }
}
