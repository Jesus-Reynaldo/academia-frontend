import { RequireRole } from '../features/autenticacion'
import { CalificacionesListPage } from '../features/calificaciones'

// Gestión de calificaciones: ADMIN y DOCENTE. El ESTUDIANTE consulta las suyas en /mi/calificaciones.
export default function Calificaciones() {
  return (
    <RequireRole roles={['ADMIN', 'DOCENTE']}>
      <CalificacionesListPage modo="gestion" />
    </RequireRole>
  )
}
