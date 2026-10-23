import type { Timestamp } from 'firebase/firestore'

// The Firestore contract of one revision request (README §套用步驟 1).
// It lives in a `revisions` array on the doc the PWA already shows. The PWA
// appends one entry with status 'open' and never edits it; CI (ci/pull-revisions.js)
// owns every later change.

/** Max length of one request, in UTF-16 code units after trimming. */
export const REVISION_MAX = 1000

export const REVISION_STATUSES = ['open', 'queued', 'done', 'failed', 'noted'] as const
export type RevisionStatus = (typeof REVISION_STATUSES)[number]

export interface KitRevision {
  /** 'r:<ISO-8601 createdAt>:<4 alnum>' */
  id: string
  text: string
  status: RevisionStatus
  /** Client Timestamp (serverTimestamp() is not allowed inside an array element). */
  createdAt: Timestamp
  /** Email of the sender ('' when unknown). */
  by: string
  queuedAt?: Timestamp | null
  doneAt?: Timestamp | null
  /** The worker's one-line summary of the change, or why it failed. */
  reply?: string | null
  /** Hex commit sha of the change, when CI knows it. */
  commit?: string | null
}

/** The shape of the doc field. Add `revisions?: KitRevision[] | null` to your item type. */
export interface WithRevisions {
  revisions?: KitRevision[] | null
}
