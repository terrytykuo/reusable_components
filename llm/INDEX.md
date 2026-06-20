# LLM Components Index

跨專案可復用的 LLM 工具，每個檔案 self-contained。

---

### `jsonRepair.ts`

**分類**: LLM 輸出解析

**依賴**: 無（純字串處理，可在 Node / 瀏覽器 / Deno 使用）

**介面**:
```ts
// 從雜訊文字提取第一個平衡的 JSON 物件/陣列並 parse；找不到時拋錯
function extractJson<T = unknown>(raw: string): T

// 同上的 non-throwing 版本，失敗回傳 null
function tryExtractJson<T = unknown>(raw: string): T | null

// 修復字串值內常見缺陷，回傳可被 JSON.parse 的字串
function repairJsonStrings(raw: string): string
```

**功能說明**:
LLM 很少乖乖只吐純 JSON。它常把結果包在 ` ```json ` 圍欄裡、前後加幾句散文、
或（用 CLI 時）在前面夾雜警告訊息；更麻煩的是在 *字串值內部* 產生兩類 JSON 不
合法的缺陷：(1) 直接塞入原始換行 / tab 等控制字元（markdown 內容很常見），
(2) 從程式碼、正則、LaTeX、mermaid 內容吐出非法反斜線跳脫如 `\(`、`\d`、`\.`、
`\$`、`\[`（JSON 只允許 `\" \\ \/ \b \f \n \r \t \uXXXX`）。

`extractJson` 先以括號平衡掃描從第一個 `{` 或 `[` 定位出 JSON 範圍 —— 這個掃描
會正確忽略「字串值內」出現的 ` ``` ` 圍欄或括號（它們在引號內，不影響配對），
所以即使 JSON 內含整段 mermaid 圖或程式碼也不會誤判邊界。先嘗試直接
`JSON.parse`；失敗時用 `repairJsonStrings` 修一次再 parse。`repairJsonStrings`
逐字元掃描、只在字串內動手：把非法跳脫的反斜線加倍、把原始控制字元轉成合法跳脫。

**使用情境**: 解析任何 LLM（API 或本機 CLI）回傳的結構化 JSON 回應；搭配
`cliModel.ts` 解析 CLI 的 JSON envelope 與其中的模型回應。

**來源**: `interactive-book-tutor/lib/gemini.ts`（`extractJsonValue()` 與
`repairJsonStrings()`）；`wiser/scripts/generateStudy.ts`（`extractJsonObject()`，
較陽春的 regex 版本，本檔採用 book-tutor 的平衡掃描 + 修復版本）

---

### `cliModel.ts`

**分類**: LLM 呼叫

**依賴**: Node `child_process`、`os`

**介面**:
```ts
interface SpawnCliModelOptions {
  args?: string[]          // 接在 `-p <instruction>` 之前的額外 CLI 參數
  timeoutMs?: number       // 硬性逾時，預設 240000
  cwd?: string             // 工作目錄，預設 os.tmpdir()
  env?: Record<string, string>
  failOnNonZeroExit?: boolean  // 預設 true
}

// spawn 一個接受 `-p <prompt>` 的本機 CLI 模型，把 context 從 stdin 餵入，
// 回傳 CLI 的原始 stdout（已 trim）
function spawnCliModel(
  command: string,
  instruction: string,
  context?: string,
  opts?: SpawnCliModelOptions
): Promise<string>
```

**功能說明**:
許多本機 AI CLI（gemini、claude、codex…）都有「headless / print」模式：用
`-p <prompt>` 傳簡短指令、把大型 context 從 stdin 餵入、結果印到 stdout。這個
wrapper 把該模式抽象成單一函式 —— 最大的好處是 **不必管理 API key**，直接複用
使用者本機 CLI 已有的登入授權。

預設在系統暫存目錄（`os.tmpdir()`）執行子程序，讓 CLI 不會去載入當前專案的設定
檔（`GEMINI.md` / `CLAUDE.md` / hooks），藉此降低 token 開銷與延遲。逾時會
`SIGKILL` 並 reject，啟動失敗（CLI 不在 PATH）也會給出清楚錯誤。

模型名稱與所有參數都注入、不寫死任何特定 CLI：gemini 傳
`{ args: ["--output-format","json","-m","gemini-2.5-flash"] }`、claude 傳
`{ args: ["--output-format","json","--model", model] }` 即可。本函式刻意 **不**
解析 CLI 的 JSON envelope（gemini 用 `response`、claude 用 `result`，形狀各異），
而是回傳原始 stdout，請在呼叫端搭配 `jsonRepair.extractJson` 取出需要的欄位。

**使用情境**: 想呼叫 LLM 但不想設定 / 散佈 API key 的本機工具或腳本；批次內容
產生（搭配 `concurrency.ts`）。

**來源**: `interactive-book-tutor/lib/gemini.ts`（`geminiGenerate()`）與
`interactive-book-tutor/lib/claude.ts`（`claudeGenerate()`）—— 兩者幾乎相同，
本檔抽出共通骨架並把模型 / 參數參數化。`wiser/scripts/generateStudy.ts`
（`runProcess()` / `callGemini()`）為相同模式的另一實例。

---

### `concurrency.ts`

**分類**: 批次 async 控制

**依賴**: 無（純 async）

**介面**:
```ts
interface RetryOptions {
  delayMs?: number  // 每次重試間延遲，預設 0
  onRetry?: (error: unknown, nextAttempt: number) => void
}

// 重試一個回傳 Promise 的工作，最多 tries 次，全失敗才拋最後一個錯誤
function withRetry<T>(
  fn: () => Promise<T>,
  tries?: number,        // 預設 3
  opts?: RetryOptions
): Promise<T>

// 以固定並行上限對陣列逐項套用 async 函式，回傳同序的結果
function mapWithConcurrency<I, O>(
  items: I[],
  limit: number,
  fn: (item: I, index: number) => Promise<O>
): Promise<O[]>
```

**功能說明**:
呼叫 LLM 這類「不穩定 + 昂貴」的 async 工作有兩個固定需求，這個檔案各給一個函式。

`withRetry` 解決「模型偶爾吐壞 JSON、CLI 偶爾逾時」—— 把容易失敗的工作包起來自動
重試，全部失敗才拋出最後一個錯誤；可選 `delayMs` 退避與 `onRetry` log 回呼。

`mapWithConcurrency` 解決「一次 spawn 幾十個子程序會爆、或撞到供應商 rate
limit」—— 限制同時進行的數量。它採 shared-cursor work-stealing：啟動
`min(limit, items.length)` 個 worker，每個 worker 不斷搶下一個未處理索引來做，
快的項目不會被慢的卡住，吞吐優於固定切塊；結果依原始索引寫回、順序與輸入一致。
任一項目拋錯會讓整個 Promise reject（需逐項容錯請在 `fn` 內自行 try/catch）。

兩者與 LLM 無強綁定，適用任何批次 async 工作（爬蟲、檔案處理、API 批次呼叫…）。

**使用情境**: 批次呼叫 LLM 產生大量內容並控制並行（教材 / 題庫 / 詞彙批次生成）；
任何需要「重試 + 限流」的 async pipeline。

**來源**: `interactive-book-tutor/lib/generateBook.ts`（`withRetry()` 與
`mapWithConcurrency()`，原用於並行產生各單元的課程與測驗）
