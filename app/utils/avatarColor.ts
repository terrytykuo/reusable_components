/**
 * 預設頭像色盤（來自 cat_toxin_app 的暖色系）。
 */
export const DEFAULT_AVATAR_PALETTE = [
  '#5B8A7A',
  '#B86838',
  '#6C7BB6',
  '#C05A7C',
  '#8A6F3D',
  '#4A8FA8',
  '#7A8B4A',
  '#9A6B4F',
  '#6F6AA8',
  '#B55F49',
  '#5F7FA0',
  '#A66B8F',
];

function hashSeed(value: string): number {
  let hash = 0;

  for (let index = 0; index < value.length; index += 1) {
    hash = ((hash << 5) - hash + value.charCodeAt(index)) | 0;
  }

  return Math.abs(hash);
}

/**
 * 由 seed 字串的雜湊穩定地對應到一個色盤顏色。
 * 相同 seed 永遠得到相同顏色，適合做名稱 / id 的頭像底色。
 *
 * 解耦：改名為通用 `avatarColor`；seed 接受字串或多段字串陣列，
 * palette 可選傳入（未傳用 DEFAULT_AVATAR_PALETTE）。
 *
 * @param seed 單一字串，或多段（會 trim、濾空後以 ':' 串接）
 * @param palette 可選色盤
 *
 * @example
 * avatarColor('alice@example.com');
 * avatarColor(['cat', petId]);
 * avatarColor(name, ['#111', '#222', '#333']);
 */
export function avatarColor(
  seed: string | Array<string | undefined | null>,
  palette: string[] = DEFAULT_AVATAR_PALETTE,
): string {
  const pool = palette.length > 0 ? palette : DEFAULT_AVATAR_PALETTE;

  const resolvedSeed = (Array.isArray(seed) ? seed : [seed])
    .map((part) => part?.trim())
    .filter((part): part is string => !!part)
    .join(':');

  const index = hashSeed(resolvedSeed || 'avatar') % pool.length;
  return pool[index];
}
