import { act, renderHook, waitFor } from '@testing-library/react'
import type { IdTokenResult, User } from 'firebase/auth'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const authMock = vi.hoisted(() => ({
  listener: null as ((user: unknown) => void) | null,
  unsubscribe: vi.fn(),
  onAuthStateChanged: vi.fn(),
  getIdTokenResult: vi.fn(),
  signInWithRedirect: vi.fn(),
  signInWithPopup: vi.fn(),
  getRedirectResult: vi.fn(),
  signOut: vi.fn(),
  auth: { currentUser: null as unknown },
}))

vi.mock('firebase/auth', () => ({
  onAuthStateChanged: authMock.onAuthStateChanged,
  getIdTokenResult: authMock.getIdTokenResult,
  signInWithRedirect: authMock.signInWithRedirect,
  signInWithPopup: authMock.signInWithPopup,
  getRedirectResult: authMock.getRedirectResult,
  signOut: authMock.signOut,
}))

vi.mock('../../firebase', () => ({ auth: authMock.auth, googleProvider: {} }))

const pushMock = vi.hoisted(() => ({ isStandalone: vi.fn(() => false) }))
vi.mock('../../push/standalone', () => ({ isStandalone: pushMock.isStandalone }))

import { useAdminUser } from '../useAdminUser'

const user = { uid: 'u1', email: 'admin@example.com' } as unknown as User

function token(claims: Record<string, unknown>): IdTokenResult {
  return { claims } as unknown as IdTokenResult
}

function deferred<T>() {
  let resolve!: (value: T) => void
  const promise = new Promise<T>((r) => {
    resolve = r
  })
  return { promise, resolve }
}

function emit(nextUser: User | null) {
  act(() => {
    authMock.auth.currentUser = nextUser
    authMock.listener?.(nextUser)
  })
}

