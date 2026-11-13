import DeleteOutlined from '@mui/icons-material/DeleteOutlined'
import EditOutlined from '@mui/icons-material/EditOutlined'
import VisibilityOutlined from '@mui/icons-material/VisibilityOutlined'
import { AccionesFila } from '../../../shared/ui/AccionesFila'
import type { Materia } from '../model/types'

interface MateriaRowMenuProps {
  materia: Materia
  onEdit: (materia: Materia) => void
  onDelete: (materia: Materia) => void
}

/** Acciones de la fila como íconos visibles. Solo se renderiza para ADMIN (la API también lo exige). */
export function MateriaRowMenu({ materia, onEdit, onDelete }: MateriaRowMenuProps) {
  return (
    <AccionesFila
      sujeto={materia.nombre}
      acciones={[
        { etiqueta: 'Ver detalle', icono: <VisibilityOutlined />, to: `/materias/${materia.id}` },
        { etiqueta: 'Editar', icono: <EditOutlined />, onClick: () => onEdit(materia) },
        { etiqueta: 'Eliminar', icono: <DeleteOutlined />, tono: 'peligro', onClick: () => onDelete(materia) },
      ]}
    />
  )
}
