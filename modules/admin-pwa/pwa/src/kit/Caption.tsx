import { t } from '../i18n'
import { CopyButton } from './CopyButton'

interface Props {
  text: string
  /** Card heading; defaults to t.captionTitle. */
  title?: string
  /** Copy button label; defaults to t.copyCaption. */
  copyLabel?: string
}

/** A block of text to paste somewhere else (post caption, title…), shown verbatim with a copy button. */
export function Caption({ text, title = t.captionTitle, copyLabel = t.copyCaption }: Props) {
  return (
    <div className="rounded-md border border-line-light bg-card p-4">
      <div className="mb-2 flex items-center gap-2">
        <h3 className="flex-1 text-sm font-bold text-ink">{title}</h3>
        <CopyButton text={text} label={copyLabel} />
      </div>
      <pre className="font-sans text-sm leading-6 break-words whitespace-pre-wrap text-ink">{text}</pre>
    </div>
  )
}
