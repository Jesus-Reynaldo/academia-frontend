import { RequireRole } from '../features/autenticacion'
import { PlaceholderPage } from '../shared/ui/PlaceholderPage'

// TODO (estudiantes): reemplazar el placeholder por la pantalla real de app/features/cursos/
export default function Cursos() {
  return (
    <RequireRole roles={['ADMIN', 'DOCENTE', 'ESTUDIANTE']}>
      <PlaceholderPage title="Cursos" feature="cursos" />
    </RequireRole>
  )
}
