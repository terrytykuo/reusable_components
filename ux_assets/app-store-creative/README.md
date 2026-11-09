# App Store「標題和搜尋結果」創意素材（MewGuard）

iOS 27 App Store 的 **產品頁 header／搜尋結果卡片** 創意素材。一張 universal 圖同時用在兩個位置；英文、繁體中文各一張。選填的行銷素材，可隨版本送審，也可日後從「素材庫」單獨送審，不需新 build。

## 成品（`out/`）

| 檔案 | 尺寸 | 比例 | 用途 |
|---|---|---|---|
| `mewguard-universal-5244x2950-en.png` | 5244×2950 | 16:9 | **主要上傳檔**（英文）— header 與搜尋結果共用 |
| `mewguard-universal-5244x2950-zh-TW.png` | 5244×2950 | 16:9 | **主要上傳檔**（繁體中文） |
| `mewguard-header-3840x1646-en.png` | 3840×1646 | 21:9 | 備用：只給產品頁 header（英文） |
| `mewguard-header-3840x1646-zh-TW.png` | 3840×1646 | 21:9 | 備用：只給產品頁 header（繁體中文） |

全部 PNG、8-bit RGB、**無 alpha**（Apple 規定不可含透明），尺寸由 `build.mjs` 逐張驗證。
`out/preview/*-guides.png` 是 25% 縮圖，疊上 Apple 的 Art Safe Area（綠框）與 universal 圖的兩個裁切框（21:9 header、3:2 搜尋結果），給檢視用，**不要上傳**。

## 構圖與規範

- **一個概念**：手繪虎斑貓（app 預設 avatar，Terry 原稿 `assets/cat-avatar/hand-drawn/tabby.svg`）＋一句話。
  英文 *Toxin lookup & daily care, in one place.*（Playfair Display SemiBold，app 的 heroTitle 字型）；
  繁中「查毒物／記照護」（PingFang TC Semibold，與 app 在 iOS 上的中文字型一致）。
- **品牌色**：底色 forest green `#17834B → #146B3C`（`constants/theme.ts` 的 green600／green700），白字；貓後方兩層半透明白圓是 app 貓 avatar 圓形底座的變體。
- **安全區**（取自 Apple 官方 Sketch／Photoshop 樣板的「Art Safe Area」圖層，2026-11-09 下載）：

  | 畫布 | Art Safe Area | 位置 |
  |---|---|---|
  | universal 5244×2950 | 1402×962 | x 1921–3323，y 660–1622（水平置中、偏上） |
  | header 3840×1646 | 1646×661 | x 1097–2743，y 493–1154（置中） |

  文字與貓臉完全在安全區內；底色與貓身向外出血（Apple 範例也是臉在框內、身體出框）。
  universal 圖會被裁成 21:9（上下各切 351 px）與 3:2（左右各切 410 px），所有可見元素都在兩個裁切框內。
- **沒有**價格、折扣、網址、版權符號、獎項、他平台 logo；內容符合 4+。
- Apple 規範頁：<https://developer.apple.com/app-store/asset-best-practices/>；
  規格：<https://developer.apple.com/help/app-store-connect/reference/app-information/creative-assets-specifications>；
  樣板：<https://developer.apple.com/go/?id=creative-assets>（Sketch 版可直接解 zip 讀 JSON 取座標）。

## 上傳步驟（Terry 手動）

1. App Store Connect → 我的 App → **MewGuard** → 左側選 **2.2.0 版本頁**（或 App 層級的 **素材庫 / Asset Library**，可獨立送審）。
2. 捲到 **「標題和搜尋結果」** 區塊 → 右上語系切到 **英文** → 上傳 `out/mewguard-universal-5244x2950-en.png`。
3. 語系切到 **繁體中文** → 上傳 `out/mewguard-universal-5244x2950-zh-TW.png`。
4. 用區塊內的 **預覽** 工具分別看「產品頁 header」與「搜尋結果」兩種呈現；若 header 想要不同裁切，改傳同語系的 `header-3840x1646` 版本（每個語系只能有 1 個標題素材）。
5. 儲存 → 隨版本一起送審，或從素材庫單獨送審。核准後會出現在 iOS 27／iPadOS 27 的 App Store。

## 重新產生

```bash
node ux_assets/app-store-creative/build.mjs                       # 四張成品 + 四張 guides 預覽
node ux_assets/app-store-creative/build.mjs --only universal --lang zh-TW
APP_DIR=/path/to/cat_toxin_app CHROME=/path/to/chrome node ux_assets/app-store-creative/build.mjs
```

需求：macOS（PingFang TC 與 `sips`）、Google Chrome（預設 `/Applications/Google Chrome.app`）、
`cat_toxin_app` checkout 且已 `npm install`（讀 `assets/cat-avatar/hand-drawn/tabby.svg` 與
`node_modules/@expo-google-fonts` 的 Playfair Display／DM Sans 字型；字型以 base64 內嵌進頁面）。
腳本只讀 app repo，不寫入。

- `template.html`：版面與樣式，雙大括號佔位符由 `build.mjs` 填入。
- `build.mjs`：`VARIANTS`（畫布、安全區、裁切框、每個變體的字級／貓位置）、`COPY`（文案、字型）。改文案或位置只動這兩個物件。
- `build/`：中間產物 HTML（git 忽略）。

## 文案替換規則

一句話、短、每個語系自己寫（不逐字翻）。`\n` 是強制換行。英文三行各不超過 ~13 字元才塞得進安全區；中文一行 3 字、兩行。
