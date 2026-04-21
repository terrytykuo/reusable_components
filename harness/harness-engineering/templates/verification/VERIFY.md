# Verification Matrix

## AI 可直接驗證

- 單元測試 / 整合測試
- lint / typecheck / build
- `make check` 或統一檢查入口
- 本機 mock / synthetic mode 的 smoke test
- 文件同步與 repo 結構一致性

## 必須人工驗證

- 真實外部服務、帳號或憑證的端到端流程
- 需要人工主觀判讀的體驗品質
- 真實 webhook / callback / device / browser / payment / telephony 流量
- 涉及權限、法務、合規或業務承諾的最終確認

## 驗證輸出規則

- AI 驗證要留下命令與結果
- 人工驗證要寫成功條件與觀察重點
- 若某項驗證受外部依賴阻塞，應清楚標示阻塞條件
