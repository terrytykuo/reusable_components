# Admin PWA（手機後台 PWA 模板）

給一兩個人用的「手機上的內部後台」：Safari 加入主畫面安裝（不經 App Store / TestFlight），Google 登入 + custom claim 守門，CI 寫進 Firestore 的素材即時出現在列表，有新項目時 Web Push 通知；詳情頁看圖卡、一鍵把全部圖存進相簿、一鍵複製文案、切換「未發 ⇄ 已發」。

| 層 | 路徑 | 技術 | 內容 |
|---|---|---|---|
| 前端模板 | [`pwa/`](./pwa/) | Vite 8 + React 19 + TS + Tailwind 4 + vite-plugin-pwa（injectManifest）+ Firebase Auth / Firestore / Messaging | 可整包複製成新專案：登入閘、推播設定頁、圖卡檢視器、存圖、複製、狀態開關、通用 Firestore hooks、示範 Shell，vitest |
| 推播（Functions 版） | [`server/functions/`](./server/functions/) | Cloud Functions v2 (TS) + firebase-admin | `requireAdmin`（callable 守門）、`createOnKitCreated`（Firestore onCreate → FCM，失效 token 即刪），vitest |
| 推播 + 寫入（CI 版） | [`server/ci/`](./server/ci/) | Node CommonJS + firebase-admin | `initAdmin`（env 讀服務帳號 JSON 或路徑）、`publishDoc`（transaction merge、保留指定欄位與 createdAt）、`sendPush`（發給所有 device、失效 token 即刪），node:test |
| 權限 | [`server/firestore.rules.snippet`](./server/firestore.rules.snippet)、[`server/set-admin.mjs`](./server/set-admin.mjs) | Firestore rules / Node | `admin/**` 只給 `admin: true` claim；授予 / 撤銷 claim 的腳本 |
| 設計 | [`DESIGN.md`](./DESIGN.md) | — | 為何 PWA、為何 Firebase、路徑慣例、claim 模式、推播兩種送法 |

**來源**：MewGuard 的 MewAdmin（`MewGuard/mewadmin/`，設計 `MewGuard/docs/plans/2026-10-18-mewadmin-pwa-design.md`），推播 Function 取自 `cat_toxin_app/functions/src/admin/push.ts`、`requireAdmin.ts`，claim 腳本取自 `cat_toxin_app/functions/scripts/set-admin.mjs`，CI 寫入範本取自 `social/lib/publish-kit.js`、`social/lib/firestore.js`。2026-10-19 抽取並去品牌化；MewAdmin 本身未改。第一個使用者是 hejdanmark 的 HDAdmin（`hejdanmark/docs/plans/2026-10-19-hdadmin-design.md`）。未收錄來源中的業務頁面（各類 kit 頁、研究留言、優惠碼、待辦）與底部 tab 列。

---

## 架構

```
iPhone 主畫面 PWA（pwa/）
   │ Firebase Auth：Google；standalone → signInWithRedirect，瀏覽器分頁 → popup
   │ ID token 必須帶 custom claim admin: true（server/set-admin.mjs）
   ├─ Firestore onSnapshot  admin/<你的集合>/…           ← useCollection / useDoc
   ├─ Firestore write       status / postedAt / postedBy  ← StatusToggle + setPosted()
   └─ FCM token             admin/pushTokens/devices/{token}（uid、email、platform、userAgent、createdAt、lastSeenAt）
Firebase Hosting   dist/，SPA rewrite，sw.js no-cache；authDomain = Hosting 網域（同源）
寫入端（二選一，可並存）
   A. CI（GitHub Actions 等）：server/ci  publishDoc() → created 才 sendPush()       ← 不需 Functions，Spark 免費方案即可
   B. Cloud Functions：server/functions  createOnKitCreated()（onCreate 觸發推播）    ← 需 Blaze 方案
```

- 推播一律送 `notification` 區塊 + `webpush.fcmOptions.link`，由 Messaging SDK（`src/sw.ts`）顯示與處理點擊。**SW 內不要再 `showNotification`，否則每則通知出現兩次。**
- App 開著且在前景時，SDK 把訊息交給頁面（`useForegroundMessages` → `Toast`），**不會**跳系統通知。
- 只在文件**新建**時推播：CI 的重發（merge 進既有文件）不推；Functions 版本身只在 onCreate 觸發。

---

## 從零建一個新的 admin PWA（checklist）

以下 `<project>` = Firebase 專案 id、`<site>` = Hosting 站名（`<site>.web.app`）。

### 1. Firebase 專案

