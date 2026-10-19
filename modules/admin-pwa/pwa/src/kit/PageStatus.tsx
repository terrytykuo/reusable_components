import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { t } from '../i18n'

export function Loading({ label = t.pageLoading }: { label?: string }) {
  return (
    <p role="status" className="py-8 text-center text-sm text-ink-muted">
      {label}
    </p>
  )
}

export function ErrorNotice({ children }: { children: ReactNode }) {
  return (
    <p role="alert" className="rounded-md border border-danger-border bg-danger-surface p-4 text-sm text-danger-text">
      {children}
    </p>
  )
}

export function Empty({ children }: { children: ReactNode }) {
  return <p className="py-8 text-center text-sm text-ink-muted">{children}</p>
}

export function BackLink({ to, label = t.back }: { to: string; label?: string }) {
  return (
    <Link
      to={to}
      className="-ml-2 inline-flex min-h-11 items-center rounded-full px-2 text-sm font-medium text-primary active:bg-paper-strong"
    >
      <span aria-hidden="true" className="mr-1 text-lg leading-none">‹</span>
      {label}
    </Link>
  )
}
