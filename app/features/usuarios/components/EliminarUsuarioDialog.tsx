import Alert from '@mui/material/Alert'
import { useState } from 'react'
import { useNotify } from '../../../shared/notifications/notifications-context'
import { ConfirmDialog } from '../../../shared/ui/ConfirmDialog'
import { useEliminarUsuario } from '../api/useUsuarios'
import type { CuentaUsuario } from '../model/types'
import { mensajesDeError } from '../model/errores'

interface EliminarUsuarioDialogProps {
  cuenta: CuentaUsuario
  onClose: () => void
  onDone: () => void
}

/** Eliminar una cuenta no borra al estudiante o docente vinculado. Se monta solo mientras está abierto. */
export function EliminarUsuarioDialog({ cuenta, onClose, onDone }: EliminarUsuarioDialogProps) {
  const notify = useNotify()
  const eliminar = useEliminarUsuario()
  const [error, setError] = useState<string | null>(null)

  const confirmar = () => {
    setError(null)
    eliminar.mutate(cuenta.id, {
      onSuccess: () => {
        notify(`Se eliminó la cuenta ${cuenta.email}.`)
        onDone()
      },
      onError: (e) => setError(mensajesDeError(e).join(' ')),
    })
  }

  return (
    <ConfirmDialog
      open
      title={`¿Eliminar la cuenta ${cuenta.email}?`}
      description="La persona ya no podrá iniciar sesión. Sus datos académicos no se borran."
      confirmLabel="Eliminar"
      loading={eliminar.isPending}
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