1. `firebase projects:create <project>`（或 console 建）。只走 CI 推播的話 Spark 免費方案即可；要用 `server/functions` 需升 Blaze。
2. Console → Build → **Firestore** 建資料庫（production mode）。
3. Console → Project settings → Your apps → **新增 Web app**，拿到 web config。
4. 一個專案多個 Hosting 站時：`firebase hosting:sites:create <site>`。

### 2. 複製前端模板

```bash
cp -R modules/admin-pwa/pwa <repo>/<name>admin && cd <repo>/<name>admin
rm -rf node_modules dist                     # 若有
cp .env.example .env                         # 填第 1 步的 web config；VITE_FIREBASE_AUTH_DOMAIN=<site>.web.app
cp .firebaserc.example .firebaserc           # your-project-id → <project>，your-hosting-site → <site>
npm install && npm test && npm run build
```

- **只改 `src/brand.ts`**：`name`、`shortName`、`themeColor`、`backgroundColor`、`lang`、`locale`、`storageKey`（localStorage 前綴）、`devicesPath`、`strings`（覆寫 `src/strings.ts` 任一字串）。manifest、`index.html` 的 title / theme-color、header 字標都從這裡讀。
- 顏色 / 字體：改 `src/theme.css` 的 token 值（名稱別改）；`--color-primary` 與 `brand.themeColor`、`--color-paper` 與 `brand.backgroundColor` 保持一致。
- 圖示：換掉 `public/icons/` 四張 PNG（192、512、512 maskable、180 apple-touch）。現在是藍底白圓的佔位圖。
- 頁面：`src/App.example.tsx` 是示範（列表 + 詳情 + 設定），改名成 `App.tsx`、改 `main.tsx` 的 import，再把 `Item` 型別、`ITEMS_PATH` 與兩個頁面換成自己的。
- 要呼叫 callable Functions：`src/firebase.ts` 底部有 `getFunctions` 的註解範例。
- `.env` 的 web config 是公開值，可以 commit（存取靠 Auth + rules）；`.firebaserc` 在 `.gitignore` 裡，要 commit 就從 `.gitignore` 移掉。

### 3. Firestore rules

把 [`server/firestore.rules.snippet`](./server/firestore.rules.snippet) 貼進 `firestore.rules`（放在 catch-all deny 之前），並在前端專案的 `firebase.json` 加上 `"firestore": { "rules": "firestore.rules" }` 或從既有的 rules 專案部署：

```bash
npx firebase deploy --only firestore:rules --project <project>
```

### 4. Google 登入與同源 authDomain

1. Console → Authentication → Sign-in method → 啟用 **Google**。
2. Authentication → Settings → **Authorized domains** → 加 `<site>.web.app`。
3. Google Cloud console → APIs & Services → Credentials → Firebase 自動建立的 Web OAuth client（"Web client (auto created by Google Service)"）→ **Authorized redirect URIs** → 加 `https://<site>.web.app/__/auth/handler`。因為 `authDomain` 不是預設的 `<project>.firebaseapp.com`，不加這條 redirect 登入會失敗。
4. `.env` 的 `VITE_FIREBASE_AUTH_DOMAIN=<site>.web.app`。Hosting 內建 `/__/auth/*` 代理，所以同源 redirect 才能在 iOS 主畫面 PWA 裡完成。

### 5. Web Push（VAPID）

Console → Project settings → **Cloud Messaging** → Web Push certificates → **Generate key pair** → 公鑰填 `.env` 的 `VITE_FIREBASE_VAPID_KEY`（公開值）。沒填時設定頁顯示「尚未設定 VAPID key」且開關停用。

### 6. 推播送出端

**A. CI（無 Functions）**：

```bash
cp modules/admin-pwa/server/ci/admin-firestore.js <repo>/scripts/lib/
# 該 scripts 的 package.json 加 "firebase-admin": "^13.0.0"
```

