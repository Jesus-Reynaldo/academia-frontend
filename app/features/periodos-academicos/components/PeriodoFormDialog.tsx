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
import { useActualizarPeriodo, useCrearPeriodo, usePeriodosReferencia } from '../api/usePeriodos'
import { periodoSchema, toInputDate, toIsoDate, type PeriodoFormValues } from '../model/schema'
import { ESTADOS_PERIODO, ETIQUETA_ESTADO_PERIODO, type PeriodoAcademico } from '../model/types'

interface PeriodoFormDialogProps {
  /** Con un período: edición. Sin él: alta. */
  periodo: PeriodoAcademico | null
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

/**
 * Formulario de alta y edición en diálogo (docs/UI-UX-PLAN.md, 8.8).
 * Se monta solo mientras está abierto: cada apertura empieza con los valores correctos.
 */
export function PeriodoFormDialog({ periodo, onClose }: PeriodoFormDialogProps) {
  const titleId = useId()
  const notify = useNotify()
  const [serverErrors, setServerErrors] = useState<string[]>([])
  const crear = useCrearPeriodo()
  const actualizar = useActualizarPeriodo()
  const referencia = usePeriodosReferencia()

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<PeriodoFormValues>({
    resolver: zodResolver(periodoSchema),
    mode: 'onBlur', // valida al salir del campo y al enviar, no mientras se escribe por primera vez
    defaultValues: {
      nombre: periodo?.nombre ?? '',
      fechaInicio: periodo ? toInputDate(periodo.fechaInicio) : '',
      fechaFin: periodo ? toInputDate(periodo.fechaFin) : '',
      estado: periodo?.estado ?? 'PLANIFICADO',
    },
  })

  const estado = useWatch({ control, name: 'estado' })
  const otroActivo =
    estado === 'ACTIVO' ? referencia.data?.find((p) => p.estado === 'ACTIVO' && p.id !== periodo?.id) : undefined

  const guardando = isSubmitting || crear.isPending || actualizar.isPending

  const onSubmit = handleSubmit(async (values) => {
    setServerErrors([])
    const input = {
      nombre: values.nombre.trim(),
      fechaInicio: toIsoDate(values.fechaInicio),
      fechaFin: toIsoDate(values.fechaFin),
      estado: values.estado,
    }
    try {
      if (periodo) {
        await actualizar.mutateAsync({ id: periodo.id, input })
        notify(`Se guardaron los cambios de «${input.nombre}».`)
      } else {
        await crear.mutateAsync(input)
        notify(`Se creó el período «${input.nombre}».`)
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
      {/* noValidate: la validación la hace Zod (mensajes en español), no el navegador. `display: contents` conserva el layout del diálogo. */}
      <Box component="form" onSubmit={onSubmit} noValidate sx={{ display: 'contents' }}>
        <DialogTitle id={titleId}>{periodo ? 'Editar período' : 'Nuevo período'}</DialogTitle>
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
              placeholder="Gestión 2026"
              error={Boolean(errors.nombre)}
              helperText={errors.nombre?.message ?? 'Por ejemplo: Gestión 2026 o 2026-I.'}
              {...register('nombre')}
            />

            <Box
              sx={{
                display: 'grid',
                gap: 2.5,
                gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
              }}
            >
              <TextField
                label={obligatorio('Fecha de inicio')}
                type="date"
                required
                fullWidth
                slotProps={{ inputLabel: { shrink: true } }}
                error={Boolean(errors.fechaInicio)}
                helperText={errors.fechaInicio?.message}
                {...register('fechaInicio')}
              />
              <TextField
                label={obligatorio('Fecha de fin')}
                type="date"
                required
                fullWidth
                slotProps={{ inputLabel: { shrink: true } }}
                error={Boolean(errors.fechaFin)}
                helperText={errors.fechaFin?.message}
                {...register('fechaFin')}
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
                  helperText={
                    errors.estado?.message ?? (periodo ? undefined : 'Si no cambias nada, se crea como Planificado.')
                  }
                >
                  {ESTADOS_PERIODO.map((valor) => (
                    <MenuItem key={valor} value={valor}>
                      {ETIQUETA_ESTADO_PERIODO[valor]}
                    </MenuItem>
                  ))}
                </TextField>
              )}
            />

            {otroActivo && (
              <Alert severity="info">
                Ya hay un período activo: «{otroActivo.nombre}». El panel de inicio usa uno solo: el activo de inicio
                más reciente.
              </Alert>
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
