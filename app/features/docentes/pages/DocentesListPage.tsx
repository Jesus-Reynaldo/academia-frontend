import Add from '@mui/icons-material/Add'
import Search from '@mui/icons-material/Search'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Chip from '@mui/material/Chip'
import InputAdornment from '@mui/material/InputAdornment'
import Link from '@mui/material/Link'
import MenuItem from '@mui/material/MenuItem'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import { useEffect, useMemo, useState } from 'react'
import { Link as RouterLink } from 'react-router'
import type { Paginated } from '../../../shared/api/pagination'
import { useDebounce } from '../../../shared/hooks/useDebounce'
import { useUrlParams } from '../../../shared/hooks/useUrlParams'
import { DataTable, type DataTableColumn } from '../../../shared/ui/DataTable'
import { EmptyState } from '../../../shared/ui/EmptyState'
import { PageHeader } from '../../../shared/ui/PageHeader'
import { QueryState } from '../../../shared/ui/QueryState'
import { StatusChip } from '../../../shared/ui/StatusChip'
import { useDocentesList } from '../api/useDocentes'
import { DocenteFormDialog } from '../components/DocenteFormDialog'
import { DocenteRowMenu } from '../components/DocenteRowMenu'
import { EliminarDocenteDialog } from '../components/EliminarDocenteDialog'
import {
  CAMPOS_ORDENABLES,
  ESTADOS_DOCENTE,
  ETIQUETA_ESTADO_DOCENTE,
  type CampoOrdenable,
  type Docente,
  type DocenteListParams,
  type EstadoDocente,
} from '../model/types'

const LIMITES = [10, 20, 50]

/** Lee y valida los parámetros de la URL: un valor inválido (enlace editado a mano) cae al valor por defecto. */
function leerParametros(searchParams: URLSearchParams): DocenteListParams {
  const page = Number(searchParams.get('page'))
  const limit = Number(searchParams.get('limit'))
  const sortBy = searchParams.get('sortBy')
  const order = searchParams.get('order')
  const estado = searchParams.get('estado')
  const nombre = searchParams.get('nombre')?.trim()

  return {
    page: Number.isInteger(page) && page >= 1 ? page : 1,
    limit: LIMITES.includes(limit) ? limit : 20,
    // Sin orden en la URL: por apellido, de la A a la Z.
    sortBy: CAMPOS_ORDENABLES.includes(sortBy as CampoOrdenable) ? (sortBy as CampoOrdenable) : 'apellidos',
    order: order === 'desc' ? 'desc' : 'asc',
    estado: ESTADOS_DOCENTE.includes(estado as EstadoDocente) ? (estado as EstadoDocente) : undefined,
    nombre: nombre ? nombre : undefined,
  }
}

const COLUMNAS: DataTableColumn<Docente>[] = [
  { id: 'codigo', header: 'Código', sortField: 'codigo', render: (d) => d.codigo },
  {
    id: 'nombre',
    header: 'Nombre completo',
    sortField: 'apellidos',
    primary: true,
    // El nombre es un enlace a la ficha (docs/UI-UX-PLAN.md, 6.2).
    render: (d) => (
      <Link component={RouterLink} to={`/docentes/${d.id}`} underline="hover" sx={{ fontWeight: 600 }}>
        {`${d.apellidos}, ${d.nombres}`}
      </Link>
    ),
  },
  { id: 'email', header: 'Email', render: (d) => d.email ?? '—' },
  { id: 'telefono', header: 'Teléfono', render: (d) => d.telefono ?? '—' },
  { id: 'estado', header: 'Estado', sortField: 'estado', render: (d) => <StatusChip estado={d.estado} /> },
]

