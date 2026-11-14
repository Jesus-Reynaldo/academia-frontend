import { useParams } from 'react-router'
import { RequireRole } from '../features/autenticacion'
import { MateriaEstudiantePage } from '../features/calificaciones'

export default function MiMateria() {
  const { materiaId } = useParams()
  const id = Number(materiaId)
  return (
    <RequireRole roles={['ESTUDIANTE']}>
      <MateriaEstudiantePage materiaId={Number.isInteger(id) && id > 0 ? id : null} />
    </RequireRole>
  )
}
