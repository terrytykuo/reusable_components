import { t } from '../i18n'
import type { Slide } from './types'

export interface SaveKitOptions {
  /** Called with (done, total) before the first fetch and after each one. */
  onProgress?: (done: number, total: number) => void
  /** Share-sheet title; defaults to the kit id. */
  title?: string
  fetchImpl?: (url: string) => Promise<Response>
  /** Test seam for `navigator`. */
  nav?: Pick<Navigator, 'share' | 'canShare'>
}

export type SaveKitResult = 'shared' | 'cancelled' | 'downloaded'

/**
 * Hands every slide image to the system share sheet as separate files, so on a
 * phone they land in the photo library (iOS: "Save N Images"; Android: gallery).
 * Where files cannot be shared (desktop browsers), each image is downloaded on
 * its own instead. Never zips. Needs CORS GET on the image host for the app
 * origin. Rejects (and saves nothing) if any image fails. File names are
 * `${kitId}-${slide.file}`.
 */
export async function saveKitImages(kitId: string, slides: Slide[], options: SaveKitOptions = {}): Promise<SaveKitResult> {
  const { onProgress, title = kitId, fetchImpl = (url: string) => fetch(url), nav = navigator } = options
  const todo = slides.filter((s): s is Slide & { url: string } => !!s.url)
  if (todo.length === 0) throw new Error(t.noImagesToSave)

  onProgress?.(0, todo.length)
  let done = 0
  // Parallel: the share sheet must open while the tap's user activation is
  // still fresh, so the fetches should finish as fast as the network allows.
  const files = await Promise.all(
    todo.map(async (slide) => {
      let res: Response
      try {
        res = await fetchImpl(slide.url)
      } catch (e) {
        throw new Error(`${slide.file}：${e instanceof Error ? e.message : String(e)}`, { cause: e })
      }
      if (!res.ok) throw new Error(`${slide.file}：HTTP ${res.status}`)
      const blob = await res.blob()
      onProgress?.(++done, todo.length)
      return new File([blob], `${kitId}-${slide.file}`, { type: blob.type || 'image/jpeg' })
    }),
  )

  if (typeof nav.share === 'function' && typeof nav.canShare === 'function' && nav.canShare({ files })) {
    try {
      await nav.share({ files, title })
      return 'shared'
    } catch (e) {
      if (e instanceof Error && e.name === 'AbortError') return 'cancelled'
      throw e
    }
  }

  for (const file of files) saveBlob(file, file.name)
  return 'downloaded'
}

function saveBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.rel = 'noopener'
  document.body.appendChild(a)
  try {
    a.click()
  } finally {
    a.remove()
    // Revoking synchronously can cancel the download in Safari.
    setTimeout(() => URL.revokeObjectURL(url), 60_000)
  }
}
