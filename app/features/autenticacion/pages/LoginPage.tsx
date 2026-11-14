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
import Visibility from '@mui/icons-material/Visibility'
import VisibilityOff from '@mui/icons-material/VisibilityOff'
import { zodResolver } from '@hookform/resolvers/zod'
import { useQuery } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { Navigate, useLocation, useNavigate } from 'react-router'
import { z } from 'zod'
import { ApiError } from '../../../shared/api/errors'
import { apiFetch } from '../../../shared/api/http'
import { LogoInstitucion } from '../../../shared/institucion/LogoInstitucion'
import { useInstitucion } from '../../../shared/institucion/useInstitucion'
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
  const institucion = useInstitucion()

  // Render (plan gratis) duerme el servidor sin visitas: al abrir el login se lo despierta y, si tarda, se avisa.
  const salud = useQuery({
    queryKey: ['salud'],
    // Cualquier respuesta del servidor (incluso 404 si su versión aún no tiene /salud) significa que está despierto;
    // solo falla si no hay conexión.
    queryFn: ({ signal }) =>
      apiFetch<{ estado: string }>('/salud', { signal, auth: false }).catch((error: unknown) => {
        if (error instanceof ApiError && error.status > 0) return { estado: 'despierto' }
        throw error
      }),
    retry: 6,
    retryDelay: 5000,
    staleTime: 60 * 1000,
  })
  const [lento, setLento] = useState(false)
  useEffect(() => {
    if (!salud.isPending) return
    const t = setTimeout(() => setLento(true), 1500)
    return () => clearTimeout(t)
  }, [salud.isPending])
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    handleSubmit,
    setValue,
    setFocus,
    control,
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
    <div className="grid min-h-screen bg-fondo lg:grid-cols-2">
      {/* Panel de marca: solo en pantallas grandes, decorativo para lectores de pantalla (el título real está en el formulario). */}
      <div aria-hidden className="relative hidden overflow-hidden bg-gradient-to-br from-sidebar via-primary-dark to-primary p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="flex items-center gap-3 text-lg font-semibold">
          <LogoInstitucion tamano={48} />
          {institucion.nombre}
        </div>
        <div className="max-w-md">
          <p className="m-0 text-4xl font-bold leading-tight">Notas, cursos e historial en un solo lugar.</p>
          <ul className="mt-8 list-none space-y-4 p-0 text-base text-white/85">
            <li className="flex items-center gap-3"><span className="h-2 w-2 rounded-full bg-white" />Estudiantes: cómo voy en cada materia</li>
            <li className="flex items-center gap-3"><span className="h-2 w-2 rounded-full bg-white" />Docentes: registrar notas por curso</li>
            <li className="flex items-center gap-3"><span className="h-2 w-2 rounded-full bg-white" />Administración: todo el año escolar</li>
          </ul>
        </div>
        <p className="m-0 text-sm text-white/60">Sistema académico{institucion.sigla ? ` · ${institucion.sigla}` : ''}</p>
        <span className="pointer-events-none absolute -bottom-24 -right-24 h-80 w-80 rounded-full bg-white/10" />
        <span className="pointer-events-none absolute -top-16 right-24 h-40 w-40 rounded-full bg-white/5" />
      </div>
      <div className="grid place-items-center p-4">
      <Card sx={{ width: '100%', maxWidth: 420 }}>
        <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
          <Stack spacing={1} sx={{ mb: 3, alignItems: "center" }}>
            <LogoInstitucion tamano={64} className="bg-primary text-white" />
            <Typography variant="h1" component="h1" sx={{ fontSize: '1.5rem', textAlign: 'center' }}>
              {institucion.nombre}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Ingresa con tu cuenta para continuar
            </Typography>
          </Stack>

          {salud.isPending && lento && (
            <Alert severity="info" icon={<CircularProgress size={20} />} sx={{ mb: 2 }} role="status">
              Despertando el servidor… la primera vez puede tardar hasta un minuto.
            </Alert>
          )}
          {salud.isError && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              No se pudo contactar al servidor. Revisa tu conexión y vuelve a cargar la página.
            </Alert>
          )}
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
              <Controller
                control={control}
                name="email"
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Correo electrónico"
                    type="email"
                    autoComplete="username"
                    autoFocus
                    fullWidth
                    required
                    error={Boolean(errors.email)}
                    helperText={errors.email?.message}
                  />
                )}
              />
              <Controller
                control={control}
                name="password"
                render={({ field }) => (
                  <TextField
                    {...field}
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
                  />
                )}
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
      </div>
    </div>
  )
}
