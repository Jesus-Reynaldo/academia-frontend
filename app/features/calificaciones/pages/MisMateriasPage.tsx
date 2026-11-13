import ChevronRight from '@mui/icons-material/ChevronRight'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardActionArea from '@mui/material/CardActionArea'
import CardContent from '@mui/material/CardContent'
import MenuItem from '@mui/material/MenuItem'
import Skeleton from '@mui/material/Skeleton'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { useMemo } from 'react'
import { Link as RouterLink, useSearchParams } from 'react-router'
import { formatNota } from '../../../shared/lib/format'
import { EmptyState } from '../../../shared/ui/EmptyState'
import { ErrorState } from '../../../shared/ui/ErrorState'
import { GradeBadge } from '../../../shared/ui/GradeBadge'
import { PageHeader } from '../../../shared/ui/PageHeader'
import { useUsuario } from '../../autenticacion'
import { desglosar, estaDebajo, resumenPeriodo, useAvanceEstudiante } from '../../historial-academico'
import { useCalificacionesList } from '../api/useCalificaciones'
import { nombreDocente } from '../model/etiquetas'

/** Mis materias: una tarjeta por materia de la gestión elegida (por defecto, la actual); las que están bajo 51 primero. */
export function MisMateriasPage() {
  const usuario = useUsuario()
  const avance = useAvanceEstudiante(usuario.estudianteId)
  const [searchParams, setSearchParams] = useSearchParams()

  const gestionUrl = Number(searchParams.get('gestion'))
  const periodo = avance.periodos.find((p) => p.periodoId === gestionUrl) ?? avance.actual

  // Docente de cada materia: sale de las calificaciones de la gestión (la API ya limita al propio estudiante).
  const notas = useCalificacionesList({
    page: 1,
    limit: 100,
    sortBy: 'fecha',
    order: 'desc',
    periodoAcademicoId: periodo?.periodoId,
  })
  const docentePorMateria = useMemo(() => {
    const mapa = new Map<number, string>()
    for (const c of notas.data?.data ?? []) if (c.docente && !mapa.has(c.materiaId)) mapa.set(c.materiaId, nombreDocente(c.docente))
    return mapa
  }, [notas.data])

  const materias = useMemo(() => {
    const lista = periodo?.cursos.flatMap((curso) => curso.materias) ?? []
    return [...lista].sort(
      (a, b) => Number(estaDebajo(b.promedio)) - Number(estaDebajo(a.promedio)) || a.materia.localeCompare(b.materia, 'es'),
    )
  }, [periodo])

  const resumen = periodo ? resumenPeriodo(periodo) : null
  const sufijo = periodo ? `?gestion=${periodo.periodoId}` : ''

  return (
    <>
      <PageHeader
        title="Mis materias"
        modulo="materias"
        subtitle={periodo ? `${periodo.cursos.map((c) => c.curso).join(' · ')} · ${periodo.periodo}` : undefined}
        actions={
          <Button component={RouterLink} to="/mi/calificaciones" variant="outlined" sx={{ minHeight: 44 }}>
            Ver todas mis notas
          </Button>
        }
      />

      {avance.isPending ? (
        <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', lg: '1fr 1fr 1fr' } }}>
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} variant="rounded" height={150} />
          ))}
        </Box>
      ) : avance.isError ? (
        <ErrorState error={avance.error} onRetry={avance.refetch} />
      ) : !periodo ? (
        <EmptyState
          title="Todavía no tienes materias"
          description="Cuando estés inscrito en un curso y tus docentes registren notas, tus materias aparecerán aquí."
        />
      ) : (
        <>
          {avance.periodos.length > 1 && (
            <TextField
              select
              label="Gestión"
              value={periodo.periodoId}
              onChange={(e) => setSearchParams({ gestion: e.target.value })}
              sx={{ mb: 2, minWidth: 220 }}
            >
              {[...avance.periodos].reverse().map((p) => (
                <MenuItem key={p.periodoId} value={p.periodoId}>
                  {p.periodo}
                  {p.periodoId === avance.periodoActivoId ? ' (en curso)' : ''}
                </MenuItem>
              ))}
            </TextField>
          )}

          {resumen && resumen.materias > 0 && (
            <Alert severity={resumen.debajo.length ? 'warning' : 'success'} sx={{ mb: 2 }}>
              {resumen.debajo.length
                ? `${resumen.debajo.length} ${resumen.debajo.length === 1 ? 'materia está' : 'materias están'} por debajo de 51. Aparecen primero.`
                : `Vas aprobando tus ${resumen.materias} materias.`}
            </Alert>
          )}

          {materias.length === 0 ? (
            <EmptyState title="Aún no hay notas en esta gestión" description="Las materias aparecerán cuando tus docentes registren evaluaciones." />
          ) : (
            <Box
              component="ul"
              sx={{ listStyle: 'none', m: 0, p: 0, display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', lg: '1fr 1fr 1fr' } }}
            >
              {materias.map((materia) => {
                const d = desglosar(materia)
                const debajo = estaDebajo(materia.promedio)
                const docente = docentePorMateria.get(materia.materiaId)
                return (
                  <Box component="li" key={materia.materiaId}>
                    <Card sx={{ height: '100%', borderLeft: 4, borderLeftColor: debajo ? 'error.main' : 'success.main' }}>
                      <CardActionArea component={RouterLink} to={`/mi/materias/${materia.materiaId}${sufijo}`} sx={{ height: '100%' }}>
                        <CardContent>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 1 }}>
                            <Typography component="h2" variant="h3" sx={{ fontSize: '1.0625rem', overflowWrap: 'anywhere' }}>
                              {materia.materia}
                            </Typography>
                            <GradeBadge nota={materia.promedio} />
                          </Box>
                          <Typography variant="body2" color={debajo ? 'error.main' : 'success.main'} sx={{ fontWeight: 600, mt: 0.5 }}>
                            {debajo ? 'Por debajo de 51' : 'Aprobando'}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                            Trimestres: {d.parciales.map((n) => (n === null ? '—' : formatNota(n))).join(' · ')}
                          </Typography>
                          {docente && (
                            <Typography variant="body2" color="text.secondary">
                              Docente: {docente}
                            </Typography>
                          )}
                          <Box sx={{ display: 'flex', alignItems: 'center', color: 'primary.main', mt: 1 }}>
                            <Typography variant="body2" sx={{ fontWeight: 600, color: 'inherit' }}>
                              Ver detalle
                            </Typography>
                            <ChevronRight fontSize="small" aria-hidden />
                          </Box>
                        </CardContent>
                      </CardActionArea>
                    </Card>
                  </Box>
                )
              })}
            </Box>
          )}
        </>
      )}
    </>
  )
}
