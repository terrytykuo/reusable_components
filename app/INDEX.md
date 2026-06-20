# Reusable Components Index

跨 app 可復用的 React Native 功能元件庫。每個元件接受 `tokens` prop（對應 `.design/system.json` 格式），不傳時使用暖色系預設值。

---

## 型別定義

### `types/tokens.ts`
**說明**: `DesignTokens` 介面定義、`defaultTokens` 預設值（cat_toxin_app 暖色系）、`resolveTokens()` 合併工具函式。所有元件均依賴此檔案。

```ts
import systemJson from '.design/system.json';
import { resolveTokens } from './types/tokens';
const tokens = resolveTokens(systemJson); // 合併 system.json 與預設值
```

---

## auth/

### `auth/SocialAuthButtons.tsx`

**分類**: 認證
**依賴**: `react-native`（無外部 SDK 依賴，登入邏輯由外部傳入）

**Props**:
| Prop | 型別 | 必填 | 說明 |
|------|------|------|------|
| `onApplePress` | `() => Promise<void>` | 是 | Apple 登入邏輯 |
| `onGooglePress` | `() => Promise<void>` | 是 | Google 登入邏輯 |
| `appleAvailable` | `boolean` | 否 | Apple 按鈕是否顯示，預設 false（iOS only） |
| `appleLabel` | `string` | 否 | Apple 按鈕文字，預設 'Continue with Apple' |
| `googleLabel` | `string` | 否 | Google 按鈕文字，預設 'Continue with Google' |
| `error` | `string` | 否 | 錯誤訊息，非空時顯示在按鈕上方 |
| `tokens` | `Partial<DesignTokens>` | 否 | Design tokens |

**功能說明**:
Apple（黑底白字）+ Google（白底邊框）登入按鈕組合。不綁定任何特定 SDK，onApplePress 和 onGooglePress 的 Promise 生命週期自動管理 loading spinner 狀態。

Apple 按鈕只有在 `appleAvailable=true` 時才顯示，避免在 Android 或非 iOS 環境下出現。建議在 app 端用 `expo-apple-authentication.isAvailableAsync()` 判斷後傳入。

Google 按鈕固定顯示。建議搭配 `expo-auth-session` 的 `Google.useAuthRequest()` hook，在 useEffect 處理 response 後再呼叫 Firebase signIn。

**使用情境**: 任何有 Social Auth 的 app 登入頁面
**來源**: `cat_toxin_app/app/login.tsx`

---

### `auth/TestModeButton.tsx`

**分類**: 認證 / 開發工具
**依賴**: `react-native`

**Props**:
| Prop | 型別 | 必填 | 說明 |
|------|------|------|------|
| `onPress` | `() => Promise<void>` | 是 | Test mode、匿名登入或 QA shortcut 的執行邏輯 |
| `label` | `string` | 否 | 按鈕文字，預設 `'Skip - Test Mode'` |
| `disabled` | `boolean` | 否 | 額外 disabled 狀態，由外部畫面控制 |
| `visible` | `boolean` | 否 | 是否顯示，預設 `__DEV__`；false 時直接 return null |
| `tokens` | `Partial<DesignTokens>` | 否 | Design tokens |
| `style` | `StyleProp<ViewStyle>` | 否 | 額外樣式覆蓋 |

**功能說明**:
登入頁或測試入口用的 development-only 按鈕。預設在 production build 自動隱藏，只在 dev 環境 render；按下後會自行管理 loading spinner，避免重複點擊。樣式採用虛線外框與較低干擾的次要文字色，適合放在正式登入按鈕下方。

如果你的 app 在 production 還有其他來源可能誤觸 test mode，建議另外在實際 auth function 內再加一層 `if (!__DEV__) throw ...` 的 guard，避免只靠 UI 隱藏。

**使用情境**: QA 專用登入入口、匿名試玩模式、開發中的快速跳過登入
**來源**: `cat_toxin_app/app/login.tsx`, `cat_toxin_app/lib/auth.ts`

---

## subscription/

### `subscription/TrialBanner.tsx`

**分類**: 訂閱
**依賴**: `react-native`

