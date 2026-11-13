import DeleteOutlined from '@mui/icons-material/DeleteOutlined'
import EditOutlined from '@mui/icons-material/EditOutlined'
import VisibilityOutlined from '@mui/icons-material/VisibilityOutlined'
import { AccionesFila } from '../../../shared/ui/AccionesFila'
import type { Docente } from '../model/types'

interface DocenteRowMenuProps {
  docente: Docente
  onEdit: (docente: Docente) => void
  onDelete: (docente: Docente) => void
}

/** Acciones de la fila como íconos visibles. Solo se renderiza para ADMIN (la API también lo exige). */
export function DocenteRowMenu({ docente, onEdit, onDelete }: DocenteRowMenuProps) {
  return (
    <AccionesFila
      sujeto={`${docente.nombres} ${docente.apellidos}`}
      acciones={[
        { etiqueta: 'Ver ficha', icono: <VisibilityOutlined />, to: `/docentes/${docente.id}` },
        { etiqueta: 'Editar', icono: <EditOutlined />, onClick: () => onEdit(docente) },
        { etiqueta: 'Eliminar', icono: <DeleteOutlined />, tono: 'peligro', onClick: () => onDelete(docente) },
      ]}
    />
  )
}
