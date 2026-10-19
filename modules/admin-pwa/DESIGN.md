# Admin PWA — 設計摘要

給「一到三個人、在手機上審素材 / 按發佈 / 收通知」的內部後台。這份是精簡版設計；套用步驟在 [README](./README.md)。

## 1. 決策

| 問題 | 決定 | 理由 |
|---|---|---|
| 發佈方式 | PWA，Safari「加入主畫面」 | 不經 App Store / TestFlight / 描述檔；MDM 管的公司手機也能裝。iOS 16.4+ 的主畫面 PWA 可收 Web Push |
| 後端 | Firebase：Auth + Firestore + Hosting + FCM | 四件事都內建：Google 登入與 custom claim、即時 `onSnapshot`（不必輪詢）、Hosting 同源 `/__/auth` 代理、Web Push（不必自己做 VAPID 加密）。Spark 免費方案就夠（推播由 CI 送時） |
| 被否決 | 共用 bearer token + Cloudflare Worker | token 外洩即全權、分不出誰操作；iOS Web Push 要自己實作加密；即時列表要自己輪詢 |
| 被否決 | Capacitor / Expo 原生殼 | 仍要 TestFlight / App Store |
| 登入 | Google + custom claim `admin: true` | 每人一帳號、可個別撤銷、`postedBy` 可追溯；加人不改程式，只跑 `set-admin.mjs` |
| 寫入端 | CI 用 Admin SDK 寫 Firestore（繞過 rules） | 素材本來就在 CI 產生；Firestore 只是給手機看的鏡像，git 內的檔案仍是紀錄 |
| 推播 | CI 寫入**新建**時直接發 FCM；或 Functions onCreate trigger | 沒有 Functions（Spark）的專案也能推；兩者都只在新建時推，重發不吵人 |

## 2. 登入流程

```
啟動 → onAuthStateChanged
  ├─ 無使用者 → 「使用 Google 登入」
  │     standalone（主畫面）→ signInWithRedirect（popup 在 iOS PWA 會開到另一個瀏覽器）
  │     瀏覽器分頁           → signInWithPopup（redirect 在 iPhone 瀏覽器常丟 sessionStorage）；被擋才退 redirect
  └─ 有使用者 → getIdTokenResult()；沒 claim 再 getIdTokenResult(true) 強制 refresh
        ├─ claims.admin === true → 進 app
        ├─ 沒 claim               → 「此帳號無權限」+ 登出
        └─ 取 token 失敗          → 「無法驗證身分」+ 重試（不誤判成無權限）
```

- `authDomain` 必須是 Hosting 網域（`<site>.web.app`），redirect 才同源；因此要把 `https://<site>.web.app/__/auth/handler` 加進 OAuth client 的 redirect URIs。
- claim 新增後不必登出：下次開 app 時快取 token 沒有 claim → 自動強制 refresh。撤銷時腳本同時 `revokeRefreshTokens`。
- 同一個 claim 名稱（`admin`）出現在三處：`AuthGate`（`ADMIN_CLAIM`）、`firestore.rules.snippet`、`requireAdmin.ts`。改名要三處一起改。

## 3. 資料路徑慣例

Firestore 路徑「集合 / 文件」交替，**集合路徑段數必為奇數**、文件路徑為偶數。所以所有東西掛在 `admin` 集合底下的一個「分組文件」下面：

```
admin/{group}/{collection}/{id}
  admin            集合
  kits             文件（分組，本身可以不存在）
  <kind>           集合
  {id}             文件

admin/pushTokens/devices/{token}       ← 推播裝置；token 當文件 id，uid 是欄位
```

- 一條 rules（`match /admin/{document=**}`）就涵蓋全部；client 的其他資料不受影響。
- 列表排序：CI 給一個字串排序鍵（ISO 日期或 id），前端 `newestFirst(items, key)`；只靠 `createdAt` 排序時，重發舊日期的項目會跳到最上面。
- **欄位擁有權**：CI 擁有內容欄位；PWA 擁有 `status`、`postedAt`、`postedBy`、`postedUrl`（以及專案自己加的，如 `metrics`、`notes`）。CI 以 `publishDoc(..., { preserve })` 在 transaction 內 merge：文件已存在時不寫 `createdAt` 與 `preserve` 欄位，所以重發不會蓋掉手機上的操作。陣列欄位會被整個取代。
- 文件不可含 `undefined`（Firestore 拒收）；`publishDoc` 會剝掉，但 builder 最好明確給 `null`。

## 4. 推播

```
PWA「開啟通知」（必須由點擊觸發）
  → Notification.requestPermission → getToken(vapidKey, 本 app 的 SW registration)
  → set admin/pushTokens/devices/{token} { uid, email, platform, userAgent, createdAt(僅首次), lastSeenAt }
每次啟動 refreshPush：之前開過且權限仍是 granted 才重註冊（更新 lastSeenAt、處理 token 輪替並刪舊文件）

送出端（CI sendPush 或 Functions onKitCreated）
  → 讀 devices 全部文件 → sendEachForMulticast（每批 500）
  → notification {title, body≤120 字} + webpush.fcmOptions.link + webpush.notification {icon, tag}
  → registration-token-not-registered / invalid-registration-token → 刪該文件
```

- SW 只初始化 Messaging，**不**自己 `showNotification`，也不設 navigation route（`/__/auth/*` 必須直達網路）。
- 前景訊息 → `useForegroundMessages` → `Toast`，點擊開 `link`（同源才導頁）。

## 5. 前端結構原則

- 品牌與字串只在 `src/brand.ts`（+ `src/strings.ts` 預設值）；`vite.config.ts` 從同一檔產生 manifest 與 `index.html` placeholder。
- 元件不碰業務路徑：`StatusToggle` 是受控元件（`on` + `onToggle(next)`），資料 hooks 吃 `path`。業務頁面放在專案自己的 `App.tsx`。
- 寫入後不做 optimistic update：畫面狀態由 `onSnapshot` 回來的資料決定，開關在寫入期間 disabled。
- 觸控目標 ≥ 44px（`min-h-11` / `size-11`），safe-area insets 已處理。
