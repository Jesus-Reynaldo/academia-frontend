import type { ReactNode } from 'react'
import { Navigate } from 'react-router'
import type { Rol } from '../../../shared/config/roles'
import { useAuth } from '../context/auth-context'

interface RequireRoleProps {
  roles: Rol[]
  children: ReactNode
}

/** Con sesión pero sin permiso: pantalla "Sin acceso", nunca una pantalla en blanco (RF-AUTH-04). */
export function RequireRole({ roles, children }: RequireRoleProps) {
  const { usuario } = useAuth()
  if (!usuario || !roles.includes(usuario.rol)) {
    return <Navigate to="/sin-acceso" replace />
  }
  return <>{children}</>
}
