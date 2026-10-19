# Modules Index

---

## voucher-system/

**分類**: 變現 / 行銷工具
**技術棧**: Firebase Cloud Functions v2 (TS) · firebase-admin · RevenueCat REST v1 · React Native / Expo · React 19 + Vite + Tailwind 4 + Express 5
**來源**: `mewguard/cat_toxin_app` — `functions/src/vouchers/`, `lib/vouchers.ts`, `components/VoucherRedeemSheet.tsx`, `components/VoucherTicket.tsx`, `voucher-admin/`, `scripts/verify-vouchers.mjs`, `docs/plans/2026-09-15-voucher-system-design.md`

**功能說明**:
行銷用優惠碼系統。後台產生「共用碼」（一組碼多人用，有上限）或「單次碼批次」（`PREFIX-XXXX-XXXX`，最多 500 組），App 內輸入後先 `previewVoucher` 看票券，再 `redeemVoucher` 由 Cloud Function 以 transaction 保留名額並呼叫 RevenueCat 發 promotional entitlement（100% off × 1/2/3/6/12 個月），失敗自動 rollback。已付費訂閱者的免費期排在目前週期之後。

### functions/

| 匯出 | 說明 |
|---|---|
| `previewVoucher` (onCall) | 驗證碼 + 回傳 `{ code, campaign, discountPercent, durationMonths, startsAfterCurrentPeriod, currentPeriodEndsAt }`，不寫入 |
| `redeemVoucher` (onCall) | 保留名額 → RevenueCat grant → 寫 `voucherRedemptions` + 鏡射到 `users/{uid}`；回 `{ promoStartsAt, promoEndsAt, durationMonths, startsAfterCurrentPeriod }` |
| `validate.ts` | 純函式：`normalizeCode`、`evaluateVoucher`、`computePromoWindow`、`resolveStart`（vitest 覆蓋） |
| `revenuecat.ts` | `fetchRevenueCatSubscriber`、`getActiveEntitlement`、`grantPromotionalEntitlement`；可供訂閱同步 callable 共用 |
| `types.ts` | `Voucher` / `VoucherBatch` / `VoucherRedemption` / `VoucherErrorCode` / `DURATION_TO_RC` |

設定：secret `REVENUECAT_API_KEY`、param `REVENUECAT_ENTITLEMENT_ID`（預設 `premium`）；`handlers.ts` 頂端 `USERS` / `USER_MIRROR_FIELDS` 可改。錯誤以 `HttpsError.details.code` 回傳九種碼。

### app/

```ts
createVoucherClient({ functions, strings?, previewFunctionName?, redeemFunctionName?, mock? }): VoucherClient
// VoucherClient: previewVoucher, redeemVoucher, getErrorMessage, errorMessage, formatDuration,
//                normalizeCode, isCodeFormatValid, strings, isMockEnabled
```

| 元件 | 主要 Props |
|---|---|
| `VoucherRedeemSheet` | `visible`, `onClose`, `client`, `afterRedeem?`（在此清 RevenueCat 快取）, `onRedeemed?`, `illustration?`, `formatDate?`, `strings?`, `tokens?`, `fonts?` |
| `VoucherTicket` | `campaign`, `discountPercent`, `durationMonths`, `startsAfterCurrentPeriod?`, `currentPeriodEndsAt?`, `backgroundColor?`（缺口顏色需等於外層背景）, `illustration?`, `formatDate?`, `strings?`, `tokens?`, `fonts?` |

字串：`defaultVoucherStrings`（EN）、`zhTWVoucherStrings`、`resolveVoucherStrings(override)`、`stringsFromTranslate(t)`（接 i18n-js / i18next，catalogue 在 `app/locales/voucher.*.json`）。依賴：`firebase/functions`、`react-native-safe-area-context`、`../../app/types/tokens.ts`。

### admin/

