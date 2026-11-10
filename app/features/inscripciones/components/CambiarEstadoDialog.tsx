import Alert from '@mui/material/Alert'
import { useState } from 'react'
import { ApiError, friendlyMessage } from '../../../shared/api/errors'
import { useNotify } from '../../../shared/notifications/notifications-context'
import { ConfirmDialog } from '../../../shared/ui/ConfirmDialog'
import { useCambiarEstadoInscripcion } from '../api/useInscripciones'
import { ETIQUETA_ESTADO_INSCRIPCION, type EstadoInscripcion, type Inscripcion } from '../model/types'

interface CambiarEstadoDialogProps {
  inscripcion: Inscripcion
  estado: EstadoInscripcion
  onClose: () => void
}

/** Confirma el cambio de estado (ACTIVA / RETIRADA / FINALIZADA). Se monta solo mientras está abierto. */
export function CambiarEstadoDialog({ inscripcion, estado, onClose }: CambiarEstadoDialogProps) {
  const notify = useNotify()
  const cambiar = useCambiarEstadoInscripcion()
  const [error, setError] = useState<string | null>(null)
  const etiqueta = ETIQUETA_ESTADO_INSCRIPCION[estado]
  const nombre = `${inscripcion.estudiante.nombres} ${inscripcion.estudiante.apellidos}`

  const confirmar = () => {
    setError(null)
    cambiar.mutate(
      { id: inscripcion.id, estado },
      {
        onSuccess: () => {
          notify(`La inscripción de «${nombre}» ahora está ${etiqueta.toLowerCase()}.`)
          onClose()
        },
        onError: (e) => setError(e instanceof ApiError && e.status === 400 ? e.messages.join(' ') : friendlyMessage(e)),
      },
    )
  }

  return (
    <ConfirmDialog
      open
      title={`¿Marcar como ${etiqueta}?`}
      description={`Inscripción de ${nombre} en ${inscripcion.curso.nombre} · ${inscripcion.periodoAcademico.nombre}. Solo las inscripciones activas cuentan en la ocupación del curso.`}
      confirmLabel={`Marcar como ${etiqueta}`}
      loading={cambiar.isPending}
      onConfirm={confirmar}
      onClose={onClose}
    >
      {error && (
        <Alert severity="error" role="alert" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}
    </ConfirmDialog>
  )
}