**Props**:
| Prop | 型別 | 必填 | 說明 |
|------|------|------|------|
| `daysLeft` | `number` | 是 | 剩餘試用天數，<=0 時自動隱藏整個 banner |
| `onUpgradePress` | `() => void` | 是 | 點擊升級按鈕的 callback（通常導向 PaywallScreen） |
| `upgradeLabel` | `string` | 否 | 升級按鈕文字，預設 'Upgrade' |
| `tokens` | `Partial<DesignTokens>` | 否 | Design tokens |

**功能說明**:
頁面頂部的黃色通知條，顯示「Free trial: X days left」+ 右側升級 CTA 連結。`daysLeft <= 0` 時 return null，不佔空間。導航邏輯由 `onUpgradePress` callback 控制，不依賴 expo-router。

**使用情境**: 有 free trial 機制的 app，通常放在主頁面的 Header 下方
**來源**: `cat_toxin_app/components/TrialBanner.tsx`

---

### `subscription/PaywallScreen.tsx`

**分類**: 訂閱
**依賴**: `react-native-safe-area-context`

**Props**:
| Prop | 型別 | 必填 | 說明 |
|------|------|------|------|
| `plans` | `PaywallPlan[]` | 是 | 方案列表（id, label, price, savingsBadge?, highlighted?） |
| `onSelectPlan` | `(planId: string) => Promise<void>` | 是 | 購買邏輯，通常呼叫 RevenueCat purchasePackage |
| `onRestorePurchases` | `() => Promise<void>` | 是 | 恢復購買邏輯 |
| `title` | `string` | 否 | 頁面標題，預設 'Upgrade' |
| `subtitle` | `string` | 否 | 標題下方說明文字 |
| `loading` | `boolean` | 否 | true 時顯示 spinner（方案載入中） |
| `error` | `string` | 否 | 外部錯誤訊息 |
| `footerNote` | `string` | 否 | 底部說明文字（例如品牌承諾） |
| `tokens` | `Partial<DesignTokens>` | 否 | Design tokens |

**功能說明**:
訂閱方案選擇頁面，不依賴 RevenueCat SDK，方案資料由外部轉換後以 `PaywallPlan[]` 傳入。`highlighted` 方案顯示 primary 色邊框與淡色背景，`savingsBadge` 顯示小標籤（如 'Save 46%'）。內建 purchasing loading 與錯誤狀態管理。

搭配 RevenueCat 範例：
```ts
const plans = offerings.current?.availablePackages.map(pkg => ({
  id: pkg.identifier,
  label: pkg.product.title,
  price: pkg.product.priceString,
  highlighted: pkg.product.identifier.includes('annual'),
}));
```

**使用情境**: 任何有 IAP 訂閱機制的 app
**來源**: `cat_toxin_app/app/paywall.tsx`

---

## feedback/

### `feedback/FeedbackForm.tsx`

**分類**: 使用者參與
**依賴**: `react-native`；可選依賴 `firebase/firestore`（僅在未傳 onSubmit 時使用）

**Props**:
| Prop | 型別 | 必填 | 說明 |
|------|------|------|------|
| `onSubmit` | `(msg: string) => Promise<void>` | 否 | 自訂送出邏輯；傳入後 Firestore 不執行 |
| `firestoreCollection` | `string` | 否 | Firestore collection 名稱，預設 `'feedback'` |
| `userEmail` | `string \| null` | 否 | 附加到每筆記錄的 email |
| `placeholder` | `string` | 否 | 輸入框提示文字 |
| `successMessage` | `string` | 否 | 成功送出後的 Alert 訊息 |
| `tokens` | `Partial<DesignTokens>` | 否 | Design tokens |

**功能說明**:
多行文字輸入框 + 送出按鈕。支援兩種模式：
1. **自訂模式**（推薦）：傳入 `onSubmit`，可對接任何後端（Firebase、REST API、email）
2. **內建模式**：不傳 `onSubmit`，自動 lazy import firebase/firestore 並寫入指定 collection

內建 sending loading 狀態、成功 Alert、錯誤 Alert。UI 為極簡風格，可透過 tokens 完全自訂顏色與字型。

**使用情境**: 所有 app 的意見回饋功能，通常放在設定頁或帳號頁
**來源**: `cat_toxin_app/app/(tabs)/personal-account.tsx`

---

## ui/

### `ui/SearchBar.tsx`

**分類**: 輸入
**依賴**: `react-native`

