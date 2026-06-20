# Reusable Components — llm/

跨專案可復用的 LLM 相關 TypeScript 工具庫。收集在多個專案
（`interactive-book-tutor`、`wiser`…）重複出現、與「呼叫 LLM 並處理其輸出」
有關的高價值工具。

所有檔案皆為 self-contained：型別完整、無對任何原專案的 import，依賴僅限 Node
內建模組（部分檔案甚至零依賴），可直接複製到新專案使用。

---

## 資料夾結構

```
llm/
├── README.md           ← 本文件
├── INDEX.md            ← 每個檔案的完整說明（介面、功能、使用情境、來源）
│
├── jsonRepair.ts       ← 從 LLM 雜訊輸出提取 + 修復 JSON（零依賴）
├── cliModel.ts         ← 呼叫本機已登入 CLI 模型的泛型 wrapper（Node child_process / os）
└── concurrency.ts      ← withRetry + mapWithConcurrency 批次 async 工具（零依賴）
```

---

## 為什麼是這三個

呼叫 LLM 的程式幾乎都會碰到同一組問題，而這三個檔案各自解一個：

| 問題 | 工具 |
|------|------|
| 模型回傳的 JSON 被 ```json 圍欄、散文包住，或字串內有非法跳脫 / 控制字元 | `jsonRepair.ts` |
| 不想管 API key，想直接複用本機已登入的 gemini / claude / codex CLI | `cliModel.ts` |
| 批次呼叫時要重試壞回應、又要限制並行數避免撞 rate limit | `concurrency.ts` |

---

## 使用方式

1. 複製需要的 `.ts` 檔到新專案（例如 `src/lib/`）。
2. `cliModel.ts` 需要 Node 環境與 `@types/node`；另兩個檔案零依賴、任何 JS/TS
   環境皆可用。
3. 直接 import 使用。

組合範例：用本機 CLI 模型批次產生內容並安全解析 JSON。

```ts
import { spawnCliModel } from "./cliModel";
import { extractJson } from "./jsonRepair";
import { withRetry, mapWithConcurrency } from "./concurrency";

async function generateJson(instruction: string, context?: string) {
  const stdout = await spawnCliModel("gemini", instruction, context, {
    args: ["--output-format", "json", "-m", "gemini-2.5-flash"],
  });
  // gemini envelope 的模型回應在 .response 欄位，內容本身又是 JSON
  const envelope = extractJson<{ response: string }>(stdout);
  return extractJson(envelope.response);
}

const topics = ["a", "b", "c", "d"];
const results = await mapWithConcurrency(topics, 3, (topic) =>
  withRetry(() => generateJson(`Explain ${topic} as JSON`), 3)
);
```

詳細的函式簽章、功能說明與來源請見 [INDEX.md](./INDEX.md)。
