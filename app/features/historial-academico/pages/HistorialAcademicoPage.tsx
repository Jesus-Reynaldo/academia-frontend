import CheckCircleOutlined from '@mui/icons-material/CheckCircleOutlined'
import ErrorOutlined from '@mui/icons-material/ErrorOutlined'
import ExpandMore from '@mui/icons-material/ExpandMore'
import PrintOutlined from '@mui/icons-material/PrintOutlined'
import Accordion from '@mui/material/Accordion'
import AccordionDetails from '@mui/material/AccordionDetails'
import AccordionSummary from '@mui/material/AccordionSummary'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CircularProgress from '@mui/material/CircularProgress'
import Grid from '@mui/material/Grid'
import Stack from '@mui/material/Stack'
import Tab from '@mui/material/Tab'
import Tabs from '@mui/material/Tabs'
import Typography from '@mui/material/Typography'
import { useMemo, useState } from 'react'
import { ApiError } from '../../../shared/api/errors'
import { formatNota } from '../../../shared/lib/format'
import { EmptyState } from '../../../shared/ui/EmptyState'
import { PageHeader } from '../../../shared/ui/PageHeader'
import { QueryState } from '../../../shared/ui/QueryState'
import { useHistorialAcademico } from '../api/useHistorialAcademico'
import { NotaHistorial } from '../components/NotaHistorial'
import { TablaCurso } from '../components/TablaCurso'
import { TarjetasCurso } from '../components/TarjetasCurso'
import { agruparPeriodos } from '../model/agrupar'
import { resumenPeriodo } from '../model/desglose'
import type { HistorialAcademico, HistorialCurso, HistorialPeriodo } from '../model/types'

interface HistorialAcademicoPageProps {
  estudianteId: number | null
  showTitle?: boolean
}

/** Estilos de la libreta impresa: A4 vertical, todas las columnas visibles y sin hojas vacías. */
const ESTILOS_IMPRESION = `
  @media print {
    @page {
      size: A4 portrait;
      margin: 14mm 12mm;
      @bottom-right { content: "Página " counter(page) " de " counter(pages); font-size: 9pt; }
    }
    .historial-academico .no-print,
    .historial-academico .MuiTabs-root,
    .historial-academico .MuiAccordionSummary-expandIconWrapper { display: none !important; }
    .historial-academico .solo-print { display: block !important; }
    .historial-academico, .historial-academico * {
      color: #000 !important;
      box-shadow: none !important;
      text-shadow: none !important;
    }
    .historial-academico .MuiCard-root,
    .historial-academico .MuiAccordion-root {
      background: #fff !important;
      border: 1px solid #777 !important;
    }
    .historial-academico .MuiAccordion-root { margin: 0 0 8px !important; }
    .historial-academico .MuiCollapse-root { height: auto !important; visibility: visible !important; }
    .historial-academico .MuiAccordionDetails-root { display: block !important; padding: 4px 8px 8px !important; }
    .historial-academico .MuiAccordionSummary-root { display: block !important; min-height: auto !important; }
    .historial-academico .MuiAccordionSummary-content { margin: 6px 0 !important; }
    .historial-academico .historial-tabla { display: block !important; overflow: visible !important; }
    .historial-academico .historial-tabla table { min-width: 0 !important; width: 100% !important; }
    .historial-academico .historial-tabla th,
    .historial-academico .historial-tabla td { padding: 3px 5px !important; font-size: 9pt !important; }
    .historial-academico tr { break-inside: avoid; }
    .historial-academico h3 { break-after: avoid; }
  }
`

/** Promedio del curso, materias aprobadas y por debajo de 51 en la gestión (promedios del servidor). */
function ResumenGestion({ periodo }: { periodo: HistorialPeriodo }) {
  const resumen = resumenPeriodo(periodo)
  if (resumen.materias === 0) return null
  const todoBien = resumen.debajo.length === 0

  return (
    <Alert
      severity={todoBien ? 'success' : 'warning'}
      icon={todoBien ? <CheckCircleOutlined /> : <ErrorOutlined />}
      sx={{ mb: 1.5 }}
    >
      <strong>
        {resumen.aprobadas} de {resumen.materias} materias con promedio de 51 o más.
      </strong>{' '}
      {todoBien
        ? 'Ninguna materia está por debajo de 51.'
        : `Por debajo de 51: ${resumen.debajo.map((m) => `${m.nombre} (${formatNota(m.promedio)})`).join(', ')}.`}
    </Alert>
  )
}

