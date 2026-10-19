import { act, renderHook } from '@testing-library/react'
import { limit, onSnapshot, orderBy } from 'firebase/firestore'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { newestFirst, useCollection, useDoc } from '../firestoreHooks'

vi.mock('../../firebase', () => ({ db: { name: 'test-db' } }))

type Listener = { next: (snap: unknown) => void; error: (e: Error) => void; target: unknown; unsubscribe: () => void }
const fs = vi.hoisted(() => ({ listeners: [] as Listener[] }))

vi.mock('firebase/firestore', () => ({
  collection: vi.fn((_db: unknown, path: string) => ({ kind: 'collection', path })),
  doc: vi.fn((_db: unknown, ...segments: string[]) => ({ kind: 'doc', path: segments.join('/') })),
  query: vi.fn((ref: unknown, ...constraints: unknown[]) => ({ ref, constraints })),
  orderBy: vi.fn((field: string, dir: string) => ({ orderBy: field, dir })),
  limit: vi.fn((n: number) => ({ limit: n })),
  onSnapshot: vi.fn((target: unknown, next: Listener['next'], error: Listener['error']) => {
    const unsubscribe = vi.fn()
    fs.listeners.push({ target, next, error, unsubscribe })
    return unsubscribe
  }),
}))

const docSnap = (id: string, data: Record<string, unknown>) => ({ id, data: () => data, exists: () => true })

describe('useCollection', () => {
  beforeEach(() => {
    fs.listeners = []
    vi.clearAllMocks()
  })

  it('subscribes with orderBy + limit and maps docs to { id, ...data }', () => {
    const { result } = renderHook(() => useCollection<{ title: string }>('admin/content/items', { orderBy: 'createdAt', limit: 10 }))
    expect(result.current).toEqual({ items: [], loading: true, error: null })
    expect(orderBy).toHaveBeenCalledWith('createdAt', 'desc')
    expect(limit).toHaveBeenCalledWith(10)
    act(() => fs.listeners[0].next({ docs: [docSnap('a', { title: 'A' }), docSnap('b', { title: 'B' })] }))
    expect(result.current).toEqual({ items: [{ id: 'a', title: 'A' }, { id: 'b', title: 'B' }], loading: false, error: null })
  })

  it('defaults to limit 50 with no orderBy', () => {
    renderHook(() => useCollection('admin/content/items'))
    expect(orderBy).not.toHaveBeenCalled()
    expect(limit).toHaveBeenCalledWith(50)
  })

  it('surfaces a listener error', () => {
    const { result } = renderHook(() => useCollection('admin/content/items'))
    act(() => fs.listeners[0].error(new Error('permission-denied')))
    expect(result.current).toEqual({ items: [], loading: false, error: 'permission-denied' })
  })

  it('is idle for a null path and does not subscribe', () => {
    const { result } = renderHook(() => useCollection(null))
    expect(result.current).toEqual({ items: [], loading: false, error: null })
    expect(onSnapshot).not.toHaveBeenCalled()
  })

  it('never shows the previous path’s items for a new path, and unsubscribes the old one', () => {
    const { result, rerender } = renderHook(({ path }) => useCollection(path), { initialProps: { path: 'a/b/c' } })
    act(() => fs.listeners[0].next({ docs: [docSnap('x', {})] }))
    expect(result.current.items).toHaveLength(1)
    rerender({ path: 'a/b/d' })
    expect(result.current).toEqual({ items: [], loading: true, error: null })
    expect(fs.listeners[0].unsubscribe).toHaveBeenCalledTimes(1)
  })
})

describe('useDoc', () => {
  beforeEach(() => {
    fs.listeners = []
    vi.clearAllMocks()
  })

  it('returns the doc with its id', () => {
    const { result } = renderHook(() => useDoc<{ title: string }>('admin/content/items', '2026-10-19'))
    expect((fs.listeners[0].target as { path: string }).path).toBe('admin/content/items/2026-10-19')
    act(() => fs.listeners[0].next(docSnap('2026-10-19', { title: 'T' })))
    expect(result.current).toEqual({ doc: { id: '2026-10-19', title: 'T' }, loading: false, error: null, missing: false })
  })

  it('reports missing when the doc does not exist', () => {
    const { result } = renderHook(() => useDoc('admin/content/items', 'nope'))
    act(() => fs.listeners[0].next({ id: 'nope', exists: () => false }))
    expect(result.current).toEqual({ doc: null, loading: false, error: null, missing: true })
  })

  it('is idle for a null id', () => {
    const { result } = renderHook(() => useDoc('admin/content/items', null))
    expect(result.current).toEqual({ doc: null, loading: false, error: null, missing: false })
    expect(onSnapshot).not.toHaveBeenCalled()
  })
})

describe('newestFirst', () => {
  it('sorts by the key descending without mutating the input', () => {
    const input = [{ k: '2026-10-14' }, { k: '2026-10-18' }, { k: '2026-10-16' }]
    expect(newestFirst(input, (x) => x.k).map((x) => x.k)).toEqual(['2026-10-18', '2026-10-16', '2026-10-14'])
    expect(input[0].k).toBe('2026-10-14')
  })
})
