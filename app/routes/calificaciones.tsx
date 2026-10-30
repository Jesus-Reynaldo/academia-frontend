import { RequireRole } from '../features/autenticacion'
import { PlaceholderPage } from '../shared/ui/PlaceholderPage'

// TODO (estudiantes): reemplazar el placeholder por la pantalla real de app/features/calificaciones/
export default function Calificaciones() {
  return (
    <RequireRole roles={['ADMIN', 'DOCENTE', 'ESTUDIANTE']}>
      <PlaceholderPage title="Calificaciones" feature="calificaciones" />
    </RequireRole>
  )
}
