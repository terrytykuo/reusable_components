import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from '../App.example'
import { useAdminUser, type AdminUserState } from '../auth/useAdminUser'
import { useCollection } from '../data/firestoreHooks'
import { setPosted } from '../kit/status'

vi.mock('../auth/useAdminUser')
vi.mock('../kit/status', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../kit/status')>()),
  setPosted: vi.fn(async () => undefined),
}))
vi.mock('../data/firestoreHooks', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../data/firestoreHooks')>()),
  useCollection: vi.fn(),
  useDoc: vi.fn(() => ({ doc: null, loading: true, error: null, missing: false })),
}))
vi.mock('../push/push', () => ({ permissionState: () => 'default', refreshPush: vi.fn() }))
vi.mock('../push/useForegroundMessages', () => ({ useForegroundMessages: vi.fn() }))
vi.mock('../push/standalone', () => ({ isStandalone: () => true }))

describe('App.example', () => {
  beforeEach(() => {
    vi.mocked(useAdminUser).mockReturnValue({
      status: 'admin',
      user: { uid: 'u1' },
      email: 'admin@example.com',
      error: null,
      signIn: vi.fn(),
      signOut: vi.fn(),
      retry: vi.fn(),
    } as unknown as AdminUserState)
    vi.mocked(useCollection).mockReturnValue({
      items: [
        { id: '2026-10-18', date: '2026-10-18', title: 'Older', status: 'posted' },
        { id: '2026-10-19', date: '2026-10-19', title: 'Newer', status: 'draft' },
      ],
      loading: false,
      error: null,
    } as never)
  })
  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
  })

  it('lists items newest first behind the auth gate, with the brand wordmark and settings link', () => {
    render(<App />)
    expect(useCollection).toHaveBeenCalledWith('admin/content/items', { orderBy: 'createdAt', limit: 60 })
    const titles = screen.getAllByText(/Older|Newer/).map((el) => el.textContent)
    expect(titles).toEqual(['Newer', 'Older'])
    expect(screen.getByRole('heading', { name: 'Admin' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: '設定' })).toHaveAttribute('href', '/settings')
  })

  it('toggles an item to posted through setPosted', () => {
    render(<App />)
    fireEvent.click(screen.getByRole('switch', { name: '未發' }))
    expect(setPosted).toHaveBeenCalledWith('admin/content/items', '2026-10-19', true, 'admin@example.com')
  })
})
