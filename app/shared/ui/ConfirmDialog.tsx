import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogContentText from '@mui/material/DialogContentText'
import DialogTitle from '@mui/material/DialogTitle'
import { useId, type ReactNode } from 'react'

interface ConfirmDialogProps {
  open: boolean
  title: string
  /** Texto explicativo de lo que va a pasar. */
  description?: ReactNode
  /** Verbo explícito del botón peligroso: "Eliminar", no "Aceptar". */
  confirmLabel: string
  cancelLabel?: string
  /** Mientras la acción se ejecuta: deshabilita ambos botones y muestra un spinner. */
  loading?: boolean
  /** Oculta el botón de confirmar y deja solo "Cerrar" (p. ej. tras un error que no se arregla reintentando). */
  hideConfirm?: boolean
  onConfirm: () => void
  onClose: () => void
  /** Contenido extra bajo la descripción (alertas de error, ayudas). */
  children?: ReactNode
}

/**
 * Diálogo de confirmación para acciones destructivas (docs/UI-UX-PLAN.md, 6.4).
 * El foco inicial va en "Cancelar"; MUI atrapa el foco, cierra con Esc y lo devuelve al disparador.
 */
export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  cancelLabel = 'Cancelar',
  loading = false,
  hideConfirm = false,
  onConfirm,
  onClose,
  children,
}: ConfirmDialogProps) {
  const titleId = useId()
  const descriptionId = useId()

  return (
    <Dialog
      open={open}
      onClose={loading ? undefined : onClose}
      aria-labelledby={titleId}
      aria-describedby={description ? descriptionId : undefined}
      fullWidth
      maxWidth="xs"
    >
      <DialogTitle id={titleId}>{title}</DialogTitle>
      <DialogContent>
        {description && <DialogContentText id={descriptionId}>{description}</DialogContentText>}
        {children}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2, flexWrap: 'wrap', gap: 1 }}>
        <Button onClick={onClose} disabled={loading} autoFocus sx={{ minHeight: 44 }}>
          {hideConfirm ? 'Cerrar' : cancelLabel}
        </Button>
        {!hideConfirm && (
          <Button
            onClick={onConfirm}
            color="error"
            variant="contained"
            disabled={loading}
            startIcon={loading ? <CircularProgress size={16} color="inherit" /> : undefined}
            sx={{ minHeight: 44 }}
          >
            {confirmLabel}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  )
}
