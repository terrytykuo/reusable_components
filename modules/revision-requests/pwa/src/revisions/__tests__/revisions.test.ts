import { arrayUnion, Timestamp, updateDoc } from 'firebase/firestore'
import { describe, expect, it, vi } from 'vitest'
import { commitUrl, newRevision, randomSuffix, revisionStatus, revisionUpdate, sortRevisions, submitRevision } from '../revisions'
import { defaultRevisionStrings, resolveRevisionStrings, revisionStatusLabel } from '../revisionStrings'
import { REVISION_MAX, type KitRevision } from '../revisionTypes'

vi.mock('../../firebase', () => ({ db: { name: 'test-db' } }))
vi.mock('firebase/firestore', async (importOriginal) => {
  const actual = await importOriginal<typeof import('firebase/firestore')>()
  return {
    ...actual,
    doc: vi.fn((_db: unknown, ...segments: string[]) => ({ path: segments.join('/') })),
    updateDoc: vi.fn(async () => undefined),
  }
})

const at = (iso: string, extra: Partial<KitRevision> = {}): KitRevision => ({
  id: `r:${iso}:abcd`,
  text: iso,
  status: 'open',
  createdAt: Timestamp.fromDate(new Date(iso)),
  by: 'admin@example.com',
  ...extra,
})

describe('newRevision', () => {
  it('trims, sets open + by, and uses the same instant for id and createdAt', () => {
    const now = new Date('2026-10-23T07:41:05.123Z')
    expect(newRevision('  make the cover shorter \n', 'admin@example.com', { now, suffix: 'Ab12' })).toEqual({
      ok: true,
      revision: {
        id: 'r:2026-10-23T07:41:05.123Z:Ab12',
        text: 'make the cover shorter',
        status: 'open',
        createdAt: Timestamp.fromMillis(now.getTime()),
        by: 'admin@example.com',
      },
    })
  })

  it('refuses empty and over-limit text; the limit is configurable', () => {
    expect(newRevision('   ', 'a@b.c')).toEqual({ ok: false, reason: 'empty' })
    expect(newRevision('字'.repeat(REVISION_MAX + 1), 'a@b.c')).toEqual({ ok: false, reason: 'tooLong' })
    expect(newRevision(` ${'字'.repeat(REVISION_MAX)} `, 'a@b.c').ok).toBe(true)
    expect(newRevision('abcdef', 'a@b.c', { max: 5 })).toEqual({ ok: false, reason: 'tooLong' })
  })

  it('builds a contract-shaped id with a random suffix by default', () => {
    const res = newRevision('x', null)
    if (!res.ok) throw new Error('expected ok')
    expect(res.revision.id).toMatch(/^r:\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z:[A-Za-z0-9]{4}$/)
    expect(res.revision.by).toBe('')
    expect(randomSuffix()).toMatch(/^[A-Za-z0-9]{4}$/)
  })
})

describe('revisionUpdate / submitRevision', () => {
  it('appends exactly one entry with arrayUnion', () => {
    const rev = at('2026-10-23T07:00:00.000Z')
    expect(revisionUpdate(rev).revisions.isEqual(arrayUnion(rev))).toBe(true)
  })

  it('writes to collectionPath/docId', async () => {
    const rev = at('2026-10-23T07:00:00.000Z')
    await submitRevision('admin/content/items', '2026-10-23', rev)
    const [ref, data] = vi.mocked(updateDoc).mock.calls[0] as unknown as [{ path: string }, { revisions: { isEqual(o: unknown): boolean } }]
    expect(ref.path).toBe('admin/content/items/2026-10-23')
    expect(data.revisions.isEqual(arrayUnion(rev))).toBe(true)
  })
})

describe('sortRevisions', () => {
  it('newest first, drops malformed entries, does not mutate', () => {
    const a = at('2026-10-23T07:00:00.000Z')
    const b = at('2026-10-23T09:00:00.000Z')
    const c = at('2026-10-22T09:00:00.000Z')
    const input = [a, null, b, { id: 'r:x' }, c] as unknown as KitRevision[]
    expect(sortRevisions(input).map((r) => r.text)).toEqual([b.text, a.text, c.text])
    expect(input[0]).toBe(a)
    expect(sortRevisions(null)).toEqual([])
  })

  it('falls back to the id instant when createdAt is missing', () => {
    const a = at('2026-10-23T07:00:00.000Z')
    const b = { ...at('2026-10-23T08:00:00.000Z'), createdAt: undefined } as unknown as KitRevision
    expect(sortRevisions([a, b])[0]).toBe(b)
  })
})

describe('revisionStatus / commitUrl', () => {
  it('reads unknown statuses as open', () => {
    expect(revisionStatus(at('2026-10-23T07:00:00.000Z', { status: 'working' as never }))).toBe('open')
    expect(revisionStatus(at('2026-10-23T07:00:00.000Z', { status: 'done' }))).toBe('done')
  })

  it('links only hex shas, and only with a base', () => {
    const sha = 'B2EB0BE1234567890ABCDEF1234567890ABCDEF0'
    expect(commitUrl(sha, 'https://github.com/owner/repo/')).toBe(`https://github.com/owner/repo/commit/${sha.toLowerCase()}`)
    expect(commitUrl(sha, undefined)).toBeNull()
    expect(commitUrl('javascript:alert(1)', 'https://github.com/owner/repo')).toBeNull()
    expect(commitUrl(null, 'https://github.com/owner/repo')).toBeNull()
  })
})

describe('revision strings', () => {
  it('applies overrides in order and ignores unknown keys and wrong types', () => {
    const s = resolveRevisionStrings({ revisionTitle: 'Feedback', settings: 'x' }, { revisionSend: 'Send', revisionCount: 'nope' as never }, null)
    expect(s.revisionTitle).toBe('Feedback')
    expect(s.revisionSend).toBe('Send')
    expect(s.revisionCount(3, 10)).toBe('3／10')
    expect('settings' in s).toBe(false)
    expect(defaultRevisionStrings.revisionTitle).toBe('修改意見')
  })

  it('labels every status', () => {
    const s = resolveRevisionStrings()
    expect((['open', 'queued', 'done', 'failed', 'noted'] as const).map((st) => revisionStatusLabel(s, st))).toEqual(['待處理', '已排程', '已完成', '失敗', '已記錄'])
  })
})
