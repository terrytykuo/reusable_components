import SwiftUI

/// 權限說明卡片：icon + 標題 + 說明文字，右側依授權狀態顯示「✓」或「啟用按鈕」。
/// 適合放在 onboarding 的權限說明頁。
public struct PermissionCard: View {
    let icon: String
    let title: String
    let desc: String
    let granted: Bool
    let actionTitle: String
    let action: () -> Void

    /// - Parameters:
    ///   - icon: SF Symbol 名稱（例如 "location.fill"）。
    ///   - title: 權限標題。
    ///   - desc: 權限用途說明。
    ///   - granted: 是否已授權；true 時顯示綠色勾勾、隱藏按鈕。
    ///   - actionTitle: 未授權時按鈕文字。
    ///   - action: 按下按鈕的動作（通常觸發系統權限請求）。
    public init(icon: String,
                title: String,
                desc: String,
                granted: Bool,
                actionTitle: String,
                action: @escaping () -> Void) {
        self.icon = icon
        self.title = title
        self.desc = desc
        self.granted = granted
        self.actionTitle = actionTitle
        self.action = action
    }

    public var body: some View {
        HStack(alignment: .top, spacing: 12) {
            Image(systemName: icon)
                .font(.title2)
                .foregroundStyle(granted ? .green : .blue)
                .frame(width: 28)
            VStack(alignment: .leading, spacing: 4) {
                Text(title).font(.headline)
                Text(desc)
                    .font(.caption)
                    .foregroundStyle(.secondary)
                    .fixedSize(horizontal: false, vertical: true)
            }
            Spacer(minLength: 8)
            if granted {
                Image(systemName: "checkmark.circle.fill")
                    .font(.title2)
                    .foregroundStyle(.green)
            } else {
                Button(actionTitle, action: action)
                    .font(.footnote.bold())
                    .buttonStyle(.bordered)
                    .controlSize(.small)
            }
        }
        .padding(14)
        .background(Color(.secondarySystemGroupedBackground), in: RoundedRectangle(cornerRadius: 14))
    }
}
