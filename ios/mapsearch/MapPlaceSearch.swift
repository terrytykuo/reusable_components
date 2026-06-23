import Foundation
import MapKit
import CoreLocation
import Combine

// MARK: - 地址 / 地點自動完成

/// 地址／地點搜尋自動完成：包 MapKit `MKLocalSearchCompleter`（免金鑰、免帳單）。
/// 邊打邊更新建議，選定後再以 `resolve` 解析成座標。與任何 domain 模型無關。
///
/// 用法：
/// ```swift
/// @StateObject private var search = AddressSearchCompleter()
/// TextField("搜尋地址或地點", text: $search.query)
/// ForEach(search.results.indices, id: \.self) { i in
///     let r = search.results[i]
///     Button(r.title) {
///         search.resolve(r) { coord in /* 移動地圖、填座標 */ }
///     }
/// }
/// ```
final class AddressSearchCompleter: NSObject, ObservableObject {
    @Published var query: String = ""
    @Published var results: [MKLocalSearchCompletion] = []

    private let completer = MKLocalSearchCompleter()
    private var cancellable: AnyCancellable?

    /// - Parameters:
    ///   - resultTypes: 要回傳的建議類型，預設地址 + POI。
    ///   - debounce: 打字停多久才送查詢（毫秒），避免每個字都打一次 API。
    init(resultTypes: MKLocalSearchCompleter.ResultType = [.address, .pointOfInterest],
         debounce: Int = 250) {
        super.init()
        completer.delegate = self
        completer.resultTypes = resultTypes
        cancellable = $query
            .debounce(for: .milliseconds(debounce), scheduler: RunLoop.main)
            .removeDuplicates()
            .sink { [weak self] text in
                guard let self else { return }
                let trimmed = text.trimmingCharacters(in: .whitespaces)
                if trimmed.isEmpty {
                    self.results = []
                } else {
                    self.completer.queryFragment = trimmed
                }
            }
    }

    /// 把選中的建議解析成座標（含一次 `MKLocalSearch`）。回呼在主執行緒。
    func resolve(_ completion: MKLocalSearchCompletion,
                 handler: @escaping (CLLocationCoordinate2D?) -> Void) {
        let request = MKLocalSearch.Request(completion: completion)
        MKLocalSearch(request: request).start { response, _ in
            handler(response?.mapItems.first?.placemark.coordinate)
        }
    }

    /// 讓搜尋建議以某座標附近優先排序（例如使用者目前位置）。
    func biasRegion(to coordinate: CLLocationCoordinate2D, meters: CLLocationDistance = 20_000) {
        completer.region = MKCoordinateRegion(center: coordinate,
                                              latitudinalMeters: meters, longitudinalMeters: meters)
    }
}

extension AddressSearchCompleter: MKLocalSearchCompleterDelegate {
    func completerDidUpdateResults(_ completer: MKLocalSearchCompleter) {
        results = completer.results
    }
    func completer(_ completer: MKLocalSearchCompleter, didFailWithError error: Error) {
        results = []
    }
}

// MARK: - 分類 POI 搜尋

/// 在指定地圖範圍內，用自然語言查某類店家（便利商店、超市、郵局…）並回傳可標在地圖上的結果。
/// 適合「分類快選鈕」：使用者不知地址，只想找家附近某類店時，把它們標成圖釘讓人點選。
///
/// 用法：
/// ```swift
/// PlaceCategorySearch.search(query: "便利商店", region: currentRegion) { results in
///     self.pins = results   // 在 Map 裡 ForEach 成 Annotation
/// }
/// ```
enum PlaceCategorySearch {
    /// 一筆可標在地圖上的店家結果。
    struct Result: Identifiable {
        let id = UUID()
        let name: String
        let coordinate: CLLocationCoordinate2D
    }

    /// - Parameters:
    ///   - query: 自然語言查詢字（如「便利商店」「超市」「郵局」「宅配 包裹 取貨」）。
    ///   - region: 搜尋範圍，通常傳目前地圖可視範圍。
    ///   - limit: 最多回傳幾筆，避免地圖太雜。
    ///   - handler: 結果回呼，在主執行緒。
    static func search(query: String,
                       region: MKCoordinateRegion,
                       limit: Int = 25,
                       handler: @escaping ([Result]) -> Void) {
        let request = MKLocalSearch.Request()
        request.naturalLanguageQuery = query
        request.region = region
        request.resultTypes = [.pointOfInterest]
        MKLocalSearch(request: request).start { response, _ in
            let items = (response?.mapItems ?? []).prefix(limit)
            handler(items.map { Result(name: $0.name ?? query, coordinate: $0.placemark.coordinate) })
        }
    }
}
