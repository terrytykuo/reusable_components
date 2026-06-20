/**
 * Cloudflare Pages/Workers Function 的統一 JSON 回應與 CORS helper，可獨立使用。
 *
 * 把「設好 Content-Type、Cache-Control、（可選）CORS header 的 Response」
 * 包成幾個小函式，讓 handler 只專注在資料本身。
 *
 * 來源：wiser/functions/api/[[path]].ts 的 json() / error() Response helper，
 *       額外補上可組合的 CORS helper 與 OPTIONS preflight 處理。
 *
 * 用法：
 *   return json({ items });                       // 200
 *   return json(entry, { status: 201 });
 *   return error('Not found', 404);
 *   // 全域加 CORS：
 *   const { json, error, preflight } = createResponders({ cors: true });
 */

export interface ResponderOptions {
  /** true 套用寬鬆 CORS（`*`），或傳入自訂 CORS 設定。 */
  cors?: boolean | CorsOptions;
  /** 覆寫預設 Cache-Control，預設 `'no-store'`。傳 null 可不設。 */
  cacheControl?: string | null;
}

export interface CorsOptions {
  origin?: string;          // 預設 '*'
  methods?: string;         // 預設 'GET,POST,PATCH,DELETE,OPTIONS'
  headers?: string;         // 預設 'Content-Type, Authorization'
  maxAge?: number;          // preflight 快取秒數，預設 86400
}

/** 產生 CORS header 物件。 */
export function corsHeaders(options: CorsOptions = {}): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': options.origin ?? '*',
    'Access-Control-Allow-Methods': options.methods ?? 'GET,POST,PATCH,DELETE,OPTIONS',
    'Access-Control-Allow-Headers': options.headers ?? 'Content-Type, Authorization',
    'Access-Control-Max-Age': String(options.maxAge ?? 86400),
  };
}

function buildBaseHeaders(opts: ResponderOptions, init: ResponseInit): Headers {
  const headers = new Headers(init.headers);
  headers.set('Content-Type', 'application/json; charset=utf-8');
  if (opts.cacheControl !== null) {
    headers.set('Cache-Control', opts.cacheControl ?? 'no-store');
  }
  if (opts.cors) {
    const cors = opts.cors === true ? corsHeaders() : corsHeaders(opts.cors);
    for (const [k, v] of Object.entries(cors)) headers.set(k, v);
  }
  return headers;
}

/** 建立一組共用設定（CORS / Cache-Control）的回應函式。 */
export function createResponders(opts: ResponderOptions = {}) {
  function json(data: unknown, init: ResponseInit = {}): Response {
    const headers = buildBaseHeaders(opts, init);
    return new Response(JSON.stringify(data), { ...init, headers });
  }

  function error(message: string, status = 400): Response {
    return json({ error: message }, { status });
  }

  /** 回應 CORS preflight（OPTIONS）。未啟用 cors 時回 204 空 body。 */
  function preflight(): Response {
    const headers = new Headers();
    if (opts.cors) {
      const cors = opts.cors === true ? corsHeaders() : corsHeaders(opts.cors);
      for (const [k, v] of Object.entries(cors)) headers.set(k, v);
    }
    return new Response(null, { status: 204, headers });
  }

  return { json, error, preflight };
}

// 預設導出一組無 CORS 的 responders（行為等同原始 wiser helper）。
const defaults = createResponders();
export const json = defaults.json;
export const error = defaults.error;
export const preflight = defaults.preflight;
