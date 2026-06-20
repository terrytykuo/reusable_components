const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * 回傳 date 加上 days 天後的新 Date（不修改原物件）。days 可為負數。
 */
export function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setTime(next.getTime() + days * DAY_MS);
  return next;
}

/**
 * 通用相對日期格式化（前身為 formatTrialDate）。
 *
 * 以 Intl.DateTimeFormat 輸出「月 日」（例如 Jun 20）；
 * 若 `date` 與 `reference` 不同年，則加上年份（例如 Jun 20, 2027）。
 *
 * @param date 要格式化的日期
 * @param reference 比較基準日期，預設為現在；用來決定是否顯示年份
 *
 * @example
 * formatRelativeDate(addDays(new Date(), 14)); // 'Jul 4'
 */
export function formatRelativeDate(date: Date, reference: Date = new Date()): string {
  const includeYear = date.getFullYear() !== reference.getFullYear();
  const options: Intl.DateTimeFormatOptions = {
    month: 'short',
    day: 'numeric',
  };

  if (includeYear) options.year = 'numeric';

  return new Intl.DateTimeFormat(undefined, options).format(date);
}
