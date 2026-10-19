import { brand } from '../brand'

/** The app name in the display face; used by the auth screens and the example header. */
export function Wordmark({ className = 'text-3xl' }: { className?: string }) {
  return <h1 className={`font-display font-semibold text-ink ${className}`}>{brand.name}</h1>
}
