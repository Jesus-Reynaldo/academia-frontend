import DeleteOutlined from '@mui/icons-material/DeleteOutlined'
import EditOutlined from '@mui/icons-material/EditOutlined'
import VisibilityOutlined from '@mui/icons-material/VisibilityOutlined'
import { AccionesFila } from '../../../shared/ui/AccionesFila'
import type { Estudiante } from '../model/types'

interface EstudianteRowMenuProps {
  estudiante: Estudiante
  onEdit: (estudiante: Estudiante) => void
  onDelete: (estudiante: Estudiante) => void
}

/** Acciones de la fila como íconos visibles. Solo se renderiza para ADMIN (la API también lo exige). */
export function EstudianteRowMenu({ estudiante, onEdit, onDelete }: EstudianteRowMenuProps) {
  return (
    <AccionesFila
      sujeto={`${estudiante.nombres} ${estudiante.apellidos}`}
      acciones={[
        { etiqueta: 'Ver ficha', icono: <VisibilityOutlined />, to: `/estudiantes/${estudiante.id}` },
        { etiqueta: 'Editar', icono: <EditOutlined />, onClick: () => onEdit(estudiante) },
        { etiqueta: 'Eliminar', icono: <DeleteOutlined />, tono: 'peligro', onClick: () => onDelete(estudiante) },
      ]}
    />
  )
}
