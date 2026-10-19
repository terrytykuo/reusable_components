import { createContext, useContext } from 'react'
import type { AdminUserState } from './useAdminUser'

// AuthGate provides its single useAdminUser() instance so the shell can show the
// email and sign out without registering a second auth listener.
export const AdminUserContext = createContext<AdminUserState | null>(null)

export function useAdminContext(): AdminUserState {
  const value = useContext(AdminUserContext)
  if (!value) throw new Error('useAdminContext must be used inside <AuthGate>')
  return value
}
