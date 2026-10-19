import {
  getIdTokenResult,
  getRedirectResult,
  onAuthStateChanged,
  signInWithPopup,
  signInWithRedirect,
  signOut as firebaseSignOut,
  type User,
} from 'firebase/auth'
import { useCallback, useEffect, useRef, useState } from 'react'
import { auth, googleProvider } from '../firebase'
import { t } from '../i18n'
import { isStandalone } from '../push/standalone'

export type AdminStatus = 'loading' | 'signed-out' | 'not-admin' | 'admin' | 'error'

export interface AdminUserState {
  status: AdminStatus
  user: User | null
  email: string | null
  /** Last sign-in / identity-check failure, readable for the UI. */
  error: string | null
  signIn: () => Promise<void>
  signOut: () => Promise<void>
  /** Re-runs the admin-claim check for the current user (after status 'error'). */
  retry: () => void
}

/** Custom claim that grants access; set with server/set-admin.mjs. */
export const ADMIN_CLAIM = 'admin'

const AUTH_ERROR_MESSAGES: Record<string, string> = {
  'auth/unauthorized-domain': t.authUnauthorizedDomain,
  'auth/operation-not-allowed': t.authOperationNotAllowed,
  'auth/popup-blocked': t.authPopupBlocked,
}

/** The user dismissed the popup (or started a second one); not an error worth showing. */
const POPUP_DISMISSED_CODES = new Set(['auth/popup-closed-by-user', 'auth/cancelled-popup-request'])

function errorCode(error: unknown): string | undefined {
  return (error as { code?: string } | null)?.code
}

export function describeAuthError(error: unknown): string {
  const { code, message } = (error ?? {}) as { code?: string; message?: string }
  if (code && AUTH_ERROR_MESSAGES[code]) return AUTH_ERROR_MESSAGES[code]
  return code || message || String(error)
}

export function useAdminUser(): AdminUserState {
  const [status, setStatus] = useState<AdminStatus>('loading')
  const [user, setUser] = useState<User | null>(null)
  const [error, setError] = useState<string | null>(null)
  // Bumped on every auth change / retry; a lookup whose seq is no
  // longer current must not overwrite the newer state.
  const seqRef = useRef(0)

  const checkClaim = useCallback(async (target: User, seq: number) => {
    try {
      // Cached token first; force-refresh only when it lacks the claim, so a
      // freshly granted admin claim is still picked up on the next launch.
      let token = await getIdTokenResult(target)
      if (token.claims[ADMIN_CLAIM] !== true) token = await getIdTokenResult(target, true)
      if (seq !== seqRef.current) return
      setStatus(token.claims[ADMIN_CLAIM] === true ? 'admin' : 'not-admin')
    } catch (e) {
      if (seq !== seqRef.current) return
      console.warn('[admin-pwa] getIdTokenResult failed', e)
      setError(describeAuthError(e))
      setStatus('error')
    }
  }, [])

  useEffect(() => {
    // Completes a pending signInWithRedirect; a null result is the normal case.
    getRedirectResult(auth).catch((e: unknown) => {
      console.warn('[admin-pwa] getRedirectResult failed', e)
      setError(describeAuthError(e))
    })
  }, [])

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (nextUser) => {
      const seq = ++seqRef.current
      setUser(nextUser)
      if (!nextUser) {
        setStatus('signed-out')
        return
      }
      setStatus('loading')
      void checkClaim(nextUser, seq)
    })
    // A lookup still in flight after unmount only calls setState on an unmounted
    // component, which React ignores; the seq guard covers StrictMode remounts.
    return unsubscribe
  }, [checkClaim])

  const retry = useCallback(() => {
    const seq = ++seqRef.current
    const current = auth.currentUser
    setError(null)
    if (!current) {
      setUser(null)
      setStatus('signed-out')
      return
    }
    setStatus('loading')
    void checkClaim(current, seq)
  }, [checkClaim])

  const signIn = useCallback(async () => {
    setError(null)
    // Home-screen PWA: popups are unreliable (iOS opens them in a separate
    // in-app browser), so redirect is the only option there. In a normal
    // browser tab, redirect depends on sessionStorage surviving the round trip
    // through accounts.google.com, which iPhone browsers drop ("missing initial
    // state"); the popup flow needs no such state, so it is the default.
    if (isStandalone()) {
      try {
        await signInWithRedirect(auth, googleProvider)
      } catch (e) {
        console.warn('[admin-pwa] signInWithRedirect failed', e)
        setError(describeAuthError(e))
      }
      return
    }
    try {
      await signInWithPopup(auth, googleProvider)
    } catch (e) {
      const code = errorCode(e)
      if (code && POPUP_DISMISSED_CODES.has(code)) return
      if (code === 'auth/popup-blocked') {
        try {
          await signInWithRedirect(auth, googleProvider)
          return
        } catch (redirectError) {
          console.warn('[admin-pwa] signInWithRedirect fallback failed', redirectError)
          setError(describeAuthError(redirectError))
          return
        }
      }
      console.warn('[admin-pwa] signInWithPopup failed', e)
      setError(describeAuthError(e))
    }
  }, [])

  const signOut = useCallback(() => firebaseSignOut(auth), [])

  return { status, user, email: user?.email ?? null, error, signIn, signOut, retry }
}
