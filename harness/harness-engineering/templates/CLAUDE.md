# Claude Repo Instructions

本檔應與 `AGENTS.md` 保持同步；若兩者衝突，請以 `AGENTS.md` 為 canonical source，並重新同步本檔。

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
7. 若 repo 有 remote，`git push`

## 收斂原則
1. 每個 wave 的收尾目標，應優先收斂成「開發者只需要手動接入必要 API key / 憑證 / 外部帳號，即可驗證」的狀態。
2. `PROGRESS.md` 的「下一步」只保留代理無法在當前環境直接完成的事。
3. 需要人類開發者手動執行的工作，放在 `MANUAL.md`。
4. 所有專案記憶 markdown 檔案都應該存在本專案目錄底下，而非全域設定目錄。
