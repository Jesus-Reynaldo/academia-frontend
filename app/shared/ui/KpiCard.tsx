import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Skeleton from '@mui/material/Skeleton'
import Typography from '@mui/material/Typography'
import type { ReactNode } from 'react'
import { Link as RouterLink } from 'react-router'
import type { SvgIconComponent } from '@mui/icons-material'
import { ICONO_MODULO, type Modulo } from '../config/modulos'

interface KpiCardProps {
  label: string
  value?: ReactNode
  hint?: ReactNode
  loading?: boolean
  to?: string
  /** Ícono del módulo (el mismo del menú). */
  modulo?: Modulo
  /** Ícono propio cuando no es un módulo (p. ej. una alerta). */
  icono?: SvgIconComponent
  /** Color del ícono: 'peligro' para alertas. */
  tono?: 'normal' | 'peligro'
}

export function KpiCard({ label, value, hint, loading, to, modulo, icono, tono = 'normal' }: KpiCardProps) {
  const Icono = icono ?? (modulo ? ICONO_MODULO[modulo] : null)
  const colorIcono = tono === 'peligro' ? 'bg-peligro-tint text-peligro' : 'bg-primary-tint text-primary'
  const content = (
    <CardContent>
      <div className="flex items-start justify-between gap-2">
        <Typography variant="body2" color="text.secondary">
          {label}
        </Typography>
        {Icono && (
          <span aria-hidden className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg ${colorIcono}`}>
            <Icono fontSize="small" />
          </span>
        )}
      </div>
      {loading ? (
        <Skeleton variant="text" width={80} sx={{ fontSize: '2rem' }} />
      ) : (
        <Typography component="div" sx={{ fontSize: '2rem', fontWeight: 700, lineHeight: 1.3 }}>
          {value}
        </Typography>
      )}
      {hint && (
        <Typography variant="caption" color="text.secondary">
          {hint}
        </Typography>
      )}
    </CardContent>
  )

  if (to) {
    return (
      <Card
        component={RouterLink}
        to={to}
        sx={{
          height: '100%',
          display: 'block',
          color: 'inherit',
          textDecoration: 'none',
          bgcolor: 'background.paper',
          border: 1,
          borderColor: 'divider',
          borderRadius: 3,
          overflow: 'hidden',
          transition: 'border-color 150ms ease, box-shadow 150ms ease',
          '&:hover': { borderColor: 'primary.main', boxShadow: 2, bgcolor: 'background.paper' },
          '&:focus-visible': { outline: '2px solid', outlineColor: 'primary.main', outlineOffset: 2 },
        }}
      >
        {content}
      </Card>
    )
  }

  return <Card sx={{ height: '100%' }}>{content}</Card>
}
