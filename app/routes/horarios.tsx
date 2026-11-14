import { RequireRole } from '../features/autenticacion'
import { HorariosPage } from '../features/horarios'

// Gestión de horarios: solo ADMIN (lo exige también la API).
export default function Horarios() {
  return (
    <RequireRole roles={['ADMIN']}>
      <HorariosPage />
    </RequireRole>
  )
}