**Props**:
| Prop | 型別 | 必填 | 說明 |
|------|------|------|------|
| `value` | `string` | 是 | 受控輸入值 |
| `onChangeText` | `(text: string) => void` | 是 | 值變化 callback |
| `placeholder` | `string` | 否 | 提示文字，預設 'Search...' |
| `icon` | `ReactNode` | 否 | 左側 icon（可傳入任何圖示元件） |
| `tokens` | `Partial<DesignTokens>` | 否 | Design tokens |

**功能說明**:
帶 focus 動畫的搜尋輸入框。focus 時邊框以 200ms 動畫從 border 色過渡到 primary 色；value 非空時右側顯示清除按鈕（✕）。圓角膠囊造型，高度固定 50。

**使用情境**: 任何需要搜尋/篩選的列表頁面
**來源**: `cat_toxin_app/components/SearchBar.tsx`

---

### `ui/ChipFilter.tsx`

**分類**: 篩選
**依賴**: `react-native`

**Props**:
| Prop | 型別 | 必填 | 說明 |
|------|------|------|------|
| `items` | `ChipItem<T>[]` | 是 | 篩選項目（key, label, icon?） |
| `selected` | `T` | 是 | 目前選中的 key |
| `onSelect` | `(key: T) => void` | 是 | 選擇 callback |
| `tokens` | `Partial<DesignTokens>` | 否 | Design tokens |

**功能說明**:
水平可捲動的圓角 chip 篩選列。支援泛型 `T extends string`，選中狀態以 primary 色邊框與淡色背景標示。可傳入 emoji icon 顯示在文字左側。

**使用情境**: 列表頁的分類篩選、標籤篩選
**來源**: `cat_toxin_app/components/CategoryFilter.tsx`

---

### `ui/StatusBadge.tsx`

**分類**: 資訊展示
**依賴**: `react-native`

**Props**:
| Prop | 型別 | 必填 | 說明 |
|------|------|------|------|
| `status` | `string` | 是 | 狀態 key |
| `statusMap` | `Record<string, StatusConfig>` | 是 | key → { label, color } 對應表 |
| `size` | `'sm' \| 'lg'` | 否 | 字型大小，預設 'sm' |
| `tokens` | `Partial<DesignTokens>` | 否 | Design tokens |

**功能說明**:
彩色圓點 + 標籤的狀態 badge，顏色與文字由外部 `statusMap` 定義，與 domain 完全解耦。`status` 不在 statusMap 中時不渲染（return null）。

範例 statusMap（cat_toxin_app 的 severity 用途）：
```ts
const SEVERITY_MAP = {
  low:      { label: 'Safe',         color: '#22C55E' },
  medium:   { label: 'Mildly Toxic', color: '#F59E0B' },
  high:     { label: 'Toxic',        color: '#EF4444' },
};
```

**使用情境**: 任何需要顯示狀態、等級、標籤的場景
**來源**: `cat_toxin_app/components/SeverityBadge.tsx`

---

### `ui/DescriptionBlock.tsx`

**分類**: 文字展示
**依賴**: `react-native`

**Props**:
| Prop | 型別 | 必填 | 說明 |
|------|------|------|------|
| `text` | `string` | 是 | 顯示文字 |
| `maxLines` | `number` | 否 | 收合時最多行數，預設 6 |
| `showMoreLabel` | `string` | 否 | 展開按鈕文字，預設 'Show more' |
| `showLessLabel` | `string` | 否 | 收合按鈕文字，預設 'Show less' |
| `tokens` | `Partial<DesignTokens>` | 否 | Design tokens |

**功能說明**:
可展開/收合的長文字區塊。使用隱藏的測量 Text（`opacity: 0`）取得實際行數，超過 `maxLines` 時顯示「Show more」按鈕。測量完成後移除隱藏元素，不影響佈局。

**使用情境**: 詳情頁的描述文字、商品說明、任何可能過長的文字內容
**來源**: `cat_toxin_app/app/detail/[id].tsx` DescriptionBlock

---

### `ui/HeroImageCarousel.tsx`

**分類**: 媒體展示
**依賴**: `expo-image`, `react-native-gesture-handler`

