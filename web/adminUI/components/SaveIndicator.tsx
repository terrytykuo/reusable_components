import type { SaveStatus } from '../hooks/useSave'

/**
 * SaveIndicator
 * idle 時不顯示；saving/saved/error 分別顯示不同顏色與文字。
 */
export function SaveIndicator({ status }: { status: SaveStatus }) {
  if (status === 'idle') return null
  const cls =
    status === 'saving'
      ? 'text-gray-400'
      : status === 'saved'
        ? 'text-green-500'
        : 'text-red-500'
  const label =
    status === 'saving' ? 'Saving…' : status === 'saved' ? '✓ Saved' : '✗ Error'
  return <span className={`text-xs ml-2 ${cls}`}>{label}</span>
}

/**
 * FieldLabel
 * 欄位標籤 + 右側 SaveIndicator 組合。
 */
export function FieldLabel({ label, status }: { label: string; status: SaveStatus }) {
  return (
    <div className="flex items-center mb-1">
      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}</span>
      <SaveIndicator status={status} />
    </div>
  )
}
