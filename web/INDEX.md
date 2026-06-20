# Web Components Index

---

## adminUI/hooks/

### `adminUI/hooks/useSave.ts`

**分類**: 狀態管理
**依賴**: `react`

**介面**:
```ts
function useSave(
  saveFn: (field: string, value: unknown) => Promise<void>,
  debounceMs?: number  // 預設 800
): {
  save: (field: string, value: unknown) => void
  status: (field: string) => SaveStatus  // 'idle' | 'saving' | 'saved' | 'error'
}
```

**功能說明**:
帶 debounce 的 per-field auto-save hook，是整個 adminUI 的核心。每個欄位獨立維護自己的計時器與儲存狀態，互不干擾。

呼叫 `save(field, value)` 後啟動計時器，`debounceMs` 毫秒內若再次呼叫同一 field 則重置（防止每個 keystroke 都觸發 API）。計時器到期後執行 `saveFn`，並更新該 field 的 status：`saving → saved`（2 秒後回到 `idle`）或 `error`。

`saveFn` 完全由外部定義，可對接任何後端（REST API、Firebase、GraphQL）。

**典型用法**（搭配 REST PATCH）:
```ts
const { save, status } = useSave(async (field, value) => {
  await fetch(`/api/items/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ [field]: value }),
  })
})
```

**來源**: `cat_toxin_app/admin/src/ToxinEditor.tsx` → `useSave`

---

## adminUI/components/

### `adminUI/components/SaveIndicator.tsx`

**分類**: 回饋
**依賴**: `react`、`useSave`（型別）

**匯出**:
- `SaveIndicator({ status })` — 狀態文字（idle 時不渲染）
- `FieldLabel({ label, status })` — 欄位標籤 + SaveIndicator 組合

**功能說明**:
`SaveIndicator` 在 `idle` 時 return null（不佔空間）；`saving` 顯示灰色「Saving…」、`saved` 顯示綠色「✓ Saved」、`error` 顯示紅色「✗ Error」。`FieldLabel` 將標籤文字與 SaveIndicator 並排，是所有 field 元件的標題列。

**來源**: `cat_toxin_app/admin/src/ToxinEditor.tsx` → `Dot`, `FieldLabel`

---

### `adminUI/components/TextField.tsx`

**分類**: 表單輸入
**依賴**: `react`、`SaveIndicator`

**Props**:
| Prop | 型別 | 必填 | 說明 |
|------|------|------|------|
| `label` | `string` | 是 | 欄位標籤 |
| `field` | `string` | 是 | 欄位名稱（傳給 onSave 的 key） |
| `value` | `string` | 是 | 受控值 |
| `onSave` | `(field, value) => void` | 是 | 通常傳入 useSave 的 save |
| `multiline` | `boolean` | 否 | true 時渲染 textarea，預設 false |
| `rows` | `number` | 否 | textarea 行數，預設 4 |
| `saveStatus` | `SaveStatus` | 否 | 傳入顯示儲存狀態 |

**功能說明**:
維護 local state 避免受控輸入卡頓，同時透過 `useEffect` 與外部 value 保持同步。每次 onChange 即呼叫 `onSave`，搭配 `useSave` 的 debounce 達到「打完字自動存」效果。

**來源**: `cat_toxin_app/admin/src/ToxinEditor.tsx` → `TextField`

---

### `adminUI/components/SelectField.tsx`

**分類**: 表單輸入
**依賴**: `react`、`SaveIndicator`

**Props**:
| Prop | 型別 | 必填 | 說明 |
|------|------|------|------|
| `label` | `string` | 是 | 欄位標籤 |
| `field` | `string` | 是 | 欄位名稱 |
| `value` | `T` | 是 | 目前選中值 |
| `options` | `T[]` | 是 | 選項列表 |
| `onSave` | `(field, value: T) => void` | 是 | onChange 即觸發 |
| `saveStatus` | `SaveStatus` | 否 | 儲存狀態 |

**功能說明**:
泛型 `T extends string` 下拉選單，onChange 立即觸發 onSave（無需 debounce，因為下拉選擇是離散操作）。

**來源**: `cat_toxin_app/admin/src/ToxinEditor.tsx` → `SelectField`

---

### `adminUI/components/TagListField.tsx`

**分類**: 表單輸入
**依賴**: `react`、`SaveIndicator`

**Props**:
| Prop | 型別 | 必填 | 說明 |
|------|------|------|------|
| `label` | `string` | 是 | 欄位標籤 |
| `field` | `string` | 是 | 欄位名稱 |
| `value` | `string[]` | 是 | 目前 tag 陣列 |
| `onSave` | `(field, value: string[]) => void` | 是 | 每次新增/刪除即觸發 |
| `placeholder` | `string` | 否 | 輸入框提示，預設 'Add item…' |
| `saveStatus` | `SaveStatus` | 否 | 儲存狀態 |

**功能說明**:
顯示現有 tag（灰色 pill，× 可移除），下方輸入框支援 Enter 鍵或點擊 Add 新增。重複值自動忽略。每次新增或移除即呼叫 onSave，搭配 useSave 的 debounce 或直接不 debounce（通常陣列操作不需要）。

**使用情境**: 別名、標籤、關鍵字、分類等字串陣列欄位
**來源**: `cat_toxin_app/admin/src/ToxinEditor.tsx` → `TagListField`

---

### `adminUI/components/ImagesField.tsx`

**分類**: 媒體管理
**依賴**: `react`

**Props**:
| Prop | 型別 | 必填 | 說明 |
|------|------|------|------|
| `images` | `string[]` | 是 | 目前圖片 URL 陣列 |
| `onUpload` | `(file: File) => Promise<string>` | 是 | 上傳邏輯，回傳新圖片 URL |
| `onDelete` | `(index: number) => Promise<string[]>` | 是 | 刪除邏輯，回傳更新後的 URL 陣列 |
| `onChange` | `(urls: string[]) => void` | 是 | 更新外部狀態 |
| `coverLabel` | `string` | 否 | 第一張封面標籤，預設 '封面' |

**功能說明**:
顯示現有圖片縮圖（hover 顯示刪除按鈕），最後一格為虛線 + 按鈕。上傳與刪除的 API 邏輯完全由外部定義，元件只負責 UI 與狀態。

搭配 Firebase Storage 範例：
```ts
onUpload={async (file) => {
  const ref = storageRef(storage, `items/${id}/${file.name}`)
  await uploadBytes(ref, file)
  return getDownloadURL(ref)
}}
```

**使用情境**: 任何需要管理多圖的 admin 表單
**來源**: `cat_toxin_app/admin/src/ToxinEditor.tsx` → `ImagesField`

---

### `adminUI/components/Section.tsx`

**分類**: 佈局
**依賴**: `react`

**Props**:
| Prop | 型別 | 必填 | 說明 |
|------|------|------|------|
| `title` | `string` | 是 | 區塊標題（自動轉大寫小字） |
| `children` | `ReactNode` | 是 | 區塊內容 |

**功能說明**:
上方細分隔線（`border-t`）+ 全大寫灰色小字標題 + 垂直間距內容區。用於將長表單分成語意清晰的群組（Basic Info、Description、Media 等）。

**來源**: `cat_toxin_app/admin/src/ToxinEditor.tsx` → `Section`

---

### `adminUI/components/MasterDetailLayout.tsx`

**分類**: 佈局
**依賴**: `react`

**Props**:
| Prop | 型別 | 必填 | 說明 |
|------|------|------|------|
| `sidebarHeader` | `ReactNode` | 是 | sidebar 頂部（搜尋、篩選器） |
| `sidebarList` | `ReactNode` | 是 | sidebar 清單（可捲動） |
| `sidebarFooter` | `ReactNode` | 否 | sidebar 底部（統計、版本號） |
| `main` | `ReactNode` | 是 | 右側主內容（編輯器、詳情） |
| `emptyText` | `string` | 否 | 未選取時的提示，預設 '← Select an item to edit' |
| `sidebarWidth` | `string` | 否 | Tailwind 寬度 class，預設 `'w-64'` |

**功能說明**:
全螢幕兩欄 admin 佈局：左側固定寬 sidebar（頂部 header + 中間可捲動清單 + 底部 footer），右側 flex-1 可捲動主面板。sidebar 與主面板以 `border-r` 分隔。`main` 為 null 時顯示 `emptyText` 佔位提示。

**使用情境**: 任何有「清單選取 → 右側編輯」互動的資料管理後台
**來源**: `cat_toxin_app/admin/src/App.tsx`

---

## components/

### `components/MarkdownContent.tsx`

**分類**: 內容渲染
**依賴**: `react`、`react-markdown`、`remark-gfm`、`remark-math`、`rehype-katex`、`rehype-highlight`、`rehype-raw`、`mermaid`、`katex`（需另引入 `katex/dist/katex.min.css` 與 highlight.js 主題 CSS）；內部使用 `utils/sanitizeMermaid`

**Props/介面**:
```ts
function MarkdownContent({ children }: { children: string }): JSX.Element
// 另 re-export：sanitizeMermaid(code: string): string
```

**功能說明**:
全功能 Markdown 渲染元件，把一段 Markdown 字串渲染成完整內容。支援 GFM（表格、刪除線、任務清單）、KaTeX 數學式、highlight.js 程式碼高亮、原始 HTML（rehype-raw），以及 Mermaid 圖。

Mermaid 採「智慧 fallback」：先用 `mermaid.parse()` 驗證（不碰 DOM，避免無效圖把 mermaid 的「Syntax error」孤兒 SVG 注入頁面）。解析失敗時，用 `sanitizeMermaid()` 把 `[..]`／`{..}` 標籤內的半形括號轉成全形後重試——專門修復 AI 產生的 `[節點(描述)]`（mermaid 會把標籤裡的 `(` 當形狀分隔符而整張解析失敗）。仍失敗才退回顯示原始程式碼。

mermaid 於模組層級初始化一次（neutral 主題）；如需自訂主題/字型，於 import 本檔前先呼叫 `mermaid.initialize`。`sanitizeMermaid()` 已拆成獨立工具（見 `utils/sanitizeMermaid.ts`），可單獨用於送進任何 mermaid 渲染器前的修復。

**使用情境**: AI 聊天/教學 app 的訊息氣泡、文件檢視器、任何需要渲染含圖表與數學式之 Markdown 的場景
**來源**: `interactive-book-tutor/src/components/MarkdownContent.tsx`

---

## utils/

### `utils/sanitizeMermaid.ts`

**分類**: 工具函式
**依賴**: 無（純字串處理）

**介面**:
```ts
function sanitizeMermaid(code: string): string
```

**功能說明**:
把 Mermaid 程式碼中 `[..]` 與 `{..}` 節點標籤內的半形括號 `(` `)` 轉成全形 `（` `）`。AI 產生的圖常在標籤裡塞半形括號（如 `D[資料庫主節點 (讀寫)]`），mermaid 會把 `(` 當成形狀分隔符導致整張圖解析失敗；轉全形後標籤閱讀依舊自然，解析器也不再報錯。

設計為「僅在原始碼已解析失敗後」作為 fallback retry 使用，因此可積極轉換，永遠不會破壞一張原本就能正常渲染的圖。

**使用情境**: 搭配 `MarkdownContent` 或任何 mermaid 渲染流程，作為解析失敗時的修復步驟
**來源**: `interactive-book-tutor/src/components/MarkdownContent.tsx` → `sanitizeMermaid`

---

### `utils/tokenization.ts`

**分類**: 工具函式
**依賴**: 無（使用 Unicode property escapes，需 ES2018+ regex 支援）

**介面**:
```ts
type TextToken = { text: string; isWord: boolean }
function tokenizeText(text: string): TextToken[]   // 詞/非詞交錯，可無損還原
function normalizeWord(word: string): string        // 去連字號與前後空白
function getWordKey(word: string): string            // 正規化 + 小寫，可當字典 key
function countWords(text: string): number            // 有效詞數統計
```

**功能說明**:
Unicode 感知的文字分詞，零業務綁定。以 `\p{P}`（標點）、`\p{S}`（符號）作為斷詞點，但連字號（`-`、`‐`–`―`）例外，視為詞的一部分（"well-known" 算一個詞）。`tokenizeText` 保留所有原始字元（含空白與標點），故 token 串接可無損還原原文，方便用於可點擊的逐詞渲染。

**使用情境**: 語言學習 app 的閱讀器逐詞高亮/查詞、字數統計、建立詞彙索引
**來源**: `wiser/src/tokenization.ts`

---

## backend/

### `backend/kvStore.ts`

**分類**: 後端 helper（Cloudflare Workers/Pages KV）
**依賴**: 無（型別相容 Cloudflare KV namespace）

**介面**:
```ts
interface JsonKVNamespace { /* get<T>(key,'json'); put(key,value,opts?); delete?(key) */ }
interface KvStore {
  readJson<T>(key: string, fallback: T): Promise<T>   // 不存在回 fallback，永不回 null
  writeJson(key: string, value: unknown, options?: { expirationTtl?: number }): Promise<void>
  remove(key: string): Promise<void>
  raw: JsonKVNamespace
}
function createKvStore(binding: JsonKVNamespace): KvStore
function createKvStore(env: Record<string, unknown>, bindingName: string): KvStore
```

**功能說明**:
Cloudflare KV 的型別化 JSON 讀寫包裝。KV 原生 API 是字串導向；本工具把 get/put 包成 JSON 化、帶 fallback、且具名綁定檢查的 helper。可直接傳入 namespace，或傳 `env` 物件 + 綁定名稱（找不到綁定時拋出清楚的錯誤訊息，提示先建立並綁定 KV namespace）。

**使用情境**: 任何用 Cloudflare KV 當輕量資料儲存的 Pages Function / Worker，存取 JSON 集合（清單、設定、快取）
**來源**: `wiser/functions/api/[[path]].ts` → `getKV` / `readJson` / `writeJson`

---

### `backend/httpResponse.ts`

**分類**: 後端 helper（Cloudflare Functions Response）
**依賴**: 無（使用標準 `Response` / `Headers`）

**介面**:
```ts
function json(data: unknown, init?: ResponseInit): Response       // Content-Type + no-store
function error(message: string, status?: number): Response         // 預設 400
function preflight(): Response                                      // OPTIONS 回應
function corsHeaders(options?: CorsOptions): Record<string, string>
function createResponders(opts?: { cors?: boolean | CorsOptions; cacheControl?: string | null }):
  { json; error; preflight }
```

**功能說明**:
Cloudflare Function 的統一 JSON 回應 + CORS helper。`json()` 自動設定 `Content-Type: application/json; charset=utf-8` 與 `Cache-Control: no-store`；`error()` 包成 `{ error }` body 並帶狀態碼。`createResponders()` 可建立一組共用 CORS / Cache-Control 設定的回應函式，`preflight()` 處理 OPTIONS preflight，`corsHeaders()` 單獨產生 CORS header 物件。預設導出的 `json`/`error` 行為等同原始 wiser helper（無 CORS）。

**使用情境**: 所有 Cloudflare Pages/Workers Function 的 API handler，統一回應格式與跨域設定
**來源**: `wiser/functions/api/[[path]].ts` → `json` / `error`

---

### `backend/backgroundJob.ts`

**分類**: 後端 helper（背景任務，框架無關）
**依賴**: 無

**介面**:
```ts
interface JobProgress { phase: string; done: number; total: number; message: string }
type JobStatus = 'idle' | 'running' | 'done' | 'error'
interface JobState<Meta> extends JobProgress {
  status: JobStatus; meta: Meta; error?: string; startedAt: string; finishedAt?: string
}
function createBackgroundJob<Meta>(options?: { initialPhase?; initialMessage? }): {
  start(meta: Meta, runner: (a: { meta: Meta; onProgress: (p: Partial<JobProgress>) => void }) => Promise<unknown>):
    { started: boolean; job: JobState<Meta> | null }
  getStatus(): JobState<Meta> | null
  reset(): void
}
```

**功能說明**:
「單一進程內背景任務 + 輪詢狀態」的可復用 runner。`start()` 為 fire-and-forget：立即回傳，工作於背景進行，進度透過 `onProgress(phase/done/total/message)` 寫回狀態物件。內建 single-job guard——同時只允許一個工作執行，重複啟動時 `started: false` 並回傳目前工作（呼叫端可對應成 HTTP 409）。`getStatus()` 回傳純狀態物件供輪詢 endpoint JSON 化；`reset()` 可清除已結束（done/error）的工作。

完全不綁框架（無 Express、無 Cloudflare 型別），Express handler 只需把 `start` 結果對應成 202/409、把 `getStatus()` JSON 化即可。

**使用情境**: 耗時工作（AI 內容產生、資料前處理、批次匯出）需在回應後於背景持續執行、前端輪詢進度
**來源**: `interactive-book-tutor/server.ts` → `/api/pregen/start` + `/api/pregen/status`