**Props**:
| Prop | 型別 | 必填 | 說明 |
|------|------|------|------|
| `images` | `string[]` | 是 | 圖片 URI 陣列；空陣列顯示「No image」佔位 |
| `height` | `number` | 否 | 高度，預設 320 |
| `width` | `number` | 否 | 寬度，預設螢幕寬度 |
| `onBack` | `() => void` | 否 | 返回按鈕 callback；不傳則不顯示返回按鈕 |
| `tokens` | `Partial<DesignTokens>` | 否 | Design tokens |

**功能說明**:
全寬橫向圖片輪播。使用 `react-native-gesture-handler` 的 ScrollView 確保 Android paging 正常。圖片數 >= 2 時顯示底部 dots 指示器（白點）。使用 `expo-image` 磁碟快取。

**使用情境**: 商品詳情頁、植物/動物詳情頁、任何需要多圖展示的頁面
**來源**: `cat_toxin_app/app/detail/[id].tsx` Hero Image Carousel

---

### `ui/UserProfileHeader.tsx`

**分類**: 帳號
**依賴**: `expo-image`

**Props**:
| Prop | 型別 | 必填 | 說明 |
|------|------|------|------|
| `name` | `string` | 是 | 顯示名稱 |
| `email` | `string` | 否 | Email，不傳則不顯示 |
| `avatarUri` | `string` | 否 | 頭像圖片 URI；不傳時顯示名稱首字母圓形佔位 |
| `avatarSize` | `number` | 否 | 頭像尺寸，預設 120 |
| `tokens` | `Partial<DesignTokens>` | 否 | Design tokens |

**功能說明**:
帳號頁頂部的圓形頭像 + 名稱 + email 區塊，垂直置中排列。`avatarUri` 不傳時顯示 primary 色背景 + 名稱首字母大寫的佔位圓，避免破版。

**使用情境**: 帳號頁、個人資料頁
**來源**: `cat_toxin_app/app/(tabs)/personal-account.tsx` profileSection

---

### `ui/NumberedStepsList.tsx`

**分類**: 資訊展示
**依賴**: `react-native`

**Props**:
| Prop | 型別 | 必填 | 說明 |
|------|------|------|------|
| `steps` | `Step[]` | 是 | 步驟陣列（title, description?） |
| `title` | `string` | 否 | 區塊標題 |
| `tokens` | `Partial<DesignTokens>` | 否 | Design tokens |

**功能說明**:
帶 primary 色圓形數字編號的有序步驟列表。每步包含標題（必填）與說明文字（選填）。編號圓圈尺寸固定 24×24，數字白色。

**使用情境**: 操作步驟、食譜、安裝流程、治療步驟等有序說明
**來源**: `cat_toxin_app/app/detail/[id].tsx` TreatmentsSection

---

### `ui/DisclaimerNote.tsx`

**分類**: 法務
**依賴**: `react-native`

**Props**:
| Prop | 型別 | 必填 | 說明 |
|------|------|------|------|
| `text` | `string` | 是 | 免責聲明文字 |
| `boxed` | `boolean` | 否 | true 時顯示圓角外框，預設 false |
| `tokens` | `Partial<DesignTokens>` | 否 | Design tokens |

**功能說明**:
小字免責聲明。`boxed=false` 為純文字（置中對齊，textMuted 色）；`boxed=true` 加上圓角框線（surface 背景 + border 邊框），適合在內容區塊內使用。

**使用情境**: 登入頁底部說明、詳情頁醫療免責聲明、任何需要法律/免責文字的地方
**來源**: `cat_toxin_app/app/login.tsx`, `app/detail/[id].tsx`, `app/(tabs)/personal-account.tsx`

---

## hooks/

### `hooks/useAuth.ts`

**分類**: 認證 / 狀態
**依賴**: `react`, `firebase/auth`

**介面**:
| 參數 | 型別 | 必填 | 說明 |
|------|------|------|------|
| `auth` | `Auth` | 是 | Firebase Auth 實例（注入，見 `lib/firebase`） |

回傳 `{ user: User \| null; loading: boolean }`。

**功能說明**:
以 `onAuthStateChanged` 監聽 Firebase Auth 狀態，首次解析前 `loading=true`。**解耦**：`auth` 實例改為參數注入，不 import 任何專案的 firebase 設定；卸載時自動 unsubscribe。

**使用情境**: 任何用 Firebase Auth 的 app，做為登入狀態的單一來源；常被 `SubscriptionContext` 等上層消費。
**來源**: `cat_toxin_app/hooks/useAuth.ts`

