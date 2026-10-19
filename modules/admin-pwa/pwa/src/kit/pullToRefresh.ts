import { useEffect, useRef, useState, type RefObject } from 'react'
import { t } from '../i18n'

export const PULL_THRESHOLD = 72
const MAX_PULL = 120

export interface PullState {
  /** Current pull distance in px (0 when idle). */
  pull: number
  /** True once the pull passed the threshold and `onRefresh` is running. */
  refreshing: boolean
}

/**
 * Pull-to-refresh for a home-screen PWA, which has no browser-provided one.
 * Touch starts at scrollTop 0, dragging down past PULL_THRESHOLD and
 * releasing calls `onRefresh`. Cheap: no library, no layout thrash — the
 * caller renders a small indicator from `pull`.
 */
export function usePullToRefresh(ref: RefObject<HTMLElement | null>, onRefresh: () => Promise<unknown> | void): PullState {
  const [pull, setPull] = useState(0)
  const [refreshing, setRefreshing] = useState(false)
  const startY = useRef<number | null>(null)
  const pullRef = useRef(0)
  const latest = useRef(onRefresh)
  useEffect(() => {
    latest.current = onRefresh
  }, [onRefresh])

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const scrollTop = () => Math.max(window.scrollY, document.documentElement.scrollTop, el.scrollTop)

    const onStart = (e: TouchEvent) => {
      if (refreshing || scrollTop() > 0 || e.touches.length !== 1) return
      startY.current = e.touches[0].clientY
    }
    const onMove = (e: TouchEvent) => {
      if (startY.current === null) return
      const dy = e.touches[0].clientY - startY.current
      if (dy <= 0 || scrollTop() > 0) {
        pullRef.current = 0
        setPull(0)
        return
      }
      // Rubber-band: half the finger travel, capped.
      pullRef.current = Math.min(MAX_PULL, dy / 2)
      setPull(pullRef.current)
      if (e.cancelable) e.preventDefault()
    }
    const onEnd = () => {
      const reached = pullRef.current >= PULL_THRESHOLD
      startY.current = null
      pullRef.current = 0
      setPull(0)
      if (!reached) return
      setRefreshing(true)
      Promise.resolve()
        .then(() => latest.current())
        .finally(() => setRefreshing(false))
    }

    el.addEventListener('touchstart', onStart, { passive: true })
    el.addEventListener('touchmove', onMove, { passive: false })
    el.addEventListener('touchend', onEnd)
    el.addEventListener('touchcancel', onEnd)
    return () => {
      el.removeEventListener('touchstart', onStart)
      el.removeEventListener('touchmove', onMove)
      el.removeEventListener('touchend', onEnd)
      el.removeEventListener('touchcancel', onEnd)
    }
  }, [ref, refreshing])

  return { pull, refreshing }
}

/** Indicator copy for a given pull state. */
export function pullLabel({ pull, refreshing }: PullState): string | null {
  if (refreshing) return t.refreshing
  if (pull <= 0) return null
  return pull >= PULL_THRESHOLD ? t.releaseToRefresh : t.pullToRefresh
}
