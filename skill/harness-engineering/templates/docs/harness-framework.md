# Harness Framework

這份文件用來整理 repo 的 collaboration harness，說明它如何把人類目標、AI 權限、共享記憶與驗證機制綁在一起。

## 1. 框架目標

- AI 是否真的在執行使用者要的目標
- AI 是否只在授權範圍內行動
- AI 是否在不確定時停下來交還決策權
- AI 的工作過程是否留下足夠證據，讓下一位人類或 agent 能接手

## 2. 核心原則

### 明確意圖

使用者目標不能只存在聊天上下文裡，必須被寫成結構化輸入或文件化說明。

### 邊界清楚

AI 可以做什麼、不能做什麼，要有顯式邊界，包含 out-of-scope、allowed actions 與 human-only work。

### 狀態可追蹤

AI 的工作不能只靠上下文記憶，必須把狀態外部化到 repo 內文件或 runtime state。

### 驗證優先

對齊要有檢查入口、測試證據與人工驗證清單。

### 人類保有最終決策權

模糊、高風險或需要真實權限的地方，必須顯式升級給人類。

## 3. Harness 的組成層

### Product Intent Layer

- `prd.md`
- `PLAN.md`

### Collaboration Protocol Layer

- `AGENTS.md`
- `CLAUDE.md`
- `INDEX.md`
- `PROGRESS.md`
- `DECISIONS.md`
- `MANUAL.md`

### Runtime Safety Layer

- domain model
- state machine
- escalation primitives

### Verification Layer

- `verification/VERIFY.md`
- `make check`
- 測試與 smoke checks

### Human Override Layer

- `MANUAL.md`
- runtime 中的人類 decision / approval flow

## 4. 一句話定義

harness framework 是一套把使用者意圖、AI 權限、共享記憶、驗證證據與人工接管點綁在一起的控制層，目的是讓 AI 與人類始終朝同一個目標前進。
