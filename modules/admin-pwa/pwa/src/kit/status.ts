import { deleteField, doc, serverTimestamp, updateDoc, type FieldValue } from 'firebase/firestore'
import { db } from '../firebase'

/** Status values the module's StatusToggle and server-side publishDoc agree on. */
export type PostStatus = 'draft' | 'posted'

/** True when a doc's `status` field means "posted". */
export function isPosted(status: unknown): boolean {
  return status === 'posted'
}

/**
 * The update for flipping a doc to posted (stamps postedAt / postedBy) or back to
 * draft (removes postedAt / postedBy / postedUrl). Pure apart from the sentinels.
 */
export function postedFields(next: boolean, by: string | null): Record<string, FieldValue | string | null> {
  return next
    ? { status: 'posted', postedAt: serverTimestamp(), postedBy: by }
    : { status: 'draft', postedAt: deleteField(), postedBy: deleteField(), postedUrl: deleteField() }
}

/**
 * Writes postedFields() to `${collectionPath}/${id}`. The usual StatusToggle
 * onToggle: `onToggle={(next) => setPosted('admin/content/items', item.id, next, email)}`.
 */
export function setPosted(collectionPath: string, id: string, next: boolean, by: string | null): Promise<void> {
  return updateDoc(doc(db, collectionPath, id), postedFields(next, by))
}
