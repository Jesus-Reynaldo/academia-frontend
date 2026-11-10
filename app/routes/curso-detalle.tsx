import { useParams } from 'react-router'
import { RequireRole } from '../features/autenticacion'
import { CursoDetallePage } from '../features/cursos'
import NoEncontrado from './no-encontrado'

// Detalle /cursos/:id. Lectura para todos los roles; los botones de escritura solo se muestran al ADMIN.
export default function CursoDetalle() {
  const { id } = useParams()
  const cursoId = Number(id)
  const idValido = Number.isInteger(cursoId) && cursoId > 0

  return (
    <RequireRole roles={['ADMIN', 'DOCENTE', 'ESTUDIANTE']}>
      {idValido ? <CursoDetallePage id={cursoId} /> : <NoEncontrado />}
    </RequireRole>
  )
}
