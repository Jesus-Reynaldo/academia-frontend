import ArrowBack from '@mui/icons-material/ArrowBack'
import EditOutlined from '@mui/icons-material/EditOutlined'
import Alert from '@mui/material/Alert'
import Avatar from '@mui/material/Avatar'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Stack from '@mui/material/Stack'
import Tab from '@mui/material/Tab'
import Tabs from '@mui/material/Tabs'
import Typography from '@mui/material/Typography'
import { useMemo, useState } from 'react'
import { Link as RouterLink, useNavigate } from 'react-router'
import { ApiError } from '../../../shared/api/errors'
import { useUrlParams } from '../../../shared/hooks/useUrlParams'
import { formatFecha, iniciales } from '../../../shared/lib/format'
import { DefinitionList } from '../../../shared/ui/DefinitionList'
import { EmptyState } from '../../../shared/ui/EmptyState'
import { QueryState } from '../../../shared/ui/QueryState'
import { StatusChip } from '../../../shared/ui/StatusChip'
import { useUsuario } from '../../autenticacion'
import { useEstudiante } from '../api/useEstudiantes'
import { CalificacionesDelEstudiante } from '../components/CalificacionesDelEstudiante'
import { EliminarEstudianteDialog } from '../components/EliminarEstudianteDialog'
import { EstudianteFormDialog } from '../components/EstudianteFormDialog'
import { InscripcionesDelEstudiante } from '../components/InscripcionesDelEstudiante'
import { HistorialAcademicoPage } from '../../historial-academico'
import type { PaginaFichaParams } from '../model/types'
import { BotonCambioEstado } from '../../../shared/ui/BotonCambioEstado'
import { VolverA } from '../../../shared/ui/VolverA'

const LIMITES = [10, 20, 50]
const PESTANAS = ['datos', 'inscripciones', 'calificaciones', 'historial'] as const
type Pestana = (typeof PESTANAS)[number]

function leerPagina(searchParams: URLSearchParams): PaginaFichaParams {
  const page = Number(searchParams.get('page'))
  const limit = Number(searchParams.get('limit'))
  return {
    page: Number.isInteger(page) && page >= 1 ? page : 1,
    limit: LIMITES.includes(limit) ? limit : 20,
    // Lo más reciente primero.
    order: 'desc',
  }
}

function Migas() {
  return <VolverA to="/estudiantes" etiqueta="Estudiantes" />
}

function NoEncontrado() {
  return (
    <>
      <Migas />
      <EmptyState
        title="No encontramos este estudiante"
        description="Puede que se haya eliminado o que el enlace esté mal escrito."
        action={
          <Button component={RouterLink} to="/estudiantes" variant="contained" startIcon={<ArrowBack />}>
            Volver a Estudiantes
          </Button>
        }
      />
    </>
  )
}

