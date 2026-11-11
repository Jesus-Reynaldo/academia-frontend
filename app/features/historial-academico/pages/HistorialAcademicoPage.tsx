import ExpandMore from '@mui/icons-material/ExpandMore'
import PrintOutlined from '@mui/icons-material/PrintOutlined'
import Alert from '@mui/material/Alert'
import Accordion from '@mui/material/Accordion'
import AccordionDetails from '@mui/material/AccordionDetails'
import AccordionSummary from '@mui/material/AccordionSummary'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CircularProgress from '@mui/material/CircularProgress'
import Grid from '@mui/material/Grid'
import Stack from '@mui/material/Stack'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Tab from '@mui/material/Tab'
import Tabs from '@mui/material/Tabs'
import Typography from '@mui/material/Typography'
import { useMemo, useState } from 'react'
import { ApiError } from '../../../shared/api/errors'
import { NOTA_APROBACION } from '../../../shared/config/env'
import { formatNota } from '../../../shared/lib/format'
import { EmptyState } from '../../../shared/ui/EmptyState'
import { PageHeader } from '../../../shared/ui/PageHeader'
import { QueryState } from '../../../shared/ui/QueryState'
import { useHistorialAcademico } from '../api/useHistorialAcademico'
import type { HistorialAcademico, HistorialCurso, HistorialPeriodo } from '../model/types'

interface HistorialAcademicoPageProps {
  estudianteId: number | null
  showTitle?: boolean
}

function agruparPeriodos(historial: HistorialAcademico): HistorialPeriodo[] {
  const grupos = new Map<number, HistorialPeriodo>()
  for (const registro of historial.periodos) {
    const periodo = grupos.get(registro.periodoId) ?? {
      periodoId: registro.periodoId,
      periodo: registro.periodo,
      cursos: [],
    }
    const curso: HistorialCurso = {
      cursoId: registro.cursoId,
      curso: registro.curso,
      promedio: registro.promedio,
      materias: registro.materias,
    }
    periodo.cursos.push(curso)
    grupos.set(registro.periodoId, periodo)
  }
  return [...grupos.values()]
}

function colorNota(nota: number | null) {
  return nota !== null && nota < NOTA_APROBACION ? 'error.main' : 'text.primary'
}

function CeldaNotas({ notas }: { notas: number[] }) {
  if (notas.length === 0) return <>—</>

  return (
    <Box sx={{ display: 'grid', gap: 0.25 }}>
      {notas.map((nota, index) => (
        <Typography
          component="span"
          variant="body2"
          key={`${nota}-${index}`}
          sx={{ color: colorNota(nota), whiteSpace: 'nowrap' }}
        >
          {formatNota(nota)}
        </Typography>
      ))}
    </Box>
  )
}

