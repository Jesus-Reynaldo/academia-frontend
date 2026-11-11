import { RequireRole, useUsuario } from '../features/autenticacion'
import { HistorialAcademicoPage } from '../features/historial-academico'

export default function MiHistorial() {
  const usuario = useUsuario()
  return (
    <RequireRole roles={['ESTUDIANTE']}>
      <HistorialAcademicoPage estudianteId={usuario.estudianteId} />
    </RequireRole>
  )
}
