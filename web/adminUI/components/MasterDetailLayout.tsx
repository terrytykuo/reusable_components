import type { ReactNode } from 'react'

interface Props {
  /** Sidebar 頂部（搜尋欄、篩選器等） */
  sidebarHeader: ReactNode
  /** Sidebar 清單項目（可捲動區域） */
  sidebarList: ReactNode
  /** Sidebar 底部（統計數字、版本等） */
  sidebarFooter?: ReactNode
  /** 右側主要內容（編輯器、詳情頁等） */
  main: ReactNode
  /** 未選取任何項目時的佔位提示文字 */
  emptyText?: string
  /** sidebar 寬度，預設 'w-64' */
  sidebarWidth?: string
}

/**
 * MasterDetailLayout
 * 左側 sidebar 清單 + 右側詳情編輯面板的兩欄 admin 佈局。
 * 全螢幕高度，sidebar 固定寬，右側可捲動。
 */
export function MasterDetailLayout({
  sidebarHeader,
  sidebarList,
  sidebarFooter,
  main,
  emptyText = '← Select an item to edit',
  sidebarWidth = 'w-64',
}: Props) {
  return (
    <div className={`flex h-screen bg-white text-gray-900 text-sm`}>
      <aside className={`${sidebarWidth} flex flex-col border-r border-gray-200 shrink-0`}>
        <div className="p-3 border-b border-gray-200">
          {sidebarHeader}
        </div>
        <div className="overflow-y-auto flex-1">
          {sidebarList}
        </div>
        {sidebarFooter && (
          <div className="p-2 border-t border-gray-200 text-xs text-gray-400 text-center">
            {sidebarFooter}
          </div>
        )}
      </aside>

      <main className="flex-1 overflow-y-auto">
        {main ?? (
          <div className="flex items-center justify-center h-full text-gray-400">
            {emptyText}
          </div>
        )}
      </main>
    </div>
  )
}