function CursoHistorial({ curso, indice }: { curso: HistorialCurso; indice: number }) {
  return (
    <Accordion defaultExpanded={indice === 0} disableGutters>
      <AccordionSummary expandIcon={<ExpandMore />} aria-controls={`curso-${curso.cursoId}-contenido`}>
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={{ xs: 0.25, sm: 2 }}
          sx={{ alignItems: { sm: 'center' }, justifyContent: 'space-between', width: '100%', pr: 1 }}
        >
          <Typography variant="h3" component="h3">{curso.curso}</Typography>
          <Typography variant="body2" color="text.secondary">
            Promedio del curso:{' '}
            <Box component="strong" sx={{ color: colorNota(curso.promedio) }}>
              {formatNota(curso.promedio)}
            </Box>
          </Typography>
        </Stack>
      </AccordionSummary>
      <AccordionDetails id={`curso-${curso.cursoId}-contenido`}>
        {curso.materias.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            No hay calificaciones registradas en este curso.
          </Typography>
        ) : (
          <TableContainer>
            <Table
              size="small"
              aria-label={`Historial de calificaciones de ${curso.curso}`}
              sx={{ minWidth: 1050 }}
            >
              <TableHead>
                <TableRow sx={{ bgcolor: 'action.hover' }}>
                  <TableCell rowSpan={2}>Materia</TableCell>
                  <TableCell align="center" colSpan={3}>Parciales</TableCell>
                  <TableCell align="center" rowSpan={2}>Prácticas</TableCell>
                  <TableCell align="center" rowSpan={2}>Ponderado</TableCell>
                  <TableCell align="center" rowSpan={2}>Nota pre-final</TableCell>
                  <TableCell align="center" rowSpan={2}>Examen final</TableCell>
                  <TableCell align="center" rowSpan={2}>Nota final</TableCell>
                  <TableCell align="center" rowSpan={2}>Promedio final</TableCell>
                  <TableCell align="center" rowSpan={2}>Otras evaluaciones</TableCell>
                </TableRow>
                <TableRow sx={{ bgcolor: 'action.hover' }}>
                  <TableCell align="center">1ro</TableCell>
                  <TableCell align="center">2do</TableCell>
                  <TableCell align="center">3ero</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {curso.materias.map((materia) => {
                  const parciales = materia.calificaciones
                    .filter((calificacion) => calificacion.tipo === 'PARCIAL')
                    .map((calificacion) => calificacion.nota)
                  const practicas = materia.calificaciones
                    .filter((calificacion) => calificacion.tipo === 'PRACTICA')
                    .map((calificacion) => calificacion.nota)
                  const examenesFinales = materia.calificaciones
                    .filter((calificacion) => calificacion.tipo === 'FINAL')
                    .map((calificacion) => calificacion.nota)
                  const otrasEvaluaciones = materia.calificaciones
                    .filter((calificacion) => calificacion.tipo !== 'PARCIAL'
                      && calificacion.tipo !== 'PRACTICA'
                      && calificacion.tipo !== 'FINAL')
                    .map((calificacion) => ({
                      tipo: calificacion.tipo,
                      nota: calificacion.nota,
                    }))
                  parciales.slice(3).forEach((nota, index) => {
                    otrasEvaluaciones.push({ tipo: `Parcial adicional ${index + 4}`, nota })
                  })

                  return (
                    <TableRow key={materia.materiaId}>
                      <TableCell sx={{ fontWeight: 600, minWidth: 180 }}>{materia.materia}</TableCell>
                      {[0, 1, 2].map((indice) => (
                        <TableCell key={indice} align="center">
                          <CeldaNotas notas={parciales.slice(indice, indice + 1)} />
                        </TableCell>
                      ))}
                      <TableCell align="center"><CeldaNotas notas={practicas} /></TableCell>
                      <TableCell align="center">—</TableCell>
                      <TableCell align="center">—</TableCell>
                      <TableCell align="center"><CeldaNotas notas={examenesFinales} /></TableCell>
                      <TableCell align="center">—</TableCell>
                      <TableCell align="center" sx={{ color: colorNota(materia.promedio), fontWeight: 600 }}>
                        {formatNota(materia.promedio)}
                      </TableCell>
                      <TableCell align="center">
                        {otrasEvaluaciones.length === 0 ? '—' : (
                          <Box sx={{ display: 'grid', gap: 0.25 }}>
                            {otrasEvaluaciones.map((evaluacion, index) => (
                              <Typography
                                component="span"
                                variant="body2"
                                key={`${evaluacion.tipo}-${index}`}
                                sx={{ color: colorNota(evaluacion.nota), whiteSpace: 'nowrap' }}
                              >
                                {evaluacion.tipo}: {formatNota(evaluacion.nota)}
                              </Typography>
                            ))}
                          </Box>
                        )}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </AccordionDetails>
    </Accordion>
  )
}

function PeriodoHistorial({ periodo, panelId }: { periodo: HistorialPeriodo; panelId: string }) {
  return (
    <Box role="tabpanel" id={panelId} aria-labelledby={`periodo-tab-${periodo.periodoId}`}>
      <Stack spacing={1.5}>
        {periodo.cursos.map((curso, index) => (
          <CursoHistorial key={`${periodo.periodoId}-${curso.cursoId}`} curso={curso} indice={index} />
        ))}
      </Stack>
    </Box>
  )
}

function HistorialContenido({ historial, showTitle }: { historial: HistorialAcademico; showTitle: boolean }) {
  const periodos = useMemo(() => agruparPeriodos(historial), [historial])
  const [periodoActivo, setPeriodoActivo] = useState(periodos[0]?.periodoId ?? 0)
  const fechaEmision = new Intl.DateTimeFormat('es', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date())
  const periodoSeleccionado = periodos.find((periodo) => periodo.periodoId === periodoActivo) ?? periodos[0]

  return (
    <Box className="historial-academico">
      <style>{`
        @media print {
          @page { margin: 14mm; }
          .historial-academico .no-print,
          .historial-academico .MuiTabs-root,
          .historial-academico .MuiAccordionSummary-expandIconWrapper { display: none !important; }
          .historial-academico, .historial-academico * {
            color: #000 !important;
            box-shadow: none !important;
            text-shadow: none !important;
          }
          .historial-academico .MuiCard-root,
          .historial-academico .MuiAccordion-root {
            background: #fff !important;
            border: 1px solid #777 !important;
            break-inside: avoid;
          }
          .historial-academico .MuiAccordionDetails-root { display: block !important; }
          .historial-academico .MuiAccordionSummary-root {
            display: block !important;
            min-height: auto !important;
          }
          .historial-academico .MuiAccordionSummary-content { margin: 8px 0 !important; }
          .historial-academico .MuiAccordionSummary-expandIconWrapper { display: none !important; }
          .historial-academico .MuiChip-root { background: #fff !important; border: 1px solid #555; }
          .historial-academico .MuiAccordion-root { margin: 0 0 8px !important; }
          .historial-academico .historial-periodo-print { display: block !important; }
        }
      `}</style>

      {showTitle && (
        <PageHeader
          title="Historial académico"
          actions={
            <Button className="no-print" variant="outlined" startIcon={<PrintOutlined />} onClick={() => window.print()}>
              Imprimir
            </Button>
          }
        />
      )}

      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1 }}>
        {!showTitle && (
          <Button className="no-print" variant="outlined" startIcon={<PrintOutlined />} onClick={() => window.print()}>
            Imprimir
          </Button>
        )}
      </Box>

      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Typography variant="h2" component="h2" sx={{ mb: 2 }}>Datos generales</Typography>
          <Grid component="dl" container spacing={1} sx={{ m: 0 }}>
            <Grid component="div" size={{ xs: 12, sm: 6 }}>
              <Typography component="dt" variant="body2" color="text.secondary">Estudiante</Typography>
              <Typography component="dd" sx={{ m: 0, fontWeight: 600, overflowWrap: 'anywhere' }}>
                {historial.estudiante.nombre}
              </Typography>
            </Grid>
            <Grid component="div" size={{ xs: 12, sm: 3 }}>
              <Typography component="dt" variant="body2" color="text.secondary">Código</Typography>
              <Typography component="dd" sx={{ m: 0, fontWeight: 600 }}>{historial.estudiante.codigo}</Typography>
            </Grid>
            <Grid component="div" size={{ xs: 12, sm: 3 }}>
              <Typography component="dt" variant="body2" color="text.secondary">Promedio general</Typography>
              <Typography
                component="dd"
                sx={{
                  m: 0,
                  fontWeight: 600,
                  color: historial.promedioGeneral !== null && historial.promedioGeneral < NOTA_APROBACION
                    ? 'error.main'
                    : 'text.primary',
                }}
              >
                {formatNota(historial.promedioGeneral)}
              </Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {periodos.length === 0 ? (
        <EmptyState
          title="Aún no hay inscripciones ni calificaciones"
          description="La libreta académica aparecerá cuando exista una inscripción. Las materias y notas se mostrarán conforme se registren evaluaciones."
        />
      ) : (
        <Card>
          <CardContent>
            <Typography variant="h2" component="h2" sx={{ mb: 2 }}>Libreta académica</Typography>
            <Box className="no-print">
              <Tabs
                value={periodoSeleccionado?.periodoId ?? false}
                onChange={(_event, value: number) => setPeriodoActivo(value)}
                variant="scrollable"
                scrollButtons="auto"
                aria-label="Períodos académicos"
                sx={{ mb: 2, borderBottom: 1, borderColor: 'divider' }}
              >
                {periodos.map((periodo) => (
                  <Tab
                    key={periodo.periodoId}
                    value={periodo.periodoId}
                    label={periodo.periodo}
                    id={`periodo-tab-${periodo.periodoId}`}
                    aria-controls={`periodo-panel-${periodo.periodoId}`}
                  />
                ))}
              </Tabs>
            </Box>
            {periodoSeleccionado && (
              <Box className="no-print">
                <PeriodoHistorial
                  periodo={periodoSeleccionado}
                  panelId={`periodo-panel-${periodoSeleccionado.periodoId}`}
                />
              </Box>
            )}
            <Box className="historial-periodo-print" sx={{ display: 'none' }}>
              {periodos.map((periodo) => (
                <Box key={periodo.periodoId} sx={{ mb: 3 }}>
                  <Typography variant="h3" component="h3" sx={{ mb: 1 }}>
                    {periodo.periodo}
                  </Typography>
                  <Stack spacing={1.5}>
                    {periodo.cursos.map((curso, index) => (
                      <CursoHistorial key={`${periodo.periodoId}-${curso.cursoId}`} curso={curso} indice={index} />
                    ))}
                  </Stack>
                </Box>
              ))}
            </Box>
          </CardContent>
        </Card>
      )}
      <Typography className="historial-print-meta" variant="caption" sx={{ display: 'block', mt: 2 }}>
        {historial.estudiante.nombre} · Emitido el {fechaEmision}
      </Typography>
    </Box>
  )
}

export function HistorialAcademicoPage({ estudianteId, showTitle = true }: HistorialAcademicoPageProps) {
  const historial = useHistorialAcademico(estudianteId)
  const esForbidden = historial.error instanceof ApiError && historial.error.status === 403

  if (historial.isPending) {
    return <Box sx={{ display: 'grid', minHeight: 180, placeItems: 'center' }}><CircularProgress aria-label="Cargando historial" /></Box>
  }
  if (esForbidden) {
    return (
      <Alert severity="error" role="alert" action={
        <Button color="inherit" size="small" onClick={() => void historial.refetch()}>
          Reintentar
        </Button>
      }>
        Solo puedes consultar tu propio historial académico.
      </Alert>
    )
  }

  return (
    <QueryState
      query={historial}
      skeletonHeight={420}
    >
      {(data) => <HistorialContenido historial={data} showTitle={showTitle} />}
    </QueryState>
  )
}
