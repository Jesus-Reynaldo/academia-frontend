import DeleteOutlined from '@mui/icons-material/DeleteOutlined'
import EditOutlined from '@mui/icons-material/EditOutlined'
import VisibilityOutlined from '@mui/icons-material/VisibilityOutlined'
import { AccionesFila } from '../../../shared/ui/AccionesFila'
import type { Curso } from '../model/types'

interface CursoRowMenuProps {
  curso: Curso
  onEdit: (curso: Curso) => void
  onDelete: (curso: Curso) => void
}

/** Acciones de la fila como íconos visibles. Solo se renderiza para ADMIN (la API también lo exige). */
export function CursoRowMenu({ curso, onEdit, onDelete }: CursoRowMenuProps) {
  return (
    <AccionesFila
      sujeto={curso.nombre}
      acciones={[
        { etiqueta: 'Ver detalle', icono: <VisibilityOutlined />, to: `/cursos/${curso.id}` },
        { etiqueta: 'Editar', icono: <EditOutlined />, onClick: () => onEdit(curso) },
        { etiqueta: 'Eliminar', icono: <DeleteOutlined />, tono: 'peligro', onClick: () => onDelete(curso) },
      ]}
    />
  )
}
