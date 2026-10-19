import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AuthGate } from '../AuthGate'
import { useAdminUser, type AdminUserState } from '../useAdminUser'

vi.mock('../useAdminUser')

const signIn = vi.fn()
const signOut = vi.fn()
const retry = vi.fn()

function mockState(partial: Partial<AdminUserState>) {
  vi.mocked(useAdminUser).mockReturnValue({
    status: 'loading',
    user: null,
    email: null,
    signIn,
    signOut,
    retry,
    error: null,
    ...partial,
  })
}

function renderGate() {
  return render(
    <AuthGate>
      <p>secret admin content</p>
    </AuthGate>,
  )
}

describe('AuthGate', () => {
  beforeEach(() => {
    signIn.mockReset()
    signOut.mockReset()
    retry.mockReset()
  })
  afterEach(cleanup)

  it('shows a status spinner while loading', () => {
    mockState({ status: 'loading' })
    renderGate()
    expect(screen.getByRole('status')).toHaveTextContent('載入中')
    expect(screen.queryByText('secret admin content')).not.toBeInTheDocument()
  })

  it('offers Google sign-in when signed out', () => {
    mockState({ status: 'signed-out' })
    renderGate()
    fireEvent.click(screen.getByRole('button', { name: '使用 Google 登入' }))
    expect(signIn).toHaveBeenCalledTimes(1)
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(screen.queryByText('secret admin content')).not.toBeInTheDocument()
  })

  it('shows a sign-in error as an alert on the signed-out screen', () => {
    mockState({ status: 'signed-out', error: '此網域尚未在 Firebase 授權' })
    renderGate()
    expect(screen.getByRole('alert')).toHaveTextContent('此網域尚未在 Firebase 授權')
    expect(screen.getByRole('button', { name: '使用 Google 登入' })).toBeInTheDocument()
  })

  it('offers retry and sign-out when the identity check failed', () => {
    mockState({ status: 'error', email: 'admin@example.com', error: 'auth/network-request-failed' })
    renderGate()
    expect(screen.getByText('無法驗證身分，請檢查網路')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: '重試' }))
    expect(retry).toHaveBeenCalledTimes(1)
    fireEvent.click(screen.getByRole('button', { name: '登出' }))
    expect(signOut).toHaveBeenCalledTimes(1)
    expect(screen.queryByText('此帳號無權限')).not.toBeInTheDocument()
    expect(screen.queryByText('secret admin content')).not.toBeInTheDocument()
  })

  it('rejects a signed-in account without the admin claim', () => {
    mockState({ status: 'not-admin', email: 'someone@example.com' })
    renderGate()
    expect(screen.getByText('此帳號無權限')).toBeInTheDocument()
    expect(screen.getByText('someone@example.com')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: '登出' }))
    expect(signOut).toHaveBeenCalledTimes(1)
    expect(screen.queryByText('secret admin content')).not.toBeInTheDocument()
  })

  it('renders children for an admin', () => {
    mockState({ status: 'admin', email: 'admin@example.com' })
    renderGate()
    expect(screen.getByText('secret admin content')).toBeInTheDocument()
  })
})
