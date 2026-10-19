import { getMessaging, onMessage } from 'firebase/messaging'
import { useEffect, useRef } from 'react'
import { app } from '../firebase'
import { isPushSupported, messagingSupported } from './push'

export interface PushToast {
  title?: string
  body?: string
  link?: string
}

/**
 * Foreground messages (app open and visible) → onToast; the SW handles background
 * ones. A foreground push shows no system notification, only what onToast renders.
 */
export function useForegroundMessages(onToast: (toast: PushToast) => void) {
  const onToastRef = useRef(onToast)
  useEffect(() => {
    onToastRef.current = onToast
  })

  useEffect(() => {
    if (!isPushSupported()) return
    let cancelled = false
    let unsubscribe: (() => void) | undefined
    void messagingSupported()
      .then((ok) => {
        if (!ok || cancelled) return
        unsubscribe = onMessage(getMessaging(app), (payload) =>
          onToastRef.current({
            title: payload.notification?.title,
            body: payload.notification?.body,
            // The server sets both; fcmOptions.link is the canonical one.
            link: payload.fcmOptions?.link ?? payload.data?.link,
          }),
        )
      })
      .catch((e) => console.warn('[admin-pwa] foreground messages unavailable', e))
    return () => {
      cancelled = true
      unsubscribe?.()
    }
  }, [])
}
