import Chip from '@mui/material/Chip'
import type { ReactElement } from 'react'
import CheckCircleOutlined from '@mui/icons-material/CheckCircleOutlined'
import PauseCircleOutlined from '@mui/icons-material/PauseCircleOutlined'
import School from '@mui/icons-material/School'
import ExitToApp from '@mui/icons-material/ExitToApp'
import EventOutlined from '@mui/icons-material/EventOutlined'
import Flag from '@mui/icons-material/Flag'
import Lock from '@mui/icons-material/LockOutlined'
import { colors } from '../theme/tokens'

type Semantica = 'success' | 'warning' | 'error' | 'info' | 'neutral'

interface Definicion {
  label: string
  semantica: Semantica
  icon: ReactElement
}

// Estado del backend -> etiqueta, color e icono (el significado nunca depende solo del color).
const ESTADOS: Record<string, Definicion> = {
  ACTIVO: { label: 'Activo', semantica: 'success', icon: <CheckCircleOutlined /> },
  ACTIVA: { label: 'Activa', semantica: 'success', icon: <CheckCircleOutlined /> },
  INACTIVO: { label: 'Inactivo', semantica: 'neutral', icon: <PauseCircleOutlined /> },
  INACTIVA: { label: 'Inactiva', semantica: 'neutral', icon: <PauseCircleOutlined /> },
  EGRESADO: { label: 'Egresado', semantica: 'info', icon: <School /> },
  RETIRADO: { label: 'Retirado', semantica: 'warning', icon: <ExitToApp /> },
  RETIRADA: { label: 'Retirada', semantica: 'warning', icon: <ExitToApp /> },
  PLANIFICADO: { label: 'Planificado', semantica: 'info', icon: <EventOutlined /> },
  FINALIZADO: { label: 'Finalizado', semantica: 'neutral', icon: <Lock /> },
  FINALIZADA: { label: 'Finalizada', semantica: 'neutral', icon: <Flag /> },
}

export function StatusChip({ estado }: { estado: string }) {
  const def = ESTADOS[estado] ?? { label: estado, semantica: 'neutral' as const, icon: <PauseCircleOutlined /> }
  const color = colors[def.semantica]
  return (
    <Chip
      size="small"
      icon={def.icon}
      label={def.label}
      sx={{
        bgcolor: color.tint,
        color: color.main,
        '& .MuiChip-icon': { color: color.main },
      }}
    />
  )
}
