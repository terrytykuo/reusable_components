import { useState } from 'react'
import { t } from '../i18n'
import { saveKitImages } from './saveKitImages'
import type { Slide } from './types'

interface Props {
  kitId: string
  slides: Slide[]
  /** Share-sheet title; defaults to the kit id. */
  shareTitle?: string
}

/**
 * "Save all images": every slide of a kit, one image each, through the system
 * share sheet (phones: straight into the photo library). Renders nothing
 * without downloadable slides.
 */
export function DownloadAllButton({ kitId, slides, shareTitle }: Props) {
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [hint, setHint] = useState<string | null>(null)

  if (!slides.some((s) => s.url)) return null
  const running = progress !== null

  async function run() {
    if (running) return
    setError(null)
    setHint(null)
    setProgress({ done: 0, total: slides.filter((s) => s.url).length })
    try {
      const result = await saveKitImages(kitId, slides, {
        title: shareTitle,
        onProgress: (done, total) => setProgress({ done, total }),
      })
      if (result === 'downloaded') setHint(t.downloadedHint)
    } catch (e) {
      const name = e instanceof Error ? e.name : ''
      // iOS drops the tap's activation if the fetch took too long; the images
      // are cached now, so a second tap opens the sheet at once.
      setError(name === 'NotAllowedError' ? t.tapAgain : e instanceof Error ? e.message : String(e))
    } finally {
      setProgress(null)
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => void run()}
        disabled={running}
        className="min-h-11 w-full rounded-full border border-line bg-card px-4 text-sm font-medium text-ink active:bg-paper-strong disabled:opacity-45"
      >
        {running ? t.preparing(progress.done, progress.total) : t.saveAllImages}
      </button>
      {hint && <p className="mt-2 text-sm text-ink-muted">{hint}</p>}
      {error && (
        <p role="alert" className="mt-2 text-sm break-words text-danger-text">
          {t.saveFailed(error)}
        </p>
      )}
    </div>
  )
}
