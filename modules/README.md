# Reusable Components — modules/

跨層（App + 後端 + 後台）打包的**功能模組**。和 `app/`、`web/` 的單一元件不同，這裡每個資料夾是一個完整功能：資料模型、Cloud Functions、App UI、後台工具、設計文件與測試放在一起，複製時整包搬。

每個模組自己的 `README.md` 說明架構、套用步驟、驗證結果與已知限制；`INDEX.md` 是這個類別的目錄與介面速查。

---

## 資料夾結構

```
modules/
├── README.md                 ← 本文件
├── INDEX.md                  ← 每個模組的介面速查
│
├── voucher-system/           ← 優惠碼 → RevenueCat promotional entitlement
│   ├── README.md             ← 架構、套用、驗證
│   ├── DESIGN.md             ← 原始設計規格（資料模型 / callable 合約 / 錯誤碼 / 後台 API）
│   ├── functions/            ← Cloud Functions v2：previewVoucher / redeemVoucher、RevenueCat client、rules 片段、tests
│   ├── app/                  ← RN：createVoucherClient、VoucherTicket、VoucherRedeemSheet、EN/zh-TW 字串、tests
│   ├── admin/                ← 本機後台：React + Vite + Tailwind / Express + firebase-admin、tests
│   └── scripts/              ← 端到端驗證腳本
│
├── missing-entry-report/     ← 查無結果回報 + 資料補上後自動通知回報者
│   ├── README.md
│   ├── app/                  ← RN：MissingEntryReport 空狀態 + modal、submitMissingEntryReport (Firestore)
│   └── functions/            ← createMissingEntryReportFunctions()：onReportCreated / onEntryCreated / onEntryUnhidden、rules 片段、tests
│
├── admin-pwa/                ← 手機內部後台 PWA（Google 登入 + admin claim、Web Push、素材檢視 / 存圖 / 複製 / 已發開關）
│   ├── README.md             ← 架構、從零建置 checklist、介面速查、驗證、已知限制
│   ├── DESIGN.md             ← 為何 PWA / Firebase、登入流程、路徑慣例、推播
│   ├── pwa/                  ← 前端模板（Vite + React 19 + Tailwind 4 + vite-plugin-pwa）；只改 src/brand.ts；vitest
│   └── server/               ← firestore.rules.snippet、set-admin.mjs、functions/（requireAdmin、onKitCreated）、ci/（publishDoc、sendPush，node:test）
│
└── revision-requests/        ← admin-pwa 的延伸：手機一句「修改意見」→ Actions → claude.ai 雲端 session 改稿 → 已完成 / 失敗 + 推播
    ├── README.md             ← 架構、套用 checklist、介面速查、狀態表、驗證、已知限制
    ├── DESIGN.md             ← 為何這樣分工、資料模型、session 要做的事、雲端環境檢查、風險
    ├── pwa/src/revisions/    ← RevisionBox、revisions.ts、revisionTypes.ts、revisionStrings.ts（走 brand.strings）、vitest；複製進 admin-pwa host 的 src/
    ├── ci/                   ← revisions.js（updateRevision / planDispatch / planExpire / appendLog / markRevisionDone）、pull-revisions.js CLI（CONFIG 在頂端）、node:test；建在 admin-pwa 的 admin-firestore.js 上
    ├── workflow/             ← revisions.yml.example（cron + commit dispatch log）
    └── routine/              ← PROMPT.md（雲端 session prompt 模板）、README.md（webhook trigger 與 2026-10-23 實測）
```

---

## 收錄原則

- 功能跨兩層以上（例如 App callable + Functions + 後台），拆開放會失去上下文。
- 每層都已與來源專案解耦：App 端不 import 專案的 firebase / i18n / 字型 singleton，改由 factory 或 props 注入；Functions 端專案專屬的欄位名集中在檔案頂端常數。
- 測試一併帶走，抽取當下在來源專案的工具鏈跑過一遍，結果寫在模組 README。
- 模組可以建在另一個模組上（例如 `revision-requests` 擴充 `admin-pwa`）：依賴的模組不改，新模組以相對路徑引用或說明「兩個一起複製」，驗證時在模組外的臨時複本裡把兩者組起來跑。
- 外部服務的行為（例如 claude.ai routine 的 webhook 會被哪種 GitHub 事件叫醒）寫成「實測日期 + 結果」，不要寫成保證。
