import EditOutlined from '@mui/icons-material/EditOutlined'
import VisibilityOutlined from '@mui/icons-material/VisibilityOutlined'
import { AccionesFila, type AccionFila } from '../../../shared/ui/AccionesFila'
import { useCambioEstado } from '../../../shared/ui/useCambioEstado'
import type { Curso } from '../model/types'

interface CursoRowMenuProps {
  curso: Curso
  onEdit: (curso: Curso) => void
  /** Ya no se usa: en lugar de eliminar se desactiva (los datos no se borran). */
  onDelete?: (curso: Curso) => void
}

/** Acciones de la fila como íconos. Desactivar reemplaza a Eliminar: nunca se pierden datos. Solo ADMIN. */
export function CursoRowMenu({ curso, onEdit }: CursoRowMenuProps) {
  const sujeto = curso.nombre
  const estado = useCambioEstado({
    ruta: '/cursos',
    id: curso.id,
    sujeto,
    activo: curso.estado === 'ACTIVO' ? true : curso.estado === 'INACTIVO' ? false : null,
    alDesactivar: { estado: 'INACTIVO' },
    alActivar: { estado: 'ACTIVO' },
    efecto: 'Pasará al final de la lista y no se podrá elegir para nuevas inscripciones.',
  })
  const acciones: AccionFila[] = [
    { etiqueta: 'Ver detalle', icono: <VisibilityOutlined />, to: `/cursos/${curso.id}` },
    { etiqueta: 'Editar', icono: <EditOutlined />, onClick: () => onEdit(curso) },
  ]
  if (estado.accion) acciones.push(estado.accion)
  return (
    <>
      <AccionesFila sujeto={sujeto} acciones={acciones} />
      {estado.dialogo}
    </>
  )
}
