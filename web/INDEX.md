# Web Components Index

---

## adminUI/hooks/

### `adminUI/hooks/useSave.ts`

**分類**: 狀態管理
**依賴**: `react`

**介面**:
```ts
function useSave(
  saveFn: (field: string, value: unknown) => Promise<void>,
  debounceMs?: number  // 預設 800
): {
  save: (field: string, value: unknown) => void
  status: (field: string) => SaveStatus  // 'idle' | 'saving' | 'saved' | 'error'
}
```

**功能說明**:
帶 debounce 的 per-field auto-save hook，是整個 adminUI 的核心。每個欄位獨立維護自己的計時器與儲存狀態，互不干擾。

呼叫 `save(field, value)` 後啟動計時器，`debounceMs` 毫秒內若再次呼叫同一 field 則重置（防止每個 keystroke 都觸發 API）。計時器到期後執行 `saveFn`，並更新該 field 的 status：`saving → saved`（2 秒後回到 `idle`）或 `error`。

`saveFn` 完全由外部定義，可對接任何後端（REST API、Firebase、GraphQL）。

**典型用法**（搭配 REST PATCH）:
```ts
const { save, status } = useSave(async (field, value) => {
  await fetch(`/api/items/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ [field]: value }),
  })
})
```

**來源**: `cat_toxin_app/admin/src/ToxinEditor.tsx` → `useSave`

---

## adminUI/components/

### `adminUI/components/SaveIndicator.tsx`

**分類**: 回饋
**依賴**: `react`、`useSave`（型別）

**匯出**:
- `SaveIndicator({ status })` — 狀態文字（idle 時不渲染）
- `FieldLabel({ label, status })` — 欄位標籤 + SaveIndicator 組合

**功能說明**:
`SaveIndicator` 在 `idle` 時 return null（不佔空間）；`saving` 顯示灰色「Saving…」、`saved` 顯示綠色「✓ Saved」、`error` 顯示紅色「✗ Error」。`FieldLabel` 將標籤文字與 SaveIndicator 並排，是所有 field 元件的標題列。

**來源**: `cat_toxin_app/admin/src/ToxinEditor.tsx` → `Dot`, `FieldLabel`

---

### `adminUI/components/TextField.tsx`

**分類**: 表單輸入
**依賴**: `react`、`SaveIndicator`

**Props**:
| Prop | 型別 | 必填 | 說明 |
|------|------|------|------|
| `label` | `string` | 是 | 欄位標籤 |
| `field` | `string` | 是 | 欄位名稱（傳給 onSave 的 key） |
| `value` | `string` | 是 | 受控值 |
| `onSave` | `(field, value) => void` | 是 | 通常傳入 useSave 的 save |
| `multiline` | `boolean` | 否 | true 時渲染 textarea，預設 false |
| `rows` | `number` | 否 | textarea 行數，預設 4 |
| `saveStatus` | `SaveStatus` | 否 | 傳入顯示儲存狀態 |

**功能說明**:
維護 local state 避免受控輸入卡頓，同時透過 `useEffect` 與外部 value 保持同步。每次 onChange 即呼叫 `onSave`，搭配 `useSave` 的 debounce 達到「打完字自動存」效果。

**來源**: `cat_toxin_app/admin/src/ToxinEditor.tsx` → `TextField`

---

### `adminUI/components/SelectField.tsx`

**分類**: 表單輸入
**依賴**: `react`、`SaveIndicator`

**Props**:
| Prop | 型別 | 必填 | 說明 |
|------|------|------|------|
| `label` | `string` | 是 | 欄位標籤 |
| `field` | `string` | 是 | 欄位名稱 |
| `value` | `T` | 是 | 目前選中值 |
| `options` | `T[]` | 是 | 選項列表 |
| `onSave` | `(field, value: T) => void` | 是 | onChange 即觸發 |
| `saveStatus` | `SaveStatus` | 否 | 儲存狀態 |

**功能說明**:
泛型 `T extends string` 下拉選單，onChange 立即觸發 onSave（無需 debounce，因為下拉選擇是離散操作）。

**來源**: `cat_toxin_app/admin/src/ToxinEditor.tsx` → `SelectField`

---

### `adminUI/components/TagListField.tsx`

**分類**: 表單輸入
**依賴**: `react`、`SaveIndicator`

**Props**:
| Prop | 型別 | 必填 | 說明 |
|------|------|------|------|
| `label` | `string` | 是 | 欄位標籤 |
| `field` | `string` | 是 | 欄位名稱 |
| `value` | `string[]` | 是 | 目前 tag 陣列 |
| `onSave` | `(field, value: string[]) => void` | 是 | 每次新增/刪除即觸發 |
| `placeholder` | `string` | 否 | 輸入框提示，預設 'Add item…' |
| `saveStatus` | `SaveStatus` | 否 | 儲存狀態 |

**功能說明**:
顯示現有 tag（灰色 pill，× 可移除），下方輸入框支援 Enter 鍵或點擊 Add 新增。重複值自動忽略。每次新增或移除即呼叫 onSave，搭配 useSave 的 debounce 或直接不 debounce（通常陣列操作不需要）。

**使用情境**: 別名、標籤、關鍵字、分類等字串陣列欄位
**來源**: `cat_toxin_app/admin/src/ToxinEditor.tsx` → `TagListField`

---

### `adminUI/components/ImagesField.tsx`

**分類**: 媒體管理
**依賴**: `react`

**Props**:
| Prop | 型別 | 必填 | 說明 |
|------|------|------|------|
| `images` | `string[]` | 是 | 目前圖片 URL 陣列 |
| `onUpload` | `(file: File) => Promise<string>` | 是 | 上傳邏輯，回傳新圖片 URL |
| `onDelete` | `(index: number) => Promise<string[]>` | 是 | 刪除邏輯，回傳更新後的 URL 陣列 |
| `onChange` | `(urls: string[]) => void` | 是 | 更新外部狀態 |
| `coverLabel` | `string` | 否 | 第一張封面標籤，預設 '封面' |

**功能說明**:
顯示現有圖片縮圖（hover 顯示刪除按鈕），最後一格為虛線 + 按鈕。上傳與刪除的 API 邏輯完全由外部定義，元件只負責 UI 與狀態。

搭配 Firebase Storage 範例：
```ts
onUpload={async (file) => {
  const ref = storageRef(storage, `items/${id}/${file.name}`)
  await uploadBytes(ref, file)
  return getDownloadURL(ref)
}}
```

**使用情境**: 任何需要管理多圖的 admin 表單
**來源**: `cat_toxin_app/admin/src/ToxinEditor.tsx` → `ImagesField`

---

### `adminUI/components/Section.tsx`

**分類**: 佈局
**依賴**: `react`

**Props**:
| Prop | 型別 | 必填 | 說明 |
|------|------|------|------|
| `title` | `string` | 是 | 區塊標題（自動轉大寫小字） |
| `children` | `ReactNode` | 是 | 區塊內容 |

**功能說明**:
上方細分隔線（`border-t`）+ 全大寫灰色小字標題 + 垂直間距內容區。用於將長表單分成語意清晰的群組（Basic Info、Description、Media 等）。

**來源**: `cat_toxin_app/admin/src/ToxinEditor.tsx` → `Section`

---

### `adminUI/components/MasterDetailLayout.tsx`

**分類**: 佈局
**依賴**: `react`

**Props**:
| Prop | 型別 | 必填 | 說明 |
|------|------|------|------|
| `sidebarHeader` | `ReactNode` | 是 | sidebar 頂部（搜尋、篩選器） |
| `sidebarList` | `ReactNode` | 是 | sidebar 清單（可捲動） |
| `sidebarFooter` | `ReactNode` | 否 | sidebar 底部（統計、版本號） |
| `main` | `ReactNode` | 是 | 右側主內容（編輯器、詳情） |
| `emptyText` | `string` | 否 | 未選取時的提示，預設 '← Select an item to edit' |
| `sidebarWidth` | `string` | 否 | Tailwind 寬度 class，預設 `'w-64'` |

**功能說明**:
全螢幕兩欄 admin 佈局：左側固定寬 sidebar（頂部 header + 中間可捲動清單 + 底部 footer），右側 flex-1 可捲動主面板。sidebar 與主面板以 `border-r` 分隔。`main` 為 null 時顯示 `emptyText` 佔位提示。

**使用情境**: 任何有「清單選取 → 右側編輯」互動的資料管理後台
**來源**: `cat_toxin_app/admin/src/App.tsx`
