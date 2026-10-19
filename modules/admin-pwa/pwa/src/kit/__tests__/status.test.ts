import { deleteField, serverTimestamp, updateDoc } from 'firebase/firestore'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { isPosted, postedFields, setPosted } from '../status'

vi.mock('../../firebase', () => ({ db: { name: 'test-db' } }))
vi.mock('firebase/firestore', () => ({
  doc: vi.fn((_db: unknown, ...segments: string[]) => ({ path: segments.join('/') })),
  updateDoc: vi.fn(async () => undefined),
  serverTimestamp: vi.fn(() => 'SERVER_TS'),
  deleteField: vi.fn(() => 'DELETE'),
}))

describe('status helpers', () => {
  beforeEach(() => vi.mocked(updateDoc).mockClear())

  it('isPosted is true only for "posted"', () => {
    expect(isPosted('posted')).toBe(true)
    expect(isPosted('draft')).toBe(false)
    expect(isPosted(undefined)).toBe(false)
  })

  it('postedFields: posted stamps time and author; draft deletes the posted fields', () => {
    expect(postedFields(true, 'admin@example.com')).toEqual({ status: 'posted', postedAt: serverTimestamp(), postedBy: 'admin@example.com' })
    expect(postedFields(false, 'admin@example.com')).toEqual({
      status: 'draft',
      postedAt: deleteField(),
      postedBy: deleteField(),
      postedUrl: deleteField(),
    })
  })

  it('setPosted updates the doc at collectionPath/id', async () => {
    await setPosted('admin/content/items', '2026-10-19', true, 'admin@example.com')
    const [ref, data] = vi.mocked(updateDoc).mock.calls[0] as unknown as [{ path: string }, Record<string, unknown>]
    expect(ref.path).toBe('admin/content/items/2026-10-19')
    expect(data).toEqual({ status: 'posted', postedAt: 'SERVER_TS', postedBy: 'admin@example.com' })
  })
})
