import EditOutlined from '@mui/icons-material/EditOutlined'
import { AccionesFila } from '../../../shared/ui/AccionesFila'
import type { PeriodoAcademico } from '../model/types'

interface PeriodoRowMenuProps {
  periodo: PeriodoAcademico
  onEdit: (periodo: PeriodoAcademico) => void
  /** Ya no se usa: un período no se borra; su estado (Planificado, Activo, Finalizado) se cambia al editarlo. */
  onDelete?: (periodo: PeriodoAcademico) => void
}

/** Acciones como íconos. Los períodos no se eliminan: se finalizan desde Editar. Solo ADMIN. */
export function PeriodoRowMenu({ periodo, onEdit }: PeriodoRowMenuProps) {
  return <AccionesFila sujeto={periodo.nombre} acciones={[{ etiqueta: 'Editar', icono: <EditOutlined />, onClick: () => onEdit(periodo) }]} />
}
