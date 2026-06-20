import SwiftUI

/// 權限提示橫列：SF Symbol icon + 說明文字 + 右側允許按鈕。
/// 適合放在主畫面頂部的權限提醒 banner 中。
public struct PermissionRow: View {
    let icon: String
    let text: String
    let actionTitle: String
    let iconColor: Color
    let action: () -> Void

    /// - Parameters:
    ///   - icon: SF Symbol 名稱（例如 "bell.badge"）。
    ///   - text: 說明文字。
    ///   - actionTitle: 按鈕文字，預設 "Allow"。
    ///   - iconColor: icon 顏色，預設 .orange。
    ///   - action: 按下按鈕的動作。
    public init(icon: String,
                text: String,
                actionTitle: String = "Allow",
                iconColor: Color = .orange,
                action: @escaping () -> Void) {
        self.icon = icon
        self.text = text
        self.actionTitle = actionTitle
        self.iconColor = iconColor
        self.action = action
    }

    public var body: some View {
        HStack(spacing: 10) {
            Image(systemName: icon)
                .foregroundStyle(iconColor)
            Text(text)
                .font(.footnote)
                .fixedSize(horizontal: false, vertical: true)
            Spacer(minLength: 8)
            Button(actionTitle, action: action)
                .font(.footnote.bold())
                .buttonStyle(.borderedProminent)
                .controlSize(.small)
        }
    }
}
