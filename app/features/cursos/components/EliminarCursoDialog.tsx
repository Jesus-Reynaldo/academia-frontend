import Alert from '@mui/material/Alert'
import { useState } from 'react'
import { ApiError, friendlyMessage } from '../../../shared/api/errors'
import { useNotify } from '../../../shared/notifications/notifications-context'
import { ConfirmDialog } from '../../../shared/ui/ConfirmDialog'
import { useEliminarCurso } from '../api/useCursos'
import type { Curso, ResultadoEliminacion } from '../model/types'

interface EliminarCursoDialogProps {
  curso: Curso
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

/**
 * Eliminar un curso con los tres resultados de DELETE: 204 (eliminado), 200 (la API lo desactiva porque
 * tiene inscripciones) y 409 (conflicto, mensaje del servidor). Se monta solo mientras está abierto.
 */
export function EliminarCursoDialog({ curso, onClose, onDone }: EliminarCursoDialogProps) {
  const notify = useNotify()
  const eliminar = useEliminarCurso()
  const [error, setError] = useState<ErrorEliminar | null>(null)

  const confirmar = () => {
    setError(null)
    eliminar.mutate(curso.id, {
      onSuccess: (resultado) => {
        if (resultado.tipo === 'desactivado') {
          notify(`Se desactivó «${curso.nombre}» porque tiene inscripciones asociadas.`, 'info')
        } else {
          notify(`Se eliminó «${curso.nombre}».`)
        }
        onDone(resultado)
      },
      onError: (e) => setError(describirError(e)),
    })
  }

  return (
    <ConfirmDialog
      open
      title={`¿Eliminar «${curso.nombre}»?`}
      description="Si el curso tiene inscripciones, no se borrará: se desactivará para conservar el historial."
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
