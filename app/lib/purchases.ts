import Purchases, {
  LOG_LEVEL,
  type PurchasesPackage,
  type PurchasesOfferings,
  type MakePurchaseResult,
  type CustomerInfo,
} from 'react-native-purchases';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

/**
 * RevenueCat 封裝：初始化、premium 狀態快取（TTL）、timeout 保護、Expo Go 偵測。
 *
 * 解耦：API keys 與 cache / timeout 設定改為 `configurePurchases()` 傳入，
 * 不再讀任何 EXPO_PUBLIC_* env key。其餘 API 與原版一致。
 */
export interface PurchasesConfig {
  /** iOS RevenueCat public API key */
  iosApiKey?: string;
  /** Android RevenueCat public API key */
  androidApiKey?: string;
  /** premium 狀態快取存活時間（ms），預設 10 分鐘 */
  premiumCacheTtlMs?: number;
  /** getCustomerInfo timeout（ms），預設 5000 */
  customerInfoTimeoutMs?: number;
}

const DEFAULT_PREMIUM_CACHE_TTL_MS = 10 * 60 * 1000;
const DEFAULT_CUSTOMER_INFO_TIMEOUT_MS = 5_000;

const isExpoGo = Constants.appOwnership === 'expo';

let iosApiKey = '';
let androidApiKey = '';
let premiumCacheTtlMs = DEFAULT_PREMIUM_CACHE_TTL_MS;
let customerInfoTimeoutMs = DEFAULT_CUSTOMER_INFO_TIMEOUT_MS;

let premiumCache: { value: boolean; checkedAt: number } | null = null;
let premiumRequest: Promise<boolean> | null = null;
let purchasesConfigured = false;
let purchasesReady = false;
let purchasesUserId: string | null = null;
let logHandlerConfigured = false;

/**
 * 設定 API keys 與快取 / timeout 參數。
 * 必須在第一次 `initPurchases()` 之前呼叫一次（通常在 app 啟動時）。
 */
export function configurePurchases(config: PurchasesConfig): void {
  iosApiKey = config.iosApiKey ?? '';
  androidApiKey = config.androidApiKey ?? '';
  premiumCacheTtlMs = config.premiumCacheTtlMs ?? DEFAULT_PREMIUM_CACHE_TTL_MS;
  customerInfoTimeoutMs = config.customerInfoTimeoutMs ?? DEFAULT_CUSTOMER_INFO_TIMEOUT_MS;
}

function cachePremiumStatus(value: boolean): boolean {
  premiumCache = {
    value,
    checkedAt: Date.now(),
  };
  return value;
}

function getFreshPremiumStatus(): boolean | null {
  if (!premiumCache) return null;
  if (Date.now() - premiumCache.checkedAt > premiumCacheTtlMs) return null;
  return premiumCache.value;
}

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number, label: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error(`${label} timed out after ${timeoutMs}ms.`));
    }, timeoutMs);

    promise.then(
      (value) => {
        clearTimeout(timeout);
        resolve(value);
      },
      (error) => {
        clearTimeout(timeout);
        reject(error);
      },
    );
  });
}

export async function initPurchases(uid: string): Promise<void> {
  if (isExpoGo) {
    console.warn('[purchases] Running in Expo Go – skipping RevenueCat init.');
    purchasesReady = false;
    return;
  }
  const apiKey = Platform.OS === 'ios' ? iosApiKey : androidApiKey;
  if (!apiKey) {
    console.error('[purchases] RevenueCat API key is missing. Skipping RevenueCat init for this build.');
    purchasesReady = false;
    return;
  }

  if (!purchasesConfigured) {
    configureRevenueCatLogs();
    Purchases.configure({ apiKey });
    purchasesConfigured = true;
  }

  if (purchasesUserId !== uid) {
    invalidatePremiumCache();
    await Purchases.logIn(uid);
    purchasesUserId = uid;
  }

  purchasesReady = true;
}

export function invalidatePremiumCache(): void {
  premiumCache = null;
  premiumRequest = null;
}

export async function checkPremium(options: { forceRefresh?: boolean } = {}): Promise<boolean> {
  if (!purchasesReady) {
    return cachePremiumStatus(false);
  }

  const { forceRefresh = false } = options;
  const cachedStatus = !forceRefresh ? getFreshPremiumStatus() : null;
  if (cachedStatus !== null) {
    return cachedStatus;
  }

  if (!forceRefresh && premiumRequest) {
    return premiumRequest;
  }

  let request: Promise<boolean> | null = null;
  try {
    request = withTimeout(
      Purchases.getCustomerInfo(),
      customerInfoTimeoutMs,
      'RevenueCat customer info request',
    ).then((info) => cachePremiumStatus(Object.keys(info.entitlements.active).length > 0));
    premiumRequest = request;
    return await request;
  } catch (error) {
    console.error('[purchases] Failed to fetch customer info:', error);
    return premiumCache?.value ?? false;
  } finally {
    if (premiumRequest === request) {
      premiumRequest = null;
    }
  }
}

export async function getOfferings(): Promise<PurchasesOfferings> {
  assertPurchasesReady();
  return Purchases.getOfferings();
}

export async function purchasePackage(pkg: PurchasesPackage): Promise<MakePurchaseResult> {
  assertPurchasesReady();
  return Purchases.purchasePackage(pkg);
}

export async function restorePurchases(): Promise<CustomerInfo> {
  assertPurchasesReady();
  return Purchases.restorePurchases();
}

/** 是否已成功初始化（非 Expo Go 且 API key 存在且 init 過） */
export function isPurchasesReady(): boolean {
  return purchasesReady;
}

function assertPurchasesReady(): void {
  if (!purchasesReady) {
    throw new Error('RevenueCat is not configured for this build.');
  }
}

function configureRevenueCatLogs(): void {
  if (logHandlerConfigured) return;

  Purchases.setLogLevel(LOG_LEVEL.ERROR);
  Purchases.setLogHandler((level, message) => {
    const isOfferingCatalogConfigurationIssue =
      message.includes('SDK Configuration is not valid')
      || message.includes("Offering 'default' has no packages configured")
      || message.includes('Error fetching offerings')
      || message.includes('no Test Store products registered')
      || message.includes('why-are-offerings-empty')
      || message.includes('how-to-configure-offerings');

    if (__DEV__ && isOfferingCatalogConfigurationIssue) {
      console.log('[RevenueCat] Offering catalog is not configured. Pay-plan UI will fall back during local onboarding tests.');
      return;
    }

    if (level === LOG_LEVEL.ERROR) {
      console.error(`[RevenueCat] ${message}`);
    } else if (level === LOG_LEVEL.WARN) {
      console.warn(`[RevenueCat] ${message}`);
    } else {
      console.log(`[RevenueCat] ${message}`);
    }
  });
  logHandlerConfigured = true;
}
