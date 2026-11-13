import ArrowBack from '@mui/icons-material/ArrowBack'
import DeleteOutlined from '@mui/icons-material/DeleteOutlined'
import EditOutlined from '@mui/icons-material/EditOutlined'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Breadcrumbs from '@mui/material/Breadcrumbs'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import MuiLink from '@mui/material/Link'
import Stack from '@mui/material/Stack'
import Tab from '@mui/material/Tab'
import Tabs from '@mui/material/Tabs'
import Typography from '@mui/material/Typography'
import { useMemo, useState } from 'react'
import { Link as RouterLink, useNavigate } from 'react-router'
import { ApiError } from '../../../shared/api/errors'
import { useUrlParams } from '../../../shared/hooks/useUrlParams'
import { EmptyState } from '../../../shared/ui/EmptyState'
import { PageHeader } from '../../../shared/ui/PageHeader'
import { QueryState } from '../../../shared/ui/QueryState'
import { StatusChip } from '../../../shared/ui/StatusChip'
import { useUsuario } from '../../autenticacion'
import { useCurso } from '../api/useCursos'
import { CursoFormDialog } from '../components/CursoFormDialog'
import { EliminarCursoDialog } from '../components/EliminarCursoDialog'
import { EstudiantesDelCurso } from '../components/EstudiantesDelCurso'
import { MateriasDelCurso } from '../components/MateriasDelCurso'
import { OcupacionCurso } from '../components/OcupacionCurso'
import type { PaginaDetalleParams } from '../model/types'

const LIMITES = [10, 20, 50]
type Pestana = 'estudiantes' | 'materias'

function leerPagina(searchParams: URLSearchParams): PaginaDetalleParams {
  const page = Number(searchParams.get('page'))
  const limit = Number(searchParams.get('limit'))
  return {
    page: Number.isInteger(page) && page >= 1 ? page : 1,
    limit: LIMITES.includes(limit) ? limit : 20,
  }
}

function Migas({ nombre }: { nombre: string }) {
  return (
    <Breadcrumbs aria-label="Ruta de navegación" sx={{ mb: 2 }}>
      <MuiLink component={RouterLink} to="/cursos" underline="hover" color="inherit">
        Cursos
      </MuiLink>
      <Typography color="text.primary" sx={{ overflowWrap: 'anywhere' }}>
        {nombre}
      </Typography>
    </Breadcrumbs>
  )
}

function NoEncontrado() {
  return (
    <>
      <Migas nombre="No encontrado" />
      <EmptyState
        title="No encontramos este curso"
        description="Puede que se haya eliminado o que el enlace esté mal escrito."
        action={
          <Button component={RouterLink} to="/cursos" variant="contained" startIcon={<ArrowBack />}>
            Volver a Cursos
          </Button>
        }
      />
    </>
  )
}

/** Detalle de un curso: ocupación en la cabecera y pestañas de estudiantes inscritos y materias. */
export function CursoDetallePage({ id }: { id: number }) {
  const usuario = useUsuario()
  const esAdmin = usuario.rol === 'ADMIN'
  // La API solo entrega los estudiantes de un curso a ADMIN y DOCENTE.
  const puedeVerEstudiantes = usuario.rol === 'ADMIN' || usuario.rol === 'DOCENTE'

  const navigate = useNavigate()
  const [searchParams, updateParams] = useUrlParams()
  const pagina = useMemo(() => leerPagina(searchParams), [searchParams])
  const tab: Pestana = !puedeVerEstudiantes || searchParams.get('tab') === 'materias' ? 'materias' : 'estudiantes'

  const query = useCurso(id)
  const [editando, setEditando] = useState(false)
  const [eliminando, setEliminando] = useState(false)

  if (query.isError && query.error instanceof ApiError && query.error.status === 404) return <NoEncontrado />

  return (
    <QueryState query={query} skeletonHeight={280}>
      {(curso) => (
        <>
          <Migas nombre={curso.nombre} />
          <PageHeader
            title={curso.nombre}
            modulo="cursos"
            subtitle={
              <Stack direction="row" spacing={1} sx={{ alignItems: 'center', flexWrap: 'wrap' }}>
                <span>{curso.paralelo ? `${curso.nivel} · Paralelo ${curso.paralelo}` : curso.nivel}</span>
                <StatusChip estado={curso.estado} />
              </Stack>
            }
            actions={
              esAdmin && (
                <>
                  <Button
                    variant="outlined"
                    startIcon={<EditOutlined />}
                    onClick={() => setEditando(true)}
                    sx={{ minHeight: 44 }}
                  >
                    Editar
                  </Button>
                  <Button
                    variant="outlined"
                    color="error"
                    startIcon={<DeleteOutlined />}
                    onClick={() => setEliminando(true)}
                    sx={{ minHeight: 44 }}
                  >
                    Eliminar
                  </Button>
                </>
              )
            }
          />

          {curso.estado === 'INACTIVO' && (
            <Alert severity="info" sx={{ mb: 2 }}>
              Este curso está inactivo: conserva su historial.
            </Alert>
          )}

          <Card sx={{ mb: 2 }}>
            <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                Ocupación en la gestión activa
              </Typography>
              <OcupacionCurso inscritos={curso.inscritosActivos} capacidad={curso.capacidad} />
            </CardContent>
          </Card>

          <Tabs
            value={tab}
            onChange={(_event, valor: Pestana) => updateParams({ tab: valor === 'estudiantes' ? null : valor, page: null, limit: null })}
            aria-label="Secciones del curso"
            sx={{ mb: 2, borderBottom: 1, borderColor: 'divider' }}
          >
            {puedeVerEstudiantes && (
              <Tab label="Estudiantes inscritos" value="estudiantes" id="tab-estudiantes" aria-controls="panel-estudiantes" />
            )}
            <Tab label="Materias" value="materias" id="tab-materias" aria-controls="panel-materias" />
          </Tabs>

          {tab === 'estudiantes' ? (
            <Box role="tabpanel" id="panel-estudiantes" aria-labelledby="tab-estudiantes">
              <EstudiantesDelCurso cursoId={curso.id} params={pagina} onChange={updateParams} />
            </Box>
          ) : (
            <Box role="tabpanel" id="panel-materias" aria-labelledby="tab-materias">
              <MateriasDelCurso cursoId={curso.id} params={pagina} onChange={updateParams} />
            </Box>
          )}

          {editando && <CursoFormDialog curso={curso} onClose={() => setEditando(false)} />}
          {eliminando && (
            <EliminarCursoDialog
              curso={curso}
              onClose={() => setEliminando(false)}
              onDone={(resultado) => {
                setEliminando(false)
                // Eliminado: ya no existe, se vuelve al listado. Desactivado: se queda y se ve "Inactivo".
                if (resultado.tipo === 'eliminado') void navigate('/cursos', { replace: true })
              }}
            />
          )}
        </>
      )}
    </QueryState>
  )
}
