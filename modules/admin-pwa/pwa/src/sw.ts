/// <reference lib="webworker" />
import { initializeApp } from 'firebase/app'
import { getMessaging, onBackgroundMessage } from 'firebase/messaging/sw'
import { clientsClaim } from 'workbox-core'
import { cleanupOutdatedCaches, precacheAndRoute } from 'workbox-precaching'
import { firebaseConfig } from './firebaseConfig'

declare let self: ServiceWorkerGlobalScope

// App-shell precache only. No navigation route on purpose: /__/auth/* (redirect
// sign-in) must always reach the network.
precacheAndRoute(self.__WB_MANIFEST)
cleanupOutdatedCaches()

void self.skipWaiting()
clientsClaim()

// FCM. The server (Function or CI) sends a `notification` block, so the Messaging
// SDK shows the notification and opens fcmOptions.link on click. Do NOT call
// showNotification or add a notificationclick handler here — that would notify twice.
const messaging = getMessaging(initializeApp(firebaseConfig))
onBackgroundMessage(messaging, (payload) => {
  console.debug('[admin-pwa sw] push', payload?.data)
})
