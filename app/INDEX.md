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
