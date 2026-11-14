import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import type { ReactNode } from 'react'
import { ICONO_MODULO, type Modulo } from '../config/modulos'
import { BotonPdf } from './BotonPdf'

interface PageHeaderProps {
  title: string
  subtitle?: ReactNode
  actions?: ReactNode
  /** Ícono del módulo junto al título (el mismo que en el menú). */
  modulo?: Modulo
  /** Si se pasa, aparece el botón «Reporte PDF» (con los filtros que el usuario tiene puestos). */
  reporte?: () => Promise<void>
}

export function PageHeader({ title, subtitle, actions, modulo, reporte }: PageHeaderProps) {
  const Icono = modulo ? ICONO_MODULO[modulo] : null
  return (
    <Box
      sx={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 2,
        mb: 3,
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, minWidth: 0 }}>
        {Icono && (
          <span aria-hidden className="hidden sm:grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-primary-tint text-primary">
            <Icono />
          </span>
        )}
      <Box sx={{ minWidth: 0 }}>
        <Typography variant="h1" component="h1">
          {title}
        </Typography>
        {subtitle && (
          <Typography variant="body2" color="text.secondary" component="div" sx={{ mt: 0.5 }}>
            {subtitle}
          </Typography>
        )}
      </Box>
      </Box>
      {(actions || reporte) && (
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          {reporte && <BotonPdf generar={reporte} />}
          {actions}
        </Box>
      )}
    </Box>
  )
}
