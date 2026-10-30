import { RequireRole } from '../features/autenticacion'
import { PlaceholderPage } from '../shared/ui/PlaceholderPage'

// TODO (estudiantes): reemplazar el placeholder por la pantalla real de app/features/estudiantes/
export default function Estudiantes() {
  return (
    <RequireRole roles={['ADMIN', 'DOCENTE']}>
      <PlaceholderPage title="Estudiantes" feature="estudiantes" />
    </RequireRole>
  )
}
