# Revision Requests（手機一句話 → 雲端 Claude 改稿）

admin 在手機後台（[admin-pwa](../admin-pwa/)）看到 CI 產出的項目、不滿意，在正文底下寫一句「修改意見」送出；GitHub Actions 把它交給一個 claude.ai 雲端 session，session 照 repo 裡的 skill 改好、push、觸發重發；PWA 上的條目變成「已完成」並附 Claude 的回覆與 commit 連結，手機收到推播「已改好」（或「修改失敗」＋原因）。全程 admin 不用開任何其他東西。

| 層 | 路徑 | 技術 | 內容 |
|---|---|---|---|
| PWA 元件 | [`pwa/src/revisions/`](./pwa/src/revisions/) | React 19 + TS + Tailwind 4（admin-pwa 的 theme token）+ Firestore | `RevisionBox`（輸入框 + 紀錄清單 + 狀態徽章）、`revisions.ts`（建條目 / arrayUnion / 排序 / commit 連結）、`revisionTypes.ts`、`revisionStrings.ts`（走 `brand.strings`）、`revisionStyles.ts`，vitest |
| CI | [`ci/`](./ci/) | Node CommonJS + firebase-admin，建在 admin-pwa 的 `server/ci/admin-firestore.js` 上 | `revisions.js`（`updateRevision`、`planDispatch`、`planExpire`、`appendLog`、`markRevisionDone`…）、`pull-revisions.js` CLI（`--expire` / `--dispatch` / `--done <id>` / `--dry-run`，host 專屬設定集中在頂端 `CONFIG`），node:test |
| 排程 | [`workflow/revisions.yml.example`](./workflow/revisions.yml.example) | GitHub Actions | cron 每 15 分鐘：expire → dispatch → commit dispatch log（這個 push 叫醒 routine） |
| 雲端 session | [`routine/`](./routine/) | claude.ai routine | `PROMPT.md`（prompt 模板）、`README.md`（建 routine、webhook trigger、2026-10-23 實測） |
| 設計 | [`DESIGN.md`](./DESIGN.md) | — | 為何這樣分工、資料模型、session 要做的事、環境檢查、風險 |

**來源**：hejdanmark 的 HDAdmin 修改意見（2026-10-23 上線）— `hdadmin/src/xhs/{RevisionBox.tsx,revisions.ts,types.ts,labels.ts}` 與兩個測試、`hdadmin/src/pages/KitDetail.tsx`（掛載點）、`scripts/social/pull-xhs-revisions.js` + test、`scripts/social/lib/admin-firestore.js`（`updateRevision`、`PROTECTED`）+ test、`scripts/social/publish-xhs-kit.js`（`editionRevision`、`revisionCommit`、`markRevisionDone`）+ test、`.github/workflows/xhs-revisions.yml`、`.claude/skills/swapping-a-story/SKILL.md`「由 HDAdmin revision 觸發時」、routine `hejdanmark-xhs-revision` 的 prompt；設計 `docs/plans/2026-10-23-hdadmin-revision-comment-design.md`，合約 `docs/XIAOHONGSHU.md` §Revision requests from HDAdmin。2026-10-23 抽取並去品牌化；hejdanmark 本身未改。

---

## 架構

```
PWA（admin-pwa host）
  └─ RevisionBox → updateDoc(<collection>/{id}, { revisions: arrayUnion({id, text, status:'open', createdAt, by}) })
GitHub Actions  revisions.yml（cron */15，白天時段；也可手動）
  ├─ pull-revisions.js --expire    queued 且（outcome 檔 revisionFailed: true 或 > 90 分）→ failed + 推播「修改失敗」
  ├─ pull-revisions.js --dispatch  open：不合格 → failed + 推播；已發 → notePosted() + noted；
  │                                否則（該項目沒有 queued）最舊一條 → queued + repository_dispatch + 寫 dispatch log
  └─ git commit <dispatch log> && git push      ← 這個 push 叫醒 routine
claude.ai routine（webhook trigger：GitHub push，約 1 秒開 session）
  └─ reset 到分支 → 讀 log 找 pending → 照 skill 改 → 測試
     → outcome 檔寫 revisionId / revisionReply（做不到：+ revisionFailed: true，不重發）
     → commit "Revision <id>: …" → push → gh workflow run <重發> --ref <branch>
重發 workflow（host 既有）
  ├─ publishDoc（preserve 含 revisions）
  └─ pull-revisions.js --done <id>  → done + reply + commit，推播「已改好」
```