本機 Express API（`127.0.0.1:5179`）+ Vite UI（`:5178`）。`POST /api/vouchers`、`GET /api/batches`、`GET /api/batches/:id`、`PATCH /api/vouchers/:code`、`PATCH /api/batches/:id`、`GET /api/batches/:id/export.csv`、`.../redemptions.csv`、`GET /api/health`。純邏輯在 `lib/codes.js`（產碼 / 文件 shape / CSV）與 `lib/status.js`（狀態推導 / 編輯驗證），server 端算好 `status` 一起回傳，UI 不重算。品牌字樣 `src/config.ts`。

**使用情境**: 任何有 RevenueCat 訂閱、需要發「免費 N 個月」給社群 / 早期使用者 / 合作夥伴的 app。
**詳細**: [voucher-system/README.md](./voucher-system/README.md)

---

## missing-entry-report/

**分類**: 使用者參與 / 資料回饋
**技術棧**: Firebase Cloud Functions v2 (TS) · firebase-admin · nodemailer (可換) · React Native / Expo
**來源**: `mewguard/cat_toxin_app` — `components/NoResultsView.tsx`, `functions/src/index.ts`（`onPlantReportCreated` / `onToxinCreated` / `onToxinUnhidden` / `notifyMatchingReporters`）, `firestore.rules` `plant_reports`

**功能說明**:
搜尋查無結果時顯示「資料庫還沒有這一項（不代表安全）」+ 回報按鈕；回報寫入 `missing_entry_reports`，管理員收 email；之後條目新增或從 `hidden: true → false` 時，自動比對未通知的回報（名稱 / 別名互相包含）並寄信給回報者、標記 `notified`。

### functions/

```ts
createMissingEntryReportFunctions({
  reportsCollection, entriesCollection, createMailer, secrets?, adminEmail?, appName?,
  summarizeEntry?, hiddenField?, matches?, copy?,
}) → { onReportCreated, onEntryCreated, onEntryUnhidden, notifyMatchingReporters }
createGmailMailer(user, appPassword) → Mailer        // nodemailer gmail；自備 Mailer 亦可
defaultMatches(entry, query) / defaultCopy(appName)  // 純函式，vitest 覆蓋
```

### app/

| 匯出 | 說明 |
|---|---|
| `MissingEntryReport` | Props：`query`, `onSubmit(report)`, `icon?`, `buttonIcon?`, `strings?`, `tokens?`, `fonts?`, `notify?`；`defaultMissingEntryStrings` / `zhTWMissingEntryStrings` |
| `submitMissingEntryReport(db, report, { userId, userEmail }, collection?)` | 預設 onSubmit，寫入 rules 片段對應的文件 shape |

**使用情境**: 任何「資料庫型」app（字典、商品、地點）想把查無結果變成資料來源與回訪理由。
**詳細**: [missing-entry-report/README.md](./missing-entry-report/README.md)

---

## admin-pwa/

**分類**: 內部工具 / 手機後台
**技術棧**: Vite 8 + React 19 + TypeScript + Tailwind 4 + vite-plugin-pwa（injectManifest）· Firebase Auth / Firestore / Messaging / Hosting · Cloud Functions v2 (TS) · Node CommonJS + firebase-admin
**來源**: `MewGuard/mewadmin/`（MewAdmin PWA）、`cat_toxin_app/functions/src/admin/push.ts` + `requireAdmin.ts`、`cat_toxin_app/functions/scripts/set-admin.mjs`、`social/lib/publish-kit.js` + `firestore.js`、設計 `MewGuard/docs/plans/2026-10-18-mewadmin-pwa-design.md`

**功能說明**:
Safari 加入主畫面安裝的內部後台模板。Google 登入後檢查 custom claim `admin: true`（主畫面用 redirect、瀏覽器分頁用 popup，`authDomain` 與 Hosting 同源）；CI 寫入 Firestore `admin/**` 的素材以 `onSnapshot` 即時顯示，詳情頁有圖卡橫滑 + 全螢幕、系統分享表單一鍵存全部圖到相簿、一鍵複製文案、「未發 ⇄ 已發」開關。Web Push：設定頁開啟通知、我的裝置列表，新項目建立時由 CI（`sendPush`，免 Functions）或 Cloud Function（`createOnKitCreated`）發 FCM，失效 token 自動刪除。品牌、顏色、字串集中在 `src/brand.ts` / `src/theme.css`。

