import IconButton from '@mui/material/IconButton'
import Tooltip from '@mui/material/Tooltip'
import type { ReactElement } from 'react'
import { Link as RouterLink } from 'react-router'

export interface AccionFila {
  /** Verbo visible en el tooltip y parte del nombre accesible: «Editar», «Eliminar»… */
  etiqueta: string
  icono: ReactElement
  /** Navega a esta ruta (p. ej. ver ficha) en lugar de ejecutar `onClick`. */
  to?: string
  onClick?: () => void
  /** Color del ícono: las acciones destructivas van en rojo. */
  tono?: 'normal' | 'peligro' | 'exito'
  /** Si está deshabilitada, el tooltip explica por qué. */
  deshabilitada?: string | false
}

const COLOR = { normal: 'text.secondary', peligro: 'error.main', exito: 'success.main' } as const

/**
 * Acciones de una fila como íconos visibles (antes estaban escondidas en un menú ⋮).
 * Cada botón mide 44×44 (WCAG 2.5.8) y su nombre accesible incluye a quién afecta: «Editar Juan Pérez».
 */
export function AccionesFila({ acciones, sujeto }: { acciones: AccionFila[]; sujeto: string }) {
  return (
    <span className="inline-flex items-center justify-end gap-0.5 whitespace-nowrap">
      {acciones.map(({ etiqueta, icono, to, onClick, tono = 'normal', deshabilitada }) => {
        const nombre = `${etiqueta} ${sujeto}`
        const comun = {
          'aria-label': nombre,
          disabled: Boolean(deshabilitada),
          sx: {
            width: 44,
            height: 44,
            color: COLOR[tono],
            '&:hover': { color: tono === 'normal' ? 'primary.main' : COLOR[tono], bgcolor: 'action.hover' },
          },
        }
        const boton = to ? (
          <IconButton component={RouterLink} to={to} {...comun}>
            {icono}
          </IconButton>
        ) : (
          <IconButton onClick={onClick} {...comun}>
            {icono}
          </IconButton>
        )
        return (
          <Tooltip key={etiqueta} title={deshabilitada || etiqueta} describeChild>
            {/* span: un botón deshabilitado no dispara eventos y el tooltip no aparecería */}
            <span>{boton}</span>
          </Tooltip>
        )
      })}
    </span>
  )
}
