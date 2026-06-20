import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getFunctions, type Functions } from 'firebase/functions';
import { getStorage, type FirebaseStorage } from 'firebase/storage';
import { initializeAuth, getAuth, type Auth } from 'firebase/auth';
// @ts-ignore — getReactNativePersistence is available at runtime in React Native
import { getReactNativePersistence } from 'firebase/auth';
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Firebase 設定物件。
 *
 * 解耦：原本直接讀 process.env 的 EXPO_PUBLIC_* keys 改為由呼叫端傳入，
 * 元件庫不綁定任何特定 app 的 env key 命名。
 */
export interface FirebaseConfig {
  apiKey?: string;
  authDomain?: string;
  projectId?: string;
  storageBucket?: string;
  messagingSenderId?: string;
  appId?: string;
}

export interface CreateFirebaseOptions {
  /** Cloud Functions region，預設 'us-central1' */
  functionsRegion?: string;
}

export interface FirebaseServices {
  app: FirebaseApp;
  auth: Auth;
  db: Firestore;
  storage: FirebaseStorage;
  functions: Functions;
}

/**
 * 工廠函式：以傳入的 config 初始化 React Native + Firebase，
 * 並回傳 app / auth / db / storage / functions 實例。
 *
 * - Auth 使用 AsyncStorage 做 persistence；若已初始化（hot reload）則 fallback 到 getAuth。
 * - 重複呼叫不會重複 initializeApp（重用既有的 default app）。
 *
 * @example
 * export const { auth, db, storage, functions } = createFirebase({
 *   apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
 *   authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
 *   projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
 *   // ...
 * });
 */
export function createFirebase(
  config: FirebaseConfig,
  options: CreateFirebaseOptions = {},
): FirebaseServices {
  const app = getApps().length === 0 ? initializeApp(config) : getApp();

  // Try initializeAuth with persistence, fall back to getAuth if already initialized
  let auth: Auth;
  try {
    auth = initializeAuth(app, {
      persistence: getReactNativePersistence(ReactNativeAsyncStorage),
    });
  } catch {
    // Auth was already initialized (e.g. hot reload), get existing instance
    auth = getAuth(app);
  }

  const db = getFirestore(app);
  const storage = getStorage(app);
  const functions = getFunctions(app, options.functionsRegion ?? 'us-central1');

  return { app, auth, db, storage, functions };
}
