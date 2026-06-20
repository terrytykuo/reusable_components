// context/SubscriptionContext.tsx
import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  type ReactNode,
} from 'react';
import { doc, onSnapshot, getDoc, type Firestore } from 'firebase/firestore';
import type { Auth } from 'firebase/auth';
import { checkPremium, initPurchases } from '../lib/purchases';
import { useAuth } from '../hooks/useAuth';

/**
 * 訂閱狀態 Context：提供 isPremium / subscriptionStatus / isLoading / refresh()。
 * 整合 RevenueCat（app/lib/purchases）+ Firestore 使用者文件 listener + dev override。
 *
 * 解耦重點：
 * - `auth` / `db` 由 props 注入（指向 app/lib/firebase 的工廠輸出）。
 * - dev override 改為 `forcePremiumInDev` prop（取代寫死的 FORCE_PREMIUM_IN_DEV 常數），
 *   仍同時尊重環境變數 EXPO_PUBLIC_FORCE_PREMIUM。
 * - Firestore 使用者文件路徑可設定（usersCollection / 使用 user.uid 作為 docId）。
 * - 訂閱狀態值與「視為 premium 的狀態」由 props 設定（activeStatuses），不綁特定字串。
 * - 移除專案專屬的 backend sync；如需可透過 `onSyncStatus` 注入。
 */

/** 訂閱狀態字串，由各 app 自行定義（如 'free' | 'trial' | 'active'） */
export type SubscriptionStatusValue = string;

export interface SubscriptionState {
  isPremium: boolean;
  /** dev 環境下的匿名測試帳號旗標 */
  isTestMode: boolean;
  subscriptionStatus: SubscriptionStatusValue;
  isLoading: boolean;
  refresh: (options?: { forcePremiumRefresh?: boolean }) => void;
}

export interface SubscriptionProviderProps {
  children: ReactNode;
  /** Firebase Auth 實例（來自 createFirebase） */
  auth: Auth;
  /** Firestore 實例（來自 createFirebase） */
  db: Firestore;
  /** 預設訂閱狀態，預設 'free' */
  defaultStatus?: SubscriptionStatusValue;
  /** 視為 premium 的狀態清單，預設 ['trial', 'active'] */
  activeStatuses?: ReadonlyArray<SubscriptionStatusValue>;
  /** 存使用者文件的 collection 名稱，預設 'users' */
  usersCollection?: string;
  /** 使用者文件中存訂閱狀態的欄位名，預設 'subscriptionStatus' */
  statusField?: string;
  /**
   * dev-only 強制 premium（截圖 / 開發測試用）。
   * 僅在 __DEV__ 生效；同時尊重 EXPO_PUBLIC_FORCE_PREMIUM === 'true'。
   * release build 中整段為 dead code。
   */
  forcePremiumInDev?: boolean;
  /**
   * 可選：以後端同步覆寫 RevenueCat 結果。
   * 回傳 { isPremium, subscriptionStatus }，拋錯時 fallback 到 Firestore seed。
   */
  onSyncStatus?: () => Promise<{ isPremium: boolean; subscriptionStatus: SubscriptionStatusValue }>;
}

const SubscriptionContext = createContext<SubscriptionState>({
  isPremium: false,
  isTestMode: false,
  subscriptionStatus: 'free',
  isLoading: true,
  refresh: () => {},
});

export function SubscriptionProvider({
  children,
  auth,
  db,
  defaultStatus = 'free',
  activeStatuses = ['trial', 'active'],
  usersCollection = 'users',
  statusField = 'subscriptionStatus',
  forcePremiumInDev = false,
  onSyncStatus,
}: SubscriptionProviderProps) {
  const { user, loading: authLoading } = useAuth(auth);
  const [rcPremium, setRcPremium] = useState(false);
  const [status, setStatus] = useState<SubscriptionStatusValue>(defaultStatus);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshToken, setRefreshToken] = useState(0);
  const forcePremiumRefreshRef = useRef(false);

  const FORCE_PREMIUM =
    __DEV__ && (forcePremiumInDev || process.env.EXPO_PUBLIC_FORCE_PREMIUM === 'true');

  const readStatusFromDoc = useCallback(
    (data: Record<string, unknown> | null): SubscriptionStatusValue =>
      (data?.[statusField] as SubscriptionStatusValue | undefined) ?? defaultStatus,
    [statusField, defaultStatus],
  );

  const refresh = useCallback((options?: { forcePremiumRefresh?: boolean }) => {
    forcePremiumRefreshRef.current = !!options?.forcePremiumRefresh;
    setRefreshToken((t) => t + 1);
  }, []);

  // RevenueCat premium check — fires on user change + manual refresh.
  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setRcPremium(false);
      setStatus(defaultStatus);
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    const uid = user.uid;
    setIsLoading(true);

    (async () => {
      try {
        // Dev force-premium: skip the RevenueCat-backed sync entirely and just
        // seed status from the existing doc; the snapshot listener keeps it
        // current. Entire branch is dead-code-eliminated in release builds.
        if (FORCE_PREMIUM) {
          if (!cancelled) setRcPremium(true);
          const snap = await getDoc(doc(db, usersCollection, uid));
          if (cancelled) return;
          const data = snap.exists() ? (snap.data() as Record<string, unknown>) : null;
          setStatus(readStatusFromDoc(data));
          return;
        }

        await initPurchases(uid).catch((err) => {
          console.warn('[subscription] initPurchases failed:', err);
        });
        const premium = await checkPremium({ forceRefresh: forcePremiumRefreshRef.current });
        if (!cancelled) setRcPremium(premium);

        if (onSyncStatus) {
          try {
            const synced = await onSyncStatus();
            if (cancelled) return;
            setRcPremium(synced.isPremium);
            setStatus(synced.subscriptionStatus);
            return;
          } catch (syncError) {
            console.warn('[subscription] backend sync failed:', syncError);
          }
        }

        // Seed status from the current Firestore doc so we don't flash a stale
        // default before the snapshot subscription below catches up.
        const snap = await getDoc(doc(db, usersCollection, uid));
        if (cancelled) return;
        const data = snap.exists() ? (snap.data() as Record<string, unknown>) : null;
        setStatus(readStatusFromDoc(data));
      } catch (error) {
        console.error('[subscription] refresh failed:', error);
        if (!cancelled) setRcPremium(false);
      } finally {
        forcePremiumRefreshRef.current = false;
        if (!cancelled) setIsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.uid, authLoading, refreshToken]);

  // Firestore status listener — keeps trial/active in sync without requiring an
  // explicit refresh after a pay-plan write elsewhere.
  useEffect(() => {
    if (!user) return;
    const unsub = onSnapshot(
      doc(db, usersCollection, user.uid),
      (snap) => {
        if (!snap.exists()) return;
        setStatus(readStatusFromDoc(snap.data() as Record<string, unknown>));
      },
      (error) => {
        console.error('[subscription] snapshot listener error:', error);
      },
    );
    return unsub;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.uid]);

  // Test mode is only allowed in development builds — never in production.
  const isTestMode = __DEV__ && !!user && user.isAnonymous;
  const isPremium = FORCE_PREMIUM || rcPremium || activeStatuses.includes(status);

  return (
    <SubscriptionContext.Provider
      value={{
        isPremium,
        isTestMode,
        subscriptionStatus: status,
        isLoading,
        refresh,
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscriptionContext() {
  return useContext(SubscriptionContext);
}
