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
import { Controller, useForm } from 'react-hook-form'
import { ApiError, friendlyMessage } from '../../../shared/api/errors'
import { useNotify } from '../../../shared/notifications/notifications-context'
import { visuallyHidden } from '../../../shared/ui/visuallyHidden'
import { estudiantesApi } from '../api/estudiantes.api'
import { useActualizarEstudiante, useCrearEstudiante } from '../api/useEstudiantes'
import { estudianteSchema, type EstudianteFormValues } from '../model/schema'
import { ESTADOS_ESTUDIANTE, ETIQUETA_ESTADO_ESTUDIANTE, type Estudiante, type EstudianteInput } from '../model/types'

interface EstudianteFormDialogProps {
  /** Con un estudiante: edición. Sin él: alta. */
  estudiante: Estudiante | null
  onClose: () => void
}

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

/**
 * ¿El documento ya es de otro estudiante? Al editar, el servidor no lo indica al rechazarlo.
 * Si la consulta falla devuelve false y el formulario muestra el error general.
 */
async function documentoRepetido(values: EstudianteFormValues, idActual: number | undefined) {
  try {
    const encontrados = await estudiantesApi.list({ q: values.documento.trim(), page: 1, limit: 100 })
    return encontrados.data.some((e) => e.documento === values.documento.trim() && e.id !== idActual)
  } catch {
    return false
  }
}

