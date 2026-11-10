import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import MenuItem from '@mui/material/MenuItem'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import { zodResolver } from '@hookform/resolvers/zod'
import { useId, useState, type ReactNode } from 'react'
import { Controller, useForm, useWatch } from 'react-hook-form'
import { ETIQUETA_ROL, TODOS_LOS_ROLES, type Rol } from '../../../shared/config/roles'
import { useNotify } from '../../../shared/notifications/notifications-context'
import { visuallyHidden } from '../../../shared/ui/visuallyHidden'
import { DocenteSelect } from '../../docentes'
import { EstudianteSelect } from '../../estudiantes'
import { useCrearUsuario } from '../api/useUsuarios'
import { mensajesDeError } from '../model/errores'
import { crearUsuarioSchema, type CrearUsuarioValues } from '../model/schema'
import { CampoPassword } from './CampoPassword'

function obligatorio(texto: string): ReactNode {
  return (
    <>
      {texto}
      <Box component="span" sx={visuallyHidden}>
        {' '}
        (obligatorio)
      </Box>
    </>
  )
}

/** Alta de cuenta. El selector de estudiante o de docente solo aparece cuando el rol lo requiere. */
export function CrearUsuarioDialog({ onClose }: { onClose: () => void }) {
  const titleId = useId()
  const notify = useNotify()
  const [serverErrors, setServerErrors] = useState<string[]>([])
  const crear = useCrearUsuario()

  const {
    register,
    control,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<CrearUsuarioValues>({
    resolver: zodResolver(crearUsuarioSchema),
    defaultValues: { email: '', password: '', rol: '', estudianteId: null, docenteId: null },
  })

  const rol = useWatch({ control, name: 'rol' })
  const password = useWatch({ control, name: 'password' })
  const guardando = isSubmitting || crear.isPending

  const onSubmit = handleSubmit(async (values) => {
    setServerErrors([])
    try {
      await crear.mutateAsync({
        email: values.email,
        password: values.password,
        rol: values.rol as Rol,
        // Solo se envía el vínculo que corresponde al rol: la API rechaza los demás.
        estudianteId: values.rol === 'ESTUDIANTE' && values.estudianteId !== null ? values.estudianteId : undefined,
        docenteId: values.rol === 'DOCENTE' && values.docenteId !== null ? values.docenteId : undefined,
      })
      notify(`Se creó la cuenta ${values.email}.`)
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
        <DialogTitle id={titleId}>Nuevo usuario</DialogTitle>
        <DialogContent>
          <Stack spacing={2.5} sx={{ pt: 1 }}>
            {serverErrors.length > 0 && (
              <Alert severity="error" role="alert">
                {serverErrors.join(' ')}
              </Alert>
            )}

            <TextField
              label={obligatorio('Email')}
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
              label={obligatorio('Contraseña')}
              required
              valor={password}
              error={errors.password?.message}
              registro={register('password')}
            />

            <Controller
              name="rol"
              control={control}
              render={({ field }) => (
                <TextField
                  select
                  label={obligatorio('Rol')}
                  required
                  fullWidth
                  value={field.value}
                  onChange={(event) => {
                    field.onChange(event)
                    // Al cambiar de rol se descarta la persona elegida para el rol anterior.
                    setValue('estudianteId', null)
                    setValue('docenteId', null)
                  }}
                  onBlur={field.onBlur}
                  inputRef={field.ref}
                  error={Boolean(errors.rol)}
                  helperText={errors.rol?.message}
                >
                  {TODOS_LOS_ROLES.map((valor) => (
                    <MenuItem key={valor} value={valor}>
                      {ETIQUETA_ROL[valor]}
                    </MenuItem>
                  ))}
                </TextField>
              )}
            />

            {rol === 'ESTUDIANTE' && (
              <Controller
                name="estudianteId"
                control={control}
                render={({ field }) => (
                  <EstudianteSelect
                    required
                    value={field.value}
                    onChange={(id) => field.onChange(id)}
                    error={Boolean(errors.estudianteId)}
                    helperText={errors.estudianteId?.message ?? 'Cada estudiante puede tener una sola cuenta.'}
                  />
                )}
              />
            )}

            {rol === 'DOCENTE' && (
              <Controller
                name="docenteId"
                control={control}
                render={({ field }) => (
                  <DocenteSelect
                    required
                    value={field.value}
                    onChange={(id) => field.onChange(id)}
                    error={Boolean(errors.docenteId)}
                    helperText={errors.docenteId?.message ?? 'Cada docente puede tener una sola cuenta.'}
                  />
                )}
              />
            )}
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
