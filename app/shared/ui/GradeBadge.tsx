import Chip from '@mui/material/Chip'
import type { ReactElement } from 'react'
import ErrorOutlined from '@mui/icons-material/ErrorOutlined'
import WarningAmber from '@mui/icons-material/WarningAmber'
import CheckCircleOutlined from '@mui/icons-material/CheckCircleOutlined'
import StarOutlined from '@mui/icons-material/StarOutlined'
import { NOTA_APROBACION } from '../config/env'
import { formatNota } from '../lib/format'
import { colors } from '../theme/tokens'

interface Nivel {
  etiqueta: string
  color: { main: string; tint: string }
  icon?: ReactElement
}

function nivelDe(nota: number | null): Nivel {
  if (nota === null) return { etiqueta: 'Sin notas', color: colors.neutral }
  if (nota < NOTA_APROBACION) return { etiqueta: 'Reprobado', color: colors.error, icon: <ErrorOutlined /> }
  if (nota <= 70) return { etiqueta: 'Aprobado', color: colors.warning, icon: <WarningAmber /> }
  if (nota <= 85) return { etiqueta: 'Bueno', color: colors.info, icon: <CheckCircleOutlined /> }
  return { etiqueta: 'Sobresaliente', color: colors.success, icon: <StarOutlined /> }
}

/** Muestra la nota con color + icono + etiqueta accesible (escala 0-100). */
export function GradeBadge({ nota }: { nota: number | null | undefined }) {
  const valor = nota ?? null
  const nivel = nivelDe(valor)
  return (
    <Chip
      size="small"
      icon={nivel.icon}
      label={formatNota(valor)}
      title={nivel.etiqueta}
      aria-label={valor === null ? nivel.etiqueta : `${formatNota(valor)}, ${nivel.etiqueta}`}
      sx={{
        bgcolor: nivel.color.tint,
        color: nivel.color.main,
        '& .MuiChip-icon': { color: nivel.color.main },
      }}
    />
  )
}