/** Formulario de alta y edición. Se monta solo mientras está abierto: cada apertura empieza con los valores correctos. */
export function EstudianteFormDialog({ estudiante, onClose }: EstudianteFormDialogProps) {
  const titleId = useId()
  const notify = useNotify()
  const [serverErrors, setServerErrors] = useState<string[]>([])
  const crear = useCrearEstudiante()
  const actualizar = useActualizarEstudiante()

  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<EstudianteFormValues>({
    resolver: zodResolver(estudianteSchema),
    mode: 'onBlur', // valida al salir del campo y al enviar, no mientras se escribe por primera vez
    defaultValues: {
      documento: estudiante?.documento ?? '',
      nombres: estudiante?.nombres ?? '',
      apellidos: estudiante?.apellidos ?? '',
      email: estudiante?.email ?? '',
      telefono: estudiante?.telefono ?? '',
      fechaNacimiento: estudiante?.fechaNacimiento?.slice(0, 10) ?? '',
      estado: estudiante?.estado ?? 'ACTIVO',
    },
  })

  const guardando = isSubmitting || crear.isPending || actualizar.isPending

  const onSubmit = handleSubmit(async (values) => {
    setServerErrors([])
    // El backend ignora una fecha vacía al editar: se avisa en vez de aparentar que se borró.
    if (estudiante?.fechaNacimiento && values.fechaNacimiento === '') {
      setError('fechaNacimiento', { message: 'Una fecha ya registrada no se puede quitar; puedes corregirla.' }, { shouldFocus: true })
      return
    }
    // Campos opcionales vacíos: al crear no se envían; al editar se envía null para borrar el valor guardado.
    const vacio = estudiante ? null : undefined
    // El código no se envía: lo asigna el servidor al crear y no cambia al editar.
    const input: EstudianteInput = {
      documento: values.documento.trim(),
      nombres: values.nombres.trim(),
      apellidos: values.apellidos.trim(),
      email: values.email.trim() || vacio,
      telefono: values.telefono.trim() || vacio,
      fechaNacimiento: values.fechaNacimiento ? `${values.fechaNacimiento}T00:00:00.000Z` : undefined,
      estado: values.estado,
    }
    const nombre = `${input.nombres} ${input.apellidos}`
    try {
      if (estudiante) {
        await actualizar.mutateAsync({ id: estudiante.id, input })
        notify(`Se guardaron los cambios de «${nombre}».`)
      } else {
        const creado = await crear.mutateAsync(input)
        notify(`Se registró a «${nombre}» con el código ${creado.codigo}.`)
      }
      onClose()
    } catch (error) {
      if (error instanceof ApiError && error.status === 400) {
        setServerErrors(error.messages)
        return
      }
      // Al crear, el servidor responde 409 si el documento ya existe; al editar, 500.
      if (error instanceof ApiError && (error.status === 409 || error.status >= 500)) {
        if (await documentoRepetido(values, estudiante?.id)) {
          setError('documento', { message: 'Ya existe un estudiante con este documento' }, { shouldFocus: true })
          return
        }
      }
      setServerErrors([friendlyMessage(error)])
    }
  })

  // Con cambios sin guardar, un clic accidental fuera del diálogo no debe descartarlos.
  const handleClose = (_event: object, reason?: string) => {
    if (guardando || (reason === 'backdropClick' && isDirty)) return
    onClose()
  }

  const fila = { display: 'grid', gap: 2.5, gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' } }

  return (
    <Dialog open onClose={handleClose} fullWidth maxWidth="sm" aria-labelledby={titleId}>
      {/* noValidate: la validación la hace Zod (mensajes en español), no el navegador. */}
      <Box component="form" onSubmit={onSubmit} noValidate sx={{ display: 'contents' }}>
        <DialogTitle id={titleId}>{estudiante ? 'Editar estudiante' : 'Nuevo estudiante'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2.5} sx={{ pt: 1 }}>
            {serverErrors.length > 0 && (
              <Alert severity="error" role="alert">
                {serverErrors.length === 1 ? (
                  serverErrors[0]
                ) : (
                  <Box component="ul" sx={{ m: 0, pl: 2.5 }}>
                    {serverErrors.map((mensaje) => (
                      <li key={mensaje}>{mensaje}</li>
                    ))}
                  </Box>
                )}
              </Alert>
            )}

            <Box sx={fila}>
              {/* El código lo asigna el servidor (así no se repite aunque varias personas inscriban a la vez). */}
              <TextField
                label="Código"
                fullWidth
                value={estudiante?.codigo ?? 'Se asigna al guardar'}
                helperText={estudiante ? 'No se puede cambiar.' : 'Automático: el siguiente libre (EST-0201…).'}
                slotProps={{ htmlInput: { readOnly: true, 'aria-readonly': true }, inputLabel: { shrink: true } }}
                sx={{ '& .MuiInputBase-input': { color: 'text.secondary', fontWeight: estudiante ? 600 : 400 } }}
              />
              <TextField
                label={obligatorio('Documento')}
                required
                fullWidth
                autoFocus
                autoComplete="off"
                placeholder="1234567 CH"
                error={Boolean(errors.documento)}
                helperText={errors.documento?.message}
                {...register('documento')}
              />
            </Box>

            <Box sx={fila}>
              <TextField
                label={obligatorio('Nombres')}
                required
                fullWidth
                autoComplete="off"
                error={Boolean(errors.nombres)}
                helperText={errors.nombres?.message}
                {...register('nombres')}
              />
              <TextField
                label={obligatorio('Apellidos')}
                required
                fullWidth
                autoComplete="off"
                error={Boolean(errors.apellidos)}
                helperText={errors.apellidos?.message}
                {...register('apellidos')}
              />
            </Box>

            <Box sx={fila}>
              <TextField
                label="Email"
                type="email"
                fullWidth
                autoComplete="off"
                error={Boolean(errors.email)}
                helperText={errors.email?.message ?? 'Opcional.'}
                {...register('email')}
              />
              <TextField
                label="Teléfono"
                type="tel"
                fullWidth
                autoComplete="off"
                error={Boolean(errors.telefono)}
                helperText={errors.telefono?.message ?? 'Opcional.'}
                {...register('telefono')}
              />
            </Box>

            <Box sx={fila}>
              <TextField
                label="Fecha de nacimiento"
                type="date"
                fullWidth
                slotProps={{ inputLabel: { shrink: true } }}
                error={Boolean(errors.fechaNacimiento)}
                helperText={errors.fechaNacimiento?.message ?? 'Opcional.'}
                {...register('fechaNacimiento')}
              />
              <Controller
                name="estado"
                control={control}
                render={({ field }) => (
                  <TextField
                    select
                    label="Estado"
                    fullWidth
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    inputRef={field.ref}
                    error={Boolean(errors.estado)}
                    helperText={errors.estado?.message}
                  >
                    {ESTADOS_ESTUDIANTE.map((valor) => (
                      <MenuItem key={valor} value={valor}>
                        {ETIQUETA_ESTADO_ESTUDIANTE[valor]}
                      </MenuItem>
                    ))}
                  </TextField>
                )}
              />
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
