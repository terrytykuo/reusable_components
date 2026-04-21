---
name: harness-engineering
description: Use this skill to bootstrap or normalize repo-level agent collaboration harnesses, including AGENTS.md, CLAUDE.md, INDEX.md, PROGRESS.md, DECISIONS.md, MANUAL.md, verification docs, and a single check entrypoint.
---

# Harness Engineering Skill

當使用者要你幫 repo 建立、整理、抽象化或複用 collaboration harness 時，使用這個 skill。

## 典型觸發情境

- 使用者提到 `AGENTS.md`、`CLAUDE.md`、`PROGRESS.md`、`DECISIONS.md`、`MANUAL.md`
- 使用者想把「agent 工作方式」沉澱成 repo 內文件，而不是只留在聊天上下文
- 使用者想把一個成功的 repo 協作機制抽成可重用 starter kit
- 使用者要你為新 repo 建立可交接、可驗證、可持續協作的工作框架

## 核心目標

1. 把 repo 記憶外部化到 markdown 文件。
2. 讓下一位 agent 有固定的開工讀取順序。
3. 讓每個 wave 儘量收斂成「人類只補憑證/帳號即可驗證」。
4. 清楚分出 agent 可完成的工作與人類必做的工作。

## 工作流程

1. 先掃描 repo 入口、主要程式入口、測試入口、build/check 入口與外部依賴。
2. 讀現有文件，避免盲目重寫；如果已存在協議，優先正規化成單一 canonical source。
3. 建立或更新：
   - `INDEX.md`
   - `PROGRESS.md`
   - `DECISIONS.md`
   - `MANUAL.md`
   - `AGENTS.md`
4. 若 repo 有多個 agent instruction 檔名需求，優先讓 `AGENTS.md` 成為 canonical source，再同步產生 `CLAUDE.md` 或其他鏡像。
5. 視需要建立：
   - `docs/harness-framework.md`
   - `docs/repo-bootstrap-prompt.md`
   - `verification/VERIFY.md`
6. 若 repo 缺少統一檢查入口，補出 `make check` 或等價入口。
7. 把真正只能人類做的事留在 `MANUAL.md`，不要混進 `PROGRESS.md` 的工程待辦。

## 重要約束

- `PROGRESS.md` 的「下一步」只保留 agent 目前無法在當前環境直接完成的事。
- `MANUAL.md` 只記錄人類需要親手做的事。
- `DECISIONS.md` 每條決策至少要有：日期、原因、否決方案、限制。
- `INDEX.md` 必須提供漸進式讀取路徑，不要只列檔名。
- 若 repo 需要 `CLAUDE.md`，應明確標示它是 mirror，而不是第二份真相來源。

## 建議輸出

這個資料夾已附上可直接複製調整的模板：

- `templates/AGENTS.md`
- `templates/CLAUDE.md`
- `templates/INDEX.md`
- `templates/PROGRESS.md`
- `templates/DECISIONS.md`
- `templates/MANUAL.md`
- `templates/docs/harness-framework.md`
- `templates/docs/repo-bootstrap-prompt.md`
- `templates/verification/VERIFY.md`

先用模板建立骨架，再依 repo 的技術棧、驗證入口與外部依賴做最小客製化。
