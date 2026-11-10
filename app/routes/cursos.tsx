import { RequireRole } from '../features/autenticacion'
import { CursosListPage } from '../features/cursos'

// Lectura para todos los roles; los botones de escritura solo se muestran al ADMIN (lo exige también la API).
export default function Cursos() {
  return (
    <RequireRole roles={['ADMIN', 'DOCENTE', 'ESTUDIANTE']}>
      <CursosListPage />
    </RequireRole>
  )
}
