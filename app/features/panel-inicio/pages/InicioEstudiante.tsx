import ChevronRight from '@mui/icons-material/ChevronRight'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Grid from '@mui/material/Grid'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import ListItemButton from '@mui/material/ListItemButton'
import ListItemText from '@mui/material/ListItemText'
import Skeleton from '@mui/material/Skeleton'
import Typography from '@mui/material/Typography'
import { CartesianGrid, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Link as RouterLink } from 'react-router'
import { formatFecha, formatNota } from '../../../shared/lib/format'
import { chartColors, colors } from '../../../shared/theme/tokens'
import { ErrorState } from '../../../shared/ui/ErrorState'
import { GradeBadge } from '../../../shared/ui/GradeBadge'
import { KpiCard } from '../../../shared/ui/KpiCard'
import { PageHeader } from '../../../shared/ui/PageHeader'
import { SectionCard } from '../../../shared/ui/SectionCard'
import { useUsuario } from '../../autenticacion'
import { useEstudiante } from '../../estudiantes'
import { resumenPeriodo, useAvanceEstudiante } from '../../historial-academico'
import { useCalificacionesEstudiante, useResumenEstudiante } from '../api/useDashboard'

const TIPO: Record<string, string> = {
  PARCIAL: 'Parcial',
  FINAL: 'Examen final',
  PRACTICA: 'Práctica',
  TAREA: 'Tarea',
  PROYECTO: 'Proyecto',
  PARTICIPACION: 'Participación',
  OTRA: 'Otra',
}

