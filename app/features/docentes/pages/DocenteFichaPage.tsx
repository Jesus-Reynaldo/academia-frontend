import ArrowBack from '@mui/icons-material/ArrowBack'
import DeleteOutlined from '@mui/icons-material/DeleteOutlined'
import EditOutlined from '@mui/icons-material/EditOutlined'
import Avatar from '@mui/material/Avatar'
import Box from '@mui/material/Box'
import Breadcrumbs from '@mui/material/Breadcrumbs'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Link from '@mui/material/Link'
import Skeleton from '@mui/material/Skeleton'
import Stack from '@mui/material/Stack'
import Tab from '@mui/material/Tab'
import Tabs from '@mui/material/Tabs'
import Typography from '@mui/material/Typography'
import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { Link as RouterLink, useNavigate } from 'react-router'
import { ApiError } from '../../../shared/api/errors'
import { useUrlParams } from '../../../shared/hooks/useUrlParams'
import { formatFecha, iniciales } from '../../../shared/lib/format'
import { DataTable, type DataTableColumn } from '../../../shared/ui/DataTable'
import { EmptyState } from '../../../shared/ui/EmptyState'
import { ErrorState } from '../../../shared/ui/ErrorState'
import { GradeBadge } from '../../../shared/ui/GradeBadge'
import { QueryState } from '../../../shared/ui/QueryState'
import { StatusChip } from '../../../shared/ui/StatusChip'
import { useDocente, useDocenteCalificaciones } from '../api/useDocentes'
import { DocenteFormDialog } from '../components/DocenteFormDialog'
import { EliminarDocenteDialog } from '../components/EliminarDocenteDialog'
import {
  ETIQUETA_TIPO_EVALUACION,
  type CalificacionDocente,
  type CalificacionesDocenteParams,
  type Docente,
} from '../model/types'

const LIMITES = [10, 20, 50]
type Pestana = 'resumen' | 'calificaciones'

/** Pestaña y paginación viven en la URL (?tab=calificaciones&page=2): recargar o compartir conserva la vista. */
function leerParametros(searchParams: URLSearchParams): { tab: Pestana; calificaciones: CalificacionesDocenteParams } {
  const page = Number(searchParams.get('page'))
  const limit = Number(searchParams.get('limit'))
  return {
    tab: searchParams.get('tab') === 'calificaciones' ? 'calificaciones' : 'resumen',
    calificaciones: {
      page: Number.isInteger(page) && page >= 1 ? page : 1,
      limit: LIMITES.includes(limit) ? limit : 10,
      // Las más recientes primero (el backend ordena por id).
      order: searchParams.get('order') === 'asc' ? 'asc' : 'desc',
    },
  }
}

