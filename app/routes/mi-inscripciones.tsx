import { RequireRole } from '../features/autenticacion'
import { PlaceholderPage } from '../shared/ui/PlaceholderPage'

// TODO (estudiantes): reemplazar el placeholder por la pantalla real de app/features/inscripciones/
export default function MisInscripciones() {
  return (
    <RequireRole roles={['ESTUDIANTE']}>
      <PlaceholderPage title="Mis inscripciones" feature="inscripciones" />
    </RequireRole>
  )
}
