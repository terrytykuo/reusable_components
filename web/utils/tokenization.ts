/**
 * Unicode 感知的文字分詞工具，零業務綁定。
 *
 * 把任意文字切成「詞」與「非詞（空白／標點）」交錯的 token 序列，並提供
 * 詞數統計與正規化 helper。基於 Unicode property escapes（`\p{P}`、`\p{S}`），
 * 對中英文與各種符號皆適用，連字號（hyphen）視為詞的一部分而非分隔符。
 *
 * 來源：wiser/src/tokenization.ts（語言學習 app 的閱讀器分詞核心）。
 */

export type TextToken = {
  text: string;
  isWord: boolean;
};

// 標點（P）與符號（S）視為斷詞點……
const BREAKING_PUNCTUATION = /[\p{P}\p{S}]/u;
// ……但連字號例外（例如 "well-known" 應視為單一詞）。
const HYPHEN_CHARS = /[-‐-―]/g;

function isBreakingPunctuation(char: string) {
  return BREAKING_PUNCTUATION.test(char) && !HYPHEN_CHARS.test(char);
}

/** 將文字切成詞 / 非詞交錯的 token 序列，保留原始字元（可無損還原）。 */
export function tokenizeText(text: string): TextToken[] {
  const tokens: TextToken[] = [];
  let buffer = '';
  let isWordBuffer: boolean | null = null;

  const flush = () => {
    if (!buffer || isWordBuffer === null) return;
    tokens.push({ text: buffer, isWord: isWordBuffer });
    buffer = '';
    isWordBuffer = null;
  };

  for (const char of text) {
    const isWord = !/\s/u.test(char) && !isBreakingPunctuation(char);

    if (isWordBuffer !== null && isWordBuffer !== isWord) {
      flush();
    }

    buffer += char;
    isWordBuffer = isWord;
  }

  flush();
  return tokens;
}

/** 去除連字號與前後空白，得到「裸詞」。 */
export function normalizeWord(word: string) {
  return word.replace(HYPHEN_CHARS, '').trim();
}

/** 取得詞的查詢鍵（正規化 + 小寫），可作為字典／快取的 key。 */
export function getWordKey(word: string) {
  return normalizeWord(word).toLocaleLowerCase();
}

/** 統計文字中的有效詞數（排除空白、標點與空字串）。 */
export function countWords(text: string) {
  return tokenizeText(text).filter((token) => token.isWord && normalizeWord(token.text)).length;
}