export function DocenteFichaPage({ id }: { id: number }) {
  const navigate = useNavigate()
  const [searchParams, updateParams] = useUrlParams()
  const params = useMemo(() => leerParametros(searchParams), [searchParams])
  const query = useDocente(id)
  const [editando, setEditando] = useState(false)
  const [aEliminar, setAEliminar] = useState<Docente | null>(null)

  // Estado "no encontrado": id inexistente o borrado.
  if (query.isError && query.error instanceof ApiError && query.error.status === 404) {
    return (
      <>
        <Migas nombre="No encontrado" />
        <EmptyState
          title="No encontramos este docente"
          description="Puede que se haya eliminado o que el enlace esté mal escrito."
          action={
            <Button component={RouterLink} to="/docentes" variant="contained" startIcon={<ArrowBack />}>
              Volver a Docentes
            </Button>
          }
        />
      </>
    )
  }

  // Estado "error" (sin conexión, error del servidor…) con botón Reintentar.
  if (query.isError) {
    return (
      <>
        <Migas nombre="Docente" />
        <ErrorState error={query.error} onRetry={() => void query.refetch()} />
      </>
    )
  }

  // Estado "cargando": esqueleto con la forma de la cabecera y del contenido.
  if (query.isPending) {
    return (
      <Stack spacing={2} aria-busy="true" aria-label="Cargando docente">
        <Skeleton variant="text" width={200} />
        <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
          <Skeleton variant="circular" width={56} height={56} />
          <Box sx={{ flex: 1 }}>
            <Skeleton variant="text" width="60%" height={36} />
            <Skeleton variant="text" width="30%" />
          </Box>
        </Stack>
        <Skeleton variant="rounded" height={220} />
      </Stack>
    )
  }

  const docente = query.data
  const nombre = `${docente.nombres} ${docente.apellidos}`

  return (
    <>
      <Migas nombre={nombre} />

      {/* Cabecera: avatar con iniciales, nombre, código, estado y acciones. */}
      <Box
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 2,
          mb: 2,
        }}
      >
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
                Código {docente.codigo}
              </Typography>
              <StatusChip estado={docente.estado} />
            </Stack>
          </Box>
        </Stack>
        <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }}>
          <Button variant="outlined" startIcon={<EditOutlined />} onClick={() => setEditando(true)} sx={{ minHeight: 44 }}>
            Editar
          </Button>
          <Button
            variant="outlined"
            color="error"
            startIcon={<DeleteOutlined />}
            onClick={() => setAEliminar(docente)}
            sx={{ minHeight: 44 }}
          >
            Eliminar
          </Button>
        </Stack>
      </Box>

      <Tabs
        value={params.tab}
        onChange={(_e, tab: Pestana) => updateParams({ tab: tab === 'resumen' ? null : tab, page: null, limit: null })}
        aria-label="Secciones de la ficha del docente"
        sx={{ mb: 2, borderBottom: 1, borderColor: 'divider' }}
      >
        <Tab label="Resumen" value="resumen" id="tab-resumen" aria-controls="panel-resumen" />
        <Tab label="Calificaciones" value="calificaciones" id="tab-calificaciones" aria-controls="panel-calificaciones" />
      </Tabs>

      {params.tab === 'resumen' ? (
        <Box role="tabpanel" id="panel-resumen" aria-labelledby="tab-resumen">
          <Resumen docente={docente} onVerCalificaciones={() => updateParams({ tab: 'calificaciones' })} />
        </Box>
      ) : (
        <Box role="tabpanel" id="panel-calificaciones" aria-labelledby="tab-calificaciones">
          <Calificaciones docenteId={docente.id} params={params.calificaciones} onChange={updateParams} />
        </Box>
      )}

      {editando && <DocenteFormDialog docente={docente} onClose={() => setEditando(false)} />}

      <EliminarDocenteDialog
        docente={aEliminar}
        onClose={() => setAEliminar(null)}
        // Eliminado: ya no existe, se vuelve al listado. Desactivado: se queda en la ficha (el estado se actualiza solo).
        onDone={(resultado) => {
          if (resultado.tipo === 'eliminado') void navigate('/docentes')
        }}
      />
    </>
  )
}

/** Migas de pan: Docentes › nombre (docs/UI-UX-PLAN.md, 6.1). */
function Migas({ nombre }: { nombre: string }) {
  return (
    <Breadcrumbs aria-label="Ruta de navegación" sx={{ mb: 2 }}>
      <Link component={RouterLink} to="/docentes" underline="hover" color="inherit">
        Docentes
      </Link>
      <Typography color="text.primary" sx={{ overflowWrap: 'anywhere' }}>
        {nombre}
      </Typography>
    </Breadcrumbs>
  )
}

function Dato({ etiqueta, children }: { etiqueta: string; children: ReactNode }) {
  return (
    <Box>
      <Typography component="dt" variant="body2" color="text.secondary">
        {etiqueta}
      </Typography>
      <Typography component="dd" sx={{ m: 0, overflowWrap: 'anywhere' }}>
        {children}
      </Typography>
    </Box>
  )
}

