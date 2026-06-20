import SwiftUI

/// 膠囊標籤：SF Symbol icon + 文字 + 半透明色底。
/// 適合在列表項目上顯示分類、地點、時間等小標籤。
public struct Chip: View {
    let icon: String
    let text: String
    let color: Color

    /// - Parameters:
    ///   - icon: SF Symbol 名稱（例如 "mappin.circle.fill"）。
    ///   - text: 標籤文字。
    ///   - color: 主色；文字與 icon 用此色，背景用 15% 透明度版本。
    public init(icon: String, text: String, color: Color) {
        self.icon = icon
        self.text = text
        self.color = color
    }

    public var body: some View {
        HStack(spacing: 3) {
            Image(systemName: icon)
            Text(text)
        }
        .font(.caption2)
        .padding(.horizontal, 7)
        .padding(.vertical, 3)
        .background(color.opacity(0.15), in: Capsule())
        .foregroundStyle(color)
    }
}
