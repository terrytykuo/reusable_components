import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  where,
  type Timestamp,
} from 'firebase/firestore'
import { deleteToken, getMessaging, getToken, isSupported } from 'firebase/messaging'
import { useEffect, useState } from 'react'
import { brand } from '../brand'
import { app, db } from '../firebase'
import { t } from '../i18n'

export { isStandalone } from './standalone'

// Web push via FCM. The server (Cloud Function or CI) sends a `notification` block,
// so the Firebase Messaging SDK in src/sw.ts shows the notification and handles the
// click; this module only registers / removes this device's token.

/** Device tokens live at {DEVICES_PATH}/{token}; uid is a field. Set in brand.ts; must match the server. */
export const DEVICES_PATH = brand.devicesPath
export const TOKEN_STORAGE_KEY = `${brand.storageKey}.pushToken`

export type PushPermission = NotificationPermission | 'unsupported'

export interface PushUser {
  uid: string
  email: string | null
}

export interface PushDevice {
  id: string
  uid?: string
  email?: string | null
  platform?: string
  userAgent?: string
  createdAt?: Timestamp | null
  lastSeenAt?: Timestamp | null
}

/** Thrown by enablePush when the user does not grant notification permission. */
export class PushPermissionError extends Error {
  readonly permission: NotificationPermission

  constructor(permission: NotificationPermission) {
    super(`Notification permission ${permission}`)
    this.name = 'PushPermissionError'
    this.permission = permission
  }
}

export function isPushSupported(): boolean {
  return 'Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window
}

export function getVapidKey(): string | null {
  return import.meta.env.VITE_FIREBASE_VAPID_KEY || null
}

export function permissionState(): PushPermission {
  return 'Notification' in window ? Notification.permission : 'unsupported'
}

/** This device's token, remembered so the UI can show "enabled here" and offer to turn it off. */
export function getStoredToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_STORAGE_KEY)
  } catch {
    return null
  }
}

function storeToken(token: string | null) {
  try {
    if (token) localStorage.setItem(TOKEN_STORAGE_KEY, token)
    else localStorage.removeItem(TOKEN_STORAGE_KEY)
  } catch {
    // Storage unavailable; the device list still shows the token doc.
  }
}

// getMessaging() throws in browsers without the required APIs, so every call is
// gated on the SDK's own (async) isSupported(), resolved once.
let supportedPromise: Promise<boolean> | null = null
export function messagingSupported(): Promise<boolean> {
  supportedPromise ??= isSupported().catch(() => false)
  return supportedPromise
}

/** How long getting a token may take; `serviceWorker.ready` never settles when no SW is registered. */
export const REGISTER_TIMEOUT_MS = 8_000

/** Waits for the SW registration and asks FCM for a token, giving up after REGISTER_TIMEOUT_MS. */
async function getDeviceToken(vapidKey: string): Promise<string> {
  let timer: ReturnType<typeof setTimeout> | undefined
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(t.swNotReady)), REGISTER_TIMEOUT_MS)
  })
  const register = (async () => {
    const registration = await navigator.serviceWorker.ready
    return getToken(getMessaging(app), { vapidKey, serviceWorkerRegistration: registration })
  })()
  try {
    return await Promise.race([register, timeout])
  } finally {
    clearTimeout(timer)
  }
}

const PUSH_ERROR_MESSAGES: Record<string, string> = {
  'messaging/permission-blocked': t.pushPermissionBlocked,
  'messaging/token-subscribe-failed': t.pushSubscribeFailed,
}

/** User-facing text for a failed enable: known FCM codes translated, other FCM errors as their code. */
export function describePushError(e: unknown): string {
  const code = (e as { code?: unknown } | null)?.code
  if (typeof code === 'string' && code) return PUSH_ERROR_MESSAGES[code] ?? code
  return e instanceof Error ? e.message : String(e)
}

async function registerDevice({ uid, email }: PushUser, vapidKey: string): Promise<string> {
  if (!(await messagingSupported())) throw new Error(t.pushBrowserUnsupported)
  const token = await getDeviceToken(vapidKey)
  const ref = doc(db, DEVICES_PATH, token)
  // merge would overwrite createdAt on every refresh, so only a new device gets one.
  const existing = await getDoc(ref)
  await setDoc(
    ref,
    {
      uid,
      email,
      platform: navigator.platform,
      userAgent: navigator.userAgent,
      ...(existing.exists() ? {} : { createdAt: serverTimestamp() }),
      lastSeenAt: serverTimestamp(),
    },
    { merge: true },
  )
  // FCM rotated the token: drop the old doc so the server stops sending to a dead token.
  const prev = getStoredToken()
  if (prev && prev !== token) await deleteDoc(doc(db, DEVICES_PATH, prev)).catch(() => {})
  storeToken(token)
  return token
}

/** Asks for permission (call from a tap) and stores this device's FCM token. */
export async function enablePush(user: PushUser): Promise<string> {
  const vapidKey = getVapidKey()
  if (!vapidKey) throw new Error(t.pushNoVapid)
  const permission = await Notification.requestPermission()
  if (permission !== 'granted') throw new PushPermissionError(permission)
  try {
    return await registerDevice(user, vapidKey)
  } catch (e) {
    // Settings shows error.message; turn FCM codes into something actionable.
    throw new Error(describePushError(e), { cause: e })
  }
}

/**
 * App-start refresh: re-registers (bumps lastSeenAt, picks up a rotated token) only
 * when this device was enabled before and permission is still granted, so a device
 * the user switched off is not silently re-added. Best-effort; never throws.
 */
export async function refreshPush(user: PushUser): Promise<string | null> {
  const vapidKey = getVapidKey()
  if (!vapidKey || !isPushSupported() || permissionState() !== 'granted' || !getStoredToken()) return null
  try {
    return await registerDevice(user, vapidKey)
  } catch (e) {
    console.warn('[admin-pwa] refreshPush failed', e)
    return null
  }
}

/** Turns push off on this device: drops the FCM token and its Firestore doc. */
export async function disablePush(token: string): Promise<void> {
  try {
    if (await messagingSupported()) await deleteToken(getMessaging(app))
  } catch (e) {
    // The doc delete below is what stops the server sending; keep going.
    console.warn('[admin-pwa] deleteToken failed', e)
  }
  await deleteDoc(doc(db, DEVICES_PATH, token))
  storeToken(null)
}

/** Deletes a device from the list; for this device also drops the FCM token. */
export async function removeDevice(id: string): Promise<void> {
  if (id === getStoredToken()) return disablePush(id)
  await deleteDoc(doc(db, DEVICES_PATH, id))
}

/** Live list of the signed-in user's devices (no orderBy: equality filter needs no index). */
export function useMyDevices(uid: string | undefined) {
  const [state, setState] = useState<{ devices: PushDevice[]; loading: boolean; error: string | null }>({
    devices: [],
    loading: true,
    error: null,
  })

  useEffect(() => {
    if (!uid) return
    return onSnapshot(
      query(collection(db, DEVICES_PATH), where('uid', '==', uid)),
      (snap) =>
        setState({
          devices: snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<PushDevice, 'id'>) })),
          loading: false,
          error: null,
        }),
      (e) => setState({ devices: [], loading: false, error: e.message }),
    )
  }, [uid])

  return state
}
