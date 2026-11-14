import { RequireRole } from '../features/autenticacion'
import { MiCuentaPage } from '../features/inscripciones'

export default function MiCuenta() {
  return (
    <RequireRole roles={['ESTUDIANTE']}>
      <MiCuentaPage />
    </RequireRole>
  )
}