```js
const { initAdmin, publishDoc, sendPush, DEFAULT_PRESERVE } = require('./lib/admin-firestore');

if (!initAdmin()) { console.log('skipped: no FIREBASE_SERVICE_ACCOUNT'); process.exit(0); }
const { created } = await publishDoc('admin/kits/<kind>', id, doc, {
  preserve: [...DEFAULT_PRESERVE, 'metrics', 'notes'],   // PWA 端會寫的欄位都列進來
});
if (created) await sendPush({ title, body, link: `https://<site>.web.app/items/${id}`, tag: id });
```

- 服務帳號：Console → Project settings → Service accounts → Generate new private key。CI secret 放整個 JSON（`FIREBASE_SERVICE_ACCOUNT`）；本機可放檔案路徑（同一個變數，或 `FIREBASE_ADMIN_KEY_PATH` / `GOOGLE_APPLICATION_CREDENTIALS`）。變數名可用 `initAdmin({ envVars: ['MY_SECRET'] })` 改。
- `doc.createdAt` 給 `Date`（或省略 → now）；文件不得含 `undefined`（`publishDoc` 會自動剝掉）。
- `link` 必須是絕對 https URL，否則 FCM 拒絕。

**B. Cloud Functions**：`server/functions/src/*.ts` 複製進 `functions/src/admin/`：

```ts
// functions/src/index.ts
import { createOnKitCreated } from './admin/onKitCreated';
export const onKitCreated = createOnKitCreated({
  document: 'admin/kits/{kind}/{id}',
  notify: ({ kind, id }, data) => ({
    title: '新項目',
    body: typeof data.title === 'string' ? data.title : id,
    link: `https://<site>.web.app/items/${id}`,
    tag: `${kind}-${id}`,
  }),
});
```

`requireAdmin(request)` 放在每個 admin callable 開頭。兩種送法的裝置路徑預設都是 `admin/pushTokens/devices`，改了要和 `brand.devicesPath` 一致。

### 7. 授予 admin claim

1. 對方先開 app 用 Google 登入一次（會看到「此帳號無權限」）。
2. 把 `server/set-admin.mjs` 放到有 `firebase-admin` 依賴的資料夾（例如上面的 scripts 或 functions），執行：
   `FIREBASE_ADMIN_KEY_PATH=/abs/sa.json node set-admin.mjs <email>`（撤銷加 `--revoke`，會一併 revoke refresh tokens）。
3. 對方關掉重開 app 即可，不必登出：登入閘發現快取 token 沒有 claim 時會強制 refresh。

### 8. Hosting 部署

```bash
npm run build
npx firebase deploy --only hosting:admin --project <project>
```

`firebase.json` 用 hosting target `admin`（對應 `.firebaserc` 的站），SPA rewrite 到 `index.html`，`sw.js` 與 HTML `no-cache`、`/assets/**` immutable。

### 9. 手機安裝與實收

Safari 開 `https://<site>.web.app` → 分享 → **加入主畫面** → 一律從主畫面圖示開 → 右上齒輪（設定）→ **開啟通知** → 允許。然後讓 CI 寫一筆**新**文件，確認收到推播、點開進到詳情頁。

---

## 介面速查

| 檔案 | 匯出 |
|---|---|
| `src/brand.ts` | `brand: BrandConfig`（唯一要改的檔） |
| `src/strings.ts` / `src/i18n.ts` | `defaultStrings`、`UiStrings`；`t`（defaults + `brand.strings`） |
| `src/auth/` | `AuthGate`、`useAdminUser()` → `{ status, user, email, error, signIn, signOut, retry }`、`useAdminContext()`、`AdminUserContext`、`Wordmark`、`describeAuthError`、`ADMIN_CLAIM` |
| `src/data/firestoreHooks.ts` | `useCollection<T>(path \| null, { orderBy?, direction? = 'desc', limit? = 50 })` → `{ items, loading, error }`；`useDoc<T>(collectionPath, id \| null)` → `{ doc, loading, error, missing }`；`newestFirst(items, key)`；`formatTimestamp(ts, locale?)` |
| `src/kit/` | `KitViewer({ slides })`、`Caption({ text, title?, copyLabel? })`、`CopyButton({ text, label?, ariaLabel?, className? })`、`DownloadAllButton({ kitId, slides, shareTitle? })`、`saveKitImages(kitId, slides, { onProgress?, title?, fetchImpl?, nav? })`、`StatusToggle({ on, onToggle(next), onError?, labels? })`、`isPosted` / `postedFields` / `setPosted(collectionPath, id, next, by)`、`Loading` / `ErrorNotice` / `Empty` / `BackLink`、`ErrorBoundary`、`usePullToRefresh` / `pullLabel`、`whoName`、`Slide` |
| `src/push/` | `enablePush` / `refreshPush` / `disablePush` / `removeDevice` / `useMyDevices` / `isPushSupported` / `isStandalone` / `permissionState` / `getVapidKey` / `describePushError` / `DEVICES_PATH`；`Settings`（預設匯出）；`InstallHint`；`Toast({ toast, onDismiss, bottom? })`；`useForegroundMessages(onToast)` |
| `server/ci/admin-firestore.js` | `initAdmin`、`publishDoc`、`sendPush`、`buildMessage`、`loadServiceAccount`、`credentialFromEnv`、`stripUndefined`、`truncate`、`DEFAULT_PRESERVE`、`DEFAULT_DEVICES_PATH` |
| `server/functions/src/` | `requireAdmin`、`createOnKitCreated`、`notifyDevices`、`sendToTokens`、`buildMessage`、`truncate` |

**相對來源刻意改掉的介面**：

- `StatusToggle` 不再寫死來源的 kit 集合路徑、也不讀 auth context：改成受控元件 `{ on, onToggle(next) => Promise }`，寫入交給呼叫端（通常是 `setPosted(path, id, next, email)`）。`labels` 可換「未發 / 已發」。
- `useKits(type)` / `useKit(type, id)` → 通用 `useCollection(path, opts)` / `useDoc(path, id)`，`path` / `id` 傳 `null` 表示「還不訂閱」。
- `saveKitImages` 的分享標題由 `title` 選項決定（預設 kit id），不再寫死品牌名。
- `Caption` 可傳 `title`、`copyLabel`（同頁有兩段可複製文字時用）。
- `Toast` 的位置用 `bottom` prop（預設貼底；有 tab 列時自己抬高）。
- `isStandalone` 移到 `push/standalone.ts`（`push.ts` 仍 re-export），登入 hook 不必載入 messaging。
- `firebase.ts` 不再匯出 `functions`；`projectId` 從 `VITE_FIREBASE_PROJECT_ID` 讀。
- 伺服器端推播 `kitNotification(type, …)` 改成由呼叫端給 `notify()` / `{ title, body, link }`；裝置清單直接讀 `devicesPath` 集合（原本是 `collectionGroup('devices')` 再過濾前綴）。

---

## 驗證（2026-10-19 抽取時，在模組目錄內跑）

| 位置 | 指令 | 結果 |
|---|---|---|
| `pwa/` | `npm install && npm test` | vitest 5.0.5：14 files、**99 tests pass** |
| `pwa/` | `npm run lint` | oxlint 1.88.0：48 files、0 warnings / 0 errors |
| `pwa/` | `cp .env.example .env && npm run build` | `tsc -b` 通過；vite 8.3.4 build 成功，`dist/sw.js` injectManifest precache 8 entries；`index.html` / `manifest.webmanifest` 已由 `brand.ts` 填入 |
| `server/functions/` | `npm install && npx tsc --noEmit && npm test` | tsc 通過；vitest：2 files、**19 tests pass**（firebase-functions 6.6.0、firebase-admin 13.10.0） |
| `server/ci/` | `npm install && npm test` | node:test（Node 26）：**16 tests pass** |

測試不讀 `.env`：`vite.config.ts` 的 `test.env` 給 Firebase 佔位值。抽取後已刪 `node_modules/` 與 `dist/`，重新驗證前先 `npm install`。

---

## 已知限制

- **iOS 登入**：主畫面 PWA 內 popup 不可靠，只能 `signInWithRedirect`，而 redirect 需要頁面與 `authDomain` 同源（第 4 步）。瀏覽器分頁則反過來：iPhone 瀏覽器在跳到 accounts.google.com 來回時常丟 sessionStorage（"missing initial state"），所以分頁預設 popup，被擋才退回 redirect。本機 `npm run dev` 只能用 popup 登入。
- **iOS 推播**：iOS 16.4+，且只有從主畫面開啟的 PWA 才收得到；Safari 分頁裡 `PushManager` 不存在，設定頁會顯示「需要先加入主畫面」。前景時只有 toast、沒有系統通知。
- **PWA storage 被清**：iOS 會在 PWA 長時間未用後清掉 site data。本裝置 token 記在 `localStorage`（`<storageKey>.pushToken`），被清後 app 不知道這台開過通知、也不會自動 refresh——到設定再按一次「開啟通知」（權限仍在，不會再跳詢問）。每次啟動 `refreshPush` 會更新 `lastSeenAt` 並處理 FCM 換 token（舊文件即刪）。
- **Service worker 未就緒**：`navigator.serviceWorker.ready` 在沒有 SW 時永不 resolve，註冊等 8 秒就放棄並提示重開 app。
- **存圖需要 CORS**：`saveKitImages` 用 `fetch` 取圖再交給分享表單，圖片主機（Firebase Storage、R2、Pages…）必須對 PWA 的網域回 CORS `GET`。iOS 若 fetch 太久會失去使用者手勢，第二次點擊即可（圖已快取）。桌面瀏覽器不支援分享檔案時改逐張下載。
- **推播去重**：重送的 onCreate 事件或 CI 重跑可能推兩次；給 `tag` 讓同一項目的通知互相取代。
- 規則只有一層：有 claim 的人可讀寫整個 `admin/**`；需要更細的權限要自己拆 rules。
- `onKitCreated` 的 trigger 本身沒有 emulator 測試，只測了純函式與 `notifyDevices`（假 db / messaging）。推播與存圖只能實機驗。
