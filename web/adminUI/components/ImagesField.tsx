import { useRef, useState } from 'react'

interface Props {
  images: string[]
  /** 上傳一張圖片，回傳新圖片的 URL */
  onUpload: (file: File) => Promise<string>
  /** 刪除第 index 張圖片，回傳更新後的 URL 陣列 */
  onDelete: (index: number) => Promise<string[]>
  onChange: (urls: string[]) => void
  /** 第一張圖片的封面標籤文字，預設 '封面' */
  coverLabel?: string
}

/**
 * ImagesField
 * 多圖上傳/刪除元件。顯示現有圖片縮圖（hover 顯示刪除按鈕），
 * 最後一格為虛線上傳按鈕。
 *
 * 上傳與刪除邏輯由外部 onUpload / onDelete 傳入，與 API / Storage 解耦。
 */
export function ImagesField({ images, onUpload, onDelete, onChange, coverLabel = '封面' }: Props) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    setError(null)
    try {
      const url = await onUpload(file)
      onChange([...images, url])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  const handleDelete = async (index: number) => {
    try {
      const updated = await onDelete(index)
      onChange(updated)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed')
    }
  }

  return (
    <div className="shrink-0">
      <div className="flex gap-2 flex-wrap">
        {images.map((url, i) => (
          <div key={url} className="relative w-24 h-24 rounded-lg border border-gray-200 overflow-hidden group">
            <img src={url} alt={`Image ${i + 1}`} className="w-full h-full object-cover" />
            {i === 0 && (
              <span className="absolute top-1 left-1 bg-black/60 text-white text-[9px] px-1 rounded">
                {coverLabel}
              </span>
            )}
            <button
              onClick={() => handleDelete(i)}
              className="absolute top-1 right-1 w-5 h-5 bg-black/60 text-white rounded-full text-xs opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
            >
              ×
            </button>
          </div>
        ))}

        <div
          className="w-24 h-24 rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors"
          onClick={() => !uploading && inputRef.current?.click()}
        >
          {uploading ? (
            <span className="text-gray-400 text-xs">上傳中…</span>
          ) : (
            <>
              <span className="text-gray-400 text-2xl leading-none">+</span>
              <span className="text-gray-400 text-[10px] mt-1">新增圖片</span>
            </>
          )}
        </div>
      </div>
      {error && <p className="text-red-500 text-[10px] mt-1 leading-tight">{error}</p>}
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleUpload} />
    </div>
  )
}
