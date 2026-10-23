import type { RevisionStatus } from './revisionTypes'

// Every user-facing string of RevisionBox, Traditional Chinese by default
// (like admin-pwa's src/strings.ts). Do not edit per project: override keys in
// brand.ts `strings` (widen its type to Partial<UiStrings & RevisionStrings>)
// or pass the `strings` prop. Pure data, no runtime imports.

export const defaultRevisionStrings = {
  revisionTitle: '修改意見',
  revisionSend: '送出',
  revisionSending: '送出中…',
  /** Shown after a successful write. Match it to your cron interval. */
  revisionSent: '已送出，最多 1 小時內開始處理',
  revisionTooLong: (max: number) => `最多 ${max} 字`,
  revisionCount: (n: number, max: number) => `${n}／${max}`,
  revisionSendError: (message: string) => `送出失敗：${message}`,
  /** Shown above the box when the item is already posted (CI only records the text). */
  revisionPostedHint: '已發的項目只記錄意見，不重做',
  revisionListLabel: '修改紀錄',
  revisionViewCommit: '查看 commit',
  revisionStatusOpen: '待處理',
  revisionStatusQueued: '已排程',
  revisionStatusDone: '已完成',
  revisionStatusFailed: '失敗',
  revisionStatusNoted: '已記錄',
}

export type RevisionStrings = typeof defaultRevisionStrings

/** Defaults with each override applied in order; unknown keys are ignored. */
export function resolveRevisionStrings(...overrides: (Partial<RevisionStrings> | Record<string, unknown> | null | undefined)[]): RevisionStrings {
  const out: RevisionStrings = { ...defaultRevisionStrings }
  for (const o of overrides) {
    if (!o) continue
    for (const key of Object.keys(defaultRevisionStrings) as (keyof RevisionStrings)[]) {
      const v = (o as Record<string, unknown>)[key]
      if (v !== undefined && typeof v === typeof defaultRevisionStrings[key]) (out as Record<string, unknown>)[key] = v
    }
  }
  return out
}

export function revisionStatusLabel(s: RevisionStrings, status: RevisionStatus): string {
  switch (status) {
    case 'queued':
      return s.revisionStatusQueued
    case 'done':
      return s.revisionStatusDone
    case 'failed':
      return s.revisionStatusFailed
    case 'noted':
      return s.revisionStatusNoted
    default:
      return s.revisionStatusOpen
  }
}
