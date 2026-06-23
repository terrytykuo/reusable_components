# Reusable Components — ios/

跨專案可復用的 SwiftUI / iOS 功能元件庫。

所有元件皆已從原始 app 解耦，不依賴任何 domain 模型（如 Place、Todo、Store）。Manager 類別以 callback / closure 注入行為，UI 元件以參數驅動，可直接複製到任何 SwiftUI 專案使用。

---

## 資料夾結構

```
ios/
├── README.md                          ← 本文件
├── INDEX.md                           ← 每個元件的完整說明
├── app-store-launch-checklist.md      ← App Store 上架逐項清單（圖示/簽章/隱私政策/送審）
│
├── location/
│   └── LocationManager.swift          ← 背景 geofence 監控（region 上限排序 + cooldown）
│
├── mapsearch/
│   └── MapPlaceSearch.swift           ← 地址自動完成 + 分類 POI 搜尋（MapKit，免金鑰）
│
├── notifications/
│   └── NotificationManager.swift      ← 本機通知：授權 + 時間提醒 + 即時地點提醒 + 點擊回調
│
├── persistence/
│   └── JSONStore.swift                ← 泛型 Documents 目錄 JSON 持久化 wrapper
│
└── ui/
    ├── PermissionRow.swift            ← icon + 文字 + 允許按鈕的權限提示橫列
    ├── PermissionCard.swift           ← icon + 標題 + 說明 + 授權狀態的權限卡片
    └── Chip.swift                     ← icon + 文字 + 半透明色底的膠囊標籤
```

---

## 使用方式

直接複製需要的 `.swift` 檔案到你的專案即可，沒有套件管理或外部依賴（僅用到系統框架 `CoreLocation`、`UserNotifications`、`SwiftUI`、`Foundation`）。

每個檔案都是 self-contained，可獨立編譯。Manager 類別的行為由你在初始化後注入：

```swift
// LocationManager：注入地點來源與進入回調
let location = LocationManager(cooldownHours: 4)
location.regionsProvider = {
    myStore.activePlaces.map {
        GeofenceRegion(id: $0.id.uuidString, latitude: $0.latitude,
                       longitude: $0.longitude, radius: $0.radius)
    }
}
location.onRegionEntered = { region in
    notifications.fireLocationNotification(
        title: "你在附近", body: "順手辦一下", payloadID: region.id
    )
}

// NotificationManager：注入點擊回調
let notifications = NotificationManager()
notifications.onNotificationTapped = { id in
    myStore.complete(id: id)
}
```

UI 元件全部以參數驅動，文案不寫死，直接傳入：

```swift
PermissionRow(icon: "bell.badge", text: "開啟通知才能提醒你") {
    notifications.requestAuthorization()
}
```

詳細的初始化、API 與使用範例請見 [INDEX.md](./INDEX.md)。
