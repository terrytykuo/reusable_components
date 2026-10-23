import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { arrayUnion, Timestamp, updateDoc } from 'firebase/firestore'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { RevisionBox } from '../RevisionBox'
import { REVISION_MAX, type KitRevision } from '../revisionTypes'

vi.mock('../../firebase', () => ({ db: { name: 'test-db' } }))
vi.mock('firebase/firestore', async (importOriginal) => {
  const actual = await importOriginal<typeof import('firebase/firestore')>()
  return {
    ...actual,
    doc: vi.fn((_db: unknown, ...segments: string[]) => ({ path: segments.join('/') })),
    updateDoc: vi.fn(),
    arrayUnion: vi.fn((...items: unknown[]) => ({ arrayUnion: items })),
  }
})

const PATH = 'admin/content/items'
const ID = '2026-10-19'
const REPO = 'https://github.com/owner/repo'
const sha = 'b2eb0be1234567890abcdef1234567890abcdef0'
const revisions: KitRevision[] = [
  {
    id: 'r:2026-10-23T06:10:00.000Z:aaaa',
    text: 'Lead with the layoffs story',
    status: 'done',
    createdAt: Timestamp.fromDate(new Date('2026-10-23T06:10:00.000Z')),
    by: 'admin@example.com',
    reply: 'Story 3 is now the lead and the cover',
    commit: sha,
  },
  {
    id: 'r:2026-10-23T07:30:00.000Z:bbbb',
    text: 'Cover title reads like a press release',
    status: 'queued',
    createdAt: Timestamp.fromDate(new Date('2026-10-23T07:30:00.000Z')),
    by: 'admin@example.com',
  },
]
const box = () => screen.getByRole('textbox', { name: '修改意見' }) as HTMLTextAreaElement
const send = () => screen.getByRole('button', { name: '送出' })

describe('RevisionBox', () => {
  beforeEach(() => vi.mocked(updateDoc).mockReset().mockResolvedValue(undefined))
  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
  })

  it('lists past requests newest first with badges, reply and commit link', () => {
    render(<RevisionBox collectionPath={PATH} docId={ID} revisions={revisions} email="admin@example.com" commitBaseUrl={REPO} />)
    const items = within(screen.getByRole('list', { name: '修改紀錄' })).getAllByRole('listitem')
    expect(items).toHaveLength(2)
    expect(items[0]).toHaveTextContent('已排程')
    expect(items[0]).toHaveTextContent('Cover title reads like a press release')
    expect(within(items[0]).queryByRole('link')).toBeNull()
    expect(items[1]).toHaveTextContent('已完成')
    expect(items[1]).toHaveTextContent('Story 3 is now the lead')
    expect(within(items[1]).getByRole('link', { name: '查看 commit' })).toHaveAttribute('href', `${REPO}/commit/${sha}`)
    expect(screen.queryByText('已發的項目只記錄意見，不重做')).toBeNull()
  })

  it('shows no commit link without commitBaseUrl', () => {
    render(<RevisionBox collectionPath={PATH} docId={ID} revisions={revisions} email="admin@example.com" />)
    expect(screen.queryByRole('link', { name: '查看 commit' })).toBeNull()
  })

  it('send is disabled when empty or over the limit', () => {
    render(<RevisionBox collectionPath={PATH} docId={ID} revisions={revisions} email="admin@example.com" />)
    expect(box()).not.toHaveAttribute('placeholder')
    expect(send()).toBeDisabled()
    fireEvent.change(box(), { target: { value: '   ' } })
    expect(send()).toBeDisabled()
    fireEvent.change(box(), { target: { value: 'x'.repeat(REVISION_MAX + 1) } })
    expect(send()).toBeDisabled()
    expect(screen.getByText(`最多 ${REVISION_MAX} 字`)).toBeInTheDocument()
    fireEvent.change(box(), { target: { value: 'swap the third one for something lighter' } })
    expect(send()).toBeEnabled()
  })

  it('appends one well-formed open entry with arrayUnion to collectionPath/docId and clears the box', async () => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date('2026-10-23T08:05:00.000Z'))
    try {
      render(<RevisionBox collectionPath={PATH} docId={ID} revisions={revisions} email="admin@example.com" />)
      fireEvent.change(box(), { target: { value: '  swap the third one ' } })
      await act(async () => fireEvent.click(send()))
    } finally {
      vi.useRealTimers()
    }
    expect(updateDoc).toHaveBeenCalledTimes(1)
    expect(arrayUnion).toHaveBeenCalledTimes(1)
    const entries = vi.mocked(arrayUnion).mock.calls[0]
    expect(entries).toHaveLength(1)
    const entry = entries[0] as KitRevision
    expect(entry).toEqual({
      id: expect.stringMatching(/^r:2026-10-23T08:05:00\.000Z:[A-Za-z0-9]{4}$/),
      text: 'swap the third one',
      status: 'open',
      createdAt: Timestamp.fromDate(new Date('2026-10-23T08:05:00.000Z')),
      by: 'admin@example.com',
    })
    expect(updateDoc).toHaveBeenCalledWith({ path: `${PATH}/${ID}` }, { revisions: { arrayUnion: [entry] } })
    expect(box().value).toBe('')
    expect(screen.getByRole('status')).toHaveTextContent('已送出')
  })

  it('shows the write error and keeps the text', async () => {
    vi.mocked(updateDoc).mockRejectedValueOnce(new Error('permission-denied'))
    render(<RevisionBox collectionPath={PATH} docId={ID} revisions={[]} email="admin@example.com" />)
    fireEvent.change(box(), { target: { value: 'new cover' } })
    await act(async () => fireEvent.click(send()))
    expect(screen.getByRole('alert')).toHaveTextContent('送出失敗：permission-denied')
    expect(box().value).toBe('new cover')
  })

  it('posted items still get the box, with the hint line; no list when empty', () => {
    render(<RevisionBox collectionPath={PATH} docId={ID} revisions={undefined} email="admin@example.com" posted />)
    expect(screen.getByText('已發的項目只記錄意見，不重做')).toBeInTheDocument()
    expect(box()).toBeInTheDocument()
    expect(screen.queryByRole('list', { name: '修改紀錄' })).toBeNull()
  })

  it('strings and max are overridable per instance', () => {
    render(
      <RevisionBox
        collectionPath={PATH}
        docId={ID}
        revisions={[{ ...revisions[1], status: 'noted' }]}
        email={null}
        max={10}
        strings={{ revisionTitle: 'Feedback', revisionSend: 'Send', revisionStatusNoted: 'Logged', revisionListLabel: 'History' }}
      />,
    )
    const input = screen.getByRole('textbox', { name: 'Feedback' })
    fireEvent.change(input, { target: { value: 'x'.repeat(11) } })
    expect(screen.getByRole('button', { name: 'Send' })).toBeDisabled()
    expect(screen.getByText('最多 10 字')).toBeInTheDocument()
    expect(within(screen.getByRole('list', { name: 'History' })).getByText('Logged')).toBeInTheDocument()
  })
})
