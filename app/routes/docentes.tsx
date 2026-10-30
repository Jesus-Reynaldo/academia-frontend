import { RequireRole } from '../features/autenticacion'
import { PlaceholderPage } from '../shared/ui/PlaceholderPage'

// TODO (estudiantes): reemplazar el placeholder por la pantalla real de app/features/docentes/
export default function Docentes() {
  return (
    <RequireRole roles={['ADMIN']}>
      <PlaceholderPage title="Docentes" feature="docentes" />
    </RequireRole>
  )
}
