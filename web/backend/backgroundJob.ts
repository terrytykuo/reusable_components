/**
 * 單一進程內的「背景任務 + 輪詢狀態」可復用 helper，框架無關。
 *
 * 適用情境：一個耗時工作（資料前處理、AI 產生、批次匯出）需要在 HTTP 請求
 * 回應後繼續於背景跑，前端再透過另一支 endpoint 輪詢進度。本 helper 提供：
 *   - fire-and-forget 啟動（start 立即回傳，工作在背景進行）
 *   - single-job guard（同時只允許一個工作執行，重複啟動回傳衝突）
 *   - progress callback（phase / done / total / message）
 *   - status 查詢（回傳純狀態物件）
 *
 * 不綁任何框架（沒有 Express、沒有 Cloudflare 型別）。Express / Pages Function
 * 只需把回傳的 status 物件 JSON 化、把 start 結果對應成 HTTP 狀態碼即可。
 *
 * 來源：interactive-book-tutor/server.ts 的 /api/pregen/start + /api/pregen/status
 *       模式，抽成泛用 runner。
 */

export interface JobProgress {
  /** 自訂的階段標記（如 'extract' | 'generate' | 'save'）。 */
  phase: string;
  /** 已完成數量。 */
  done: number;
  /** 總數量（未知時可為 0）。 */
  total: number;
  /** 人類可讀的進度訊息。 */
  message: string;
}

export type JobStatus = 'idle' | 'running' | 'done' | 'error';

export interface JobState<Meta = Record<string, unknown>> extends JobProgress {
  status: JobStatus;
  /** 啟動時帶入的中繼資料（如 chapter、bookId 等）。 */
  meta: Meta;
  /** 失敗時的錯誤訊息。 */
  error?: string;
  startedAt: string;
  finishedAt?: string;
}

export interface StartResult<Meta> {
  /** true 表示已啟動；false 表示已有工作在跑（衝突）。 */
  started: boolean;
  job: JobState<Meta> | null;
}

/** 背景工作的執行函式：透過 onProgress 回報進度，回傳值忽略。 */
export type JobRunner<Meta> = (args: {
  meta: Meta;
  onProgress: (progress: Partial<JobProgress>) => void;
}) => Promise<unknown>;

export interface BackgroundJobOptions {
  /** 啟動時的初始 phase，預設 'starting'。 */
  initialPhase?: string;
  /** 啟動時的初始訊息，預設 '準備中…'。 */
  initialMessage?: string;
}

/**
 * 建立一個 single-job runner。回傳 `start` 與 `getStatus`。
 *
 * 範例（Express）：
 *   const job = createBackgroundJob<{ chapter: number }>();
 *   app.post('/api/pregen/start', (req, res) => {
 *     const r = job.start({ chapter: Number(req.body.chapter) }, async ({ meta, onProgress }) => {
 *       await generateChapter(meta.chapter, onProgress);
 *     });
 *     res.status(r.started ? 202 : 409).json(r);
 *   });
 *   app.get('/api/pregen/status', (_req, res) => res.json({ job: job.getStatus() }));
 */
export function createBackgroundJob<Meta = Record<string, unknown>>(
  options: BackgroundJobOptions = {},
) {
  let current: JobState<Meta> | null = null;

  function start(meta: Meta, runner: JobRunner<Meta>): StartResult<Meta> {
    // single-job guard：已有工作在跑就拒絕。
    if (current && current.status === 'running') {
      return { started: false, job: current };
    }

    current = {
      status: 'running',
      phase: options.initialPhase ?? 'starting',
      done: 0,
      total: 0,
      message: options.initialMessage ?? '準備中…',
      meta,
      startedAt: new Date().toISOString(),
    };
    const job = current;

    // Fire-and-forget；進度透過 closure 寫回 job 物件。
    runner({
      meta,
      onProgress: (progress) => {
        if (current !== job) return; // 已被新工作取代
        Object.assign(job, progress);
      },
    })
      .then(() => {
        if (current !== job) return;
        job.status = 'done';
        job.finishedAt = new Date().toISOString();
      })
      .catch((err: unknown) => {
        if (current !== job) return;
        job.status = 'error';
        job.error = err instanceof Error ? err.message : String(err);
        job.message = job.message || '失敗';
        job.finishedAt = new Date().toISOString();
      });

    return { started: true, job };
  }

  /** 回傳目前工作的狀態快照（無工作時為 null）。 */
  function getStatus(): JobState<Meta> | null {
    return current;
  }

  /** 清除已結束的工作狀態（done / error 才會清，running 不動）。 */
  function reset(): void {
    if (current && current.status !== 'running') current = null;
  }

  return { start, getStatus, reset };
}

export default createBackgroundJob;
