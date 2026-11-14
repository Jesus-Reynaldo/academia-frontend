import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import type { ReactNode } from 'react'
import { ICONO_MODULO, type Modulo } from '../config/modulos'

interface SectionCardProps {
  title: string
  actions?: ReactNode
  children: ReactNode
  /** Ícono del módulo junto al título (el mismo del menú). */
  modulo?: Modulo
}

/** Tarjeta de sección: título con separador y acciones a la derecha; cada bloque maneja sus propios estados. */
export function SectionCard({ title, actions, children, modulo }: SectionCardProps) {
  const Icono = modulo ? ICONO_MODULO[modulo] : null
  return (
    <Card sx={{ height: '100%' }} component="section" aria-label={title}>
      <CardContent>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-borde pb-3">
          <div className="flex min-w-0 items-center gap-2">
            {Icono && (
              <span aria-hidden className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-primary-tint text-primary">
                <Icono fontSize="small" />
              </span>
            )}
            <Typography variant="h2" component="h2" sx={{ fontSize: '1.125rem' }}>
              {title}
            </Typography>
          </div>
          {actions}
        </div>
        {children}
      </CardContent>
    </Card>
  )
}
