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
import { useActualizarCurso, useCrearCurso } from '../api/useCursos'
import { cursoSchema, type CursoFormValues } from '../model/schema'
import { ESTADOS_CURSO, ETIQUETA_ESTADO_CURSO, NIVELES_CURSO, type Curso, type CursoInput } from '../model/types'

interface CursoFormDialogProps {
  /** Con un curso: edición. Sin él: alta. */
  curso: Curso | null
  onClose: () => void
}

/** Etiqueta con la marca "(obligatorio)" para lectores de pantalla; el asterisco visual lo agrega MUI. */
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

/** Mensajes del servidor tal cual (400 puede traer varios); el resto, texto amigable. */
function mensajesDeError(error: unknown): string[] {
  if (error instanceof ApiError && error.status === 400) return error.messages
  return [friendlyMessage(error)]
}

/** Formulario de alta y edición. Se monta solo mientras está abierto: cada apertura empieza con los valores correctos. */
export function CursoFormDialog({ curso, onClose }: CursoFormDialogProps) {
  const titleId = useId()
  const notify = useNotify()
  const [serverErrors, setServerErrors] = useState<string[]>([])
  const crear = useCrearCurso()
  const actualizar = useActualizarCurso()

  // Un curso creado antes con otro nivel (la API acepta cualquier texto) conserva su valor al editar.
  const niveles: readonly string[] =
    curso && !(NIVELES_CURSO as readonly string[]).includes(curso.nivel) ? [...NIVELES_CURSO, curso.nivel] : NIVELES_CURSO

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<CursoFormValues>({
    resolver: zodResolver(cursoSchema),
    mode: 'onBlur', // valida al salir del campo y al enviar, no mientras se escribe por primera vez
    defaultValues: {
      nombre: curso?.nombre ?? '',
      nivel: curso?.nivel ?? '',
      paralelo: curso?.paralelo ?? '',
      capacidad: curso?.capacidad?.toString() ?? '',
      estado: curso?.estado ?? 'ACTIVO',
    },
  })

  const guardando = isSubmitting || crear.isPending || actualizar.isPending

  const onSubmit = handleSubmit(async (values) => {
    setServerErrors([])
    // Campos opcionales vacíos: al crear no se envían; al editar se envía null para borrar el valor guardado.
    const vacio = curso ? null : undefined
    const input: CursoInput = {
      nombre: values.nombre.trim(),
      nivel: values.nivel,
      paralelo: values.paralelo.trim() || vacio,
      capacidad: values.capacidad.trim() === '' ? vacio : Number(values.capacidad),
      estado: values.estado,
    }
    try {
      if (curso) {
        await actualizar.mutateAsync({ id: curso.id, input })
        notify(`Se guardaron los cambios de «${input.nombre}».`)
      } else {
        await crear.mutateAsync(input)
        notify(`Se creó el curso «${input.nombre}».`)
      }
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
      {/* noValidate: la validación la hace Zod (mensajes en español), no el navegador. */}
      <Box component="form" onSubmit={onSubmit} noValidate sx={{ display: 'contents' }}>
        <DialogTitle id={titleId}>{curso ? 'Editar curso' : 'Nuevo curso'}</DialogTitle>
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

            <TextField
              label={obligatorio('Nombre')}
              required
              fullWidth
              autoFocus
              autoComplete="off"
              placeholder="1ro Secundaria A"
              error={Boolean(errors.nombre)}
              helperText={errors.nombre?.message}
              {...register('nombre')}
            />

            <Box sx={{ display: 'grid', gap: 2.5, gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' } }}>
              <Controller
                name="nivel"
                control={control}
                render={({ field }) => (
                  <TextField
                    select
                    label={obligatorio('Nivel')}
                    required
                    fullWidth
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    inputRef={field.ref}
                    error={Boolean(errors.nivel)}
                    helperText={errors.nivel?.message}
                  >
                    {niveles.map((valor) => (
                      <MenuItem key={valor} value={valor}>
                        {valor}
                      </MenuItem>
                    ))}
                  </TextField>
                )}
              />
              <TextField
                label="Paralelo"
                fullWidth
                autoComplete="off"
                placeholder="A"
                error={Boolean(errors.paralelo)}
                helperText={errors.paralelo?.message ?? 'Opcional.'}
                {...register('paralelo')}
              />
            </Box>

            <Box sx={{ display: 'grid', gap: 2.5, gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' } }}>
              <TextField
                label="Capacidad"
                fullWidth
                autoComplete="off"
                placeholder="30"
                slotProps={{ htmlInput: { inputMode: 'numeric' } }}
                error={Boolean(errors.capacidad)}
                helperText={errors.capacidad?.message ?? 'Opcional. Vacío significa sin límite.'}
                {...register('capacidad')}
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
                    {ESTADOS_CURSO.map((valor) => (
                      <MenuItem key={valor} value={valor}>
                        {ETIQUETA_ESTADO_CURSO[valor]}
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
