/**
 * jsonRepair — 從 LLM 的雜訊輸出中提取並修復 JSON。
 *
 * LLM 經常把 JSON 包在 ```json 圍欄、前後散文、或警告訊息裡，且在 *字串值內*
 * 產生兩類常見缺陷：
 *   1. 未跳脫的控制字元（markdown 內容直接含原始換行 / tab）。
 *   2. 非法的反斜線跳脫 —— JSON 只允許 \" \\ \/ \b \f \n \r \t \uXXXX，
 *      但模型常從程式碼、正則、LaTeX、mermaid 內容吐出 \( \d \. \$ \[ 等。
 *
 * 本模組純字串處理、零依賴，可在任何 JS/TS 環境（Node、瀏覽器、Deno）使用。
 *
 * 匯出：
 *   - extractJson<T>(raw): 從雜訊文字提取第一個平衡的 JSON 物件 / 陣列並 parse。
 *   - repairJsonStrings(raw): 修復字串值內常見缺陷，回傳可被 JSON.parse 的字串。
 */

/**
 * 修復字串值內最常見的 LLM-JSON 缺陷，回傳修復後的 JSON 字串。
 *
 * 只在「字串內」動手：
 *  1. 原始控制字元（換行 / 歸位 / tab / 其他 < 0x20）→ 轉成合法跳脫。
 *  2. 非法反斜線跳脫（\( \d \. …）→ 把反斜線加倍，使其變成字面字元。
 */
export function repairJsonStrings(raw: string): string {
  let out = "";
  let inStr = false;
  for (let i = 0; i < raw.length; i++) {
    const ch = raw[i];
    const code = raw.charCodeAt(i);

    if (!inStr) {
      out += ch;
      if (ch === '"') inStr = true;
      continue;
    }

    // --- 字串值內 ---
    if (ch === '"') {
      out += ch;
      inStr = false;
      continue;
    }
    if (ch === "\\") {
      const next = raw[i + 1];
      if (next === undefined) {
        out += "\\\\"; // 結尾懸空的反斜線
        continue;
      }
      if ('"\\/bfnrt'.includes(next)) {
        out += ch + next; // 合法的簡單跳脫 —— 原樣保留
        i++;
        continue;
      }
      if (next === "u" && /^[0-9a-fA-F]{4}$/.test(raw.slice(i + 2, i + 6))) {
        out += ch + next; // 合法的 unicode 跳脫 —— 保留
        i++;
        continue;
      }
      // 非法跳脫（\( \d \. …）—— 把反斜線加倍；下一字元照常處理
      out += "\\\\";
      continue;
    }
    if (ch === "\n") out += "\\n";
    else if (ch === "\r") out += "\\r";
    else if (ch === "\t") out += "\\t";
    else if (code < 0x20) out += "\\u" + code.toString(16).padStart(4, "0");
    else out += ch;
  }
  return out;
}

/**
 * 從文字中提取第一個平衡的 JSON 物件（`{...}`）或陣列（`[...]`），容忍前後散文、
 * ```json 圍欄、CLI 警告前綴等。先嘗試直接 parse，失敗時以 repairJsonStrings
 * 修復後重試一次。
 *
 * 以括號平衡掃描定位 JSON 範圍，且能正確忽略「字串值內」出現的 ``` 圍欄或括號
 * （它們位於引號內，不影響配對），因此即使 JSON 內含 mermaid / 程式碼也不會誤判。
 *
 * @throws 找不到任何可解析的 JSON 時拋出 Error。
 */
export function extractJson<T = unknown>(raw: string): T {
  const value = scanJsonValue(raw);
  if (value === SCAN_FAILED) {
    const head = raw.slice(0, 400);
    const tail = raw.length > 800 ? `\n…\n${raw.slice(-400)}` : "";
    throw new Error(`No parseable JSON found in input. Got: ${head}${tail}`);
  }
  return value as T;
}

/** extractJson 的 non-throwing 版本，失敗時回傳 null。 */
export function tryExtractJson<T = unknown>(raw: string): T | null {
  const value = scanJsonValue(raw);
  return value === SCAN_FAILED ? null : (value as T);
}

const SCAN_FAILED = Symbol("scan-failed");

function scanJsonValue(text: string): unknown | typeof SCAN_FAILED {
  const firstObj = text.indexOf("{");
  const firstArr = text.indexOf("[");
  let start = -1;
  if (firstObj === -1) start = firstArr;
  else if (firstArr === -1) start = firstObj;
  else start = Math.min(firstObj, firstArr);
  if (start === -1) return SCAN_FAILED;

  const open = text[start];
  const close = open === "{" ? "}" : "]";
  let depth = 0;
  let inStr = false;
  let esc = false;
  for (let i = start; i < text.length; i++) {
    const ch = text[i];
    if (inStr) {
      if (esc) esc = false;
      else if (ch === "\\") esc = true;
      else if (ch === '"') inStr = false;
    } else if (ch === '"') inStr = true;
    else if (ch === open) depth++;
    else if (ch === close) {
      depth--;
      if (depth === 0) {
        const candidate = text.slice(start, i + 1);
        try {
          return JSON.parse(candidate);
        } catch {
          // 字串值內常見缺陷：原始控制字元與非法反斜線跳脫。修復後重試一次。
          try {
            return JSON.parse(repairJsonStrings(candidate));
          } catch {
            return SCAN_FAILED;
          }
        }
      }
    }
  }
  return SCAN_FAILED;
}
