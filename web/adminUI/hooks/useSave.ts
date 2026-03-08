import { useCallback, useRef, useState } from 'react'

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

/**
 * useSave
 * 帶 debounce 的 per-field auto-save hook。
 * 每次呼叫 save(field, value) 時啟動計時器，
 * debounceMs 毫秒內再次呼叫則重置計時器（防抖）。
 * 儲存成功後 2 秒自動回到 idle 狀態。
 *
 * @param saveFn   實際的儲存函式，接收 field + value，回傳 Promise
 * @param debounceMs  防抖延遲，預設 800ms
 */
export function useSave(
  saveFn: (field: string, value: unknown) => Promise<void>,
  debounceMs = 800,
) {
  const timers = useRef<Record<string, ReturnType<typeof setTimeout>>>({})
  const [statuses, setStatuses] = useState<Record<string, SaveStatus>>({})

  const save = useCallback(
    (field: string, value: unknown) => {
      clearTimeout(timers.current[field])
      setStatuses(s => ({ ...s, [field]: 'saving' }))
      timers.current[field] = setTimeout(() => {
        saveFn(field, value)
          .then(() => {
            setStatuses(s => ({ ...s, [field]: 'saved' }))
            setTimeout(
              () => setStatuses(s => ({ ...s, [field]: 'idle' })),
              2000,
            )
          })
          .catch(() => setStatuses(s => ({ ...s, [field]: 'error' })))
      }, debounceMs)
    },
    [saveFn, debounceMs],
  )

  const status = (field: string): SaveStatus => statuses[field] ?? 'idle'

  return { save, status }
}
