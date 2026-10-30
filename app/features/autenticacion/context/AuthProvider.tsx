import { useQueryClient } from '@tanstack/react-query'
import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router'
import { configureHttp } from '../../../shared/api/http'
import { authApi } from '../api/auth.api'
import type { Usuario } from '../model/types'
import { clearToken, readToken, saveToken } from '../model/token-storage'
import { AuthContext, type AuthContextValue, type AuthStatus } from './auth-context'

// El cliente HTTP lee el token siempre desde el almacenamiento de sesión.
configureHttp({ getToken: readToken })

export function AuthProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [status, setStatus] = useState<AuthStatus>(() => (readToken() ? 'loading' : 'anonymous'))
  const [usuario, setUsuario] = useState<Usuario | null>(null)

  const closeSession = useCallback(() => {
    clearToken()
    queryClient.clear()
    setUsuario(null)
    setStatus('anonymous')
  }, [queryClient])

  // Ante cualquier 401 fuera del login: limpiar sesión y volver a /login (RF-AUTH-03).
  useEffect(() => {
    configureHttp({
      onUnauthorized: () => {
        closeSession()
        void navigate('/login', { replace: true, state: { expired: true } })
      },
    })
  }, [closeSession, navigate])

  // Restaurar la sesión al recargar la página.
  useEffect(() => {
    if (!readToken()) return // sin token: el estado inicial ya es 'anonymous'
    const controller = new AbortController()
    authApi
      .me(controller.signal)
      .then((me) => {
        setUsuario(me)
        setStatus('authenticated')
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return
        // Si fue 401, el manejador global ya cerró la sesión; en otros fallos (red) también se cierra.
        if (error instanceof Error && error.name === 'AbortError') return
        closeSession()
      })
    return () => controller.abort()
  }, [closeSession])

  const login = useCallback(async (email: string, password: string) => {
    const { accessToken } = await authApi.login(email, password)
    saveToken(accessToken)
    try {
      const me = await authApi.me()
      setUsuario(me)
      setStatus('authenticated')
      return me
    } catch (error) {
      clearToken()
      throw error
    }
  }, [])

  const logout = useCallback(() => {
    closeSession()
    void navigate('/login', { replace: true })
  }, [closeSession, navigate])

  const value = useMemo<AuthContextValue>(
    () => ({ status, usuario, login, logout }),
    [status, usuario, login, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
