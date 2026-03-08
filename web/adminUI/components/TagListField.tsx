import { useEffect, useState } from 'react'
import { FieldLabel } from './SaveIndicator'
import type { SaveStatus } from '../hooks/useSave'

interface Props {
  label: string
  field: string
  value: string[]
  onSave: (field: string, value: string[]) => void
  placeholder?: string
  saveStatus?: SaveStatus
}

/**
 * TagListField
 * 字串陣列編輯器：顯示現有 tag（可點 × 移除），下方輸入框可新增。
 * Enter 或點擊 Add 按鈕確認新增；重複值不允許加入。
 */
export function TagListField({ label, field, value, onSave, placeholder = 'Add item…', saveStatus = 'idle' }: Props) {
  const [items, setItems] = useState(value)
  const [draft, setDraft] = useState('')
  useEffect(() => setItems(value), [value])

  const commit = (next: string[]) => {
    setItems(next)
    onSave(field, next)
  }

  const add = () => {
    const trimmed = draft.trim()
    if (!trimmed || items.includes(trimmed)) return
    commit([...items, trimmed])
    setDraft('')
  }

  return (
    <div>
      <FieldLabel label={label} status={saveStatus} />
      <div className="flex flex-wrap gap-1.5 mb-2">
        {items.map((item, i) => (
          <span key={i} className="flex items-center gap-1 bg-gray-100 rounded px-2 py-0.5 text-xs">
            {item}
            <button
              onClick={() => commit(items.filter((_, idx) => idx !== i))}
              className="text-gray-400 hover:text-red-500 ml-0.5 font-bold"
            >
              ×
            </button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && add()}
          placeholder={placeholder}
          className="border border-gray-200 rounded px-2 py-1 text-sm focus:outline-none focus:border-blue-400 flex-1"
        />
        <button
          onClick={add}
          className="px-3 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600"
        >
          Add
        </button>
      </div>
    </div>
  )
}
