import Foundation

/// 泛型 JSON 持久化 wrapper：把任何 Codable 值存到 App 的 Documents 目錄。
/// 適合無帳號、無雲端的本機儲存（MVP）。
///
/// 用法：
/// ```swift
/// let store = JSONStore<[Place]>(filename: "places.json")
/// let places = store.load() ?? []
/// store.save(places)
/// ```
public struct JSONStore<T: Codable> {

    private let url: URL
    private let encoder: JSONEncoder
    private let decoder: JSONDecoder

    /// - Parameters:
    ///   - filename: Documents 目錄下的檔名（例如 "places.json"）。
    ///   - encoder: 自訂 JSONEncoder（可設定日期策略等），預設使用標準設定。
    ///   - decoder: 自訂 JSONDecoder，預設使用標準設定。
    public init(filename: String,
                encoder: JSONEncoder = JSONEncoder(),
                decoder: JSONDecoder = JSONDecoder()) {
        let dir = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask)[0]
        self.url = dir.appendingPathComponent(filename)
        self.encoder = encoder
        self.decoder = decoder
    }

    /// 讀取並解碼；檔案不存在或解碼失敗時回傳 nil。
    public func load() -> T? {
        guard let data = try? Data(contentsOf: url) else { return nil }
        return try? decoder.decode(T.self, from: data)
    }

    /// 編碼並寫入；失敗時靜默忽略（適合 best-effort 本機儲存）。
    public func save(_ value: T) {
        guard let data = try? encoder.encode(value) else { return }
        try? data.write(to: url)
    }
}
