import {
  collection,
  doc,
  limit as limitTo,
  onSnapshot,
  orderBy as orderByField,
  query,
  type DocumentData,
  type OrderByDirection,
  type QueryConstraint,
  type Timestamp,
} from 'firebase/firestore'
import { useEffect, useState } from 'react'
import { brand } from '../brand'
import { db } from '../firebase'

// Generic live-read hooks. Docs come back as `{ id, ...data }` with pending
// server timestamps estimated locally (so a just-written createdAt is not null).
// Paths must have an odd number of segments for a collection
// (admin/content/items) and an even number for a doc's parent + id.

export type WithId<T> = T & { id: string }

export interface CollectionOptions {
  /** Field to order by (needs an index only when combined with filters). */
  orderBy?: string
  /** Default 'desc'. */
  direction?: OrderByDirection
  /** Max docs; default 50. */
  limit?: number
}

export interface CollectionState<T> {
  items: WithId<T>[]
  loading: boolean
  error: string | null
}

export interface DocState<T> {
  doc: WithId<T> | null
  loading: boolean
  error: string | null
  /** True once the snapshot says the doc does not exist. */
  missing: boolean
}

/**
 * Live query on a collection. `path === null` means "not yet" (e.g. waiting for
 * a uid): returns an idle empty state without subscribing. While the
 * path/options change, the previous result is never shown for the new key.
 */
export function useCollection<T = DocumentData>(path: string | null, options: CollectionOptions = {}): CollectionState<T> {
  const { orderBy, direction = 'desc', limit = 50 } = options
  const key = path === null ? null : `${path}|${orderBy ?? ''}|${direction}|${limit}`
  const [state, setState] = useState<CollectionState<T> & { key: string | null }>({
    key: null,
    items: [],
    loading: true,
    error: null,
  })

  useEffect(() => {
    if (path === null) return
    const k = `${path}|${orderBy ?? ''}|${direction}|${limit}`
    const constraints: QueryConstraint[] = []
    if (orderBy) constraints.push(orderByField(orderBy, direction))
    constraints.push(limitTo(limit))
    return onSnapshot(
      query(collection(db, path), ...constraints),
      (snap) => {
        const items = snap.docs.map((d) => ({ id: d.id, ...d.data({ serverTimestamps: 'estimate' }) }) as WithId<T>)
        setState({ key: k, items, loading: false, error: null })
      },
      (err) => setState({ key: k, items: [], loading: false, error: err.message }),
    )
  }, [path, orderBy, direction, limit])

  if (key === null) return { items: [], loading: false, error: null }
  if (state.key !== key) return { items: [], loading: true, error: null }
  return { items: state.items, loading: state.loading, error: state.error }
}

/** Live read of `${collectionPath}/${id}`. `id === null` → idle (not loading, not missing). */
export function useDoc<T = DocumentData>(collectionPath: string, id: string | null): DocState<T> {
  const key = id === null ? null : `${collectionPath}/${id}`
  const [state, setState] = useState<DocState<T> & { key: string | null }>({
    key: null,
    doc: null,
    loading: true,
    error: null,
    missing: false,
  })

  useEffect(() => {
    if (id === null) return
    const k = `${collectionPath}/${id}`
    return onSnapshot(
      doc(db, collectionPath, id),
      (snap) => {
        if (!snap.exists()) {
          setState({ key: k, doc: null, loading: false, error: null, missing: true })
          return
        }
        const value = { id: snap.id, ...snap.data({ serverTimestamps: 'estimate' }) } as WithId<T>
        setState({ key: k, doc: value, loading: false, error: null, missing: false })
      },
      (err) => setState({ key: k, doc: null, loading: false, error: err.message, missing: false }),
    )
  }, [collectionPath, id])

  if (key === null) return { doc: null, loading: false, error: null, missing: false }
  if (state.key !== key) return { doc: null, loading: true, error: null, missing: false }
  return { doc: state.doc, loading: state.loading, error: state.error, missing: state.missing }
}

/**
 * Newest first by a string key (ISO date / id). Prefer this over createdAt order
 * when an old date can be re-published. Does not mutate the input.
 */
export function newestFirst<T>(items: readonly T[], key: (item: T) => string): T[] {
  return [...items].sort((a, b) => key(b).localeCompare(key(a)))
}

/** Timestamp → "2026/10/19 08:30" in brand.locale; '' for null. */
export function formatTimestamp(ts: Timestamp | null | undefined, locale = brand.locale): string {
  if (!ts) return ''
  return ts.toDate().toLocaleString(locale, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}
