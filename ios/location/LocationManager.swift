import Foundation
import CoreLocation
import Combine

/// A self-contained geofence region descriptor.
/// 注入 LocationManager 的最小地點資料，不綁任何 domain 模型。
public struct GeofenceRegion: Identifiable, Equatable {
    public let id: String
    public let latitude: Double
    public let longitude: Double
    /// 觸發半徑（公尺）。建議 150–300m。
    public let radius: Double

    public init(id: String, latitude: Double, longitude: Double, radius: Double = 200) {
        self.id = id
        self.latitude = latitude
        self.longitude = longitude
        self.radius = radius
    }

    var coordinate: CLLocationCoordinate2D {
        CLLocationCoordinate2D(latitude: latitude, longitude: longitude)
    }
}

/// 背景 geofence 管理器：用系統 region monitoring（低耗電），進入綁定地點即觸發 callback。
/// 處理 iOS 同時最多 20 個 region 的上限（依距離優先排序），含同地點 cooldown 防疲勞。
///
/// 解耦設計：
/// - 不引用任何 Store / NotificationManager；進入地點時呼叫 `onRegionEntered` callback。
/// - region 來源由外部以 `regionsProvider` closure 注入（回傳 `[GeofenceRegion]`）。
/// - cooldown 時數、最大 region 數可在初始化時設定。
public final class LocationManager: NSObject, ObservableObject {

    private let manager = CLLocationManager()
    private let maxRegions: Int
    private let cooldownHours: Double

    /// 進入某地點（且不在 cooldown 內）時觸發，參數為對應的 GeofenceRegion。
    public var onRegionEntered: ((GeofenceRegion) -> Void)?

    /// 外部注入：回傳目前要監控的地點清單。每次 `syncMonitoredRegions()` 都會重新詢問。
    public var regionsProvider: () -> [GeofenceRegion] = { [] }

    /// 同一地點在 cooldownHours 內不重複觸發，記錄最近觸發時間。
    private var lastTriggered: [String: Date] = [:]

    @Published public private(set) var authorizationStatus: CLAuthorizationStatus = .notDetermined
    /// 因 region 上限而未能全部監控時為 true，UI 可提示使用者。
    @Published public private(set) var hitRegionLimit: Bool = false

    /// - Parameters:
    ///   - maxRegions: 同時監控上限（iOS 系統上限為 20）。
    ///   - cooldownHours: 同地點冷卻時數，期間不重複觸發。
    ///   - cooldownFilename: cooldown 持久化檔名（Documents 目錄）。
    public init(maxRegions: Int = 20,
                cooldownHours: Double = 4,
                cooldownFilename: String = "cooldowns.json") {
        self.maxRegions = maxRegions
        self.cooldownHours = cooldownHours
        self.cooldownFilename = cooldownFilename
        super.init()
        manager.delegate = self
        manager.allowsBackgroundLocationUpdates = true
        manager.pausesLocationUpdatesAutomatically = false
        authorizationStatus = manager.authorizationStatus
        loadCooldowns()
    }

    public var currentLocation: CLLocation? { manager.location }

    // MARK: - 權限

    /// 兩段式請求：先 WhenInUse，授權後再升級 Always（iOS 建議流程，拒絕率較低）。
    public func requestAuthorization() {
        switch manager.authorizationStatus {
        case .notDetermined:
            manager.requestWhenInUseAuthorization()
        case .authorizedWhenInUse:
            manager.requestAlwaysAuthorization()
        default:
            break
        }
        manager.startUpdatingLocation()
    }

    // MARK: - Region 同步

    /// 向 `regionsProvider` 取得目前要監控的地點，挑選最多 maxRegions 個進行監控。
    /// 策略：若超過上限，依與目前位置的距離排序，優先監控最近的。
    public func syncMonitoredRegions() {
        for region in manager.monitoredRegions {
            manager.stopMonitoring(for: region)
        }

        var candidates = regionsProvider()

        if candidates.count > maxRegions, let here = manager.location {
            candidates.sort {
                let d0 = CLLocation(latitude: $0.latitude, longitude: $0.longitude).distance(from: here)
                let d1 = CLLocation(latitude: $1.latitude, longitude: $1.longitude).distance(from: here)
                return d0 < d1
            }
        }

        hitRegionLimit = candidates.count > maxRegions
        let monitored = candidates.prefix(maxRegions)

        for place in monitored {
            let region = CLCircularRegion(center: place.coordinate, radius: place.radius, identifier: place.id)
            region.notifyOnEntry = true
            region.notifyOnExit = false
            manager.startMonitoring(for: region)
        }
    }

    // MARK: - Cooldown 持久化

    private let cooldownFilename: String

    private var cooldownURL: URL {
        FileManager.default.urls(for: .documentDirectory, in: .userDomainMask)[0]
            .appendingPathComponent(cooldownFilename)
    }

    private func loadCooldowns() {
        if let data = try? Data(contentsOf: cooldownURL),
           let decoded = try? JSONDecoder().decode([String: Date].self, from: data) {
            lastTriggered = decoded
        }
    }

    private func saveCooldowns() {
        if let data = try? JSONEncoder().encode(lastTriggered) {
            try? data.write(to: cooldownURL)
        }
    }

    private func isInCooldown(_ regionID: String) -> Bool {
        guard let last = lastTriggered[regionID] else { return false }
        return Date().timeIntervalSince(last) < cooldownHours * 3600
    }

    // MARK: - 觸發處理

    private func handleEntry(regionID: String) {
        guard !isInCooldown(regionID) else { return }
        guard let region = regionsProvider().first(where: { $0.id == regionID }) else { return }

        onRegionEntered?(region)
        lastTriggered[regionID] = Date()
        saveCooldowns()
    }
}

extension LocationManager: CLLocationManagerDelegate {
    public func locationManagerDidChangeAuthorization(_ manager: CLLocationManager) {
        DispatchQueue.main.async {
            self.authorizationStatus = manager.authorizationStatus
        }
        if manager.authorizationStatus == .authorizedWhenInUse {
            // 已取得 WhenInUse，順勢升級 Always。
            manager.requestAlwaysAuthorization()
        }
        if manager.authorizationStatus == .authorizedAlways || manager.authorizationStatus == .authorizedWhenInUse {
            manager.startUpdatingLocation()
            syncMonitoredRegions()
        }
    }

    public func locationManager(_ manager: CLLocationManager, didEnterRegion region: CLRegion) {
        handleEntry(regionID: region.identifier)
    }

    public func locationManager(_ manager: CLLocationManager, didUpdateLocations locations: [CLLocation]) {
        // 取得位置後可能影響「最近 N 個」的挑選，僅在超過上限時重新同步，避免頻繁重設。
        if hitRegionLimit {
            syncMonitoredRegions()
        }
    }
}
