import Button from '@mui/material/Button'
import { useCambioEstado } from './useCambioEstado'

type Opciones = Parameters<typeof useCambioEstado>[0]

/** Botón «Desactivar / Activar» para fichas y detalles (reemplaza a «Eliminar»: los datos no se borran). */
export function BotonCambioEstado(opciones: Opciones) {
  const { accion, dialogo } = useCambioEstado(opciones)
  if (!accion) return null
  const desactivar = accion.etiqueta === 'Desactivar'
  return (
    <>
      <Button
        variant="outlined"
        color={desactivar ? 'error' : 'success'}
        startIcon={accion.icono}
        onClick={accion.onClick}
        disabled={Boolean(accion.deshabilitada)}
        sx={{ minHeight: 44 }}
      >
        {accion.etiqueta}
      </Button>
      {dialogo}
    </>
  )
}
