import Alert from '@mui/material/Alert'
import { useState } from 'react'
import { ApiError, friendlyMessage } from '../../../shared/api/errors'
import { useNotify } from '../../../shared/notifications/notifications-context'
import { ConfirmDialog } from '../../../shared/ui/ConfirmDialog'
import { useEliminarEstudiante } from '../api/useEstudiantes'
import type { Estudiante, ResultadoEliminacion } from '../model/types'

interface EliminarEstudianteDialogProps {
  estudiante: Estudiante
  onClose: () => void
  /** Se llama tras un 204 o un 200 (ya con el aviso mostrado). */
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

/** Eliminar con los tres resultados de DELETE: 204 eliminado, 200 desactivado y 409 bloqueado. Se monta solo mientras está abierto. */
export function EliminarEstudianteDialog({ estudiante, onClose, onDone }: EliminarEstudianteDialogProps) {
  const notify = useNotify()
  const eliminar = useEliminarEstudiante()
  const [error, setError] = useState<ErrorEliminar | null>(null)
  const nombre = `${estudiante.nombres} ${estudiante.apellidos}`

  const confirmar = () => {
    setError(null)
    eliminar.mutate(estudiante.id, {
      onSuccess: (resultado) => {
        if (resultado.tipo === 'desactivado') {
          notify(`Se desactivó a «${nombre}» porque tiene registros asociados.`, 'info')
        } else {
          notify(`Se eliminó a «${nombre}».`)
        }
        onDone(resultado)
      },
      onError: (e) => setError(describirError(e)),
    })
  }

  return (
    <ConfirmDialog
      open
      title={`¿Eliminar a «${nombre}»?`}
      description="Si tiene registros asociados, no se borrará: se desactivará para conservar el historial."
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
