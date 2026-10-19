import type { UiStrings } from './strings.ts'

// THE file to edit when starting a new admin PWA. Everything else reads from here:
// vite.config.ts (web manifest), index.html (title / theme-color), the header
// wordmark, localStorage keys, the push-token collection and every UI string.
// Keep it free of runtime imports — vite.config.ts loads it in Node.

export interface BrandConfig {
  /** Full app name: manifest `name`, <title>, header wordmark. */
  name: string
  /** Home-screen label (≤ 12 chars shows untruncated on iOS). */
  shortName: string
  description: string
  /** Browser chrome / status bar colour. Usually your primary colour. */
  themeColor: string
  /** Splash background. Usually the page background (--color-paper). */
  backgroundColor: string
  /** <html lang> and manifest lang. */
  lang: string
  /** Locale for dates (toLocaleString). */
  locale: string
  /** Prefix for localStorage keys, so two admin PWAs on one origin never collide. */
  storageKey: string
  /** Firestore collection holding one doc per push device ({token}); must match the server side. */
  devicesPath: string
  /** Per-key overrides of src/strings.ts. */
  strings: Partial<UiStrings>
}

export const brand: BrandConfig = {
  name: 'Admin',
  shortName: 'Admin',
  description: 'Internal admin PWA',
  themeColor: '#2563EB',
  backgroundColor: '#F8FAFC',
  lang: 'zh-Hant-TW',
  locale: 'zh-TW',
  storageKey: 'admin-pwa',
  devicesPath: 'admin/pushTokens/devices',
  strings: {
    // e.g. notificationsHelp: '每日素材上架時推播。…',
  },
}
