import { act, cleanup, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { PULL_THRESHOLD, pullLabel, usePullToRefresh } from '../pullToRefresh'

function touch(el: HTMLElement, type: string, y: number) {
  const ev = new Event(type, { bubbles: true, cancelable: true }) as TouchEvent & { touches: Array<{ clientY: number }> }
  Object.defineProperty(ev, 'touches', { value: type === 'touchend' ? [] : [{ clientY: y }] })
  el.dispatchEvent(ev)
}

describe('usePullToRefresh', () => {
  afterEach(() => {
    cleanup()
    window.scrollTo(0, 0)
  })

  function setup(onRefresh = vi.fn(() => Promise.resolve())) {
    const el = document.createElement('div')
    document.body.appendChild(el)
    const ref = { current: el }
    const hook = renderHook(() => usePullToRefresh(ref, onRefresh))
    return { el, hook, onRefresh }
  }

  it('reports pull distance while dragging down from the top, and refreshes past the threshold', async () => {
    const { el, hook, onRefresh } = setup()
    act(() => touch(el, 'touchstart', 100))
    act(() => touch(el, 'touchmove', 100 + PULL_THRESHOLD * 2 + 10))
    expect(hook.result.current.pull).toBeGreaterThanOrEqual(PULL_THRESHOLD)
    expect(pullLabel(hook.result.current)).toBe('放開以重新整理')
    await act(async () => touch(el, 'touchend', 0))
    expect(onRefresh).toHaveBeenCalledTimes(1)
    expect(hook.result.current.pull).toBe(0)
  })

  it('does not refresh on a short pull', async () => {
    const { el, hook, onRefresh } = setup()
    act(() => touch(el, 'touchstart', 100))
    act(() => touch(el, 'touchmove', 130))
    expect(pullLabel(hook.result.current)).toBe('下拉重新整理')
    await act(async () => touch(el, 'touchend', 0))
    expect(onRefresh).not.toHaveBeenCalled()
  })

  it('ignores drags that start while scrolled down', async () => {
    const { el, onRefresh } = setup()
    Object.defineProperty(el, 'scrollTop', { value: 40, configurable: true })
    act(() => touch(el, 'touchstart', 100))
    act(() => touch(el, 'touchmove', 400))
    await act(async () => touch(el, 'touchend', 0))
    expect(onRefresh).not.toHaveBeenCalled()
  })

  it('shows 更新中 while the refresh runs', async () => {
    let finish!: () => void
    const onRefresh = vi.fn(() => new Promise<void>((r) => (finish = r)))
    const { el, hook } = setup(onRefresh)
    act(() => touch(el, 'touchstart', 100))
    act(() => touch(el, 'touchmove', 400))
    await act(async () => touch(el, 'touchend', 0))
    expect(hook.result.current.refreshing).toBe(true)
    expect(pullLabel(hook.result.current)).toBe('更新中…')
    await act(async () => finish())
    expect(hook.result.current.refreshing).toBe(false)
    expect(pullLabel(hook.result.current)).toBeNull()
  })
})