/** Inicio del estudiante: responde «¿cómo voy?» con su gestión actual, materias en riesgo y últimas notas. */
export function InicioEstudiante() {
  const usuario = useUsuario()
  const id = usuario.estudianteId
  const estudiante = useEstudiante(id)
  const avance = useAvanceEstudiante(id)
  const resumenGeneral = useResumenEstudiante(id)
  const ultimas = useCalificacionesEstudiante(id)

  const nombre = estudiante.data?.nombres.split(' ')[0] ?? usuario.nombre?.split(' ')[0] ?? ''
  const periodo = avance.actual
  const resumen = periodo ? resumenPeriodo(periodo) : null
  const promedioGestion = periodo && periodo.cursos.length === 1 ? periodo.cursos[0].promedio : null
  const estado = estudiante.data?.estado

  // Mensaje principal según la situación del estudiante.
  let situacion: { severidad: 'success' | 'warning' | 'info'; texto: string; accion?: { texto: string; a: string } } | null = null
  if (estado === 'EGRESADO') {
    situacion = { severidad: 'info', texto: `Egresaste${periodo ? ` en la ${periodo.periodo}` : ''}. Tu libreta sigue disponible.`, accion: { texto: 'Ver mi libreta', a: '/mi/historial' } }
  } else if (estado === 'RETIRADO') {
    situacion = { severidad: 'warning', texto: 'Tu inscripción figura como retirada. Puedes consultar tu historial; para volver a inscribirte, acude a secretaría.', accion: { texto: 'Ver mi historial', a: '/mi/historial' } }
  } else if (estado === 'INACTIVO') {
    situacion = { severidad: 'warning', texto: 'Tu registro está inactivo. Si crees que es un error, acude a secretaría.' }
  } else if (!avance.isPending && !periodo) {
    situacion = { severidad: 'info', texto: 'Todavía no estás inscrito en un curso. Cuando te inscriban, aquí verás cómo vas.' }
  } else if (!avance.isPending && periodo && !avance.actualEnCurso) {
    situacion = { severidad: 'info', texto: `No tienes una inscripción en la gestión en curso. Te mostramos tu última gestión: ${periodo.periodo}.` }
  } else if (resumen && resumen.materias > 0) {
    situacion = resumen.debajo.length
      ? { severidad: 'warning', texto: `Vas aprobando ${resumen.aprobadas} de ${resumen.materias} materias. ${resumen.debajo.length === 1 ? 'Una está' : `${resumen.debajo.length} están`} por debajo de 51.` }
      : { severidad: 'success', texto: `¡Vas aprobando tus ${resumen.materias} materias!` }
  } else if (periodo) {
    situacion = { severidad: 'info', texto: 'Aún no tienes notas en esta gestión.' }
  }

  if (avance.isError) return <ErrorState error={avance.error} onRetry={avance.refetch} />

  const subtitulo = periodo
    ? `${periodo.cursos.map((c) => c.curso).join(' · ')} · ${periodo.periodo}${avance.actualEnCurso ? ' (en curso)' : ''}`
    : undefined

  return (
    <>
      <PageHeader title={nombre ? `Hola, ${nombre}` : 'Inicio'} subtitle={avance.isPending ? 'Cargando…' : subtitulo} />

      {avance.isPending ? (
        <Skeleton variant="rounded" height={64} sx={{ mb: 2 }} />
      ) : (
        situacion && (
          <Alert
            severity={situacion.severidad}
            sx={{ mb: 2 }}
            action={
              situacion.accion && (
                <Button component={RouterLink} to={situacion.accion.a} color="inherit" sx={{ minHeight: 44 }}>
                  {situacion.accion.texto}
                </Button>
              )
            }
          >
            {situacion.texto}
          </Alert>
        )
      )}

      {resumen && resumen.materias > 0 && (
        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid size={{ xs: 12, sm: 4 }}>
            <KpiCard label={`Promedio ${periodo?.periodo ?? ''}`} value={<GradeBadge nota={promedioGestion} />} />
          </Grid>
          <Grid size={{ xs: 6, sm: 4 }}>
            <KpiCard label="Materias aprobando" value={`${resumen.aprobadas} / ${resumen.materias}`} to="/mi/materias" />
          </Grid>
          <Grid size={{ xs: 6, sm: 4 }}>
            <KpiCard label="Por debajo de 51" value={resumen.debajo.length} to="/mi/materias" />
          </Grid>
        </Grid>
      )}

      <Grid container spacing={2}>
        {resumen && resumen.debajo.length > 0 && periodo && (
          <Grid size={{ xs: 12, md: 6 }}>
            <SectionCard title="Materias para reforzar">
              <List disablePadding>
                {periodo.cursos
                  .flatMap((c) => c.materias)
                  .filter((m) => resumen.debajo.some((d) => d.nombre === m.materia))
                  .map((m) => (
                    <ListItem key={m.materiaId} disablePadding>
                      <ListItemButton
                        component={RouterLink}
                        to={`/mi/materias/${m.materiaId}?gestion=${periodo.periodoId}`}
                        sx={{ borderRadius: 2, minHeight: 48 }}
                      >
                        <ListItemText primary={m.materia} secondary="Ver mis evaluaciones" />
                        <GradeBadge nota={m.promedio} />
                        <ChevronRight aria-hidden sx={{ ml: 1, color: 'text.secondary' }} />
                      </ListItemButton>
                    </ListItem>
                  ))}
              </List>
            </SectionCard>
          </Grid>
        )}

        <Grid size={{ xs: 12, md: resumen && resumen.debajo.length > 0 ? 6 : 12 }}>
          <SectionCard
            title="Últimas notas registradas"
            actions={
              <Button component={RouterLink} to="/mi/materias" sx={{ minHeight: 44 }}>
                Ver mis materias
              </Button>
            }
          >
            {ultimas.isPending ? (
              <Skeleton variant="rounded" height={160} />
            ) : ultimas.isError ? (
              <ErrorState error={ultimas.error} onRetry={() => void ultimas.refetch()} />
            ) : (ultimas.data?.data.length ?? 0) === 0 ? (
              <Typography variant="body2" color="text.secondary">
                Aún no tienes notas registradas.
              </Typography>
            ) : (
              <Box component="ul" sx={{ listStyle: 'none', m: 0, p: 0 }}>
                {ultimas.data?.data.slice(0, 5).map((c) => (
                  <Box
                    component="li"
                    key={c.id}
                    sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1, py: 1, borderBottom: 1, borderColor: 'divider', '&:last-child': { borderBottom: 0 } }}
                  >
                    <Box sx={{ minWidth: 0 }}>
                      <Typography sx={{ fontWeight: 600, overflowWrap: 'anywhere' }}>{c.materia?.nombre ?? '—'}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {TIPO[c.tipo] ?? c.tipo} · {formatFecha(c.fecha)}
                      </Typography>
                    </Box>
                    <GradeBadge nota={c.nota} />
                  </Box>
                ))}
              </Box>
            )}
          </SectionCard>
        </Grid>

        {(resumenGeneral.data?.porPeriodo.length ?? 0) > 0 && (
          <Grid size={12}>
            <SectionCard title="Mi evolución por gestión">
              {/* El gráfico es decorativo para lectores de pantalla: los mismos datos están en la lista de abajo. */}
              <Box aria-hidden sx={{ display: { xs: 'none', sm: 'block' }, width: '100%', height: 240 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={resumenGeneral.data?.porPeriodo} margin={{ top: 12, right: 24, left: 0, bottom: 8 }} accessibilityLayer={false}>
                    <CartesianGrid stroke={colors.divider} strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="periodo" tick={{ fill: colors.text.secondary, fontSize: 12 }} />
                    <YAxis domain={[0, 100]} tick={{ fill: colors.text.secondary, fontSize: 12 }} />
                    <ReferenceLine y={51} stroke={colors.error.main} strokeDasharray="4 4" label={{ value: 'Aprobación (51)', fill: colors.error.main, fontSize: 12, position: 'insideBottomRight' }} />
                    <Tooltip formatter={(v) => [formatNota(v == null ? null : Number(v)), 'Promedio']} />
                    <Line type="monotone" dataKey="promedio" stroke={chartColors[0]} strokeWidth={3} dot={{ r: 5 }} />
                  </LineChart>
                </ResponsiveContainer>
              </Box>
              <Box component="ul" sx={{ listStyle: 'none', m: 0, p: 0, display: 'flex', flexWrap: 'wrap', gap: 2, mt: 1 }}>
                {resumenGeneral.data?.porPeriodo.map((p) => (
                  <Box component="li" key={p.periodoId} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="body2">{p.periodo}:</Typography>
                    <GradeBadge nota={p.promedio} />
                  </Box>
                ))}
              </Box>
            </SectionCard>
          </Grid>
        )}
      </Grid>
    </>
  )
}
