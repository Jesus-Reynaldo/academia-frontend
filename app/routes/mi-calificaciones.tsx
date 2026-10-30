import { RequireRole } from '../features/autenticacion'
import { PlaceholderPage } from '../shared/ui/PlaceholderPage'

// TODO (estudiantes): reemplazar el placeholder por la pantalla real de app/features/calificaciones/
export default function MisCalificaciones() {
  return (
    <RequireRole roles={['DOCENTE', 'ESTUDIANTE']}>
      <PlaceholderPage title="Mis calificaciones" feature="calificaciones" />
    </RequireRole>
  )
}
