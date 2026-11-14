import { RequireRole } from '../features/autenticacion'
import { ConfiguracionPage } from '../features/configuracion'

// Solo el ADMIN cambia los datos de la institución (lo exige también la API).
export default function Configuracion() {
  return (
    <RequireRole roles={['ADMIN']}>
      <ConfiguracionPage />
    </RequireRole>
  )
}