describe('useAdminUser', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    authMock.listener = null
    authMock.auth.currentUser = null
    authMock.onAuthStateChanged.mockImplementation((_auth: unknown, cb: (u: unknown) => void) => {
      authMock.listener = cb
      return authMock.unsubscribe
    })
    authMock.getRedirectResult.mockResolvedValue(null)
    authMock.signInWithRedirect.mockResolvedValue(undefined)
    authMock.signInWithPopup.mockResolvedValue({ user })
    authMock.signOut.mockResolvedValue(undefined)
    pushMock.isStandalone.mockReturnValue(false)
  })

  it('starts loading and becomes signed-out when there is no user', () => {
    const { result } = renderHook(() => useAdminUser())
    expect(result.current.status).toBe('loading')
    emit(null)
    expect(result.current.status).toBe('signed-out')
    expect(result.current.email).toBeNull()
  })

  it('uses the cached token when it already carries admin (no force refresh)', async () => {
    authMock.getIdTokenResult.mockResolvedValue(token({ admin: true }))
    const { result } = renderHook(() => useAdminUser())
    emit(user)
    await waitFor(() => expect(result.current.status).toBe('admin'))
    expect(result.current.email).toBe('admin@example.com')
    expect(authMock.getIdTokenResult).toHaveBeenCalledTimes(1)
    expect(authMock.getIdTokenResult).toHaveBeenCalledWith(user)
  })

  it('force-refreshes when the cached token lacks admin, and grants it from the fresh token', async () => {
    authMock.getIdTokenResult
      .mockResolvedValueOnce(token({}))
      .mockResolvedValueOnce(token({ admin: true }))
    const { result } = renderHook(() => useAdminUser())
    emit(user)
    await waitFor(() => expect(result.current.status).toBe('admin'))
    expect(authMock.getIdTokenResult).toHaveBeenLastCalledWith(user, true)
  })

  it('is not-admin when the refreshed token still lacks admin', async () => {
    authMock.getIdTokenResult.mockResolvedValue(token({}))
    const { result } = renderHook(() => useAdminUser())
    emit(user)
    await waitFor(() => expect(result.current.status).toBe('not-admin'))
    expect(authMock.getIdTokenResult).toHaveBeenCalledTimes(2)
  })

  it('is error (not not-admin) when the token lookup fails, and retry re-checks', async () => {
    authMock.getIdTokenResult.mockRejectedValueOnce(Object.assign(new Error('offline'), { code: 'auth/network-request-failed' }))
    const { result } = renderHook(() => useAdminUser())
    emit(user)
    await waitFor(() => expect(result.current.status).toBe('error'))
    expect(result.current.error).toBe('auth/network-request-failed')

    authMock.getIdTokenResult.mockResolvedValue(token({ admin: true }))
    act(() => result.current.retry())
    await waitFor(() => expect(result.current.status).toBe('admin'))
    expect(result.current.error).toBeNull()
  })

  it('signs in with a popup in a normal browser tab (no sessionStorage round trip)', async () => {
    const { result } = renderHook(() => useAdminUser())
    emit(null)
    await act(() => result.current.signIn())
    expect(authMock.signInWithPopup).toHaveBeenCalledTimes(1)
    expect(authMock.signInWithRedirect).not.toHaveBeenCalled()
    expect(result.current.error).toBeNull()
  })

  it('signs in with a redirect when launched from the home screen (standalone PWA)', async () => {
    pushMock.isStandalone.mockReturnValue(true)
    const { result } = renderHook(() => useAdminUser())
    emit(null)
    await act(() => result.current.signIn())
    expect(authMock.signInWithRedirect).toHaveBeenCalledTimes(1)
    expect(authMock.signInWithPopup).not.toHaveBeenCalled()
  })

  it('falls back to a redirect when the popup is blocked', async () => {
    authMock.signInWithPopup.mockRejectedValue(Object.assign(new Error('x'), { code: 'auth/popup-blocked' }))
    const { result } = renderHook(() => useAdminUser())
    emit(null)
    await act(() => result.current.signIn())
    expect(authMock.signInWithRedirect).toHaveBeenCalledTimes(1)
    expect(result.current.error).toBeNull()
  })

  it('stays quiet when the user closes the popup', async () => {
    authMock.signInWithPopup.mockRejectedValue(Object.assign(new Error('x'), { code: 'auth/popup-closed-by-user' }))
    const { result } = renderHook(() => useAdminUser())
    emit(null)
    await act(() => result.current.signIn())
    expect(result.current.error).toBeNull()
    expect(authMock.signInWithRedirect).not.toHaveBeenCalled()
  })

  it('sets a readable error when the popup sign-in rejects', async () => {
    authMock.signInWithPopup.mockRejectedValue(Object.assign(new Error('x'), { code: 'auth/unauthorized-domain' }))
    const { result } = renderHook(() => useAdminUser())
    emit(null)
    await act(() => result.current.signIn())
    expect(result.current.error).toBe('此網域尚未在 Firebase 授權')
    expect(result.current.status).toBe('signed-out')
  })

  it('sets a readable error when signInWithRedirect rejects', async () => {
    pushMock.isStandalone.mockReturnValue(true)
    authMock.signInWithRedirect.mockRejectedValue(Object.assign(new Error('x'), { code: 'auth/unauthorized-domain' }))
    const { result } = renderHook(() => useAdminUser())
    emit(null)
    await act(() => result.current.signIn())
    expect(result.current.error).toBe('此網域尚未在 Firebase 授權')
    expect(result.current.status).toBe('signed-out')
  })

  it('sets error when getRedirectResult rejects', async () => {
    authMock.getRedirectResult.mockRejectedValue(Object.assign(new Error('x'), { code: 'auth/operation-not-allowed' }))
    const { result } = renderHook(() => useAdminUser())
    emit(null)
    await waitFor(() => expect(result.current.error).toBe('Google 登入尚未啟用'))
  })

  it('stays signed-out when the user signs out during an in-flight token lookup', async () => {
    const pending = deferred<IdTokenResult>()
    authMock.getIdTokenResult.mockReturnValue(pending.promise)
    const { result } = renderHook(() => useAdminUser())
    emit(user)
    expect(result.current.status).toBe('loading')
    emit(null)
    expect(result.current.status).toBe('signed-out')
    await act(async () => {
      pending.resolve(token({ admin: true }))
      await pending.promise
    })
    expect(result.current.status).toBe('signed-out')
  })

  it('unsubscribes from auth state on unmount', () => {
    const { unmount } = renderHook(() => useAdminUser())
    expect(authMock.onAuthStateChanged).toHaveBeenCalledTimes(1)
    unmount()
    expect(authMock.unsubscribe).toHaveBeenCalledTimes(1)
  })
})
