# Reusable Components Index — ios/

跨專案可復用的 SwiftUI / iOS 元件庫。所有元件已從 domain 模型解耦：Manager 以 callback / closure 注入行為，UI 元件以參數驅動。直接複製對應 `.swift` 檔案即可使用，僅依賴系統框架。

---

## location/

### `location/LocationManager.swift`

**分類**: 定位 / 背景監控
**依賴**: `CoreLocation`, `Combine`, `Foundation`

**介面/API**:
- `init(maxRegions: Int = 20, cooldownHours: Double = 4, cooldownFilename: String = "cooldowns.json")`
- `var regionsProvider: () -> [GeofenceRegion]`：外部注入，回傳目前要監控的地點清單。
- `var onRegionEntered: ((GeofenceRegion) -> Void)?`：進入某地點且不在 cooldown 內時觸發。
- `func requestAuthorization()`：兩段式權限請求（WhenInUse → Always）。
- `func syncMonitoredRegions()`：重新計算並套用要監控的 region。
- `@Published authorizationStatus: CLAuthorizationStatus`
- `@Published hitRegionLimit: Bool`：因上限未能全部監控時為 true。
- 附帶 `struct GeofenceRegion(id: String, latitude: Double, longitude: Double, radius: Double = 200)`：注入用的簡單地點 struct。

**功能說明**:
背景 geofence 管理器，使用系統的 region monitoring（低耗電）。已移除對 `Store.shared` 與 `NotificationManager.shared` 的硬引用。

使用流程：建立實例後，設定 `regionsProvider`（每次同步都會重新詢問，回傳 `[GeofenceRegion]`，地點來源由你的 domain 模型轉換而來），再設定 `onRegionEntered`（進入地點時要做什麼，例如發通知）。呼叫 `requestAuthorization()` 取得權限後會自動 `syncMonitoredRegions()`；資料變動時你也可手動呼叫。

iOS 同時最多監控 20 個 region（可由 `maxRegions` 調整）；超過上限時依與目前位置的距離排序，優先監控最近的，此時 `hitRegionLimit` 為 true 可供 UI 提示。cooldown（同地點 N 小時內不重複觸發）時數由 `cooldownHours` 設定，最近觸發時間以 JSON 持久化到 Documents。

**使用情境**: 任何需要「經過某地點時提醒」的 app（待辦、優惠券、打卡、安全圍欄）
**來源**: `onmyway/EnRoute/Managers/LocationManager.swift`

---

## notifications/

### `notifications/NotificationManager.swift`

**分類**: 本機通知
**依賴**: `UserNotifications`, `Foundation`

**介面/API**:
- `init(timePrefix: String = "time-", placePrefix: String = "place-", payloadKey: String = "payloadID")`
- `func requestAuthorization()` / `func refreshAuthStatus()`
- `func scheduleTimeReminder(id: String, title: String, body: String = "", at date: Date)`：排定單次時間提醒。
- `func cancelTimeReminder(id: String)`
- `func fireLocationNotification(title: String, body: String, payloadID: String? = nil)`：立即推播。
- `var onNotificationTapped: ((String) -> Void)?`：點擊帶 payloadID 的通知時觸發。
- `@Published authorized: Bool`

**功能說明**:
本機通知管理器，負責授權、時間提醒排程、即時地點提醒、前景顯示與點擊回調。已移除所有硬寫的中文文案與對 `Store.shared.complete()` 的引用。

所有通知的 title / body 改為呼叫端以參數傳入。每則通知可帶一個 `payloadID`（字串識別），存入 userInfo；使用者點擊通知時透過 `onNotificationTapped` callback 把這個字串回傳給你，由你決定行為（例如標記某筆待辦完成）。app 在前景時也會顯示通知（banner + sound + list）。

接法範例：`scheduleTimeReminder(id: todo.id.uuidString, title: "該辦：買牛奶", at: date)`，然後 `onNotificationTapped = { id in store.complete(id: id) }`。

**使用情境**: 任何需要本機提醒（時間排程或即時推播）的 app
**來源**: `onmyway/EnRoute/Managers/NotificationManager.swift`

---

## persistence/

### `persistence/JSONStore.swift`

**分類**: 持久化
**依賴**: `Foundation`

