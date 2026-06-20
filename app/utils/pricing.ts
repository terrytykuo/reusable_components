import type { PurchasesPackage } from 'react-native-purchases';

/**
 * 訂閱定價工具：貨幣格式化（Intl）、年訂閱省比例、每月均價。
 *
 * 解耦：零業務綁定，fallback 價格改為由呼叫端傳入，不再 hardcode 任何方案價格。
 */

/** 從 RevenueCat package 取有效價格，否則回傳 fallback */
export function packagePrice(pkg: PurchasesPackage | null, fallbackAmount: number): number {
  const price = pkg?.product.price;
  return typeof price === 'number' && Number.isFinite(price) && price > 0 ? price : fallbackAmount;
}

/**
 * 以 Intl.NumberFormat 格式化貨幣金額。
 * currencyCode 缺失或格式化失敗時回傳 null。
 */
export function formatCurrency(amount: number, currencyCode?: string): string | null {
  if (!currencyCode) return null;

  try {
    return new Intl.NumberFormat(undefined, {
      currency: currencyCode,
      maximumFractionDigits: 2,
      minimumFractionDigits: 0,
      style: 'currency',
    }).format(amount);
  } catch {
    return null;
  }
}

/**
 * 計算年方案相對於「月方案 × 12」的省下百分比（0–100 整數）。
 * 月價或年價無效、或年價未比較便宜時回傳 0。
 *
 * @param monthlyFallback 月方案 fallback 金額（無 package 時使用）
 * @param yearlyFallback 年方案 fallback 金額
 */
export function getYearlySavingsPercent(
  monthly: PurchasesPackage | null,
  yearly: PurchasesPackage | null,
  monthlyFallback: number,
  yearlyFallback: number,
): number {
  const monthlyPrice = packagePrice(monthly, monthlyFallback);
  const yearlyPrice = packagePrice(yearly, yearlyFallback);
  const monthlyAnnual = monthlyPrice * 12;

  if (monthlyAnnual <= 0 || yearlyPrice >= monthlyAnnual) return 0;
  return Math.round((1 - yearlyPrice / monthlyAnnual) * 100);
}

/**
 * 年方案的每月均價文字。優先使用 RevenueCat 提供的 pricePerMonthString，
 * 否則以 Intl 格式化「年價 / 12」。兩者皆無時回傳 fallbackText。
 */
export function getMonthlyEquivalentString(
  yearly: PurchasesPackage | null,
  yearlyFallback: number,
  fallbackText = '',
): string {
  const pricePerMonthString = yearly?.product.pricePerMonthString;
  if (pricePerMonthString) return pricePerMonthString;

  const price = packagePrice(yearly, yearlyFallback);
  const formatted = formatCurrency(price / 12, yearly?.product.currencyCode);
  return formatted ?? fallbackText;
}

/** 取得方案價格字串，優先用 package 的 priceString，否則回傳 fallbackDisplay */
export function getPlanPriceString(
  pkg: PurchasesPackage | null,
  fallbackDisplay: string,
): string {
  return pkg?.product.priceString ?? fallbackDisplay;
}
