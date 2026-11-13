import DeleteOutlined from '@mui/icons-material/DeleteOutlined'
import EditOutlined from '@mui/icons-material/EditOutlined'
import { AccionesFila } from '../../../shared/ui/AccionesFila'
import type { PeriodoAcademico } from '../model/types'

interface PeriodoRowMenuProps {
  periodo: PeriodoAcademico
  onEdit: (periodo: PeriodoAcademico) => void
  onDelete: (periodo: PeriodoAcademico) => void
}

/** Acciones de la fila como íconos visibles. Solo se renderiza para ADMIN (la API también lo exige). */
export function PeriodoRowMenu({ periodo, onEdit, onDelete }: PeriodoRowMenuProps) {
  return (
    <AccionesFila
      sujeto={periodo.nombre}
      acciones={[
        { etiqueta: 'Editar', icono: <EditOutlined />, onClick: () => onEdit(periodo) },
        { etiqueta: 'Eliminar', icono: <DeleteOutlined />, tono: 'peligro', onClick: () => onDelete(periodo) },
      ]}
    />
  )
}
