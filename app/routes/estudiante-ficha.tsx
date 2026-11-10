import { useParams } from 'react-router'
import { RequireRole } from '../features/autenticacion'
import { EstudianteFichaPage } from '../features/estudiantes'
import NoEncontrado from './no-encontrado'

// Ficha /estudiantes/:id. ADMIN y DOCENTE; los botones de escritura solo se muestran al ADMIN.
export default function EstudianteFicha() {
  const { id } = useParams()
  const estudianteId = Number(id)
  const idValido = Number.isInteger(estudianteId) && estudianteId > 0

  return (
    <RequireRole roles={['ADMIN', 'DOCENTE']}>
      {idValido ? <EstudianteFichaPage id={estudianteId} /> : <NoEncontrado />}
    </RequireRole>
  )
}