---

### `hooks/useLayout.ts`

**分類**: 版面 / 響應式
**依賴**: `react-native`

**介面**（`UseLayoutOptions`，全部可選）:
| 參數 | 型別 | 預設 | 說明 |
|------|------|------|------|
| `tabletBreakpoint` | `number` | `768` | tablet 斷點寬度 |
| `contentMaxWidth` | `number` | `720` | 內容區最大寬度 |
| `phonePadding` | `number` | `20` | 手機水平 padding |
| `tabletPadding` | `number` | `48` | tablet 水平 padding |

回傳 `{ width, height, isTablet, pagePadding, contentMaxWidth }`。

**功能說明**:
基於 `useWindowDimensions` 的響應式 layout hook：偵測 tablet 斷點、輸出動態水平 padding 與內容最大寬度。**解耦**：斷點 / maxWidth / padding 全改為可選參數，未傳用預設值。

**使用情境**: 需要在手機與平板間調整邊距、置中限寬內容的頁面 layout。
**來源**: `cat_toxin_app/hooks/useLayout.ts`

---

## lib/

### `lib/firebase.ts`

**分類**: 基礎建設 / Firebase
**依賴**: `firebase/app`, `firebase/auth`, `firebase/firestore`, `firebase/functions`, `firebase/storage`, `@react-native-async-storage/async-storage`

**介面**: `createFirebase(config: FirebaseConfig, options?: { functionsRegion?: string }): FirebaseServices`

| 參數 | 型別 | 必填 | 說明 |
|------|------|------|------|
| `config` | `FirebaseConfig` | 是 | apiKey / authDomain / projectId / storageBucket / messagingSenderId / appId |
| `options.functionsRegion` | `string` | 否 | Cloud Functions region，預設 `'us-central1'` |

回傳 `{ app, auth, db, storage, functions }`。

**功能說明**:
RN + Firebase 初始化工廠。Auth 以 AsyncStorage 做 persistence，已初始化（hot reload）時 fallback 到 `getAuth`；重複呼叫重用既有 default app。**解耦**：env / config keys 改為傳入的 `config` 物件，元件庫不綁定任何 EXPO_PUBLIC_* 命名。

**使用情境**: app 啟動時建立並匯出單一 firebase 服務集合，供 `useAuth` / `SubscriptionContext` / `purchases` 等使用。
**來源**: `cat_toxin_app/lib/firebase.ts`

---

### `lib/purchases.ts`

**分類**: 訂閱 / IAP
**依賴**: `react-native-purchases`, `react-native`, `expo-constants`

**介面**（模組層 API，先 `configurePurchases()` 再使用）:
| 函式 | 說明 |
|------|------|
| `configurePurchases(config)` | 設定 iosApiKey / androidApiKey / premiumCacheTtlMs / customerInfoTimeoutMs |
| `initPurchases(uid)` | 依平台 configure + logIn；Expo Go / 缺 key 時跳過 |
| `checkPremium({ forceRefresh? })` | 回傳是否有 active entitlement（帶 TTL 快取與 in-flight 去重） |
| `invalidatePremiumCache()` | 清除快取 |
| `getOfferings()` / `purchasePackage(pkg)` / `restorePurchases()` | RevenueCat 直通（需 ready） |
| `isPurchasesReady()` | 是否已成功初始化 |

**功能說明**:
RevenueCat 封裝：初始化、premium 狀態快取（TTL）、`getCustomerInfo` timeout 保護、Expo Go 偵測（跳過 init）、log handler 過濾常見 offering 設定噪音。**解耦**：API keys、cache TTL、timeout 全改為 `configurePurchases()` 參數，不讀 env。

**使用情境**: 任何用 RevenueCat 的訂閱 app；搭配 `SubscriptionContext` 提供 premium 狀態。
**來源**: `cat_toxin_app/lib/purchases.ts`

---

## utils/

### `utils/pricing.ts`

**分類**: 訂閱 / 格式化
**依賴**: `react-native-purchases`（僅型別）

