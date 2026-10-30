import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CircularProgress from '@mui/material/CircularProgress'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { friendlyMessage } from '../../../shared/api/errors'
import { PageHeader } from '../../../shared/ui/PageHeader'
import { authApi } from '../api/auth.api'

const schema = z
  .object({
    passwordActual: z.string().min(1, 'Ingresa tu contraseña actual'),
    passwordNueva: z.string().min(8, 'La nueva contraseña debe tener al menos 8 caracteres'),
    confirmacion: z.string().min(1, 'Repite la nueva contraseña'),
  })
  .refine((v) => v.passwordNueva === v.confirmacion, {
    path: ['confirmacion'],
    message: 'Las contraseñas no coinciden',
  })
type Form = z.infer<typeof schema>

export function CambiarPasswordPage() {
  const [ok, setOk] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<Form>({
    resolver: zodResolver(schema),
    defaultValues: { passwordActual: '', passwordNueva: '', confirmacion: '' },
  })

  const onSubmit = handleSubmit(async ({ passwordActual, passwordNueva }) => {
    setOk(false)
    setServerError(null)
    try {
      await authApi.cambiarPassword(passwordActual, passwordNueva)
      setOk(true)
      reset()
    } catch (error) {
      setServerError(friendlyMessage(error))
    }
  })

  return (
    <>
      <PageHeader title="Cambiar contraseña" subtitle="Usa al menos 8 caracteres." />
      <Card sx={{ maxWidth: 480 }}>
        <CardContent>
          <Box component="form" onSubmit={onSubmit} noValidate>
            <Stack spacing={2}>
              {ok && <Alert severity="success">Tu contraseña se actualizó correctamente.</Alert>}
              {serverError && (
                <Alert severity="error" role="alert">
                  {serverError}
                </Alert>
              )}
              <TextField
                label="Contraseña actual"
                type="password"
                autoComplete="current-password"
                required
                error={Boolean(errors.passwordActual)}
                helperText={errors.passwordActual?.message}
                {...register('passwordActual')}
              />
              <TextField
                label="Nueva contraseña"
                type="password"
                autoComplete="new-password"
                required
                error={Boolean(errors.passwordNueva)}
                helperText={errors.passwordNueva?.message}
                {...register('passwordNueva')}
              />
              <TextField
                label="Repite la nueva contraseña"
                type="password"
                autoComplete="new-password"
                required
                error={Boolean(errors.confirmacion)}
                helperText={errors.confirmacion?.message}
                {...register('confirmacion')}
              />
              <Box>
                <Button type="submit" variant="contained" disabled={isSubmitting}>
                  {isSubmitting ? <CircularProgress size={22} color="inherit" aria-label="Guardando" /> : 'Guardar'}
                </Button>
              </Box>
            </Stack>
          </Box>
        </CardContent>
      </Card>
    </>
  )
}
