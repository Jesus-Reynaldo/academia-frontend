import EditOutlined from '@mui/icons-material/EditOutlined'
import VisibilityOutlined from '@mui/icons-material/VisibilityOutlined'
import { AccionesFila, type AccionFila } from '../../../shared/ui/AccionesFila'
import { useCambioEstado } from '../../../shared/ui/useCambioEstado'
import type { Materia } from '../model/types'

interface MateriaRowMenuProps {
  materia: Materia
  onEdit: (materia: Materia) => void
  /** Ya no se usa: en lugar de eliminar se desactiva (los datos no se borran). */
  onDelete?: (materia: Materia) => void
}

/** Acciones de la fila como íconos. Desactivar reemplaza a Eliminar: nunca se pierden datos. Solo ADMIN. */
export function MateriaRowMenu({ materia, onEdit }: MateriaRowMenuProps) {
  const sujeto = materia.nombre
  const estado = useCambioEstado({
    ruta: '/materias',
    id: materia.id,
    sujeto,
    activo: materia.estado === 'ACTIVA' ? true : materia.estado === 'INACTIVA' ? false : null,
    alDesactivar: { estado: 'INACTIVA' },
    alActivar: { estado: 'ACTIVA' },
    efecto: 'Pasará al final de la lista y no se podrá elegir para nuevas calificaciones.',
  })
  const acciones: AccionFila[] = [
    { etiqueta: 'Ver detalle', icono: <VisibilityOutlined />, to: `/materias/${materia.id}` },
    { etiqueta: 'Editar', icono: <EditOutlined />, onClick: () => onEdit(materia) },
  ]
  if (estado.accion) acciones.push(estado.accion)
  return (
    <>
      <AccionesFila sujeto={sujeto} acciones={acciones} />
      {estado.dialogo}
    </>
  )
}