**介面**:
| 函式 | 說明 |
|------|------|
| `packagePrice(pkg, fallbackAmount)` | 取 package 有效價格，否則 fallback |
| `formatCurrency(amount, currencyCode?)` | Intl 貨幣格式化，失敗回 null |
| `getYearlySavingsPercent(monthly, yearly, monthlyFallback, yearlyFallback)` | 年方案相對「月×12」省下百分比（0–100） |
| `getMonthlyEquivalentString(yearly, yearlyFallback, fallbackText?)` | 年方案每月均價文字 |
| `getPlanPriceString(pkg, fallbackDisplay)` | 方案價格字串，無則 fallback |

**功能說明**:
訂閱定價工具：貨幣格式化（Intl）、年訂閱省比例、每月均價。**解耦**：零業務綁定，所有 fallback 價格 / 文案改由呼叫端傳入，不 hardcode 任何方案。

**使用情境**: paywall / 訂閱頁顯示價格、省比例徽章、每月均價。
**來源**: `cat_toxin_app/lib/pricing.ts`

---

### `utils/dates.ts`

**分類**: 工具 / 日期
**依賴**: 無

**介面**:
| 函式 | 說明 |
|------|------|
| `addDays(date, days)` | 回傳加上 days 天的新 Date（不改原物件，days 可為負） |
| `formatRelativeDate(date, reference?)` | Intl 格式化「月 日」；跨年時加年份 |

**功能說明**:
通用日期工具。`formatRelativeDate`（前身 `formatTrialDate`）以 `reference`（預設現在）決定是否顯示年份。零業務綁定。

**使用情境**: 試用 / 訂閱到期日、任何相對日期顯示。
**來源**: `cat_toxin_app/lib/trialDates.ts`

---

### `utils/avatarColor.ts`

**分類**: 工具 / 視覺
**依賴**: 無

**介面**: `avatarColor(seed: string | (string|null|undefined)[], palette?: string[]): string`

| 參數 | 型別 | 必填 | 說明 |
|------|------|------|------|
| `seed` | `string \| Array<string\|null\|undefined>` | 是 | 單一字串，或多段（trim、濾空後以 ':' 串接） |
| `palette` | `string[]` | 否 | 色盤，預設 `DEFAULT_AVATAR_PALETTE`（暖色系 12 色） |

**功能說明**:
由 seed 字串雜湊穩定對應到一個色盤顏色（相同 seed 恆得相同色）。**解耦**：由 `getCatAvatarColor` 改名為通用 `avatarColor`，palette 可傳入。

**使用情境**: 無頭像時依名稱 / id 產生穩定的頭像底色。
**來源**: `cat_toxin_app/lib/catAvatar.ts`

---

## context/

### `context/SubscriptionContext.tsx`

**分類**: 訂閱 / 狀態
**依賴**: `react`, `firebase/firestore`, `firebase/auth`；本庫 `lib/purchases`、`hooks/useAuth`

**Props**（`SubscriptionProviderProps`）:
| Prop | 型別 | 必填 | 說明 |
|------|------|------|------|
| `auth` | `Auth` | 是 | Firebase Auth 實例（來自 `createFirebase`） |
| `db` | `Firestore` | 是 | Firestore 實例（來自 `createFirebase`） |
| `defaultStatus` | `string` | 否 | 預設狀態，預設 `'free'` |
| `activeStatuses` | `readonly string[]` | 否 | 視為 premium 的狀態，預設 `['trial','active']` |
| `usersCollection` | `string` | 否 | 使用者文件 collection，預設 `'users'` |
| `statusField` | `string` | 否 | 狀態欄位名，預設 `'subscriptionStatus'` |
| `forcePremiumInDev` | `boolean` | 否 | dev 強制 premium（僅 `__DEV__`，亦尊重 `EXPO_PUBLIC_FORCE_PREMIUM`） |
| `onSyncStatus` | `() => Promise<{isPremium; subscriptionStatus}>` | 否 | 可選後端同步覆寫 |

`useSubscriptionContext()` 回傳 `{ isPremium, isTestMode, subscriptionStatus, isLoading, refresh }`。

**功能說明**:
整合 RevenueCat（`lib/purchases`）+ Firestore 使用者文件 listener + dev override 的訂閱狀態 Provider。在使用者變動 / 手動 refresh 時做 premium 檢查，並以 Firestore snapshot 即時同步狀態。**解耦**：`auth`/`db` 注入；dev override 改為 `forcePremiumInDev` prop；Firestore collection / 欄位 / 狀態值皆可設定；移除專案專屬 backend sync，改為可選 `onSyncStatus`。

