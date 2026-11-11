import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import AddOutlined from '@mui/icons-material/AddOutlined'
import SchoolOutlined from '@mui/icons-material/SchoolOutlined'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardActionArea from '@mui/material/CardActionArea'
import CardContent from '@mui/material/CardContent'
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
import { useEffect, useMemo, useRef, useState, type SyntheticEvent } from 'react'
import type { SelectChangeEvent } from '@mui/material/Select'
import { useUsuario } from '../../autenticacion'
import { useMateriasBuscar } from '../../materias/api/useMaterias'
import { usePeriodosReferencia } from '../../periodos-academicos/api/usePeriodos'
import { ErrorState } from '../../../shared/ui/ErrorState'
import { EmptyState } from '../../../shared/ui/EmptyState'
import { GradeBadge } from '../../../shared/ui/GradeBadge'
import { KpiCard } from '../../../shared/ui/KpiCard'
import { PageHeader } from '../../../shared/ui/PageHeader'
import { QueryState } from '../../../shared/ui/QueryState'
import { SectionCard } from '../../../shared/ui/SectionCard'
import { chartColors, colors } from '../../../shared/theme/tokens'
import { formatNota } from '../../../shared/lib/format'
import {
  useAdminResumen,
  useCalificacionesAdmin,
  useCalificacionesDocente,
  useCalificacionesEstudiante,
  useCalificacionesDocentePorCurso,
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

function correspondeAlAnio(
  periodo: { nombre: string; fechaInicio: string; fechaFin: string },
  anio: number,
) {
  const anioTexto = String(anio)
  if (new RegExp(`(?:^|\\D)${anioTexto}(?:\\D|$)`).test(periodo.nombre)) return true

  const anioInicio = Number(periodo.fechaInicio.slice(0, 4))
  const anioFin = Number(periodo.fechaFin.slice(0, 4))
  return anioInicio <= anio && anioFin >= anio
}

interface MateriaOption {
  id: number
  nombre: string
}

interface ChartDataItem {
  label: string
  value: string
  color?: string
}

function ChartDataList({ items }: { items: ChartDataItem[] }) {
  return (
    <Stack
      component="ul"
      spacing={0.75}
      aria-label="Valores del gráfico"
      sx={{ display: { xs: 'flex', sm: 'none' }, listStyle: 'none', p: 0, m: 0, mt: 1 }}
    >
      {items.map((item) => (
        <Stack
          component="li"
          key={item.label}
          direction="row"
          spacing={1}
          sx={{ alignItems: 'center', justifyContent: 'space-between', minWidth: 0 }}
        >
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center', minWidth: 0 }}>
            {item.color && (
              <Box aria-hidden sx={{ width: 10, height: 10, flex: '0 0 auto', borderRadius: '50%', bgcolor: item.color }} />
            )}
            <Typography variant="body2" sx={{ overflowWrap: 'anywhere' }}>{item.label}</Typography>
          </Stack>
          <Typography variant="body2" sx={{ fontWeight: 600, flex: '0 0 auto', pl: 1 }}>{item.value}</Typography>
        </Stack>
      ))}
    </Stack>
  )
}

function MateriaSelector({
  labelId,
  materias,
  value,
  onChange,
  allowAll = true,
}: {
  labelId: string
  materias: MateriaOption[]
  value: number | undefined
  onChange: (value: number | undefined) => void
  allowAll?: boolean
}) {
  const [open, setOpen] = useState(false)
  const aperturaConMouse = useRef(false)
  const limpiarMouseUp = useRef<(() => void) | null>(null)

  useEffect(
    () => () => {
      limpiarMouseUp.current?.()
    },
    [],
  )

  const handleOpen = (event: SyntheticEvent) => {
    setOpen(true)
    if (event.type !== 'mousedown') return

    aperturaConMouse.current = true
    const handleMouseUp = () => {
      limpiarMouseUp.current?.()
      limpiarMouseUp.current = null
      window.setTimeout(() => {
        aperturaConMouse.current = false
      }, 0)
    }

    document.addEventListener('mouseup', handleMouseUp, true)
    limpiarMouseUp.current = () => document.removeEventListener('mouseup', handleMouseUp, true)
  }

  const handleClose = () => {
    if (!aperturaConMouse.current) setOpen(false)
  }

  const handleChange = (event: SelectChangeEvent<number | ''>) => {
    if (aperturaConMouse.current) return
    onChange(event.target.value === '' ? undefined : Number(event.target.value))
  }

  return (
    <FormControl size="small" sx={{ minWidth: 160 }}>
      <InputLabel id={labelId}>Materia</InputLabel>
      <Select<number | ''>
        labelId={labelId}
        label="Materia"
        value={value ?? ''}
        open={open}
        onOpen={handleOpen}
        onClose={handleClose}
        onChange={handleChange}
        MenuProps={{
          anchorOrigin: { vertical: 'bottom', horizontal: 'left' },
          transformOrigin: { vertical: 'top', horizontal: 'left' },
          slotProps: {
            paper: {
              sx: {
                maxHeight: 'min(320px, calc(100dvh - 120px))',
                minWidth: 'min(240px, calc(100vw - 32px))',
                maxWidth: 'calc(100vw - 32px)',
              },
            },
          },
        }}
      >
        {allowAll && <MenuItem value="">Todas</MenuItem>}
        {materias.map((materia) => (
          <MenuItem key={materia.id} value={materia.id}>{materia.nombre}</MenuItem>
        ))}
      </Select>
    </FormControl>
  )
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
  const [periodoIdManual, setPeriodoIdManual] = useState<number | undefined>(undefined)
  const [materiaId, setMateriaId] = useState<number | undefined>(undefined)
  const [umbral, setUmbral] = useState(51)
  const [paginaRiesgo, setPaginaRiesgo] = useState(1)
  const resumen = useAdminResumen()
  const periodos = usePeriodosReferencia()
  const materias = useMateriasBuscar('', undefined)
  const ultimas = useCalificacionesAdmin()

  const anioActual = new Date().getFullYear()
  const periodoActivo = resumen.data?.periodoActivo
  const periodosDelAnio = periodos.data?.filter((periodo) =>
    correspondeAlAnio(periodo, anioActual),
  ) ?? []
  const periodoPorDefecto =
    periodosDelAnio.find((periodo) => periodo.estado === 'ACTIVO') ??
    periodosDelAnio[0] ??
    periodos.data?.find((periodo) => periodo.estado === 'ACTIVO')
  const periodoSeleccionado =
    periodos.data?.find((periodo) => periodo.id === periodoIdManual) ?? periodoPorDefecto
  const periodoId = periodoIdManual ?? periodoSeleccionado?.id
  const consultasPeriodoHabilitadas =
    periodoIdManual !== undefined ||
    periodoSeleccionado !== undefined ||
    (periodos.isSuccess && resumen.isSuccess)
  const ocupacion = useOcupacionCursos(periodoId, consultasPeriodoHabilitadas)
  const promedios = usePromediosCursos(periodoId, consultasPeriodoHabilitadas)
  const distribucion = useDistribucionNotas(periodoId, materiaId, consultasPeriodoHabilitadas)
  const riesgo = useEstudiantesEnRiesgo(periodoId, umbral, paginaRiesgo, consultasPeriodoHabilitadas)

  return (
    <>
      <PageHeader
        title="Resumen"
        subtitle={
          periodoSeleccionado
            ? `Período seleccionado: ${periodoSeleccionado.nombre}`
            : `Período seleccionado: ${anioActual} (sin período registrado)`
        }
        actions={
          <FormControl size="small" sx={{ minWidth: 220 }}>
            <InputLabel id="periodo-dashboard">Período</InputLabel>
            <Select<number | ''>
              labelId="periodo-dashboard"
              label="Período"
              value={periodoSeleccionado?.id ?? ''}
              onChange={(event) => {
                setPeriodoIdManual(event.target.value === '' ? undefined : Number(event.target.value))
                setPaginaRiesgo(1)
              }}
            >
              {!periodoSeleccionado && (
                <MenuItem value="" disabled>
                  {periodos.isPending ? 'Cargando períodos…' : `Sin período para ${anioActual}`}
                </MenuItem>
              )}
              {periodos.data?.map((periodo) => (
                <MenuItem key={periodo.id} value={periodo.id}>{periodo.nombre}</MenuItem>
              ))}
            </Select>
          </FormControl>
        }
      />

      <Grid component="div" container spacing={2} sx={{ mb: 3 }}>
        {[
          { label: 'Estudiantes activos', value: resumen.data?.totales.estudiantesActivos, to: '/estudiantes' },
          { label: 'Docentes activos', value: resumen.data?.totales.docentesActivos, to: '/docentes' },
          { label: 'Cursos activos', value: resumen.data?.totales.cursosActivos, to: '/cursos' },
          { label: 'Materias activas', value: resumen.data?.totales.materiasActivas, to: '/materias' },
          { label: 'Inscripciones activas', value: resumen.data?.inscripcionesActivas, to: '/inscripciones' },
        ].map(({ label, value, to }) => (
          <Grid component="div" key={label} size={{ xs: 6, sm: 4, md: 2.4 }}>
            <KpiCard label={label} value={value} loading={resumen.isPending} to={to} />
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
                <Box role="group" aria-label={`Promedios por curso: ${data.data.map((item) => `${item.curso} ${item.promedio}`).join('; ')}`}>
                  <Box sx={{ display: { xs: 'none', sm: 'block' }, width: '100%', height: 250 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={data.data} margin={{ top: 12, right: 12, left: 0, bottom: 8 }}>
                        <CartesianGrid stroke={colors.divider} strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="curso" tick={{ fill: colors.text.secondary, fontSize: 12 }} />
                        <YAxis domain={[0, 100]} tick={{ fill: colors.text.secondary, fontSize: 12 }} />
                        <Tooltip formatter={(value) => [formatNota(Number(value)), 'Promedio']} />
                        <Bar dataKey="promedio" name="Promedio" radius={[4, 4, 0, 0]}>
                          {data.data.map((item, index) => (
                            <Cell key={item.cursoId} fill={chartColors[index % chartColors.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </Box>
                  <ChartDataList
                    items={data.data.map((item, index) => ({
                      label: item.curso,
                      value: formatNota(item.promedio),
                      color: chartColors[index % chartColors.length],
                    }))}
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
              <MateriaSelector
                labelId="materia-dashboard"
                materias={materias.data ?? []}
                value={materiaId}
                onChange={setMateriaId}
              />
            }
          >
            <QueryState query={distribucion} isEmpty={(data) => data.data.every((item) => item.cantidad === 0)} emptyTitle="Sin calificaciones" skeletonHeight={240}>
              {(data) => (
                <Box role="group" aria-label={`Distribución de notas: ${data.data.map((item) => `${item.rango} ${item.cantidad}`).join('; ')}`}>
                  <Box sx={{ display: { xs: 'none', sm: 'block' }, width: '100%', height: 250 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={data.data} margin={{ top: 12, right: 12, left: 0, bottom: 8 }}>
                        <CartesianGrid stroke={colors.divider} strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="rango" tick={{ fill: colors.text.secondary, fontSize: 12 }} />
                        <YAxis allowDecimals={false} tick={{ fill: colors.text.secondary, fontSize: 12 }} />
                        <Tooltip formatter={(value) => [Number(value), 'Calificaciones']} />
                        <Bar dataKey="cantidad" name="Calificaciones" radius={[4, 4, 0, 0]}>
                          {data.data.map((item) => (
                            <Cell
                              key={item.rango}
                              fill={
                                item.rango === '0-50' ? colors.error.main
                                  : item.rango === '51-70' ? colors.warning.main
                                    : item.rango === '71-85' ? colors.info.main
                                      : colors.success.main
                              }
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </Box>
                  <ChartDataList
                    items={data.data.map((item) => ({
                      label: item.rango,
                      value: String(item.cantidad),
                      color:
                        item.rango === '0-50' ? colors.error.main
                          : item.rango === '51-70' ? colors.warning.main
                            : item.rango === '71-85' ? colors.info.main
                              : colors.success.main,
                    }))}
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

function CursoDocenteCard({
  docenteId,
  curso,
  seleccionado,
  onSelect,
}: {
  docenteId: number
  curso: { id: number; nombre: string }
  seleccionado: boolean
  onSelect: () => void
}) {
  const query = useCalificacionesDocentePorCurso(docenteId, curso.id, 1)

  return (
    <Card variant="outlined" sx={{ borderColor: seleccionado ? 'primary.main' : 'divider' }}>
      <CardActionArea onClick={onSelect} aria-pressed={seleccionado}>
        <CardContent>
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>{curso.nombre}</Typography>
          {query.isPending ? (
            <Typography variant="body2" color="text.secondary">Cargando calificaciones…</Typography>
          ) : query.isError ? (
            <ErrorState error={query.error} onRetry={() => void query.refetch()} />
          ) : (
            <Typography variant="body2" color="text.secondary">
              {query.data.meta.total} calificaciones registradas
            </Typography>
          )}
        </CardContent>
      </CardActionArea>
    </Card>
  )
}

function DashboardDocente() {
  const usuario = useUsuario()
  const resumen = useResumenDocente(usuario.docenteId)
  const cursosConCalificaciones = useCalificacionesDocente(usuario.docenteId)
  const [materiaId, setMateriaId] = useState<number | undefined>(undefined)
  const [cursoId, setCursoId] = useState<number | undefined>(undefined)
  const materias = resumen.data?.materias ?? []
  const cursos = useMemo(() => {
    const cursosUnicos = new Map<number, string>()
    for (const calificacion of cursosConCalificaciones.data?.data ?? []) {
      const curso = calificacion.inscripcion.curso
      if (curso) cursosUnicos.set(curso.id, curso.nombre)
    }
    return [...cursosUnicos].map(([id, nombre]) => ({ id, nombre }))
  }, [cursosConCalificaciones.data?.data])
  const cursoSeleccionadoId = cursos.some((curso) => curso.id === cursoId) ? cursoId : cursos[0]?.id
  const calificaciones = useCalificacionesDocentePorCurso(
    usuario.docenteId ?? 0,
    cursoSeleccionadoId ?? 0,
    10,
  )
  const materiaSeleccionadaId = materias.some((materia) => materia.materiaId === materiaId)
    ? materiaId
    : materias[0]?.materiaId
  const distribucion = useDistribucionNotas(
    undefined,
    materiaSeleccionadaId,
    resumen.isSuccess && materiaSeleccionadaId !== undefined,
  )

  return (
    <>
      <PageHeader title="Inicio" subtitle={resumen.data?.docente.nombre} actions={<Button component={RouterLink} to="/calificaciones" variant="contained" startIcon={<AddOutlined />}>Registrar calificación</Button>} />
      <SectionCard title="Cursos con calificaciones registradas">
        <QueryState
          query={cursosConCalificaciones}
          isEmpty={(data) => data.data.length === 0}
          emptyTitle="Aún no hay cursos con calificaciones"
          emptyDescription="Los cursos aparecerán aquí cuando registres calificaciones."
        >
          {() => (
            <Grid component="div" container spacing={1.5}>
              {cursos.map((curso) => (
                <Grid component="div" key={curso.id} size={{ xs: 12, sm: 6, md: 4 }}>
                  <CursoDocenteCard
                    docenteId={usuario.docenteId ?? 0}
                    curso={curso}
                    seleccionado={curso.id === cursoSeleccionadoId}
                    onSelect={() => setCursoId(curso.id)}
                  />
                </Grid>
              ))}
            </Grid>
          )}
        </QueryState>
      </SectionCard>
      <Grid component="div" container spacing={2}>
        <Grid component="div" size={{ xs: 12, md: 7 }}>
          <SectionCard
            title="Últimas calificaciones"
            actions={
              cursos.length > 0 ? (
                <FormControl size="small" sx={{ minWidth: 180 }}>
                  <InputLabel id="docente-curso-label">Curso</InputLabel>
                  <Select
                    labelId="docente-curso-label"
                    label="Curso"
                    value={cursoSeleccionadoId ?? ''}
                    onChange={(event) => setCursoId(Number(event.target.value))}
                  >
                    {cursos.map((curso) => (
                      <MenuItem key={curso.id} value={curso.id}>{curso.nombre}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              ) : null
            }
          >
            {cursosConCalificaciones.isPending ? (
              <LinearProgress aria-label="Cargando cursos" />
            ) : cursosConCalificaciones.isError ? (
              <ErrorState
                error={cursosConCalificaciones.error}
                onRetry={() => void cursosConCalificaciones.refetch()}
              />
            ) : cursos.length === 0 ? (
              <EmptyState
                title="Aún no has registrado calificaciones"
                description="Cuando registres notas, podrás consultar las más recientes por curso."
              />
            ) : <QueryState
              query={calificaciones}
              isEmpty={(data) => data.data.length === 0}
              emptyTitle="Este curso aún no tiene calificaciones"
              emptyDescription="Las últimas calificaciones del curso seleccionado aparecerán aquí."
            >
              {(data) => (
                <Stack spacing={1.5}>
                  <Typography variant="caption" color="text.secondary">
                    Últimas {data.data.length} de {data.meta.total} calificaciones de este curso
                  </Typography>
                  <Stack spacing={1}>
                    {data.data.map((nota) => {
                      const estudiante = nota.inscripcion.estudiante
                      return (
                        <Stack
                          key={nota.id}
                          direction="row"
                          spacing={1}
                          sx={{
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: 1,
                            p: 1,
                            border: 1,
                            borderColor: 'divider',
                            borderRadius: 2,
                          }}
                        >
                          <Box sx={{ minWidth: 0 }}>
                            {estudiante ? (
                              <Link
                                component={RouterLink}
                                to={`/estudiantes/${estudiante.id}`}
                                underline="hover"
                              >
                                {nombreCompleto(estudiante)}
                              </Link>
                            ) : (
                              <Typography variant="body2">Estudiante</Typography>
                            )}
                            <Typography variant="body2" color="text.secondary">
                              {nota.materia.nombre} · {nota.tipo}
                            </Typography>
                          </Box>
                          <GradeBadge nota={nota.nota} />
                        </Stack>
                      )
                    })}
                  </Stack>
                </Stack>
              )}
            </QueryState>}
          </SectionCard>
        </Grid>
        <Grid component="div" size={{ xs: 12, md: 5 }}>
          <Stack spacing={2}>
            <SectionCard
              title="Distribución de notas"
              actions={
                materias.length > 0 ? (
                  <MateriaSelector
                    labelId="docente-materia"
                    materias={materias.map((materia) => ({
                      id: materia.materiaId,
                      nombre: materia.materia ?? 'Materia',
                    }))}
                    value={materiaSeleccionadaId}
                    onChange={setMateriaId}
                    allowAll={false}
                  />
                ) : null
              }
            >
              {!resumen.isPending && materias.length === 0 ? (
                <EmptyState
                  title="Sin materias evaluadas"
                  description="La distribución aparecerá después de registrar calificaciones."
                />
              ) : (
                <QueryState query={distribucion} skeletonHeight={240}>
                  {(data) => (
                    <Box role="group" aria-label={`Distribución: ${data.data.map((item) => `${item.rango} ${item.cantidad}`).join('; ')}`}>
                      <Box sx={{ display: { xs: 'none', sm: 'block' }, width: '100%', height: 250 }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={data.data} margin={{ top: 12, right: 12, left: 0, bottom: 8 }}>
                            <CartesianGrid stroke={colors.divider} strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="rango" tick={{ fill: colors.text.secondary, fontSize: 12 }} />
                            <YAxis allowDecimals={false} tick={{ fill: colors.text.secondary, fontSize: 12 }} />
                            <Tooltip formatter={(value) => [Number(value), 'Calificaciones']} />
                            <Bar dataKey="cantidad" name="Calificaciones" radius={[4, 4, 0, 0]}>
                              {data.data.map((item) => (
                                <Cell
                                  key={item.rango}
                                  fill={
                                    item.rango === '0-50' ? colors.error.main
                                      : item.rango === '51-70' ? colors.warning.main
                                        : item.rango === '71-85' ? colors.info.main
                                          : colors.success.main
                                  }
                                />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </Box>
                      <ChartDataList
                        items={data.data.map((item) => ({
                          label: item.rango,
                          value: String(item.cantidad),
                          color:
                            item.rango === '0-50' ? colors.error.main
                              : item.rango === '51-70' ? colors.warning.main
                                : item.rango === '71-85' ? colors.info.main
                                  : colors.success.main,
                        }))}
                      />
                    </Box>
                  )}
                </QueryState>
              )}
            </SectionCard>
            <SectionCard title="Seguimiento de estudiantes">
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Consulta el avance y las calificaciones individuales desde la ficha de cada estudiante.
              </Typography>
              <Button component={RouterLink} to="/estudiantes" variant="outlined">
                Ver estudiantes
              </Button>
            </SectionCard>
          </Stack>
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
                <Box role="group" aria-label={`Promedios por período: ${data.porPeriodo.map((item) => `${item.periodo} ${formatNota(item.promedio)}`).join('; ')}`}>
                  <Box sx={{ display: { xs: 'none', sm: 'block' }, width: '100%', height: 280 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={data.porPeriodo} margin={{ top: 12, right: 12, left: 0, bottom: 8 }}>
                        <CartesianGrid stroke={colors.divider} strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="periodo" tick={{ fill: colors.text.secondary, fontSize: 12 }} />
                        <YAxis domain={[0, 100]} tick={{ fill: colors.text.secondary, fontSize: 12 }} />
                        <Tooltip formatter={(value) => [formatNota(value == null ? null : Number(value)), 'Promedio']} />
                        <Line
                          type="monotone"
                          dataKey="promedio"
                          name="Promedio"
                          stroke={chartColors[0]}
                          strokeWidth={3}
                          dot={{ r: 4, fill: chartColors[0] }}
                          activeDot={{ r: 6 }}
                          connectNulls={false}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </Box>
                  <ChartDataList
                    items={data.porPeriodo.map((item) => ({
                      label: item.periodo,
                      value: formatNota(item.promedio),
                      color: chartColors[0],
                    }))}
                  />
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
