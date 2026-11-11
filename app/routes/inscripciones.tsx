import { RequireRole } from '../features/autenticacion'
import { InscripcionesListPage } from '../features/inscripciones'

// Lectura para todos los roles; los botones de escritura solo se muestran al ADMIN (lo exige también la API).
export default function Inscripciones() {
  return (
    <RequireRole roles={['ADMIN', 'DOCENTE', 'ESTUDIANTE']}>
      <InscripcionesListPage modo="gestion" />
    </RequireRole>
  )
}
