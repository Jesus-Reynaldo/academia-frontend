import { RequireRole } from '../features/autenticacion'
import { CalificacionesListPage } from '../features/calificaciones'

// Calificaciones propias: la API limita cada listado a las del docente o estudiante que consulta.
export default function MisCalificaciones() {
  return (
    <RequireRole roles={['DOCENTE', 'ESTUDIANTE']}>
      <CalificacionesListPage modo="mias" />
    </RequireRole>
  )
}
