import { useState, useCallback, useEffect } from 'react'
import type { ReactNode } from 'react'
import { AuthContext } from './context'

interface User { id: string; email: string; firstName?: string; lastName?: string }

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchMe = useCallback(async (access?: string) => {
    try {
      const res = await fetch('/api/v1/auth/me', { headers: access ? { Authorization: `Bearer ${access}` } : token ? { Authorization: `Bearer ${token}` } : {} })
      if (!res.ok) throw new Error('Failed user fetch')
      const data = await res.json()
      setUser({ id: data.id, email: data.email, firstName: data.firstName, lastName: data.lastName })
      return true
  } catch {
      setUser(null)
      return false
    }
  }, [token])

  const refresh = useCallback(async () => {
    try {
      const res = await fetch('/api/v1/auth/refresh', { method: 'POST', credentials: 'include' })
      if (!res.ok) throw new Error('Refresh failed')
      const data = await res.json()
      setToken(data.token)
      await fetchMe(data.token)
  } catch {
      setToken(null)
      setUser(null)
    }
  }, [fetchMe])

  const login = useCallback(async (email: string, password: string) => {
    setError(null)
    try {
      const res = await fetch('/api/v1/auth/login', { method: 'POST', headers: { 'Content-Type':'application/json' }, credentials: 'include', body: JSON.stringify({ email, password }) })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Login failed')
      setToken(data.token)
      setUser(data.user)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Login failed'
      setError(msg)
      setToken(null)
      setUser(null)
      throw err
    }
  }, [])

  const logout = useCallback( async () => {
    try { await fetch('/api/v1/auth/logout', { method: 'POST', credentials: 'include' }) } catch {/* silent */}
    setToken(null); setUser(null)
  }, [])

  // initial restore attempt
  useEffect(() => { (async () => { await refresh(); setLoading(false) })() }, [refresh])

  const value = { isAuthenticated: !!user, user, token, loading, error, login, logout, refresh }
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

