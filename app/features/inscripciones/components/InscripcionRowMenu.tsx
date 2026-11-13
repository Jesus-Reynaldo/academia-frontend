import DeleteOutlined from '@mui/icons-material/DeleteOutlined'
import PersonRemoveOutlined from '@mui/icons-material/PersonRemoveOutlined'
import ReplayOutlined from '@mui/icons-material/ReplayOutlined'
import TaskAltOutlined from '@mui/icons-material/TaskAltOutlined'
import type { ReactElement } from 'react'
import { AccionesFila } from '../../../shared/ui/AccionesFila'
import { ESTADOS_INSCRIPCION, ETIQUETA_ESTADO_INSCRIPCION, type EstadoInscripcion, type Inscripcion } from '../model/types'

interface InscripcionRowMenuProps {
  inscripcion: Inscripcion
  onCambiarEstado: (inscripcion: Inscripcion, estado: EstadoInscripcion) => void
  onDelete: (inscripcion: Inscripcion) => void
}

/** Ícono de cada cambio de estado: reactivar, retirar o finalizar. */
const ICONO_ESTADO: Record<EstadoInscripcion, ReactElement> = {
  ACTIVA: <ReplayOutlined />,
  RETIRADA: <PersonRemoveOutlined />,
  FINALIZADA: <TaskAltOutlined />,
}

/** Acciones como íconos: los dos estados a los que puede pasar y eliminar. Solo ADMIN (la API también lo exige). */
export function InscripcionRowMenu({ inscripcion, onCambiarEstado, onDelete }: InscripcionRowMenuProps) {
  const { nombres, apellidos } = inscripcion.estudiante
  return (
    <AccionesFila
      sujeto={`la inscripción de ${nombres} ${apellidos}`}
      acciones={[
        ...ESTADOS_INSCRIPCION.filter((estado) => estado !== inscripcion.estado).map((estado) => ({
          etiqueta: `Marcar como ${ETIQUETA_ESTADO_INSCRIPCION[estado]}`,
          icono: ICONO_ESTADO[estado],
          tono: estado === 'ACTIVA' ? ('exito' as const) : ('normal' as const),
          onClick: () => onCambiarEstado(inscripcion, estado),
        })),
        { etiqueta: 'Eliminar', icono: <DeleteOutlined />, tono: 'peligro', onClick: () => onDelete(inscripcion) },
      ]}
    />
  )
}
