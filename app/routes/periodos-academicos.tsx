import { RequireRole } from '../features/autenticacion'
import { PlaceholderPage } from '../shared/ui/PlaceholderPage'

// TODO (estudiantes): reemplazar el placeholder por la pantalla real de app/features/periodos-academicos/
export default function PeriodosAcademicos() {
  return (
    <RequireRole roles={['ADMIN', 'DOCENTE', 'ESTUDIANTE']}>
      <PlaceholderPage title="Períodos académicos" feature="periodos-academicos" />
    </RequireRole>
  )
}