function Resumen({ docente, onVerCalificaciones }: { docente: Docente; onVerCalificaciones: () => void }) {
  // Solo para el total y la última fecha: se pide una única fila.
  const ultima = useDocenteCalificaciones(docente.id, { page: 1, limit: 1, order: 'desc' }, true)

  return (
    <Card>
      <CardContent>
        <Box
          component="dl"
          sx={{
            m: 0,
            display: 'grid',
            gap: 2.5,
            gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr' },
          }}
        >
          <Dato etiqueta="Código">{docente.codigo}</Dato>
          <Dato etiqueta="Nombres">{docente.nombres}</Dato>
          <Dato etiqueta="Apellidos">{docente.apellidos}</Dato>
          <Dato etiqueta="Email">
            {docente.email ? (
              <Link href={`mailto:${docente.email}`} underline="hover">
                {docente.email}
              </Link>
            ) : (
              '—'
            )}
          </Dato>
          <Dato etiqueta="Teléfono">{docente.telefono ?? '—'}</Dato>
          <Dato etiqueta="Estado">
            <StatusChip estado={docente.estado} />
          </Dato>
          <Dato etiqueta="Calificaciones registradas">
            {ultima.isPending ? (
              <Skeleton variant="text" width={60} />
            ) : ultima.isError ? (
              'No disponible'
            ) : (
              <>
                {ultima.data.meta.total}
                {ultima.data.meta.total > 0 && (
                  <>
                    {' · '}
                    <Link component="button" type="button" onClick={onVerCalificaciones} underline="hover">
                      Ver calificaciones
                    </Link>
                  </>
                )}
              </>
            )}
          </Dato>
          <Dato etiqueta="Última calificación">
            {ultima.isPending ? (
              <Skeleton variant="text" width={90} />
            ) : ultima.isError ? (
              'No disponible'
            ) : (
              formatFecha(ultima.data.data[0]?.fecha)
            )}
          </Dato>
          <Dato etiqueta="Registrado el">{formatFecha(docente.createdAt)}</Dato>
        </Box>
      </CardContent>
    </Card>
  )
}

/** "1ro Secundaria" + paralelo "A" → "1ro Secundaria A"; si el nombre ya trae el paralelo, no lo repite. */
function nombreCurso(curso: { nombre: string; paralelo: string | null }): string {
  const { nombre, paralelo } = curso
  if (!paralelo || nombre.trim().endsWith(` ${paralelo}`)) return nombre
  return `${nombre} ${paralelo}`
}

const COLUMNAS_CALIFICACIONES: DataTableColumn<CalificacionDocente>[] = [
  {
    id: 'estudiante',
    header: 'Estudiante',
    primary: true,
    render: (c) => `${c.inscripcion.estudiante.apellidos}, ${c.inscripcion.estudiante.nombres}`,
  },
  { id: 'materia', header: 'Materia', render: (c) => c.materia.nombre },
  {
    id: 'curso',
    header: 'Curso',
    render: (c) => nombreCurso(c.inscripcion.curso),
  },
  { id: 'tipo', header: 'Tipo', render: (c) => ETIQUETA_TIPO_EVALUACION[c.tipo] ?? c.tipo },
  { id: 'fecha', header: 'Fecha', render: (c) => formatFecha(c.fecha) },
  { id: 'nota', header: 'Nota', align: 'right', render: (c) => <GradeBadge nota={c.nota} /> },
]

interface CalificacionesProps {
  docenteId: number
  params: CalificacionesDocenteParams
  onChange: (changes: Record<string, string | number | null>) => void
}

/** Pestaña de calificaciones: paginada en el servidor, con sus propios estados cargando/error/vacío. */
function Calificaciones({ docenteId, params, onChange }: CalificacionesProps) {
  const query = useDocenteCalificaciones(docenteId, params, true)

  // Página fuera de rango (enlace viejo): ir a la última página real.
  const meta = query.data?.meta
  const fueraDeRango = meta !== undefined && query.data?.data.length === 0 && meta.total > 0 && meta.totalPages > 0
  useEffect(() => {
    if (fueraDeRango && meta) onChange({ page: meta.totalPages })
  }, [fueraDeRango, meta, onChange])

  return (
    <QueryState query={query} skeletonHeight={240}>
      {(data) => (
        <DataTable
          caption="Calificaciones registradas por el docente"
          columns={COLUMNAS_CALIFICACIONES}
          rows={data.data}
          getRowId={(c) => c.id}
          // El backend solo ordena estas calificaciones por id: no hay columnas ordenables.
          sort={{ sortBy: 'id', order: params.order }}
          onSortChange={() => {}}
          pagination={{
            page: data.meta.page,
            limit: data.meta.limit,
            total: data.meta.total,
            limitOptions: LIMITES,
            onPageChange: (page) => onChange({ page: page === 1 ? null : page }),
            onLimitChange: (limit) => onChange({ limit }),
          }}
          fetching={query.isFetching}
          emptyState={
            fueraDeRango ? null : (
              <EmptyState
                title="Este docente aún no registró calificaciones"
                description="Cuando registre notas, aparecerán aquí."
              />
            )
          }
        />
      )}
    </QueryState>
  )
}
