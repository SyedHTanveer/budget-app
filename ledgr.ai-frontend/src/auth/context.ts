import { createContext } from 'react'

export interface AuthContextValue {
  isAuthenticated: boolean
  user: { id: string; email: string; firstName?: string; lastName?: string } | null
  token: string | null
  loading: boolean
  error: string | null
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  refresh: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined)
