import { useEffect, useState } from 'react'
import { FieldLabel } from './SaveIndicator'
import type { SaveStatus } from '../hooks/useSave'

const INPUT_CLS = 'w-full border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-400 resize-y'

interface Props {
  label: string
  field: string
  value: string
  onSave: (field: string, value: string) => void
  /** true 時渲染 textarea，預設 false */
  multiline?: boolean
  /** multiline 時的預設行數，預設 4 */
  rows?: number
  saveStatus?: SaveStatus
}

/**
 * TextField
 * 單行或多行文字輸入，每次 onChange 即觸發 onSave（搭配 useSave 防抖使用）。
 */
export function TextField({ label, field, value, onSave, multiline = false, rows = 4, saveStatus = 'idle' }: Props) {
  const [local, setLocal] = useState(value)
  useEffect(() => setLocal(value), [value])

  const handleChange = (val: string) => {
    setLocal(val)
    onSave(field, val)
  }

  return (
    <div>
      <FieldLabel label={label} status={saveStatus} />
      {multiline ? (
        <textarea
          value={local}
          rows={rows}
          onChange={e => handleChange(e.target.value)}
          className={INPUT_CLS}
        />
      ) : (
        <input
          value={local}
          onChange={e => handleChange(e.target.value)}
          className={INPUT_CLS}
        />
      )}
    </div>
  )
}
