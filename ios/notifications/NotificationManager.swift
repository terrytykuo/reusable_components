import Foundation
import UserNotifications

/// 本機通知管理器：授權、單次時間提醒、即時地點提醒、前景顯示、點擊回調。
///
/// 解耦設計：
/// - 通知 title / body 全部由呼叫端以參數傳入（不硬寫任何文案）。
/// - 點擊通知時透過 `onNotificationTapped` callback 回傳 userInfo 內的識別字串，
///   由呼叫端決定要做什麼（例如標記完成）；本類別不引用任何 Store。
public final class NotificationManager: NSObject, ObservableObject {

    /// 時間提醒的通知 id 前綴；地點提醒用另一前綴，方便分別管理。
    private let timePrefix: String
    private let placePrefix: String

    /// userInfo 中存放識別字串所用的 key。
    private let payloadKey: String

    /// 點擊通知（且帶有 payloadKey 對應值）時觸發，參數為該識別字串。
    public var onNotificationTapped: ((String) -> Void)?

    @Published public private(set) var authorized: Bool = false

    /// - Parameters:
    ///   - timePrefix: 時間提醒通知 identifier 前綴。
    ///   - placePrefix: 地點提醒通知 identifier 前綴。
    ///   - payloadKey: userInfo 內識別字串的 key（點擊時回傳）。
    public init(timePrefix: String = "time-",
                placePrefix: String = "place-",
                payloadKey: String = "payloadID") {
        self.timePrefix = timePrefix
        self.placePrefix = placePrefix
        self.payloadKey = payloadKey
        super.init()
        UNUserNotificationCenter.current().delegate = self
        refreshAuthStatus()
    }

    public func requestAuthorization() {
        UNUserNotificationCenter.current().requestAuthorization(options: [.alert, .sound, .badge]) { [weak self] granted, _ in
            DispatchQueue.main.async { self?.authorized = granted }
        }
    }

    public func refreshAuthStatus() {
        UNUserNotificationCenter.current().getNotificationSettings { [weak self] settings in
            DispatchQueue.main.async {
                self?.authorized = (settings.authorizationStatus == .authorized || settings.authorizationStatus == .provisional)
            }
        }
    }

    // MARK: - 時間提醒（單次）

    /// 排定一則單次時間提醒。
    /// - Parameters:
    ///   - id: 識別字串，用於後續取消與點擊回調。
    ///   - title: 通知標題。
    ///   - body: 通知內文（空字串則不設）。
    ///   - date: 觸發時間；早於現在則略過。
    public func scheduleTimeReminder(id: String, title: String, body: String = "", at date: Date) {
        cancelTimeReminder(id: id)
        guard date > Date() else { return }

        let content = UNMutableNotificationContent()
        content.title = title
        if !body.isEmpty { content.body = body }
        content.sound = .default
        content.userInfo = [payloadKey: id]

        let comps = Calendar.current.dateComponents([.year, .month, .day, .hour, .minute], from: date)
        let trigger = UNCalendarNotificationTrigger(dateMatching: comps, repeats: false)
        let request = UNNotificationRequest(identifier: timePrefix + id, content: content, trigger: trigger)
        UNUserNotificationCenter.current().add(request)
    }

    public func cancelTimeReminder(id: String) {
        UNUserNotificationCenter.current().removePendingNotificationRequests(withIdentifiers: [timePrefix + id])
    }

    // MARK: - 即時地點提醒

    /// 立即推播一則地點提醒（geofence 進入當下）。
    /// - Parameters:
    ///   - title: 通知標題。
    ///   - body: 通知內文。
    ///   - payloadID: 可選識別字串；非 nil 時存入 userInfo，點擊時透過 callback 回傳。
    public func fireLocationNotification(title: String, body: String, payloadID: String? = nil) {
        let content = UNMutableNotificationContent()
        content.title = title
        content.body = body
        content.sound = .default
        if let payloadID { content.userInfo = [payloadKey: payloadID] }

        let request = UNNotificationRequest(
            identifier: placePrefix + UUID().uuidString,
            content: content,
            trigger: nil
        )
        UNUserNotificationCenter.current().add(request)
    }
}

extension NotificationManager: UNUserNotificationCenterDelegate {
    // app 在前景時也顯示通知。
    public func userNotificationCenter(_ center: UNUserNotificationCenter,
                                       willPresent notification: UNNotification,
                                       withCompletionHandler completionHandler: @escaping (UNNotificationPresentationOptions) -> Void) {
        completionHandler([.banner, .sound, .list])
    }

    // 點通知 → 若帶識別字串，透過 callback 回傳給呼叫端。
    public func userNotificationCenter(_ center: UNUserNotificationCenter,
                                       didReceive response: UNNotificationResponse,
                                       withCompletionHandler completionHandler: @escaping () -> Void) {
        if let id = response.notification.request.content.userInfo[payloadKey] as? String {
            DispatchQueue.main.async {
                self.onNotificationTapped?(id)
            }
        }
        completionHandler()
    }
}
