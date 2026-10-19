// Plain Firebase web config, shared by the page (src/firebase.ts) and the service
// worker (src/sw.ts). Keep this file free of SDK imports: the SW must not pull in
// firebase/auth or firebase/firestore.
//
// The values are public by design (they identify the project; access is enforced
// by Auth + security rules), so the real .env may be committed. See .env.example.
export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  // Must be the Hosting origin (e.g. <site>.web.app), not <project>.firebaseapp.com:
  // redirect sign-in in an iOS home-screen PWA needs page and authDomain on one origin.
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}
