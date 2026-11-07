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
import { ApiError, friendlyMessage } from '../../../shared/api/errors'
import { useNotify } from '../../../shared/notifications/notifications-context'
import { visuallyHidden } from '../../../shared/ui/visuallyHidden'
import { useActualizarMateria, useCrearMateria } from '../api/useMaterias'
import {
  LIMITE_TEXTO,
  aActualizar,
  aCrear,
  materiaSchema,
  valoresIniciales,
  type MateriaFormValues,
} from '../model/schema'
import { ESTADOS_MATERIA, ETIQUETA_ESTADO_MATERIA, type Materia } from '../model/types'

interface MateriaFormDialogProps {
  /** Con una materia: edición. Sin ella: alta. */
  materia: Materia | null
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

/** Errores que se muestran en una alerta (los de código duplicado van junto al campo, no aquí). */
function mensajesDeError(error: unknown): string[] {
  if (error instanceof ApiError) {
    if (error.status === 400) return error.messages
    if (error.status >= 500) {
      return ['El servidor no pudo guardar la materia. Si el código ya existe en otra materia, usa uno distinto.']
    }
  }
  return [friendlyMessage(error)]
}

/**
 * Formulario de alta y edición en diálogo (docs/UI-UX-PLAN.md, 8.7).
 * Se monta solo mientras está abierto: cada apertura empieza con los valores correctos.
 */
export function MateriaFormDialog({ materia, onClose }: MateriaFormDialogProps) {
  const titleId = useId()
  const notify = useNotify()
  const [serverErrors, setServerErrors] = useState<string[]>([])
  const crear = useCrearMateria()
  const actualizar = useActualizarMateria()

  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<MateriaFormValues>({
    resolver: zodResolver(materiaSchema),
    mode: 'onBlur',
    defaultValues: valoresIniciales(materia),
  })

  const descripcion = useWatch({ control, name: 'descripcion' })
  const guardando = isSubmitting || crear.isPending || actualizar.isPending

  const onSubmit = handleSubmit(async (values) => {
    setServerErrors([])
    try {
      if (materia) {
        await actualizar.mutateAsync({ id: materia.id, input: aActualizar(values) })
        notify(`Se guardaron los cambios de «${values.nombre.trim()}».`)
      } else {
        await crear.mutateAsync(aCrear(values))
        notify(`Se creó la materia «${values.nombre.trim()}».`)
      }
      onClose()
    } catch (error) {
      // 409: el código ya existe → el mensaje del servidor va junto al campo y se enfoca (RF-MAT).
      if (error instanceof ApiError && error.status === 409) {
        setError('codigo', { type: 'server', message: error.messages.join(' ') }, { shouldFocus: true })
        return
      }
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
      {/* noValidate: la validación la hace Zod (mensajes en español), no el navegador. `display: contents` conserva el layout del diálogo. */}
      <Box component="form" onSubmit={onSubmit} noValidate sx={{ display: 'contents' }}>
        <DialogTitle id={titleId}>{materia ? 'Editar materia' : 'Nueva materia'}</DialogTitle>
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

            <Box sx={{ display: 'grid', gap: 2.5, gridTemplateColumns: { xs: '1fr', sm: '1fr 2fr' } }}>
              <TextField
                label={obligatorio('Código')}
                required
                fullWidth
                autoFocus
                autoComplete="off"
                placeholder="MAT-001"
                error={Boolean(errors.codigo)}
                helperText={errors.codigo?.message ?? 'Identificador único.'}
                {...register('codigo')}
              />
              <TextField
                label={obligatorio('Nombre')}
                required
                fullWidth
                autoComplete="off"
                placeholder="Matemática"
                error={Boolean(errors.nombre)}
                helperText={errors.nombre?.message}
                {...register('nombre')}
              />
            </Box>

            <TextField
              label="Descripción"
              fullWidth
              multiline
              minRows={2}
              maxRows={5}
              error={Boolean(errors.descripcion)}
              helperText={errors.descripcion?.message ?? `Opcional. ${descripcion.length}/${LIMITE_TEXTO} caracteres.`}
              {...register('descripcion')}
            />

            <Box sx={{ display: 'grid', gap: 2.5, gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' } }}>
              <TextField
                label="Horas semanales"
                type="number"
                fullWidth
                slotProps={{ htmlInput: { min: 1, step: 1, inputMode: 'numeric' } }}
                error={Boolean(errors.horasSemanales)}
                helperText={errors.horasSemanales?.message ?? 'Opcional. Entero de 1 o más.'}
                {...register('horasSemanales')}
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
                    helperText={errors.estado?.message ?? (materia ? undefined : 'Por defecto, Activa.')}
                  >
                    {ESTADOS_MATERIA.map((valor) => (
                      <MenuItem key={valor} value={valor}>
                        {ETIQUETA_ESTADO_MATERIA[valor]}
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