**使用情境**: app 根層包住整個樹，供各頁面讀取 premium / 訂閱狀態並做 gating（搭配 `ui/FeatureGate`）。
**來源**: `cat_toxin_app/context/SubscriptionContext.tsx`

---

## ui/（新增）

### `ui/OnboardingSwipeView.tsx`

**分類**: 手勢 / 容器
**依賴**: `react`, `react-native`

**Props**:
| Prop | 型別 | 必填 | 說明 |
|------|------|------|------|
| `children` | `ReactNode` | 是 | 內容 |
| `onSwipeLeft` / `onSwipeRight` | `() => void` | 否 | 對應方向的 swipe callback |
| `disabled` | `boolean` | 否 | 停用手勢 |
| `intentDistance` | `number` | 否 | 攔截手勢前最小水平位移，預設 16 |
| `swipeDistance` | `number` | 否 | 判定 swipe 最小距離，預設 52 |
| `swipeVelocity` | `number` | 否 | 短滑速度門檻，預設 0.35 |
| `velocityMinDistance` | `number` | 否 | 短滑速度判定下最小距離，預設 28 |
| `style` | `StyleProp<ViewStyle>` | 否 | 容器樣式 |

**功能說明**:
以 `PanResponder` 偵測水平 swipe 的容器。只攔截水平意圖明顯（|dx| > |dy|×1.25）且有對應 handler 的手勢，避免吃掉垂直捲動。**解耦**：velocity / distance 門檻全部可參數化。

**使用情境**: onboarding 翻頁、卡片左右切換。
**來源**: `cat_toxin_app/components/OnboardingSwipeView.tsx`

---

### `ui/OnboardingBackButton.tsx`

**分類**: 導航 / 按鈕
**依賴**: `react-native`, `@expo/vector-icons`

**Props**:
| Prop | 型別 | 必填 | 說明 |
|------|------|------|------|
| `left` / `top` | `number` | 是 | 絕對定位座標 |
| `size` | `number` | 是 | 按鈕直徑（圖示為 0.68 倍） |
| `onPress` | `() => void` | 是 | 點擊 callback |
| `disabled` | `boolean` | 否 | 停用（半透明） |
| `icon` | `MaterialCommunityIcons` 名稱 | 否 | 預設 `'chevron-left'` |
| `tokens` | `Partial<DesignTokens>` | 否 | Design tokens |

**功能說明**:
絕對定位的圓形返回鈕，常疊在 onboarding / hero 圖上。**解耦**：背景 / 邊框 / 圖示色改由 tokens 推導（surface / border / text），沿用 tokens 慣例；位置與尺寸由 props 控制。

**使用情境**: 全螢幕 onboarding 流程、hero 圖上的返回入口。
**來源**: `cat_toxin_app/components/OnboardingBackButton.tsx`

---

### `ui/FeatureGate.tsx`

**分類**: 訂閱 / 升級
**依賴**: `react-native`, `@expo/vector-icons`

**Props**:
| Prop | 型別 | 必填 | 說明 |
|------|------|------|------|
| `onPress` | `() => void` | 是 | CTA callback（通常導向 paywall） |
| `icon` | `MaterialCommunityIcons` 名稱 | 否 | 主圖示，預設 `'home-heart'` |
| `title` | `string` | 否 | 標題，預設 `'Unlock this feature'` |
| `body` | `string` | 否 | 說明文字（不傳則不顯示） |
| `ctaIcon` | `MaterialCommunityIcons` 名稱 | 否 | CTA 圖示，預設 `'lock-open-variant'` |
| `ctaLabel` | `string` | 否 | CTA 文字，預設 `'See plans'` |
| `tokens` | `Partial<DesignTokens>` | 否 | Design tokens |

**功能說明**:
功能限制 / 升級提示卡片：大圖示 + 標題 + 說明 + CTA 按鈕，置中排版。圖示底圈使用 primary 的低透明度疊色。**解耦**：移除 expo-router 預設導航，`onPress` 改為必填 callback；文案 / 圖示可覆寫；顏色字型沿用 tokens 慣例。

**使用情境**: premium-only 分頁 / 區塊被 gate 時的升級畫面（搭配 `SubscriptionContext`）。
**來源**: `cat_toxin_app/components/MyPetsGate.tsx`