/** Ficha del estudiante. La pestaña de Historial académico se agrega con la tarea DS-10. */
export function EstudianteFichaPage({ id }: { id: number }) {
  const usuario = useUsuario()
  const esAdmin = usuario.rol === 'ADMIN'

  const navigate = useNavigate()
  const [searchParams, updateParams] = useUrlParams()
  const pagina = useMemo(() => leerPagina(searchParams), [searchParams])
  const tabUrl = searchParams.get('tab')
  const tab: Pestana = PESTANAS.includes(tabUrl as Pestana) ? (tabUrl as Pestana) : 'datos'

  const query = useEstudiante(id)
  const [editando, setEditando] = useState(false)
  const [eliminando, setEliminando] = useState(false)

  if (query.isError && query.error instanceof ApiError && query.error.status === 404) return <NoEncontrado />

  return (
    <QueryState query={query} skeletonHeight={280}>
      {(estudiante) => {
        const nombre = `${estudiante.nombres} ${estudiante.apellidos}`
        return (
          <>
            <Migas />

            <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 2, mb: 2 }}>
              <Stack direction="row" spacing={2} sx={{ alignItems: 'center', minWidth: 0 }}>
                <Avatar sx={{ width: 56, height: 56, bgcolor: 'primary.main', fontSize: '1.25rem' }} aria-hidden>
                  {iniciales(nombre)}
                </Avatar>
                <Box sx={{ minWidth: 0 }}>
                  <Typography variant="h1" component="h1" sx={{ overflowWrap: 'anywhere' }}>
                    {nombre}
                  </Typography>
                  <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mt: 0.5, flexWrap: 'wrap' }}>
                    <Typography variant="body2" color="text.secondary">
                      Código {estudiante.codigo}
                    </Typography>
                    <StatusChip estado={estudiante.estado} />
                  </Stack>
                </Box>
              </Stack>
              {esAdmin && (
                <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }}>
                  <Button variant="outlined" startIcon={<EditOutlined />} onClick={() => setEditando(true)} sx={{ minHeight: 44 }}>
                    Editar
                  </Button>
                  <BotonCambioEstado
                    ruta="/estudiantes"
                    id={estudiante.id}
                    sujeto={`${estudiante.nombres} ${estudiante.apellidos}`}
                    activo={estudiante.estado === 'ACTIVO' ? true : estudiante.estado === 'INACTIVO' ? false : null}
                    alDesactivar={{ estado: 'INACTIVO' }}
                    alActivar={{ estado: 'ACTIVO' }}
                    efecto="No se podrá inscribir en cursos nuevos."
                  />
                </Stack>
              )}
            </Box>

            {estudiante.estado === 'INACTIVO' && (
              <Alert severity="info" sx={{ mb: 2 }}>
                Este estudiante está inactivo: conserva su historial, pero no se puede inscribir a nuevos cursos.
              </Alert>
            )}

            <Tabs
              value={tab}
              onChange={(_event, valor: Pestana) => updateParams({ tab: valor === 'datos' ? null : valor, page: null, limit: null })}
              variant="scrollable"
              scrollButtons={false}
              aria-label="Secciones de la ficha del estudiante"
              sx={{ mb: 2, borderBottom: 1, borderColor: 'divider' }}
            >
              <Tab label="Datos" value="datos" id="tab-datos" aria-controls="panel-datos" />
              <Tab label="Inscripciones" value="inscripciones" id="tab-inscripciones" aria-controls="panel-inscripciones" />
              <Tab label="Calificaciones" value="calificaciones" id="tab-calificaciones" aria-controls="panel-calificaciones" />
              <Tab label="Historial" value="historial" id="tab-historial" aria-controls="panel-historial" />
            </Tabs>

            <Box role="tabpanel" id={`panel-${tab}`} aria-labelledby={`tab-${tab}`}>
              {tab === 'datos' && (
                <Card>
                  <CardContent>
                    <DefinitionList
                      items={[
                        { label: 'Código', value: estudiante.codigo },
                        { label: 'Documento', value: estudiante.documento },
                        { label: 'Nombres', value: estudiante.nombres },
                        { label: 'Apellidos', value: estudiante.apellidos },
                        { label: 'Email', value: estudiante.email ?? '—' },
                        { label: 'Teléfono', value: estudiante.telefono ?? '—' },
                        { label: 'Fecha de nacimiento', value: formatFecha(estudiante.fechaNacimiento) },
                        { label: 'Estado', value: <StatusChip estado={estudiante.estado} /> },
                      ]}
                    />
                  </CardContent>
                </Card>
              )}
              {tab === 'inscripciones' && (
                <InscripcionesDelEstudiante estudianteId={estudiante.id} params={pagina} onChange={updateParams} />
              )}
              {tab === 'calificaciones' && (
                <CalificacionesDelEstudiante estudianteId={estudiante.id} params={pagina} onChange={updateParams} />
              )}
              {tab === 'historial' && (
                <HistorialAcademicoPage estudianteId={estudiante.id} showTitle={false} />
              )}
            </Box>

            {editando && <EstudianteFormDialog estudiante={estudiante} onClose={() => setEditando(false)} />}
            {eliminando && (
              <EliminarEstudianteDialog
                estudiante={estudiante}
                onClose={() => setEliminando(false)}
                onDone={(resultado) => {
                  setEliminando(false)
                  // Eliminado: ya no existe, se vuelve al listado. Desactivado: se queda y se ve "Inactivo".
                  if (resultado.tipo === 'eliminado') void navigate('/estudiantes', { replace: true })
                }}
              />
            )}
          </>
        )
      }}
    </QueryState>
  )
}
