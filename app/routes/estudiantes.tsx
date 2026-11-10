import { RequireRole } from '../features/autenticacion'
import { EstudiantesListPage } from '../features/estudiantes'

// ADMIN y DOCENTE; los botones de escritura solo se muestran al ADMIN (lo exige también la API).
export default function Estudiantes() {
  return (
    <RequireRole roles={['ADMIN', 'DOCENTE']}>
      <EstudiantesListPage />
    </RequireRole>
  )
}
