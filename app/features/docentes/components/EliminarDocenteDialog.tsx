import Alert from '@mui/material/Alert'
import { useState } from 'react'
import { friendlyMessage } from '../../../shared/api/errors'
import { useNotify } from '../../../shared/notifications/notifications-context'
import { ConfirmDialog } from '../../../shared/ui/ConfirmDialog'
import { useEliminarDocente } from '../api/useDocentes'
import type { Docente, ResultadoEliminacion } from '../model/types'

interface EliminarDocenteDialogProps {
  /** Docente a eliminar; null = diálogo cerrado. */
  docente: Docente | null
  onClose: () => void
  /** Se llama después de eliminar o desactivar (p. ej. para volver al listado o retroceder de página). */
  onDone?: (resultado: ResultadoEliminacion) => void
}

/**
 * Confirmación de borrado usada por el listado y la ficha. Respeta los tres resultados de DELETE:
 * 204 eliminado, 200 desactivado (tiene calificaciones) y error (409 u otro) mostrado dentro del diálogo.
 */
export function EliminarDocenteDialog({ docente, onClose, onDone }: EliminarDocenteDialogProps) {
  const notify = useNotify()
  const eliminar = useEliminarDocente()
  const [error, setError] = useState<string | null>(null)

  const cerrar = () => {
    if (eliminar.isPending) return
    setError(null)
    onClose()
  }

  const confirmar = () => {
    if (!docente) return
    const nombre = `${docente.nombres} ${docente.apellidos}`
    setError(null)
    eliminar.mutate(docente.id, {
      onSuccess: (resultado) => {
        if (resultado.tipo === 'desactivado') {
          notify(`Se desactivó a «${nombre}» porque tiene registros asociados.`, 'info')
        } else {
          notify(`Se eliminó a «${nombre}».`)
        }
        setError(null)
        onClose()
        onDone?.(resultado)
      },
      onError: (e) => setError(friendlyMessage(e)),
    })
  }

  return (
    <ConfirmDialog
      open={docente !== null}
      title={docente ? `¿Eliminar a «${docente.nombres} ${docente.apellidos}»?` : ''}
      description="Si el docente tiene calificaciones registradas, no se borrará: se desactivará para conservar el historial."
      confirmLabel="Eliminar"
      loading={eliminar.isPending}
      onConfirm={confirmar}
      onClose={cerrar}
    >
      {error && (
        <Alert severity="error" role="alert" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}
    </ConfirmDialog>
  )
}
