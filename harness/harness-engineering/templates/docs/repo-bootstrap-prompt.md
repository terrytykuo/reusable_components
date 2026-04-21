# Repo Bootstrap Prompt

這份文件把 repo collaboration harness 抽成可直接貼給 coding agent 的 bootstrap prompt。

## 可直接複製的 Prompt

```md
你現在要幫我把這個 repo 初始化成一個「對 coding agent 友善、可持續協作、可驗證、可交接」的工作框架。

專案資訊：
- repo 名稱：[REPO_NAME]
- 專案目標：[一句話描述產品/工具目標]
- 主要技術棧：[例如 FastAPI + Next.js + Postgres]
- 目前階段：[例如 bootstrap / MVP / wave 1]
- 人類目前已知外部依賴：[例如 Stripe、OpenAI、GitHub App；若沒有可寫無]

請遵守以下原則：

## 目標
1. 把專案現況、重要決策、手動步驟、下一步，外部化到 repo 內 markdown 文件。
2. 讓下一位 agent 開工前，能靠固定讀取順序快速建立心智模型。
3. 讓每個 wave 都盡量收斂到「人類只需要補 API key / 憑證 / 外部帳號，就能驗證」的狀態。
4. 明確區分哪些事情 agent 可以在 repo 內完成，哪些必須由人類手動處理。

## 先做的事
1. 掃描 repo 結構、現有文件、主要程式入口、測試入口與 build/check 入口。
2. 若 repo 已有相關文件，請整合與正規化，不要無條件重寫。
3. 建立或更新以下文件：
   - `INDEX.md`
   - `PROGRESS.md`
   - `DECISIONS.md`
   - `MANUAL.md`
   - `AGENTS.md`
4. 視需要建立：
   - `docs/harness-framework.md`
   - `docs/repo-bootstrap-prompt.md`
   - `verification/VERIFY.md`
5. 若 repo 缺少統一檢查入口，建立 `make check` 或等價入口。

## 文件責任
- `INDEX.md`: repo 地圖與建議讀取順序
- `PROGRESS.md`: 目前狀態、已完成、已知問題、只保留 human-blocked next steps
- `DECISIONS.md`: 重要決策與其原因
- `MANUAL.md`: 必須由人類手動執行的步驟
- `AGENTS.md`: agent 每次對話的啟動/收尾協議

## 交付要求
1. 實際建立或更新上述文件
2. 說明你偵測到的 repo 現況
3. 列出最短驗證路徑
4. 列出仍必須由人類處理的外部依賴
```
