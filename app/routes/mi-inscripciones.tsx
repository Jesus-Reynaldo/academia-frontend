import { RequireRole } from '../features/autenticacion'
import { InscripcionesListPage } from '../features/inscripciones'

// Inscripciones propias, solo lectura: la API limita el listado a las del estudiante que consulta.
export default function MisInscripciones() {
  return (
    <RequireRole roles={['ESTUDIANTE']}>
      <InscripcionesListPage modo="mias" />
    </RequireRole>
  )
}
