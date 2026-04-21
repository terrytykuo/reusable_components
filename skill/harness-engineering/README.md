# Harness Engineering Starter Kit

這套 starter kit 把 `teleharness` 裡成熟的 collaboration harness 抽成可重用元件，目標是讓新 repo 或既有 repo 都能快速建立一套對 coding agent 友善的工作框架。

## 這套機制在解決什麼

- 避免專案記憶只存在聊天上下文
- 避免每個 agent 重新掃整個 repo 才能開工
- 避免把其實可以先做完的工程工作丟給人類當「下一步」
- 避免人工步驟、架構決策、驗證入口散落在多個地方

## 包含內容

- `SKILL.md`
  - 給 Claude / coding agent 的工作規則，說明何時使用這套 harness engineering skill
- `templates/AGENTS.md`
  - repo-level agent protocol 主檔模板
- `templates/CLAUDE.md`
  - 與 `AGENTS.md` 保持同步的 mirror 模板
- `templates/INDEX.md`
  - repo 入口索引模板，包含建議讀取順序與檔案責任
- `templates/PROGRESS.md`
  - 專案進度、已完成、已知問題與只保留 human-blocked next steps 的模板
- `templates/DECISIONS.md`
  - 重要決策記錄模板
- `templates/MANUAL.md`
  - 人類手動步驟、最短驗證路徑與外部依賴模板
- `templates/docs/harness-framework.md`
  - 將整套 collaboration harness 的層次與角色整理成文件
- `templates/docs/repo-bootstrap-prompt.md`
  - 可直接貼給 coding agent 的 bootstrap prompt
- `templates/verification/VERIFY.md`
  - 區分 AI 可驗證與人工必驗證項目的模板

## 推薦導入順序

1. 先用 `templates/INDEX.md`、`PROGRESS.md`、`DECISIONS.md`、`MANUAL.md`、`AGENTS.md` 建立共享記憶骨架。
2. 再補 `verification/VERIFY.md` 與 `docs/harness-framework.md`，把驗證與框架邊界講清楚。
3. 若 repo 需要兼容多種 agent tooling，再把 `CLAUDE.md` 視為 mirror 加進來。
4. 最後把 `repo-bootstrap-prompt.md` 收進 repo，方便下一個新 repo 直接複製這套機制。

## 使用方式

如果是新 repo：

```bash
cp -r skill/harness-engineering /path/to/repo/.reusable/harness-engineering
```

如果是要直接引入模板：

```bash
cp skill/harness-engineering/templates/AGENTS.md /path/to/repo/AGENTS.md
cp skill/harness-engineering/templates/INDEX.md /path/to/repo/INDEX.md
cp skill/harness-engineering/templates/PROGRESS.md /path/to/repo/PROGRESS.md
cp skill/harness-engineering/templates/DECISIONS.md /path/to/repo/DECISIONS.md
cp skill/harness-engineering/templates/MANUAL.md /path/to/repo/MANUAL.md
```

之後再依 repo 實況補上技術棧、檢查命令、外部依賴與產品目標。

## 導入後的最低標準

- 新 agent 進 repo 時知道先讀什麼
- 人類能在 `PROGRESS.md` 一眼看到做到哪裡
- 重要決策不只存在聊天紀錄
- 需要人類權限或帳號的步驟被集中在 `MANUAL.md`
- repo 有單一的 check 入口可判斷是否一致
