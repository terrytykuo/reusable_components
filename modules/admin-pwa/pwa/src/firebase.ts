import { initializeApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { firebaseConfig } from './firebaseConfig'

export { firebaseConfig }

export const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const googleProvider = new GoogleAuthProvider()
export const db = getFirestore(app)
// Callable Cloud Functions? Add:
//   import { getFunctions } from 'firebase/functions'
//   export const functions = getFunctions(app, 'us-central1')
