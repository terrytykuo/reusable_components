import type { ReactNode } from 'react'

interface Props {
  title: string
  children: ReactNode
}

/**
 * Section
 * 上方細分隔線 + 全大寫小字標題 + 內容區的 admin 表單區塊包裝。
 */
export function Section({ title, children }: Props) {
  return (
    <div className="border-t border-gray-100 pt-5">
      <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">{title}</h2>
      <div className="space-y-4">{children}</div>
    </div>
  )
}
