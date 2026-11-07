import { RequireRole } from '../features/autenticacion'
import { MateriasListPage } from '../features/materias'

// Lectura para todos los roles; los botones de escritura solo se muestran al ADMIN (lo exige también la API).
export default function Materias() {
  return (
    <RequireRole roles={['ADMIN', 'DOCENTE', 'ESTUDIANTE']}>
      <MateriasListPage />
    </RequireRole>
  )
}
