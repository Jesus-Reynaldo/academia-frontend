import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'
import { useState } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router'
import { useAuth } from '../features/autenticacion'
import { AppShell } from '../shared/layout/AppShell'
import { navigationFor } from '../shared/layout/navigation'

/** Guarda de sesión + App Shell. Sin sesión redirige a /login recordando la ruta de retorno (RF-AUTH-04). */
export default function AppLayout() {
  const { status, usuario, logout } = useAuth()
  const location = useLocation()
  // Se fija al montar: si cambiara con la ruta, <Navigate> volvería a navegar en bucle al ir a /login.
  const [loginState] = useState(() => ({ from: { pathname: location.pathname, search: location.search } }))

  if (status === 'loading') {
    return (
      <Box sx={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}>
        <CircularProgress aria-label="Verificando sesión" />
      </Box>
    )
  }
  if (!usuario) {
    return <Navigate to="/login" replace state={loginState} />
  }

  return (
    <AppShell
      items={navigationFor(usuario.rol)}
      user={{ nombre: usuario.nombre ?? 'Administrador', email: usuario.email, rol: usuario.rol }}
      onLogout={logout}
    >
      <Outlet />
    </AppShell>
  )
}
