import { FieldLabel } from './SaveIndicator'
import type { SaveStatus } from '../hooks/useSave'

interface Props<T extends string> {
  label: string
  field: string
  value: T
  options: T[]
  onSave: (field: string, value: T) => void
  saveStatus?: SaveStatus
}

/**
 * SelectField
 * 下拉選單，onChange 即觸發 onSave。
 */
export function SelectField<T extends string>({ label, field, value, options, onSave, saveStatus = 'idle' }: Props<T>) {
  return (
    <div>
      <FieldLabel label={label} status={saveStatus} />
      <select
        value={value}
        onChange={e => onSave(field, e.target.value as T)}
        className="border border-gray-200 rounded px-2 py-1.5 text-sm focus:outline-none focus:border-blue-400"
      >
        {options.map(o => (
          <option key={o} value={o}>{o}</option>
        ))}
      </select>
    </div>
  )
}
