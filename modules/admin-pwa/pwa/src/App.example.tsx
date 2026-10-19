import type { Timestamp } from 'firebase/firestore'
import { useCallback, useEffect, useRef, useState } from 'react'
import { BrowserRouter, Link, Navigate, Route, Routes, useParams } from 'react-router-dom'
import { AuthGate } from './auth/AuthGate'
import { useAdminContext } from './auth/adminContext'
import { Wordmark } from './auth/Wordmark'
import { newestFirst, useCollection, useDoc } from './data/firestoreHooks'
import { t } from './i18n'
import { Caption } from './kit/Caption'
import { DownloadAllButton } from './kit/DownloadAllButton'
import { ErrorBoundary } from './kit/ErrorBoundary'
import { KitViewer } from './kit/KitViewer'
import { BackLink, Empty, ErrorNotice, Loading } from './kit/PageStatus'
import { StatusToggle } from './kit/StatusToggle'
import { isPosted, setPosted } from './kit/status'
import type { Slide } from './kit/types'
import { InstallHint } from './push/InstallHint'
import { permissionState, refreshPush } from './push/push'
import Settings from './push/Settings'
import { Toast } from './push/Toast'
import { useForegroundMessages, type PushToast } from './push/useForegroundMessages'

// Example shell: header (wordmark + email + settings gear), one list page, one
// detail page, settings. Copy to App.tsx and replace Item / ITEMS_PATH / the two
// pages with your own. The CI side writes these docs with server/ci publishDoc().

/** Collection the CI writes to. Odd segment count: admin (col) / content (doc) / items (col). */
const ITEMS_PATH = 'admin/content/items'

interface Item {
  /** ISO date, the list's sort key. */
  date?: string | null
  title?: string | null
  caption?: string | null
  slides?: Slide[]
  status?: string
  createdAt?: Timestamp | null
}

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AuthGate>
          <Shell />
        </AuthGate>
      </BrowserRouter>
    </ErrorBoundary>
  )
}

function Shell() {
  const { status, user, email } = useAdminContext()
  const [toast, setToast] = useState<PushToast | null>(null)
  const dismissToast = useCallback(() => setToast(null), [])
  useForegroundMessages(setToast)

  // Once per launch: keep this device's token fresh (lastSeenAt, rotated tokens).
  const refreshedRef = useRef(false)
  useEffect(() => {
    if (refreshedRef.current || status !== 'admin' || !user || permissionState() !== 'granted') return
    refreshedRef.current = true
    void refreshPush({ uid: user.uid, email })
  }, [status, user, email])

  return (
    <div className="min-h-dvh pb-[env(safe-area-inset-bottom)]">
      <header className="sticky top-0 z-10 flex items-center gap-3 border-b border-line-light bg-paper/95 px-4 pt-[env(safe-area-inset-top)] backdrop-blur">
        <Link to="/" className="py-3">
          <Wordmark className="text-xl" />
        </Link>
        <span className="min-w-0 flex-1 truncate text-right text-xs text-ink-muted">{email}</span>
        <Link
          to="/settings"
          aria-label={t.settings}
          className="-mr-2 flex size-11 shrink-0 items-center justify-center rounded-full text-ink-secondary active:bg-paper-strong"
        >
          <svg aria-hidden="true" viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1.08-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1.08 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
        </Link>
      </header>

      <InstallHint />

      <main>
        <Routes>
          <Route path="/" element={<ItemList />} />
          <Route path="/items/:id" element={<ItemDetail />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      {toast && <Toast toast={toast} onDismiss={dismissToast} />}
    </div>
  )
}

function ItemList() {
  const { email } = useAdminContext()
  const { items, loading, error } = useCollection<Item>(ITEMS_PATH, { orderBy: 'createdAt', limit: 60 })
  const [rowError, setRowError] = useState<{ id: string; message: string } | null>(null)

  if (loading) return <Loading />
  if (error) return <div className="p-4"><ErrorNotice>{t.loadFailed(error)}</ErrorNotice></div>
  if (items.length === 0) return <Empty>{t.empty}</Empty>

  return (
    <ul className="space-y-3 px-4 py-4">
      {newestFirst(items, (it) => it.date ?? it.id).map((item) => {
        const thumb = item.slides?.find((s) => s.url)?.url
        return (
          <li key={item.id}>
            <Link to={`/items/${encodeURIComponent(item.id)}`} className="flex items-center gap-3 rounded-md border border-line-light bg-card p-3 active:bg-paper-strong">
              {thumb ? (
                <img src={thumb} alt="" loading="lazy" className="size-16 shrink-0 rounded-sm object-cover" />
              ) : (
                <span className="size-16 shrink-0 rounded-sm bg-paper-strong" />
              )}
              <span className="min-w-0 flex-1">
                <span className="block text-xs tabular-nums text-ink-muted">{item.date ?? item.id}</span>
                <span className="block truncate text-base font-medium text-ink">{item.title ?? item.id}</span>
                {rowError?.id === item.id && (
                  <span role="alert" className="block text-xs text-danger-text">{t.updateFailed(rowError.message)}</span>
                )}
              </span>
              <StatusToggle
                on={isPosted(item.status)}
                onToggle={(next) => setPosted(ITEMS_PATH, item.id, next, email)}
                onError={(message) => setRowError(message ? { id: item.id, message } : null)}
              />
            </Link>
          </li>
        )
      })}
    </ul>
  )
}

function ItemDetail() {
  const { id = '' } = useParams()
  const { email } = useAdminContext()
  const { doc: item, loading, error, missing } = useDoc<Item>(ITEMS_PATH, id)

  return (
    <section className="space-y-4 px-4 pt-2 pb-8">
      <BackLink to="/" />
      {loading && <Loading />}
      {error && <ErrorNotice>{t.loadFailed(error)}</ErrorNotice>}
      {missing && <Empty>{t.notFound}</Empty>}
      {item && (
        <>
          <div className="flex items-start gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-xs tabular-nums text-ink-muted">{item.date ?? item.id}</p>
              <h2 className="font-display text-2xl font-semibold text-ink">{item.title ?? item.id}</h2>
            </div>
            <StatusToggle on={isPosted(item.status)} onToggle={(next) => setPosted(ITEMS_PATH, item.id, next, email)} />
          </div>
          <KitViewer slides={item.slides} />
          <DownloadAllButton kitId={item.id} slides={item.slides ?? []} />
          {item.caption && <Caption text={item.caption} />}
        </>
      )}
    </section>
  )
}
