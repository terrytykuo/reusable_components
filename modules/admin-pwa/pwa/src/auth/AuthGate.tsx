import type { ReactNode } from 'react'
import { t } from '../i18n'
import { AdminUserContext } from './adminContext'
import { useAdminUser } from './useAdminUser'
import { Wordmark } from './Wordmark'

const primaryButton = 'h-13 rounded-full bg-primary px-8 font-medium text-white active:bg-primary-dark'
const secondaryButton =
  'h-11 rounded-full border border-line bg-card px-6 font-medium text-ink active:bg-paper-strong'

/** Renders children only for a signed-in user whose ID token carries the admin claim. */
export function AuthGate({ children }: { children: ReactNode }) {
  const state = useAdminUser()
  const { status, email, error, signIn, signOut, retry } = state

  if (status === 'admin') {
    return <AdminUserContext.Provider value={state}>{children}</AdminUserContext.Provider>
  }

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-6 px-4 text-center">
      {status === 'loading' && (
        <div role="status">
          <span className="block size-10 animate-spin rounded-full border-4 border-primary-light border-t-primary motion-reduce:animate-none" />
          <span className="sr-only">{t.loading}</span>
        </div>
      )}

      {status === 'signed-out' && (
        <>
          <Wordmark />
          <button type="button" onClick={() => void signIn()} className={primaryButton}>
            {t.signInWithGoogle}
          </button>
          {error && (
            <p role="alert" className="max-w-xs text-sm break-words text-danger-text">
              {error}
            </p>
          )}
        </>
      )}

      {status === 'not-admin' && (
        <>
          <Wordmark />
          <div className="space-y-1">
            <p className="text-lg font-medium text-ink">{t.notAdmin}</p>
            {email && <p className="text-sm break-all text-ink-secondary">{email}</p>}
          </div>
          <button type="button" onClick={() => void signOut()} className={secondaryButton}>
            {t.signOut}
          </button>
        </>
      )}

      {status === 'error' && (
        <>
          <Wordmark />
          <div className="space-y-1">
            <p className="text-lg font-medium text-ink">{t.verifyFailed}</p>
            {error && <p className="text-xs break-all text-ink-muted">{error}</p>}
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={retry} className={primaryButton}>
              {t.retry}
            </button>
            <button type="button" onClick={() => void signOut()} className={secondaryButton}>
              {t.signOut}
            </button>
          </div>
        </>
      )}
    </main>
  )
}
