import ArrowBack from '@mui/icons-material/ArrowBack'
import Button from '@mui/material/Button'
import { Link as RouterLink, useLocation } from 'react-router'
import { leerDesde } from '../navegacion/desde'

/**
 * Botón «← Módulo» arriba de cada sub-pantalla (ficha, detalle).
 * Si se llegó desde otra pantalla (p. ej. Inscripciones → ficha del estudiante), vuelve a ESA pantalla con sus
 * filtros; si se abrió directo, vuelve a la lista principal del módulo (`to`).
 */
export function VolverA({ to, etiqueta }: { to: string; etiqueta: string }) {
  const desde = leerDesde(useLocation().state)
  return (
    <Button
      component={RouterLink}
      to={desde?.ruta ?? to}
      startIcon={<ArrowBack />}
      sx={{ mb: 1, minHeight: 44 }}
      className="no-print"
    >
      {desde?.etiqueta ?? etiqueta}
    </Button>
  )
}
