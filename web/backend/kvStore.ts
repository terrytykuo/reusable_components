/**
 * Cloudflare Workers / Pages KV 的型別化 JSON 讀寫包裝，可獨立使用。
 *
 * Cloudflare KV 原生 API 是字串導向的；本工具把 get/put 包成 JSON 化、
 * 帶 fallback、且具名綁定檢查的 helper，讓 Function handler 不必重複處理
 * 序列化與「綁定不存在」的錯誤。
 *
 * 來源：wiser/functions/api/[[path]].ts 的 KV 讀寫包裝（getKV / readJson / writeJson）。
 *
 * 用法：
 *   const kv = createKvStore(env.MY_KV);          // 或 createKvStore(env, 'MY_KV')
 *   const items = await kv.readJson('items', []);  // 帶預設值，永不回傳 null
 *   await kv.writeJson('items', items);
 */

/** Cloudflare KV namespace 中本工具用到的子集。 */
export interface JsonKVNamespace {
  get<T>(key: string, type: 'json'): Promise<T | null>;
  put(key: string, value: string, options?: { expirationTtl?: number; expiration?: number }): Promise<void>;
  delete?(key: string): Promise<void>;
}

export interface KvStore {
  /** 讀取並解析 JSON；不存在時回傳 fallback（永不回傳 null）。 */
  readJson<T>(key: string, fallback: T): Promise<T>;
  /** 序列化並寫入；可選 TTL（秒）。 */
  writeJson(key: string, value: unknown, options?: { expirationTtl?: number }): Promise<void>;
  /** 刪除指定 key（若底層 namespace 支援）。 */
  remove(key: string): Promise<void>;
  /** 取得底層 namespace（進階用途）。 */
  raw: JsonKVNamespace;
}

/**
 * 建立型別化 KV store。
 *
 * @param binding  直接傳入 KV namespace，或傳入 env 物件 +（第二參數）綁定名稱。
 * @param bindingName  當第一參數是 env 物件時，KV 綁定的屬性名。
 */
export function createKvStore(binding: JsonKVNamespace): KvStore;
export function createKvStore(
  env: Record<string, unknown>,
  bindingName: string,
): KvStore;
export function createKvStore(
  bindingOrEnv: JsonKVNamespace | Record<string, unknown>,
  bindingName?: string,
): KvStore {
  const namespace = bindingName
    ? (bindingOrEnv as Record<string, unknown>)[bindingName]
    : bindingOrEnv;

  if (!namespace || typeof (namespace as JsonKVNamespace).get !== 'function') {
    const label = bindingName ?? 'KV namespace';
    throw new Error(
      `Missing ${label} binding. Create and bind a Cloudflare KV namespace before deploying.`,
    );
  }

  const kv = namespace as JsonKVNamespace;

  return {
    async readJson<T>(key: string, fallback: T): Promise<T> {
      return (await kv.get<T>(key, 'json')) ?? fallback;
    },
    async writeJson(key, value, options) {
      await kv.put(key, JSON.stringify(value), options);
    },
    async remove(key) {
      if (typeof kv.delete === 'function') {
        await kv.delete(key);
      }
    },
    raw: kv,
  };
}

export default createKvStore;
