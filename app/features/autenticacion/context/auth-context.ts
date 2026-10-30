import { createContext, useContext } from 'react'
import type { Usuario } from '../model/types'

export type AuthStatus = 'loading' | 'authenticated' | 'anonymous'

export interface AuthContextValue {
  status: AuthStatus
  usuario: Usuario | null
  login: (email: string, password: string) => Promise<Usuario>
  logout: () => void
}

export const AuthContext = createContext<AuthContextValue | null>(null)

export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext)
  if (!value) throw new Error('useAuth debe usarse dentro de <AuthProvider>')
  return value
}

/** Para pantallas que solo se renderizan con sesión activa. */
export function useUsuario(): Usuario {
  const { usuario } = useAuth()
  if (!usuario) throw new Error('useUsuario requiere una sesión activa')
  return usuario
}
