import { RequireRole } from '../features/autenticacion'
import { PlaceholderPage } from '../shared/ui/PlaceholderPage'

// TODO (estudiantes): reemplazar el placeholder por la pantalla real de app/features/inscripciones/
export default function Inscripciones() {
  return (
    <RequireRole roles={['ADMIN', 'DOCENTE', 'ESTUDIANTE']}>
      <PlaceholderPage title="Inscripciones" feature="inscripciones" />
    </RequireRole>
  )
}
