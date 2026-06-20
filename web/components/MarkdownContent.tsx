import React, { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import rehypeHighlight from "rehype-highlight";
import rehypeRaw from "rehype-raw";
import mermaid from "mermaid";
import "katex/dist/katex.min.css";
import { sanitizeMermaid } from "../utils/sanitizeMermaid";

/**
 * 全功能 Markdown 渲染元件，與任何業務邏輯解耦，可直接複製使用。
 *
 * 支援：
 *  - GFM（表格、刪除線、任務清單等，remark-gfm）
 *  - 數學式（remark-math + rehype-katex，需引入 katex CSS）
 *  - 程式碼高亮（rehype-highlight，需自行引入 highlight.js 主題 CSS）
 *  - 原始 HTML（rehype-raw）
 *  - Mermaid 圖（含智慧 fallback：解析失敗時把半形括號轉全形重試，
 *    修復 AI 產生的 `[節點(描述)]`，仍失敗才退回顯示原始碼）
 *
 * 依賴：react-markdown, remark-gfm, remark-math, rehype-katex,
 *       rehype-highlight, rehype-raw, mermaid, katex
 *
 * 使用前需在應用程式入口呼叫一次 highlight.js 主題與（可選）自訂 mermaid 設定，
 * 或直接沿用本檔的預設初始化。
 */

// 模組層級只初始化一次。如需自訂主題/字型，於 import 本檔前先自行呼叫
// mermaid.initialize，或修改下列設定。
mermaid.initialize({
  startOnLoad: false,
  theme: "neutral",
  securityLevel: "loose",
  fontFamily: "Inter, 'Noto Sans TC', sans-serif",
});

// 每張圖需要唯一 DOM id，遞增序號確保不衝突。
let mermaidSeq = 0;

/** 渲染單一 mermaid 圖；失敗時退回顯示原始碼。 */
function MermaidDiagram({ code }: { code: string }) {
  const [svg, setSvg] = useState("");
  const [failed, setFailed] = useState(false);
  const idRef = useRef(`mermaid-${mermaidSeq++}`);

  useEffect(() => {
    let cancelled = false;
    setFailed(false);

    // parse() 只驗證、不碰 DOM，因此無效的圖永遠到不了 render()——這就是
    // 避免 mermaid 把它的「Syntax error」孤兒 SVG 塞進頁面的關鍵。
    // 先原樣嘗試；解析失敗就重試 sanitize 過的版本；都不行才退回 fallback。
    const renderOnce = async (src: string): Promise<string | null> => {
      const ok = await mermaid.parse(src, { suppressErrors: true });
      if (!ok) return null;
      const { svg } = await mermaid.render(`${idRef.current}-${mermaidSeq++}`, src);
      return svg;
    };

    (async () => {
      try {
        let out = await renderOnce(code);
        if (out == null) out = await renderOnce(sanitizeMermaid(code));
        if (cancelled) return;
        if (out == null) setFailed(true);
        else setSvg(out);
      } catch {
        if (!cancelled) setFailed(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [code]);

  if (failed) {
    return (
      <pre className="md-codeblock">
        <code>{code}</code>
      </pre>
    );
  }
  return (
    <div
      className="my-4 flex justify-center overflow-x-auto rounded-2xl border border-slate-200 bg-white p-4"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}

/** 遞迴收集 React children 的純文字內容（用於取出 mermaid 程式碼）。 */
function collectText(children: React.ReactNode): string {
  if (typeof children === "string") return children;
  if (typeof children === "number") return String(children);
  if (Array.isArray(children)) return children.map(collectText).join("");
  if (React.isValidElement(children)) return collectText((children.props as any)?.children);
  return "";
}

export default function MarkdownContent({ children }: { children: string }) {
  return (
    <div className="markdown-body">
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeRaw, rehypeKatex, [rehypeHighlight, { ignoreMissing: true, detect: true }]]}
        components={{
          code(props) {
            const { className, children, ...rest } = props as any;
            const isMermaid = /language-mermaid/.test(className || "");
            if (isMermaid) {
              return <MermaidDiagram code={collectText(children).trim()} />;
            }
            return (
              <code className={className} {...rest}>
                {children}
              </code>
            );
          },
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}

export { sanitizeMermaid };
