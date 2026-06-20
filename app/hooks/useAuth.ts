// hooks/useAuth.ts
import { useState, useEffect } from 'react';
import { onAuthStateChanged, type Auth, type User } from 'firebase/auth';

export interface UseAuthResult {
  /** 目前登入的使用者，未登入時為 null */
  user: User | null;
  /** 首次 auth 狀態解析前為 true */
  loading: boolean;
}

/**
 * 監聽 Firebase Auth 狀態變化的 hook。
 *
 * 解耦：`auth` 實例改為參數注入，不 import 任何專案的 firebase 設定。
 * 在 app 端傳入由 `createFirebase()`（見 app/lib/firebase）建立的 auth 實例。
 *
 * @param auth Firebase Auth 實例
 *
 * @example
 * const { auth } = createFirebase(config);
 * const { user, loading } = useAuth(auth);
 */
export function useAuth(auth: Auth): UseAuthResult {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return unsubscribe;
  }, [auth]);

  return { user, loading };
}
