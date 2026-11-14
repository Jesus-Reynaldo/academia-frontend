import CoPresentOutlined from '@mui/icons-material/CoPresentOutlined'
import EditOutlined from '@mui/icons-material/EditOutlined'
import VisibilityOutlined from '@mui/icons-material/VisibilityOutlined'
import { AccionesFila, type AccionFila } from '../../../shared/ui/AccionesFila'
import { useCambioEstado } from '../../../shared/ui/useCambioEstado'
import type { Docente } from '../model/types'

interface DocenteRowMenuProps {
  docente: Docente
  onEdit: (docente: Docente) => void
  /** Ya no se usa: en lugar de eliminar se desactiva (los datos no se borran). */
  onDelete?: (docente: Docente) => void
}

/** Acciones de la fila como íconos. Desactivar reemplaza a Eliminar: nunca se pierden datos. Solo ADMIN. */
export function DocenteRowMenu({ docente, onEdit }: DocenteRowMenuProps) {
  const sujeto = `${docente.nombres} ${docente.apellidos}`
  const estado = useCambioEstado({
    ruta: '/docentes',
    id: docente.id,
    sujeto,
    activo: docente.estado === 'ACTIVO' ? true : docente.estado === 'INACTIVO' ? false : null,
    alDesactivar: { estado: 'INACTIVO' },
    alActivar: { estado: 'ACTIVO' },
    efecto: 'Pasará al final de la lista y no podrá registrar calificaciones.',
  })
  const acciones: AccionFila[] = [
    { etiqueta: 'Ver ficha', icono: <VisibilityOutlined />, to: `/docentes/${docente.id}` },
    { etiqueta: 'Editar', icono: <EditOutlined />, onClick: () => onEdit(docente) },
    { etiqueta: 'Asignaciones', icono: <CoPresentOutlined />, to: `/asignaciones-docentes?docenteId=${docente.id}` },
  ]
  if (estado.accion) acciones.push(estado.accion)
  return (
    <>
      <AccionesFila sujeto={sujeto} acciones={acciones} />
      {estado.dialogo}
    </>
  )
}
