import { deleteDoc, getDoc, setDoc } from 'firebase/firestore'
import { getToken } from 'firebase/messaging'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  PushPermissionError,
  REGISTER_TIMEOUT_MS,
  describePushError,
  enablePush,
  getStoredToken,
  getVapidKey,
  isPushSupported,
  isStandalone,
  permissionState,
  refreshPush,
  TOKEN_STORAGE_KEY,
} from '../push'

vi.mock('../../firebase', () => ({ app: { name: 'test-app' }, db: { name: 'test-db' } }))
vi.mock('firebase/messaging', () => ({
  isSupported: vi.fn(async () => true),
  getMessaging: vi.fn(() => ({ name: 'messaging' })),
  getToken: vi.fn(async () => 'tok123'),
  deleteToken: vi.fn(async () => true),
  onMessage: vi.fn(() => () => {}),
}))
vi.mock('firebase/firestore', () => ({
  doc: vi.fn((_db: unknown, ...segments: string[]) => ({ path: segments.join('/') })),
  getDoc: vi.fn(),
  setDoc: vi.fn(async () => undefined),
  deleteDoc: vi.fn(async () => undefined),
  serverTimestamp: vi.fn(() => 'SERVER_TS'),
  collection: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  onSnapshot: vi.fn(),
}))

const REG = { scope: '/' }

/** Defines (or removes, with undefined) a property on navigator for one test. */
function setNavigator(key: string, value: unknown) {
  if (value === undefined) {
    Reflect.deleteProperty(navigator, key)
  } else {
    Object.defineProperty(navigator, key, { value, configurable: true })
  }
}

function stubPushEnv({
  permission = 'default',
  request = 'granted',
  ready = Promise.resolve(REG),
}: { permission?: string; request?: string; ready?: Promise<unknown> } = {}) {
  const requestPermission = vi.fn(async () => request)
  vi.stubGlobal('Notification', { permission, requestPermission })
  vi.stubGlobal('PushManager', function PushManager() {})
  setNavigator('serviceWorker', { ready })
  return { requestPermission }
}

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
  vi.unstubAllEnvs()
  setNavigator('serviceWorker', undefined)
  setNavigator('standalone', undefined)
  localStorage.clear()
  vi.clearAllMocks()
})

describe('isPushSupported', () => {
  it('is false when Notification, serviceWorker and PushManager are missing (jsdom default)', () => {
    expect(isPushSupported()).toBe(false)
  })

  it('is false when only PushManager is missing (iOS Safari tab)', () => {
    vi.stubGlobal('Notification', { permission: 'default' })
    setNavigator('serviceWorker', {})
    expect(isPushSupported()).toBe(false)
  })

  it('is true when all three APIs exist', () => {
    stubPushEnv()
    expect(isPushSupported()).toBe(true)
  })
})

describe('isStandalone', () => {
  it('is false in a browser tab', () => {
    vi.stubGlobal('matchMedia', vi.fn(() => ({ matches: false })))
    expect(isStandalone()).toBe(false)
  })

  it('is true for display-mode: standalone', () => {
    const matchMedia = vi.fn((q: string) => ({ matches: q === '(display-mode: standalone)' }))
    vi.stubGlobal('matchMedia', matchMedia)
    expect(isStandalone()).toBe(true)
  })

  it('is true for the iOS navigator.standalone flag', () => {
    vi.stubGlobal('matchMedia', vi.fn(() => ({ matches: false })))
    setNavigator('standalone', true)
    expect(isStandalone()).toBe(true)
  })
})

describe('permissionState', () => {
  it('is unsupported without the Notification API', () => {
    expect(permissionState()).toBe('unsupported')
  })

  it('reflects Notification.permission', () => {
    vi.stubGlobal('Notification', { permission: 'denied' })
    expect(permissionState()).toBe('denied')
  })
})

describe('getVapidKey', () => {
  it('is null when the env var is empty', () => {
    vi.stubEnv('VITE_FIREBASE_VAPID_KEY', '')
    expect(getVapidKey()).toBeNull()
  })

  it('returns the configured key', () => {
    vi.stubEnv('VITE_FIREBASE_VAPID_KEY', 'BKey')
    expect(getVapidKey()).toBe('BKey')
  })
})

