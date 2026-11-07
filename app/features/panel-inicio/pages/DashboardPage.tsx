import { BarChart } from '@mui/x-charts/BarChart'
import { LineChart } from '@mui/x-charts/LineChart'
import AddOutlined from '@mui/icons-material/AddOutlined'
import SchoolOutlined from '@mui/icons-material/SchoolOutlined'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import FormControl from '@mui/material/FormControl'
import Grid from '@mui/material/Grid'
import InputLabel from '@mui/material/InputLabel'
import LinearProgress from '@mui/material/LinearProgress'
import Link from '@mui/material/Link'
import MenuItem from '@mui/material/MenuItem'
import Pagination from '@mui/material/Pagination'
import Select from '@mui/material/Select'
import Stack from '@mui/material/Stack'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { Link as RouterLink } from 'react-router'
import { useState } from 'react'
import { useUsuario } from '../../autenticacion'
import { useMateriasBuscar } from '../../materias/api/useMaterias'
import { usePeriodosReferencia } from '../../periodos-academicos/api/usePeriodos'
import { ErrorState } from '../../../shared/ui/ErrorState'
import { GradeBadge } from '../../../shared/ui/GradeBadge'
import { KpiCard } from '../../../shared/ui/KpiCard'
import { PageHeader } from '../../../shared/ui/PageHeader'
import { QueryState } from '../../../shared/ui/QueryState'
import { SectionCard } from '../../../shared/ui/SectionCard'
import { chartColors, colors } from '../../../shared/theme/tokens'
import {
  useAdminResumen,
  useCalificacionesAdmin,
  useCalificacionesDocente,
  useCalificacionesEstudiante,
  useDistribucionNotas,
  useEstudiantesEnRiesgo,
  useOcupacionCursos,
  usePromediosCursos,
  useResumenDocente,
  useResumenEstudiante,
} from '../api/useDashboard'
import type { CalificacionDashboard } from '../model/types'

function nombreCompleto(estudiante?: CalificacionDashboard['inscripcion']['estudiante']) {
  return estudiante ? `${estudiante.nombres} ${estudiante.apellidos}` : 'Estudiante'
}

