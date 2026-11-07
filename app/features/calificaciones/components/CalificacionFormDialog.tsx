import { zodResolver } from '@hookform/resolvers/zod'
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
import Typography from '@mui/material/Typography'
import { useTheme } from '@mui/material/styles'
import useMediaQuery from '@mui/material/useMediaQuery'
import { useId, useMemo, useState, type ReactNode } from 'react'
import { Controller, useForm, useWatch } from 'react-hook-form'
import { ApiError, friendlyMessage } from '../../../shared/api/errors'
import { useNotify } from '../../../shared/notifications/notifications-context'
import { colors } from '../../../shared/theme/tokens'
import { GradeBadge } from '../../../shared/ui/GradeBadge'
import { visuallyHidden } from '../../../shared/ui/visuallyHidden'
import { useUsuario } from '../../autenticacion'
import { usePeriodosReferencia } from '../../periodos-academicos'
import {
  useActualizarCalificacion,
  useCrearCalificacion,
  useCursosReferencia,
  useDocentesReferencia,
  useInscripcionesReferencia,
  useMateriasReferencia,
} from '../api/useCalificaciones'
import { nombreCurso, nombreDocente, nombreEstudiante } from '../model/etiquetas'
import {
  crearCalificacionSchema,
  hoyInput,
  leerNota,
  toInputDate,
  toIsoDate,
  type CalificacionFormValues,
} from '../model/schema'
import {
  ETIQUETA_TIPO,
  NOTA_MAX,
  NOTA_MIN,
  TEXTO_SIN_ELIMINAR,
  TIPOS_EVALUACION,
  type Calificacion,
} from '../model/types'
import { InscripcionAutocomplete } from './InscripcionAutocomplete'

