import { RequireRole } from '../features/autenticacion'
import { BitacoraPage } from '../features/bitacora'

// Solo el ADMIN ve la bitácora (lo exige también la API).
export default function Bitacora() {
  return (
    <RequireRole roles={['ADMIN']}>
      <BitacoraPage />
    </RequireRole>
  )
}
