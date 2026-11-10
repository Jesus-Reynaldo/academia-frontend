import Alert from '@mui/material/Alert'
import { useState } from 'react'
import { ApiError, friendlyMessage } from '../../../shared/api/errors'
import { useNotify } from '../../../shared/notifications/notifications-context'
import { ConfirmDialog } from '../../../shared/ui/ConfirmDialog'
import { useEliminarInscripcion } from '../api/useInscripciones'
import type { Inscripcion } from '../model/types'

interface EliminarInscripcionDialogProps {
  inscripcion: Inscripcion
  onClose: () => void
  /** Se llama tras eliminar (ya con el aviso mostrado). */
  onDone: () => void
}

interface ErrorEliminar {
  mensaje: string
  /** true si reintentar no sirve: se oculta el botón Eliminar. */
  bloqueado: boolean
}

function describirError(error: unknown): ErrorEliminar {
  if (error instanceof ApiError && error.status === 409) {
    return {
      mensaje: 'Esta inscripción tiene calificaciones registradas, así que no se puede eliminar. Cambia su estado a Retirada.',
      bloqueado: true,
    }
  }
  if (error instanceof ApiError && (error.status === 403 || error.status === 404)) {
    return { mensaje: friendlyMessage(error), bloqueado: true }
  }
  return { mensaje: friendlyMessage(error), bloqueado: false }
}

/** Eliminar: 204 eliminada; 409 si tiene calificaciones (se indica cambiar el estado). Se monta solo mientras está abierto. */
export function EliminarInscripcionDialog({ inscripcion, onClose, onDone }: EliminarInscripcionDialogProps) {
  const notify = useNotify()
  const eliminar = useEliminarInscripcion()
  const [error, setError] = useState<ErrorEliminar | null>(null)
  const nombre = `${inscripcion.estudiante.nombres} ${inscripcion.estudiante.apellidos}`

  const confirmar = () => {
    setError(null)
    eliminar.mutate(inscripcion.id, {
      onSuccess: () => {
        notify(`Se eliminó la inscripción de «${nombre}».`)
        onDone()
      },
      onError: (e) => setError(describirError(e)),
    })
  }

  return (
    <ConfirmDialog
      open
      title="¿Eliminar esta inscripción?"
      description={`${nombre} en ${inscripcion.curso.nombre} · ${inscripcion.periodoAcademico.nombre}. Esta acción no se puede deshacer.`}
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
