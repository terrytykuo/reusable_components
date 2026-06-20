/**
 * Mermaid 圖表的「智慧修復」工具，與 React 無關，可獨立使用。
 *
 * AI 產生的 Mermaid 程式碼經常在 `[..]` 或 `{..}` 節點標籤內塞入半形括號
 * （例如 `D[資料庫主節點 (讀寫)]`）。Mermaid 把標籤裡的 `(` 當成形狀分隔符，
 * 導致整張圖解析失敗。本工具把這類標籤內的半形括號轉成全形——標籤閱讀起來
 * 依然自然，解析器也不再報錯。
 *
 * 僅當原始程式碼「已經解析失敗」時才作為 fallback retry 使用，因此可以放心
 * 地積極轉換；它永遠不會破壞一張原本就能正常渲染的圖。
 */
export function sanitizeMermaid(code: string): string {
  const toFullWidth = (s: string) => s.replace(/\(/g, "（").replace(/\)/g, "）");
  return code
    .replace(/\[([^\][\n]*)\]/g, (_m, inner) => `[${toFullWidth(inner)}]`)
    .replace(/\{([^{}\n]*)\}/g, (_m, inner) => `{${toFullWidth(inner)}}`);
}

export default sanitizeMermaid;
