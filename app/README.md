# Reusable Components — app/

跨 app 可復用的 React Native 功能元件庫（Expo SDK）。

每個元件接受 `tokens` prop，格式對應 `.design/system.json`，不傳時使用內建暖色系預設值。

---

## 資料夾結構

```
app/
├── README.md                        ← 本文件
├── INDEX.md                         ← 每個元件的完整說明（最多 500 字）
│
├── types/
│   └── tokens.ts                    ← DesignTokens 介面 + resolveTokens()
│
├── hooks/
│   ├── useAuth.ts                   ← Firebase Auth 狀態監聽（auth 實例注入）
│   └── useLayout.ts                 ← 響應式 layout（tablet 斷點 / maxWidth / padding）
│
├── lib/
│   ├── firebase.ts                  ← createFirebase() 工廠（RN + AsyncStorage persistence）
│   └── purchases.ts                 ← RevenueCat 封裝（premium 快取 / timeout / Expo Go 偵測）
│
├── utils/
│   ├── pricing.ts                   ← 貨幣格式化 + 年訂閱省比例 + 每月均價
│   ├── dates.ts                     ← addDays() + formatRelativeDate()
│   └── avatarColor.ts               ← 由 seed 雜湊決定頭像顏色
│
├── context/
│   └── SubscriptionContext.tsx      ← isPremium / status / refresh() Context
│
├── auth/
│   ├── SocialAuthButtons.tsx        ← Apple + Google 登入按鈕（Firebase Auth）
│   └── TestModeButton.tsx           ← 僅在 dev 顯示的 Test Mode 按鈕
│
├── subscription/
│   ├── PaywallScreen.tsx            ← RevenueCat 方案列表 + 購買流程
│   └── TrialBanner.tsx              ← 試用期倒數 banner，帶 CTA 按鈕
│
├── feedback/
│   └── FeedbackForm.tsx             ← Firestore 寫入的 multiline 意見回饋
│
└── ui/
    ├── SearchBar.tsx                ← 動畫 focus 搜尋框 + 清除按鈕
    ├── ChipFilter.tsx               ← 水平捲動的分類篩選 chips
    ├── StatusBadge.tsx              ← 彩色圓點 + 標籤 badge
    ├── DescriptionBlock.tsx         ← 可展開/收合的長文字區塊
    ├── HeroImageCarousel.tsx        ← 圖片輪播 + dots 指示器 + 返回按鈕
    ├── UserProfileHeader.tsx        ← 頭像 + 名稱 + email 區塊
    ├── NumberedStepsList.tsx        ← 有編號圓圈的步驟列表
    ├── DisclaimerNote.tsx           ← 小字免責聲明框
    ├── OnboardingSwipeView.tsx      ← PanResponder 水平 swipe 偵測容器
    ├── OnboardingBackButton.tsx     ← 絕對定位圓形返回鈕
    └── FeatureGate.tsx              ← 功能限制 / 升級提示卡片
```

---

## 使用方式

1. 複製需要的元件檔案到新 app 的 `components/` 或對應目錄
2. 複製 `types/tokens.ts`
3. 傳入新 app 的 `.design/system.json` 作為 `tokens` prop

```tsx
import systemJson from '.design/system.json';
import { FeedbackForm } from './components/FeedbackForm';

<FeedbackForm
  tokens={systemJson}
  onSubmit={async (msg) => await myBackend.saveFeedback(msg)}
/>
```

詳細的 Props 說明與使用範例請見 [INDEX.md](./INDEX.md)。
