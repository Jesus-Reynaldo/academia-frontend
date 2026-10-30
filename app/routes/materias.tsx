import { RequireRole } from '../features/autenticacion'
import { PlaceholderPage } from '../shared/ui/PlaceholderPage'

// TODO (estudiantes): reemplazar el placeholder por la pantalla real de app/features/materias/
export default function Materias() {
  return (
    <RequireRole roles={['ADMIN', 'DOCENTE', 'ESTUDIANTE']}>
      <PlaceholderPage title="Materias" feature="materias" />
    </RequireRole>
  )
}
