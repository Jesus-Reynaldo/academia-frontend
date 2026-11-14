import { RequireRole } from '../features/autenticacion'
import { MiHorarioPage } from '../features/horarios'

// Docente y estudiante: cada uno ve solo su horario (lo impone la API).
export default function MiHorario() {
  return (
    <RequireRole roles={['DOCENTE', 'ESTUDIANTE']}>
      <MiHorarioPage />
    </RequireRole>
  )
}
