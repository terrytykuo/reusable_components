import { t } from '../i18n'

/** Display name for an author: the email's local part ("alex@x.com" → "alex"). */
export function whoName(email: string | null | undefined): string {
  if (!email) return t.unknownAuthor
  const at = email.indexOf('@')
  const local = at === -1 ? email : email.slice(0, at)
  return local || email
}
