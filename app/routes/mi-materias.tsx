import { RequireRole } from '../features/autenticacion'
import { MisMateriasPage } from '../features/calificaciones'

export default function MisMaterias() {
  return (
    <RequireRole roles={['ESTUDIANTE']}>
      <MisMateriasPage />
    </RequireRole>
  )
}
