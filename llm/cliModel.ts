/**
 * cliModel — 呼叫本機已登入 CLI 模型的泛型 wrapper。
 *
 * 許多本機 AI CLI（gemini、claude、codex…）都支援「headless / print」模式：
 * 透過 `-p <prompt>` 給簡短指令、把大型 context 從 stdin 餵入，並把結果以
 * JSON envelope 印到 stdout。這個 wrapper 把該模式抽象成單一函式，模型名稱與
 * 參數全部可注入，不寫死任何特定 CLI。
 *
 * 採「呼叫本機已登入 CLI」而非直接打 API 的好處：應用程式不需要管理 API key，
 * 直接複用使用者本機 CLI 的登入授權。
 *
 * 依賴僅 Node 內建的 child_process 與 os。
 */
import { spawn } from "child_process";
import os from "os";

export interface SpawnCliModelOptions {
  /**
   * 額外傳給 CLI 的參數，會接在 `-p <instruction>` 之前。
   * 例：`["--output-format", "json", "-m", "gemini-2.5-flash"]`。
   */
  args?: string[];
  /** 硬性逾時（毫秒）。預設 240000（4 分鐘）。 */
  timeoutMs?: number;
  /**
   * 工作目錄。預設為系統暫存目錄，讓 CLI 不會載入當前專案的設定檔
   * （GEMINI.md / CLAUDE.md / hooks 等），可降低 token 開銷與延遲。
   */
  cwd?: string;
  /** 額外環境變數，會與 process.env 合併。 */
  env?: Record<string, string>;
  /**
   * 結束碼判定為失敗的條件。預設只要非 0 即視為錯誤。
   * 某些 CLI 即使有輸出仍回傳非 0，可用此關閉嚴格檢查（傳 false）。
   */
  failOnNonZeroExit?: boolean;
}

/**
 * Spawn 一個接受 `-p <prompt>` 的本機 CLI 模型，把 context 從 stdin 餵入，
 * 回傳 CLI 的原始 stdout（已 trim）。
 *
 * 本函式不解析 CLI 的 JSON envelope —— 不同 CLI 的 envelope 形狀不同
 * （gemini 用 `response`、claude 用 `result`…）。請在呼叫端取得 stdout 後，
 * 視需要搭配 jsonRepair.extractJson 從中提取模型回應或 envelope 欄位。
 *
 * @param command     要執行的 CLI 名稱或路徑（如 "gemini"、"claude"）。
 * @param instruction 簡短指令，透過 `-p` 傳入。
 * @param context     大型 context（書本內文、先前 JSON…），透過 stdin 餵入。
 * @param opts        參數、逾時、cwd、env 等覆寫選項。
 * @returns           CLI 的 stdout（trim 後）。
 */
export function spawnCliModel(
  command: string,
  instruction: string,
  context?: string,
  opts: SpawnCliModelOptions = {}
): Promise<string> {
  const timeoutMs = opts.timeoutMs ?? 240_000;
  const failOnNonZeroExit = opts.failOnNonZeroExit ?? true;
  const args = [...(opts.args ?? []), "-p", instruction];

  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: opts.cwd ?? os.tmpdir(),
      env: { ...process.env, ...(opts.env ?? {}) },
    });

    let stdout = "";
    let stderr = "";
    let settled = false;

    const timer = setTimeout(() => {
      settled = true;
      child.kill("SIGKILL");
      reject(new Error(`${command} CLI timed out after ${timeoutMs}ms`));
    }, timeoutMs);

    child.stdout.on("data", (d) => (stdout += d.toString()));
    child.stderr.on("data", (d) => (stderr += d.toString()));

    child.on("error", (err) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      reject(
        new Error(
          `Failed to launch ${command} CLI: ${err.message}. Is it installed & on PATH?`
        )
      );
    });

    child.on("close", (code) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      const trimmed = stdout.trim();
      if (failOnNonZeroExit && code !== 0 && trimmed === "") {
        return reject(
          new Error(
            `${command} CLI exited ${code} with no stdout. stderr: ${stderr.slice(0, 600)}`
          )
        );
      }
      resolve(trimmed);
    });

    if (context) child.stdin.write(context);
    child.stdin.end();
  });
}