### pwa/（前端模板）

| 匯出 | 說明 |
|---|---|
| `brand: BrandConfig` | `name`, `shortName`, `description`, `themeColor`, `backgroundColor`, `lang`, `locale`, `storageKey`, `devicesPath`, `strings`（覆寫 `defaultStrings`）；manifest / index.html 也讀它 |
| `AuthGate` / `useAdminUser()` / `useAdminContext()` | 登入閘；`{ status: 'loading'\|'signed-out'\|'not-admin'\|'admin'\|'error', user, email, error, signIn, signOut, retry }` |
| `useCollection<T>(path \| null, { orderBy?, direction?, limit? })` | `{ items: (T & {id})[], loading, error }`；`null` = 不訂閱 |
| `useDoc<T>(collectionPath, id \| null)` | `{ doc, loading, error, missing }` |
| `newestFirst(items, key)` / `formatTimestamp(ts, locale?)` | 排序 / 日期 |
| `KitViewer` | `slides: {file, url}[]`；橫向 snap + lightbox（方向鍵、Esc、左右滑） |
| `DownloadAllButton` / `saveKitImages` | `kitId`, `slides`, `shareTitle?`；Web Share 檔案 → 相簿，不支援則逐張下載 |
| `Caption` / `CopyButton` | `text`, `title?`, `copyLabel?` / `text`, `label?`, `ariaLabel?` |
| `StatusToggle` | `on`, `onToggle(next) => Promise`, `onError?`, `labels?`；配 `setPosted(collectionPath, id, next, by)` / `postedFields` / `isPosted` |
| `Settings` / `InstallHint` / `Toast` / `useForegroundMessages` | 推播設定頁、加入主畫面提示、前景通知 toast（`bottom?`） |
| `enablePush` / `refreshPush` / `disablePush` / `removeDevice` / `useMyDevices` | FCM token 註冊、輪替、刪除；`DEVICES_PATH = brand.devicesPath` |
| `PageStatus`（`Loading` / `ErrorNotice` / `Empty` / `BackLink`）、`ErrorBoundary`、`usePullToRefresh`、`whoName` | 頁面狀態與小工具 |

### server/

```js
// ci/admin-firestore.js（CommonJS）
initAdmin({ env?, envVars? = ['FIREBASE_SERVICE_ACCOUNT', 'FIREBASE_ADMIN_KEY_PATH', 'GOOGLE_APPLICATION_CREDENTIALS'], appName? }) → { app, db, messaging, Timestamp } | null
publishDoc(collectionPath, id, doc, { preserve? = DEFAULT_PRESERVE, deps?, now? }) → { path, created }
sendPush({ title, body?, link, tag?, icon?, data? }, devicesPath? = 'admin/pushTokens/devices', { deps? }) → { devices, sent, failed, pruned, errors }
```

```ts
// functions/src/
requireAdmin(request) → { uid, email }                       // HttpsError unauthenticated / permission-denied
createOnKitCreated({ document, notify(params, data) → {title, body, link, tag?} | null, devicesPath?, icon?, region? })
notifyDevices(db, messaging, devicesPath, msg) / sendToTokens / buildMessage / truncate
```

另有 `firestore.rules.snippet`（`admin/**` 限 claim）與 `set-admin.mjs <email> [--revoke]`。

**使用情境**: 任何「CI / 排程產出素材 → 人在手機上審、存圖、複製、標記已發」的流程（IG / 小紅書發文 kit、審稿、日報），或需要一個不上架、只給少數人用、能收推播的手機後台。
**詳細**: [admin-pwa/README.md](./admin-pwa/README.md) · [admin-pwa/DESIGN.md](./admin-pwa/DESIGN.md)
