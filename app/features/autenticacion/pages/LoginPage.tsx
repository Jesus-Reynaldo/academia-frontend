import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import IconButton from '@mui/material/IconButton'
import InputAdornment from '@mui/material/InputAdornment'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import SchoolRounded from '@mui/icons-material/SchoolRounded'
import Visibility from '@mui/icons-material/Visibility'
import VisibilityOff from '@mui/icons-material/VisibilityOff'
import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Navigate, useLocation, useNavigate } from 'react-router'
import { z } from 'zod'
import { ApiError } from '../../../shared/api/errors'
import { useAuth } from '../context/auth-context'

const loginSchema = z.object({
  email: z.string().min(1, 'Ingresa tu correo').email('Ingresa un correo válido'),
  password: z.string().min(1, 'Ingresa tu contraseña'),
})
type LoginForm = z.infer<typeof loginSchema>

// Cuentas del seed del backend: solo se ofrecen como atajo en desarrollo.
const CUENTAS_DEV = [
  { rol: 'Administrador', email: 'admin@colegio.edu' },
  { rol: 'Docente', email: 'ana.garcia@colegio.edu' },
  { rol: 'Estudiante', email: 'juan.perez@colegio.edu' },
]

function mensajeDeError(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 401) return 'Credenciales inválidas'
    if (error.status === 429) return 'Demasiados intentos, espera un momento'
    if (error.status === 0) return 'No se pudo conectar con el servidor. Revisa que el backend esté corriendo.'
    if (error.status >= 500) return 'El servidor tuvo un problema. Inténtalo de nuevo en un momento.'
    return error.messages.join(' · ')
  }
  return 'Ocurrió un error inesperado'
}

interface LocationState {
  expired?: boolean
  from?: { pathname: string; search?: string }
}

export function LoginPage() {
  const { status, login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const state = (location.state ?? {}) as LocationState
  const [showPassword, setShowPassword] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    setValue,
    setFocus,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({ resolver: zodResolver(loginSchema), defaultValues: { email: '', password: '' } })

  if (status === 'authenticated') return <Navigate to="/" replace />

  const onSubmit = handleSubmit(async ({ email, password }) => {
    setServerError(null)
    try {
      await login(email.trim(), password)
      const destino = state.from ? `${state.from.pathname}${state.from.search ?? ''}` : '/'
      void navigate(destino, { replace: true })
    } catch (error) {
      setServerError(mensajeDeError(error))
      setValue('password', '')
      setFocus('password')
    }
  })

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        p: 2,
        background: (theme) =>
          `linear-gradient(160deg, ${theme.palette.primary.light} 0%, ${theme.palette.background.default} 60%)`,
      }}
    >
      <Card sx={{ width: '100%', maxWidth: 420 }}>
        <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
          <Stack spacing={1} sx={{ mb: 3, alignItems: "center" }}>
            <Box
              sx={{
                width: 56,
                height: 56,
                borderRadius: 3,
                bgcolor: 'primary.main',
                color: '#fff',
                display: 'grid',
                placeItems: 'center',
              }}
            >
              <SchoolRounded fontSize="large" aria-hidden />
            </Box>
            <Typography variant="h1" component="h1" sx={{ fontSize: '1.5rem' }}>
              Sistema Académico
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Ingresa con tu cuenta para continuar
            </Typography>
          </Stack>

          {state.expired && !serverError && (
            <Alert severity="info" sx={{ mb: 2 }}>
              Tu sesión expiró. Vuelve a ingresar.
            </Alert>
          )}
          {serverError && (
            <Alert severity="error" sx={{ mb: 2 }} role="alert">
              {serverError}
            </Alert>
          )}

          <Box component="form" onSubmit={onSubmit} noValidate>
            <Stack spacing={2}>
              <TextField
                label="Correo electrónico"
                type="email"
                autoComplete="username"
                autoFocus
                fullWidth
                required
                error={Boolean(errors.email)}
                helperText={errors.email?.message}
                {...register('email')}
              />
              <TextField
                label="Contraseña"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                fullWidth
                required
                error={Boolean(errors.password)}
                helperText={errors.password?.message}
                slotProps={{
                  input: {
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          edge="end"
                          aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                          onClick={() => setShowPassword((v) => !v)}
                        >
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  },
                }}
                {...register('password')}
              />
              <Button type="submit" variant="contained" size="large" disabled={isSubmitting} fullWidth>
                {isSubmitting ? <CircularProgress size={24} color="inherit" aria-label="Ingresando" /> : 'Ingresar'}
              </Button>
            </Stack>
          </Box>

          {import.meta.env.DEV && (
            <Box sx={{ mt: 3 }}>
              <Typography variant="caption" color="text.secondary">
                Cuentas de prueba (solo desarrollo): elige una para rellenar el correo.
              </Typography>
              <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap', mt: 1 }}>
                {CUENTAS_DEV.map((cuenta) => (
                  <Chip
                    key={cuenta.email}
                    label={cuenta.rol}
                    size="small"
                    variant="outlined"
                    onClick={() => {
                      setValue('email', cuenta.email, { shouldValidate: true })
                      setFocus('password')
                    }}
                  />
                ))}
              </Stack>
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  )
}
