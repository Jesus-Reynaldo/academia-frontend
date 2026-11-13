import EditOutlined from '@mui/icons-material/EditOutlined'
import VisibilityOutlined from '@mui/icons-material/VisibilityOutlined'
import { AccionesFila, type AccionFila } from '../../../shared/ui/AccionesFila'
import { useCambioEstado } from '../../../shared/ui/useCambioEstado'
import type { Estudiante } from '../model/types'

interface EstudianteRowMenuProps {
  estudiante: Estudiante
  onEdit: (estudiante: Estudiante) => void
  /** Ya no se usa: en lugar de eliminar se desactiva (los datos no se borran). */
  onDelete?: (estudiante: Estudiante) => void
}

/** Acciones de la fila como íconos. Desactivar reemplaza a Eliminar: nunca se pierden datos. Solo ADMIN. */
export function EstudianteRowMenu({ estudiante, onEdit }: EstudianteRowMenuProps) {
  const sujeto = `${estudiante.nombres} ${estudiante.apellidos}`
  const estado = useCambioEstado({
    ruta: '/estudiantes',
    id: estudiante.id,
    sujeto,
    activo: estudiante.estado === 'ACTIVO' ? true : estudiante.estado === 'INACTIVO' ? false : null,
    alDesactivar: { estado: 'INACTIVO' },
    alActivar: { estado: 'ACTIVO' },
    efecto: 'Pasará al final de la lista y no se podrá inscribir en cursos nuevos.',
  })
  const acciones: AccionFila[] = [
    { etiqueta: 'Ver ficha', icono: <VisibilityOutlined />, to: `/estudiantes/${estudiante.id}` },
    { etiqueta: 'Editar', icono: <EditOutlined />, onClick: () => onEdit(estudiante) },
  ]
  if (estado.accion) acciones.push(estado.accion)
  return (
    <>
      <AccionesFila sujeto={sujeto} acciones={acciones} />
      {estado.dialogo}
    </>
  )
}
