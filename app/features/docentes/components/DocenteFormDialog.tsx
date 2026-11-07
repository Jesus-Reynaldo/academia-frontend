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
import { useActualizarDocente, useCrearDocente } from '../api/useDocentes'
import { docenteSchema, type DocenteFormValues } from '../model/schema'
import { ESTADOS_DOCENTE, ETIQUETA_ESTADO_DOCENTE, type Docente, type DocenteInput } from '../model/types'

interface DocenteFormDialogProps {
  /** Con un docente: edición. Sin él: alta. */
  docente: Docente | null
  onClose: () => void
}

const MENSAJE_CODIGO_DUPLICADO = 'Ya existe un docente con este código'

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

/**
 * Formulario de alta y edición en diálogo (docs/UI-UX-PLAN.md, 8.8).
 * Se monta solo mientras está abierto: cada apertura empieza con los valores correctos.
 */
export function DocenteFormDialog({ docente, onClose }: DocenteFormDialogProps) {
  const titleId = useId()
  const notify = useNotify()
  const [serverErrors, setServerErrors] = useState<string[]>([])
  const crear = useCrearDocente()
  const actualizar = useActualizarDocente()

  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting, isDirty, dirtyFields },
  } = useForm<DocenteFormValues>({
    resolver: zodResolver(docenteSchema),
    mode: 'onBlur', // valida al salir del campo y al enviar, no mientras se escribe por primera vez
    defaultValues: {
      codigo: docente?.codigo ?? '',
      nombres: docente?.nombres ?? '',
      apellidos: docente?.apellidos ?? '',
      email: docente?.email ?? '',
      telefono: docente?.telefono ?? '',
      estado: docente?.estado ?? 'ACTIVO',
    },
  })

  const guardando = isSubmitting || crear.isPending || actualizar.isPending

  const onSubmit = handleSubmit(async (values) => {
    setServerErrors([])
    // Campos opcionales vacíos: al crear no se envían; al editar se envía null para borrar el valor guardado.
    const vacio = docente ? null : undefined
    const input: DocenteInput = {
      codigo: values.codigo.trim(),
      nombres: values.nombres.trim(),
      apellidos: values.apellidos.trim(),
      email: values.email.trim() || vacio,
      telefono: values.telefono.trim() || vacio,
      estado: values.estado,
    }
    const nombre = `${input.nombres} ${input.apellidos}`
    try {
      if (docente) {
        await actualizar.mutateAsync({ id: docente.id, input })
        notify(`Se guardaron los cambios de «${nombre}».`)
      } else {
        await crear.mutateAsync(input)
        notify(`Se creó el docente «${nombre}».`)
      }
      onClose()
    } catch (error) {
      if (error instanceof ApiError && error.status === 409) {
        // Código duplicado: el error se muestra junto al campo, no arriba.
        setError('codigo', { message: MENSAJE_CODIGO_DUPLICADO }, { shouldFocus: true })
      } else if (error instanceof ApiError && error.status === 400) {
        setServerErrors(error.messages)
      } else if (error instanceof ApiError && error.status >= 500 && (!docente || dirtyFields.codigo)) {
        // El backend responde 500 (no 409) cuando el código ya existe: es la causa más probable.
        setError('codigo', { message: `${MENSAJE_CODIGO_DUPLICADO} (o el servidor tuvo un problema)` }, { shouldFocus: true })
      } else {
        setServerErrors([friendlyMessage(error)])
      }
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
        <DialogTitle id={titleId}>{docente ? 'Editar docente' : 'Nuevo docente'}</DialogTitle>
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
              label={obligatorio('Código')}
              required
              fullWidth
              autoFocus
              autoComplete="off"
              placeholder="DOC-004"
              error={Boolean(errors.codigo)}
              helperText={errors.codigo?.message ?? 'Identificador único del docente.'}
              {...register('codigo')}
            />

            <Box sx={{ display: 'grid', gap: 2.5, gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' } }}>
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

            <Box sx={{ display: 'grid', gap: 2.5, gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' } }}>
              <TextField
                label="Email"
                type="email"
                fullWidth
                autoComplete="off"
                placeholder="nombre@colegio.edu"
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
                  helperText={errors.estado?.message ?? (docente ? undefined : 'Si no cambias nada, se crea como Activo.')}
                >
                  {ESTADOS_DOCENTE.map((valor) => (
                    <MenuItem key={valor} value={valor}>
                      {ETIQUETA_ESTADO_DOCENTE[valor]}
                    </MenuItem>
                  ))}
                </TextField>
              )}
            />
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
