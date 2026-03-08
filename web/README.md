# Reusable Components — web/

跨 app 可復用的 Web（React + Tailwind CSS）功能元件庫。

---

## 資料夾結構

```
web/
├── README.md                             ← 本文件
├── INDEX.md                              ← 每個元件的完整說明（最多 500 字）
│
└── adminUI/                              ← 資料管理後台 UI 元件
    ├── hooks/
    │   └── useSave.ts                    ← debounce auto-save hook
    └── components/
        ├── MasterDetailLayout.tsx        ← sidebar 清單 + 右側編輯面板
        ├── SaveIndicator.tsx             ← 儲存狀態指示（含 FieldLabel）
        ├── TextField.tsx                 ← 單行/多行文字欄位
        ├── SelectField.tsx               ← 下拉選單欄位
        ├── TagListField.tsx              ← 字串陣列 tag 編輯器
        ├── ImagesField.tsx               ← 多圖上傳/刪除
        └── Section.tsx                   ← 表單區塊分組包裝
```

---

## 使用方式

1. 複製需要的元件到新專案的 `src/components/admin/` 或對應目錄
2. 複製 `hooks/useSave.ts`
3. 確認專案已安裝 Tailwind CSS

```tsx
import { MasterDetailLayout } from './components/admin/MasterDetailLayout'
import { useSave } from './hooks/useSave'
import { TextField, SelectField } from './components/admin/TextField'

function MyEditor({ item, onUpdate }) {
  const { save, status } = useSave(async (field, value) => {
    await fetch(`/api/items/${item.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ [field]: value }),
    })
  })
  // ...
}
```

詳細的 Props 說明與使用範例請見 [INDEX.md](./INDEX.md)。
