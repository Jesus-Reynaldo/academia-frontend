import BlockOutlined from '@mui/icons-material/BlockOutlined'
import CheckCircleOutlined from '@mui/icons-material/CheckCircleOutlined'
import Alert from '@mui/material/Alert'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { apiFetch } from '../api/http'
import type { AccionFila } from './AccionesFila'
import { ConfirmDialog } from './ConfirmDialog'

interface CambioEstadoOpciones {
  /** Recurso de la API, p. ej. '/estudiantes'. */
  ruta: string
  id: number
  /** A quién afecta: «Juan Pérez», «3ro Secundaria A». */
  sujeto: string
  /** true = hoy está activo (la acción será Desactivar); false = inactivo (Activar); null = no aplica. */
  activo: boolean | null
  /** Cuerpo del PATCH para cada caso, p. ej. { estado: 'INACTIVO' } o { activo: false }. */
  alDesactivar: Record<string, unknown>
  alActivar: Record<string, unknown>
  /** Qué significa desactivar en este módulo (se muestra en la confirmación). */
  efecto: string
  /** Si no se permite, el motivo (el ícono queda deshabilitado con esa explicación). */
  bloqueado?: string | false
}

/**
 * Activar / desactivar en lugar de eliminar: los datos nunca se borran, solo cambia su estado.
 * Devuelve la acción para AccionesFila y el diálogo de confirmación que hay que renderizar junto a ella.
 */
export function useCambioEstado({ ruta, id, sujeto, activo, alDesactivar, alActivar, efecto, bloqueado }: CambioEstadoOpciones) {
  const queryClient = useQueryClient()
  const [abierto, setAbierto] = useState(false)
  const cambiar = useMutation({
    mutationFn: (cuerpo: Record<string, unknown>) => apiFetch(`${ruta}/${id}`, { method: 'PATCH', body: cuerpo }),
    // El estado se ve en listas, fichas, selectores e Inicio: se refresca todo.
    onSuccess: () => {
      setAbierto(false)
      void queryClient.invalidateQueries()
    },
  })

  if (activo === null) return { accion: null, dialogo: null }

  const accion: AccionFila = activo
    ? { etiqueta: 'Desactivar', icono: <BlockOutlined />, tono: 'peligro', deshabilitada: bloqueado, onClick: () => setAbierto(true) }
    : { etiqueta: 'Activar', icono: <CheckCircleOutlined />, tono: 'exito', deshabilitada: bloqueado, onClick: () => setAbierto(true) }

  const dialogo = (
    <ConfirmDialog
      open={abierto}
      title={activo ? `¿Desactivar ${sujeto}?` : `¿Activar ${sujeto}?`}
      description={
        activo
          ? `${efecto} No se borra ningún dato: podrás activarlo de nuevo cuando quieras.`
          : 'Volverá a estar disponible en todo el sistema.'
      }
      confirmLabel={activo ? 'Desactivar' : 'Activar'}
      loading={cambiar.isPending}
      onConfirm={() => cambiar.mutate(activo ? alDesactivar : alActivar)}
      onClose={() => {
        if (cambiar.isPending) return
        cambiar.reset()
        setAbierto(false)
      }}
    >
      {cambiar.isError && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {cambiar.error instanceof Error ? cambiar.error.message : 'No se pudo cambiar el estado.'}
        </Alert>
      )}
    </ConfirmDialog>
  )

  return { accion, dialogo }
}
