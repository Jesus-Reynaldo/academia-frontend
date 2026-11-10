import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { zodResolver } from '@hookform/resolvers/zod'
import { useId, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { ApiError, friendlyMessage } from '../../../shared/api/errors'
import { useNotify } from '../../../shared/notifications/notifications-context'
import { CursoSelect, OcupacionCurso, type Curso } from '../../cursos'
import { EstudianteSelect } from '../../estudiantes'
import { PeriodoSelect } from '../../periodos-academicos'
import { useCrearInscripcion } from '../api/useInscripciones'
import { inscripcionSchema, type InscripcionFormInput, type InscripcionFormValues } from '../model/schema'

/** Errores de negocio tal cual los devuelve el servidor (inactivo, período finalizado, duplicada, curso lleno). */
function mensajesDeError(error: unknown): string[] {
  if (error instanceof ApiError && (error.status === 400 || error.status === 404 || error.status === 409)) {
    return error.messages
  }
  return [friendlyMessage(error)]
}

/** Nueva inscripción. Se monta solo mientras está abierto: cada apertura empieza vacía. */
export function InscripcionFormDialog({ onClose }: { onClose: () => void }) {
  const titleId = useId()
  const notify = useNotify()
  const [serverErrors, setServerErrors] = useState<string[]>([])
  const [curso, setCurso] = useState<Curso | null>(null)
  const crear = useCrearInscripcion()

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<InscripcionFormInput, unknown, InscripcionFormValues>({
    resolver: zodResolver(inscripcionSchema),
    defaultValues: { estudianteId: null, cursoId: null, periodoAcademicoId: null, fechaInscripcion: '' },
  })

  const guardando = isSubmitting || crear.isPending

  const onSubmit = handleSubmit(async (values) => {
    setServerErrors([])
    try {
      await crear.mutateAsync({
        estudianteId: values.estudianteId,
        cursoId: values.cursoId,
        periodoAcademicoId: values.periodoAcademicoId,
        fechaInscripcion: values.fechaInscripcion ? `${values.fechaInscripcion}T00:00:00.000Z` : undefined,
      })
      notify('Se registró la inscripción.')
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
        <DialogTitle id={titleId}>Nueva inscripción</DialogTitle>
        <DialogContent>
          <Stack spacing={2.5} sx={{ pt: 1 }}>
            {serverErrors.length > 0 && (
              <Alert severity="error" role="alert">
                {serverErrors.join(' ')}
              </Alert>
            )}

            <Controller
              name="estudianteId"
              control={control}
              render={({ field }) => (
                <EstudianteSelect
                  soloActivos
                  required
                  value={field.value}
                  onChange={(id) => field.onChange(id)}
                  error={Boolean(errors.estudianteId)}
                  helperText={errors.estudianteId?.message ?? 'Solo estudiantes activos.'}
                />
              )}
            />

            <Controller
              name="cursoId"
              control={control}
              render={({ field }) => (
                <CursoSelect
                  soloActivos
                  required
                  value={field.value}
                  onChange={(id, elegido) => {
                    field.onChange(id)
                    setCurso(elegido)
                  }}
                  error={Boolean(errors.cursoId)}
                  helperText={errors.cursoId?.message ?? 'Solo cursos activos.'}
                />
              )}
            />

            {curso && (
              <Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                  Ocupación en la gestión activa
                </Typography>
                <OcupacionCurso inscritos={curso.inscritosActivos} capacidad={curso.capacidad} />
              </Box>
            )}

            <Controller
              name="periodoAcademicoId"
              control={control}
              render={({ field }) => (
                <PeriodoSelect
                  excluirFinalizados
                  required
                  value={field.value}
                  onChange={(id) => field.onChange(id)}
                  error={Boolean(errors.periodoAcademicoId)}
                  helperText={errors.periodoAcademicoId?.message ?? 'Los períodos finalizados no se ofrecen.'}
                />
              )}
            />

            <TextField
              label="Fecha de inscripción"
              type="date"
              fullWidth
              slotProps={{ inputLabel: { shrink: true } }}
              error={Boolean(errors.fechaInscripcion)}
              helperText={errors.fechaInscripcion?.message ?? 'Opcional. Vacía significa hoy.'}
              {...register('fechaInscripcion')}
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
