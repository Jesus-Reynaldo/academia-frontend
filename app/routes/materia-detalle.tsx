import { useParams } from 'react-router'
import { RequireRole } from '../features/autenticacion'
import { MateriaDetallePage } from '../features/materias'

export default function MateriaDetalle() {
  const { id } = useParams()
  const materiaId = Number(id)
  return (
    <RequireRole roles={['ADMIN', 'DOCENTE', 'ESTUDIANTE']}>
      <MateriaDetallePage materiaId={Number.isInteger(materiaId) && materiaId >= 1 ? materiaId : null} />
    </RequireRole>
  )
}
