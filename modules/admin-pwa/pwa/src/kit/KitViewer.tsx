import { useCallback, useEffect, useEffectEvent, useRef, useState } from 'react'
import { t } from '../i18n'
import type { Slide } from './types'

/** Horizontal snap strip of the kit's slides; tap one for a full-screen view. */
export function KitViewer({ slides }: { slides: Slide[] | null | undefined }) {
  const images = (slides ?? []).filter((s): s is Slide & { url: string } => typeof s.url === 'string' && s.url !== '')
  const stripRef = useRef<HTMLUListElement>(null)
  const [current, setCurrent] = useState(0)
  const [open, setOpen] = useState<number | null>(null)

  const onScroll = useCallback(() => {
    const el = stripRef.current
    if (!el || el.children.length === 0) return
    const first = el.children[0] as HTMLElement
    const second = el.children[1] as HTMLElement | undefined
    const step = second ? second.offsetLeft - first.offsetLeft : first.offsetWidth
    if (step <= 0) return
    setCurrent(Math.min(images.length - 1, Math.max(0, Math.round(el.scrollLeft / step))))
  }, [images.length])

  // A live snapshot can drop slides while the lightbox is open: clamp the index,
  // and close it once nothing is left (state adjusted during render, not in an effect).
  if (images.length === 0 && open !== null) setOpen(null)
  const openIndex = open === null || images.length === 0 ? null : Math.min(open, images.length - 1)

  if (images.length === 0) {
    return (
      <div className="flex aspect-[4/5] w-[85vw] max-w-md items-center justify-center rounded-md border border-line-light bg-paper-strong text-sm text-ink-muted">
        {t.noImages}
      </div>
    )
  }

  return (
    <div>
      <ul
        ref={stripRef}
        onScroll={onScroll}
        aria-label={t.slidesLabel}
        className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-px-4 px-4 pb-1 [scrollbar-width:none]"
      >
        {images.map((s, i) => (
          <li key={s.file || i} className="w-[85vw] max-w-md shrink-0 snap-start">
            <button
              type="button"
              onClick={() => setOpen(i)}
              aria-label={t.zoomSlide(i + 1)}
              className="block w-full overflow-hidden rounded-md border border-line-light bg-paper-strong"
            >
              <img src={s.url} alt={t.slideAlt(i + 1)} loading="lazy" decoding="async" className="block aspect-[4/5] w-full object-cover" />
            </button>
          </li>
        ))}
      </ul>
      <p className="mt-2 text-center text-xs tabular-nums text-ink-muted" aria-live="polite">
        {current + 1} / {images.length}
      </p>
      {openIndex !== null && (
        <Lightbox images={images} index={openIndex} onIndex={setOpen} onClose={() => setOpen(null)} />
      )}
    </div>
  )
}

function Lightbox({
  images,
  index,
  onIndex,
  onClose,
}: {
  images: { url: string }[]
  index: number
  onIndex: (i: number) => void
  onClose: () => void
}) {
  const closeRef = useRef<HTMLButtonElement>(null)
  const touchX = useRef<number | null>(null)
  const last = images.length - 1
  const prev = () => onIndex(Math.max(0, index - 1))
  const next = () => onIndex(Math.min(last, index + 1))
  // Effect event: always sees the current index, so the mount effect below never
  // re-runs on navigation (which used to re-focus the close button on every step).
  const onKey = useEffectEvent((e: KeyboardEvent) => {
    if (e.key === 'Escape') onClose()
    else if (e.key === 'ArrowLeft') prev()
    else if (e.key === 'ArrowRight') next()
  })

  useEffect(() => {
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null
    closeRef.current?.focus()
    const listener = (e: KeyboardEvent) => onKey(e)
    window.addEventListener('keydown', listener)
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', listener)
      document.body.style.overflow = overflow
      opener?.focus()
    }
  }, [])

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={t.slideDialog(index + 1, images.length)}
      className="fixed inset-0 z-50 flex flex-col bg-ink/95 pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]"
      onTouchStart={(e) => (touchX.current = e.touches[0]?.clientX ?? null)}
      onTouchEnd={(e) => {
        const start = touchX.current
        const end = e.changedTouches[0]?.clientX
        touchX.current = null
        if (start == null || end == null || Math.abs(end - start) < 40) return
        if (end < start) next()
        else prev()
      }}
    >
      <div className="flex items-center justify-between px-4 py-2">
        <span className="text-sm tabular-nums text-paper">
          {index + 1} / {images.length}
        </span>
        <button
          ref={closeRef}
          type="button"
          onClick={onClose}
          aria-label={t.close}
          className="flex size-11 items-center justify-center rounded-full text-2xl text-paper active:bg-ink-secondary"
        >
          ×
        </button>
      </div>
      <div className="flex min-h-0 flex-1 items-center justify-center">
        <img src={images[index].url} alt={t.slideAlt(index + 1)} decoding="async" className="max-h-full w-full object-contain" />
      </div>
      <div className="flex justify-between px-4 py-2">
        <button
          type="button"
          onClick={prev}
          disabled={index === 0}
          aria-label={t.prevSlide}
          className="flex size-11 items-center justify-center rounded-full text-2xl text-paper active:bg-ink-secondary disabled:opacity-30"
        >
          ‹
        </button>
        <button
          type="button"
          onClick={next}
          disabled={index === last}
          aria-label={t.nextSlide}
          className="flex size-11 items-center justify-center rounded-full text-2xl text-paper active:bg-ink-secondary disabled:opacity-30"
        >
          ›
        </button>
      </div>
    </div>
  )
}
