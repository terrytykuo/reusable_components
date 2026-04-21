# Repo Index

這份索引是 `[REPO_NAME]` 的入口文件，目的是讓人類與 AI 都能先建立 repo 心智模型，再按需要漸進式讀取，而不是每次都把整個專案從頭掃一遍。

## 建議讀取順序

### 所有任務的最小入口

1. `INDEX.md`：先看 repo 地圖與讀取路徑
2. `PROGRESS.md`：看目前做到哪裡、接下來做什麼
3. `DECISIONS.md`：看哪些決策已經定案
4. `AGENTS.md`：看 agent 在這個 repo 的工作協議

### 如果要理解產品與範圍

- `prd.md`：產品目標、範圍與 out-of-scope
- `PLAN.md`：完整實作藍圖與分 wave 規劃

### 如果要理解 collaboration harness

- `docs/harness-framework.md`：harness framework 總綱
- `docs/repo-bootstrap-prompt.md`：可直接帶去新 repo 的 bootstrap prompt
- `MANUAL.md`：哪些步驟必須由人類處理
- `verification/VERIFY.md`：哪些東西可由 AI 驗證、哪些必須人工驗證

### 如果要改主要程式入口

- `[MAIN_ENTRY]`：主要服務或 app 組裝入口
- `[MAIN_MODULE]`：核心模組與執行責任

### 如果要看測試與驗證

- `[TEST_ENTRY]`：主要測試入口
- `[CHECK_ENTRY]`：統一 check 入口

## Repo Structure

```text
[REPO_NAME]/
├── apps/
├── packages/
├── docs/
├── verification/
└── scripts/
```

## File Index

### Root

- `AGENTS.md`：agent 在本 repo 工作時應遵守的啟動、收尾與文檔維護協議主檔。
- `CLAUDE.md`：由 `AGENTS.md` 同步產生的對應工作協議版本。
- `INDEX.md`：repo 入口索引，提供漸進式讀取路徑與檔案地圖。
- `PROGRESS.md`：當前工作狀態、已完成項目、已知問題與下一步。
- `DECISIONS.md`：已採納的重要架構與交付決策記錄。
- `MANUAL.md`：必須由人類手動執行的操作與維護事項。
- `Makefile`：常用 repo 指令，如 `check`、測試與啟動指令。

### Docs

- `docs/harness-framework.md`：整理 repo 內 collaboration harness 的組成與對齊方式。
- `docs/repo-bootstrap-prompt.md`：可直接複製到其他 repo 的 bootstrap prompt。

### Verification

- `verification/VERIFY.md`：列出 AI 可驗證與人工必驗證的項目。