interface CalificacionFormDialogProps {
  /** Con una calificación: edición. Sin ella: alta. */
  calificacion: Calificacion | null
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

/**
 * Traduce el error de la API a mensajes legibles.
 * - 400: todos los mensajes del servidor (pueden ser varios).
 * - 403: mensaje claro, no el genérico (RF-CAL-04).
 */
function mensajesDeError(error: unknown, esEdicion: boolean): string[] {
  if (error instanceof ApiError) {
    if (error.status === 400 || error.status === 404 || error.status === 409) return error.messages
    if (error.status === 403) {
      return [
        esEdicion
          ? 'No puedes editar esta calificación: fue registrada por otro docente. Solo puedes modificar las tuyas.'
          : 'No tienes permiso para registrar calificaciones a nombre de otro docente.',
      ]
    }
  }
  return [friendlyMessage(error)]
}

/**
 * Formulario de registro y edición en diálogo (docs/UI-UX-PLAN.md, 8.10).
 * Se monta solo mientras está abierto: cada apertura empieza con los valores correctos.
 */
export function CalificacionFormDialog({ calificacion, onClose }: CalificacionFormDialogProps) {
  const esEdicion = calificacion !== null
  const titleId = useId()
  const theme = useTheme()
  const esMovil = useMediaQuery(theme.breakpoints.down('sm'))
  const notify = useNotify()
  const usuario = useUsuario()
  const esAdmin = usuario.rol === 'ADMIN'

  const [errores, setErrores] = useState<string[]>([])

  // PASO 1: datos de apoyo para los selectores.
  const inscripciones = useInscripcionesReferencia(!esEdicion)
  const materias = useMateriasReferencia()
  const cursos = useCursosReferencia()
  const periodos = usePeriodosReferencia()
  const docentes = useDocentesReferencia(esAdmin)

  const crear = useCrearCalificacion()
  const actualizar = useActualizarCalificacion()

  // PASO 2: formulario con validación Zod (el esquema cambia entre alta y edición).
  const schema = useMemo(() => crearCalificacionSchema(esEdicion), [esEdicion])
  const {
    register,
    control,
    handleSubmit,
    reset,
    setFocus,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<CalificacionFormValues>({
    resolver: zodResolver(schema),
    mode: 'onBlur',
    defaultValues: {
      cursoId: calificacion?.inscripcion.cursoId ?? null,
      inscripcionId: calificacion?.inscripcionId ?? null,
      materiaId: calificacion?.materiaId ?? null,
      tipo: calificacion?.tipo ?? 'PARCIAL',
      nota: calificacion ? String(calificacion.nota) : '',
      fecha: calificacion ? toInputDate(calificacion.fecha) : hoyInput(),
      docenteId: calificacion?.docenteId ?? null,
      observacion: calificacion?.observacion ?? '',
    },
  })

  const cursoElegido = useWatch({ control, name: 'cursoId' })
  const notaTexto = useWatch({ control, name: 'nota' })
  const notaNumero = leerNota(notaTexto)
  const notaValida = notaNumero !== null && notaNumero >= NOTA_MIN && notaNumero <= NOTA_MAX

  const guardando = isSubmitting || crear.isPending || actualizar.isPending

  // PASO 3: la lista de inscripciones se acota con el curso elegido; las materias, solo las activas.
  const opcionesInscripcion = (inscripciones.data?.data ?? []).filter(
    (inscripcion) => cursoElegido === null || inscripcion.cursoId === cursoElegido,
  )
  const hayMasInscripciones = (inscripciones.data?.meta.total ?? 0) > 100
  const materiasActivas = (materias.data ?? []).filter((materia) => materia.estado !== 'INACTIVA')

  // PASO 4: guardar. `registrarOtra` = true conserva curso, materia, tipo y fecha para la carga rápida.
  const guardar = async (values: CalificacionFormValues, registrarOtra: boolean) => {
    setErrores([])
    const nota = leerNota(values.nota)!
    const observacion = values.observacion.trim()
    // Un DOCENTE nunca envía docenteId: la API lo registra a su nombre.
    const docenteId = esAdmin && values.docenteId !== null ? values.docenteId : undefined

    try {
      if (calificacion) {
        await actualizar.mutateAsync({
          id: calificacion.id,
          input: {
            nota,
            tipo: values.tipo,
            fecha: toIsoDate(values.fecha),
            observacion,
            docenteId,
          },
        })
        notify('Se guardaron los cambios de la calificación.')
        onClose()
        return
      }

      await crear.mutateAsync({
        inscripcionId: values.inscripcionId!,
        materiaId: values.materiaId!,
        nota,
        tipo: values.tipo,
        fecha: toIsoDate(values.fecha),
        observacion: observacion || undefined,
        docenteId,
      })
      notify('Se registró la calificación.')

      if (registrarOtra) {
        // Se limpian solo los campos que cambian en cada registro y el foco vuelve a la inscripción.
        reset({ ...values, inscripcionId: null, nota: '', observacion: '' })
        setTimeout(() => setFocus('inscripcionId'), 0)
      } else {
        onClose()
      }
    } catch (error) {
      setErrores(mensajesDeError(error, esEdicion))
    }
  }

  const enviar = handleSubmit((values) => guardar(values, false))
  const enviarYOtra = handleSubmit((values) => guardar(values, true))

  // Con cambios sin guardar, un clic accidental fuera del diálogo no debe descartarlos.
  const handleClose = (_event: object, reason?: string) => {
    if (guardando || (reason === 'backdropClick' && isDirty)) return
    onClose()
  }

  // Textos de solo lectura para el modo edición.
  const nombrePeriodo = (id: number) => periodos.data?.find((periodo) => periodo.id === id)?.nombre ?? `Período ${id}`

  return (
    <Dialog open onClose={handleClose} fullWidth maxWidth="sm" fullScreen={esMovil} aria-labelledby={titleId}>
      {/* noValidate: la validación la hace Zod (mensajes en español). `display: contents` conserva el layout del diálogo. */}
      <Box component="form" onSubmit={enviar} noValidate sx={{ display: 'contents' }}>
        <DialogTitle id={titleId}>{esEdicion ? 'Editar calificación' : 'Registrar calificación'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2.5} sx={{ pt: 1 }}>
            {errores.length > 0 && (
              <Alert severity="error" role="alert">
                {errores.length === 1 ? (
                  errores[0]
                ) : (
                  <Box component="ul" sx={{ m: 0, pl: 2.5 }}>
                    {errores.map((mensaje) => (
                      <li key={mensaje}>{mensaje}</li>
                    ))}
                  </Box>
                )}
              </Alert>
            )}

            {esEdicion ? (
              // Edición: la API no permite cambiar la inscripción ni la materia (solo PATCH de nota, tipo, fecha…).
              <Box
                sx={{ p: 1.5, borderRadius: 1, bgcolor: colors.neutral.tint, border: `1px solid ${colors.divider}` }}
              >
                <Typography variant="body2" color="text.secondary">
                  Estudiante · Curso · Período
                </Typography>
                <Typography sx={{ fontWeight: 600 }}>
                  {nombreEstudiante(calificacion.inscripcion.estudiante)} ·{' '}
                  {nombreCurso(calificacion.inscripcion.curso)} ·{' '}
                  {nombrePeriodo(calificacion.inscripcion.periodoAcademicoId)}
                </Typography>
                <Typography variant="body2" sx={{ mt: 0.5 }}>
                  Materia: {calificacion.materia.nombre}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  La inscripción y la materia no se pueden cambiar. Si te equivocaste, registra una nueva calificación.
                </Typography>
              </Box>
            ) : (
              <>
                <Controller
                  name="cursoId"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      select
                      label="Curso"
                      fullWidth
                      value={field.value ?? ''}
                      onChange={(event) => {
                        field.onChange(event.target.value === '' ? null : Number(event.target.value))
                      }}
                      slotProps={{ select: { displayEmpty: true }, inputLabel: { shrink: true } }}
                      helperText="Opcional: reduce la lista de inscripciones y se conserva al registrar otra."
                    >
                      <MenuItem value="">Todos los cursos</MenuItem>
                      {cursos.data?.map((curso) => (
                        <MenuItem key={curso.id} value={curso.id}>
                          {nombreCurso(curso)}
                        </MenuItem>
                      ))}
                    </TextField>
                  )}
                />

                <Controller
                  name="inscripcionId"
                  control={control}
                  render={({ field }) => (
                    <InscripcionAutocomplete
                      opciones={opcionesInscripcion}
                      value={field.value}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      inputRef={field.ref}
                      cargando={inscripciones.isPending}
                      error={errors.inscripcionId?.message}
                      ayuda={
                        hayMasInscripciones
                          ? 'Se muestran las 100 inscripciones activas más recientes. Elige un curso para acotar.'
                          : undefined
                      }
                    />
                  )}
                />

                <Controller
                  name="materiaId"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      select
                      required
                      label={obligatorio('Materia')}
                      fullWidth
                      value={field.value ?? ''}
                      onChange={(event) => field.onChange(Number(event.target.value))}
                      onBlur={field.onBlur}
                      inputRef={field.ref}
                      error={Boolean(errors.materiaId)}
                      helperText={errors.materiaId?.message}
                    >
                      {materiasActivas.map((materia) => (
                        <MenuItem key={materia.id} value={materia.id}>
                          {materia.nombre}
                        </MenuItem>
                      ))}
                    </TextField>
                  )}
                />
              </>
            )}

            <Controller
              name="tipo"
              control={control}
              render={({ field }) => (
                <TextField
                  select
                  required
                  label={obligatorio('Tipo de evaluación')}
                  fullWidth
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  inputRef={field.ref}
                  error={Boolean(errors.tipo)}
                  helperText={errors.tipo?.message}
                >
                  {TIPOS_EVALUACION.map((tipo) => (
                    <MenuItem key={tipo} value={tipo}>
                      {ETIQUETA_TIPO[tipo]}
                    </MenuItem>
                  ))}
                </TextField>
              )}
            />

            <Box
              sx={{
                display: 'grid',
                gap: 2.5,
                gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
                alignItems: 'start',
              }}
            >
              <TextField
                label={obligatorio('Nota (0–100)')}
                type="number"
                required
                fullWidth
                autoComplete="off"
                slotProps={{
                  htmlInput: { min: NOTA_MIN, max: NOTA_MAX, step: 0.5, inputMode: 'decimal' },
                }}
                error={Boolean(errors.nota)}
                helperText={errors.nota?.message ?? 'Puedes usar medios puntos (por ejemplo 72,5).'}
                {...register('nota')}
              />
              <TextField
                label={obligatorio('Fecha')}
                type="date"
                required
                fullWidth
                slotProps={{ inputLabel: { shrink: true } }}
                error={Boolean(errors.fecha)}
                helperText={errors.fecha?.message}
                {...register('fecha')}
              />
            </Box>

            {/* Vista previa: así se verá la nota en el listado (color + icono + etiqueta). */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }} role="status" aria-live="polite">
              <Typography variant="body2" color="text.secondary">
                Vista previa:
              </Typography>
              {notaValida ? <GradeBadge nota={notaNumero} /> : <GradeBadge nota={null} />}
            </Box>

            {esAdmin ? (
              <Controller
                name="docenteId"
                control={control}
                render={({ field }) => (
                  <TextField
                    select
                    label="Docente"
                    fullWidth
                    value={field.value ?? ''}
                    onChange={(event) => field.onChange(event.target.value === '' ? null : Number(event.target.value))}
                    slotProps={{ select: { displayEmpty: true }, inputLabel: { shrink: true } }}
                    helperText="Opcional."
                  >
                    <MenuItem value="">Sin docente</MenuItem>
                    {docentes.data?.map((docente) => (
                      <MenuItem key={docente.id} value={docente.id}>
                        {nombreDocente(docente)}
                      </MenuItem>
                    ))}
                  </TextField>
                )}
              />
            ) : (
              // DOCENTE: el docente queda registrado a su nombre y no se puede cambiar.
              <Alert severity="info" icon={false}>
                Docente: se registra a tu nombre.
              </Alert>
            )}

            <TextField
              label="Observación"
              fullWidth
              multiline
              minRows={2}
              error={Boolean(errors.observacion)}
              helperText={errors.observacion?.message ?? 'Opcional.'}
              {...register('observacion')}
            />

            <Typography variant="caption" color="text.secondary">
              {TEXTO_SIN_ELIMINAR}
            </Typography>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, flexWrap: 'wrap', gap: 1 }}>
          <Button onClick={() => handleClose({})} disabled={guardando} sx={{ minHeight: 44 }}>
            Cancelar
          </Button>
          {!esEdicion && (
            <Button variant="outlined" onClick={() => void enviarYOtra()} disabled={guardando} sx={{ minHeight: 44 }}>
              Guardar y registrar otra
            </Button>
          )}
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
