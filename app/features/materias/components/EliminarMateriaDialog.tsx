import Alert from '@mui/material/Alert'
import { useState } from 'react'
import { ApiError, friendlyMessage } from '../../../shared/api/errors'
import { useNotify } from '../../../shared/notifications/notifications-context'
import { ConfirmDialog } from '../../../shared/ui/ConfirmDialog'
import { useEliminarMateria } from '../api/useMaterias'
import type { Materia, ResultadoEliminacion } from '../model/types'

interface EliminarMateriaDialogProps {
  materia: Materia
  onClose: () => void
  /** Se llama tras un 204 o un 200 (ya con el toast mostrado). */
  onDone: (resultado: ResultadoEliminacion) => void
}

interface ErrorEliminar {
  mensaje: string
  /** true si reintentar no sirve (conflicto, sin permiso, ya no existe): se oculta el botón Eliminar. */
  bloqueado: boolean
}

function describirError(error: unknown): ErrorEliminar {
  if (error instanceof ApiError && (error.status === 409 || error.status === 403 || error.status === 404)) {
    return { mensaje: error.status === 409 ? error.messages.join(' ') : friendlyMessage(error), bloqueado: true }
  }
  return { mensaje: friendlyMessage(error), bloqueado: false }
}

/**
 * Eliminar una materia con los tres resultados de DELETE: 204 (eliminada), 200 (la API la desactiva porque
 * tiene calificaciones) y 409 (conflicto, mensaje del servidor en una alerta). Se monta solo mientras está abierto.
 */
export function EliminarMateriaDialog({ materia, onClose, onDone }: EliminarMateriaDialogProps) {
  const notify = useNotify()
  const eliminar = useEliminarMateria()
  const [error, setError] = useState<ErrorEliminar | null>(null)

  const confirmar = () => {
    setError(null)
    eliminar.mutate(materia.id, {
      onSuccess: (resultado) => {
        if (resultado.tipo === 'desactivada') {
          notify(
            `«${materia.nombre}» tiene calificaciones, así que se marcó como inactiva en lugar de eliminarse.`,
            'info',
          )
        } else {
          notify(`Se eliminó «${materia.nombre}».`)
        }
        onDone(resultado)
      },
      onError: (e) => setError(describirError(e)),
    })
  }

  return (
    <ConfirmDialog
      open
      title={`¿Eliminar «${materia.nombre}»?`}
      description="Si la materia tiene calificaciones registradas, no se borrará: se marcará como inactiva para conservar el historial."
      confirmLabel="Eliminar"
      loading={eliminar.isPending}
      hideConfirm={error?.bloqueado ?? false}
      onConfirm={confirmar}
      onClose={onClose}
    >
      {error && (
        <Alert severity="error" role="alert" sx={{ mt: 2 }}>
          {error.mensaje}
        </Alert>
      )}
    </ConfirmDialog>
  )
}
