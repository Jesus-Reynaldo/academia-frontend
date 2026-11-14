import { RequireRole } from '../features/autenticacion'
import { AsignacionesListPage } from '../features/asignaciones-docentes'

// ADMIN gestiona las asignaciones; el DOCENTE ve solo las suyas (lo impone también la API).
export default function AsignacionesDocentes() {
  return (
    <RequireRole roles={['ADMIN', 'DOCENTE']}>
      <AsignacionesListPage />
    </RequireRole>
  )
}
