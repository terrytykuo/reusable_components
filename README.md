# Reusable Components

把過去專案裡與業務解耦、可跨專案重用的程式碼整理在這裡，未來開新專案時可以快速抽取。

每個類別都有自己的 `README.md`（資料夾結構 + 使用方式）與 `INDEX.md`（每個元件的完整 Props/介面說明、依賴、使用情境與來源）。

---

## 類別總覽

| 類別 | 技術棧 | 內容 | 文件 |
|------|--------|------|------|
| [`app/`](./app/) | React Native / Expo (TypeScript) | UI 元件、hooks、Firebase/RevenueCat 封裝、訂閱與 onboarding 工具，皆吃 `tokens` 設計變數 | [README](./app/README.md) · [INDEX](./app/INDEX.md) |
| [`web/`](./web/) | React + Vite + Tailwind / Cloudflare Workers / Node | adminUI 資料後台元件、Markdown 渲染、Cloudflare KV/HTTP/背景任務後端模式、TS utilities | [README](./web/README.md) · [INDEX](./web/INDEX.md) |
| [`ios/`](./ios/) | SwiftUI (iOS) | 地理圍欄 LocationManager、本機通知 NotificationManager、泛型 JSON 持久化、權限 UI 元件 | [README](./ios/README.md) · [INDEX](./ios/INDEX.md) |
| [`llm/`](./llm/) | TypeScript (Node) | LLM JSON 修復、本機 CLI 模型呼叫、retry/並發控制等與供應商無關的工具 | [README](./llm/README.md) · [INDEX](./llm/INDEX.md) |
| [`skill/`](./skill/) | Claude Code skills | notebooklm-skill、design-sense、harness-engineering 等可安裝的 skill | [INDEX](./skill/INDEX.md) |
| [`harness/`](./harness/) | Markdown / 工作流 | repo collaboration、agent workflow、共享記憶與驗證流程的模板 | [README](./harness/README.md) |

---

## 使用方式

1. 在對應類別的 `INDEX.md` 找到需要的元件，看它的依賴、Props/介面與「來源」。
2. 把元件檔複製到新專案對應目錄（多數元件已解耦，只依賴外部注入的設定或 callback）。
3. RN 元件記得一併複製 `app/types/tokens.ts` 並傳入 `tokens`；web 元件確認已裝 Tailwind 與標註的 peer 套件。

## 來源專案

目前的元件主要抽取自：`mewguard/cat_toxin_app`(RN)、`onmyway`(SwiftUI)、`wiser` 與 `interactive-book-tutor`(web/LLM)。新增元件時請在該元件的 INDEX 條目標註 **來源** 路徑，方便日後回溯與更新。
