import { RequireRole } from '../features/autenticacion'
import { UsuariosListPage } from '../features/usuarios'

// Solo el ADMIN gestiona cuentas (lo exige también la API).
export default function Usuarios() {
  return (
    <RequireRole roles={['ADMIN']}>
      <UsuariosListPage />
    </RequireRole>
  )
}
