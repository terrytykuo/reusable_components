import { useState } from 'react'
import { useAdminContext } from '../auth/adminContext'
import { brand } from '../brand'
import { t } from '../i18n'
import { Empty, ErrorNotice, Loading } from '../kit/PageStatus'
import {
  PushPermissionError,
  disablePush,
  enablePush,
  getStoredToken,
  getVapidKey,
  isPushSupported,
  isStandalone,
  permissionState,
  removeDevice,
  useMyDevices,
  type PushDevice,
} from './push'

function describeError(e: unknown): string {
  return e instanceof Error ? e.message : String(e)
}

function formatSeen(device: PushDevice): string {
  const at = device.lastSeenAt
  return at ? at.toDate().toLocaleString(brand.locale, { dateStyle: 'short', timeStyle: 'short' }) : t.justNow
}

/** Account + sign-out, this device's push switch, and the signed-in user's device list. */
export default function Settings() {
  const { user, email, signOut } = useAdminContext()
  const [permission, setPermission] = useState(permissionState)
  const [token, setToken] = useState(getStoredToken)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { devices, loading, error: devicesError } = useMyDevices(user?.uid)

  const supported = isPushSupported()
  const standalone = isStandalone()
  const vapidKey = getVapidKey()
  const enabled = Boolean(token) && permission === 'granted'

  // Home-screen first: an iOS Safari tab also lacks PushManager, and "add to home
  // screen" is the fix there, not "unsupported".
  let stateLine = t.pushOff
  if (!standalone) stateLine = t.pushNeedsInstall
  else if (!supported) stateLine = t.pushUnsupported
  else if (!vapidKey) stateLine = t.pushNoVapid
  else if (permission === 'denied') stateLine = t.pushDenied
  else if (enabled) stateLine = t.pushOnHere
  const canEnable = standalone && supported && Boolean(vapidKey) && permission !== 'denied'

  const run = async (action: () => Promise<void>) => {
    setBusy(true)
    setError(null)
    try {
      await action()
    } catch (e) {
      if (!(e instanceof PushPermissionError)) setError(describeError(e))
    } finally {
      setPermission(permissionState())
      setToken(getStoredToken())
      setBusy(false)
    }
  }

  const onEnable = () =>
    run(async () => {
      if (!user) return
      setToken(await enablePush({ uid: user.uid, email }))
    })
  const onDisable = () => run(() => disablePush(token as string))
  const onRemove = (id: string) => run(() => removeDevice(id))

  return (
    <section className="space-y-4 px-4 pt-6 pb-8">
      <h2 className="font-display text-2xl font-semibold text-ink">{t.settings}</h2>

      <div className="flex items-center gap-3 rounded-md border border-line-light bg-card p-4">
        <div className="min-w-0 flex-1">
          <p className="text-xs text-ink-muted">{t.account}</p>
          <p className="truncate text-base text-ink">{email}</p>
        </div>
        <button
          type="button"
          onClick={() => void signOut()}
          className="min-h-11 shrink-0 rounded-full border border-line bg-card px-4 text-sm font-medium text-ink active:bg-paper-strong"
        >
          {t.signOut}
        </button>
      </div>

      <div className="space-y-3 rounded-md border border-line-light bg-card p-4">
        <div className="flex items-baseline justify-between gap-3">
          <h3 className="text-base font-semibold text-ink">{t.notifications}</h3>
          <p className={`text-sm ${enabled ? 'text-primary' : 'text-ink-secondary'}`}>{stateLine}</p>
        </div>
        <p className="text-sm text-ink-muted">{t.notificationsHelp}</p>
        {error && <ErrorNotice>{error}</ErrorNotice>}
        {enabled ? (
          <button
            type="button"
            onClick={() => void onDisable()}
            disabled={busy}
            className="min-h-11 w-full rounded-full border border-line bg-card px-4 text-sm font-medium text-ink active:bg-paper-strong disabled:text-ink-disabled"
          >
            {t.disablePush}
          </button>
        ) : (
          <button
            type="button"
            onClick={() => void onEnable()}
            disabled={!canEnable || busy}
            className="min-h-11 w-full rounded-full bg-primary px-4 text-sm font-semibold text-card active:bg-primary-dark disabled:bg-paper-strong disabled:text-ink-disabled"
          >
            {t.enablePush}
          </button>
        )}
      </div>

      <div className="space-y-3">
        <h3 className="text-base font-semibold text-ink">{t.myDevices}</h3>
        {loading && <Loading />}
        {devicesError && <ErrorNotice>{t.loadFailed(devicesError)}</ErrorNotice>}
        {!loading && !devicesError && devices.length === 0 && <Empty>{t.noDevices}</Empty>}
        <ul className="space-y-2">
          {devices.map((device) => {
            const platform = device.platform || t.unknownDevice
            return (
              <li key={device.id} className="flex items-center gap-3 rounded-md border border-line-light bg-card p-3">
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-2 text-sm font-medium text-ink">
                    {platform}
                    {device.id === token && (
                      <span className="rounded-full bg-primary-light px-2 py-0.5 text-xs text-primary">{t.thisDevice}</span>
                    )}
                  </p>
                  <p className="truncate text-xs text-ink-muted" title={device.userAgent}>
                    {device.userAgent}
                  </p>
                  <p className="text-xs tabular-nums text-ink-muted">{t.lastSeen(formatSeen(device))}</p>
                </div>
                <button
                  type="button"
                  onClick={() => void onRemove(device.id)}
                  disabled={busy}
                  aria-label={t.removeDeviceLabel(platform)}
                  className="min-h-11 shrink-0 rounded-full border border-danger-border px-4 text-sm font-medium text-danger-text active:bg-danger-surface disabled:text-ink-disabled"
                >
                  {t.removeDevice}
                </button>
              </li>
            )
          })}
        </ul>
      </div>
    </section>
  )
}
