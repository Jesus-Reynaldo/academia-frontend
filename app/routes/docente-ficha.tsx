import { useParams } from 'react-router'
import { RequireRole } from '../features/autenticacion'
import { DocenteFichaPage } from '../features/docentes'
import NoEncontrado from './no-encontrado'

// Ficha /docentes/:id. Solo el ADMIN gestiona docentes (lo exige también la API).
export default function DocenteFicha() {
  const { id } = useParams()
  const docenteId = Number(id)
  const idValido = Number.isInteger(docenteId) && docenteId > 0

  return <RequireRole roles={['ADMIN']}>{idValido ? <DocenteFichaPage id={docenteId} /> : <NoEncontrado />}</RequireRole>
}
