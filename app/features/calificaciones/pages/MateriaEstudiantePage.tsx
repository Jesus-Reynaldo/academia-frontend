import ArrowBack from '@mui/icons-material/ArrowBack'
import Box from '@mui/material/Box'
import Breadcrumbs from '@mui/material/Breadcrumbs'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import MuiLink from '@mui/material/Link'
import Skeleton from '@mui/material/Skeleton'
import Typography from '@mui/material/Typography'
import { Link as RouterLink, useSearchParams } from 'react-router'
import { formatFecha } from '../../../shared/lib/format'
import { DefinitionList } from '../../../shared/ui/DefinitionList'
import { EmptyState } from '../../../shared/ui/EmptyState'
import { ErrorState } from '../../../shared/ui/ErrorState'
import { GradeBadge } from '../../../shared/ui/GradeBadge'
import { PageHeader } from '../../../shared/ui/PageHeader'
import { useUsuario } from '../../autenticacion'
import { estaDebajo, useAvanceEstudiante, type HistorialMateria } from '../../historial-academico'
import { useCalificacionesList } from '../api/useCalificaciones'
import { nombreDocente } from '../model/etiquetas'
import { ETIQUETA_TIPO } from '../model/types'

function Migas({ nombre }: { nombre: string }) {
  return (
    <Breadcrumbs aria-label="Ruta de navegación" sx={{ mb: 2 }}>
      <MuiLink component={RouterLink} to="/mi/materias" underline="hover" color="inherit">
        Mis materias
      </MuiLink>
      <Typography color="text.primary">{nombre}</Typography>
    </Breadcrumbs>
  )
}

/** Detalle de una materia del estudiante: promedio, docente y cada evaluación con la observación del docente. */
export function MateriaEstudiantePage({ materiaId }: { materiaId: number | null }) {
  const usuario = useUsuario()
  const avance = useAvanceEstudiante(usuario.estudianteId)
  const [searchParams] = useSearchParams()
  const periodo = avance.periodos.find((p) => p.periodoId === Number(searchParams.get('gestion'))) ?? avance.actual
  const curso = periodo?.cursos.find((c) => c.materias.some((m) => m.materiaId === materiaId))
  const materia = curso?.materias.find((m) => m.materiaId === materiaId)

  if (avance.isPending) return <Skeleton variant="rounded" height={260} />
  if (avance.isError) return <ErrorState error={avance.error} onRetry={avance.refetch} />
  if (!periodo || !materia || !curso) {
    // Una materia que el estudiante no cursa (o un enlace mal escrito) no muestra datos de nadie.
    return (
      <>
        <Migas nombre="No encontrada" />
        <PageHeader title="Materia no encontrada" />
        <EmptyState
          title="No encontramos esta materia en tus calificaciones"
          description="Puede que no la cursaras en esta gestión o que el enlace esté mal escrito."
          action={
            <Button component={RouterLink} to="/mi/materias" variant="contained" startIcon={<ArrowBack />}>
              Volver a Mis materias
            </Button>
          }
        />
      </>
    )
  }

  const debajo = estaDebajo(materia.promedio)
  return (
    <>
      <Migas nombre={materia.materia} />
      <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 2, mb: 2 }}>
        <Box>
          <Typography variant="h1" component="h1" sx={{ overflowWrap: 'anywhere' }}>
            {materia.materia}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {curso.curso} · {periodo.periodo}
          </Typography>
        </Box>
        <Box sx={{ textAlign: 'right' }}>
          <Typography variant="body2" color="text.secondary">
            Promedio
          </Typography>
          <GradeBadge nota={materia.promedio} />
          <Typography variant="body2" sx={{ fontWeight: 600, color: debajo ? 'error.main' : 'success.main' }}>
            {debajo ? 'Por debajo de 51' : 'Aprobando'}
          </Typography>
        </Box>
      </Box>
      <Evaluaciones materia={materia} periodoId={periodo.periodoId} />
    </>
  )
}

/** Se monta solo cuando la materia existe, así la consulta siempre lleva un id válido. */
function Evaluaciones({ materia, periodoId }: { materia: HistorialMateria; periodoId: number }) {
  const notas = useCalificacionesList({
    page: 1,
    limit: 100,
    sortBy: 'fecha',
    order: 'asc',
    materiaId: materia.materiaId,
    periodoAcademicoId: periodoId,
  })
  const evaluaciones = notas.data?.data ?? []
  const docente = evaluaciones.findLast((c) => c.docente)?.docente ?? null

  return (
    <>
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <DefinitionList
            items={[
              { label: 'Docente', value: notas.isPending ? '…' : docente ? nombreDocente(docente) : '—' },
              { label: 'Evaluaciones registradas', value: String(materia.calificaciones.length) },
            ]}
          />
        </CardContent>
      </Card>

      <Typography variant="h2" component="h2" sx={{ fontSize: '1.125rem', mb: 1 }}>
        Mis evaluaciones
      </Typography>
      {notas.isPending ? (
        <Skeleton variant="rounded" height={200} />
      ) : notas.isError ? (
        <ErrorState error={notas.error} onRetry={() => void notas.refetch()} />
      ) : evaluaciones.length === 0 ? (
        <EmptyState title="Aún no hay evaluaciones" description="Aparecerán cuando tu docente registre notas." />
      ) : (
        <Box component="ol" sx={{ listStyle: 'none', m: 0, p: 0, display: 'grid', gap: 1 }}>
          {evaluaciones.map((c) => (
            <Card component="li" key={c.id} variant="outlined">
              <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1 }}>
                  <Box>
                    <Typography sx={{ fontWeight: 600 }}>{ETIQUETA_TIPO[c.tipo] ?? c.tipo}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {formatFecha(c.fecha)}
                    </Typography>
                  </Box>
                  <GradeBadge nota={c.nota} />
                </Box>
                <Typography
                  variant="body2"
                  sx={{ mt: 0.75, fontStyle: c.observacion ? 'normal' : 'italic' }}
                  color={c.observacion ? 'text.primary' : 'text.secondary'}
                >
                  {c.observacion ? `Observación del docente: ${c.observacion}` : 'Sin observaciones'}
                </Typography>
              </CardContent>
            </Card>
          ))}
        </Box>
      )}
    </>
  )
}
