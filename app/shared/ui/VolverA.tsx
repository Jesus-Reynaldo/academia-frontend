import ArrowBack from '@mui/icons-material/ArrowBack'
import Button from '@mui/material/Button'
import { Link as RouterLink } from 'react-router'

/**
 * Botón «← Módulo» arriba de cada sub-pantalla (ficha, detalle) para volver a la lista principal.
 * El mismo en todo el sistema (como en el detalle de Materias).
 */
export function VolverA({ to, etiqueta }: { to: string; etiqueta: string }) {
  return (
    <Button component={RouterLink} to={to} startIcon={<ArrowBack />} sx={{ mb: 1, minHeight: 44 }} className="no-print">
      {etiqueta}
    </Button>
  )
}
