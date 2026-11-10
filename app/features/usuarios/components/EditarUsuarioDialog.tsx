import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import FormControlLabel from '@mui/material/FormControlLabel'
import FormHelperText from '@mui/material/FormHelperText'
import Stack from '@mui/material/Stack'
import Switch from '@mui/material/Switch'
import TextField from '@mui/material/TextField'
import { zodResolver } from '@hookform/resolvers/zod'
import { useId, useState } from 'react'
import { Controller, useForm, useWatch } from 'react-hook-form'
import { ETIQUETA_ROL } from '../../../shared/config/roles'
import { useNotify } from '../../../shared/notifications/notifications-context'
import { DefinitionList } from '../../../shared/ui/DefinitionList'
import { useActualizarUsuario } from '../api/useUsuarios'
import { editarUsuarioSchema, type EditarUsuarioValues } from '../model/schema'
import type { CuentaUsuario, EditarUsuarioInput } from '../model/types'
import { CampoPassword } from './CampoPassword'
import { mensajesDeError } from '../model/errores'
import { PersonaVinculada } from './PersonaVinculada'

interface EditarUsuarioDialogProps {
  cuenta: CuentaUsuario
  /** La cuenta con la que se inició sesión: no se puede desactivar a sí misma. */
  esPropia: boolean
  onClose: () => void
}

/** Edición de cuenta: email, contraseña y activo. El rol y la persona vinculada son de solo lectura. */
export function EditarUsuarioDialog({ cuenta, esPropia, onClose }: EditarUsuarioDialogProps) {
  const titleId = useId()
  const notify = useNotify()
  const [serverErrors, setServerErrors] = useState<string[]>([])
  const actualizar = useActualizarUsuario()

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<EditarUsuarioValues>({
    resolver: zodResolver(editarUsuarioSchema),
    defaultValues: { email: cuenta.email, password: '', activo: cuenta.activo },
  })

  const password = useWatch({ control, name: 'password' })
  const guardando = isSubmitting || actualizar.isPending

  const onSubmit = handleSubmit(async (values) => {
    setServerErrors([])
    const input: EditarUsuarioInput = { email: values.email, activo: values.activo }
    if (values.password) input.password = values.password
    try {
      await actualizar.mutateAsync({ id: cuenta.id, input })
      notify(`Se guardaron los cambios de ${values.email}.`)
      onClose()
    } catch (error) {
      setServerErrors(mensajesDeError(error))
    }
  })

  // Con cambios sin guardar, un clic accidental fuera del diálogo no debe descartarlos.
  const handleClose = (_event: object, reason?: string) => {
    if (guardando || (reason === 'backdropClick' && isDirty)) return
    onClose()
  }

  return (
    <Dialog open onClose={handleClose} fullWidth maxWidth="sm" aria-labelledby={titleId}>
      <Box component="form" onSubmit={onSubmit} noValidate sx={{ display: 'contents' }}>
        <DialogTitle id={titleId}>Editar usuario</DialogTitle>
        <DialogContent>
          <Stack spacing={2.5} sx={{ pt: 1 }}>
            {serverErrors.length > 0 && (
              <Alert severity="error" role="alert">
                {serverErrors.join(' ')}
              </Alert>
            )}

            <DefinitionList
              items={[
                { label: 'Rol', value: ETIQUETA_ROL[cuenta.rol] },
                { label: 'Vinculado a', value: <PersonaVinculada usuario={cuenta} /> },
              ]}
            />
            <Alert severity="info">El rol y la persona vinculada no se pueden cambiar. Para cambiarlos, crea otra cuenta.</Alert>

            <TextField
              label="Email"
              required
              fullWidth
              autoFocus
              type="email"
              autoComplete="off"
              error={Boolean(errors.email)}
              helperText={errors.email?.message}
              {...register('email')}
            />

            <CampoPassword
              label="Nueva contraseña"
              valor={password}
              error={errors.password?.message}
              ayuda="Déjala vacía para no cambiarla."
              registro={register('password')}
            />

            <Box>
              <Controller
                name="activo"
                control={control}
                render={({ field }) => (
                  <FormControlLabel
                    label="Cuenta activa"
                    disabled={esPropia}
                    control={<Switch checked={field.value} onChange={(event) => field.onChange(event.target.checked)} />}
                  />
                )}
              />
              <FormHelperText>
                {esPropia ? 'No puedes desactivar tu propia cuenta.' : 'Una cuenta inactiva no puede iniciar sesión.'}
              </FormHelperText>
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, flexWrap: 'wrap', gap: 1 }}>
          <Button onClick={() => handleClose({})} disabled={guardando} sx={{ minHeight: 44 }}>
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={guardando}
            startIcon={guardando ? <CircularProgress size={16} color="inherit" /> : undefined}
            sx={{ minHeight: 44 }}
          >
            Guardar
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  )
}
