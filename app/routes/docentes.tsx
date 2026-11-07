import { RequireRole } from '../features/autenticacion'
import { DocentesListPage } from '../features/docentes'

// Solo el ADMIN gestiona docentes (lo exige también la API).
export default function Docentes() {
  return (
    <RequireRole roles={['ADMIN']}>
      <DocentesListPage />
    </RequireRole>
  )
}
