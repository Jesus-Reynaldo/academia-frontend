import { RequireRole } from '../features/autenticacion'
import { RespaldoPage } from '../features/respaldo'

// Solo el ADMIN descarga o restaura la información (lo exige también la API).
export default function Respaldo() {
  return (
    <RequireRole roles={['ADMIN']}>
      <RespaldoPage />
    </RequireRole>
  )
}