describe('enablePush', () => {
  const who = { uid: 'u1', email: 'admin@example.com' }

  beforeEach(() => {
    vi.stubEnv('VITE_FIREBASE_VAPID_KEY', 'BKey')
  })

  it('throws a PushPermissionError and writes nothing when permission is denied', async () => {
    const { requestPermission } = stubPushEnv({ request: 'denied' })
    await expect(enablePush(who)).rejects.toBeInstanceOf(PushPermissionError)
    expect(requestPermission).toHaveBeenCalledTimes(1)
    expect(getToken).not.toHaveBeenCalled()
    expect(setDoc).not.toHaveBeenCalled()
    expect(getStoredToken()).toBeNull()
  })

  it('stores a new device with createdAt and lastSeenAt', async () => {
    stubPushEnv()
    vi.mocked(getDoc).mockResolvedValue({ exists: () => false } as never)

    await expect(enablePush(who)).resolves.toBe('tok123')

    expect(getToken).toHaveBeenCalledWith(expect.anything(), { vapidKey: 'BKey', serviceWorkerRegistration: REG })
    expect(setDoc).toHaveBeenCalledTimes(1)
    const [ref, data, options] = vi.mocked(setDoc).mock.calls[0] as unknown as [{ path: string }, Record<string, unknown>, unknown]
    expect(ref.path).toBe('admin/pushTokens/devices/tok123')
    expect(data).toMatchObject({ uid: 'u1', email: 'admin@example.com', createdAt: 'SERVER_TS', lastSeenAt: 'SERVER_TS' })
    expect(data).toHaveProperty('platform')
    expect(data).toHaveProperty('userAgent')
    expect(options).toEqual({ merge: true })
    expect(getStoredToken()).toBe('tok123')
  })

  it('keeps createdAt of an existing device and only bumps lastSeenAt', async () => {
    stubPushEnv()
    vi.mocked(getDoc).mockResolvedValue({ exists: () => true } as never)

    await enablePush(who)

    const data = vi.mocked(setDoc).mock.calls[0][1] as Record<string, unknown>
    expect(data).not.toHaveProperty('createdAt')
    expect(data).toMatchObject({ uid: 'u1', email: 'admin@example.com', lastSeenAt: 'SERVER_TS' })
  })

  it('refuses to run without a VAPID key', async () => {
    vi.stubEnv('VITE_FIREBASE_VAPID_KEY', '')
    const { requestPermission } = stubPushEnv()
    await expect(enablePush(who)).rejects.toThrow()
    expect(requestPermission).not.toHaveBeenCalled()
    expect(setDoc).not.toHaveBeenCalled()
  })

  it('gives up when the service worker never becomes ready, writing nothing', async () => {
    vi.useFakeTimers()
    stubPushEnv({ ready: new Promise(() => {}) })
    const result = expect(enablePush(who)).rejects.toThrow('Service worker 尚未就緒，請重新開啟 app')
    await vi.advanceTimersByTimeAsync(REGISTER_TIMEOUT_MS)
    await result
    expect(getToken).not.toHaveBeenCalled()
    expect(setDoc).not.toHaveBeenCalled()
    expect(getStoredToken()).toBeNull()
  })

  it('deletes the previous device doc when FCM hands out a new token', async () => {
    stubPushEnv()
    localStorage.setItem(TOKEN_STORAGE_KEY, 'oldTok')
    vi.mocked(getDoc).mockResolvedValue({ exists: () => false } as never)

    await expect(enablePush(who)).resolves.toBe('tok123')

    expect((vi.mocked(setDoc).mock.calls[0][0] as unknown as { path: string }).path).toBe('admin/pushTokens/devices/tok123')
    expect(deleteDoc).toHaveBeenCalledTimes(1)
    expect((vi.mocked(deleteDoc).mock.calls[0][0] as unknown as { path: string }).path).toBe('admin/pushTokens/devices/oldTok')
    expect(getStoredToken()).toBe('tok123')
  })

  it('does not delete anything when the token is unchanged', async () => {
    stubPushEnv()
    localStorage.setItem(TOKEN_STORAGE_KEY, 'tok123')
    vi.mocked(getDoc).mockResolvedValue({ exists: () => true } as never)
    await enablePush(who)
    expect(deleteDoc).not.toHaveBeenCalled()
  })

  it('maps FCM error codes to a readable message', async () => {
    stubPushEnv()
    vi.mocked(getToken).mockRejectedValueOnce(Object.assign(new Error('raw'), { code: 'messaging/permission-blocked' }))
    await expect(enablePush(who)).rejects.toThrow('通知已被封鎖，請到 iOS 設定開啟')
  })
})

describe('describePushError', () => {
  it('translates known codes, shows other codes as-is and falls back to the message', () => {
    expect(describePushError({ code: 'messaging/token-subscribe-failed' })).toBe('訂閱失敗，VAPID key 可能有誤')
    expect(describePushError(Object.assign(new Error('x'), { code: 'messaging/unknown' }))).toBe('messaging/unknown')
    expect(describePushError(new Error('plain'))).toBe('plain')
  })
})

describe('refreshPush', () => {
  const who = { uid: 'u1', email: 'admin@example.com' }

  beforeEach(() => {
    vi.stubEnv('VITE_FIREBASE_VAPID_KEY', 'BKey')
    vi.mocked(getDoc).mockResolvedValue({ exists: () => true } as never)
  })

  it('does nothing without a stored token', async () => {
    stubPushEnv({ permission: 'granted' })
    await expect(refreshPush(who)).resolves.toBeNull()
    expect(getToken).not.toHaveBeenCalled()
  })

  it('does nothing while permission is still default', async () => {
    stubPushEnv({ permission: 'default' })
    localStorage.setItem(TOKEN_STORAGE_KEY, 'tok123')
    await expect(refreshPush(who)).resolves.toBeNull()
    expect(getToken).not.toHaveBeenCalled()
  })

  it('swallows a getToken failure', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    stubPushEnv({ permission: 'granted' })
    localStorage.setItem(TOKEN_STORAGE_KEY, 'tok123')
    vi.mocked(getToken).mockRejectedValueOnce(new Error('network'))
    await expect(refreshPush(who)).resolves.toBeNull()
    expect(setDoc).not.toHaveBeenCalled()
  })

  it('re-registers a granted, previously enabled device without prompting', async () => {
    const { requestPermission } = stubPushEnv({ permission: 'granted' })
    localStorage.setItem(TOKEN_STORAGE_KEY, 'tok123')
    await expect(refreshPush(who)).resolves.toBe('tok123')
    expect(getToken).toHaveBeenCalledTimes(1)
    expect(requestPermission).not.toHaveBeenCalled()
    expect(setDoc).toHaveBeenCalledTimes(1)
  })
})
