/**
 * concurrency — 批次 async 工作的重試與並行控制工具。
 *
 * 呼叫 LLM（或任何不穩定的網路 / 子程序工作）時很常需要：
 *   1. 失敗自動重試幾次（模型偶爾吐壞格式、CLI 偶爾逾時）。
 *   2. 限制同時進行的數量（避免一次 spawn 幾十個子程序、撞到 rate limit）。
 *
 * 本模組純 async、零依賴，可用於任何批次 async 工作，與 LLM 無強綁定。
 */

export interface RetryOptions {
  /** 每次重試之間的延遲（毫秒）。預設 0（立即重試）。 */
  delayMs?: number;
  /** 失敗時的回呼，可用於 log。參數為錯誤與「即將開始的」嘗試次數（從 1 起算）。 */
  onRetry?: (error: unknown, nextAttempt: number) => void;
}

/**
 * 重試一個回傳 Promise 的工作，最多 `tries` 次，全部失敗才拋出最後一個錯誤。
 *
 * @param fn    每次嘗試呼叫的函式。
 * @param tries 最多嘗試次數（含第一次）。預設 3。
 * @param opts  延遲與重試回呼。
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  tries = 3,
  opts: RetryOptions = {}
): Promise<T> {
  let lastErr: unknown;
  for (let attempt = 1; attempt <= tries; attempt++) {
    try {
      return await fn();
    } catch (e) {
      lastErr = e;
      if (attempt < tries) {
        opts.onRetry?.(e, attempt + 1);
        if (opts.delayMs && opts.delayMs > 0) {
          await new Promise((r) => setTimeout(r, opts.delayMs));
        }
      }
    }
  }
  throw lastErr;
}

/**
 * 以固定並行上限對陣列逐項套用 async 函式，回傳與輸入同序的結果陣列。
 *
 * 採 shared-cursor work-stealing：啟動 `min(limit, items.length)` 個 worker，
 * 每個 worker 不斷搶下一個尚未處理的索引來做，因此快的項目不會被慢的項目卡住，
 * 整體吞吐優於「固定切塊」的做法。結果依原始索引寫回，順序與輸入一致。
 *
 * 任一項目拋錯會讓整個 Promise reject（如需逐項容錯，請在 fn 內自行 try/catch）。
 *
 * @param items 輸入項目。
 * @param limit 最大並行數。
 * @param fn    對每個項目執行的工作，收到 (item, index)。
 */
export async function mapWithConcurrency<I, O>(
  items: I[],
  limit: number,
  fn: (item: I, index: number) => Promise<O>
): Promise<O[]> {
  const results: O[] = new Array(items.length);
  let cursor = 0;

  async function worker(): Promise<void> {
    while (cursor < items.length) {
      const idx = cursor++;
      results[idx] = await fn(items[idx], idx);
    }
  }

  const workerCount = Math.max(0, Math.min(limit, items.length));
  await Promise.all(Array.from({ length: workerCount }, worker));
  return results;
}