function CursoHistorial({ curso, abierto }: { curso: HistorialCurso; abierto: boolean }) {
  return (
    <Accordion defaultExpanded={abierto} disableGutters>
      <AccordionSummary expandIcon={<ExpandMore />} aria-controls={`curso-${curso.cursoId}-contenido`}>
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={{ xs: 0.25, sm: 2 }}
          sx={{ alignItems: { sm: 'center' }, justifyContent: 'space-between', width: '100%', pr: 1 }}
        >
          <Typography variant="h3" component="h3">
            {curso.curso}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Promedio del curso: <NotaHistorial nota={curso.promedio} destacada />
          </Typography>
        </Stack>
      </AccordionSummary>
      <AccordionDetails id={`curso-${curso.cursoId}-contenido`}>
        {curso.materias.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            No hay calificaciones registradas en este curso.
          </Typography>
        ) : (
          <>
            {/* Tabla en computadora y en la impresión; tarjetas en el celular. */}
            <Box sx={{ display: { xs: 'none', sm: 'block' }, '@media print': { display: 'block' } }}>
              <TablaCurso curso={curso} />
            </Box>
            <Box className="no-print" sx={{ display: { xs: 'block', sm: 'none' } }}>
              <TarjetasCurso curso={curso} />
            </Box>
          </>
        )}
      </AccordionDetails>
    </Accordion>
  )
}

function PeriodoHistorial({ periodo, panelId }: { periodo: HistorialPeriodo; panelId: string }) {
  return (
    <Box role="tabpanel" id={panelId} aria-labelledby={`periodo-tab-${periodo.periodoId}`}>
      <ResumenGestion periodo={periodo} />
      <Stack spacing={1.5}>
        {periodo.cursos.map((curso, index) => (
          <CursoHistorial key={`${periodo.periodoId}-${curso.cursoId}`} curso={curso} abierto={index === 0} />
        ))}
      </Stack>
    </Box>
  )
}

