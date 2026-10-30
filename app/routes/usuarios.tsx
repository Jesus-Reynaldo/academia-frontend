import { RequireRole } from '../features/autenticacion'
import { PlaceholderPage } from '../shared/ui/PlaceholderPage'

// TODO (estudiantes): reemplazar el placeholder por la pantalla real de app/features/usuarios/
export default function Usuarios() {
  return (
    <RequireRole roles={['ADMIN']}>
      <PlaceholderPage title="Usuarios" feature="usuarios" />
    </RequireRole>
  )
}
