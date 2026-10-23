import { useState, type FormEvent } from 'react'
import { brand } from '../brand'
import { formatTimestamp } from '../data/firestoreHooks'
import { ErrorNotice } from '../kit/PageStatus'
import { commitUrl, newRevision, revisionStatus, sortRevisions, submitRevision } from './revisions'
import { revisionBadgeClass } from './revisionStyles'
import { resolveRevisionStrings, revisionStatusLabel, type RevisionStrings } from './revisionStrings'
import { REVISION_MAX, type KitRevision, type RevisionStatus } from './revisionTypes'

/** 待處理／已排程／已完成／失敗／已記錄 chip. */
export function RevisionBadge({ status, strings }: { status: RevisionStatus; strings?: Partial<RevisionStrings> }) {
  const s = resolveRevisionStrings(brand.strings, strings)
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-bold ${revisionBadgeClass[status]}`} data-status={status}>
      {revisionStatusLabel(s, status)}
    </span>
  )
}

export interface RevisionBoxProps {
  /** Collection of the doc, e.g. 'admin/content/items' (odd segment count). */
  collectionPath: string
  /** Doc id; the request is appended to `${collectionPath}/${docId}.revisions`. */
  docId: string
  /** The doc's current `revisions` field (from useDoc; onSnapshot keeps it live). */
  revisions: readonly KitRevision[] | null | undefined
  /** Signed-in admin's email, stored as `by`. */
  email: string | null
  /** Item already posted: shows the hint that CI will only record the text. */
  posted?: boolean
  /** 'https://github.com/<owner>/<repo>' to link each entry's commit; omit to show no link. */
  commitBaseUrl?: string
  /** Per-instance string overrides (on top of brand.strings). */
  strings?: Partial<RevisionStrings>
  /** Max characters (default REVISION_MAX = 1000). */
  max?: number
}

/**
 * One-line revision request under the item's text: each send appends one
 * entry with arrayUnion; the list shows what CI did with each (status badge,
 * reply, commit link). Mount it with key={docId} so the draft resets per item.
 */
export function RevisionBox({ collectionPath, docId, revisions, email, posted = false, commitBaseUrl, strings, max = REVISION_MAX }: RevisionBoxProps) {
  const s = resolveRevisionStrings(brand.strings, strings)
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)

  const length = text.trim().length
  const tooLong = length > max
  const disabled = sending || length === 0 || tooLong
  const list = sortRevisions(revisions)
  const ids = `revision-${docId.replace(/[^A-Za-z0-9_-]/g, '_')}`

  async function submit(e: FormEvent) {
    e.preventDefault()
    if (disabled) return
    setError(null)
    setSent(false)
    const built = newRevision(text, email, { max })
    if (!built.ok) return
    setSending(true)
    try {
      await submitRevision(collectionPath, docId, built.revision)
      setText('')
      setSent(true)
    } catch (err) {
      setError(s.revisionSendError(err instanceof Error ? err.message : String(err)))
    } finally {
      setSending(false)
    }
  }

  return (
    <section className="rounded-md border border-line-light bg-card p-4" aria-labelledby={`${ids}-title`}>
      <h3 id={`${ids}-title`} className="mb-3 text-sm font-bold text-ink">
        {s.revisionTitle}
      </h3>
      {posted && <p className="mb-2 text-xs text-ink-muted">{s.revisionPostedHint}</p>}
      <form onSubmit={(e) => void submit(e)} noValidate>
        <textarea
          id={`${ids}-text`}
          name="revision"
          rows={3}
          value={text}
          aria-label={s.revisionTitle}
          aria-invalid={tooLong ? true : undefined}
          aria-describedby={`${ids}-count`}
          onChange={(e) => {
            setText(e.target.value)
            setSent(false)
          }}
          className="w-full rounded-sm border border-line bg-paper px-3 py-2 text-base text-ink aria-[invalid]:border-danger-text"
        />
        <div className="mt-2 flex items-center gap-3">
          <button
            type="submit"
            disabled={disabled}
            className="min-h-11 rounded-full bg-primary px-6 text-sm font-semibold text-card active:bg-primary-dark disabled:opacity-45"
          >
            {sending ? s.revisionSending : s.revisionSend}
          </button>
          <span role="status" className="flex-1 text-sm text-ink-secondary">
            {sent ? s.revisionSent : ''}
          </span>
          <span id={`${ids}-count`} className={`text-xs tabular-nums ${tooLong ? 'text-danger-text' : 'text-ink-muted'}`}>
            {tooLong ? s.revisionTooLong(max) : s.revisionCount(length, max)}
          </span>
        </div>
      </form>
      {error && (
        <div className="mt-3">
          <ErrorNotice>{error}</ErrorNotice>
        </div>
      )}
      {list.length > 0 && (
        <ul aria-label={s.revisionListLabel} className="mt-4 space-y-3 border-t border-line-light pt-3">
          {list.map((rev) => {
            const status = revisionStatus(rev)
            const url = commitUrl(rev.commit, commitBaseUrl)
            const when = rev.createdAt && typeof rev.createdAt.toDate === 'function' ? formatTimestamp(rev.createdAt) : ''
            return (
              <li key={rev.id} data-revision-id={rev.id} className="space-y-1">
                <div className="flex items-center gap-2">
                  <RevisionBadge status={status} strings={strings} />
                  <span className="text-xs tabular-nums text-ink-muted">{when}</span>
                </div>
                <p className="text-sm leading-6 break-words whitespace-pre-wrap text-ink">{rev.text}</p>
                {rev.reply && <p className="rounded-sm bg-paper px-3 py-2 text-sm leading-6 break-words whitespace-pre-wrap text-ink-secondary">{rev.reply}</p>}
                {url && (
                  <a href={url} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center text-sm font-medium text-primary underline">
                    {s.revisionViewCommit}
                  </a>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