function HistorialContenido({ historial, showTitle }: { historial: HistorialAcademico; showTitle: boolean }) {
  const periodos = useMemo(() => agruparPeriodos(historial), [historial])
  // Se abre la gestión más reciente (la última inscripción), que es la que el estudiante consulta más.
  const [periodoActivo, setPeriodoActivo] = useState(periodos.at(-1)?.periodoId ?? 0)
  const fechaEmision = new Intl.DateTimeFormat('es', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date())
  const periodoSeleccionado = periodos.find((periodo) => periodo.periodoId === periodoActivo) ?? periodos.at(-1)

  const botonImprimir = (
    <Button
      className="no-print"
      variant="outlined"
      startIcon={<PrintOutlined />}
      onClick={() => window.print()}
      sx={{ minHeight: 44 }}
    >
      Imprimir libreta
    </Button>
  )

  return (
    <Box className="historial-academico">
      <style>{ESTILOS_IMPRESION}</style>

      {/* Encabezado que solo aparece en la hoja impresa. */}
      <Box className="solo-print" sx={{ display: 'none', mb: 1 }}>
        <Typography sx={{ fontSize: '14pt', fontWeight: 700 }}>Libreta académica</Typography>
        <Typography sx={{ fontSize: '10pt' }}>
          {historial.estudiante.nombre} · Código {historial.estudiante.codigo} · Emitido el {fechaEmision}
        </Typography>
        <Typography sx={{ fontSize: '9pt' }}>Las notas marcadas con (!) están por debajo de 51.</Typography>
      </Box>

      {showTitle ? (
        // En la hoja impresa el título lo da el encabezado «Libreta académica».
        <Box className="no-print">
          <PageHeader title="Historial académico" modulo="historial" actions={botonImprimir} />
        </Box>
      ) : (
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1 }}>{botonImprimir}</Box>
      )}

      <Card sx={{ mb: 2 }} className="no-print">
        <CardContent>
          <Typography variant="h2" component="h2" sx={{ mb: 2 }}>
            Datos generales
          </Typography>
          <Grid component="dl" container spacing={1} sx={{ m: 0 }}>
            <Grid component="div" size={{ xs: 12, sm: 6 }}>
              <Typography component="dt" variant="body2" color="text.secondary">
                Estudiante
              </Typography>
              <Typography component="dd" sx={{ m: 0, fontWeight: 600, overflowWrap: 'anywhere' }}>
                {historial.estudiante.nombre}
              </Typography>
            </Grid>
            <Grid component="div" size={{ xs: 6, sm: 3 }}>
              <Typography component="dt" variant="body2" color="text.secondary">
                Código
              </Typography>
              <Typography component="dd" sx={{ m: 0, fontWeight: 600 }}>
                {historial.estudiante.codigo}
              </Typography>
            </Grid>
            <Grid component="div" size={{ xs: 6, sm: 3 }}>
              <Typography component="dt" variant="body2" color="text.secondary">
                Promedio de todas las gestiones
              </Typography>
              <Typography component="dd" sx={{ m: 0 }}>
                <NotaHistorial nota={historial.promedioGeneral} destacada />
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
            <Typography variant="h2" component="h2" sx={{ mb: 2 }} className="no-print">
              Libreta académica
            </Typography>
            <Box className="no-print">
              <Tabs
                value={periodoSeleccionado?.periodoId ?? false}
                onChange={(_event, value: number) => setPeriodoActivo(value)}
                variant="scrollable"
                scrollButtons="auto"
                aria-label="Gestiones"
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
                <PeriodoHistorial periodo={periodoSeleccionado} panelId={`periodo-panel-${periodoSeleccionado.periodoId}`} />
              </Box>
            )}
            {/* Impresión: todas las gestiones, de la más reciente a la más antigua. */}
            <Box className="solo-print" sx={{ display: 'none' }}>
              {[...periodos].reverse().map((periodo) => (
                <Box key={periodo.periodoId} sx={{ mb: 2 }}>
                  <Typography variant="h3" component="h3" sx={{ mb: 0.5, fontSize: '12pt' }}>
                    {periodo.periodo}
                  </Typography>
                  <ResumenGestion periodo={periodo} />
                  <Stack spacing={1}>
                    {periodo.cursos.map((curso) => (
                      <CursoHistorial key={`${periodo.periodoId}-${curso.cursoId}`} curso={curso} abierto />
                    ))}
                  </Stack>
                </Box>
              ))}
            </Box>
          </CardContent>
        </Card>
      )}
      <Typography className="no-print" variant="caption" sx={{ display: 'block', mt: 2 }}>
        {historial.estudiante.nombre} · Consultado el {fechaEmision}
      </Typography>
    </Box>
  )
}

export function HistorialAcademicoPage({ estudianteId, showTitle = true }: HistorialAcademicoPageProps) {
  const historial = useHistorialAcademico(estudianteId)
  const esForbidden = historial.error instanceof ApiError && historial.error.status === 403

  if (historial.isPending) {
    return (
      <Box sx={{ display: 'grid', minHeight: 180, placeItems: 'center' }}>
        <CircularProgress aria-label="Cargando historial" />
      </Box>
    )
  }
  if (esForbidden) {
    return (
      <Alert
        severity="error"
        role="alert"
        action={
          <Button color="inherit" size="small" onClick={() => void historial.refetch()}>
            Reintentar
          </Button>
        }
      >
        Solo puedes consultar tu propio historial académico.
      </Alert>
    )
  }

  return (
    <QueryState query={historial} skeletonHeight={420}>
      {(data) => <HistorialContenido historial={data} showTitle={showTitle} />}
    </QueryState>
  )
}
