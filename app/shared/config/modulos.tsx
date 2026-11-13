import AccountCircleOutlined from '@mui/icons-material/AccountCircleOutlined'
import AssignmentIndOutlined from '@mui/icons-material/AssignmentIndOutlined'
import BadgeOutlined from '@mui/icons-material/BadgeOutlined'
import ClassOutlined from '@mui/icons-material/ClassOutlined'
import EventNoteOutlined from '@mui/icons-material/EventNoteOutlined'
import GradeOutlined from '@mui/icons-material/GradeOutlined'
import HistoryEduOutlined from '@mui/icons-material/HistoryEduOutlined'
import HomeOutlined from '@mui/icons-material/HomeOutlined'
import ManageAccountsOutlined from '@mui/icons-material/ManageAccountsOutlined'
import MenuBookOutlined from '@mui/icons-material/MenuBookOutlined'
import SchoolOutlined from '@mui/icons-material/SchoolOutlined'
import type { SvgIconComponent } from '@mui/icons-material'

export type Modulo =
  | 'inicio'
  | 'estudiantes'
  | 'docentes'
  | 'usuarios'
  | 'cursos'
  | 'materias'
  | 'periodos'
  | 'inscripciones'
  | 'calificaciones'
  | 'historial'
  | 'cuenta'

/**
 * Un solo ícono por módulo en TODO el sistema: menú lateral, barra inferior, encabezados de página,
 * tarjetas del Inicio y fichas. Cambiar un ícono aquí lo cambia en todas partes.
 */
export const ICONO_MODULO: Record<Modulo, SvgIconComponent> = {
  inicio: HomeOutlined,
  estudiantes: SchoolOutlined,
  docentes: BadgeOutlined,
  usuarios: ManageAccountsOutlined,
  cursos: ClassOutlined,
  materias: MenuBookOutlined,
  periodos: EventNoteOutlined,
  inscripciones: AssignmentIndOutlined,
  calificaciones: GradeOutlined,
  historial: HistoryEduOutlined,
  cuenta: AccountCircleOutlined,
}
