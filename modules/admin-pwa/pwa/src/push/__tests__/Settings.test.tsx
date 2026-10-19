import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AdminUserContext } from '../../auth/adminContext'
import type { AdminUserState } from '../../auth/useAdminUser'
import * as push from '../push'
import Settings from '../Settings'

vi.mock('../push', () => ({
  PushPermissionError: class PushPermissionError extends Error {},
  isPushSupported: vi.fn(),
  isStandalone: vi.fn(),
  getVapidKey: vi.fn(),
  permissionState: vi.fn(),
  getStoredToken: vi.fn(),
  enablePush: vi.fn(),
  disablePush: vi.fn(),
  removeDevice: vi.fn(),
  useMyDevices: vi.fn(),
}))

const signOut = vi.fn()
const adminState = {
  status: 'admin',
  user: { uid: 'u1', email: 'admin@example.com' },
  email: 'admin@example.com',
  signOut,
} as unknown as AdminUserState

function env({
  supported = true,
  standalone = true,
  key = 'BKey' as string | null,
  permission = 'default' as ReturnType<typeof push.permissionState>,
  token = null as string | null,
} = {}) {
  vi.mocked(push.isPushSupported).mockReturnValue(supported)
  vi.mocked(push.isStandalone).mockReturnValue(standalone)
  vi.mocked(push.getVapidKey).mockReturnValue(key)
  vi.mocked(push.permissionState).mockReturnValue(permission)
  vi.mocked(push.getStoredToken).mockReturnValue(token)
}

function renderSettings() {
  return render(
    <MemoryRouter>
      <AdminUserContext.Provider value={adminState}>
        <Settings />
      </AdminUserContext.Provider>
    </MemoryRouter>,
  )
}

describe('Settings', () => {
  beforeEach(() => {
    vi.mocked(push.useMyDevices).mockReturnValue({ devices: [], loading: false, error: null })
  })
  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
  })

  it('shows the account and signs out', () => {
    env()
    renderSettings()
    expect(screen.getByText('admin@example.com')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: '登出' }))
    expect(signOut).toHaveBeenCalledTimes(1)
  })

  it('disables the toggle when push is unsupported', () => {
    env({ supported: false })
    renderSettings()
    expect(screen.getByText('未支援')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '開啟通知' })).toBeDisabled()
  })

  it('disables the toggle outside the home-screen app', () => {
    env({ standalone: false })
    renderSettings()
    expect(screen.getByText('需要先加入主畫面')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '開啟通知' })).toBeDisabled()
  })

  it('disables the toggle without a VAPID key', () => {
    env({ key: null })
    renderSettings()
    expect(screen.getByText('尚未設定 VAPID key')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '開啟通知' })).toBeDisabled()
  })

  it('disables the toggle when permission was denied', () => {
    env({ permission: 'denied' })
    renderSettings()
    expect(screen.getByText('已拒絕（請到 iOS 設定開啟）')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '開啟通知' })).toBeDisabled()
  })

  it('enables push for the signed-in admin on click', async () => {
    env()
    // The real enablePush leaves permission granted and the token stored.
    vi.mocked(push.enablePush).mockImplementation(async () => {
      env({ permission: 'granted', token: 'tok123' })
      return 'tok123'
    })
    renderSettings()
    expect(screen.getByText('未開啟')).toBeInTheDocument()
    const button = screen.getByRole('button', { name: '開啟通知' })
    expect(button).toBeEnabled()
    fireEvent.click(button)
    expect(push.enablePush).toHaveBeenCalledWith({ uid: 'u1', email: 'admin@example.com' })
    await waitFor(() => expect(screen.getByText('此裝置已開啟')).toBeInTheDocument())
    expect(screen.getByRole('button', { name: '關閉通知' })).toBeInTheDocument()
  })

  it('offers 關閉通知 when this device is enabled', async () => {
    env({ permission: 'granted', token: 'tok123' })
    vi.mocked(push.disablePush).mockImplementation(async () => env({ permission: 'granted', token: null }))
    renderSettings()
    expect(screen.getByText('此裝置已開啟')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: '關閉通知' }))
    expect(push.disablePush).toHaveBeenCalledWith('tok123')
    await waitFor(() => expect(screen.getByRole('button', { name: '開啟通知' })).toBeInTheDocument())
  })

  it('lists this user’s devices and deletes one', () => {
    env({ permission: 'granted', token: 'tok123' })
    vi.mocked(push.useMyDevices).mockReturnValue({
      devices: [
        { id: 'tok123', uid: 'u1', platform: 'iPhone', userAgent: 'Mozilla/5.0 (iPhone)', lastSeenAt: null },
        { id: 'tok999', uid: 'u1', platform: 'MacIntel', userAgent: 'Mozilla/5.0 (Macintosh)', lastSeenAt: null },
      ],
      loading: false,
      error: null,
    })
    renderSettings()
    expect(push.useMyDevices).toHaveBeenCalledWith('u1')
    expect(screen.getByText('此裝置')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: '刪除 MacIntel' }))
    expect(push.removeDevice).toHaveBeenCalledWith('tok999')
  })
})