export function DocentesListPage() {
  const [searchParams, updateParams] = useUrlParams()
  const params = useMemo(() => leerParametros(searchParams), [searchParams])
  const query = useDocentesList(params)

  // `formulario`: null = cerrado; { docente: null } = alta; { docente } = edición.
  const [formulario, setFormulario] = useState<{ docente: Docente | null } | null>(null)
  const [aEliminar, setAEliminar] = useState<Docente | null>(null)

  // Búsqueda: el texto se escribe al instante, pero se envía al servidor 300 ms después de dejar de escribir.
  const [busqueda, setBusqueda] = useState(params.nombre ?? '')
  const busquedaDebounced = useDebounce(busqueda, 300)
  useEffect(() => {
    if ((busquedaDebounced.trim() || undefined) !== params.nombre) {
      updateParams({ nombre: busquedaDebounced.trim() || null })
    }
  }, [busquedaDebounced, params.nombre, updateParams])

  const hayFiltros = params.estado !== undefined || params.nombre !== undefined
  const limpiarFiltros = () => {
    setBusqueda('')
    updateParams({ estado: null, nombre: null })
  }
  const total = query.data?.meta.total

  // Si se borró la única fila de la última página, retrocede una página en lugar de mostrar una vacía.
  const filasEnPagina = query.data?.data.length ?? 0
  const despuesDeEliminar = () => {
    if (filasEnPagina === 1 && params.page > 1) updateParams({ page: params.page - 1 })
  }

  const vacio = hayFiltros ? (
    <EmptyState
      title="No hay docentes con estos filtros"
      description="Prueba con otro nombre o estado, o quita los filtros."
      action={<Button onClick={limpiarFiltros}>Limpiar filtros</Button>}
    />
  ) : (
    <EmptyState
      title="Aún no hay docentes"
      description="Registra el primero para poder asignarle calificaciones."
      action={
        <Button variant="contained" startIcon={<Add />} onClick={() => setFormulario({ docente: null })}>
          Crear el primero
        </Button>
      }
    />
  )

  return (
    <>
      <PageHeader
        title="Docentes"
        modulo="docentes"
        subtitle={
          // role="status": el lector de pantalla anuncia el nuevo total al filtrar.
          <span role="status">
            {total === undefined ? 'Cargando…' : `${total} ${total === 1 ? 'docente' : 'docentes'}`}
          </span>
        }
        actions={
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setFormulario({ docente: null })}
            sx={{ minHeight: 44 }}
          >
            Nuevo docente
          </Button>
        }
      />

      <Card sx={{ mb: 2 }}>
        <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ alignItems: { sm: 'center' } }}>
            <TextField
              label="Buscar por nombre"
              value={busqueda}
              onChange={(event) => setBusqueda(event.target.value)}
              sx={{ minWidth: { sm: 280 } }}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search />
                    </InputAdornment>
                  ),
                },
              }}
            />
            <TextField
              select
              label="Estado"
              value={params.estado ?? ''}
              onChange={(event) => updateParams({ estado: event.target.value })}
              sx={{ minWidth: { sm: 200 } }}
              slotProps={{
                select: { displayEmpty: true },
                inputLabel: { shrink: true },
              }}
            >
              <MenuItem value="">Todos</MenuItem>
              {ESTADOS_DOCENTE.map((valor) => (
                <MenuItem key={valor} value={valor}>
                  {ETIQUETA_ESTADO_DOCENTE[valor]}
                </MenuItem>
              ))}
            </TextField>
            {params.estado && (
              <Chip
                label={`Estado: ${ETIQUETA_ESTADO_DOCENTE[params.estado]}`}
                onDelete={() => updateParams({ estado: null })}
                sx={{ alignSelf: { xs: 'flex-start', sm: 'center' } }}
              />
            )}
            {hayFiltros && (
              <Button onClick={limpiarFiltros} sx={{ alignSelf: { xs: 'flex-start', sm: 'center' }, minHeight: 44 }}>
                Limpiar filtros
              </Button>
            )}
          </Stack>
        </CardContent>
      </Card>

      <QueryState query={query} skeletonHeight={280}>
        {(data) => (
          <Resultados
            data={data}
            params={params}
            fetching={query.isFetching}
            vacio={vacio}
            onChange={updateParams}
            onEdit={(docente) => setFormulario({ docente })}
            onDelete={setAEliminar}
          />
        )}
      </QueryState>

      {formulario && <DocenteFormDialog docente={formulario.docente} onClose={() => setFormulario(null)} />}

      <EliminarDocenteDialog docente={aEliminar} onClose={() => setAEliminar(null)} onDone={despuesDeEliminar} />
    </>
  )
}

interface ResultadosProps {
  data: Paginated<Docente>
  params: DocenteListParams
  fetching: boolean
  vacio: React.ReactNode
  onChange: (changes: Record<string, string | number | null>) => void
  onEdit: (docente: Docente) => void
  onDelete: (docente: Docente) => void
}

function Resultados({ data, params, fetching, vacio, onChange, onEdit, onDelete }: ResultadosProps) {
  const { meta } = data

  // Un enlace con una página que ya no existe devolvería filas vacías con total > 0:
  // se lleva al usuario a la última página real en vez de mostrar "no hay datos".
  const paginaFueraDeRango = data.data.length === 0 && meta.total > 0 && meta.totalPages > 0
  useEffect(() => {
    if (paginaFueraDeRango) onChange({ page: meta.totalPages })
  }, [paginaFueraDeRango, meta.totalPages, onChange])

  return (
    <DataTable
      caption="Docentes"
      columns={COLUMNAS}
      rows={data.data}
      getRowId={(docente) => docente.id}
      rowActions={(docente) => <DocenteRowMenu docente={docente} onEdit={onEdit} onDelete={onDelete} />}
      sort={{ sortBy: params.sortBy, order: params.order }}
      onSortChange={(sortBy, order) => onChange({ sortBy, order })}
      pagination={{
        page: meta.page,
        limit: meta.limit,
        total: meta.total,
        limitOptions: LIMITES,
        onPageChange: (page) => onChange({ page: page === 1 ? null : page }),
        onLimitChange: (limit) => onChange({ limit }),
      }}
      fetching={fetching}
      emptyState={paginaFueraDeRango ? null : vacio}
    />
  )
}