**介面/API**:
- `init(filename: String, encoder: JSONEncoder = .init(), decoder: JSONDecoder = .init())`
- `func load() -> T?`：讀取並解碼，失敗回傳 nil。
- `func save(_ value: T)`：編碼並寫入（best-effort，失敗靜默）。

**功能說明**:
泛型 `JSONStore<T: Codable>`，把任何 Codable 值持久化到 App 的 Documents 目錄。從原 `Store` 的 load / persist 邏輯抽出，乾淨可獨立使用，適合無帳號、無雲端的本機儲存。

可選傳入自訂 `encoder` / `decoder`（例如設定日期策略）。用法：
```swift
let store = JSONStore<[Place]>(filename: "places.json")
var places = store.load() ?? []
places.append(newPlace)
store.save(places)
```

**使用情境**: MVP 階段的本機資料儲存、設定檔、快取
**來源**: `onmyway/EnRoute/Models/Store.swift`（load / persist 概念）

---

## ui/

### `ui/PermissionRow.swift`

**分類**: UI / 權限
**依賴**: `SwiftUI`

**參數**:
| 參數 | 型別 | 必填 | 說明 |
|------|------|------|------|
| `icon` | `String` | 是 | SF Symbol 名稱（例如 "bell.badge"） |
| `text` | `String` | 是 | 說明文字 |
| `actionTitle` | `String` | 否 | 按鈕文字，預設 `"Allow"` |
| `iconColor` | `Color` | 否 | icon 顏色，預設 `.orange` |
| `action` | `() -> Void` | 是 | 按下按鈕的動作 |

**功能說明**:
單列權限提示：左 icon + 中說明文字 + 右側 borderedProminent 按鈕。文案與圖示全部參數化。適合包在主畫面頂部的權限提醒 banner（例如 `.ultraThinMaterial` 圓角背景）中堆疊多列。

**使用情境**: 主畫面權限提醒 banner、設定頁的權限開關提示
**來源**: `onmyway/EnRoute/Views/RootView.swift`（PermissionRow，約 64–83 行）

---

### `ui/PermissionCard.swift`

**分類**: UI / 權限
**依賴**: `SwiftUI`

**參數**:
| 參數 | 型別 | 必填 | 說明 |
|------|------|------|------|
| `icon` | `String` | 是 | SF Symbol 名稱（例如 "location.fill"） |
| `title` | `String` | 是 | 權限標題 |
| `desc` | `String` | 是 | 權限用途說明 |
| `granted` | `Bool` | 是 | 是否已授權；true 時顯示綠勾、隱藏按鈕 |
| `actionTitle` | `String` | 是 | 未授權時的按鈕文字 |
| `action` | `() -> Void` | 是 | 按下按鈕的動作 |

**功能說明**:
權限說明卡片：icon + 標題 + 說明文字，右側依 `granted` 狀態切換——已授權顯示綠色 `checkmark.circle.fill`，未授權顯示啟用按鈕。卡片底為 `secondarySystemGroupedBackground` 圓角。從原 `permissionCard` 私有 func 改寫成獨立 `struct PermissionCard: View`。

**使用情境**: onboarding 權限說明頁、設定頁的權限狀態列表
**來源**: `onmyway/EnRoute/Views/OnboardingView.swift`（permissionCard，約 109–137 行）

---

### `ui/Chip.swift`

**分類**: UI / 標籤
**依賴**: `SwiftUI`

**參數**:
| 參數 | 型別 | 必填 | 說明 |
|------|------|------|------|
| `icon` | `String` | 是 | SF Symbol 名稱（例如 "clock.fill"） |
| `text` | `String` | 是 | 標籤文字 |
| `color` | `Color` | 是 | 主色；文字與 icon 用此色，背景用 15% 透明度版本 |

**功能說明**:
膠囊形小標籤：icon + 文字 + 半透明色底（`Capsule` 形狀）。從原 `chip` 私有 func 改寫成獨立 `struct Chip: View`。適合在列表項目下方顯示地點、時間、分類等多個小標籤並排。

**使用情境**: 列表項目的中繼資料標籤（地點、時間、狀態）
**來源**: `onmyway/EnRoute/Views/TodoListView.swift`（chip，約 103–113 行）
