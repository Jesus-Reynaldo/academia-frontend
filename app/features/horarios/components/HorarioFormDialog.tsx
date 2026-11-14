import Alert from '@mui/material/Alert'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import MenuItem from '@mui/material/MenuItem'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import useMediaQuery from '@mui/material/useMediaQuery'
import { useTheme } from '@mui/material/styles'
import { useId, useState } from 'react'
import { Link as RouterLink } from 'react-router'
import { ApiError, friendlyMessage } from '../../../shared/api/errors'
import { useNotify } from '../../../shared/notifications/notifications-context'
import { useAsignacionesDelCurso } from '../../asignaciones-docentes'
import { useAulasActivas } from '../../aulas'
import { CursoSelect } from '../../cursos'
import { PeriodoSelect } from '../../periodos-academicos'
import { useGuardarHorario } from '../api/horarios'
import { DIAS, NOMBRE_DIA, type DiaSemana, type Horario } from '../model/types'

interface Props {
  horario: Horario | null
  /** Valores iniciales para un alta (los filtros de la pantalla). */
  inicial?: { periodoAcademicoId?: number; cursoId?: number; aulaId?: number; diaSemana?: DiaSemana }
  onClose: () => void
}

/** Suma minutos a «HH:MM» (sin pasar de 23:59). */
const sumar = (hora: string, minutos: number) => {
  const [h, m] = hora.split(':').map(Number)
  const total = Math.min(h * 60 + m + minutos, 23 * 60 + 59)
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`
}

/** Registrar o editar un bloque del horario. Solo ADMIN. */
export function HorarioFormDialog({ horario, inicial, onClose }: Props) {
  const titleId = useId()
  const theme = useTheme()
  const esMovil = useMediaQuery(theme.breakpoints.down('sm'))
  const notify = useNotify()
  const guardar = useGuardarHorario()
  const aulas = useAulasActivas()

  const [periodoId, setPeriodoId] = useState<number | null>(horario?.asignacion.periodoAcademicoId ?? inicial?.periodoAcademicoId ?? null)
  const [cursoId, setCursoId] = useState<number | null>(horario?.asignacion.cursoId ?? inicial?.cursoId ?? null)
  const [asignacionId, setAsignacionId] = useState<number | ''>(horario?.asignacionId ?? '')
  const [aulaId, setAulaId] = useState<number | ''>(horario?.aulaId ?? inicial?.aulaId ?? '')
  const [dia, setDia] = useState<DiaSemana>(horario?.diaSemana ?? inicial?.diaSemana ?? 'LUNES')
  const [inicio, setInicio] = useState(horario?.horaInicio ?? '08:00')
  const [fin, setFin] = useState(horario?.horaFin ?? '08:45')
  const [error, setError] = useState<string | null>(null)
  const [faltan, setFaltan] = useState<Record<string, string>>({})
  const [hechos, setHechos] = useState(0)

  const asignaciones = useAsignacionesDelCurso(cursoId)
  const opciones = (asignaciones.data ?? [])
    .filter((a) => periodoId === null || a.periodoAcademicoId === periodoId)
    .sort((a, b) => a.materia.nombre.localeCompare(b.materia.nombre, 'es'))
  // Si se edita un bloque cuya asignación ya no está activa, igual debe verse.
  const actual = horario && !opciones.some((a) => a.id === horario.asignacionId) ? horario.asignacion : null

  const enviar = async (otro: boolean) => {
    setError(null)
    const f: Record<string, string> = {}
    if (!periodoId) f.periodo = 'Elige el período'
    if (!cursoId) f.curso = 'Elige el curso'
    if (asignacionId === '') f.asignacion = 'Elige la materia y su docente'
    if (aulaId === '') f.aula = 'Elige el aula'
    if (!inicio || !fin) f.horas = 'Indica la hora de inicio y de fin'
    else if (inicio >= fin) f.horas = 'La hora de inicio debe ser anterior a la de fin'
    if (Object.keys(f).length) return setFaltan(f)
    setFaltan({})
    try {
      const r = await guardar.mutateAsync({
        id: horario?.id,
        input: { asignacionId: asignacionId as number, aulaId: aulaId as number, diaSemana: dia, horaInicio: inicio, horaFin: fin },
      })
      const texto = `${r.asignacion.materia.nombre}, ${NOMBRE_DIA[r.diaSemana]} de ${r.horaInicio} a ${r.horaFin}`
      notify(horario ? `Se guardaron los cambios: ${texto}.` : `Se agregó al horario: ${texto}.`)
      if (otro) {
        // Siguiente bloque: misma clase y aula, a continuación (se cambia lo que haga falta).
        const duracion = (Number(fin.slice(0, 2)) * 60 + Number(fin.slice(3))) - (Number(inicio.slice(0, 2)) * 60 + Number(inicio.slice(3)))
        setInicio(fin)
        setFin(sumar(fin, duracion))
        setAsignacionId('')
        setHechos((n) => n + 1)
      } else onClose()
    } catch (e) {
      setError(e instanceof ApiError && [400, 404, 409].includes(e.status) ? e.messages.join(' ') : friendlyMessage(e))
    }
  }

  return (
    <Dialog open onClose={guardar.isPending ? undefined : onClose} fullWidth maxWidth="sm" fullScreen={esMovil} aria-labelledby={titleId}>
      <DialogTitle id={titleId}>{horario ? 'Editar bloque del horario' : 'Agregar al horario'}</DialogTitle>
      <DialogContent>
        <Stack spacing={2.5} sx={{ pt: 1 }}>
          {error && <Alert severity="error" role="alert">{error}</Alert>}
          {hechos > 0 && <Alert severity="success">{hechos === 1 ? 'Se agregó 1 bloque.' : `Se agregaron ${hechos} bloques.`} Elige la siguiente materia o cierra.</Alert>}
          <div className="grid gap-4 sm:grid-cols-2">
            <PeriodoSelect value={periodoId} onChange={(id) => { setPeriodoId(id); setAsignacionId('') }} excluirFinalizados={!horario} label="Período académico" required error={Boolean(faltan.periodo)} helperText={faltan.periodo} />
            <CursoSelect value={cursoId} onChange={(id) => { setCursoId(id); setAsignacionId('') }} soloActivos label="Curso y paralelo" required error={Boolean(faltan.curso)} helperText={faltan.curso} />
          </div>
          <TextField
            select
            required
            label="Materia y docente"
            value={asignacionId}
            onChange={(e) => setAsignacionId(Number(e.target.value))}
            disabled={!cursoId || !periodoId}
            error={Boolean(faltan.asignacion)}
            helperText={
              faltan.asignacion ??
              (!cursoId || !periodoId
                ? 'Elige primero el período y el curso.'
                : opciones.length === 0 && !asignaciones.isFetching
                  ? 'Este curso no tiene materias asignadas en ese período: asígnalas en «Asignación docente».'
                  : 'Solo las materias asignadas a este curso en ese período.')
            }
          >
            {actual && (
              <MenuItem value={actual.id}>
                {actual.materia.nombre} — {actual.docente.nombres} {actual.docente.apellidos}
              </MenuItem>
            )}
            {opciones.map((a) => (
              <MenuItem key={a.id} value={a.id}>
                {a.materia.nombre} — {a.docente.nombres} {a.docente.apellidos}
              </MenuItem>
            ))}
          </TextField>
          {cursoId && periodoId && opciones.length === 0 && !asignaciones.isFetching && (
            <Button component={RouterLink} to={`/asignaciones-docentes?cursoId=${cursoId}&periodoAcademicoId=${periodoId}`} sx={{ alignSelf: 'flex-start' }}>
              Ir a Asignación docente
            </Button>
          )}
          <TextField
            select
            required
            label="Aula"
            value={aulaId}
            onChange={(e) => setAulaId(Number(e.target.value))}
            error={Boolean(faltan.aula)}
            helperText={faltan.aula ?? (aulas.data?.length === 0 ? 'No hay aulas activas: regístralas en «Aulas».' : undefined)}
          >
            {horario && !aulas.data?.some((a) => a.id === horario.aulaId) && <MenuItem value={horario.aulaId}>{horario.aula.nombre}</MenuItem>}
            {(aulas.data ?? []).map((a) => (
              <MenuItem key={a.id} value={a.id}>
                {a.nombre} ({a.codigo}{a.capacidad ? ` · ${a.capacidad} lugares` : ''})
              </MenuItem>
            ))}
          </TextField>
          <div className="grid gap-4 sm:grid-cols-3">
            <TextField select required label="Día" value={dia} onChange={(e) => setDia(e.target.value as DiaSemana)}>
              {DIAS.map((d) => <MenuItem key={d} value={d}>{NOMBRE_DIA[d]}</MenuItem>)}
            </TextField>
            <TextField label="Desde" type="time" required value={inicio} onChange={(e) => setInicio(e.target.value)} slotProps={{ inputLabel: { shrink: true }, htmlInput: { step: 300 } }} error={Boolean(faltan.horas)} />
            <TextField label="Hasta" type="time" required value={fin} onChange={(e) => setFin(e.target.value)} slotProps={{ inputLabel: { shrink: true }, htmlInput: { step: 300 } }} error={Boolean(faltan.horas)} helperText={faltan.horas} />
          </div>
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2, flexWrap: 'wrap', gap: 1 }}>
        <Button onClick={onClose} disabled={guardar.isPending} sx={{ minHeight: 44 }}>{hechos ? 'Cerrar' : 'Cancelar'}</Button>
        {!horario && (
          <Button variant="outlined" disabled={guardar.isPending} onClick={() => void enviar(true)} sx={{ minHeight: 44 }}>
            Guardar y agregar otro
          </Button>
        )}
        <Button variant="contained" disabled={guardar.isPending} onClick={() => void enviar(false)} startIcon={guardar.isPending ? <CircularProgress size={16} color="inherit" /> : undefined} sx={{ minHeight: 44 }}>
          Guardar
        </Button>
      </DialogActions>
    </Dialog>
  )
}
