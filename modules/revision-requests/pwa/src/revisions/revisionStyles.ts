import type { RevisionStatus } from './revisionTypes'

/** Badge colours per status, admin-pwa theme.css tokens only. Edit here to restyle. */
export const revisionBadgeClass: Record<RevisionStatus, string> = {
  open: 'bg-paper-strong text-ink-secondary',
  queued: 'bg-primary-soft text-primary',
  done: 'bg-primary text-card',
  failed: 'bg-danger-surface text-danger-text',
  noted: 'bg-surface-neutral text-ink-muted',
}
