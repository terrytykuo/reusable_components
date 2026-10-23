# Routine 與叫醒方式

修改請求由一個 claude.ai **routine**（雲端排程 / 事件觸發的 Claude Code session）處理。這份記錄怎麼建、怎麼接 GitHub 事件，以及 2026-10-23 第一個 host 實測到的事。Prompt 模板在 [`PROMPT.md`](./PROMPT.md)。

## 建 routine

- 用 claude.ai 的 routines API 建（Claude Code 的 `RemoteTrigger` 工具 / `/schedule` skill），名字例如 `<host>-revision`。
- **模型**：第一個 host 用 `claude-opus-5-5`（改稿要過整套 skill、看每張圖、跑全套測試；一次約 3 分鐘）。
- **environment**：同一個在第 1 步檢查過的 claude.ai environment（repo 寫入、`gh`、Node、Chromium 都要在）。容器檢查清單見 [`../DESIGN.md`](../DESIGN.md) §7。
- **連接器全部拔掉**。admin 的自由文字會進 session；session 不需要也不該有 Gmail / Drive 等連接器。
- **工具**：Bash、Read / Edit / Write、WebSearch、Skill；不要互動式詢問工具。權限模式要自動（routine 沒人在旁邊按允許）。
- **備援 cron**：一天一次（第一個 host 是 `40 9 * * *` UTC），補漏用；醒來照 prompt 的 STEP 0 看 log 有沒有 pending，沒有就印 `no pending revision` 結束。

## 接 GitHub 事件（webhook trigger）

`create_webhook_trigger` 的 body：

```json
{
  "routine_trigger_id": "trig_…",
  "source": "github",
  "hook_type": "app",
  "scope_id": "<owner>/<repo>",
  "events": ["push"]
}
```

（建好後 trigger 顯示的 scope 是 `github.com/<owner>/<repo>`。）

**實測（2026-10-23）**：

| 試了什麼 | 結果 |
|---|---|
| `events: ["repository_dispatch"]`，從 Actions（`GITHUB_TOKEN`）與本機 `gh api …/dispatches` 打 | **叫不醒**。dispatch 本身成功（API 回 204），routine 沒有任何 run。推測 Claude GitHub App 不投遞這種事件 |
| `events: ["push"]` | **叫得醒，約 1 秒**開 session。空 log 時 7 秒讀完、印 `no pending revision` 結束 |
| `filter`（只看某路徑的 push） | API 收下但**不生效**：不碰 log 檔的 push 也開了 session（約 30 秒空跑） |

所以實際叫醒路徑是：**cron workflow 送出 repository_dispatch → 把 dispatch log commit 到分支 → 那個 push 叫醒 routine**。`repository_dispatch` 仍然送（payload 留紀錄、日後若投遞修好可直接用），但 session 一律從 log 檔找工作，不依賴 payload。

代價：分支上**每個** push 都會開一次約 30 秒的空跑 session。第一個 host 一天 5–8 個 commit，可接受。要省的話：找 webhook trigger 正式的路徑篩選語法，或改走 PAT 發的 `repository_dispatch` 再試一次。

## 雲端容器的事實（2026-10-23 實測）

| 項目 | 實測 | prompt / 流程怎麼配合 |
|---|---|---|
| 時鐘 | UTC | 一律 `TZ=<zone> date` 算當地時間 |
| 分支 | session 在一個 `claude/*` 拋棄式分支 | 一律 `git push origin HEAD:<branch>` |
| push 到 main | **可以**（repo 沒有 branch protection） | 有保護的 repo 要改成開 PR + 自動 merge |
| 刪遠端分支 | **403**（proxy 不放寫 refs 的 REST path） | 不要刪分支；測試分支由本機刪 |
| GitHub GraphQL | **全擋** | `gh workflow run` 不加 `--ref` 會先走 GraphQL 查預設分支而失敗，**一律 `--ref <branch>`**；其他查詢用 `gh api repos/<owner>/<repo>/…`（REST 可用） |
| `gh api …/dispatches` | 可用 | — |
| secrets | 容器裡**沒有任何** secret（Firestore、寄信、R2、OpenAI…） | 設計就是如此：Firestore 只由 Actions 寫，session 只寫 repo |
| Chromium | 沒設 `OG_CHROME_PATH`，Playwright 自己找到預裝的 Chromium | 不必設 |
| 網路 | 部分國家網域（第一個 host 是 .dk）封鎖；`api.github.com` 通 | 查證走 WebSearch 二手，reply 要寫明 |
| WebSearch | 可用 | — |
| Node 與已 commit 的相依 | 可用，能渲染 | 不必 setup script |

## 第一次真實跑（2026-10-23）

手機送出 → cron（當時排程還沒登記，手動 dispatch workflow）→ `queued` + commit log → push 叫醒 session → 3 分鐘內改完、commit、dispatch 重發 → 重發的 publish 步驟標 `done`。全程 16 分鐘，其中 12 分鐘是等 cron。推播 sent 0，因為手機還沒在設定頁開通知。
