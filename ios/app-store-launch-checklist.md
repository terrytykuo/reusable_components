# iOS App Store 上架清單（可復用）

把一個 iOS app 從「程式能跑」推到「能送審上架」需要做的事。功能完整 ≠ 能上架——下面這些是與功能無關、但少了就會被 Archive 擋下或被審查退件的項目。每個專案開新 app 時照這份逐項打勾。

> 來源：`onmyway`（順路 EnRoute）首次上架時整理。MVP 程式碼齊全，但缺以下資產而無法送審。

---

## 🔴 硬性阻擋（缺了連 Archive / 上傳都過不了）

### 1. App Icon
- 需要一張 **1024×1024 px、無透明通道、無圓角**（圓角由系統加）的圖。
- 建在 `Assets.xcassets` 的 `AppIcon` set，Xcode 14+ 只要放 1024 單張，其餘尺寸自動產生。
- 確認 build setting `ASSETCATALOG_COMPILER_APPICON_NAME = AppIcon`（**不可為空字串**）。
- 檢查：專案若完全沒有 `.xcassets`，這項一定缺。
```bash
find . -name "*.xcassets" -not -path "*/build/*"   # 應該要找得到
```

### 2. 簽章 Team（DEVELOPMENT_TEAM）
- 需要**付費** Apple Developer Program 帳號（US$99/年）。免費帳號無法上架。
- Xcode → Target → Signing & Capabilities → 勾 Automatically manage signing → 選你的 Team。
- `project.pbxproj` 裡 `CODE_SIGN_STYLE = Automatic` 但若沒 `DEVELOPMENT_TEAM`，Archive 會失敗。

### 3. Bundle Identifier
- 不能用 placeholder（如 `com.example.app`、`com.<產品>.app`）。
- 改成你擁有的反向網域，例：`com.<你的名字或組織>.<產品>`。
- 必須先在 App Store Connect 註冊這個 App ID 才能建 app 紀錄。
- 確認 Debug / Release 兩個 config 的 `PRODUCT_BUNDLE_IDENTIFIER` 一致。

---

## 🟠 審查高風險（背景定位 / 隱私類 app 特別會被盯）

### 4. 隱私政策頁（Privacy Policy URL，必填）
- App Store Connect 對「蒐集任何資料」的 app 強制要求一個公開可達的隱私政策 URL。
- 用 **GitHub Pages 免費掛**即可：開 public repo → 放 `index.html` 或 `privacy.md` → Settings → Pages → 取得網址。
- 內容至少要講：蒐集什麼資料、用途、是否上傳/分享、是否本機保存、聯絡方式。
- 同時要在 App Store Connect 填 **Privacy Nutrition Label**（App 隱私問卷）。
- 背景「永遠定位」(`NSLocationAlwaysAndWhenInUse` + `UIBackgroundModes: location`) 是審查最嚴格的類別之一，`Info.plist` 的 usage 字串要清楚講「為什麼非要背景定位不可」與「資料是否上傳」。

### 權限失效引導（功能可靠度，非資產但會被 ding）
- 若核心功能依賴某權限（定位/通知/相機），使用者**拒絕後**不能讓功能靜默失效。
- 主畫面要常駐提示「核心權限未開啟，功能無效」並提供前往設定的入口。
- Apple 會以「功能在無權限時形同無效 / 誤導」為由退件。

---

## 🟡 送審前要在 App Store Connect 備齊的 metadata

- [ ] **App 截圖**：至少 6.7" iPhone（必備）；若支援 iPad 要另附 iPad 尺寸。
- [ ] App 名稱、副標題、描述、關鍵字
- [ ] 分類（Primary / Secondary Category）
- [ ] 年齡分級（Age Rating 問卷）
- [ ] 支援網址（Support URL，可與隱私政策同站）
- [ ] 行銷網址（選填）
- [ ] 測試帳號 / 審查備註（若 app 需要登入或特殊操作說明）

---

## 裝置與設定一致性檢查

### TARGETED_DEVICE_FAMILY
- `"1"` = iPhone only，`"2"` = iPad only，`"1,2"` = 兩者皆支援。
- **若宣告支援 iPad（含 `2`），審查員會真的用 iPad 測**——UI 必須在 iPad 上正常。
- 沒為 iPad 設計就**改成 `"1"`（iPhone only）**，最快、最不會因 iPad 版面問題被退。
- 注意 `Info.plist` 的 `UISupportedInterfaceOrientations~ipad` 別跟實際支援的裝置矛盾。

### 其他
- [ ] Release config 的 `IPHONEOS_DEPLOYMENT_TARGET` 設成你真的測過的最低版本。
- [ ] `MARKETING_VERSION`（如 1.0）與 `CURRENT_PROJECT_VERSION`（build number）已設定。
- [ ] 確認 `GENERATE_INFOPLIST_FILE` 與 `INFOPLIST_FILE` 設定不衝突。
- [ ] 真機實測核心流程（模擬器過 ≠ 真機過，geofence / 背景定位尤其需真機長時間驗證）。

---

## 送審流程（資產齊全後）

1. Xcode → 選 `Any iOS Device (arm64)` 為目標
2. Product → Archive
3. Organizer → Distribute App → App Store Connect → Upload
4. App Store Connect 建立 app 紀錄、填完上述 metadata、綁定該 build
5. Submit for Review

---

## 一頁速查表

| # | 項目 | 卡關層級 | 需要你提供 |
|---|------|---------|-----------|
| 1 | App Icon 1024² + `.xcassets` | 硬擋 | 一張 1024×1024 圖 |
| 2 | 付費帳號 + Xcode Team | 硬擋 | Apple Developer 帳號 |
| 3 | 正式 Bundle ID | 硬擋 | 你的反向網域 |
| 4 | 隱私政策 URL + 隱私問卷 | 審查擋 | 一個公開網頁（可 GitHub Pages） |
| 5 | TARGETED_DEVICE_FAMILY 對齊 | 審查擋 | 決定是否支援 iPad |
| — | 權限失效引導 | 審查擋 | 程式調整 |
| — | 截圖 / 描述 / 分級 metadata | 送審必填 | App Store Connect 內填 |