- Firestore 只由 PWA（append `open`）與 Actions（之後所有狀態）寫；雲端 session **沒有任何 secret**，只寫 repo。
- 一個項目同時最多一條 `queued`；其餘 `open` 等下一輪。
- 每個狀態改變都是一個 transaction（讀 → map 陣列 → set merge），以呼叫端看到的狀態守門，所以 `done` 不會被晚到的 `--expire` 改回 `failed`。

---

## 套用步驟（checklist）

前提：host 已照 [admin-pwa](../admin-pwa/README.md) 建好（登入、rules、推播、CI 的 `admin-firestore.js`、服務帳號 secret）。

### 1. Firestore 欄位合約

項目文件（例如 `admin/content/items/{id}`）多一個陣列欄位 `revisions`，形狀見 [狀態表](#狀態表) 與 `pwa/src/revisions/revisionTypes.ts`。rules 不用改：admin claim 已能寫整個 `admin/**`。

### 2. CI 重發不能蓋掉意見

所有寫這個集合的 CI（`publishDoc`）都要把 `revisions` 列進 `preserve`：

```js
await publishDoc('admin/content/items', id, doc, { preserve: [...DEFAULT_PRESERVE, 'revisions'] });
```

### 3. PWA：複製元件並掛上

```bash
cp -R modules/revision-requests/pwa/src/revisions <host-pwa>/src/
```

依賴 admin-pwa 模板的 `src/firebase.ts`（`db`）、`src/brand.ts`、`src/data/firestoreHooks.ts`（`formatTimestamp`）、`src/kit/PageStatus.tsx`（`ErrorNotice`）與 `theme.css` 的 token，路徑都是相對 `src/`。

項目型別加 `revisions`，在詳情頁**正文底下、成效 / 其他區塊上面**掛上：

```tsx
import { RevisionBox } from './revisions/RevisionBox'
import type { WithRevisions } from './revisions/revisionTypes'

interface Item extends WithRevisions { /* … */ }

// ItemDetail，useDoc 拿到 item 之後
{item.caption && <Caption text={item.caption} />}
<RevisionBox
  key={item.id}
  collectionPath={ITEMS_PATH}
  docId={item.id}
  revisions={item.revisions}
  email={email}
  posted={isPosted(item.status)}
  commitBaseUrl="https://github.com/<owner>/<repo>"
/>
{/* MetricsForm 等 */}
```

字串：預設繁中（`revisionStrings.ts`）。要改就在 `brand.ts` 的 `strings` 覆寫，先把型別放寬：

```ts
import type { RevisionStrings } from './revisions/revisionStrings'   // type-only，vite.config 照樣能載
export interface BrandConfig { /* … */ strings: Partial<UiStrings & RevisionStrings> }
// brand.strings: { revisionSent: '已送出，最多 30 分鐘內開始處理', revisionStatusNoted: '已收進口味紀錄' }
```

或單一實例傳 `strings` prop。`revisionSent` 的「15 分鐘」要跟你的 cron 間隔一致。徽章顏色在 `revisionStyles.ts`。

### 4. CI 腳本與 secrets

```bash
cp modules/revision-requests/ci/{revisions.js,pull-revisions.js} <repo>/scripts/revisions/
cp modules/admin-pwa/server/ci/admin-firestore.js               <repo>/scripts/revisions/   # 放同資料夾；pull-revisions.js 先找 ./admin-firestore
# 該資料夾的 package.json 加 "firebase-admin": "^13.0.0"
```

改 `pull-revisions.js` 頂端的 `CONFIG`：

| 鍵 | 意思 | 第一個 host 的值 |
|---|---|---|
| `collectionPath` | 項目集合 | `admin/kits/xhs` |
| `devicesPath` | 推播裝置（= `brand.devicesPath`） | `admin/pushTokens/devices` |
| `envVars` | 服務帳號 env（JSON 或路徑） | `HD_FIREBASE_SERVICE_ACCOUNT` |
| `repo` / `eventType` | repository_dispatch 目標 | `<owner>/<repo>` / `xhs-revision` |
| `repoRoot` / `logFile` / `logMax` | dispatch log 位置 | checkout 根 / `editorial/xhs-revisions.json` / 200 |
| `outcomePath(id)` | session 寫結果的檔（相對 repoRoot） | `hejdanmark-site/data/<id>.json` |
| `isEligible(id)` | 哪些項目接自動改稿 | 只有每日項目（`YYYY-MM-DD`） |
| `isPosted(data)` | 已發的只記錄 | `data.status === 'posted'` |
| `notePosted(item, rev, {env, fetchImpl})` | 已發項目的旁路（丟出例外 → 留 `open` 下輪重試） | POST 到 admin-api `/comments` 當 `pool:<DATE>:hdadmin` 留言，餵 taste distiller |
| `expireMs` | queued 逾時 | 90 分鐘 |
| `adminUrl` / `linkFor(id, cfg)` | 推播連結 | `https://<site>.web.app/kits/<id>` |
| `replies` / `push` | 回覆與推播字樣 | 逾時、回報做不到、不合格、派送失敗、已照意見改好 / 修改失敗、已改好 |

secrets：服務帳號（admin-pwa 已有）、`GITHUB_TOKEN`（Actions 內建）、選配 `GH_DISPATCH_TOKEN`（PAT）、`notePosted` 需要的 token。

### 5. Workflow

`workflow/revisions.yml.example` → `.github/workflows/revisions.yml`，填 `<PLACEHOLDER>`。重發 workflow 的 publish 步驟之後加 `node <dir>/pull-revisions.js --done <id>`（或在自己的 publish 腳本呼叫 `markRevisionDone` + `sendPush`）。

### 6. Routine 與 webhook

照 [`routine/README.md`](./routine/README.md)：先在 claude.ai environment 跑 [DESIGN.md](./DESIGN.md) §7 的檢查，用 [`routine/PROMPT.md`](./routine/PROMPT.md) 建 routine（無連接器），接 `events: ["push"]` 的 webhook trigger，加一天一次的備援 cron。

### 7. 改稿 skill 加一段「由 revision 觸發時」

session 照的是 repo 裡手改用的那支 skill。加一段說明差異：

- outcome 檔一律寫 **`revisionId`**（payload / log 那個 id）與 **`revisionReply`**（一到三句，admin 在手機上看得懂；二手查證、已發管道不動都要寫）。
- **`revisionFailed: true`** 只在做不到時寫：照樣 commit、push，**不** dispatch 重發；下一輪 `--expire` 會標 `failed` 並推播原因。沒有這個欄位＝做完了，重發時 `--done` 標 `done`。
- commit 訊息以 `Revision <revisionId>:` 開頭；taste log 的來源寫這條 revision。

### 8. 實收

手機送一條 → Firestore 出現 `open` → 手動跑一次 workflow → `queued` + log commit → claude.ai 出現 routine run → 重發後 `done`、手機收到「已改好」。先在設定頁開通知，否則推播 sent 0。

---

## 介面速查

### pwa/src/revisions/

| 檔 | 匯出 |
|---|---|
| `RevisionBox.tsx` | `RevisionBox({ collectionPath, docId, revisions, email, posted?, commitBaseUrl?, strings?, max? })`（`key={docId}` 掛）；`RevisionBadge({ status, strings? })` |
| `revisions.ts` | `newRevision(text, email, { now?, suffix?, max? })` → `{ ok, revision } \| { ok: false, reason: 'empty' \| 'tooLong' }`；`revisionUpdate(rev)` → `{ revisions: arrayUnion(rev) }`；`submitRevision(collectionPath, docId, rev)`；`sortRevisions(list)`（新到舊、丟掉壞條目）；`revisionStatus(rev)`（未知狀態 → `open`）；`commitUrl(sha, base)`（非 hex 或沒 base → null）；`randomSuffix()` |
| `revisionTypes.ts` | `KitRevision`、`RevisionStatus`、`REVISION_STATUSES`、`REVISION_MAX = 1000`、`WithRevisions` |
| `revisionStrings.ts` | `defaultRevisionStrings`、`RevisionStrings`、`resolveRevisionStrings(...overrides)`、`revisionStatusLabel(s, status)` |
| `revisionStyles.ts` | `revisionBadgeClass: Record<RevisionStatus, string>` |

### ci/

```js
// revisions.js（純邏輯 + Firestore，無 host 設定）
updateRevision(db, docPath, revisionId, patch, { from? }) → { updated, revision }
listDocs(db, collectionPath) → [{ id, data }]
planDispatch(item, { isEligible?, isPosted? }) → [{ revision, action: 'fail'|'note'|'dispatch'|'wait' }]
planExpire(item, now, readOutcome(itemId) → outcome|null, { isEligible?, expireMs?, timeoutReply?, reportedReply? })
  → [{ revision, reason: 'reported'|'timeout', reply, commit }]
reportedFailure(outcome, revisionId, fallbackReply) → { reply, commit } | null
dispatchBody(eventType, itemId, revision) → { event_type, client_payload: { kitId, revisionId, text, date } }
appendLog(beforeText, { kitId, revisionId, text, dispatchedAt }, max? = 200) → text
markRevisionDone(db, docPath, outcome, { commit?, now?, doneReply?, from? = ['queued','open'] }) → { revisionId, updated, revision }
readOutcomeFile(file) / fileOutcomeReader(root, outcomePath) / lastCommitFor(root, rel) / headCommit(env, root)
millis / revisionsOf / STATUSES / DEFAULT_EXPIRE_MS / DEFAULT_LOG_MAX / DAILY_ID

// pull-revisions.js
CONFIG（見上表）; run(argv, deps?) → { lines, dispatched }   // 永不 throw；CLI 一律 exit 0
node pull-revisions.js --expire | --dispatch | --done <id> [--dry-run]
```

`outcome` = `{ revisionId, revisionReply?, revisionFailed?, commit? }`，即 session 寫進 outcome 檔的欄位（`commit` 由 reader 從 `git log` 補）。

---

## 狀態表

| status | 誰設 | 意思 |
|---|---|---|
| `open` | PWA | 剛送出 |
| `queued` | `--dispatch`（+ `queuedAt`） | 已派給雲端 session。沒有 `working`：session 不碰 Firestore，進度看 claude.ai 的 routine run |
| `done` | `--done <id>` / `markRevisionDone`（+ `doneAt`、`reply`、`commit`） | 重發跑在帶這個 `revisionId` 的 outcome 上 |
| `failed` | `--expire` / `--dispatch`（+ `reply`，推播「修改失敗」；session 回報時 + `commit`） | session 回報做不到（`revisionFailed: true`）、queued 超過 90 分鐘、dispatch 呼叫失敗、或項目不合格（`isEligible` false） |
| `noted` | `--dispatch` | 項目已發：交給 `notePosted`（若有），不重做 |

---

## 驗證（2026-10-23 抽取時）

| 位置 | 指令 | 結果 |
|---|---|---|
| `ci/` | `npm ci && npm test` | node:test（Node 26.0.0、firebase-admin 13.10.0）：2 files、**17 tests pass**（`revisions.test.js` 9、`pull-revisions.test.js` 8；fake db 在 `fakes.js`，git 相關測試在 `os.tmpdir()` 開臨時 repo） |
| `ci/` | `node pull-revisions.js --expire`（無 env） | `revisions: skipped: no FIREBASE_SERVICE_ACCOUNT`，exit 0；無參數 → 一行 WARNING usage，exit 0 |
| `ci/` | 用 openssl 生的拋棄式金鑰組一個假服務帳號，`FIREBASE_SERVICE_ACCOUNT=… node pull-revisions.js --dispatch --dry-run` | 真 SDK 路徑走通（`initAdmin` 從本資料夾載 firebase-admin、admin-pwa 的 helper 從 `../../admin-pwa/server/ci/` 載入），Firestore 回 `16 UNAUTHENTICATED` → 一行 WARNING，exit 0 |
| `pwa/` | 把 `modules/admin-pwa/pwa` 複製到 scratch（模組外）、放進 `src/revisions/`、在 `App.example.tsx` 的 `ItemDetail` 掛上 `RevisionBox`、加一支掛載測試；`npm ci && npm test` | vitest 5.0.5：17 files、**121 tests pass**，其中本模組 19（`revisions.test.ts` 11、`RevisionBox.test.tsx` 7、scratch 掛載測試 1：詳情頁 caption 之後出現輸入框與 queued 條目） |
| `pwa/` | 同上 `npm run lint` | oxlint：56 files、**0 warnings / 0 errors**（第一版把徽章顏色表放在 `RevisionBox.tsx` 觸發 `only-export-components`，已移到 `revisionStyles.ts`） |
| `pwa/` | 同上 `cp .env.example .env && npm run build` | `tsc -b` 通過；vite 8.3.4 build 成功（只有模板原本就有的 >500 kB chunk 提示），`dist/sw.js` precache 8 entries |

驗證完已刪 scratch 複本與 `ci/node_modules/`；模組內沒有 `node_modules`。掛載測試只在 scratch 跑，沒有收進模組（它依賴你改過的 App）。

**沒有在這裡驗的**：Firestore 真寫入、真 FCM 推播、GitHub dispatch、routine 叫醒——這些在第一個 host 2026-10-23 實跑過一次（[`routine/README.md`](./routine/README.md) §第一次真實跑），抽取後的通用版沒有再實跑。

---

## 已知限制

- **同一條被做兩次**：routine 對分支上**每個** push 都開 session，pending 判斷只看 outcome 檔有沒有 `revisionId`。一個 session 正在改、另一個 push 進來，第二個 session 也看到 pending 並重做。目前靠「早上分支很少有其他 push」撐著。補法：session 一開始先 push 一個只寫 `revisionId` 的占位 commit 認領（outcome 檔有 id、沒 reply 的視為進行中）。
- **每個 push 都醒一次**：webhook trigger 的路徑 `filter` 被 API 接受但不生效，所以每個 push 都有約 30 秒的空跑 session（第一個 host 一天 5–8 次）。`repository_dispatch` 事件叫不醒 routine（2026-10-23 實測），所以不能只靠它。
- **延遲**：cron 每 15 分鐘，GitHub 排程在尖峰還會晚到；第一次真實跑 16 分鐘裡 12 分鐘在等 cron。即時方案（未實作，見來源設計 §3）：一個 Cloudflare Worker / Function 驗 PWA 的 **Firebase ID token**（含 admin claim），驗過就直接把請求 commit 進 dispatch log（GitHub contents API）——那個 push 立刻叫醒 routine；Firestore 狀態仍由 cron 補。這需要 Worker 持有 repo 寫入 token，所以要比 cron 多一層守門。
- **已發的項目只記錄**：`isPosted` 為真就 `noted`，不開 session；要讓已發項目也能改，把 `isPosted` 設成 `() => false`，並讓 prompt 處理「已發管道不動」。
- **只接合格項目**：`isEligible` 預設只收 `YYYY-MM-DD` id（第一個 host 第一版只接每日項目，指南 / 專題 / 影片直接 `failed`）。放寬前要確認 skill 能處理那種項目。
- **outcome 檔在 checkout 裡**：`--expire` 讀的是 Actions checkout 的檔，所以 session 必須先 push 再等下一輪；`--done` 讀的是重發 run 的 checkout，`commit` 取 `GITHUB_SHA`（就是重發跑的那個 commit）。
- **推播**：只有開過通知的裝置收得到（admin-pwa 設定頁）。`--done` 的推播內文是項目 id（不另外讀文件標題）；`--expire` / `--dispatch` 的是文件 `title`。
- **一個項目一次一條**：同一項目連送三條，要三輪 cron + 三個 session 依序處理。
- `revisionSent` 預設說「最多 15 分鐘內開始處理」，cron 間隔改了要一起改。
