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
 * Busca qué dato está repetido, porque el servidor no lo indica al rechazar un código o documento duplicado.
 * Si la consulta falla devuelve vacío y el formulario muestra el error general.
 */
async function camposDuplicados(values: EstudianteFormValues, idActual: number | undefined) {
  const buscar = (texto: string) => estudiantesApi.list({ q: texto, page: 1, limit: 100 })
  try {
    const [porCodigo, porDocumento] = await Promise.all([buscar(values.codigo.trim()), buscar(values.documento.trim())])
    return {
      codigo: porCodigo.data.some((e) => e.codigo === values.codigo.trim() && e.id !== idActual),
      documento: porDocumento.data.some((e) => e.documento === values.documento.trim() && e.id !== idActual),
    }
  } catch {
    return { codigo: false, documento: false }
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
      codigo: estudiante?.codigo ?? '',
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
    const input: EstudianteInput = {
      codigo: values.codigo.trim(),
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
        await crear.mutateAsync(input)
        notify(`Se registró a «${nombre}».`)
      }
      onClose()
    } catch (error) {
      if (error instanceof ApiError && error.status === 400) {
        setServerErrors(error.messages)
        return
      }
      // El backend responde 500 (no 409) cuando el código o el documento ya existen.
      if (error instanceof ApiError && (error.status === 409 || error.status >= 500)) {
        const duplicados = await camposDuplicados(values, estudiante?.id)
        if (duplicados.codigo) setError('codigo', { message: 'Ya existe un estudiante con este código' }, { shouldFocus: true })
        if (duplicados.documento) setError('documento', { message: 'Ya existe un estudiante con este documento' }, { shouldFocus: !duplicados.codigo })
        if (duplicados.codigo || duplicados.documento) return
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
              <TextField
                label={obligatorio('Código')}
                required
                fullWidth
                autoFocus
                autoComplete="off"
                placeholder="EST-0201"
                error={Boolean(errors.codigo)}
                helperText={errors.codigo?.message}
                {...register('codigo')}
              />
              <TextField
                label={obligatorio('Documento')}
                required
                fullWidth
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
