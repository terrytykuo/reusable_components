## 每次對話開始時
1. 先讀 `INDEX.md`，了解 repo structure 與建議的漸進式讀取路徑
2. 讀 `PROGRESS.md` 了解當前狀態
3. 讀 `DECISIONS.md` 了解重要決策
4. 跑 `make check` 或本 repo 的等價統一檢查命令
5. 從 `PROGRESS.md` 的「下一步」或使用者當前要求繼續工作

## 每次對話結束前
1. 更新 `PROGRESS.md`
2. 更新 `MANUAL.md`
3. 若檔案結構或檔案責任有變，更新 `INDEX.md`
4. 若有新決策定案，更新 `DECISIONS.md`
5. 再跑一次 `make check` 或等價檢查命令
6. 提交所有已完成的工作
7. 若 repo 有 remote，`git push` 讓其他 agent 與工作樹可見最新狀態

## 收斂原則
1. 每個 wave 的收尾目標，應優先收斂成「開發者只需要手動接入必要 API key / 憑證 / 外部帳號，即可驗證」的狀態。
2. 若外部服務尚未開通，代理仍應先把程式碼、依賴、fallback、健康檢查、錯誤訊息、文件與測試補到 ready 狀態。
3. 回報進度時，應以「如何讓開發者用最小認知負載理解與驗證」為主軸。
4. `MANUAL.md` 應優先提供最短驗證路徑、必要環境變數、健康檢查方式、成功條件與尚未自動化的外部依賴。
5. `PROGRESS.md` 的「下一步」應只保留代理無法在當前環境內自行完成，或必須由人類持有權限/帳號才能完成的工作。
6. 若某個建議步驟其實可以在當前 repo 內直接完成，代理應先直接完成，再向開發者報告結果。

## 開發階段
1. 將 git 提交作為檢查點；每完成一個原子工作單元就提交。
2. 若一次規劃了多個 bundle，則每完成一個 bundle 都要先更新相關文檔，再繼續下一個 bundle。

## Review 修補流程
1. 若任務來自 `REVIEW.md`，先讀 `REVIEW.md`，再把本輪預計處理的 fix queue 寫進 `PROGRESS.md`。
2. 多 session review 任務必須把 `PROGRESS.md` 當成交接主檔。
3. 每完成一個 review fix，就立刻更新 `PROGRESS.md`，至少記錄：
   - 已修的 commit / checkpoint
   - 修了什麼、為什麼修
   - 驗證結果
   - 剩餘待修項目
4. 若 review backlog 很大，單一 session 應先收斂成可交接的小批次。

## 檔案原則
1. 所有專案記憶 markdown 檔案都應存在 repo 內，而非放在全域設定目錄。
2. `AGENTS.md` 應視為 canonical source；若需要 `CLAUDE.md` 或其他 mirror，應由 `AGENTS.md` 同步而來。
