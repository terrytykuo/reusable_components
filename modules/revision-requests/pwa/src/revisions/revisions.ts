import { arrayUnion, doc, Timestamp, updateDoc, type FieldValue } from 'firebase/firestore'
import { db } from '../firebase'
import { REVISION_MAX, REVISION_STATUSES, type KitRevision, type RevisionStatus } from './revisionTypes'

// Revision-request helpers. The PWA only ever appends one entry with
// arrayUnion; CI owns every later change (status, queuedAt, doneAt, reply, commit).

const ALNUM = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'

/** 4 random alphanumerics (crypto when available). */
export function randomSuffix(): string {
  const bytes = new Uint8Array(4)
  if (globalThis.crypto?.getRandomValues) globalThis.crypto.getRandomValues(bytes)
  else for (let i = 0; i < bytes.length; i++) bytes[i] = Math.floor(Math.random() * 256)
  return [...bytes].map((b) => ALNUM[b % ALNUM.length]).join('')
}

export type NewRevisionResult = { ok: true; revision: KitRevision } | { ok: false; reason: 'empty' | 'tooLong' }

/**
 * The entry to append: trimmed text (1..max chars), status 'open',
 * createdAt = `now` as a client Timestamp, id 'r:<same instant ISO>:<4 alnum>'.
 */
export function newRevision(
  text: string,
  email: string | null | undefined,
  { now = new Date(), suffix = randomSuffix(), max = REVISION_MAX }: { now?: Date; suffix?: string; max?: number } = {},
): NewRevisionResult {
  const trimmed = text.trim()
  if (!trimmed) return { ok: false, reason: 'empty' }
  if (trimmed.length > max) return { ok: false, reason: 'tooLong' }
  const createdAt = Timestamp.fromMillis(now.getTime())
  return {
    ok: true,
    revision: {
      id: `r:${createdAt.toDate().toISOString()}:${suffix}`,
      text: trimmed,
      status: 'open',
      createdAt,
      by: email ?? '',
    },
  }
}

/** The updateDoc payload: append exactly this one entry. */
export function revisionUpdate(rev: KitRevision): { revisions: FieldValue } {
  return { revisions: arrayUnion(rev) }
}

/** Appends `rev` to `${collectionPath}/${docId}.revisions`. Needs write access under the admin rules. */
export function submitRevision(collectionPath: string, docId: string, rev: KitRevision): Promise<void> {
  return updateDoc(doc(db, collectionPath, docId), revisionUpdate(rev))
}

function millis(rev: KitRevision): number {
  const ts = rev.createdAt as unknown
  if (ts && typeof (ts as Timestamp).toMillis === 'function') return (ts as Timestamp).toMillis()
  const iso = typeof rev.id === 'string' ? rev.id.split(':').slice(1, -1).join(':') : ''
  const ms = Date.parse(iso)
  return Number.isNaN(ms) ? 0 : ms
}

/** Drops malformed entries and returns the rest newest first. Does not mutate the input. */
export function sortRevisions(revisions: readonly KitRevision[] | null | undefined): KitRevision[] {
  const list = (Array.isArray(revisions) ? revisions : []).filter(
    (r): r is KitRevision => !!r && typeof r === 'object' && typeof r.text === 'string' && typeof r.id === 'string',
  )
  return [...list].sort((a, b) => millis(b) - millis(a) || b.id.localeCompare(a.id))
}

/** Unknown statuses read as 'open' (the badge never disappears). */
export function revisionStatus(rev: KitRevision): RevisionStatus {
  return (REVISION_STATUSES as readonly string[]).includes(rev.status) ? rev.status : 'open'
}

const SHA = /^[0-9a-f]{7,40}$/i

/**
 * `${base}/commit/<sha>` (base like 'https://github.com/owner/repo'); null
 * without a base or when sha is not hex (never link arbitrary text).
 */
export function commitUrl(sha: string | null | undefined, base: string | null | undefined): string | null {
  if (!base || typeof sha !== 'string' || !SHA.test(sha)) return null
  return `${base.replace(/\/+$/, '')}/commit/${sha.toLowerCase()}`
}
