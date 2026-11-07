import { RequireRole } from '../features/autenticacion'
import { PeriodosListPage } from '../features/periodos-academicos'

// Lectura para todos los roles; los botones de escritura solo se muestran al ADMIN (lo exige también la API).
export default function PeriodosAcademicos() {
  return (
    <RequireRole roles={['ADMIN', 'DOCENTE', 'ESTUDIANTE']}>
      <PeriodosListPage />
    </RequireRole>
  )
}