function ListaCalificaciones({ query }: { query: ReturnType<typeof useCalificacionesAdmin> }) {
  return (
    <QueryState query={query} isEmpty={(data) => data.data.length === 0} emptyTitle="No hay calificaciones">
      {(data) => (
        <Table size="small" aria-label="Últimas calificaciones">
          <TableHead>
            <TableRow>
              <TableCell>Estudiante</TableCell>
              <TableCell>Materia</TableCell>
              <TableCell>Nota</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data.data.map((calificacion) => (
              <TableRow key={calificacion.id}>
                <TableCell>{nombreCompleto(calificacion.inscripcion.estudiante)}</TableCell>
                <TableCell>{calificacion.materia?.nombre ?? '—'}</TableCell>
                <TableCell><GradeBadge nota={calificacion.nota} /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </QueryState>
  )
}

function DashboardAdmin() {
  const [periodoId, setPeriodoId] = useState<number | undefined>(undefined)
  const [materiaId, setMateriaId] = useState<number | undefined>(undefined)
  const [umbral, setUmbral] = useState(51)
  const [paginaRiesgo, setPaginaRiesgo] = useState(1)
  const resumen = useAdminResumen()
  const periodos = usePeriodosReferencia()
  const materias = useMateriasBuscar('', undefined)
  const ocupacion = useOcupacionCursos(periodoId)
  const promedios = usePromediosCursos(periodoId)
  const distribucion = useDistribucionNotas(periodoId, materiaId)
  const riesgo = useEstudiantesEnRiesgo(periodoId, umbral, paginaRiesgo)
  const ultimas = useCalificacionesAdmin()

  const periodoActivo = resumen.data?.periodoActivo

  return (
    <>
      <PageHeader
        title="Resumen"
        subtitle={
          periodoActivo ? `Período vigente: ${periodoActivo.nombre}` : 'Período vigente: Sin período activo'
        }
        actions={
          <FormControl size="small" sx={{ minWidth: 220 }}>
            <InputLabel id="periodo-dashboard">Período</InputLabel>
            <Select<number | ''>
              labelId="periodo-dashboard"
              label="Período"
              value={periodoId ?? ''}
              onChange={(event) => {
                setPeriodoId(event.target.value === '' ? undefined : Number(event.target.value))
                setPaginaRiesgo(1)
              }}
            >
              <MenuItem value="">Período activo</MenuItem>
              {periodos.data?.map((periodo) => (
                <MenuItem key={periodo.id} value={periodo.id}>{periodo.nombre}</MenuItem>
              ))}
            </Select>
          </FormControl>
        }
      />

      <Grid component="div" container spacing={2} sx={{ mb: 3 }}>
        {[
          ['Estudiantes activos', resumen.data?.totales.estudiantesActivos],
          ['Docentes activos', resumen.data?.totales.docentesActivos],
          ['Cursos activos', resumen.data?.totales.cursosActivos],
          ['Materias activas', resumen.data?.totales.materiasActivas],
          ['Inscripciones activas', resumen.data?.inscripcionesActivas],
        ].map(([label, value]) => (
          <Grid component="div" key={String(label)} size={{ xs: 6, sm: 4, md: 2.4 }}>
            <KpiCard label={String(label)} value={value as number | undefined} loading={resumen.isPending} />
          </Grid>
        ))}
      </Grid>

      {!resumen.isPending && !periodoActivo && (
        <Box sx={{ mb: 2 }}>
          <KpiCard label="Período vigente" value="Sin período activo" hint={<Link component={RouterLink} to="/periodos-academicos">Gestionar períodos</Link>} />
        </Box>
      )}
      {resumen.isError && <Box sx={{ mb: 2 }}><ErrorState error={resumen.error} onRetry={() => void resumen.refetch()} /></Box>}

      <Grid component="div" container spacing={2}>
        <Grid component="div" size={{ xs: 12, md: 6 }}>
          <SectionCard title="Ocupación por curso">
            <QueryState query={ocupacion} isEmpty={(data) => data.data.length === 0} emptyTitle="Sin cursos" skeletonHeight={240}>
              {(data) => (
                <Stack spacing={2}>
                  {data.data.map((curso) => {
                    const porcentaje = curso.porcentaje ?? 0
                    const color = porcentaje >= 100 ? colors.error.main : porcentaje >= 90 ? colors.warning.main : colors.primary.main
                    return (
                      <Box key={curso.cursoId} aria-label={`${curso.nombre}: ${curso.inscritosActivos} inscritos${curso.capacidad == null ? '' : ` de ${curso.capacidad}, ${porcentaje} por ciento`}`}>
                        <Stack component="div" direction="row" sx={{ justifyContent: 'space-between' }}>
                          <Typography variant="body2">{curso.nombre}</Typography>
                          <Typography variant="body2">
                            {curso.capacidad == null ? `${curso.inscritosActivos} inscritos` : `${curso.inscritosActivos}/${curso.capacidad} · ${porcentaje} %`}
                          </Typography>
                        </Stack>
                        {curso.capacidad != null && <LinearProgress variant="determinate" value={Math.min(porcentaje, 100)} sx={{ mt: 1, '& .MuiLinearProgress-bar': { bgcolor: color } }} />}
                      </Box>
                    )
                  })}
                </Stack>
              )}
            </QueryState>
          </SectionCard>
        </Grid>

        <Grid component="div" size={{ xs: 12, md: 6 }}>
          <SectionCard title="Promedio por curso">
            <QueryState query={promedios} isEmpty={(data) => data.data.length === 0} emptyTitle="Sin promedios" skeletonHeight={240}>
              {(data) => (
                <Box role="img" aria-label={`Promedios por curso: ${data.data.map((item) => `${item.curso} ${item.promedio}`).join('; ')}`}>
                  <BarChart
                    height={250}
                    xAxis={[{ scaleType: 'band', data: data.data.map((item) => item.curso) }]}
                    series={[{ data: data.data.map((item) => item.promedio), color: chartColors[0], label: 'Promedio' }]}
                    yAxis={[{ min: 0, max: 100 }]}
                  />
                </Box>
              )}
            </QueryState>
          </SectionCard>
        </Grid>

        <Grid component="div" size={{ xs: 12, md: 6 }}>
          <SectionCard
            title="Distribución de notas"
            actions={
              <FormControl size="small" sx={{ minWidth: 160 }}>
                <InputLabel id="materia-dashboard">Materia</InputLabel>
                <Select<number | ''> labelId="materia-dashboard" label="Materia" value={materiaId ?? ''} onChange={(event) => setMateriaId(event.target.value === '' ? undefined : Number(event.target.value))}>
                  <MenuItem value="">Todas</MenuItem>
                  {materias.data?.map((materia) => <MenuItem key={materia.id} value={materia.id}>{materia.nombre}</MenuItem>)}
                </Select>
              </FormControl>
            }
          >
            <QueryState query={distribucion} isEmpty={(data) => data.data.every((item) => item.cantidad === 0)} emptyTitle="Sin calificaciones" skeletonHeight={240}>
              {(data) => (
                <Box role="img" aria-label={`Distribución de notas: ${data.data.map((item) => `${item.rango} ${item.cantidad}`).join('; ')}`}>
                  <BarChart
                    height={250}
                    xAxis={[{ scaleType: 'band', data: data.data.map((item) => item.rango) }]}
                    series={[{ data: data.data.map((item) => item.cantidad), label: 'Calificaciones', color: colors.info.main }]}
                    yAxis={[{ min: 0 }]}
                  />
                </Box>
              )}
            </QueryState>
          </SectionCard>
        </Grid>

        <Grid component="div" size={{ xs: 12, md: 6 }}>
          <SectionCard
            title="Estudiantes en riesgo"
            actions={
              <TextField size="small" type="number" label="Umbral" value={umbral} slotProps={{ htmlInput: { min: 0, max: 100 } }} onChange={(event) => {
                const value = Math.min(100, Math.max(0, Number(event.target.value)))
                setUmbral(value)
                setPaginaRiesgo(1)
              }} sx={{ width: 110 }} />
            }
          >
            <QueryState query={riesgo} isEmpty={(data) => data.data.length === 0} emptyTitle="Sin estudiantes en riesgo" skeletonHeight={240}>
              {(data) => (
                <>
                  <Stack spacing={1}>
                    {data.data.map((estudiante) => (
                      <Box key={estudiante.estudianteId}>
                        <Link component={RouterLink} to={`/estudiantes/${estudiante.estudianteId}`}>{estudiante.nombre}</Link>
                        {' · '}{estudiante.codigo}
                        <Typography variant="body2" color="text.secondary">{estudiante.promedio} · {estudiante.cantidadCalificaciones} notas</Typography>
                      </Box>
                    ))}
                  </Stack>
                  {data.meta.totalPages > 1 && (
                    <Pagination sx={{ mt: 2 }} count={data.meta.totalPages} page={data.meta.page} onChange={(_, page) => setPaginaRiesgo(page)} />
                  )}
                </>
              )}
            </QueryState>
          </SectionCard>
        </Grid>

        <Grid component="div" size={12}>
          <SectionCard title="Últimas calificaciones"><ListaCalificaciones query={ultimas} /></SectionCard>
        </Grid>
      </Grid>
    </>
  )
}

function DashboardDocente() {
  const usuario = useUsuario()
  const resumen = useResumenDocente(usuario.docenteId)
  const calificaciones = useCalificacionesDocente(usuario.docenteId)
  const [materiaId, setMateriaId] = useState<number | undefined>(undefined)
  const distribucion = useDistribucionNotas(undefined, materiaId)

  return (
    <>
      <PageHeader title="Inicio" subtitle={resumen.data?.docente.nombre} actions={<Button component={RouterLink} to="/calificaciones" variant="contained" startIcon={<AddOutlined />}>Registrar calificación</Button>} />
      <Grid component="div" container spacing={2} sx={{ mb: 3 }}>
        <Grid component="div" size={{ xs: 12, sm: 6 }}>
          <KpiCard label="Calificaciones registradas" value={resumen.data?.calificacionesRegistradas} loading={resumen.isPending} />
        </Grid>
        <Grid component="div" size={{ xs: 12, sm: 6 }}>
          <KpiCard label="Promedio otorgado" value={resumen.data?.promedioOtorgado == null ? '—' : resumen.data.promedioOtorgado} loading={resumen.isPending} />
        </Grid>
      </Grid>
      <Grid component="div" container spacing={2}>
        <Grid component="div" size={{ xs: 12, md: 5 }}>
          <SectionCard title="Por materia">
            <QueryState query={resumen} isEmpty={(data) => data.materias.length === 0} emptyTitle="Sin materias">
              {(data) => (
                <Table size="small">
                  <TableHead><TableRow><TableCell>Materia</TableCell><TableCell align="right">Notas</TableCell><TableCell align="right">Promedio</TableCell></TableRow></TableHead>
                  <TableBody>{data.materias.map((materia) => (
                    <TableRow key={materia.materiaId}>
                      <TableCell>{materia.materia ?? 'Materia'}</TableCell>
                      <TableCell align="right">{materia.calificaciones}</TableCell>
                      <TableCell align="right">{materia.promedio ?? '—'}</TableCell>
                    </TableRow>
                  ))}</TableBody>
                </Table>
              )}
            </QueryState>
          </SectionCard>
        </Grid>
        <Grid component="div" size={{ xs: 12, md: 7 }}>
          <SectionCard
            title="Distribución de notas"
            actions={
              <FormControl size="small" sx={{ minWidth: 160 }}>
                <InputLabel id="docente-materia">Materia</InputLabel>
                <Select<number | ''> labelId="docente-materia" label="Materia" value={materiaId ?? ''} onChange={(event) => setMateriaId(event.target.value === '' ? undefined : Number(event.target.value))}>
                  <MenuItem value="">Todas</MenuItem>
                  {resumen.data?.materias.map((materia) => <MenuItem key={materia.materiaId} value={materia.materiaId}>{materia.materia ?? 'Materia'}</MenuItem>)}
                </Select>
              </FormControl>
            }
          >
            <QueryState query={distribucion} skeletonHeight={240}>
              {(data) => (
                <Box role="img" aria-label={`Distribución: ${data.data.map((item) => `${item.rango} ${item.cantidad}`).join('; ')}`}>
                  <BarChart height={250} xAxis={[{ scaleType: 'band', data: data.data.map((item) => item.rango) }]} series={[{ data: data.data.map((item) => item.cantidad), label: 'Calificaciones', color: colors.info.main }]} yAxis={[{ min: 0 }]} />
                </Box>
              )}
            </QueryState>
          </SectionCard>
        </Grid>
        <Grid component="div" size={12}>
          <SectionCard title="Últimas notas registradas"><ListaCalificaciones query={calificaciones} /></SectionCard>
        </Grid>
      </Grid>
    </>
  )
}

function DashboardEstudiante() {
  const usuario = useUsuario()
  const resumen = useResumenEstudiante(usuario.estudianteId)
  const calificaciones = useCalificacionesEstudiante(usuario.estudianteId)

  return (
    <>
      <PageHeader title="Mis datos" subtitle={resumen.data?.estudiante.nombre} />
      <Grid component="div" container spacing={2} sx={{ mb: 3 }}>
        <Grid component="div" size={{ xs: 12, sm: 4 }}>
          <KpiCard label="Promedio general" value={resumen.data?.promedioGeneral == null ? '—' : <GradeBadge nota={resumen.data.promedioGeneral} />} loading={resumen.isPending} />
        </Grid>
        <Grid component="div" size={{ xs: 12, sm: 4 }}>
          <KpiCard label="Materias cursadas" value={resumen.data?.materiasCursadas ?? '—'} loading={resumen.isPending} />
        </Grid>
        <Grid component="div" size={{ xs: 12, sm: 4 }}>
          <KpiCard label="Calificaciones" value={resumen.data?.cantidadCalificaciones ?? '—'} loading={resumen.isPending} />
        </Grid>
      </Grid>
      <Grid component="div" container spacing={2}>
        <Grid component="div" size={{ xs: 12, md: 8 }}>
          <SectionCard title="Promedio por período">
            <QueryState query={resumen} isEmpty={(data) => data.porPeriodo.length === 0} emptyTitle="Sin promedios por período" skeletonHeight={260}>
              {(data) => (
                <Box role="img" aria-label={`Promedios por período: ${data.porPeriodo.map((item) => `${item.periodo} ${item.promedio ?? 0}`).join('; ')}`}>
                  <LineChart height={280} xAxis={[{ scaleType: 'point', data: data.porPeriodo.map((item) => item.periodo) }]} series={[{ data: data.porPeriodo.map((item) => item.promedio ?? 0), label: 'Promedio', color: chartColors[0] }]} yAxis={[{ min: 0, max: 100 }]} />
                </Box>
              )}
            </QueryState>
          </SectionCard>
        </Grid>
        <Grid component="div" size={{ xs: 12, md: 4 }}>
          <SectionCard title="Accesos">
            <Stack spacing={1}>
              <Button component={RouterLink} to="/mi/historial" variant="outlined" startIcon={<SchoolOutlined />}>Historial académico</Button>
              <Button component={RouterLink} to="/mi/calificaciones" variant="outlined">Mis calificaciones</Button>
            </Stack>
          </SectionCard>
        </Grid>
        <Grid component="div" size={12}>
          <SectionCard title="Mis calificaciones">
            <ListaCalificaciones query={calificaciones} />
          </SectionCard>
        </Grid>
      </Grid>
    </>
  )
}

export function DashboardPage() {
  const usuario = useUsuario()
  if (usuario.rol === 'ADMIN') return <DashboardAdmin />
  if (usuario.rol === 'DOCENTE') return <DashboardDocente />
  return <DashboardEstudiante />
}
