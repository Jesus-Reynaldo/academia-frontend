import { RequireRole } from '../features/autenticacion'
import { PlaceholderPage } from '../shared/ui/PlaceholderPage'

// TODO (estudiantes): reemplazar el placeholder por la pantalla real de app/features/historial-academico/
export default function MiHistorial() {
  return (
    <RequireRole roles={['ESTUDIANTE']}>
      <PlaceholderPage title="Historial académico" feature="historial-academico" />
    </RequireRole>
  )
}
