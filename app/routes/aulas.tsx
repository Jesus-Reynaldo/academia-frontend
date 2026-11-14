import { RequireRole } from '../features/autenticacion'
import { AulasListPage } from '../features/aulas'

export default function Aulas() {
  return (
    <RequireRole roles={['ADMIN']}>
      <AulasListPage />
    </RequireRole>
  )
}
